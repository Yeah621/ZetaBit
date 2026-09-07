//! Fase 3, langkah 5: WebSocket nempel ke room tertentu.
//!
//! `/ws/{code}` sekarang beneran masuk ke "saluran" broadcast milik
//! room itu (satu HashMap: kode room -> broadcast channel). Semua
//! koneksi yang connect ke room yang sama saling dengar - kirim dari
//! satu koneksi, semua koneksi lain di room itu (termasuk diri sendiri)
//! ikut nerima. Ini pola resmi dari contoh chat-nya axum sendiri,
//! disesuaikan supaya ada BANYAK room, bukan cuma satu saluran global.
//!
//! Port dibaca dari env var `PORT` (Railway yang nentuin nilainya pas
//! di-deploy), fallback ke 8080 kalau gak ada (buat lokal, `cargo run`
//! biasa - gak ada yang berubah dari cara testing sebelumnya).
//!
//! Masih raw text broadcast, belum ada bentuk pesan game (fen/move/dst)
//! - itu langkah setelah ini, sekarang fokusnya cuma mastiin "dua
//! koneksi ke room yang sama bisa saling dengar" dulu.

use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    http::StatusCode,
    response::{IntoResponse, Response},
    routing::{any, get, post},
    Json, Router,
};
use futures_util::{SinkExt, StreamExt};
use serde::Serialize;
use sqlx::postgres::{PgPool, PgPoolOptions};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;

/// Kode room -> saluran broadcast room itu. Dibikin on-demand pas
/// koneksi pertama masuk ke suatu room (lihat `handle_socket`).
type RoomChannels = Arc<Mutex<HashMap<String, broadcast::Sender<String>>>>;

#[derive(Clone)]
struct AppState {
    db: PgPool,
    rooms: RoomChannels,
}

#[derive(Serialize, sqlx::FromRow)]
struct RoomResponse {
    id: String,
    code: String,
    fen: String,
    status: String,
}

/// Bungkus error DB jadi response 500 yang rapi, dan biar bisa dipakai
/// dengan `?` langsung di handler (lewat `From<sqlx::Error>`).
struct AppError(sqlx::Error);

impl IntoResponse for AppError {
    fn into_response(self) -> Response {
        tracing::error!("db error: {}", self.0);
        (StatusCode::INTERNAL_SERVER_ERROR, "internal error").into_response()
    }
}

impl From<sqlx::Error> for AppError {
    fn from(err: sqlx::Error) -> Self {
        AppError(err)
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    // .env cuma buat lokal - di hosting production nanti (Railway/Fly/dsb)
    // env var-nya diisi lewat dashboard mereka, bukan file .env.
    dotenvy::dotenv().ok();

    let database_url = std::env::var("DATABASE_URL")
        .expect("DATABASE_URL belum di-set - isi file .env, contoh formatnya ada di .env.example");

    let db = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("gagal connect ke Postgres - cek lagi DATABASE_URL di .env, atau proyek Neon-nya masih hidup gak");

    tracing::info!("berhasil connect ke Postgres");

    sqlx::migrate!()
        .run(&db)
        .await
        .expect("gagal jalanin migration - cek pesan error di atas, biasanya nunjukin baris SQL yang bermasalah");

    tracing::info!("migration selesai");

    let state = AppState {
        db,
        rooms: Arc::new(Mutex::new(HashMap::new())),
    };

    let app = Router::new()
        .route("/health", get(health))
        .route("/ws/{code}", any(ws_handler))
        .route("/rooms", post(create_room))
        .route("/rooms/{code}", get(get_room))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let port: u16 = std::env::var("PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(8080);

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .expect("gagal bind ke port - port-nya lagi dipakai proses lain?");

    tracing::info!("listening on {}", listener.local_addr().unwrap());
    axum::serve(listener, app).await.unwrap();
}

/// "ok" (+ jumlah room saat ini) kalau server DAN Postgres dua-duanya
/// hidup dan tabel `rooms` bisa di-query, error 500 kalau enggak.
async fn health(State(state): State<AppState>) -> Response {
    match sqlx::query_scalar::<_, i64>("SELECT count(*) FROM rooms")
        .fetch_one(&state.db)
        .await
    {
        Ok(count) => format!("ok ({count} rooms)").into_response(),
        Err(err) => {
            tracing::error!("health check DB gagal: {err}");
            (StatusCode::INTERNAL_SERVER_ERROR, "db unreachable").into_response()
        }
    }
}

/// Bikin room baru, kode 6 karakter dibikin sama Postgres-nya sendiri.
async fn create_room(State(state): State<AppState>) -> Result<Json<RoomResponse>, AppError> {
    let room = sqlx::query_as::<_, RoomResponse>(
        r#"
        INSERT INTO rooms (code)
        VALUES (upper(substr(md5(random()::text), 1, 6)))
        RETURNING id::text AS id, code, fen, status
        "#,
    )
    .fetch_one(&state.db)
    .await?;

    tracing::info!("room dibuat: {}", room.code);
    Ok(Json(room))
}

/// Cari room lewat kodenya - dipakai pas mau join. 404 kalau kodenya
/// gak ketemu, bukan 500 (itu bukan error server, itu memang gak ada).
async fn get_room(
    State(state): State<AppState>,
    Path(code): Path<String>,
) -> Result<Json<RoomResponse>, StatusCode> {
    let room = sqlx::query_as::<_, RoomResponse>(
        "SELECT id::text AS id, code, fen, status FROM rooms WHERE code = $1",
    )
    .bind(code.to_uppercase())
    .fetch_optional(&state.db)
    .await
    .map_err(|err| {
        tracing::error!("db error: {err}");
        StatusCode::INTERNAL_SERVER_ERROR
    })?
    .ok_or(StatusCode::NOT_FOUND)?;

    Ok(Json(room))
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    Path(code): Path<String>,
    State(state): State<AppState>,
) -> Response {
    let code = code.to_uppercase();
    ws.on_upgrade(move |socket| handle_socket(socket, code, state))
}

/// Nyambung ke saluran broadcast milik `code` (dibikin kalau belum ada),
/// lalu jalanin dua arah sekaligus lewat dua task terpisah: satu
/// nerusin pesan DARI saluran KE socket ini, satu lagi nerusin pesan
/// DARI socket ini KE saluran (biar semua koneksi lain di room yang
/// sama ikut kebagian).
async fn handle_socket(socket: WebSocket, code: String, state: AppState) {
    let tx = {
        let mut rooms = state.rooms.lock().unwrap();
        rooms
            .entry(code.clone())
            .or_insert_with(|| broadcast::channel(100).0)
            .clone()
    };
    let mut rx = tx.subscribe();

    let (mut sender, mut receiver) = socket.split();

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(msg.into()).await.is_err() {
                break;
            }
        }
    });

    let tx2 = tx.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                let _ = tx2.send(text.to_string());
            }
        }
    });

    // Kalau salah satu arah berhenti (client disconnect / error), matiin
    // yang satu lagi juga, jangan biarin nyantol setengah-setengah.
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }

    tracing::info!("koneksi ke room {code} ditutup");
}
