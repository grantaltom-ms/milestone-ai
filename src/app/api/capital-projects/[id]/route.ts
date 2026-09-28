import { NextRequest, NextResponse } from 'next/server';
import {
  deleteCapitalProject,
  updateCapitalProject,
  type CapitalProjectInput,
  validateCapitalProjectInput,
} from '@/lib/capital-projects';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: {
    id: string;
  };
};

export async function PATCH(req: NextRequest, context: RouteContext) {
  const id = context.params.id;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  let body: Partial<CapitalProjectInput>;
  try {
    body = (await req.json()) as Partial<CapitalProjectInput>;
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const problem = validateCapitalProjectInput(body, { partial: true });
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const result = await updateCapitalProject(id, body);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ project: result.data });
}

export async function DELETE(_req: NextRequest, context: RouteContext) {
  const id = context.params.id;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const result = await deleteCapitalProject(id);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ id: result.data.id });
}
