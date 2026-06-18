-- Seed managed properties and standard major asset rows.
-- Replace property names with the live portfolio list when available.

INSERT INTO properties (name, manager_name, address) VALUES
  ('Ascona', 'Grant Carlson', NULL),
  ('Galer Crest', 'Conor Murphy', NULL),
  ('Queen Anne Flats', 'Conor Murphy', NULL),
  ('Ballard Commons', 'Grant Carlson', NULL),
  ('Fremont Terrace', 'Grant Carlson', NULL)
ON CONFLICT (name) DO NOTHING;

-- Standard asset types for every managed property.
INSERT INTO property_major_assets (property_id, asset_type, last_updated_year, vendor_name, notes)
SELECT
  p.id,
  asset.asset_type,
  asset.last_updated_year,
  asset.vendor_name,
  asset.notes
FROM properties p
CROSS JOIN (
  VALUES
    ('roof', 2019, 'ABC Roofing Co.', NULL),
    ('boiler', 2021, 'Seattle Mechanical', 'Replaced unit #2'),
    ('plumbing', 2018, 'Northwest Plumbing', NULL),
    ('electrical', 2020, 'Emerald Electric', 'Panel upgrade'),
    ('heat', 2021, 'Seattle Mechanical', NULL),
    ('water_heater', 2022, 'Northwest Plumbing', NULL),
    ('elevator', NULL, NULL, 'Not applicable'),
    ('fire_safety', 2023, 'SafeGuard Fire', 'Annual inspection current'),
    ('windows', 2017, 'Pacific Glass', NULL),
    ('exterior_paint', 2020, 'Milestone Paint Crew', NULL)
) AS asset(asset_type, last_updated_year, vendor_name, notes)
WHERE p.manager_name IN ('Grant Carlson', 'Conor Murphy')
ON CONFLICT (property_id, asset_type) DO NOTHING;
