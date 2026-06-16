create table if not exists pov_notices (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid references delinquency_candidates(id) on delete set null,
  tenant_name text not null,
  property_name text not null,
  unit text not null,
  manager_name text not null,
  google_doc_id text,
  google_doc_url text,
  status text not null default 'draft' check (status in ('draft', 'approved', 'served', 'voided')),
  notes text,
  created_at timestamptz not null default now(),
  served_at timestamptz,
  voided_at timestamptz
);

alter table pov_notices enable row level security;
