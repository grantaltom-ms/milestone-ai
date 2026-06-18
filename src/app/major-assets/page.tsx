import { Suspense } from 'react';
import { BuildingSearchSelect } from './BuildingSearchSelect';
import { HubShell } from '../components/HubShell';
import {
  formatAssetTypeLabel,
  getManagedProperties,
  getPropertyAssets,
  getPropertyById,
} from '@/lib/property-assets';

export const dynamic = 'force-dynamic';

interface MajorAssetsPageProps {
  searchParams?: {
    property?: string;
  };
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[rgba(11,27,43,0.12)] bg-[#FAF7F2] px-6 py-10 text-center">
      <p className="font-medium text-[#1A2E44]">Select a building to view its major assets.</p>
      <p className="mt-2 text-sm text-[#0B1B2B]/60">
        Search by property name or filter by manager, then choose a building from the list.
      </p>
    </div>
  );
}

async function AssetRegister({ propertyId }: { propertyId: string }) {
  const [property, assets] = await Promise.all([getPropertyById(propertyId), getPropertyAssets(propertyId)]);

  if (!property) {
    return (
      <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white px-6 py-8 text-sm text-[#0B1B2B]/60">
        Building not found. Choose another property from the list above.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
          Selected building
        </div>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1A2E44]">{property.name}</h2>
        <p className="mt-1 text-sm text-[#0B1B2B]/60">Manager: {property.manager_name}</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-[rgba(11,27,43,0.08)] bg-white">
        <div className="grid grid-cols-[1.1fr_0.6fr_1fr_1fr] border-b border-[rgba(11,27,43,0.08)] bg-[#F5F1E8] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#0B1B2B]/55">
          <div>Asset</div>
          <div>Last updated</div>
          <div>Vendor</div>
          <div>Notes</div>
        </div>
        {assets.length === 0 ? (
          <div className="px-5 py-8 text-sm text-[#0B1B2B]/60">No major assets recorded for this building yet.</div>
        ) : (
          assets.map((asset) => (
            <div
              key={asset.id}
              className="grid grid-cols-[1.1fr_0.6fr_1fr_1fr] border-b border-[rgba(11,27,43,0.06)] px-5 py-4 text-sm last:border-b-0"
            >
              <div className="font-medium text-[#1A2E44]">{formatAssetTypeLabel(asset.asset_type)}</div>
              <div className="text-[#0B1B2B]/70">{asset.last_updated_year ?? '—'}</div>
              <div className="text-[#0B1B2B]/70">{asset.vendor_name ?? '—'}</div>
              <div className="text-[#0B1B2B]/60">{asset.notes ?? '—'}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default async function MajorAssetsPage({ searchParams }: MajorAssetsPageProps) {
  const { properties, source } = await getManagedProperties();
  const selectedPropertyId = searchParams?.property ?? '';

  return (
    <HubShell
      title="Major assets by property"
      badge={source === 'supabase' ? 'Live Supabase property data' : 'Demo property data'}
    >
      <div className="space-y-8">
        <section className="space-y-3">
          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#2E6B5E]">
              Asset register
            </div>
            <h2 className="font-serif text-3xl font-semibold leading-tight text-[#1A2E44]">
              Major building systems and last update history
            </h2>
            <p className="max-w-3xl text-sm leading-6 text-[#0B1B2B]/65">
              Look up roof, boiler, plumbing, electrical, heat, and other major assets for Grant Carlson and Conor
              Murphy managed buildings. Select a property to see when each system was last updated and which vendor
              performed the work.
            </p>
          </div>
        </section>

        <section className="rounded-lg border border-[rgba(11,27,43,0.08)] bg-white p-6">
          <Suspense fallback={<div className="text-sm text-[#0B1B2B]/60">Loading building selector...</div>}>
            <BuildingSearchSelect properties={properties} />
          </Suspense>
        </section>

        <section>{selectedPropertyId ? <AssetRegister propertyId={selectedPropertyId} /> : <EmptyState />}</section>
      </div>
    </HubShell>
  );
}
