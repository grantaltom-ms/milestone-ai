-- Capital project history: multiple major projects per property over time.
-- property_id is bigint to match the existing AppFolio-backed properties.id.

CREATE TABLE IF NOT EXISTS capital_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id bigint NOT NULL REFERENCES properties (id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  status text NOT NULL DEFAULT 'completed',
  completed_on date,
  vendor_name text,
  cost numeric(12, 2),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT capital_projects_status_check CHECK (
    status IN ('planned', 'in_progress', 'completed', 'cancelled')
  ),
  CONSTRAINT capital_projects_category_check CHECK (
    category IN (
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
      'other'
    )
  ),
  CONSTRAINT capital_projects_cost_check CHECK (cost IS NULL OR cost >= 0)
);

CREATE INDEX IF NOT EXISTS capital_projects_property_id_idx
  ON capital_projects (property_id);

CREATE INDEX IF NOT EXISTS capital_projects_category_idx
  ON capital_projects (category);

CREATE INDEX IF NOT EXISTS capital_projects_completed_on_idx
  ON capital_projects (completed_on DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS capital_projects_status_idx
  ON capital_projects (status);

ALTER TABLE capital_projects ENABLE ROW LEVEL SECURITY;

-- Optional helper columns on properties if they are not already present.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
