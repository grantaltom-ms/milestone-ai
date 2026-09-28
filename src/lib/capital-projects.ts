import { unstable_noStore as noStore } from 'next/cache';
import { getSupabase } from './supabase';

export const CAPITAL_PROJECT_CATEGORIES = [
  'roof',
  'boiler',
  'plumbing',
  'electrical',
  'heat',
  'water_heater',
  'elevator',
  'fire_safety',
  'windows',
  'exterior_paint',
  'siding',
  'parking',
  'landscaping',
  'unit_rehab',
  'other',
] as const;

export const CAPITAL_PROJECT_STATUSES = [
  'planned',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type CapitalProjectCategory = (typeof CAPITAL_PROJECT_CATEGORIES)[number];
export type CapitalProjectStatus = (typeof CAPITAL_PROJECT_STATUSES)[number];

export type PropertyOption = {
  id: number;
  name: string;
  managerName: string | null;
};

export type CapitalProject = {
  id: string;
  propertyId: number;
  propertyName: string;
  category: CapitalProjectCategory;
  title: string;
  status: CapitalProjectStatus;
  completedOn: string | null;
  vendorName: string | null;
  cost: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CapitalProjectInput = {
  propertyId: number;
  category: CapitalProjectCategory;
  title: string;
  status: CapitalProjectStatus;
  completedOn?: string | null;
  vendorName?: string | null;
  cost?: number | null;
  notes?: string | null;
};

export type DataResult<T> = { ok: true; data: T } | { ok: false; error: string };

type PropertyRow = {
  id: number | string;
  name: string | null;
  manager_name?: string | null;
};

type ProjectRow = {
  id: string;
  property_id: number | string;
  category: string;
  title: string;
  status: string;
  completed_on: string | null;
  vendor_name: string | null;
  cost: number | string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  properties?: { name: string | null } | { name: string | null }[] | null;
};

const DEMO_PROPERTIES: PropertyOption[] = [
  { id: 1, name: 'Ascona', managerName: 'Grant Carlson' },
  { id: 2, name: 'Galer Crest', managerName: 'Conor Murphy' },
  { id: 3, name: 'Queen Anne Flats', managerName: 'Conor Murphy' },
];

const DEMO_PROJECTS: CapitalProject[] = [
  {
    id: 'demo-1',
    propertyId: 1,
    propertyName: 'Ascona',
    category: 'roof',
    title: 'Full roof replacement',
    status: 'completed',
    completedOn: '2019-08-15',
    vendorName: 'ABC Roofing Co.',
    cost: 84200,
    notes: 'TPO membrane, full tear-off',
    createdAt: '2019-08-15T00:00:00.000Z',
    updatedAt: '2019-08-15T00:00:00.000Z',
  },
  {
    id: 'demo-2',
    propertyId: 1,
    propertyName: 'Ascona',
    category: 'boiler',
    title: 'Boiler replacement - unit 2',
    status: 'completed',
    completedOn: '2021-03-22',
    vendorName: 'Seattle Mechanical',
    cost: 28650,
    notes: 'Replaced unit #2',
    createdAt: '2021-03-22T00:00:00.000Z',
    updatedAt: '2021-03-22T00:00:00.000Z',
  },
  {
    id: 'demo-3',
    propertyId: 2,
    propertyName: 'Galer Crest',
    category: 'roof',
    title: 'Roof overlay and flashing repairs',
    status: 'completed',
    completedOn: '2016-09-30',
    vendorName: 'ABC Roofing Co.',
    cost: 51200,
    notes: null,
    createdAt: '2016-09-30T00:00:00.000Z',
    updatedAt: '2016-09-30T00:00:00.000Z',
  },
  {
    id: 'demo-4',
    propertyId: 3,
    propertyName: 'Queen Anne Flats',
    category: 'plumbing',
    title: 'Stack replacement - west wing',
    status: 'in_progress',
    completedOn: null,
    vendorName: 'Northwest Plumbing',
    cost: null,
    notes: 'Phase 1 started Q1',
    createdAt: '2026-01-10T00:00:00.000Z',
    updatedAt: '2026-01-10T00:00:00.000Z',
  },
];

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function formatCategoryLabel(category: string) {
  return category
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatStatusLabel(status: string) {
  return formatCategoryLabel(status);
}

export function isCapitalProjectCategory(value: unknown): value is CapitalProjectCategory {
  return typeof value === 'string' && (CAPITAL_PROJECT_CATEGORIES as readonly string[]).includes(value);
}

export function isCapitalProjectStatus(value: unknown): value is CapitalProjectStatus {
  return typeof value === 'string' && (CAPITAL_PROJECT_STATUSES as readonly string[]).includes(value);
}

function propertyNameFromJoin(row: ProjectRow) {
  if (Array.isArray(row.properties)) return row.properties[0]?.name ?? null;
  return row.properties?.name ?? null;
}

function mapProject(row: ProjectRow, propertyNames?: Map<number, string>): CapitalProject {
  const propertyId = Number(row.property_id);
  return {
    id: row.id,
    propertyId,
    propertyName: propertyNameFromJoin(row) || propertyNames?.get(propertyId) || `Property ${propertyId}`,
    category: row.category as CapitalProjectCategory,
    title: row.title,
    status: row.status as CapitalProjectStatus,
    completedOn: row.completed_on,
    vendorName: row.vendor_name,
    cost: row.cost === null || row.cost === undefined ? null : Number(row.cost),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sortProjects(projects: CapitalProject[]) {
  return [...projects].sort((a, b) => {
    const aDate = a.completedOn ?? '';
    const bDate = b.completedOn ?? '';
    if (aDate !== bDate) return bDate.localeCompare(aDate);
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function latestCompletedByCategory(projects: CapitalProject[]) {
  const latest = new Map<CapitalProjectCategory, CapitalProject>();
  for (const project of sortProjects(projects)) {
    if (project.status !== 'completed') continue;
    if (!latest.has(project.category)) latest.set(project.category, project);
  }
  return latest;
}

export function validateCapitalProjectInput(
  body: Partial<CapitalProjectInput>,
  { partial = false }: { partial?: boolean } = {}
): string | null {
  if (!partial || body.propertyId !== undefined) {
    if (!Number.isFinite(Number(body.propertyId)) || Number(body.propertyId) <= 0) {
      return 'propertyId must be a positive number';
    }
  }

  if (!partial || body.category !== undefined) {
    if (!isCapitalProjectCategory(body.category)) return 'category is invalid';
  }

  if (!partial || body.title !== undefined) {
    if (typeof body.title !== 'string' || !body.title.trim()) return 'title is required';
    if (body.title.trim().length > 200) return 'title must be 200 characters or fewer';
  }

  if (!partial || body.status !== undefined) {
    if (!isCapitalProjectStatus(body.status)) return 'status is invalid';
  }

  if (body.completedOn !== undefined && body.completedOn !== null && body.completedOn !== '') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.completedOn)) {
      return 'completedOn must be YYYY-MM-DD';
    }
  }

  if (body.cost !== undefined && body.cost !== null) {
    if (!Number.isFinite(Number(body.cost)) || Number(body.cost) < 0) {
      return 'cost must be a non-negative number';
    }
  }

  if (body.vendorName !== undefined && body.vendorName !== null && body.vendorName.length > 200) {
    return 'vendorName must be 200 characters or fewer';
  }

  if (body.notes !== undefined && body.notes !== null && body.notes.length > 2000) {
    return 'notes must be 2000 characters or fewer';
  }

  return null;
}

export async function listProperties(): Promise<DataResult<PropertyOption[]>> {
  noStore();
  if (!hasSupabaseConfig()) {
    return { ok: true, data: DEMO_PROPERTIES };
  }

  try {
    const sb = getSupabase();
    const primary = await sb
      .from('properties')
      .select('id, name, manager_name')
      .order('name', { ascending: true });

    let rows: PropertyRow[] = [];
    if (primary.error && /manager_name/.test(primary.error.message)) {
      const fallback = await sb.from('properties').select('id, name').order('name', { ascending: true });
      if (fallback.error) return { ok: false, error: fallback.error.message };
      rows = (fallback.data ?? []) as PropertyRow[];
    } else if (primary.error) {
      return { ok: false, error: primary.error.message };
    } else {
      rows = (primary.data ?? []) as PropertyRow[];
    }

    const properties = rows
      .map((row) => ({
        id: Number(row.id),
        name: row.name || `Property ${row.id}`,
        managerName: row.manager_name ?? null,
      }))
      .filter((row) => Number.isFinite(row.id));

    return { ok: true, data: properties };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function listCapitalProjects(propertyId?: number): Promise<DataResult<CapitalProject[]>> {
  noStore();
  if (!hasSupabaseConfig()) {
    const projects = propertyId
      ? DEMO_PROJECTS.filter((project) => project.propertyId === propertyId)
      : DEMO_PROJECTS;
    return { ok: true, data: sortProjects(projects) };
  }

  try {
    const sb = getSupabase();
    let query = sb
      .from('capital_projects')
      .select(
        'id, property_id, category, title, status, completed_on, vendor_name, cost, notes, created_at, updated_at, properties(name)'
      )
      .order('completed_on', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (propertyId) query = query.eq('property_id', propertyId);

    const { data, error } = await query;
    if (error) {
      // Fallback if the join relation name differs.
      const fallback = sb
        .from('capital_projects')
        .select(
          'id, property_id, category, title, status, completed_on, vendor_name, cost, notes, created_at, updated_at'
        )
        .order('completed_on', { ascending: false, nullsFirst: false })
        .order('updated_at', { ascending: false });
      const withFilter = propertyId ? fallback.eq('property_id', propertyId) : fallback;
      const result = await withFilter;
      if (result.error) return { ok: false, error: result.error.message };

      const names = new Map<number, string>();
      const properties = await listProperties();
      if (properties.ok) {
        for (const property of properties.data) names.set(property.id, property.name);
      }

      return {
        ok: true,
        data: sortProjects(((result.data ?? []) as ProjectRow[]).map((row) => mapProject(row, names))),
      };
    }

    return {
      ok: true,
      data: sortProjects(((data ?? []) as ProjectRow[]).map((row) => mapProject(row))),
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function createCapitalProject(input: CapitalProjectInput): Promise<DataResult<CapitalProject>> {
  noStore();
  const problem = validateCapitalProjectInput(input);
  if (problem) return { ok: false, error: problem };
  if (!hasSupabaseConfig()) return { ok: false, error: 'Supabase is not configured' };

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('capital_projects')
      .insert({
        property_id: input.propertyId,
        category: input.category,
        title: input.title.trim(),
        status: input.status,
        completed_on: input.completedOn || null,
        vendor_name: input.vendorName?.trim() || null,
        cost: input.cost ?? null,
        notes: input.notes?.trim() || null,
      })
      .select(
        'id, property_id, category, title, status, completed_on, vendor_name, cost, notes, created_at, updated_at'
      )
      .single();

    if (error) return { ok: false, error: error.message };

    const properties = await listProperties();
    const names = new Map<number, string>();
    if (properties.ok) {
      for (const property of properties.data) names.set(property.id, property.name);
    }

    return { ok: true, data: mapProject(data as ProjectRow, names) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function updateCapitalProject(
  id: string,
  input: Partial<CapitalProjectInput>
): Promise<DataResult<CapitalProject>> {
  noStore();
  if (!id) return { ok: false, error: 'id is required' };
  const problem = validateCapitalProjectInput(input, { partial: true });
  if (problem) return { ok: false, error: problem };
  if (!hasSupabaseConfig()) return { ok: false, error: 'Supabase is not configured' };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.propertyId !== undefined) patch.property_id = input.propertyId;
  if (input.category !== undefined) patch.category = input.category;
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.status !== undefined) patch.status = input.status;
  if (input.completedOn !== undefined) patch.completed_on = input.completedOn || null;
  if (input.vendorName !== undefined) patch.vendor_name = input.vendorName?.trim() || null;
  if (input.cost !== undefined) patch.cost = input.cost;
  if (input.notes !== undefined) patch.notes = input.notes?.trim() || null;

  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('capital_projects')
      .update(patch)
      .eq('id', id)
      .select(
        'id, property_id, category, title, status, completed_on, vendor_name, cost, notes, created_at, updated_at'
      )
      .single();

    if (error) return { ok: false, error: error.message };

    const properties = await listProperties();
    const names = new Map<number, string>();
    if (properties.ok) {
      for (const property of properties.data) names.set(property.id, property.name);
    }

    return { ok: true, data: mapProject(data as ProjectRow, names) };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

export async function deleteCapitalProject(id: string): Promise<DataResult<{ id: string }>> {
  noStore();
  if (!id) return { ok: false, error: 'id is required' };
  if (!hasSupabaseConfig()) return { ok: false, error: 'Supabase is not configured' };

  try {
    const sb = getSupabase();
    const { error } = await sb.from('capital_projects').delete().eq('id', id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, data: { id } };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
