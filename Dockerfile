# Dockerfile ini HARUS ada di root repo (sejajar backend/, rules-wasm/,
# chessground-board/) - bukan di dalam backend/ lagi. Alasannya: backend
# depend ke rules-wasm lewat path dependency (../rules-wasm), jadi
# Docker build context-nya harus bisa lihat DUA folder itu sekaligus,
# gak bisa di-scope ke backend/ doang seperti sebelumnya.
#
# Pola cargo-chef dari panduan resmi Railway (docs.railway.com/guides/axum),
# disesuaikan buat struktur dua-folder ini.
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY backend backend
COPY rules-wasm rules-wasm
WORKDIR /app/backend
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY rules-wasm rules-wasm
COPY --from=planner /app/backend/recipe.json backend/recipe.json
WORKDIR /app/backend
RUN cargo chef cook --release --recipe-path recipe.json
COPY backend backend
RUN cargo build --release

CMD ["./target/release/chess-backend"]
