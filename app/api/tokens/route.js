import { NextResponse } from "next/server";

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

  try {
    const res = await fetch(
      `https://api.dune.com/api/v1/query/${queryId}/results?limit=1000`,
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
    let rows = data?.result?.rows ?? [];

    if (wallet) {
      rows = rows.filter(
        (r) => (r.wallet_address || "").toLowerCase() === wallet.toLowerCase()
      );
    }

    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
