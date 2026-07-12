# Wallet Scanner — Robinhood Chain

Dashboard untuk monitoring wallet trading aktif & estimasi P&L di Robinhood Chain,
menarik data dari query Dune Analytics kamu secara berkala.

## 1. Siapkan query di Dune

1. Buat 2 query di dune.com menggunakan SQL yang sudah diberikan sebelumnya:
   - Query A: "wallet summary" (total trades, active days, estimated PNL)
   - Query B: "token breakdown per wallet"
2. Jalankan tiap query minimal sekali supaya ada hasil ter-cache.
3. **Penting:** aktifkan **scheduled refresh** di tiap query (klik ikon jam di query editor Dune)
   supaya datanya ter-update otomatis, misalnya tiap 1 jam. Tanpa ini, dashboard hanya
   akan menampilkan hasil dari eksekusi terakhir yang kamu jalankan manual.
4. Catat **Query ID** masing-masing (angka di URL, contoh: dune.com/queries/**1234567**).
5. Buat API key di https://dune.com/settings/api.

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

- Data ini **bukan realtime murni** — frekuensinya mengikuti scheduled refresh di Dune (poin 1.3)
  dan polling di frontend (default tiap 60 detik, bisa diubah di `REFRESH_MS` pada `app/page.js`).
- Endpoint `/api/wallets` dan `/api/tokens` mengambil hasil **cache** Dune (`GET /query/{id}/results`),
  bukan trigger eksekusi baru setiap request — ini supaya tidak boros credit Dune API.
- Kalau butuh update lebih cepat dari itu, kamu bisa modifikasi API route untuk trigger eksekusi
  manual (`POST /query/{id}/execute`) lalu polling status — tapi ini menghabiskan credit lebih banyak,
  jadi pertimbangkan trade-off-nya.

## 5. Batasan data

Angka `estimated_pnl_usd` di sini adalah **realized P&L kasar** (total sell volume − total buy volume),
belum memperhitungkan posisi yang belum di-close (unrealized) atau slippage/fee. Gunakan sebagai
starting point riset, bukan angka final sebelum memutuskan mengikuti strategi wallet tertentu.
