# Arb Monitor

Dashboard pemantau gap arbitrase:
- **Cross-chain**: harga token yang sama di beberapa chain berbeda (sumber: DefiLlama, gratis, tanpa API key).
- **Same-chain**: harga pair yang sama di beberapa DEX pada chain yang sama (sumber: Dune Analytics, perlu API key + query SQL milikmu sendiri).

Dibangun sebagai aplikasi Next.js (bukan artifact statis) karena Dune API **harus** dipanggil dari server — API key tidak boleh dan tidak bisa dipakai langsung dari browser (tidak ada CORS untuk request client-side, dan kalau dipaksa, key kamu akan bocor ke publik). Di project ini, dua API route (`/api/cross-chain` dan `/api/same-chain`) berjalan di server dan menyimpan key Dune secara aman di environment variable.

## 1. Install & jalankan lokal

```bash
npm install
cp .env.example .env.local
npm run dev
```

Buka `http://localhost:3000`. Panel **cross-chain** langsung jalan tanpa setup apa pun (pakai DefiLlama). Panel **same-chain** akan menampilkan pesan "not configured" sampai kamu isi `.env.local`.

## 2. Setup Dune (untuk gap antar-DEX di chain yang sama)

Dune tidak punya endpoint siap pakai untuk "harga tiap DEX" — kamu perlu query SQL sendiri karena setiap protokol punya skema pool berbeda. Langkah:

1. Buat akun di dune.com, ambil API key di `Settings → API`.
2. Buat query baru di Dune App UI, contoh starter untuk pair ETH/USDC di beberapa DEX Ethereum (`dex.trades` adalah tabel unified Dune untuk trade DEX):

```sql
select
  blockchain as chain,
  'WETH/USDC' as pair,
  project as dex,
  avg(token_bought_amount / nullif(token_sold_amount, 0)) as price,
  max(block_time) as updated_at
from dex.trades
where blockchain = 'ethereum'
  and block_time > now() - interval '15' minute
  and (
    (token_bought_symbol = 'WETH' and token_sold_symbol = 'USDC')
    or (token_bought_symbol = 'USDC' and token_sold_symbol = 'WETH')
  )
group by 1, 2, 3
```

   Sesuaikan filter token/chain sesuai pair yang mau kamu pantau. Kolom output **harus** bernama `chain`, `pair`, `dex`, `price` (opsional `updated_at`) — inilah yang dibaca oleh `lib/dune.ts`.

3. Simpan query, catat **query ID**-nya (angka di URL query Dune).
4. Isi `.env.local`:
   ```
   DUNE_API_KEY=dune_xxx
   DUNE_SAME_CHAIN_QUERY_ID=1234567
   ```
5. Jadwalkan query itu di Dune (paid plan) supaya hasilnya ter-refresh otomatis — app ini membaca **hasil cache terakhir** (`/query/{id}/results`), bukan menjalankan ulang query tiap request, supaya tidak boros credit eksekusi.

## 3. Tambah / ubah token & chain untuk cross-chain

Edit `lib/tokens.ts`:
- `TOKENS`: daftar token + contract address per chain. **Cek ulang setiap address** di explorer masing-masing chain sebelum dipakai serius — token native vs bridged/wrapped versi bisa punya address berbeda dan gap harganya belum tentu jadi arbitrase yang bisa dieksekusi.
- `MIN_GAP_PCT`: ambang minimum gap (%) yang dianggap "opportunity". Ini masih harga mentah — belum dikurangi fee DEX, slippage, gas, atau biaya bridge.

## 4. Setup alert Telegram

1. Chat `@BotFather` di Telegram → `/newbot` → ikuti instruksi → kamu dapat **bot token** (format `123456:ABC-...`).
2. Cari chat ID kamu: chat apa saja ke bot barumu dulu (misal kirim "hi"), lalu buka di browser:
   `https://api.telegram.org/bot<TOKEN>/getUpdates`
   Cari field `"chat":{"id": ...}` — angka itu **chat ID** kamu.
3. Isi di `.env.local`:
   ```
   TELEGRAM_BOT_TOKEN=123456:ABC-...
   TELEGRAM_CHAT_ID=123456789
   ALERT_MIN_GAP_PCT=1
   CRON_SECRET=isi-string-acak-minimal-16-karakter
   ```
4. Tes manual sebelum deploy:
   ```bash
   npm run dev
   curl -H "Authorization: Bearer isi-string-acak-minimal-16-karakter" http://localhost:3000/api/alert-check
   ```
   Kalau ada opportunity di atas `ALERT_MIN_GAP_PCT`, pesan akan masuk ke Telegram kamu.

Supaya tidak spam, gap yang sama tidak dikirim ulang selama 30 menit kecuali gap-nya melompat lagi minimal 0.5 poin. Dedup ini disimpan di memory server, jadi reset kalau server cold-start — wajar untuk skala personal; kalau butuh dedup yang benar-benar persisten, ganti `lib/alertState.ts` dengan Vercel KV/Upstash Redis.

## 5. Deploy ke Vercel (biar bisa diakses dari mana saja, bukan cuma localhost)

```bash
npm i -g vercel
vercel
```

Atau lewat dashboard: push project ke GitHub, lalu di vercel.com klik **New Project** dan import repo itu — Vercel otomatis mendeteksi Next.js dan build sendiri.

Isi semua environment variable di **Project Settings → Environment Variables** (Production + Preview): `DUNE_API_KEY`, `DUNE_SAME_CHAIN_QUERY_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `ALERT_MIN_GAP_PCT`, `CRON_SECRET`. Setelah diisi, klik **Redeploy** supaya env var ke-pickup.

Kamu akan dapat URL publik seperti `https://arbitrage-monitor-xxxx.vercel.app` — dashboard-nya sudah bisa diakses dari device manapun begitu ini live, tidak perlu komputer kamu menyala.

### Menjalankan alert otomatis di background (bukan cuma saat dashboard dibuka)

Dashboard di browser hanya polling saat tab-nya terbuka. Supaya alert Telegram jalan otomatis 24/7, endpoint `/api/alert-check` perlu dipanggil berkala oleh scheduler:

- **Vercel Hobby (gratis)**: cron bawaan Vercel dibatasi maksimal **sekali per hari**, kurang cocok untuk memantau gap yang berubah cepat. Solusinya pakai scheduler eksternal gratis, misalnya **cron-job.org**:
  1. Daftar gratis di cron-job.org.
  2. Buat job baru: URL = `https://project-kamu.vercel.app/api/alert-check`, method GET, interval misal tiap 5 menit.
  3. Tambahkan header `Authorization: Bearer <CRON_SECRET>` (sama dengan yang kamu isi di Vercel env var) di pengaturan header job tersebut.
- **Vercel Pro ($20/bulan)**: bisa pakai cron bawaan Vercel per-menit lewat `vercel.json` kalau nanti upgrade:
  ```json
  {
    "crons": [{ "path": "/api/alert-check", "schedule": "*/5 * * * *" }]
  }
  ```
  Vercel Cron otomatis mengirim header `Authorization` sesuai `CRON_SECRET` yang kamu set sebagai env var, jadi route ini langsung kompatibel tanpa ubah kode.

## Struktur

```
app/
  page.tsx              dashboard (client-side, polling tiap 30s)
  api/cross-chain/      route.ts -> lib/defillama.ts
  api/same-chain/       route.ts -> lib/dune.ts
  api/alert-check/      route.ts -> dipanggil scheduler eksternal, kirim Telegram
lib/
  tokens.ts             daftar token/chain + threshold gap
  defillama.ts          fetch harga + hitung gap cross-chain
  dune.ts               fetch hasil query Dune + hitung gap same-chain
  telegram.ts           kirim pesan lewat Telegram Bot API
  alertState.ts          dedup alert (in-memory, best-effort)
  types.ts
components/
  Ticker.tsx            strip berjalan top opportunities
  GapTable.tsx           tabel per panel
```

## Batasan yang perlu disadari

- Gap yang ditampilkan **tidak** memperhitungkan fee DEX, slippage, gas, atau waktu eksekusi — ini alat monitoring, bukan sinyal eksekusi otomatis.
- DefiLlama coin price adalah harga referensi (bukan selalu harga eksekusi on-chain real-time per pool), cocok untuk cross-chain gap tapi kurang presisi untuk same-chain DEX-to-DEX — makanya panel same-chain didedikasikan ke Dune, yang bisa query harga per pool langsung dari `dex.trades`.
- Polling 30 detik di sisi client; untuk kebutuhan lebih cepat, kombinasikan dengan WebSocket/mempool feed terpisah (di luar cakupan starter ini).
