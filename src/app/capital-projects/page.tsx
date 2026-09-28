import { Suspense } from 'react';
import { CapitalProjectsClient } from './CapitalProjectsClient';
import { listCapitalProjects, listProperties } from '@/lib/capital-projects';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams?: {
    property?: string;
  };
};

export default async function CapitalProjectsPage({ searchParams }: PageProps) {
  const selectedPropertyId = searchParams?.property ? Number(searchParams.property) : null;
  const validPropertyId =
    selectedPropertyId && Number.isFinite(selectedPropertyId) && selectedPropertyId > 0
      ? selectedPropertyId
      : null;

  const [propertiesResult, projectsResult] = await Promise.all([
    listProperties(),
    validPropertyId
      ? listCapitalProjects(validPropertyId)
      : Promise.resolve({ ok: true as const, data: [] as Awaited<ReturnType<typeof listCapitalProjects>> extends { ok: true; data: infer D } ? D : never }),
  ]);

  const properties = propertiesResult.ok ? propertiesResult.data : [];
  const projects = projectsResult.ok ? projectsResult.data : [];

  const sourceLabel =
    !propertiesResult.ok || !projectsResult.ok
      ? `Data issue: ${propertiesResult.ok ? '' : propertiesResult.error}${
          !propertiesResult.ok && !projectsResult.ok ? ' · ' : ''
        }${projectsResult.ok ? '' : projectsResult.error}`
      : process.env.SUPABASE_URL
        ? 'Live Supabase capital project data'
        : 'Demo capital project data';

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <header className="mb-8">
        <p className="ms-eyebrow">Building capital history</p>
        <h1 className="mt-1 font-heading text-3xl font-semibold text-navy">Capital projects</h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-muted">
          Track major work by building over time — roof replacements, boilers, plumbing, electrical, heat, and other
          capital projects — with dates, vendors, costs, and notes.
        </p>
      </header>

      {(!propertiesResult.ok || !projectsResult.ok) && (
        <section className="mb-6 ms-card border-red-200 bg-red-50 text-sm text-red-700">
          {sourceLabel}. Showing whatever data could be loaded.
        </section>
      )}

      <Suspense fallback={<div className="ms-card text-sm text-ink-muted">Loading capital projects…</div>}>
        <CapitalProjectsClient
          properties={properties}
          initialProjects={projects}
          selectedPropertyId={validPropertyId}
          sourceLabel={
            propertiesResult.ok && projectsResult.ok
              ? sourceLabel
              : process.env.SUPABASE_URL
                ? 'Live Supabase capital project data'
                : 'Demo capital project data'
          }
        />
      </Suspense>
    </div>
  );
}
