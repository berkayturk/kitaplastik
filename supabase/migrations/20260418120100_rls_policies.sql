-- supabase/migrations/20260418120100_rls_policies.sql

alter table public.sectors                 enable row level security;
alter table public.clients                 enable row level security;
alter table public.products                enable row level security;
alter table public.rfqs                    enable row level security;
alter table public.admin_users             enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.audit_log               enable row level security;

create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.admin_users where user_id = uid);
$$;

create or replace function public.is_admin_role(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.admin_users where user_id = uid and role = 'admin');
$$;

create policy "anon read active sectors" on public.sectors
  for select to anon, authenticated using (active = true);

create policy "anon read active clients" on public.clients
  for select to anon, authenticated using (active = true);

create policy "anon read active products" on public.products
  for select to anon, authenticated using (active = true);

create policy "anon insert rfq" on public.rfqs
  for insert to anon, authenticated with check (true);

create policy "admin read rfqs" on public.rfqs
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admin update rfqs" on public.rfqs
  for update to authenticated using (public.is_admin(auth.uid()));

create policy "self read admin_users" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

create policy "admin select notification_recipients" on public.notification_recipients
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admin manage notification_recipients" on public.notification_recipients
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "admin read audit_log" on public.audit_log
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "authenticated insert audit_log" on public.audit_log
  for insert to authenticated with check (true);

create policy "admin_role manage products" on public.products
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

create policy "admin_role manage sectors" on public.sectors
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

create policy "admin_role manage clients" on public.clients
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));
