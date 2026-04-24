-- supabase/migrations/20260424090000_plan5c_sectors_references_crud.sql
-- Plan 5c Part 1: Sectors content extension + References display_name + sector_id FK
--                 + client-logos bucket + bucket hardening (file_size_limit, mime)

-- ============================================================
-- 1. Sectors: 4 yeni kolon (Section 3 Spec)
-- ============================================================
alter table public.sectors
  add column if not exists hero_image jsonb,
  add column if not exists long_description jsonb,
  add column if not exists meta_title jsonb,
  add column if not exists meta_description jsonb;

-- ============================================================
-- 2. Clients: display_name + sector_id FK
-- ============================================================
alter table public.clients
  add column if not exists display_name jsonb,
  add column if not exists sector_id uuid references public.sectors(id) on delete set null;

-- Data migration: sector_key camelCase → sector_id UUID
update public.clients
set sector_id = (
  select id from public.sectors where slug = case clients.sector_key
    when 'camYikama' then 'cam-yikama'
    when 'kapak' then 'kapak'
    when 'tekstil' then 'tekstil'
  end
)
where sector_id is null;

-- ============================================================
-- 3. Storage: client-logos bucket + hardening (H4)
-- ============================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'client-logos',
  'client-logos',
  true,
  1048576,  -- 1 MB
  array['image/svg+xml','image/png','image/jpeg','image/webp']
)
on conflict (id) do update set
  public              = excluded.public,
  file_size_limit     = excluded.file_size_limit,
  allowed_mime_types  = excluded.allowed_mime_types;

create policy "public read client-logos" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'client-logos');

create policy "admin manage client-logos" on storage.objects
  for all to authenticated
  using (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'client-logos' and public.is_admin_role(auth.uid()));

-- sector-images bucket Plan 3'te oluşturuldu; hardening idempotent uygula
update storage.buckets set
  file_size_limit    = 5242880,  -- 5 MB
  allowed_mime_types = array['image/png','image/jpeg','image/webp']
where id = 'sector-images';
