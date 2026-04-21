-- supabase/migrations/20260421200000_plan4b_security_hardening.sql
-- Plan 4b security hardening — 2026-04-21
-- Fixes: RLS memoization via param-less SECURITY DEFINER helpers, audit_log INSERT spoofing,
-- rfq-attachments path traversal, bucket size+mime limits, performance indexes.

begin;

-- 1. Param-less is_admin / is_admin_role helpers (SECURITY DEFINER + memoized auth.uid())
--    Using (select auth.uid()) inside helper body gives row-level memoization in RLS context.
--    SECURITY DEFINER + search_path lock prevents hijacking via search_path.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin_role()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
      and role = 'admin'
  );
$$;

-- 2. Drop dangerous + dead audit_log INSERT policy.
--    All audit writes go through service client (bypasses RLS); policy only adds
--    attack surface (authenticated users could spoof entries).
drop policy if exists "authenticated insert audit_log" on public.audit_log;

-- 3. Rebuild policies to use the new param-less helpers (enables memoization).

-- sectors
drop policy if exists "anon read active sectors" on public.sectors;
drop policy if exists "admin_role manage sectors"  on public.sectors;
create policy "anon read active sectors" on public.sectors
  for select to anon, authenticated
  using (active = true or public.is_admin_role());
create policy "admin_role manage sectors" on public.sectors
  for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- clients
drop policy if exists "anon read active clients" on public.clients;
drop policy if exists "admin_role manage clients"  on public.clients;
create policy "anon read active clients" on public.clients
  for select to anon, authenticated
  using (active = true or public.is_admin_role());
create policy "admin_role manage clients" on public.clients
  for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- products
drop policy if exists "anon read active products" on public.products;
drop policy if exists "admin_role manage products"  on public.products;
create policy "anon read active products" on public.products
  for select to anon, authenticated
  using (active = true or public.is_admin_role());
create policy "admin_role manage products" on public.products
  for all to authenticated
  using (public.is_admin_role())
  with check (public.is_admin_role());

-- rfqs
drop policy if exists "anon insert rfq"     on public.rfqs;
drop policy if exists "admin read rfqs"     on public.rfqs;
drop policy if exists "admin update rfqs"   on public.rfqs;
create policy "anon insert rfq" on public.rfqs
  for insert to anon, authenticated
  with check (true);
create policy "admin read rfqs" on public.rfqs
  for select to authenticated
  using (public.is_admin());
create policy "admin update rfqs" on public.rfqs
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users self-read (memoized)
drop policy if exists "self read admin_users" on public.admin_users;
create policy "self read admin_users" on public.admin_users
  for select to authenticated
  using (user_id = (select auth.uid()) or public.is_admin());

-- notification_recipients
drop policy if exists "admin select notification_recipients" on public.notification_recipients;
drop policy if exists "admin manage notification_recipients" on public.notification_recipients;
create policy "admin select notification_recipients" on public.notification_recipients
  for select to authenticated
  using (public.is_admin());
create policy "admin manage notification_recipients" on public.notification_recipients
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- audit_log SELECT
drop policy if exists "admin read audit_log" on public.audit_log;
create policy "admin read audit_log" on public.audit_log
  for select to authenticated
  using (public.is_admin());

-- 4. Storage bucket size + allowed_mime_types enforcement (defense-in-depth).
update storage.buckets
set file_size_limit   = 10485760,  -- 10 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'product-images';

update storage.buckets
set file_size_limit   = 10485760,  -- 10 MB (matches FileUploader client limit)
    allowed_mime_types = array[
      'application/pdf',
      'image/jpeg','image/png','image/webp',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/zip',
      'application/octet-stream',
      'model/step','model/iges'
    ]
where id = 'rfq-attachments';

update storage.buckets
set file_size_limit   = 10485760,  -- 10 MB
    allowed_mime_types = array['image/jpeg','image/png','image/webp']
where id = 'sector-images';

-- 5. rfq-attachments path-traversal fix: enforce UUID folder prefix + safe extension.
drop policy if exists "anon can insert rfq-attachments" on storage.objects;
create policy "anon can insert rfq-attachments" on storage.objects
  for insert to anon, authenticated
  with check (
    bucket_id = 'rfq-attachments'
    and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[^/]+\.(pdf|jpe?g|png|webp|doc|docx|xls|xlsx|zip|step|stp|iges|igs)$'
  );

-- 6. Refresh storage policies to use new param-less helpers.
drop policy if exists "admin can read rfq-attachments"    on storage.objects;
drop policy if exists "admin can delete rfq-attachments"  on storage.objects;
drop policy if exists "admin manage product-images"       on storage.objects;
drop policy if exists "admin manage sector-images"        on storage.objects;

create policy "admin can read rfq-attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin());

create policy "admin can delete rfq-attachments" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin());

create policy "admin manage product-images" on storage.objects
  for all to authenticated
  using  (bucket_id = 'product-images' and public.is_admin_role())
  with check (bucket_id = 'product-images' and public.is_admin_role());

create policy "admin manage sector-images" on storage.objects
  for all to authenticated
  using  (bucket_id = 'sector-images' and public.is_admin_role())
  with check (bucket_id = 'sector-images' and public.is_admin_role());

-- 7. Performance indexes for commonly filtered/ordered columns.
create index if not exists idx_products_active_display_order
  on public.products (active, display_order);

create index if not exists idx_products_sector_id
  on public.products (sector_id);

create index if not exists idx_notification_recipients_active
  on public.notification_recipients (active) where active = true;

create index if not exists idx_rfqs_assigned_to
  on public.rfqs (assigned_to);

commit;
