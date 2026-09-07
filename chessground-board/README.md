# Chessground Board — Chess.com/Lichess-style

Board catur visual (React + TypeScript + Tailwind) di atas [Chessground](https://github.com/lichess-org/chessground),
library resmi yang dipakai lichess.org. Legal-move validation sudah tersambung (Fase 1) lewat
[`rules-wasm`](../rules-wasm) — `shakmaty` yang di-compile ke WASM dan jalan langsung di browser, tanpa
backend. Home screen, routing, dan dark theme (Fase 2) juga sudah ada — lihat bagian "Rules engine" dan
"Fase 2" di bawah.

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
  components/ChessBoard.tsx        <- wrapper React di sekitar Chessground (JANGAN diubah polanya)
  components/Navbar.tsx            <- navbar minimal, cuma wordmark untuk sekarang
  components/BentoCard.tsx         <- kartu mode di Home (varian besar + "segera hadir")
  styles/chessground-theme.css     <- WARNA BOARD ada di sini
  hooks/useChessGame.ts            <- state game (fen/dests/turn/...) dari rules-wasm
  wasm/                            <- HASIL BUILD rules-wasm, lihat rules-wasm/README.md
  pages/Home.tsx                   <- "/" - hero + bento grid 3 mode
  pages/Game.tsx                   <- "/local" - board + turn card (App.tsx yang lama, direstyle)
  App.tsx                          <- router root (<Routes>), bukan tempat logic lagi
  index.css                        <- Tailwind + design tokens (@theme) - lihat bagian Fase 2
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

## Fase 2 — Home, routing, design system

- **Routing**: `react-router` v8, mode declarative (`<BrowserRouter>` di `main.tsx`, `<Routes>` di `App.tsx`).
  Baru 2 route: `/` (Home) dan `/local` (Game, Local Pass & Play). Rute `/friend` dan `/ai` sengaja belum
  dibuat — kartu-nya sudah tampil di Home dengan badge "Segera hadir", tapi belum ada tujuan sampai
  backend (Fase 3+) ada sesuatu buat disambungin.
- **Design tokens**: `index.css`, blok `@theme` (Tailwind v4, CSS-first). v5: base terang krem hangat
  (`#faf6ef`), hero band di Home tetap gelap (gradient navy-plum + noise texture + BEBERAPA lingkaran blur
  emas/lavender di beberapa titik, bukan cuma satu gradient rata — trik ini diambil langsung dari analisis
  `index-3.html` referensi user). Papan hero sekarang jauh lebih besar, punya frame sendiri (rounded,
  shadow, sedikit rotasi yang lurus pas di-hover) — sebelumnya kekecilan dan telanjang tanpa bingkai.
  Tombol CTA sekarang pakai ikon. Baris fitur jujur ("3 Mode Permainan · Gratis · Tanpa Perlu Akun")
  gantiin ide "stats strip" ala referensi (gak mau pasang angka statistik palsu). Tombol kembali di Game
  screen diganti jadi pill button yang jelas kelihatan (sebelumnya cuma teks abu-abu kecil, gampang
  keskip). Font: Poppins buat heading, Inter buat body, IBM Plex Mono nanti buat notasi SAN/clock. Papan
  catur sendiri tetap TIDAK berubah warna. **Ditunda sengaja**: toggle terang/gelap beneran.
- **Bug yang sempat kejadian dua kali**: wadah papan (baik di v3 maupun draft awal v5) kadang cuma dikasih
  `width` tanpa `height`/`aspect-square`, bikin papannya collapse ke 0px. Kalau nanti ngedit ukuran board
  di manapun, selalu pastikan ada `aspect-square` (atau height eksplisit) di wadah langsungnya.
- **Catatan Tailwind v4**: `bg-gradient-to-*` sudah gak ada di v4, sekarang `bg-linear-to-*` (mis.
  `bg-linear-to-br`). Kalau nemu kode contekan dari internet yang masih pakai `bg-gradient-to-*`, ganti
  dulu sebelum dipakai.
- **Glassmorphism**: cuma di `.glass-panel` (dipakai di kartu giliran pemain di Game screen). Sesuai batasan
  di master prompt bagian 4 — tidak dipakai di kartu Home atau board.
- **Sengaja belum dikerjakan** di fase ini (bukan kelupaan): clock & move list beneran (perlu game state
  yang lebih lengkap, nunggu Fase 4), modal "Play Setup" (nunggu ada backend Fase 3+ buat disambungin).

## Fase 4 — Play with Friend

- **Bentuk pesan WebSocket**: `{"type": "move", "orig": "e2", "dest": "e4", "promotion": null, "senderId": "..."}`.
  `senderId` (UUID acak sekali per koneksi) dipakai buat nyaring gema pesan sendiri - broadcast di
  backend ngirim ke SEMUA koneksi di room termasuk yang ngirim, jadi tiap client nolak pesan yang
  `senderId`-nya sama kayak dirinya sendiri (kalau enggak, gerakan sendiri ke-apply dua kali).
- **`pages/FriendLobby.tsx`** (`/friend`): buat room baru (`POST /rooms`) atau gabung pakai kode
  (`GET /rooms/:code`). Nyimpen peran ('white' kalau bikin, 'black' kalau gabung) ke `sessionStorage`
  sebelum pindah ke room, biar `FriendRoom.tsx` tau kamu maen warna apa.
- **`pages/FriendRoom.tsx`** (`/friend/:code`): papan yang beneran nyambung - gerakan di satu device
  langsung kekirim ke device lain di room yang sama lewat WebSocket. `movable.color` dikunci ke warna
  kamu sendiri sepanjang game (beda dari Local Pass & Play yang ngikutin giliran, karena di sini dua
  device beda orang). Server masih sekadar nerusin pesan mentah - BELUM ada validasi legal-move di
  sisi server, jadi client yang "nakal" secara teknis bisa kirim gerakan ilegal dan bakal diterima
  client lain. Itu next step (pakai ulang `rules-wasm` di sisi server).
- **Belum ada**: indikator "nunggu lawan join" (backend belum nge-track berapa koneksi per room),
  reconnect kalau salah satu device refresh/putus, modal promosi (masih auto-queen kayak biasa).
- **`src/config.ts`**: `BACKEND_URL` sekarang nunjuk ke backend yang udah live di Railway
  (`https://zetabit-production.up.railway.app`) - Play with Friend bisa dites dari device mana pun,
  gak perlu lagi komputer developer nyala `cargo run`.

## Catatan TypeScript

Import tipe di sini pakai `import type { Api, Config } from '@lichess-org/chessground'` (root package,
bukan subpath) — ini pola paling umum untuk package TS yang sudah matang. Kalau ternyata versi
`@lichess-org/chessground` yang ke-install tidak re-export nama itu dari root, TypeScript akan langsung
kasih error "no exported member" yang jelas; cek `node_modules/@lichess-org/chessground/dist/*.d.ts` untuk
path export yang benar dan sesuaikan importnya (biasanya jadi subpath seperti `@lichess-org/chessground/api`).
