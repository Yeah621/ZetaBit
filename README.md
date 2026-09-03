# Chessground Board — Chess.com/Lichess-style

Board catur visual (React + TypeScript + Tailwind) di atas [Chessground](https://github.com/lichess-org/chessground),
library resmi yang dipakai lichess.org. Legal-move validation sudah tersambung (Fase 1) lewat
[`rules-wasm`](../rules-wasm) — `shakmaty` yang di-compile ke WASM dan jalan langsung di browser, tanpa
backend. Lihat bagian "Rules engine" di bawah.

## Menjalankan

```bash
npm install
npm run dev
```

Build production: `npm run build` (jalan `tsc -b` dulu lalu `vite build`).

## ⚠️ Lisensi Chessground (GPL-3.0)

Chessground sendiri berlisensi **GPL-3.0-or-later**. Dari README resminya:

> "When you use Chessground for your website, your combined work may be distributed only under
> the GPL. You must release your source code to the users of your website."

Ini bukan halangan teknis — banyak produk pakai Chessground — tapi kalau project kamu closed-source/komersial,
ini poin yang sebaiknya dicek dulu ke tim legal/lisensi kamu sebelum ship. Detail: <https://github.com/lichess-org/chessground#license>

## Struktur project

```
src/
  components/ChessBoard.tsx        <- wrapper React di sekitar Chessground
  styles/chessground-theme.css     <- WARNA BOARD ada di sini
  hooks/useChessGame.ts            <- state game (fen/dests/turn/...) dari rules-wasm
  wasm/                            <- HASIL BUILD rules-wasm, lihat rules-wasm/README.md
  App.tsx                          <- flip, reset, dan sekarang catur beneran (legal moves only)
```

`ChessBoard` sengaja tipis dan "imperative": Chessground mengelola DOM-nya sendiri (bukan lewat React
render), jadi wrapper ini cuma mount sekali lalu bicara ke instance-nya lewat `.set()` atau lewat ref:

```tsx
const boardRef = useRef<ChessBoardHandle>(null);
<ChessBoard ref={boardRef} config={{ fen: someFen, lastMove: ['e2', 'e4'] }} />

boardRef.current?.toggleOrientation();   // flip
boardRef.current?.getApi();              // akses penuh Chessground API kalau perlu sesuatu di luar wrapper ini
```

## Warna board (persyaratan #2)

Chessground tidak mewarnai kotak satu-satu — background papan catur adalah **satu gambar checker 8x8** di
elemen `cg-board`. Di `chessground-theme.css`, pola itu dibuat murni dengan CSS `conic-gradient` (bukan file
gambar), jadi tajam di ukuran berapa pun dan gampang diganti — tinggal ubah dua variabel ini:

```css
:root {
  --board-light: #f0d9b5;
  --board-dark: #769656;
}
```

Koordinat a–h/1–8 diposisikan menempel di pojok kotak tepi (seperti chess.com/lichess, bukan mengambang di
luar papan seperti default demo Chessground), dan warnanya otomatis kontras terhadap kotak di bawahnya.

## Mengganti piece set (persyaratan #5)

Default yang dipasang sekarang: **cburnett** (bawaan resmi lichess.org, ikut ter-bundle di package
`@lichess-org/chessground`, lisensi sama seperti Chessground). Ini piece set yang tajam dan sangat
teruji, tapi gaya klasik/ornate — **bukan** gaya flat/modern ala Chess.com "Neo". Piece set "Neo" itu
sendiri adalah aset berbayar/proprietary milik Chess.com, jadi tidak bisa saya sertakan atau tiru
langsung di sini.

Cara ganti, di `src/components/ChessBoard.tsx`:

```ts
// ganti baris ini...
import '@lichess-org/chessground/assets/chessground.cburnett.css';
// ...dengan CSS piece-set lain yang punya class yang sama
```

Semua piece-set Chessground pakai konvensi class yang sama, jadi CSS custom apa pun tinggal ikut pola ini
(12 kombinasi role × warna):

```css
piece.white.pawn   { background-image: url('/pieces/wP.svg'); }
piece.white.knight { background-image: url('/pieces/wN.svg'); }
piece.white.bishop { background-image: url('/pieces/wB.svg'); }
piece.white.rook   { background-image: url('/pieces/wR.svg'); }
piece.white.queen  { background-image: url('/pieces/wQ.svg'); }
piece.white.king   { background-image: url('/pieces/wK.svg'); }
piece.black.pawn   { background-image: url('/pieces/bP.svg'); }
/* ...dan seterusnya untuk black.knight/bishop/rook/queen/king */
```

Opsi untuk sumber piece set yang lebih flat/modern:

- lichess.org punya ~30 piece set gratis (masing-masing lisensi bebas pakai, tercantum di repo-nya) —
  preview langsung & pilih visual di **lichess.org → Preferences → Game display → Piece set**, lalu ambil
  asetnya dari <https://github.com/lichess-org/lila/tree/master/public/piece>.
- Kalau kamu punya lisensi/hak pakai sah atas aset Chess.com sendiri, tinggal drop SVG/PNG-nya dan ikuti
  pola class di atas.
- Atau desain sendiri — asal nama class-nya cocok, Chessground tidak peduli sumber gambarnya.

## Rules engine (Fase 1)

`movable: { free: true, color: 'both' }` sudah diganti jadi `free: false` + `dests` beneran. Alurnya:

1. `rules-wasm` (crate Rust terpisah, lihat [`../rules-wasm`](../rules-wasm)) bungkus `shakmaty` dan
   di-compile ke WASM — jalan di browser, tanpa perlu backend, jadi cocok untuk Local Pass & Play.
2. `src/hooks/useChessGame.ts` load WASM itu sekali, lalu expose `fen`, `turn`, `dests` (siap pakai untuk
   `movable.dests`), `check`, `checkmate`/`stalemate`, dan `tryMove(orig, dest, promotion?)`.
3. `App.tsx` pasang `movable.dests` dari hook itu, dan di `movable.events.after(orig, dest)` panggil
   `tryMove` — karena Chessground cuma pernah menawarkan kotak yang memang ada di `dests`, move di titik
   ini sudah pasti legal.

Promosi pion **selalu auto-jadi queen** untuk sekarang (belum ada modal pemilihan — itu Fase 6). Setelah
tiap move, board di-sync penuh ke FEN otoritatif dari `rules-wasm` (bukan cuma percaya animasi drag
Chessground), supaya castling/en passant/promosi selalu benar secara visual walau animasinya belum
sehalus nanti.

Belum coba jalan? Build dulu `rules-wasm` sebelum `npm run dev` — lihat [`rules-wasm/README.md`](../rules-wasm/README.md).

## Catatan TypeScript

Import tipe di sini pakai `import type { Api, Config } from '@lichess-org/chessground'` (root package,
bukan subpath) — ini pola paling umum untuk package TS yang sudah matang. Kalau ternyata versi
`@lichess-org/chessground` yang ke-install tidak re-export nama itu dari root, TypeScript akan langsung
kasih error "no exported member" yang jelas; cek `node_modules/@lichess-org/chessground/dist/*.d.ts` untuk
path export yang benar dan sesuaikan importnya (biasanya jadi subpath seperti `@lichess-org/chessground/api`).
