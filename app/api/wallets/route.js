import { NextResponse } from "next/server";

// Ambil hasil TERBARU yang sudah di-cache Dune (tidak charge credit setiap panggilan).
// Query harus punya scheduled refresh di Dune (bisa diatur di query settings)
// supaya datanya "hampir realtime" tanpa trigger eksekusi manual tiap request.
export async function GET() {
  const apiKey = process.env.DUNE_API_KEY;
  const queryId = process.env.DUNE_WALLET_SUMMARY_QUERY_ID;

  if (!apiKey || !queryId) {
    return NextResponse.json(
      { error: "DUNE_API_KEY atau DUNE_WALLET_SUMMARY_QUERY_ID belum diset di environment variables." },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results?limit=50`,
      {
        headers: { "X-Dune-API-Key": apiKey },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Dune API error: ${res.status} ${text}` },
        { status: res.status }
      );
    }

    const data = await res.json();
    const rows = data?.result?.rows ?? [];
    const lastRun = data?.execution_ended_at ?? null;

    return NextResponse.json({ rows, lastRun });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
