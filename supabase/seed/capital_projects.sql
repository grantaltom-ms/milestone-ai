-- Seed sample capital projects and optionally migrate property_major_assets rows.
-- Safe to re-run: uses NOT EXISTS guards.

-- Sample projects for a few known building names if those properties exist.
INSERT INTO capital_projects (
  property_id,
  category,
  title,
  status,
  completed_on,
  vendor_name,
  cost,
  notes
)
SELECT
  p.id,
  seed.category,
  seed.title,
  seed.status,
  seed.completed_on::date,
  seed.vendor_name,
  seed.cost,
  seed.notes
FROM properties p
JOIN (
  VALUES
    ('Ascona', 'roof', 'Full roof replacement', 'completed', '2019-08-15', 'ABC Roofing Co.', 84200, 'TPO membrane, full tear-off'),
    ('Ascona', 'boiler', 'Boiler replacement - unit 2', 'completed', '2021-03-22', 'Seattle Mechanical', 28650, 'Replaced unit #2'),
    ('Ascona', 'electrical', 'Main panel upgrade', 'completed', '2020-11-04', 'Emerald Electric', 18400, 'Panel upgrade'),
    ('Ascona', 'fire_safety', 'Annual fire system inspection', 'completed', '2023-06-12', 'SafeGuard Fire', 2100, NULL),
    ('Galer Crest', 'roof', 'Roof overlay and flashing repairs', 'completed', '2016-09-30', 'ABC Roofing Co.', 51200, NULL),
    ('Galer Crest', 'boiler', 'Boiler service and burner replacement', 'completed', '2019-01-18', 'Seattle Mechanical', 9400, NULL),
    ('Galer Crest', 'windows', 'Common-area window replacement', 'completed', '2015-05-08', 'Pacific Glass', 22300, NULL),
    ('Galer Crest', 'exterior_paint', 'Building exterior paint', 'completed', '2019-07-19', 'Milestone Paint Crew', 31800, NULL),
    ('Queen Anne Flats', 'roof', 'Partial roof section replacement', 'completed', '2020-10-02', 'ABC Roofing Co.', 39750, NULL),
    ('Queen Anne Flats', 'heat', 'Heat system modernization', 'completed', '2022-04-14', 'Seattle Mechanical', 46700, NULL),
    ('Queen Anne Flats', 'plumbing', 'Stack replacement - west wing', 'in_progress', NULL, 'Northwest Plumbing', NULL, 'Phase 1 started Q1'),
    ('Queen Anne Flats', 'elevator', 'Elevator modernization study', 'planned', NULL, NULL, NULL, 'Budgeting for next capital cycle')
) AS seed(property_name, category, title, status, completed_on, vendor_name, cost, notes)
  ON p.name = seed.property_name
WHERE NOT EXISTS (
  SELECT 1
  FROM capital_projects cp
  WHERE cp.property_id = p.id
    AND cp.category = seed.category
    AND cp.title = seed.title
);

-- Migrate any property_major_assets snapshot rows into capital project history
-- when that older table exists. Treat each as one completed project dated Jan 1 of the year.
DO $$
BEGIN
  IF to_regclass('public.property_major_assets') IS NULL THEN
    RAISE NOTICE 'property_major_assets not found; skipping migration.';
    RETURN;
  END IF;

  INSERT INTO capital_projects (
    property_id,
    category,
    title,
    status,
    completed_on,
    vendor_name,
    cost,
    notes
  )
  SELECT
    a.property_id,
    CASE
      WHEN a.asset_type IN (
        'roof', 'boiler', 'plumbing', 'electrical', 'heat', 'water_heater',
        'elevator', 'fire_safety', 'windows', 'exterior_paint'
      ) THEN a.asset_type
      ELSE 'other'
    END AS category,
    initcap(replace(a.asset_type, '_', ' ')) || ' update' AS title,
    'completed' AS status,
    CASE
      WHEN a.last_updated_year IS NOT NULL
        THEN make_date(a.last_updated_year, 1, 1)
      ELSE NULL
    END AS completed_on,
    a.vendor_name,
    NULL::numeric AS cost,
    COALESCE(a.notes, 'Migrated from property_major_assets snapshot') AS notes
  FROM property_major_assets a
  WHERE NOT EXISTS (
    SELECT 1
    FROM capital_projects cp
    WHERE cp.property_id = a.property_id
      AND cp.category = CASE
        WHEN a.asset_type IN (
          'roof', 'boiler', 'plumbing', 'electrical', 'heat', 'water_heater',
          'elevator', 'fire_safety', 'windows', 'exterior_paint'
        ) THEN a.asset_type
        ELSE 'other'
      END
      AND cp.notes ILIKE '%Migrated from property_major_assets%'
  );
END $$;
