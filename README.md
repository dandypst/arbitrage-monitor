# Wallet Scanner — Robinhood Chain

Dashboard untuk monitoring wallet trading aktif & estimasi P&L di Robinhood Chain,
menarik data dari query Dune Analytics kamu secara berkala.

## 1. Siapkan query di Dune

1. Buat 2 query di dune.com:
   - **Query A** ("wallet summary") — pakai SQL biasa (yang sudah diberikan di awal chat), untuk leaderboard utama.
   - **Query B** ("token breakdown") — **wajib pakai versi parameterized**, ada di file
     `query_B_token_breakdown_parameterized.sql` di folder ini. Ini beda dari versi awal:
     filter wallet dilakukan langsung di SQL lewat parameter `{{wallet_address}}`,
     bukan ditarik semua lalu difilter di aplikasi. Kalau masih pakai versi lama, wallet
     dengan trade sangat banyak (contoh: wallet dengan >20rb trades) bisa saja datanya
     tidak muncul saat di-klik karena kepotong limit baris.
2. Untuk Query B: buka query editor Dune → klik ikon parameter (+) → tambahkan parameter
   `Text` bernama **wallet_address** → save.
3. Jalankan tiap query minimal sekali (Query B bisa diisi contoh address dulu) supaya tidak error.
4. **Penting:** aktifkan **scheduled refresh** khusus untuk **Query A** (klik ikon jam di query editor)
   supaya leaderboard-nya ter-update otomatis, misalnya tiap 1 jam. Query B TIDAK perlu scheduled
   refresh karena akan dieksekusi on-demand tiap kali user klik wallet di web app.
5. Catat **Query ID** masing-masing (angka di URL, contoh: dune.com/queries/**1234567**).
6. Buat API key di https://dune.com/settings/api.

## 2. Setup lokal

```bash
npm install
cp .env.example .env.local
# isi .env.local dengan API key & query ID kamu
npm run dev
```

Buka http://localhost:3000

## 3. Deploy ke Vercel

**Opsi A — lewat CLI:**
```bash
npm install -g vercel
vercel
```
Ikuti prompt-nya, lalu saat ditanya environment variables, masukkan:
- `DUNE_API_KEY`
- `DUNE_WALLET_SUMMARY_QUERY_ID`
- `DUNE_TOKEN_BREAKDOWN_QUERY_ID`

**Opsi B — lewat dashboard Vercel:**
1. Push folder ini ke GitHub repo.
2. Buka vercel.com → New Project → import repo tersebut.
3. Di halaman "Configure Project", buka **Environment Variables** → tambahkan 3 variable di atas.
4. Klik Deploy.

## 4. Catatan soal "realtime"

- Data leaderboard (Query A) **bukan realtime murni** — frekuensinya mengikuti scheduled refresh
  di Dune (poin 1.4) dan polling di frontend (default tiap 60 detik, bisa diubah di `REFRESH_MS`
  pada `app/page.js`).
- Endpoint `/api/wallets` mengambil hasil **cache** Dune (`GET /query/{id}/results`), tidak
  trigger eksekusi baru tiap request — hemat credit.
- Endpoint `/api/tokens` (breakdown per token) **berbeda** — karena pakai parameter wallet_address,
  setiap kali user klik/expand sebuah wallet, aplikasi **trigger eksekusi baru** di Dune
  (`POST /query/{id}/execute` lalu polling hasil). Ini memakai credit Dune API tiap klik.
  Kalau trafficnya tinggi, pertimbangkan menambah caching sederhana di server (misal simpan
  hasil per wallet selama beberapa menit) supaya klik berulang ke wallet yang sama tidak
  trigger eksekusi baru terus-menerus.

## 5. Batasan data

Angka `estimated_pnl_usd` di sini adalah **realized P&L kasar** (total sell volume − total buy volume),
belum memperhitungkan posisi yang belum di-close (unrealized) atau slippage/fee. Gunakan sebagai
starting point riset, bukan angka final sebelum memutuskan mengikuti strategi wallet tertentu.
