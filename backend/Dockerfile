# Pola resmi dari panduan Railway buat Axum (docs.railway.com/guides/axum),
# pakai cargo-chef biar dependency di-cache terpisah dari kode sendiri -
# build ulang jadi jauh lebih cepat kalau cuma src/main.rs yang berubah.
#
# Sengaja gak pakai stage runtime terpisah yang lebih kecil (meski itu
# umum dipakai) - image dasarnya (rust:1, basis cargo-chef) udah bawa
# ca-certificates yang dibutuhkan sqlx buat TLS ke Neon, dan ini persis
# pola yang didokumentasikan Railway sendiri, jadi risikonya paling
# kecil buat sekarang. Bisa dioptimasi ukurannya belakangan.
FROM lukemathwalker/cargo-chef:latest-rust-1 AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release

CMD ["./target/release/chess-backend"]
