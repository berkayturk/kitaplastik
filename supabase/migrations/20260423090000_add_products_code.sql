-- =====================================================================
-- Add products.code — editorial catalog code (e.g. KP-0214)
-- =====================================================================
-- Context: dynamic catalog PDF renders an uppercase mono product code in
-- the top-right of each product row (design spec). Stored separately from
-- slug because editorial code format and slug casing differ.
-- Nullable at introduction; template falls back to upper(slug) until
-- admins backfill existing rows via the admin UI (next deploy).

alter table public.products
  add column if not exists code text;

create unique index if not exists products_code_unique_idx
  on public.products (code)
  where code is not null;

comment on column public.products.code is
  'Optional editorial catalog code (e.g. ''KP-0214''). Unique when present. Displayed in the PDF catalog row header.';
