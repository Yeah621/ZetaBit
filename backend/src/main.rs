//! Fase 4 lanjutan: validasi gerakan di sisi server.
//!
//! Sebelumnya `/ws/{code}` cuma nerusin apa aja yang dikirim (raw
//! broadcast, gak ada yang dicek). Sekarang pesan `{"type":"move",...}`
//! divalidasi dulu pakai `rules-wasm` (crate yang sama yang dipakai
//! WASM di frontend, dipakai di sini sebagai rlib biasa - lihat
//! `GameCore` di `rules-wasm/src/lib.rs`) sebelum di-broadcast dan
//! sebelum FEN room-nya di-update di database. Gerakan ilegal ditolak
//! diam-diam (gak di-broadcast ke siapa pun) - client yang ngirim gak
//! dapet konfirmasi apa pun buat gerakan yang ditolak. Pesan yang bukan
//! format "move" yang dikenal tetap diteruskan apa adanya (gak diblokir),
//! biar gak ngerusak hal lain yang mungkin masih dikirim.
//!
//! Port dibaca dari env var `PORT` (Railway yang nentuin nilainya pas
//! di-deploy), fallback ke 8080 kalau gak ada (buat lokal, `cargo run`
//! biasa - gak ada yang berubah dari cara testing sebelumnya).

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
use serde::{Deserialize, Serialize};
use sqlx::postgres::{PgPool, PgPoolOptions};
use tokio::sync::broadcast;
use tower_http::cors::CorsLayer;

/// Kode room -> channel broadcast-nya + berapa koneksi yang lagi
/// nempel. Dibikin on-demand pas koneksi pertama masuk ke suatu room
/// (lihat `handle_socket`).
struct RoomState {
    tx: broadcast::Sender<String>,
    count: usize,
}

type RoomChannels = Arc<Mutex<HashMap<String, RoomState>>>;

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

/// Nyambung ke channel broadcast milik `code` (dibikin kalau belum ada),
/// naikin hitungan koneksi + broadcast presence, lalu jalanin dua arah
/// sekaligus lewat dua task terpisah: satu nerusin pesan DARI channel
/// KE socket ini, satu lagi nerusin pesan DARI socket ini KE channel -
/// lewat validasi dulu kalau bentuknya pesan "move" (lihat
/// `validate_move_if_applicable`). Pas koneksi ini tutup, hitungannya
/// diturunin lagi + presence di-broadcast ulang.
async fn handle_socket(socket: WebSocket, code: String, state: AppState) {
    let tx = {
        let mut rooms = state.rooms.lock().unwrap();
        let room = rooms.entry(code.clone()).or_insert_with(|| RoomState {
            tx: broadcast::channel(100).0,
            count: 0,
        });
        room.count += 1;
        room.tx.clone()
    };
    let mut rx = tx.subscribe();
    broadcast_presence(&state, &code);

    let (mut sender, mut receiver) = socket.split();

    let mut send_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if sender.send(msg.into()).await.is_err() {
                break;
            }
        }
    });

    let tx2 = tx.clone();
    let db = state.db.clone();
    let code2 = code.clone();
    let mut recv_task = tokio::spawn(async move {
        while let Some(Ok(msg)) = receiver.next().await {
            if let Message::Text(text) = msg {
                let text = text.to_string();
                match validate_move_if_applicable(&db, &code2, &text).await {
                    Ok(()) => {
                        // valid (atau bukan pesan "move" - dilewatin apa
                        // adanya), teruskan ke semua koneksi di room ini
                        let _ = tx2.send(text);
                    }
                    Err(reason) => {
                        // ilegal - sengaja TIDAK di-broadcast. Pengirim
                        // gak dapet balasan apa pun buat gerakan yang
                        // ditolak (client jujur gak akan pernah ngirim
                        // ini karena UI-nya sendiri udah nyaring lewat
                        // rules-wasm; ini jaring pengaman buat client
                        // yang nakal/rusak).
                        tracing::warn!("gerakan ditolak di room {code2}: {reason}");
                    }
                }
            }
        }
    });

    // Kalau salah satu arah berhenti (client disconnect / error), matiin
    // yang satu lagi juga, jangan biarin nyantol setengah-setengah.
    tokio::select! {
        _ = &mut send_task => recv_task.abort(),
        _ = &mut recv_task => send_task.abort(),
    }

    {
        let mut rooms = state.rooms.lock().unwrap();
        if let Some(room) = rooms.get_mut(&code) {
            room.count = room.count.saturating_sub(1);
        }
    }
    broadcast_presence(&state, &code);

    tracing::info!("koneksi ke room {code} ditutup");
}

/// Kirim `{"type":"presence","count":N}` ke semua koneksi di room ini -
/// dipanggil tiap kali ada yang connect/disconnect, biar tiap client
/// bisa nampilin "menunggu lawan" (count < 2) atau enggak.
fn broadcast_presence(state: &AppState, code: &str) {
    let rooms = state.rooms.lock().unwrap();
    if let Some(room) = rooms.get(code) {
        let msg = format!(r#"{{"type":"presence","count":{}}}"#, room.count);
        let _ = room.tx.send(msg);
    }
}

#[derive(Deserialize)]
#[serde(tag = "type", rename_all = "lowercase")]
enum ClientMessage {
    Move {
        orig: String,
        dest: String,
        promotion: Option<String>,
    },
}

/// Kalau `text` adalah pesan `{"type":"move",...}`: validasi lewat
/// `rules-wasm` terhadap FEN room saat ini, dan kalau legal, update FEN
/// room itu di database. Balikin `Err` kalau room-nya gak ketemu atau
/// gerakannya ilegal.
///
/// Kalau `text` BUKAN pesan bentuk itu (gagal di-parse) - dianggap
/// bukan tanggung jawab fungsi ini, balikin `Ok(())` biar tetap
/// diteruskan apa adanya (jangan nge-block sesuatu yang belum kita
/// kenal formatnya).
async fn validate_move_if_applicable(db: &PgPool, code: &str, text: &str) -> Result<(), String> {
    let Ok(ClientMessage::Move {
        orig,
        dest,
        promotion,
    }) = serde_json::from_str::<ClientMessage>(text)
    else {
        return Ok(());
    };

    let current_fen: String = sqlx::query_scalar::<_, String>("SELECT fen FROM rooms WHERE code = $1")
        .bind(code)
        .fetch_optional(db)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "room gak ketemu".to_string())?;

    let mut game = rules_wasm::GameCore::from_fen(&current_fen)?;
    let snapshot = game.apply_move(&orig, &dest, promotion.as_deref())?;

    sqlx::query("UPDATE rooms SET fen = $1 WHERE code = $2")
        .bind(&snapshot.fen)
        .bind(code)
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
