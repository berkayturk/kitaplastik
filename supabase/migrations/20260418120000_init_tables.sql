-- supabase/migrations/20260418120000_init_tables.sql
-- Kıta Plastik — Plan 3 init tables

-- ENUM types
create type rfq_type as enum ('custom', 'standart');
create type rfq_status as enum ('new', 'reviewing', 'quoted', 'won', 'lost', 'archived');
create type admin_role as enum ('admin', 'sales', 'viewer');

-- sectors: 3 sabit satır seed'de; i18n JSONB
create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null,
  description jsonb,
  hero_color text,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- clients: referanslar (eski lib/references/data.ts)
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  logo_path text not null,
  sector_key text not null,
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- products: Plan 3 kapsamında sadece tablo + RLS; CRUD yok, seed yok (Plan 4)
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name jsonb not null,
  description jsonb,
  sector_id uuid references public.sectors(id) on delete set null,
  images jsonb,
  specs jsonb,
  variants jsonb,
  active boolean not null default true,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- rfqs
create table public.rfqs (
  id uuid primary key default gen_random_uuid(),
  type rfq_type not null,
  status rfq_status not null default 'new',
  locale text not null,
  contact jsonb not null,
  payload jsonb not null,
  attachments jsonb not null default '[]'::jsonb,
  internal_notes text,
  assigned_to uuid references auth.users(id) on delete set null,
  ip_address inet,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_rfqs_status      on public.rfqs(status);
create index idx_rfqs_type        on public.rfqs(type);
create index idx_rfqs_created_at  on public.rfqs(created_at desc);

-- admin_users
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role admin_role not null default 'viewer',
  display_name text,
  created_at timestamptz not null default now()
);

-- notification_recipients
create table public.notification_recipients (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  rfq_types rfq_type[] not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- audit_log
create table public.audit_log (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  diff jsonb,
  ip_address inet,
  created_at timestamptz not null default now()
);

create index idx_audit_log_entity on public.audit_log(entity_type, entity_id);
create index idx_audit_log_user   on public.audit_log(user_id);

-- updated_at trigger helper
create or replace function public.tg_touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create trigger sectors_touch  before update on public.sectors  for each row execute function public.tg_touch_updated_at();
create trigger products_touch before update on public.products for each row execute function public.tg_touch_updated_at();
create trigger rfqs_touch     before update on public.rfqs     for each row execute function public.tg_touch_updated_at();
