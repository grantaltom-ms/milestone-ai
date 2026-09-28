import { NextRequest, NextResponse } from 'next/server';
import {
  createCapitalProject,
  listCapitalProjects,
  type CapitalProjectInput,
  validateCapitalProjectInput,
} from '@/lib/capital-projects';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const propertyIdRaw = req.nextUrl.searchParams.get('propertyId');
  const propertyId = propertyIdRaw ? Number(propertyIdRaw) : undefined;

  if (propertyIdRaw && (!Number.isFinite(propertyId) || Number(propertyId) <= 0)) {
    return NextResponse.json({ error: 'propertyId must be a positive number' }, { status: 400 });
  }

  const result = await listCapitalProjects(propertyId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ projects: result.data });
}

export async function POST(req: NextRequest) {
  let body: Partial<CapitalProjectInput>;
  try {
    body = (await req.json()) as Partial<CapitalProjectInput>;
  } catch {
    return NextResponse.json({ error: 'Body must be JSON' }, { status: 400 });
  }

  const problem = validateCapitalProjectInput(body);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  const result = await createCapitalProject(body as CapitalProjectInput);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  return NextResponse.json({ project: result.data }, { status: 201 });
}
