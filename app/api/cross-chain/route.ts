import { NextResponse } from "next/server";
import { fetchCrossChainOpportunities } from "@/lib/defillama";

export async function GET() {
  try {
    const opportunities = await fetchCrossChainOpportunities();
    return NextResponse.json({ opportunities, fetchedAt: Date.now() });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
