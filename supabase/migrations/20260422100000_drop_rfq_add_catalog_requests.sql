-- =====================================================================
-- Drop RFQ system + add catalog_requests table
-- =====================================================================
-- Context: product pivoted from "request a quote" flow to "download
-- catalog PDF by email" flow. RFQ table + bucket no longer needed.
-- Catalog requests are a simple email log for marketing insight + spam
-- detection.

-- ---------------------------------------------------------------------
-- 1. Drop RFQ table (cascade removes dependent policies, indexes).
-- ---------------------------------------------------------------------
drop table if exists public.rfqs cascade;

-- ---------------------------------------------------------------------
-- 2. Drop rfq-attachments storage bucket (objects must go first).
-- ---------------------------------------------------------------------
delete from storage.objects where bucket_id = 'rfq-attachments';
delete from storage.buckets where id = 'rfq-attachments';

-- ---------------------------------------------------------------------
-- 3. Create catalog_requests table.
-- ---------------------------------------------------------------------
create table public.catalog_requests (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  locale text not null check (locale in ('tr', 'en', 'ru', 'ar')),
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now()
);

comment on table public.catalog_requests is
  'Log of catalog PDF email requests. Written by the /api/catalog service client; read by admins only.';

-- ---------------------------------------------------------------------
-- 4. Indexes — fast recent-first listing + dedupe/spam lookups.
-- ---------------------------------------------------------------------
create index idx_catalog_requests_created_at
  on public.catalog_requests (created_at desc);

create index idx_catalog_requests_email
  on public.catalog_requests (email);

-- ---------------------------------------------------------------------
-- 5. RLS — service role writes, admins read via is_admin() helper.
-- ---------------------------------------------------------------------
alter table public.catalog_requests enable row level security;

-- Writes only via service client (which bypasses RLS). The policy
-- below is defence-in-depth: block any authenticated anon/admin INSERT.
create policy "catalog_requests service only insert"
  on public.catalog_requests
  for insert
  to authenticated
  with check (false);

-- Admins can select all rows. `is_admin()` is the param-less, memoized
-- helper from the Plan 4b hardening migration.
create policy "catalog_requests admin select"
  on public.catalog_requests
  for select
  to authenticated
  using ((select is_admin()));
