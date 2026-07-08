import { NextResponse } from "next/server";
import { fetchSameChainOpportunities } from "@/lib/dune";

export async function GET() {
  try {
    const opportunities = await fetchSameChainOpportunities();
    return NextResponse.json({ opportunities, fetchedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
