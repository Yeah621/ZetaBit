# Dockerfile ini HARUS ada di root repo (sejajar backend/, rules-wasm/,
# chessground-board/), bukan di dalam backend/ - karena backend depend
# ke rules-wasm lewat path dependency (../rules-wasm), jadi build
# context-nya harus bisa lihat dua folder itu sekaligus.
#
# Sengaja dibikin sesederhana mungkin (satu stage, gak pakai cargo-chef
# buat caching layer) setelah versi sebelumnya kena bug path ke-nested.
# Build-nya jadi sedikit lebih lambat tiap kali (gak ada cache dependency
# terpisah), tapi jauh lebih gampang dipastikan benar - trade-off yang
# masuk akal buat project sekecil ini.
FROM rust:1
WORKDIR /app
COPY rules-wasm rules-wasm
COPY backend backend
WORKDIR /app/backend
RUN cargo build --release
CMD ["./target/release/chess-backend"]
