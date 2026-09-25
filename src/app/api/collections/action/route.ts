import { NextRequest, NextResponse } from "next/server";
import { recordAction, validateAction, type ActionInput } from "@/lib/collections";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: Partial<ActionInput>;
  try {
    body = (await req.json()) as Partial<ActionInput>;
  } catch {
    return NextResponse.json({ error: "Body must be JSON" }, { status: 400 });
  }
  const problem = validateAction(body);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  try {
    const id = await recordAction(body as ActionInput);
    return NextResponse.json({ id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
