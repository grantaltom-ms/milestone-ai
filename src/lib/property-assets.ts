import { getSupabase, hasSupabaseConfig } from './supabase';

export const MANAGED_MANAGER_NAMES = ['Grant Carlson', 'Conor Murphy'] as const;

export const ASSET_TYPE_ORDER = [
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
] as const;

export type AssetType = (typeof ASSET_TYPE_ORDER)[number];

export interface Property {
  id: string;
  name: string;
  manager_name: string;
  address: string | null;
}

export interface PropertyMajorAsset {
  id: string;
  asset_type: string;
  last_updated_year: number | null;
  vendor_name: string | null;
  notes: string | null;
}

export interface PropertyAssetsResult {
  properties: Property[];
  source: 'supabase' | 'demo';
}

const DEMO_PROPERTIES: Property[] = [
  { id: 'demo-ascona', name: 'Ascona', manager_name: 'Grant Carlson', address: null },
  { id: 'demo-galer-crest', name: 'Galer Crest', manager_name: 'Conor Murphy', address: null },
  { id: 'demo-queen-anne', name: 'Queen Anne Flats', manager_name: 'Conor Murphy', address: null },
];

const DEMO_ASSETS: Record<string, PropertyMajorAsset[]> = {
  'demo-ascona': [
    { id: '1', asset_type: 'roof', last_updated_year: 2019, vendor_name: 'ABC Roofing Co.', notes: null },
    { id: '2', asset_type: 'boiler', last_updated_year: 2021, vendor_name: 'Seattle Mechanical', notes: 'Replaced unit #2' },
    { id: '3', asset_type: 'plumbing', last_updated_year: 2018, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '4', asset_type: 'electrical', last_updated_year: 2020, vendor_name: 'Emerald Electric', notes: 'Panel upgrade' },
    { id: '5', asset_type: 'heat', last_updated_year: 2021, vendor_name: 'Seattle Mechanical', notes: null },
    { id: '6', asset_type: 'water_heater', last_updated_year: 2022, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '7', asset_type: 'elevator', last_updated_year: null, vendor_name: null, notes: 'Not applicable' },
    { id: '8', asset_type: 'fire_safety', last_updated_year: 2023, vendor_name: 'SafeGuard Fire', notes: 'Annual inspection current' },
    { id: '9', asset_type: 'windows', last_updated_year: 2017, vendor_name: 'Pacific Glass', notes: null },
    { id: '10', asset_type: 'exterior_paint', last_updated_year: 2020, vendor_name: 'Milestone Paint Crew', notes: null },
  ],
  'demo-galer-crest': [
    { id: '11', asset_type: 'roof', last_updated_year: 2016, vendor_name: 'ABC Roofing Co.', notes: null },
    { id: '12', asset_type: 'boiler', last_updated_year: 2019, vendor_name: 'Seattle Mechanical', notes: null },
    { id: '13', asset_type: 'plumbing', last_updated_year: 2020, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '14', asset_type: 'electrical', last_updated_year: 2018, vendor_name: 'Emerald Electric', notes: null },
    { id: '15', asset_type: 'heat', last_updated_year: 2019, vendor_name: 'Seattle Mechanical', notes: null },
    { id: '16', asset_type: 'water_heater', last_updated_year: 2021, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '17', asset_type: 'elevator', last_updated_year: null, vendor_name: null, notes: 'Not applicable' },
    { id: '18', asset_type: 'fire_safety', last_updated_year: 2024, vendor_name: 'SafeGuard Fire', notes: null },
    { id: '19', asset_type: 'windows', last_updated_year: 2015, vendor_name: 'Pacific Glass', notes: null },
    { id: '20', asset_type: 'exterior_paint', last_updated_year: 2019, vendor_name: 'Milestone Paint Crew', notes: null },
  ],
  'demo-queen-anne': [
    { id: '21', asset_type: 'roof', last_updated_year: 2020, vendor_name: 'ABC Roofing Co.', notes: null },
    { id: '22', asset_type: 'boiler', last_updated_year: 2022, vendor_name: 'Seattle Mechanical', notes: null },
    { id: '23', asset_type: 'plumbing', last_updated_year: 2019, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '24', asset_type: 'electrical', last_updated_year: 2021, vendor_name: 'Emerald Electric', notes: null },
    { id: '25', asset_type: 'heat', last_updated_year: 2022, vendor_name: 'Seattle Mechanical', notes: null },
    { id: '26', asset_type: 'water_heater', last_updated_year: 2023, vendor_name: 'Northwest Plumbing', notes: null },
    { id: '27', asset_type: 'elevator', last_updated_year: null, vendor_name: null, notes: 'Not applicable' },
    { id: '28', asset_type: 'fire_safety', last_updated_year: 2024, vendor_name: 'SafeGuard Fire', notes: null },
    { id: '29', asset_type: 'windows', last_updated_year: 2018, vendor_name: 'Pacific Glass', notes: null },
    { id: '30', asset_type: 'exterior_paint', last_updated_year: 2021, vendor_name: 'Milestone Paint Crew', notes: null },
  ],
};

export function formatAssetTypeLabel(assetType: string): string {
  return assetType
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function sortAssets(assets: PropertyMajorAsset[]): PropertyMajorAsset[] {
  const order = new Map(ASSET_TYPE_ORDER.map((type, index) => [type, index]));
  return [...assets].sort((a, b) => {
    const aIndex = order.get(a.asset_type as AssetType) ?? 999;
    const bIndex = order.get(b.asset_type as AssetType) ?? 999;
    return aIndex - bIndex;
  });
}

export async function getManagedProperties(managerName?: string): Promise<PropertyAssetsResult> {
  if (!hasSupabaseConfig()) {
    const properties = managerName
      ? DEMO_PROPERTIES.filter((property) => property.manager_name === managerName)
      : DEMO_PROPERTIES;
    return { properties, source: 'demo' };
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from('properties')
      .select('id, name, manager_name, address')
      .eq('is_active', true)
      .in('manager_name', [...MANAGED_MANAGER_NAMES])
      .order('name', { ascending: true });

    if (managerName) {
      query = query.eq('manager_name', managerName);
    }

    const { data, error } = await query;
    if (error) {
      console.error('[property-assets] getManagedProperties error', error);
      return { properties: DEMO_PROPERTIES, source: 'demo' };
    }

    return { properties: (data ?? []) as Property[], source: 'supabase' };
  } catch (error) {
    console.error('[property-assets] getManagedProperties unexpected', error);
    return { properties: DEMO_PROPERTIES, source: 'demo' };
  }
}

export async function getPropertyAssets(propertyId: string): Promise<PropertyMajorAsset[]> {
  if (!hasSupabaseConfig() || propertyId.startsWith('demo-')) {
    return sortAssets(DEMO_ASSETS[propertyId] ?? []);
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('property_major_assets')
      .select('id, asset_type, last_updated_year, vendor_name, notes')
      .eq('property_id', propertyId);

    if (error) {
      console.error('[property-assets] getPropertyAssets error', error);
      return [];
    }

    return sortAssets((data ?? []) as PropertyMajorAsset[]);
  } catch (error) {
    console.error('[property-assets] getPropertyAssets unexpected', error);
    return [];
  }
}

export async function getPropertyById(propertyId: string): Promise<Property | null> {
  if (!hasSupabaseConfig() || propertyId.startsWith('demo-')) {
    return DEMO_PROPERTIES.find((property) => property.id === propertyId) ?? null;
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('properties')
      .select('id, name, manager_name, address')
      .eq('id', propertyId)
      .in('manager_name', [...MANAGED_MANAGER_NAMES])
      .maybeSingle();

    if (error) {
      console.error('[property-assets] getPropertyById error', error);
      return null;
    }

    return (data as Property | null) ?? null;
  } catch (error) {
    console.error('[property-assets] getPropertyById unexpected', error);
    return null;
  }
}
