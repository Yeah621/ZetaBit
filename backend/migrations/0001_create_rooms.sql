-- Fase 3, langkah 3: tabel paling dasar buat sebuah "room" (dipakai
-- Play with Friend nanti). Cuma kolom yang jelas dibutuhkan sekarang -
-- kolom pemain/waktu/dst nyusul pas logic create/join beneran dibikin.
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    fen TEXT NOT NULL DEFAULT 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    status TEXT NOT NULL DEFAULT 'waiting',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
