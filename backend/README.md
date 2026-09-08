# chess-backend

Fase 3: server Axum. Progress:
- Langkah 1: skeleton minimal (health check + WebSocket echo) - selesai
- Langkah 2: nyambungin Postgres - selesai
- Langkah 3: migration pertama, tabel `rooms` - selesai
- Langkah 4: create + join room - selesai
- Langkah 5: WebSocket nempel ke room tertentu (broadcast) - selesai
- Fase 4 lanjutan: validasi gerakan di server pakai `rules-wasm` (`GameCore`) - sekarang di sini
- Berikutnya: "nunggu lawan join" indicator, reconnect handling, atau Fase 5 (Play with AI)

## Langkah 2: dapetin database Postgres gratis (Neon)

Gak perlu install Postgres di komputer sendiri - pakai yang gratis di cloud,
sekalian nanti ini juga yang dipakai pas backend-nya di-deploy beneran.

1. Buka [neon.com](https://neon.com), daftar (bisa pakai akun GitHub/Google,
   gak perlu kartu kredit buat free tier)
2. Setelah masuk dashboard, klik **Create a project** - kasih nama bebas,
   misal `zetabit-chess`
3. Setelah project jadi, cari tombol **Connection string** / **Connect** -
   copy string yang formatnya `postgres://...` (lengkap dengan password-nya)

## Setup di komputer

1. Di dalam folder `backend/`, copy `.env.example` jadi `.env`:
   ```powershell
   copy .env.example .env
   ```
2. Buka file `.env` itu (Notepad juga bisa), ganti isinya dengan connection
   string dari Neon tadi (timpa semuanya, bukan cuma sebagian)
3. Jalankan lagi:
   ```powershell
   cargo run
   ```

File `.env` **tidak** ikut ke-upload ke GitHub (sudah ada di `.gitignore`) -
itu memang sengaja, karena isinya password. Nanti pas deploy beneran,
`DATABASE_URL` diisi lewat dashboard hosting-nya, bukan file ini.

## Cek berhasil apa nggak

```
http://localhost:8080/health
```

- Muncul `ok (0 rooms)` → server, Postgres, DAN tabel `rooms` semuanya beres. Migration jalan
  otomatis tiap kali `cargo run` (aman diulang - kalau tabelnya udah ada, dilewatin aja).
- Muncul error / status 500 → cek pesan di terminal tempat `cargo run` jalan, biasanya jelas
  nunjukin baris SQL atau koneksi mana yang bermasalah.

**Create + join room** - di DevTools console (F12 → Console), buka `http://localhost:8080/health`
dulu di tab itu (biar console-nya nyambung ke origin yang benar), lalu paste:

```js
// Bikin room baru
fetch('http://localhost:8080/rooms', { method: 'POST' })
  .then((r) => r.json())
  .then((room) => {
    console.log('room dibuat:', room);
    // Coba cari room itu lagi pakai kodenya
    return fetch(`http://localhost:8080/rooms/${room.code}`).then((r) => r.json());
  })
  .then((found) => console.log('ketemu lagi:', found));
```

Harus muncul dua log: room yang baru dibuat, lalu room yang sama hasil pencarian pakai kode.
Coba juga kode yang gak ada (`fetch('http://localhost:8080/rooms/ZZZZZZ')`) - harus dapet
status 404, bukan 500.

**WebSocket per room** - butuh **2 tab browser terpisah** (bukan 2 window DevTools di tab yang
sama). Pertama, bikin satu room dulu (cara di atas), catat kodenya (misal `782BA3`).

Tab 1 (F12 → Console), ganti `782BA3` dengan kode room kamu:
```js
const ws1 = new WebSocket('ws://localhost:8080/ws/782BA3');
ws1.onmessage = (e) => console.log('TAB 1 dapet:', e.data);
ws1.onopen = () => console.log('TAB 1 connected');
```

Tab 2 (kode room yang SAMA):
```js
const ws2 = new WebSocket('ws://localhost:8080/ws/782BA3');
ws2.onmessage = (e) => console.log('TAB 2 dapet:', e.data);
ws2.onopen = () => console.log('TAB 2 connected');
```

Di Tab 1, kirim pesan:
```js
ws1.send('halo dari tab 1');
```

Harus muncul di **Tab 2** console: `TAB 2 dapet: halo dari tab 1`. Tab 1 juga bakal nerima
pesannya sendiri balik (`TAB 1 dapet: halo dari tab 1`) - itu normal untuk langkah ini (broadcast
gak mbedain "punya siapa"), bukan bug. Membedakan pengirim sendiri vs lawan itu kerjaan Fase 4
pas bentuk pesannya udah terstruktur (bukan raw text lagi).

## Cek validasi gerakan (Fase 4 lanjutan)

Pakai room dan 2 tab yang sama seperti tes di atas. Di **Tab 1**, kirim gerakan **legal** (pion e2
ke e4, dari posisi awal):
```js
ws1.send(JSON.stringify({ type: 'move', orig: 'e2', dest: 'e4', promotion: null, senderId: 'x' }))
```
Harus muncul di **Tab 2**. Sekarang coba kirim gerakan **ilegal** dari posisi yang sama (pion
lompat ke e5, gak mungkin dalam sekali jalan):
```js
ws1.send(JSON.stringify({ type: 'move', orig: 'e2', dest: 'e5', promotion: null, senderId: 'x' }))
```
Kali ini **tidak ada apa pun** yang muncul di tab manapun (server diam-diam menolak) - itu tandanya
validasi jalan. Cek juga log di terminal `cargo run`, harus ada baris `WARN ... gerakan ditolak`.

## Deploy ke Railway

Vercel gak bisa dipakai buat ini (lihat bagian bawah) - pakai Railway.

1. Buka **railway.com**, daftar/login (bisa pakai akun GitHub)
2. **New Project → Deploy from GitHub repo** → pilih repo `ZetaBit`
3. Setelah service-nya kebuat, buka **Settings** service itu → cari **"Root Directory"** → isi `backend`
   (biar Railway cuma build folder ini, bukan seluruh repo)
4. Masih di Settings, cari **Variables** → tambahin `DATABASE_URL` dengan value yang sama persis kayak
   di file `.env` lokal kamu (connection string Neon)
5. Railway otomatis detect `Dockerfile` di folder `backend/` dan build pakai itu
6. Setelah deploy sukses, buka **Settings → Networking → Generate Domain** buat dapetin URL publik
   (formatnya kira-kira `https://nama-acak.up.railway.app`)
7. Cek `https://url-railway-kamu/health` di browser - harus muncul `ok (sekian rooms)` sama kayak pas lokal

Setelah dapet URL itu, **update satu baris** di `chessground-board/src/config.ts` - ganti
`http://localhost:8080` jadi URL Railway kamu, commit+push. Setelah itu, Play with Friend bisa
dicoba dari device MANA PUN, gak perlu lagi komputer kamu nyala `cargo run`.

## Kenapa belum bisa di-deploy ke Vercel

Vercel itu serverless functions - tiap request nyalain fungsi baru terus
mati lagi. Axum + WebSocket butuh proses yang nyala terus-menerus. Backend
ini nanti perlu hosting lain (Railway, Fly.io, atau VPS biasa) - dibahas
pas udah waktunya deploy.
