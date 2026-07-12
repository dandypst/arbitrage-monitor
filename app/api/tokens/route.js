import { NextResponse } from "next/server";

// Query B di Dune sekarang HARUS dibuat sebagai parameterized query dengan
// parameter text bernama "wallet_address", dan filter di SQL-nya pakai:
//   WHERE t.wallet_address = LOWER('{{wallet_address}}')
// Ini menghindari masalah "wallet tidak muncul" karena sebelumnya kita narik
// hanya 1000 baris teratas gabungan semua wallet lalu filter belakangan —
// kalau wallet-nya trading banyak token (seperti wallet high-frequency),
// datanya bisa terpotong dan tidak ikut kebawa.
//
// Trade-off: karena pakai parameter, kita harus TRIGGER eksekusi baru tiap
// wallet diklik (bukan ambil dari cache), jadi ini akan memakai credit Dune
// tiap kali user expand row. Kalau traffic tinggi, pertimbangkan menaikkan
// REFRESH_MS di frontend atau cache hasil per wallet di sisi server.

const DUNE_BASE = "https://api.dune.com/api/v1";

async function pollForResult(executionId, apiKey, maxAttempts = 15) {
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(`${DUNE_BASE}/execution/${executionId}/results`, {
      headers: { "X-Dune-API-Key": apiKey },
      cache: "no-store",
    });
    const data = await res.json();

    if (data.state === "QUERY_STATE_COMPLETED") {
      return data.result?.rows ?? [];
    }
    if (data.state === "QUERY_STATE_FAILED") {
      throw new Error("Eksekusi query Dune gagal: " + JSON.stringify(data.error || data));
    }
    // masih PENDING/EXECUTING, tunggu sebentar lalu coba lagi
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Timeout menunggu hasil query Dune (>22 detik).");
}

export async function GET(request) {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_TOKEN_BREAKDOWN_QUERY_ID;

  if (!apiKey || !queryId) {
    return NextResponse.json(
      { error: "DUNE_API_KEY atau DUNE_TOKEN_BREAKDOWN_QUERY_ID belum diset." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet");

  if (!wallet) {
    return NextResponse.json({ error: "Parameter ?wallet= wajib diisi." }, { status: 400 });
  }

  try {
    const execRes = await fetch(`${DUNE_BASE}/query/${queryId}/execute`, {
      method: "POST",
      headers: {
        "X-Dune-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query_parameters: { wallet_address: wallet.toLowerCase() },
      }),
    });

    if (!execRes.ok) {
      const text = await execRes.text();
      return NextResponse.json(
        { error: `Gagal trigger eksekusi Dune: ${execRes.status} ${text}` },
        { status: execRes.status }
      );
    }

    const execData = await execRes.json();
    const rows = await pollForResult(execData.execution_id, apiKey);

    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

