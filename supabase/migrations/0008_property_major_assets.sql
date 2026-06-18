-- Managed properties and major asset register for Grant Carlson and Conor Murphy portfolios.

CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  manager_name text NOT NULL,
  address text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS properties_manager_name_idx ON properties (manager_name);
CREATE INDEX IF NOT EXISTS properties_is_active_idx ON properties (is_active);

CREATE TABLE IF NOT EXISTS property_major_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  last_updated_year integer,
  vendor_name text,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT property_major_assets_property_asset_type_key UNIQUE (property_id, asset_type),
  CONSTRAINT property_major_assets_year_check CHECK (
    last_updated_year IS NULL
    OR (last_updated_year >= 1900 AND last_updated_year <= 2100)
  )
);

CREATE INDEX IF NOT EXISTS property_major_assets_property_id_idx ON property_major_assets (property_id);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_major_assets ENABLE ROW LEVEL SECURITY;
