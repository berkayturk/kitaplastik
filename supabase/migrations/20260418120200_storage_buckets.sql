-- supabase/migrations/20260418120200_storage_buckets.sql

insert into storage.buckets (id, name, public)
values ('rfq-attachments', 'rfq-attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sector-images', 'sector-images', true)
on conflict (id) do nothing;

create policy "anon can insert rfq-attachments" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'rfq-attachments');

create policy "admin can read rfq-attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin(auth.uid()));

create policy "admin can delete rfq-attachments" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin(auth.uid()));

create policy "public read product-images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'product-images');

create policy "admin manage product-images" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'product-images' and public.is_admin_role(auth.uid()));

create policy "public read sector-images" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'sector-images');

create policy "admin manage sector-images" on storage.objects
  for all to authenticated
  using (bucket_id = 'sector-images' and public.is_admin_role(auth.uid()))
  with check (bucket_id = 'sector-images' and public.is_admin_role(auth.uid()));
