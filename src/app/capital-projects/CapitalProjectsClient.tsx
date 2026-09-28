'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { fmtMoney, shortDate } from '@/lib/format';
import {
  CAPITAL_PROJECT_CATEGORIES,
  CAPITAL_PROJECT_STATUSES,
  formatCategoryLabel,
  formatStatusLabel,
  latestCompletedByCategory,
  type CapitalProject,
  type CapitalProjectCategory,
  type CapitalProjectStatus,
  type PropertyOption,
} from '@/lib/capital-projects';

type FormState = {
  category: CapitalProjectCategory;
  title: string;
  status: CapitalProjectStatus;
  completedOn: string;
  vendorName: string;
  cost: string;
  notes: string;
};

const emptyForm = (category: CapitalProjectCategory = 'roof'): FormState => ({
  category,
  title: '',
  status: 'completed',
  completedOn: '',
  vendorName: '',
  cost: '',
  notes: '',
});

function projectToForm(project: CapitalProject): FormState {
  return {
    category: project.category,
    title: project.title,
    status: project.status,
    completedOn: project.completedOn ?? '',
    vendorName: project.vendorName ?? '',
    cost: project.cost === null ? '' : String(project.cost),
    notes: project.notes ?? '',
  };
}

function statusClass(status: CapitalProjectStatus) {
  switch (status) {
    case 'completed':
      return 'bg-evergreen/10 text-evergreen';
    case 'in_progress':
      return 'bg-amber-100 text-amber-900';
    case 'planned':
      return 'bg-navy/10 text-navy';
    case 'cancelled':
      return 'bg-stone-200 text-stone-700';
    default:
      return 'bg-stone-100 text-stone-700';
  }
}

export function CapitalProjectsClient({
  properties,
  initialProjects,
  selectedPropertyId,
  sourceLabel,
}: {
  properties: PropertyOption[];
  initialProjects: CapitalProject[];
  selectedPropertyId: number | null;
  sourceLabel: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [projects, setProjects] = useState(initialProjects);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CapitalProjectCategory>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CapitalProjectStatus>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const selectedProperty = useMemo(
    () => properties.find((property) => property.id === selectedPropertyId) ?? null,
    [properties, selectedPropertyId]
  );

  const filteredProperties = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return properties;
    return properties.filter(
      (property) =>
        property.name.toLowerCase().includes(query) ||
        (property.managerName ?? '').toLowerCase().includes(query)
    );
  }, [properties, search]);

  const visibleProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesCategory && matchesStatus;
    });
  }, [categoryFilter, projects, statusFilter]);

  const latestByCategory = useMemo(() => latestCompletedByCategory(projects), [projects]);

  const totalCompletedSpend = useMemo(
    () =>
      projects
        .filter((project) => project.status === 'completed' && project.cost !== null)
        .reduce((sum, project) => sum + (project.cost ?? 0), 0),
    [projects]
  );

  function selectProperty(propertyId: number | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (propertyId) params.set('property', String(propertyId));
    else params.delete('property');
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(emptyForm(categoryFilter === 'all' ? 'roof' : categoryFilter));
    setFormOpen(true);
    setError(null);
  }

  function openEditForm(project: CapitalProject) {
    setEditingId(project.id);
    setForm(projectToForm(project));
    setFormOpen(true);
    setError(null);
  }

  async function refreshProjects(propertyId: number) {
    const response = await fetch(`/api/capital-projects?propertyId=${propertyId}`);
    const payload = (await response.json()) as { projects?: CapitalProject[]; error?: string };
    if (!response.ok) throw new Error(payload.error || 'Failed to refresh projects');
    setProjects(payload.projects ?? []);
  }

  async function saveProject() {
    if (!selectedPropertyId) {
      setError('Select a building first.');
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      propertyId: selectedPropertyId,
      category: form.category,
      title: form.title,
      status: form.status,
      completedOn: form.completedOn || null,
      vendorName: form.vendorName || null,
      cost: form.cost.trim() === '' ? null : Number(form.cost),
      notes: form.notes || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/capital-projects/${editingId}` : '/api/capital-projects',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      );
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Save failed');

      await refreshProjects(selectedPropertyId);
      setFormOpen(false);
      setEditingId(null);
      setForm(emptyForm());
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeProject(projectId: string) {
    if (!selectedPropertyId) return;
    if (!window.confirm('Delete this capital project record?')) return;

    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/capital-projects/${projectId}`, { method: 'DELETE' });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Delete failed');
      await refreshProjects(selectedPropertyId);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="ms-card space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="ms-card-title">Select a building</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Search the managed portfolio, then review and update capital project history.
            </p>
          </div>
          <p className="text-xs text-ink-muted">{sourceLabel}</p>
        </div>

        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search buildings..."
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-evergreen"
        />

        <div className="max-h-64 overflow-auto rounded-md border border-line">
          {filteredProperties.length === 0 ? (
            <p className="px-4 py-3 text-sm text-ink-muted">No buildings match that search.</p>
          ) : (
            filteredProperties.map((property) => {
              const active = property.id === selectedPropertyId;
              return (
                <button
                  key={property.id}
                  type="button"
                  onClick={() => selectProperty(property.id)}
                  className={`flex w-full items-center justify-between gap-4 border-b border-line/70 px-4 py-3 text-left last:border-b-0 ${
                    active ? 'bg-evergreen/10' : 'hover:bg-paper'
                  }`}
                >
                  <span className="font-medium text-navy">{property.name}</span>
                  <span className="text-xs text-ink-muted">{property.managerName || 'Unassigned'}</span>
                </button>
              );
            })
          )}
        </div>
      </section>

      {!selectedProperty ? (
        <section className="ms-card border-dashed">
          <p className="font-medium text-navy">Choose a building to open its capital project history.</p>
          <p className="mt-2 text-sm text-ink-muted">
            Once selected, you can log roof replacements, boiler work, rehabs, and other major projects with dates,
            vendors, and costs.
          </p>
        </section>
      ) : (
        <>
          <section className="ms-card">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="ms-eyebrow">Selected building</p>
                <h2 className="mt-1 font-heading text-2xl font-semibold text-navy">{selectedProperty.name}</h2>
                <p className="mt-1 text-sm text-ink-muted">
                  Manager: {selectedProperty.managerName || 'Unassigned'}
                  {pending ? ' · Refreshing…' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={openCreateForm}
                  className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white hover:bg-navy/90"
                >
                  Add project
                </button>
                <button
                  type="button"
                  onClick={() => selectProperty(null)}
                  className="rounded-md border border-line bg-paper px-4 py-2 text-sm text-ink-muted hover:text-ink"
                >
                  Clear selection
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">Projects logged</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">{projects.length}</p>
              </div>
              <div className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">Completed spend</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">{fmtMoney(totalCompletedSpend)}</p>
              </div>
              <div className="rounded-md border border-line bg-paper p-4">
                <p className="ms-eyebrow">Open / planned</p>
                <p className="mt-2 font-heading text-2xl font-semibold text-navy">
                  {projects.filter((project) => project.status === 'planned' || project.status === 'in_progress').length}
                </p>
              </div>
            </div>
          </section>

          <section className="ms-card">
            <h2 className="ms-card-title">Latest completed by system</h2>
            <p className="mt-1 text-sm text-ink-muted">
              Snapshot of the most recent completed project in each major category.
            </p>
            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {CAPITAL_PROJECT_CATEGORIES.filter((category) =>
                ['roof', 'boiler', 'plumbing', 'electrical', 'heat', 'windows', 'exterior_paint', 'fire_safety'].includes(
                  category
                )
              ).map((category) => {
                const latest = latestByCategory.get(category);
                return (
                  <div key={category} className="rounded-md border border-line bg-paper p-4">
                    <p className="ms-eyebrow">{formatCategoryLabel(category)}</p>
                    {latest ? (
                      <>
                        <p className="mt-2 text-sm font-medium text-navy">{latest.title}</p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {shortDate(latest.completedOn)}
                          {latest.vendorName ? ` · ${latest.vendorName}` : ''}
                        </p>
                      </>
                    ) : (
                      <p className="mt-2 text-sm text-ink-muted">No completed project logged yet.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="ms-card space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="ms-card-title">Project history</h2>
                <p className="mt-1 text-sm text-ink-muted">Full timeline of capital work for this building.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value as 'all' | CapitalProjectCategory)}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="all">All categories</option>
                  {CAPITAL_PROJECT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {formatCategoryLabel(category)}
                    </option>
                  ))}
                </select>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | CapitalProjectStatus)}
                  className="rounded-md border border-line bg-paper px-3 py-2 text-sm"
                >
                  <option value="all">All statuses</option>
                  {CAPITAL_PROJECT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {formatStatusLabel(status)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {formOpen && (
              <div className="rounded-md border border-line bg-paper p-4">
                <h3 className="font-medium text-navy">{editingId ? 'Edit project' : 'Add capital project'}</h3>
                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-muted">Category</span>
                    <select
                      value={form.category}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          category: event.target.value as CapitalProjectCategory,
                        }))
                      }
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    >
                      {CAPITAL_PROJECT_CATEGORIES.map((category) => (
                        <option key={category} value={category}>
                          {formatCategoryLabel(category)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-muted">Status</span>
                    <select
                      value={form.status}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          status: event.target.value as CapitalProjectStatus,
                        }))
                      }
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    >
                      {CAPITAL_PROJECT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {formatStatusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-ink-muted">Title</span>
                    <input
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      placeholder="Full roof replacement"
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-muted">Completed / target date</span>
                    <input
                      type="date"
                      value={form.completedOn}
                      onChange={(event) => setForm((current) => ({ ...current, completedOn: event.target.value }))}
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    />
                  </label>
                  <label className="text-sm">
                    <span className="mb-1 block text-ink-muted">Cost (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.cost}
                      onChange={(event) => setForm((current) => ({ ...current, cost: event.target.value }))}
                      placeholder="84200"
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-ink-muted">Vendor</span>
                    <input
                      value={form.vendorName}
                      onChange={(event) => setForm((current) => ({ ...current, vendorName: event.target.value }))}
                      placeholder="ABC Roofing Co."
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    />
                  </label>
                  <label className="text-sm md:col-span-2">
                    <span className="mb-1 block text-ink-muted">Notes</span>
                    <textarea
                      value={form.notes}
                      onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                      rows={3}
                      placeholder="Scope, warranties, unit numbers, follow-ups..."
                      className="w-full rounded-md border border-line bg-paper-raised px-3 py-2"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveProject}
                    className="rounded-md bg-evergreen px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create project'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => {
                      setFormOpen(false);
                      setEditingId(null);
                      setError(null);
                    }}
                    className="rounded-md border border-line px-4 py-2 text-sm text-ink-muted"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-line">
                    {['Date', 'Category', 'Project', 'Vendor', 'Cost', 'Status', 'Actions'].map((heading) => (
                      <th
                        key={heading}
                        className="pb-2 pr-4 text-left text-xs font-semibold uppercase tracking-wide text-ink-muted"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-sm text-ink-muted">
                        No capital projects match the current filters. Add the first project for this building.
                      </td>
                    </tr>
                  ) : (
                    visibleProjects.map((project) => (
                      <tr key={project.id} className="border-b border-line/70 last:border-0 align-top">
                        <td className="py-3 pr-4 text-sm text-ink">{shortDate(project.completedOn)}</td>
                        <td className="py-3 pr-4 text-sm text-ink-muted">{formatCategoryLabel(project.category)}</td>
                        <td className="py-3 pr-4 text-sm">
                          <div className="font-medium text-navy">{project.title}</div>
                          {project.notes && <div className="mt-1 text-xs text-ink-muted">{project.notes}</div>}
                        </td>
                        <td className="py-3 pr-4 text-sm text-ink-muted">{project.vendorName || '—'}</td>
                        <td className="py-3 pr-4 text-sm text-ink">
                          {project.cost === null ? '—' : fmtMoney(project.cost)}
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(project.status)}`}>
                            {formatStatusLabel(project.status)}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-sm">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => openEditForm(project)}
                              className="text-navy underline-offset-2 hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => removeProject(project.id)}
                              className="text-red-700 underline-offset-2 hover:underline"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
