// URL backend Axum. Sekarang di-hardcode ke localhost karena backend-nya
// belum di-deploy ke mana pun - masih jalan di komputer sendiri lewat
// `cargo run` (lihat backend/README.md). Ganti jadi env var
// (import.meta.env.VITE_BACKEND_URL) begitu backend-nya udah live di
// hosting (Railway/Fly/dsb) - itu momen yang pas buat pindah dari
// hardcode ke env var, gak perlu diributin sekarang.
export const BACKEND_URL = 'http://localhost:8080';
