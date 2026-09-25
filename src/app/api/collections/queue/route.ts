import { NextResponse } from "next/server";
import { getCollectionsQueue } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows, summary } = await getCollectionsQueue();
    return NextResponse.json({
      asOf: rows[0]?.snapshot_date ?? null,
      rows,
      summary,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
