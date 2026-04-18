# Plan 3 — RFQ + Supabase + Admin Paneli

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** RFQ funnel, Supabase veri katmanı, admin paneli ve Contact API migration ile Faz 1 MVP'nin dinamik tarafını tamamlamak.

**Architecture:** Supabase (Postgres + Auth + Storage + RLS) veri katmanı; Next.js 15 App Router + Server Components + Server Actions; Resend ile transactional e-posta (müşteri + ekip); Cloudflare Turnstile + in-memory rate limit + honeypot + audit log ile spam/abuse koruma; `/admin` locale-bağımsız (TR-only) shell, Supabase Auth magic link ile korunuyor; mevcut `lib/references/data.ts` mock'u Supabase `clients` tablosuna migrate olurken public interface sabit kalıyor; mevcut mailto ContactForm, RFQ'larla aynı altyapıyı paylaşan `/api/contact` endpoint'ine geçiriliyor.

**Tech Stack:** Next.js 15.5 + React 19 + TypeScript 5.9 · next-intl 3.26 · Tailwind 4.2 · Supabase Postgres + `@supabase/ssr` 0.10 · Zod 4 · React Hook Form 7 + `@hookform/resolvers` · Resend · `@marsidev/react-turnstile` · Vitest 4 + Playwright · Supabase CLI migrations.

**Kapsam dışı (Plan 4'e):** `/admin/urunler` ve `/admin/sektorler` CRUD (şu an public `/urunler` placeholder olduğu için seed-only), `/admin/ayarlar/sirket` (şu anda `lib/company.ts` hardcoded), `/admin/ayarlar/sablonlar` (şu an `lib/email/templates/` TypeScript), müşteri RFQ tracking, Plausible/Sentry/OG image generator.

---

## Mimari Notlar & Kritik Kararlar

1. **Middleware birleşimi:** Mevcut `middleware.ts` yalnız next-intl routing yapıyor. Plan 3'te **bileşik middleware** kullanacağız: (a) `/admin/*` yolları next-intl'in dışında kalmalı (TR-only admin), (b) her istekte Supabase session cookie refresh olmalı, (c) `/admin/(?!login|auth/callback)` → session yoksa `/admin/login` redirect. Matcher güncellenecek.
2. **Server-only env:** Yeni env değişkenleri (RESEND_API_KEY, TURNSTILE_SECRET_KEY, SUPABASE_SERVICE_ROLE_KEY) sadece server schema'da zorunlu. Mevcut `lib/env.ts` server/public ayrımı korunuyor ama `serverEnvSchema` artık gerçek alanlarla dolu olacak.
3. **Admin locale policy:** Admin yalnız TR. Admin layout `NextIntlClientProvider`'ı TR locale ile manuel kurar — URL'de locale segment yok, next-intl middleware atlar. Admin sayfalarında `useTranslations("admin.*")` zincirleri kullanılacak.
4. **Rate limit:** MVP için in-memory LRU (`lib/rate-limit.ts`), IP başına 5 dk'da 3 RFQ / 5 contact. Serverless cold start'ta sıfırlanabilir → **kabul edilen trade-off**; Plan 4'te Upstash Redis ile upgrade. Bu sınırlı koruma ama Turnstile + honeypot + audit log ile katmanlı.
5. **File uploads:** Custom RFQ dosyaları **client-side** `supabase-js` ile doğrudan `rfq-attachments` bucket'ına (RLS: anon insert) yüklenir; RFQ POST'unda sadece path listesi gelir. Server-side yeniden upload yok (25 MB toplamı Next.js route handler'a basmak istemiyoruz).
6. **Turnstile:** `@marsidev/react-turnstile` bileşeni istemci tarafında token üretir, server `lib/turnstile.ts` siteverify endpoint'inde token'ı doğrular. Test modu için `TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA` (Cloudflare test key).
7. **Zod v4:** Proje zaten `zod@^4.3.6`. `z.string().email()`, `z.string().url()` v4'te geçerli (deprecated değil yalnız `z.email()` kısa yolu eklenmiş). Mevcut `lib/env.ts` pattern'ı izliyoruz.
8. **Magic link callback:** `@supabase/ssr` dokümanında önerildiği gibi `/admin/auth/callback?code=...` → `exchangeCodeForSession` + redirect. Email template'te link `{{ .SiteURL }}/admin/auth/callback?code={{ .Token }}`.
9. **References migration:** Mevcut `getReferences(): ReadonlyArray<Reference>` **senkron**. Migration sonrası `async` hale gelecek (Server Component fetch). Call site'lar (`ReferencesStrip`, `/referanslar/page.tsx`) zaten Server Component → sadece `await` eklemesi yeter. Interface (id, key, logoPath, sectorKey) sabit.
10. **i18n key'lerinin admin'e uzanması:** Admin TR-only ama `messages/tr/admin.json` ekleniyor ve `app/admin/layout.tsx` o namespace'i provide ediyor. EN/RU/AR'de admin keys yok.

## File Structure

Yeni dosyalar:

```
supabase/
├── migrations/
│   ├── 20260418120000_init_tables.sql
│   ├── 20260418120100_rls_policies.sql
│   ├── 20260418120200_storage_buckets.sql
│   └── 20260418120300_seed_reference_data.sql
└── README.md

lib/
├── env.ts                             (REWRITE — add server-only fields)
├── rate-limit.ts                      (NEW)
├── audit.ts                           (NEW)
├── turnstile.ts                       (NEW)
├── supabase/
│   ├── client.ts                      (MODIFY — typed Database generic)
│   ├── server.ts                      (MODIFY — typed)
│   ├── service.ts                     (NEW — service role, admin-only)
│   ├── middleware.ts                  (NEW — updateSession helper)
│   └── types.ts                       (NEW — generated types)
├── email/
│   ├── client.ts                      (NEW)
│   └── templates/
│       ├── contact-team.ts            (NEW)
│       ├── contact-customer.ts        (NEW)
│       ├── rfq-team.ts                (NEW)
│       └── rfq-customer.ts            (NEW)
├── validation/
│   ├── contact.ts                     (NEW)
│   └── rfq.ts                         (NEW)
├── admin/
│   └── auth.ts                        (NEW — requireAdmin, getAdminSession)
└── references/
    └── data.ts                        (REWRITE — async Supabase fetch)

middleware.ts                          (REWRITE — compose next-intl + supabase + admin)

app/
├── api/
│   ├── contact/route.ts               (NEW)
│   └── rfq/route.ts                   (NEW)
├── [locale]/
│   └── teklif-iste/
│       ├── page.tsx                   (NEW — hub)
│       ├── ozel-uretim/page.tsx       (NEW)
│       └── standart/page.tsx          (NEW)
└── admin/
    ├── layout.tsx                     (NEW)
    ├── page.tsx                       (NEW — redirect)
    ├── login/page.tsx                 (NEW)
    ├── auth/callback/route.ts         (NEW)
    ├── inbox/page.tsx                 (NEW)
    ├── inbox/[id]/page.tsx            (NEW)
    ├── inbox/[id]/actions.ts          (NEW)
    └── ayarlar/bildirimler/
        ├── page.tsx                   (NEW)
        └── actions.ts                 (NEW)

components/
├── contact/
│   └── ContactForm.tsx                (REWRITE — /api/contact)
├── rfq/
│   ├── TurnstileWidget.tsx            (NEW)
│   ├── FileUploader.tsx               (NEW)
│   ├── ProductPicker.tsx              (NEW)
│   ├── CustomRfqForm.tsx              (NEW)
│   └── StandartRfqForm.tsx            (NEW)
└── admin/
    ├── Shell.tsx                      (NEW)
    ├── InboxTable.tsx                 (NEW)
    └── StatusBadge.tsx                (NEW)

messages/
├── tr/rfq.json                        (NEW)
├── en/rfq.json                        (NEW)
├── ru/rfq.json                        (NEW)
├── ar/rfq.json                        (NEW)
├── tr/admin.json                      (NEW — TR only)
├── tr/contact-extras.json             (merged into existing pages.contact.form)
└── (existing files referenced)

tests/
├── unit/
│   ├── lib/rate-limit.test.ts         (NEW)
│   ├── lib/turnstile.test.ts          (NEW)
│   ├── lib/audit.test.ts              (NEW)
│   ├── lib/email/templates.test.ts    (NEW)
│   ├── lib/references/data.test.ts    (REWRITE)
│   ├── validation/contact.test.ts     (NEW)
│   └── validation/rfq.test.ts         (NEW)
└── e2e/
    ├── contact.spec.ts                (NEW)
    ├── rfq-custom.spec.ts             (NEW)
    ├── rfq-standart.spec.ts           (NEW)
    └── admin.spec.ts                  (NEW)

.env.example                           (MODIFY — fill Plan 3 keys)
docs/superpowers/RESUME.md             (MODIFY — mark Plan 3 done at end)
```

---

## Phase A — Supabase Projesi, Migration'lar ve Tipler

### Task 1: Supabase CLI'yi kur ve lokal projeyi init et

**Files:**
- Create: `supabase/config.toml` (CLI tarafından)
- Create: `supabase/README.md`

- [ ] **Step 1: Supabase CLI'yi repo'ya bağımlılık olarak ekle**

```bash
pnpm add -D supabase
```

- [ ] **Step 2: Supabase projesini initialize et**

```bash
pnpm exec supabase init
```

Beklenen: `supabase/` dizini + `config.toml` oluşur. `supabase/functions/` eklenebilir — Plan 3'te kullanmıyoruz; kalabilir.

- [ ] **Step 3: `supabase/README.md` yaz (lokal dev + uzak deploy akışı)**

```markdown
# Supabase

## Lokal geliştirme
```bash
pnpm exec supabase start        # Docker gereklidir
pnpm exec supabase db reset     # migrations + seed çalışır
pnpm exec supabase status       # URL/anon key yazdırır → .env.local'e kopyala
```

## Uzak projeye bağlan
```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <ref>
pnpm exec supabase db push      # migrations → remote
pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts
```

Projenin canonical dev değerleri `.env.local` içinde; asla commit etme.
```

- [ ] **Step 4: `.gitignore`'da `supabase/.branches` ve `supabase/.temp` zaten var mı kontrol et, yoksa ekle**

```bash
grep -q "^supabase/\.branches" .gitignore || echo -e "\nsupabase/.branches\nsupabase/.temp" >> .gitignore
```

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml supabase/config.toml supabase/README.md .gitignore
git commit -m "chore(supabase): initialize CLI and local project config"
```

---

### Task 2: Migration 0001 — Tabloları yaz

**Files:**
- Create: `supabase/migrations/20260418120000_init_tables.sql`

- [ ] **Step 1: Migration dosyasını oluştur**

```sql
-- supabase/migrations/20260418120000_init_tables.sql
-- Kıta Plastik — Plan 3 init tables

-- ENUM types
create type rfq_type as enum ('custom', 'standart');
create type rfq_status as enum ('new', 'reviewing', 'quoted', 'won', 'lost', 'archived');
create type admin_role as enum ('admin', 'sales', 'viewer');

-- sectors: yalnız 3 sabit satır tutulacak (seed'de); i18n JSONB
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
  key text unique not null,              -- "c1".."c8", i18n key
  logo_path text not null,               -- "/references/c1.svg"
  sector_key text not null,              -- "camYikama" | "kapak" | "tekstil"
  display_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- products: ürünler (Plan 3 kapsamında sadece tablo + RLS; CRUD yok, seed yok — Plan 4)
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
```

- [ ] **Step 2: SQL syntax'i lokal Supabase ile doğrula**

```bash
pnpm exec supabase start
pnpm exec supabase db reset
```

Beklenen: Tüm migration hatasız uygulanır. Hata varsa SQL'i düzelt; tekrar `db reset`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418120000_init_tables.sql
git commit -m "feat(supabase): add plan3 core tables (sectors/clients/products/rfqs/admin/audit)"
```

---

### Task 3: Migration 0002 — RLS politikaları

**Files:**
- Create: `supabase/migrations/20260418120100_rls_policies.sql`

- [ ] **Step 1: Migration'ı yaz**

```sql
-- supabase/migrations/20260418120100_rls_policies.sql

-- RLS'i tüm tablolarda aç
alter table public.sectors                 enable row level security;
alter table public.clients                 enable row level security;
alter table public.products                enable row level security;
alter table public.rfqs                    enable row level security;
alter table public.admin_users             enable row level security;
alter table public.notification_recipients enable row level security;
alter table public.audit_log               enable row level security;

-- Helper: is_admin()
create or replace function public.is_admin(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.admin_users where user_id = uid);
$$;

create or replace function public.is_admin_role(uid uuid)
returns boolean language sql stable as $$
  select exists (select 1 from public.admin_users where user_id = uid and role = 'admin');
$$;

-- Public read (aktif olanlar)
create policy "anon read active sectors" on public.sectors
  for select to anon, authenticated using (active = true);

create policy "anon read active clients" on public.clients
  for select to anon, authenticated using (active = true);

create policy "anon read active products" on public.products
  for select to anon, authenticated using (active = true);

-- RFQ insert: anon
create policy "anon insert rfq" on public.rfqs
  for insert to anon, authenticated with check (true);

-- RFQ admin read/update
create policy "admin read rfqs" on public.rfqs
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admin update rfqs" on public.rfqs
  for update to authenticated using (public.is_admin(auth.uid()));

-- admin_users okuma: kendisi görebilir
create policy "self read admin_users" on public.admin_users
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));

-- notification_recipients: admin manage
create policy "admin select notification_recipients" on public.notification_recipients
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "admin manage notification_recipients" on public.notification_recipients
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- audit_log: sadece admin görebilir; insert tüm auth'lu (aksiyon yapan) veya service role
create policy "admin read audit_log" on public.audit_log
  for select to authenticated using (public.is_admin(auth.uid()));

create policy "authenticated insert audit_log" on public.audit_log
  for insert to authenticated with check (true);

-- products/sectors yazma: Plan 4'te yapılacak; şimdilik admin role gerekli
create policy "admin_role manage products" on public.products
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

create policy "admin_role manage sectors" on public.sectors
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));

create policy "admin_role manage clients" on public.clients
  for all to authenticated using (public.is_admin_role(auth.uid())) with check (public.is_admin_role(auth.uid()));
```

- [ ] **Step 2: `supabase db reset` ile uygula**

```bash
pnpm exec supabase db reset
```

Beklenen: hatasız reset; politikalar aktif.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418120100_rls_policies.sql
git commit -m "feat(supabase): RLS policies with is_admin helpers"
```

---

### Task 4: Migration 0003 — Storage bucket'ları ve policy'leri

**Files:**
- Create: `supabase/migrations/20260418120200_storage_buckets.sql`

- [ ] **Step 1: SQL yaz**

```sql
-- supabase/migrations/20260418120200_storage_buckets.sql

-- Buckets (idempotent insert)
insert into storage.buckets (id, name, public)
values ('rfq-attachments', 'rfq-attachments', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('sector-images', 'sector-images', true)
on conflict (id) do nothing;

-- RLS: storage.objects için policy'ler

-- RFQ uploads: anon yükleyebilir ama sadece kendi session UUID'si altında (rfq_id prefix)
-- MVP için "anon bucket'a insert edebilir" yeterli (Turnstile + rate limit + server-side path validation ile)
create policy "anon can insert rfq-attachments" on storage.objects
  for insert to anon, authenticated
  with check (bucket_id = 'rfq-attachments');

create policy "admin can read rfq-attachments" on storage.objects
  for select to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin(auth.uid()));

create policy "admin can delete rfq-attachments" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rfq-attachments' and public.is_admin(auth.uid()));

-- Public buckets
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
```

- [ ] **Step 2: `db reset` ve bucket'ları doğrula**

```bash
pnpm exec supabase db reset
pnpm exec supabase status    # Storage URL yazdırır
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260418120200_storage_buckets.sql
git commit -m "feat(supabase): storage buckets and RLS policies"
```

---

### Task 5: Seed — sectors + clients + admin + notification

**Files:**
- Create: `supabase/migrations/20260418120300_seed_reference_data.sql`

Not: Bu seed **idempotent** `on conflict do nothing` kullanır; seed production migration olarak push edilecek çünkü projenin ilk yaşamında tek seferlik gereklidir. Berkay'ın admin kullanıcı UUID'si `supabase.auth.users` tablosunda Task 30'da manuel oluşturulacak; bu migration admin_users'a e-posta lookup ile yazar.

- [ ] **Step 1: SQL yaz**

```sql
-- supabase/migrations/20260418120300_seed_reference_data.sql

-- Sectors: 3 sabit
insert into public.sectors (slug, name, description, hero_color, display_order, active) values
  ('cam-yikama',
   jsonb_build_object('tr','Cam Yıkama','en','Glass Washing','ru','Мойка стекла','ar','غسيل الزجاج'),
   jsonb_build_object('tr','Endüstriyel cam yıkama makineleri için plastik bileşenler','en','Plastic components for industrial glass washing machines','ru','Пластиковые компоненты для промышленных моечных машин','ar','مكونات بلاستيكية لآلات غسيل الزجاج الصناعية'),
   '#5b8fc7', 10, true),
  ('kapak',
   jsonb_build_object('tr','Kapak','en','Caps & Closures','ru','Крышки','ar','الأغطية والسدادات'),
   jsonb_build_object('tr','Endüstriyel ve ambalaj kapakları','en','Industrial and packaging closures','ru','Промышленные и упаковочные крышки','ar','أغطية صناعية وأغطية التعبئة والتغليف'),
   '#b8a040', 20, true),
  ('tekstil',
   jsonb_build_object('tr','Tekstil','en','Textile','ru','Текстиль','ar','النسيج'),
   jsonb_build_object('tr','Tekstil sektörü için plastik aksesuarlar','en','Plastic accessories for the textile industry','ru','Пластиковые аксессуары для текстильной промышленности','ar','إكسسوارات بلاستيكية لصناعة النسيج'),
   '#8a5fb8', 30, true)
on conflict (slug) do nothing;

-- Clients: eski lib/references/data.ts'den birebir
insert into public.clients (key, logo_path, sector_key, display_order, active) values
  ('c1', '/references/c1.svg', 'camYikama', 10, true),
  ('c2', '/references/c2.svg', 'kapak',     20, true),
  ('c3', '/references/c3.svg', 'tekstil',   30, true),
  ('c4', '/references/c4.svg', 'camYikama', 40, true),
  ('c5', '/references/c5.svg', 'kapak',     50, true),
  ('c6', '/references/c6.svg', 'tekstil',   60, true),
  ('c7', '/references/c7.svg', 'camYikama', 70, true),
  ('c8', '/references/c8.svg', 'kapak',     80, true)
on conflict (key) do nothing;

-- admin_users: berkay user_id Task 30'da insert olacak. Burada boş bırakıyoruz.
-- notification_recipients: ilk alıcı
insert into public.notification_recipients (email, rfq_types, active) values
  ('berkayturk6@gmail.com', array['custom','standart']::rfq_type[], true)
on conflict do nothing;
```

- [ ] **Step 2: `db reset` ile uygula**

```bash
pnpm exec supabase db reset
```

- [ ] **Step 3: `psql` ile doğrula**

```bash
pnpm exec supabase db psql -c "select slug from public.sectors; select key from public.clients; select email from public.notification_recipients;"
```

Beklenen: 3 sektör + 8 client + 1 recipient.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260418120300_seed_reference_data.sql
git commit -m "feat(supabase): seed sectors, clients (references), notification recipient"
```

---

### Task 6: Uzak Supabase projesi oluştur ve link et

**Files:** (lokal config only)
- Modify: `.env.local` (gitignored, manuel)

Not: Bu task interaktif adımlar içerir. `! <cmd>` ile kullanıcı bu komutları kendi terminalinde çalıştırmalı.

- [ ] **Step 1: Supabase dashboard'dan proje oluştur**

İnteraktif: https://supabase.com/dashboard/new → isim `kitaplastik-prod`, region `eu-central-1` (Frankfurt), password strong (1Password'e kaydet).

- [ ] **Step 2: CLI ile login ve link**

```bash
pnpm exec supabase login
pnpm exec supabase link --project-ref <yeni-proje-ref>
```

- [ ] **Step 3: Migration'ları uzak projeye push et**

```bash
pnpm exec supabase db push
```

Beklenen: 4 migration dosyası da remote'a uygulanır.

- [ ] **Step 4: `.env.local`'e gerçek değerleri yaz**

```
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

- [ ] **Step 5: Commit yok (sadece gitignored .env.local değişti); notlar için RESUME.md güncellemesi Task 47'de**

---

### Task 7: TypeScript tipleri generate et ve Database tipini dışa aktar

**Files:**
- Create: `lib/supabase/types.ts` (generated)
- Modify: `lib/supabase/client.ts`
- Modify: `lib/supabase/server.ts`
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Types generate et**

```bash
pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts
```

Beklenen: `lib/supabase/types.ts` dosyası ~200-400 satır `Database` type'ı içerir.

- [ ] **Step 2: `lib/supabase/client.ts`'yi typed yap**

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 3: `lib/supabase/server.ts`'yi typed yap**

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component'ten çağrılırsa yazılamaz; middleware handle eder.
          }
        },
      },
    },
  );
}
```

- [ ] **Step 4: `lib/supabase/service.ts` oluştur (service role, server-only)**

```typescript
// lib/supabase/service.ts
// ATTENTION: SERVER-ONLY. Bypasses RLS. Use only inside /api routes or server actions
// that have already authenticated the caller as admin, or for controlled operations
// like sending email/notifications where RLS would block legitimate flows.
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

export function createServiceClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing (server-only)");
  }
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 5: `server-only` paketini yükle**

```bash
pnpm add server-only
```

- [ ] **Step 6: Typecheck**

```bash
pnpm typecheck
```

Beklenen: sıfır hata. Hata varsa `env.ts` SUPABASE_SERVICE_ROLE_KEY eksik — Task 8 tamamlanınca düzelir.

- [ ] **Step 7: Commit**

```bash
git add lib/supabase package.json pnpm-lock.yaml
git commit -m "feat(supabase): generate Database types and add service role client"
```

---

## Phase B — Env, Dependencies ve Primitives

### Task 8: `.env.example` ve `lib/env.ts`'yi server alanlarıyla genişlet

**Files:**
- Modify: `.env.example`
- Modify: `lib/env.ts`
- Test: `tests/unit/lib/env.test.ts`

- [ ] **Step 1: `.env.example`'ı güncelle (server-only değerler boş bırakılır, prod'da Vercel'e eklenir)**

```
# Site origin (sitemap/OG — lokalde boş bırakılabilir)
NEXT_PUBLIC_SITE_URL=https://kitaplastik.com

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Cloudflare Turnstile
# Test site key (always passes): 1x00000000000000000000AA
# Test secret key (always passes): 1x0000000000000000000000000000000AA
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=noreply@kitaplastik.com
RESEND_TEAM_EMAIL=info@kitaplastik.com

# Plausible (Plan 4)
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=kitaplastik.com

# Sentry (Plan 4)
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

- [ ] **Step 2: Test'i yaz (`tests/unit/lib/env.test.ts`)**

```typescript
import { describe, it, expect, afterEach, vi } from "vitest";

describe("env schema", () => {
  afterEach(() => {
    vi.resetModules();
  });

  it("parses all required public keys on client", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    // Simulate browser
    vi.stubGlobal("window", {});
    const mod = await import("@/lib/env");
    expect(mod.env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://x.supabase.co");
    vi.unstubAllGlobals();
  });

  it("throws on server when server-only key missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://x.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "anon");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    vi.stubEnv("RESEND_API_KEY", "");
    await expect(import("@/lib/env")).rejects.toThrow(/env/i);
  });
});
```

- [ ] **Step 3: Test'i çalıştır (FAIL beklenir — `lib/env.ts` henüz server alanlarını zorunlu kılmıyor)**

```bash
pnpm test tests/unit/lib/env.test.ts -- --run
```

- [ ] **Step 4: `lib/env.ts`'yi güncelle**

```typescript
// lib/env.ts
import { z } from "zod";

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url().optional(),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().min(1),
  NEXT_PUBLIC_PLAUSIBLE_DOMAIN: z.string().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  TURNSTILE_SECRET_KEY: z.string().min(1),
  RESEND_API_KEY: z.string().min(1),
  RESEND_FROM_EMAIL: z.string().email().default("noreply@kitaplastik.com"),
  RESEND_TEAM_EMAIL: z.string().email().default("info@kitaplastik.com"),
  SENTRY_AUTH_TOKEN: z.string().optional(),
});

const isServer = typeof window === "undefined";
const schema = isServer ? serverEnvSchema : publicEnvSchema;

const result = schema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
  throw new Error(
    `Geçersiz veya eksik ortam değişkenleri:\n${issues}\n\n` +
      `Lütfen .env.local dosyanızı .env.example'a göre doldurun.`,
  );
}

export const env = result.data;
```

- [ ] **Step 5: Test'i tekrar çalıştır (PASS beklenir)**

```bash
pnpm test tests/unit/lib/env.test.ts -- --run
```

- [ ] **Step 6: `.env.local`'e Turnstile test key'lerini eklendiğinden emin ol ve typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 7: Commit**

```bash
git add .env.example lib/env.ts tests/unit/lib/env.test.ts
git commit -m "feat(env): server-only schema with Supabase/Turnstile/Resend keys"
```

---

### Task 9: Primitives için paketleri yükle

**Files:** (no source files, package manifests only)

- [ ] **Step 1: Runtime paketleri kur**

```bash
pnpm add resend @marsidev/react-turnstile react-hook-form @hookform/resolvers lucide-react
```

Not: `lucide-react` zaten kurulu ama major bump gerekebilir — mevcut `^1.8.0` (eski API!). Güncel sürüm `^0.462.x` değil, aslında doğrusu `^0.462.0` (`lucide-react` sürümleme ondalık). Kontrol et: proje şu an `lucide-react@^1.8.0` kullanıyor; bu yayın ICON API farklı olabilir. Plan 3'te lucide-react güncellemesi YAPMIYORUZ — mevcut versiyonla çalış, eksik icon varsa inline SVG kullan.

**Doğru komut (lucide-react kaldırılmadı):**

```bash
pnpm add resend @marsidev/react-turnstile react-hook-form @hookform/resolvers
```

- [ ] **Step 2: Server-only util'ini doğrula**

```bash
pnpm list server-only     # Task 7'de eklendi
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore(deps): add resend, turnstile, react-hook-form for Plan 3"
```

---

### Task 10: `lib/rate-limit.ts` — in-memory LRU rate limiter

**Files:**
- Create: `lib/rate-limit.ts`
- Test: `tests/unit/lib/rate-limit.test.ts`

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/lib/rate-limit.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-18T00:00:00Z"));
  });

  it("allows up to limit within window", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 3 });
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(true);
    expect(rl.check("ip-1").allowed).toBe(false);
  });

  it("isolates keys", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(rl.check("a").allowed).toBe(true);
    expect(rl.check("b").allowed).toBe(true);
    expect(rl.check("a").allowed).toBe(false);
  });

  it("resets after window elapses", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    expect(rl.check("k").allowed).toBe(true);
    expect(rl.check("k").allowed).toBe(false);
    vi.advanceTimersByTime(61_000);
    expect(rl.check("k").allowed).toBe(true);
  });

  it("returns retryAfter seconds when blocked", () => {
    const rl = createRateLimiter({ windowMs: 60_000, max: 1 });
    rl.check("x");
    const r = rl.check("x");
    expect(r.allowed).toBe(false);
    expect(r.retryAfter).toBeGreaterThan(0);
    expect(r.retryAfter).toBeLessThanOrEqual(60);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

```bash
pnpm test tests/unit/lib/rate-limit.test.ts -- --run
```

- [ ] **Step 3: Implement**

```typescript
// lib/rate-limit.ts
// In-memory sliding-window rate limiter. NOT shared across serverless instances —
// acceptable MVP tradeoff; Plan 4 upgrades to Upstash Redis.

interface RateLimiterOptions {
  windowMs: number;
  max: number;
}

interface CheckResult {
  allowed: boolean;
  retryAfter: number; // seconds
}

interface Bucket {
  timestamps: number[];
}

export function createRateLimiter(opts: RateLimiterOptions) {
  const buckets = new Map<string, Bucket>();

  function prune(bucket: Bucket, now: number) {
    const cutoff = now - opts.windowMs;
    while (bucket.timestamps.length > 0 && bucket.timestamps[0] < cutoff) {
      bucket.timestamps.shift();
    }
  }

  return {
    check(key: string): CheckResult {
      const now = Date.now();
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { timestamps: [] };
        buckets.set(key, bucket);
      }
      prune(bucket, now);

      if (bucket.timestamps.length >= opts.max) {
        const oldest = bucket.timestamps[0];
        const retryAfterMs = oldest + opts.windowMs - now;
        return { allowed: false, retryAfter: Math.ceil(retryAfterMs / 1000) };
      }

      bucket.timestamps.push(now);
      return { allowed: true, retryAfter: 0 };
    },
  };
}

// Pre-configured singleton limiters (module-scope so instances share in-process)
export const rfqLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 3 });
export const contactLimiter = createRateLimiter({ windowMs: 5 * 60_000, max: 5 });

export function ipFromHeaders(h: Headers): string {
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip")?.trim() ??
    "unknown"
  );
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add lib/rate-limit.ts tests/unit/lib/rate-limit.test.ts
git commit -m "feat(lib): in-memory sliding-window rate limiter"
```

---

### Task 11: `lib/turnstile.ts` — server-side token doğrulama

**Files:**
- Create: `lib/turnstile.ts`
- Test: `tests/unit/lib/turnstile.test.ts`

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/lib/turnstile.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("verifyTurnstile", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("TURNSTILE_SECRET_KEY", "1x0000000000000000000000000000000AA");
  });

  it("returns true when Cloudflare siteverify succeeds", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("tok", "1.2.3.4")).resolves.toBe(true);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("returns false on siteverify failure", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: false, "error-codes": ["invalid-input"] }),
    } as Response);
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("bad", null)).resolves.toBe(false);
  });

  it("returns false on network error", async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error("net"));
    const { verifyTurnstile } = await import("@/lib/turnstile");
    await expect(verifyTurnstile("tok", null)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement**

```typescript
// lib/turnstile.ts
import "server-only";
import { env } from "@/lib/env";

const SITEVERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  if (!token) return false;
  try {
    const body = new URLSearchParams();
    body.set("secret", env.TURNSTILE_SECRET_KEY);
    body.set("response", token);
    if (ip) body.set("remoteip", ip);
    const res = await fetch(SITEVERIFY_URL, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add lib/turnstile.ts tests/unit/lib/turnstile.test.ts
git commit -m "feat(lib): Turnstile siteverify wrapper"
```

---

### Task 12: `lib/audit.ts` — audit_log insert helper

**Files:**
- Create: `lib/audit.ts`
- Test: `tests/unit/lib/audit.test.ts`

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/lib/audit.test.ts
import { describe, it, expect, vi } from "vitest";

describe("recordAudit", () => {
  it("calls supabase service client insert with correct row", async () => {
    const insert = vi.fn().mockResolvedValue({ error: null });
    const from = vi.fn().mockReturnValue({ insert });
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => ({ from }),
    }));
    const { recordAudit } = await import("@/lib/audit");
    await recordAudit({
      action: "rfq_created",
      entity_type: "rfq",
      entity_id: "11111111-1111-1111-1111-111111111111",
      ip: "1.2.3.4",
      user_id: null,
      diff: { status: "new" },
    });
    expect(from).toHaveBeenCalledWith("audit_log");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "rfq_created",
        entity_type: "rfq",
        ip_address: "1.2.3.4",
        diff: { status: "new" },
      }),
    );
  });

  it("swallows errors so caller flow continues", async () => {
    const insert = vi.fn().mockResolvedValue({ error: { message: "oops" } });
    vi.doMock("@/lib/supabase/service", () => ({
      createServiceClient: () => ({ from: () => ({ insert }) }),
    }));
    const { recordAudit } = await import("@/lib/audit");
    await expect(
      recordAudit({ action: "x", entity_type: "y", entity_id: null, ip: null, user_id: null, diff: null }),
    ).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement**

```typescript
// lib/audit.ts
import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface AuditEntry {
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  ip: string | null;
  diff: unknown;
}

export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("audit_log").insert({
      action: entry.action,
      entity_type: entry.entity_type,
      entity_id: entry.entity_id,
      user_id: entry.user_id,
      ip_address: entry.ip,
      diff: entry.diff as never,
    });
    if (error) {
      // Log-only; do not throw — audit failures must not break user-facing flow.
      // eslint-disable-next-line no-console
      console.warn("[audit] insert failed", error.message);
    }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn("[audit] unexpected", e);
  }
}
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add lib/audit.ts tests/unit/lib/audit.test.ts
git commit -m "feat(lib): audit_log helper with error-swallowing semantics"
```

---

### Task 13: `lib/email/client.ts` ve e-posta şablonları

**Files:**
- Create: `lib/email/client.ts`
- Create: `lib/email/templates/contact-team.ts`
- Create: `lib/email/templates/contact-customer.ts`
- Create: `lib/email/templates/rfq-team.ts`
- Create: `lib/email/templates/rfq-customer.ts`
- Test: `tests/unit/lib/email/templates.test.ts`

- [ ] **Step 1: Resend client**

```typescript
// lib/email/client.ts
import "server-only";
import { Resend } from "resend";
import { env } from "@/lib/env";

let _resend: Resend | null = null;

export function getResend(): Resend {
  if (!_resend) _resend = new Resend(env.RESEND_API_KEY);
  return _resend;
}
```

- [ ] **Step 2: Şablon tipleri ve contact şablonları**

```typescript
// lib/email/templates/contact-team.ts
export interface ContactTeamInput {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  subject: string;
  message: string;
  locale: string;
  ip: string;
}

export function renderContactTeamEmail(input: ContactTeamInput): { subject: string; html: string; text: string } {
  const subject = `[Web-Contact] ${input.subject} — ${input.name}`;
  const text = [
    `Yeni iletişim formu mesajı`,
    ``,
    `Ad: ${input.name}`,
    input.company ? `Firma: ${input.company}` : null,
    `E-posta: ${input.email}`,
    input.phone ? `Telefon: ${input.phone}` : null,
    `Konu: ${input.subject}`,
    `Dil: ${input.locale}`,
    `IP: ${input.ip}`,
    ``,
    `Mesaj:`,
    input.message,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");

  const html = `
<!doctype html><meta charset="utf-8">
<h2 style="font-family:system-ui;color:#0a1628">Yeni iletişim formu mesajı</h2>
<table style="font-family:system-ui;font-size:14px;color:#0a1628">
  <tr><td><b>Ad</b></td><td>${escapeHtml(input.name)}</td></tr>
  ${input.company ? `<tr><td><b>Firma</b></td><td>${escapeHtml(input.company)}</td></tr>` : ""}
  <tr><td><b>E-posta</b></td><td><a href="mailto:${escapeHtml(input.email)}">${escapeHtml(input.email)}</a></td></tr>
  ${input.phone ? `<tr><td><b>Telefon</b></td><td>${escapeHtml(input.phone)}</td></tr>` : ""}
  <tr><td><b>Konu</b></td><td>${escapeHtml(input.subject)}</td></tr>
  <tr><td><b>Dil</b></td><td>${escapeHtml(input.locale)}</td></tr>
  <tr><td><b>IP</b></td><td>${escapeHtml(input.ip)}</td></tr>
</table>
<hr>
<pre style="white-space:pre-wrap;font-family:system-ui;font-size:14px">${escapeHtml(input.message)}</pre>`.trim();

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
```

```typescript
// lib/email/templates/contact-customer.ts
export interface ContactCustomerInput {
  name: string;
  locale: "tr" | "en" | "ru" | "ar";
}

const MESSAGES = {
  tr: {
    subject: "Mesajınızı aldık — Kıta Plastik",
    greeting: (n: string) => `Sayın ${n},`,
    body: "Mesajınız için teşekkür ederiz. Ekibimiz en kısa sürede (1-2 iş günü içinde) size dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: "We received your message — Kıta Plastik",
    greeting: (n: string) => `Dear ${n},`,
    body: "Thank you for your message. Our team will get back to you shortly (within 1-2 business days).",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: "Мы получили ваше сообщение — Kıta Plastik",
    greeting: (n: string) => `Уважаемый(ая) ${n},`,
    body: "Спасибо за ваше сообщение. Наша команда свяжется с вами в ближайшее время (в течение 1-2 рабочих дней).",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: "تم استلام رسالتك — Kıta Plastik",
    greeting: (n: string) => `عزيزي ${n}،`,
    body: "شكرًا لرسالتك. سيتواصل معك فريقنا قريبًا (خلال 1-2 أيام عمل).",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
} as const;

export function renderContactCustomerEmail(input: ContactCustomerInput): { subject: string; html: string; text: string } {
  const m = MESSAGES[input.locale];
  const text = `${m.greeting(input.name)}\n\n${m.body}\n\n${m.sig}`;
  const html = `
<!doctype html><meta charset="utf-8">
<div style="font-family:system-ui;font-size:15px;color:#0a1628;line-height:1.55;max-width:560px">
  <p>${m.greeting(input.name)}</p>
  <p>${m.body}</p>
  <p style="white-space:pre-line">${m.sig}</p>
</div>`.trim();
  return { subject: m.subject, html, text };
}
```

- [ ] **Step 3: RFQ şablonları**

```typescript
// lib/email/templates/rfq-team.ts
export interface RfqTeamInput {
  id: string;
  type: "custom" | "standart";
  locale: string;
  contact: { name: string; email: string; company: string; phone: string; country?: string };
  payload: Record<string, unknown>;
  attachmentCount: number;
  ip: string;
  adminUrl: string;
}

export function renderRfqTeamEmail(i: RfqTeamInput): { subject: string; html: string; text: string } {
  const subject = `[Web-RFQ-${i.type === "custom" ? "Ozel" : "Standart"}] ${i.contact.company} — ${i.contact.name}`;
  const payloadJson = JSON.stringify(i.payload, null, 2);
  const text = [
    `Yeni ${i.type} RFQ`,
    `Admin: ${i.adminUrl}`,
    ``,
    `Firma: ${i.contact.company}`,
    `İletişim: ${i.contact.name} <${i.contact.email}>`,
    `Telefon: ${i.contact.phone}`,
    i.contact.country ? `Ülke: ${i.contact.country}` : null,
    `Dil: ${i.locale}`,
    `IP: ${i.ip}`,
    `Ek sayısı: ${i.attachmentCount}`,
    ``,
    `Payload:`,
    payloadJson,
  ]
    .filter((l): l is string => l !== null)
    .join("\n");
  const html = `
<!doctype html><meta charset="utf-8">
<h2 style="font-family:system-ui">Yeni ${i.type === "custom" ? "Özel Üretim" : "Standart Ürün"} RFQ</h2>
<p><a href="${escapeAttr(i.adminUrl)}">Admin panelinde aç →</a></p>
<table style="font-family:system-ui;font-size:14px">
  <tr><td><b>Firma</b></td><td>${esc(i.contact.company)}</td></tr>
  <tr><td><b>İletişim</b></td><td>${esc(i.contact.name)} &lt;${esc(i.contact.email)}&gt;</td></tr>
  <tr><td><b>Telefon</b></td><td>${esc(i.contact.phone)}</td></tr>
  ${i.contact.country ? `<tr><td><b>Ülke</b></td><td>${esc(i.contact.country)}</td></tr>` : ""}
  <tr><td><b>Dil</b></td><td>${esc(i.locale)}</td></tr>
  <tr><td><b>IP</b></td><td>${esc(i.ip)}</td></tr>
  <tr><td><b>Ek</b></td><td>${i.attachmentCount}</td></tr>
</table>
<pre style="font-family:ui-monospace;font-size:12px;background:#f4f5f8;padding:12px;white-space:pre-wrap">${esc(payloadJson)}</pre>`.trim();
  return { subject, html, text };
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
function escapeAttr(s: string): string { return esc(s); }
```

```typescript
// lib/email/templates/rfq-customer.ts
export interface RfqCustomerInput {
  name: string;
  rfqId: string;
  type: "custom" | "standart";
  locale: "tr" | "en" | "ru" | "ar";
}

const MSG = {
  tr: {
    subject: (id: string) => `Teklif talebinizi aldık (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Sayın ${n},`,
    body: "Teklif talebiniz tarafımıza ulaşmıştır. Ekibimiz detayları inceleyip en kısa sürede dönüş yapacaktır.",
    sig: "Saygılarımızla,\nKıta Plastik Ekibi",
  },
  en: {
    subject: (id: string) => `Quote request received (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Dear ${n},`,
    body: "We have received your quote request. Our engineering team will review and get back to you shortly.",
    sig: "Best regards,\nKıta Plastik Team",
  },
  ru: {
    subject: (id: string) => `Запрос на расчёт получен (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `Уважаемый(ая) ${n},`,
    body: "Мы получили ваш запрос. Наша инженерная команда рассмотрит детали и свяжется с вами в ближайшее время.",
    sig: "С уважением,\nКоманда Kıta Plastik",
  },
  ar: {
    subject: (id: string) => `تم استلام طلب عرض السعر (#${id.slice(0, 8)}) — Kıta Plastik`,
    g: (n: string) => `عزيزي ${n}،`,
    body: "لقد استلمنا طلب عرض السعر الخاص بك. سيقوم فريقنا الهندسي بمراجعة التفاصيل والرد عليك قريبًا.",
    sig: "مع التحية،\nفريق Kıta Plastik",
  },
} as const;

export function renderRfqCustomerEmail(i: RfqCustomerInput): { subject: string; html: string; text: string } {
  const m = MSG[i.locale];
  const text = `${m.g(i.name)}\n\n${m.body}\n\n${m.sig}`;
  const html = `
<!doctype html><meta charset="utf-8">
<div style="font-family:system-ui;font-size:15px;color:#0a1628;line-height:1.55;max-width:560px">
  <p>${m.g(i.name)}</p>
  <p>${m.body}</p>
  <p style="white-space:pre-line">${m.sig}</p>
</div>`.trim();
  return { subject: m.subject(i.rfqId), html, text };
}
```

- [ ] **Step 4: Test'i yaz (templates)**

```typescript
// tests/unit/lib/email/templates.test.ts
import { describe, it, expect } from "vitest";
import { renderContactTeamEmail } from "@/lib/email/templates/contact-team";
import { renderContactCustomerEmail } from "@/lib/email/templates/contact-customer";
import { renderRfqTeamEmail } from "@/lib/email/templates/rfq-team";
import { renderRfqCustomerEmail } from "@/lib/email/templates/rfq-customer";

describe("email templates", () => {
  it("contact team: escapes HTML in name/message", () => {
    const r = renderContactTeamEmail({
      name: "<img onerror=x>",
      email: "a@b.com",
      company: "",
      phone: "",
      subject: "Teklif",
      message: "<script>alert(1)</script>",
      locale: "tr",
      ip: "1.1.1.1",
    });
    expect(r.html).not.toContain("<script>");
    expect(r.html).toContain("&lt;script&gt;");
    expect(r.text).toContain("alert(1)"); // plain-text is fine
  });

  it("contact customer: localizes subject for all 4 locales", () => {
    for (const loc of ["tr", "en", "ru", "ar"] as const) {
      const r = renderContactCustomerEmail({ name: "Ali", locale: loc });
      expect(r.subject).toBeTruthy();
      expect(r.html).toContain("Ali");
    }
  });

  it("rfq team: includes admin URL as anchor", () => {
    const r = renderRfqTeamEmail({
      id: "abc",
      type: "custom",
      locale: "tr",
      contact: { name: "N", email: "n@x.com", company: "C", phone: "+90" },
      payload: { description: "test" },
      attachmentCount: 2,
      ip: "0",
      adminUrl: "https://site/admin/inbox/abc",
    });
    expect(r.html).toContain("https://site/admin/inbox/abc");
    expect(r.subject).toContain("Ozel");
  });

  it("rfq customer: subject includes short id", () => {
    const r = renderRfqCustomerEmail({
      name: "Ali",
      rfqId: "11111111-aaaa-bbbb-cccc-222222222222",
      type: "custom",
      locale: "en",
    });
    expect(r.subject).toContain("11111111");
  });
});
```

- [ ] **Step 5: Run tests (PASS)**

```bash
pnpm test tests/unit/lib/email -- --run
```

- [ ] **Step 6: Commit**

```bash
git add lib/email tests/unit/lib/email
git commit -m "feat(email): Resend client + 4 transactional templates (contact/RFQ × team/customer)"
```

---

## Phase C — Validation Schemas ve Referans Migrasyonu

### Task 14: `lib/validation/contact.ts` — Contact form zod schema

**Files:**
- Create: `lib/validation/contact.ts`
- Test: `tests/unit/validation/contact.test.ts`

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/validation/contact.test.ts
import { describe, it, expect } from "vitest";
import { contactSchema } from "@/lib/validation/contact";

const valid = {
  name: "Ali Veli",
  email: "a@b.com",
  company: "Acme",
  phone: "+905551112233",
  subject: "general" as const,
  message: "Merhaba, lütfen bilgi veriniz.",
  locale: "tr" as const,
  turnstileToken: "xyz",
  honeypot: "",
};

describe("contactSchema", () => {
  it("accepts valid input", () => {
    expect(contactSchema.safeParse(valid).success).toBe(true);
  });

  it("requires min-length name", () => {
    expect(contactSchema.safeParse({ ...valid, name: "A" }).success).toBe(false);
  });

  it("rejects bad email", () => {
    expect(contactSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
  });

  it("requires min-length message", () => {
    expect(contactSchema.safeParse({ ...valid, message: "hi" }).success).toBe(false);
  });

  it("rejects honeypot fill", () => {
    expect(contactSchema.safeParse({ ...valid, honeypot: "bot" }).success).toBe(false);
  });

  it("accepts all 4 locales", () => {
    for (const locale of ["tr", "en", "ru", "ar"] as const) {
      expect(contactSchema.safeParse({ ...valid, locale }).success).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run test (FAIL, module not found)**

```bash
pnpm test tests/unit/validation/contact.test.ts -- --run
```

- [ ] **Step 3: Implement**

```typescript
// lib/validation/contact.ts
import { z } from "zod";

export const contactSubjects = ["general", "quote", "support", "other"] as const;
export const contactLocales = ["tr", "en", "ru", "ar"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(200).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.enum(contactSubjects),
  message: z.string().trim().min(10).max(4000),
  locale: z.enum(contactLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type ContactInput = z.infer<typeof contactSchema>;
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add lib/validation/contact.ts tests/unit/validation/contact.test.ts
git commit -m "feat(validation): contact schema with honeypot and turnstile"
```

---

### Task 15: `lib/validation/rfq.ts` — Custom + Standart RFQ schemas

**Files:**
- Create: `lib/validation/rfq.ts`
- Test: `tests/unit/validation/rfq.test.ts`

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/validation/rfq.test.ts
import { describe, it, expect } from "vitest";
import { customRfqSchema, standartRfqSchema } from "@/lib/validation/rfq";

const baseContact = {
  name: "Ali",
  email: "a@b.com",
  company: "Acme",
  phone: "+905551112233",
  country: "TR",
};

const validCustom = {
  contact: baseContact,
  sector: "cam-yikama" as const,
  description: "Bu proje icin plastik enjeksiyon ile uretim yapacak bir partnere ihtiyacimiz var.",
  materials: ["PP", "ABS"],
  annualVolume: "10k" as const,
  tolerance: "medium" as const,
  targetDate: "2026-12-31",
  ndaRequired: true,
  kvkkConsent: true,
  attachments: [{ path: "rfq/uuid/a.pdf", name: "a.pdf", size: 1024, mime: "application/pdf" }],
  locale: "tr" as const,
  turnstileToken: "tok",
  honeypot: "",
};

const validStandart = {
  contact: baseContact,
  items: [{ productSlug: "kapak-33mm", variant: "white", qty: 1000 }],
  deliveryCountry: "TR",
  incoterm: "EXW" as const,
  notes: "",
  urgent: false,
  kvkkConsent: true,
  locale: "tr" as const,
  turnstileToken: "tok",
  honeypot: "",
};

describe("customRfqSchema", () => {
  it("accepts valid payload", () => {
    expect(customRfqSchema.safeParse(validCustom).success).toBe(true);
  });
  it("requires kvkk consent = true", () => {
    expect(customRfqSchema.safeParse({ ...validCustom, kvkkConsent: false }).success).toBe(false);
  });
  it("enforces description length 50-2000", () => {
    expect(customRfqSchema.safeParse({ ...validCustom, description: "x".repeat(49) }).success).toBe(false);
    expect(customRfqSchema.safeParse({ ...validCustom, description: "x".repeat(2001) }).success).toBe(false);
  });
  it("limits attachments to 5", () => {
    const many = Array.from({ length: 6 }, (_, i) => ({
      path: `p${i}`, name: `${i}.pdf`, size: 100, mime: "application/pdf",
    }));
    expect(customRfqSchema.safeParse({ ...validCustom, attachments: many }).success).toBe(false);
  });
});

describe("standartRfqSchema", () => {
  it("accepts valid payload", () => {
    expect(standartRfqSchema.safeParse(validStandart).success).toBe(true);
  });
  it("requires at least 1 item", () => {
    expect(standartRfqSchema.safeParse({ ...validStandart, items: [] }).success).toBe(false);
  });
  it("qty must be positive int", () => {
    const bad = { ...validStandart, items: [{ productSlug: "x", variant: "", qty: 0 }] };
    expect(standartRfqSchema.safeParse(bad).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Implement**

```typescript
// lib/validation/rfq.ts
import { z } from "zod";

export const rfqLocales = ["tr", "en", "ru", "ar"] as const;
export const rfqSectors = ["cam-yikama", "kapak", "tekstil", "diger"] as const;
export const rfqVolumes = ["1k", "5k", "10k", "50k", "100k+", "unknown"] as const;
export const rfqTolerances = ["low", "medium", "high"] as const;
export const rfqIncoterms = ["EXW", "FOB", "CIF", "DAP"] as const;

const contact = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254),
  company: z.string().trim().min(2).max(200),
  phone: z.string().trim().min(5).max(40),
  country: z.string().trim().min(2).max(4),
});

const attachment = z.object({
  path: z.string().min(1),
  name: z.string().min(1).max(255),
  size: z.number().int().nonnegative().max(10 * 1024 * 1024),
  mime: z.string().min(1).max(120),
});

export const customRfqSchema = z.object({
  contact,
  sector: z.enum(rfqSectors),
  description: z.string().trim().min(50).max(2000),
  materials: z.array(z.string().max(40)).max(10).optional().default([]),
  annualVolume: z.enum(rfqVolumes),
  tolerance: z.enum(rfqTolerances).optional(),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  ndaRequired: z.boolean().default(false),
  kvkkConsent: z.literal(true),
  attachments: z.array(attachment).max(5).default([]),
  locale: z.enum(rfqLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type CustomRfqInput = z.infer<typeof customRfqSchema>;

export const standartRfqSchema = z.object({
  contact,
  items: z
    .array(
      z.object({
        productSlug: z.string().min(1).max(80),
        variant: z.string().max(80).optional().or(z.literal("")),
        qty: z.number().int().positive().max(1_000_000),
      }),
    )
    .min(1)
    .max(20),
  deliveryCountry: z.string().max(4).optional().or(z.literal("")),
  incoterm: z.enum(rfqIncoterms).optional(),
  notes: z.string().max(1000).optional().or(z.literal("")),
  urgent: z.boolean().default(false),
  kvkkConsent: z.literal(true),
  locale: z.enum(rfqLocales),
  turnstileToken: z.string().min(1),
  honeypot: z.literal(""),
});

export type StandartRfqInput = z.infer<typeof standartRfqSchema>;
```

- [ ] **Step 4: Run test (PASS)**

- [ ] **Step 5: Commit**

```bash
git add lib/validation/rfq.ts tests/unit/validation/rfq.test.ts
git commit -m "feat(validation): custom and standart RFQ schemas"
```

---

### Task 16: References migration — Supabase clients tablosundan oku

**Files:**
- Modify: `lib/references/data.ts` (senkron mock → async Supabase)
- Test: `tests/unit/lib/references/data.test.ts` (REWRITE)
- Modify: `components/home/ReferencesStrip.tsx` (Server Component async + getTranslations)
- Modify: `app/[locale]/referanslar/page.tsx` (await çağrılarını ekle)

Not: Interface (`Reference`: id, key, logoPath, sectorKey) sabit. Sadece senkron → async imza değişikliği. Call site'lar zaten Server Component (Hero ve ReferencesStrip).

- [ ] **Step 1: Test'i yaz**

```typescript
// tests/unit/lib/references/data.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("references data (supabase-backed)", () => {
  beforeEach(() => { vi.resetModules(); });

  it("maps rows to Reference[] on getReferences()", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({
              order: () =>
                Promise.resolve({
                  data: [
                    { id: "1", key: "c1", logo_path: "/references/c1.svg", sector_key: "camYikama" },
                  ],
                  error: null,
                }),
            }),
          }),
        }),
      }),
    }));
    const { getReferences } = await import("@/lib/references/data");
    const refs = await getReferences();
    expect(refs[0]).toEqual({
      id: "1", key: "c1", logoPath: "/references/c1.svg", sectorKey: "camYikama",
    });
  });

  it("returns [] on db error", async () => {
    vi.doMock("@/lib/supabase/server", () => ({
      createClient: async () => ({
        from: () => ({
          select: () => ({
            eq: () => ({ order: () => Promise.resolve({ data: null, error: { message: "x" } }) }),
          }),
        }),
      }),
    }));
    const { getReferences } = await import("@/lib/references/data");
    await expect(getReferences()).resolves.toEqual([]);
  });
});
```

- [ ] **Step 2: Run test (FAIL)**

- [ ] **Step 3: Rewrite `lib/references/data.ts`**

```typescript
// lib/references/data.ts
import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Reference, SectorKey } from "./types";

interface Row {
  id: string;
  key: string;
  logo_path: string;
  sector_key: string;
}

function mapRow(r: Row): Reference {
  return {
    id: r.id,
    key: r.key,
    logoPath: r.logo_path,
    sectorKey: r.sector_key as SectorKey,
  };
}

export async function getReferences(): Promise<ReadonlyArray<Reference>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("id, key, logo_path, sector_key")
    .eq("active", true)
    .order("display_order", { ascending: true });
  if (error || !data) {
    // eslint-disable-next-line no-console
    console.warn("[references] fetch failed", error?.message);
    return [];
  }
  return (data as Row[]).map(mapRow);
}

export async function getReferencesBySector(sector: SectorKey): Promise<ReadonlyArray<Reference>> {
  const all = await getReferences();
  return all.filter((r) => r.sectorKey === sector);
}
```

- [ ] **Step 4: `components/home/ReferencesStrip.tsx`'yi async yap**

Dosyanın üst kısmını şöyle değiştir:

```typescript
// components/home/ReferencesStrip.tsx
import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { getReferences } from "@/lib/references/data";
import { cn } from "@/lib/utils";

export async function ReferencesStrip() {
  const tHome = await getTranslations("home.references");
  const tClients = await getTranslations("references.clients");
  const references = await getReferences();
  // ... JSX kısmı aynen kalır
}
```

İçerideki `tClients(`${ref.key}.name`)` kullanımı değişmez.

- [ ] **Step 5: `app/[locale]/referanslar/page.tsx`'i uyumlu hale getir**

```bash
grep -n "getReferences\|getReferencesBySector" app/[locale]/referanslar/page.tsx
```

Çağrı noktalarına `await` ekle. Eğer `useTranslations` kullanıyorsa `getTranslations` ile değiştir (async Server Component ise zaten öyle).

- [ ] **Step 6: Typecheck + unit + smoke e2e**

```bash
pnpm typecheck
pnpm test tests/unit/lib/references -- --run
pnpm exec supabase start    # lokal DB gerekli
pnpm test:e2e -- tests/e2e/home.spec.ts
```

- [ ] **Step 7: Commit**

```bash
git add lib/references/data.ts components/home/ReferencesStrip.tsx app/[locale]/referanslar/page.tsx tests/unit/lib/references
git commit -m "refactor(references): migrate mock data.ts to Supabase clients table"
```

---

## Phase D — Middleware (next-intl + Supabase + Admin Guard)

### Task 17: `lib/supabase/middleware.ts` — session refresh helper

**Files:**
- Create: `lib/supabase/middleware.ts`

Not: `@supabase/ssr` 0.10 dokümanında önerilen pattern. Cookie'leri NextRequest/NextResponse arasında geçirir.

- [ ] **Step 1: Implement**

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/env";
import type { Database } from "./types";

export async function updateSession(request: NextRequest): Promise<{
  response: NextResponse;
  userId: string | null;
}> {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh session (sends Set-Cookie headers if token rotated)
  const { data } = await supabase.auth.getUser();
  return { response, userId: data.user?.id ?? null };
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/middleware.ts
git commit -m "feat(supabase): session refresh helper for middleware"
```

---

### Task 18: `middleware.ts` — next-intl + Supabase + admin guard compose

**Files:**
- Modify: `middleware.ts` (REWRITE)

- [ ] **Step 1: Rewrite**

```typescript
// middleware.ts
import createIntlMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";
import { updateSession } from "./lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

function isAdminPublicPath(pathname: string): boolean {
  return (
    pathname === "/admin/login" ||
    pathname.startsWith("/admin/login/") ||
    pathname.startsWith("/admin/auth/callback")
  );
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Admin: locale-bağımsız, Supabase session zorunlu (login/callback hariç)
  if (isAdminPath(pathname)) {
    const { response, userId } = await updateSession(request);
    if (!isAdminPublicPath(pathname) && !userId) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return response;
  }

  // Diğer her şey: next-intl routing
  return intlMiddleware(request);
}

export const config = {
  // Match everything except static/_next/_vercel/api and files with extensions
  matcher: ["/((?!_next|_vercel|api|.*\\..*).*)"],
};
```

- [ ] **Step 2: Middleware davranışını manuel smoke test**

```bash
pnpm dev
# Beklenen:
# curl -I http://localhost:3000/           → 307 /tr
# curl -I http://localhost:3000/admin      → 307 /admin/login?next=/admin
# curl -I http://localhost:3000/admin/login → 200
```

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat(middleware): compose next-intl with Supabase session + admin guard"
```

---

## Phase E — Contact API Migration

### Task 19: `app/api/contact/route.ts` — Resend + Turnstile + rate limit

**Files:**
- Create: `app/api/contact/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/contact/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { verifyTurnstile } from "@/lib/turnstile";
import { contactLimiter, ipFromHeaders } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";
import { env } from "@/lib/env";
import { renderContactTeamEmail } from "@/lib/email/templates/contact-team";
import { renderContactCustomerEmail } from "@/lib/email/templates/contact-customer";
import { recordAudit } from "@/lib/audit";
import { COMPANY } from "@/lib/company";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);

  // 1) Rate limit
  const rl = contactLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  // 2) Parse + validate
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // 3) Turnstile
  const ok = await verifyTurnstile(input.turnstileToken, ip);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 403 });
  }

  // 4) Send emails (team + customer)
  const resend = getResend();
  const teamMail = renderContactTeamEmail({
    name: input.name,
    email: input.email,
    company: input.company || undefined,
    phone: input.phone || undefined,
    subject: input.subject,
    message: input.message,
    locale: input.locale,
    ip,
  });
  const customerMail = renderContactCustomerEmail({ name: input.name, locale: input.locale });

  try {
    await Promise.all([
      resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.RESEND_TEAM_EMAIL,
        replyTo: input.email,
        subject: teamMail.subject,
        html: teamMail.html,
        text: teamMail.text,
      }),
      resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: input.email,
        subject: customerMail.subject,
        html: customerMail.html,
        text: customerMail.text,
      }),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[contact] resend failed", e);
    return NextResponse.json({ ok: false, error: "email_failed" }, { status: 502 });
  }

  // 5) Audit log (fire-and-forget but awaited to ensure insert before response)
  await recordAudit({
    action: "contact_submitted",
    entity_type: "contact",
    entity_id: null,
    user_id: null,
    ip,
    diff: { subject: input.subject, locale: input.locale, company: input.company || null },
  });

  return NextResponse.json({ ok: true, recipient: COMPANY.email.primary });
}
```

- [ ] **Step 2: Smoke test manuel (dev sunucu çalışırken)**

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "content-type: application/json" \
  -d '{"name":"Ali","email":"a@b.com","company":"","phone":"","subject":"general","message":"merhaba lütfen bilgi","locale":"tr","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX","honeypot":""}'
```

Beklenen: `{"ok":true,...}` (test Turnstile key her zaman pass; RESEND_API_KEY gerçek key değilse 502 dönebilir — tamam, endpoint yapısı test edilmiş sayılır).

- [ ] **Step 3: Commit**

```bash
git add app/api/contact/route.ts
git commit -m "feat(api): /api/contact with Turnstile, rate limit, Resend, audit"
```

---

### Task 20: `ContactForm.tsx` — mailto → /api/contact migration

**Files:**
- Modify: `components/contact/ContactForm.tsx` (REWRITE)
- Create: `components/rfq/TurnstileWidget.tsx` (paylaşılan)
- Modify: `messages/{tr,en,ru,ar}/pages.json` (yeni string'ler: submitting, submitted, errorGeneric, errorRateLimit, errorTurnstile, honeypot label)

- [ ] **Step 1: `TurnstileWidget.tsx` oluştur (paylaşılan component)**

```typescript
// components/rfq/TurnstileWidget.tsx
"use client";

import { Turnstile } from "@marsidev/react-turnstile";
import { env } from "@/lib/env";

interface Props {
  onSuccess: (token: string) => void;
  onExpire?: () => void;
  action?: string;
}

export function TurnstileWidget({ onSuccess, onExpire, action }: Props) {
  return (
    <Turnstile
      siteKey={env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
      options={{ theme: "dark", size: "normal", action: action ?? "submit" }}
      onSuccess={onSuccess}
      onExpire={onExpire}
    />
  );
}
```

- [ ] **Step 2: Yeni i18n key'leri ekle `messages/tr/pages.json`'a (contact.form altına)**

```json
{
  "pages": {
    "contact": {
      "form": {
        "honeypotLabel": "Yalnız bot kontrolü",
        "turnstileHint": "Güvenlik kontrolü devam ediyor…",
        "errorTurnstile": "Güvenlik kontrolü başarısız. Sayfayı yenileyip tekrar deneyin.",
        "errorRateLimit": "Çok fazla istek. Lütfen {minutes} dakika sonra tekrar deneyin.",
        "errorGeneric": "Mesaj gönderilemedi. Lütfen tekrar deneyin."
      }
    }
  }
}
```

EN/RU/AR'a da uygun çevirileri ekle. (Plan'da çeviri metinleri kısaltılmış; implementer her dilde glossary'deki terimlere göre yazar.)

- [ ] **Step 3: `ContactForm.tsx`'yi yeniden yaz**

```typescript
// components/contact/ContactForm.tsx
"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { TurnstileWidget } from "@/components/rfq/TurnstileWidget";

type SubjectKey = "general" | "quote" | "support" | "other";
const SUBJECT_KEYS: readonly SubjectKey[] = ["general", "quote", "support", "other"];

type Status = "idle" | "submitting" | "success" | "error";

export function ContactForm() {
  const t = useTranslations("pages.contact.form");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!turnstileToken) {
      setError(t("turnstileHint"));
      return;
    }

    const form = event.currentTarget;
    const data = new FormData(form);

    const payload = {
      name: String(data.get("name") ?? "").trim(),
      email: String(data.get("email") ?? "").trim(),
      company: String(data.get("company") ?? "").trim(),
      phone: String(data.get("phone") ?? "").trim(),
      subject: String(data.get("subject") ?? "general") as SubjectKey,
      message: String(data.get("message") ?? "").trim(),
      honeypot: String(data.get("website") ?? ""), // honeypot field
      locale,
      turnstileToken,
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const json = await res.json().catch(() => ({}));
        const retryAfter = Number(json?.retryAfter ?? 60);
        setError(t("errorRateLimit", { minutes: Math.max(1, Math.ceil(retryAfter / 60)) }));
        setStatus("error");
        return;
      }
      if (res.status === 403) {
        setError(t("errorTurnstile"));
        setStatus("error");
        return;
      }
      if (!res.ok) {
        setError(t("errorGeneric"));
        setStatus("error");
        return;
      }
      setStatus("success");
      form.reset();
      setTurnstileToken(null);
    } catch {
      setError(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "placeholder:text-text-secondary/60",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
    "focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <div>
        <h2 className="text-text-primary text-xl font-semibold">{t("title")}</h2>
        <p className="text-text-secondary mt-1 text-xs">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={t("nameLabel")} required>
          <input type="text" name="name" required autoComplete="name" placeholder={t("namePlaceholder")} className={inputClass} />
        </Field>
        <Field label={t("companyLabel")}>
          <input type="text" name="company" autoComplete="organization" placeholder={t("companyPlaceholder")} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Field label={t("emailLabel")} required>
          <input type="email" name="email" required autoComplete="email" placeholder={t("emailPlaceholder")} className={inputClass} />
        </Field>
        <Field label={t("phoneLabel")}>
          <input type="tel" name="phone" autoComplete="tel" placeholder={t("phonePlaceholder")} className={inputClass} />
        </Field>
      </div>

      <Field label={t("subjectLabel")} required>
        <select name="subject" required defaultValue="general" className={inputClass}>
          {SUBJECT_KEYS.map((key) => (
            <option key={key} value={key}>{t(`subjectOptions.${key}`)}</option>
          ))}
        </select>
      </Field>

      <Field label={t("messageLabel")} required>
        <textarea name="message" required minLength={10} rows={4} placeholder={t("messagePlaceholder")} className={cn(inputClass, "resize-y")} />
      </Field>

      {/* Honeypot: visually hidden, robots only */}
      <label aria-hidden="true" className="sr-only" tabIndex={-1}>
        <span>{t("honeypotLabel")}</span>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="pt-1">
        <TurnstileWidget onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} action="contact" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-[var(--color-accent-red)]">{error}</p>
      )}
      {status === "success" && (
        <p role="status" className="text-sm text-emerald-400">{t("submitted")}</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "submitting" || !turnstileToken}
          className={cn(
            "rounded-sm bg-[var(--color-accent-red)] px-5 py-2.5 text-sm font-semibold text-white",
            "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {status === "submitting" ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}

interface FieldProps { label: string; required?: boolean; children: React.ReactNode; }
function Field({ label, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-text-primary mb-1 block text-xs font-medium">
        {label}
        {required && <span className="ms-1 text-[var(--color-accent-red)]">*</span>}
      </span>
      {children}
    </label>
  );
}
```

- [ ] **Step 4: Typecheck + vitest mevcut test**

```bash
pnpm typecheck
pnpm test -- --run
```

Not: Mevcut Vitest suite'te ContactForm testi yoksa geçer. Varsa yeni fetch-mocked test ekle.

- [ ] **Step 5: Commit**

```bash
git add components/contact/ContactForm.tsx components/rfq/TurnstileWidget.tsx messages
git commit -m "refactor(contact): migrate ContactForm from mailto to /api/contact"
```

---

## Phase F — RFQ Formları, API ve Routes

### Task 21: `app/api/rfq/route.ts` — RFQ submit endpoint

**Files:**
- Create: `app/api/rfq/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/api/rfq/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { customRfqSchema, standartRfqSchema } from "@/lib/validation/rfq";
import { verifyTurnstile } from "@/lib/turnstile";
import { rfqLimiter, ipFromHeaders } from "@/lib/rate-limit";
import { getResend } from "@/lib/email/client";
import { env } from "@/lib/env";
import { renderRfqTeamEmail } from "@/lib/email/templates/rfq-team";
import { renderRfqCustomerEmail } from "@/lib/email/templates/rfq-customer";
import { recordAudit } from "@/lib/audit";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = ipFromHeaders(request.headers);
  const ua = request.headers.get("user-agent") ?? null;

  // 1) Rate limit
  const rl = rfqLimiter.check(ip);
  if (!rl.allowed) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retryAfter: rl.retryAfter },
      { status: 429, headers: { "retry-after": String(rl.retryAfter) } },
    );
  }

  // 2) Body parse + discriminate
  let raw: unknown;
  try { raw = await request.json(); } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }
  const kind = (raw as { kind?: string } | null)?.kind;
  if (kind !== "custom" && kind !== "standart") {
    return NextResponse.json({ ok: false, error: "bad_kind" }, { status: 400 });
  }

  // 3) Validate by kind
  const schema = kind === "custom" ? customRfqSchema : standartRfqSchema;
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", issues: parsed.error.issues.map((i) => ({ path: i.path, message: i.message })) },
      { status: 422 },
    );
  }
  const input = parsed.data;

  // 4) Turnstile
  const ok = await verifyTurnstile(input.turnstileToken, ip);
  if (!ok) {
    return NextResponse.json({ ok: false, error: "turnstile_failed" }, { status: 403 });
  }

  // 5) Persist RFQ (via service client — anon RLS permits insert but we need to also link IP/UA safely)
  const supabase = createServiceClient();
  const contact = input.contact;
  const attachments = "attachments" in input ? input.attachments ?? [] : [];
  const payloadJson = stripForStorage(input);

  const { data: row, error: insertError } = await supabase
    .from("rfqs")
    .insert({
      type: kind,
      status: "new",
      locale: input.locale,
      contact: contact as never,
      payload: payloadJson as never,
      attachments: attachments as never,
      ip_address: ip === "unknown" ? null : ip,
      user_agent: ua,
    })
    .select("id")
    .single();

  if (insertError || !row) {
    // eslint-disable-next-line no-console
    console.error("[rfq] insert failed", insertError?.message);
    return NextResponse.json({ ok: false, error: "db_failed" }, { status: 500 });
  }

  const rfqId = row.id;
  const origin = env.NEXT_PUBLIC_SITE_URL ?? new URL(request.url).origin;

  // 6) Emails
  const team = renderRfqTeamEmail({
    id: rfqId,
    type: kind,
    locale: input.locale,
    contact: {
      name: contact.name,
      email: contact.email,
      company: contact.company,
      phone: contact.phone,
      country: contact.country,
    },
    payload: payloadJson,
    attachmentCount: attachments.length,
    ip,
    adminUrl: `${origin}/admin/inbox/${rfqId}`,
  });
  const customer = renderRfqCustomerEmail({
    name: contact.name,
    rfqId,
    type: kind,
    locale: input.locale,
  });

  try {
    const resend = getResend();
    await Promise.all([
      resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: env.RESEND_TEAM_EMAIL,
        replyTo: contact.email,
        subject: team.subject,
        html: team.html,
        text: team.text,
      }),
      resend.emails.send({
        from: env.RESEND_FROM_EMAIL,
        to: contact.email,
        subject: customer.subject,
        html: customer.html,
        text: customer.text,
      }),
    ]);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[rfq] email failed (rfq already persisted)", e);
    // Do NOT fail the request — RFQ row exists; admin can still see it.
  }

  await recordAudit({
    action: "rfq_submitted",
    entity_type: "rfq",
    entity_id: rfqId,
    user_id: null,
    ip,
    diff: { type: kind, locale: input.locale, attachmentCount: attachments.length },
  });

  return NextResponse.json({ ok: true, id: rfqId });
}

function stripForStorage(input: Record<string, unknown>): Record<string, unknown> {
  // Turnstile token ve honeypot DB'ye yazılmaz (PII değil ama anlamsız).
  const { turnstileToken: _t, honeypot: _h, contact: _c, ...rest } = input as {
    turnstileToken: string; honeypot: string; contact: unknown; [k: string]: unknown;
  };
  void _t; void _h; void _c;
  return rest;
}
```

- [ ] **Step 2: Smoke test**

```bash
curl -X POST http://localhost:3000/api/rfq \
  -H "content-type: application/json" \
  -d '{"kind":"custom","contact":{"name":"Ali","email":"a@b.com","company":"Acme","phone":"+905551112233","country":"TR"},"sector":"kapak","description":"...lutfen buraya 50 karakterden uzun yazi koyun, test icin birazcik daha ekliyorum.","annualVolume":"10k","tolerance":"medium","targetDate":"","ndaRequired":false,"kvkkConsent":true,"attachments":[],"locale":"tr","turnstileToken":"XXXX.DUMMY.TOKEN","honeypot":"","materials":[]}'
```

Beklenen: `{"ok":true,"id":"..."}`.

- [ ] **Step 3: Commit**

```bash
git add app/api/rfq/route.ts
git commit -m "feat(api): /api/rfq unified endpoint for custom and standart submissions"
```

---

### Task 22: `components/rfq/FileUploader.tsx` — client-side Storage upload

**Files:**
- Create: `components/rfq/FileUploader.tsx`

Not: MVP: maks 5 dosya, max 10 MB/dosya, 25 MB toplam. Uzantı whitelist: `.pdf .jpg .jpeg .png .step .stp .iges .igs`. UUID rename.

- [ ] **Step 1: Implement**

```typescript
// components/rfq/FileUploader.tsx
"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export interface UploadedFile {
  path: string;
  name: string;
  size: number;
  mime: string;
}

interface Props {
  rfqDraftId: string;           // UUID generated once per form mount
  maxFiles?: number;
  maxPerFileBytes?: number;
  maxTotalBytes?: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}

const DEFAULT_ALLOWED = /\.(pdf|jpe?g|png|st[ep]|igs?|iges)$/i;

export function FileUploader({
  rfqDraftId,
  maxFiles = 5,
  maxPerFileBytes = 10 * 1024 * 1024,
  maxTotalBytes = 25 * 1024 * 1024,
  value,
  onChange,
}: Props) {
  const t = useTranslations("rfq.upload");
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handlePick = useCallback(async (files: FileList | null) => {
    if (!files) return;
    setErr(null);
    const picked = Array.from(files);
    const room = maxFiles - value.length;
    if (picked.length > room) {
      setErr(t("errMaxFiles", { max: maxFiles }));
      return;
    }
    const currentTotal = value.reduce((s, f) => s + f.size, 0);
    for (const f of picked) {
      if (!DEFAULT_ALLOWED.test(f.name)) {
        setErr(t("errUnsupported", { name: f.name }));
        return;
      }
      if (f.size > maxPerFileBytes) {
        setErr(t("errTooBig", { name: f.name, mb: Math.round(maxPerFileBytes / (1024 * 1024)) }));
        return;
      }
    }
    const pickedTotal = picked.reduce((s, f) => s + f.size, 0);
    if (currentTotal + pickedTotal > maxTotalBytes) {
      setErr(t("errTotalTooBig", { mb: Math.round(maxTotalBytes / (1024 * 1024)) }));
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const results: UploadedFile[] = [];
    for (const f of picked) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${rfqDraftId}/${crypto.randomUUID()}-${safeName}`;
      const { error } = await supabase.storage.from("rfq-attachments").upload(path, f, {
        contentType: f.type || "application/octet-stream",
        upsert: false,
      });
      if (error) {
        setErr(t("errUpload", { name: f.name }));
        setBusy(false);
        return;
      }
      results.push({ path, name: f.name, size: f.size, mime: f.type || "application/octet-stream" });
    }
    onChange([...value, ...results]);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }, [maxFiles, maxPerFileBytes, maxTotalBytes, onChange, rfqDraftId, t, value]);

  const handleRemove = useCallback(async (path: string) => {
    const supabase = createClient();
    await supabase.storage.from("rfq-attachments").remove([path]);
    onChange(value.filter((f) => f.path !== path));
  }, [onChange, value]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png,.step,.stp,.igs,.iges"
          onChange={(e) => handlePick(e.target.files)}
          disabled={busy || value.length >= maxFiles}
          className="text-sm"
        />
        {busy && <span className="text-text-secondary text-xs">{t("uploading")}</span>}
      </div>
      <ul className="space-y-1">
        {value.map((f) => (
          <li key={f.path} className="flex items-center justify-between text-xs">
            <span className="truncate">{f.name} · {(f.size / 1024).toFixed(0)} KB</span>
            <button
              type="button"
              onClick={() => handleRemove(f.path)}
              className={cn("ms-2 rounded-sm px-2 py-1 text-xs text-[var(--color-accent-red)]", "hover:underline")}
            >
              {t("remove")}
            </button>
          </li>
        ))}
      </ul>
      {err && <p role="alert" className="text-sm text-[var(--color-accent-red)]">{err}</p>}
      <p className="text-text-secondary text-xs">{t("hint", { max: maxFiles, mb: Math.round(maxPerFileBytes / (1024 * 1024)) })}</p>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add components/rfq/FileUploader.tsx
git commit -m "feat(rfq): FileUploader with client-side Storage upload"
```

---

### Task 23: `components/rfq/CustomRfqForm.tsx` + route

**Files:**
- Create: `components/rfq/CustomRfqForm.tsx`
- Create: `app/[locale]/teklif-iste/ozel-uretim/page.tsx`
- Modify: `messages/{tr,en,ru,ar}/rfq.json` (new namespace)

- [ ] **Step 1: Messages yarat (örnek TR)**

```json
// messages/tr/rfq.json
{
  "hub": {
    "eyebrow": "Teklif İste",
    "title": "İhtiyacınıza uygun yolu seçin",
    "customTitle": "Özel Üretim",
    "customDescription": "Proje brief'inizi paylaşın, ekibimiz fizibilite ile dönsün.",
    "standartTitle": "Standart Ürün",
    "standartDescription": "Katalogdan ürün seçin, varyant ve adet belirtin."
  },
  "custom": {
    "title": "Özel Üretim Teklif Talebi",
    "subtitle": "Proje brief'inizi ve teknik gereksinimlerinizi paylaşın.",
    "submit": "Talebi Gönder",
    "submitting": "Gönderiliyor…",
    "success": "Talebiniz alındı. 1-2 iş günü içinde döneceğiz.",
    "errorRateLimit": "Çok fazla istek. Lütfen {minutes} dk sonra deneyin.",
    "errorTurnstile": "Güvenlik kontrolü başarısız.",
    "errorGeneric": "Talep gönderilemedi. Lütfen tekrar deneyin.",
    "contactSection": "İletişim",
    "projectSection": "Proje",
    "filesSection": "Dosyalar (opsiyonel)",
    "consent": "KVKK / GDPR aydınlatma metnini okudum ve kabul ediyorum.",
    "nameLabel": "Ad Soyad",
    "emailLabel": "E-posta",
    "companyLabel": "Şirket",
    "phoneLabel": "Telefon",
    "countryLabel": "Ülke",
    "sectorLabel": "Sektör",
    "sectorOptions": {
      "cam-yikama": "Cam Yıkama",
      "kapak": "Kapak",
      "tekstil": "Tekstil",
      "diger": "Diğer"
    },
    "descriptionLabel": "Proje açıklaması",
    "descriptionHint": "En az 50 karakter. Kullanım amacı, hedef pazar, üretim hacmi.",
    "volumeLabel": "Yıllık tahmini adet",
    "toleranceLabel": "Tolerans hassasiyeti",
    "toleranceOptions": { "low": "Düşük", "medium": "Orta", "high": "Yüksek" },
    "materialsLabel": "Malzeme tercihi",
    "targetDateLabel": "Hedef tarih",
    "ndaLabel": "NDA gerekli"
  },
  "standart": {
    "title": "Standart Ürün Teklif Talebi",
    "subtitle": "Katalogdan ürün seçin.",
    "submit": "Talebi Gönder",
    "submitting": "Gönderiliyor…",
    "success": "Talebiniz alındı.",
    "errorRateLimit": "Çok fazla istek.",
    "errorTurnstile": "Güvenlik kontrolü başarısız.",
    "errorGeneric": "Gönderilemedi.",
    "itemsSection": "Ürünler",
    "addItem": "Ürün ekle",
    "qtyLabel": "Adet",
    "variantLabel": "Varyant",
    "notesLabel": "Notlar",
    "urgentLabel": "Acil",
    "consent": "KVKK / GDPR aydınlatma metnini okudum ve kabul ediyorum."
  },
  "upload": {
    "uploading": "Yükleniyor…",
    "remove": "Kaldır",
    "hint": "En fazla {max} dosya, her biri {mb} MB.",
    "errMaxFiles": "En fazla {max} dosya yükleyebilirsiniz.",
    "errUnsupported": "Desteklenmeyen dosya: {name}",
    "errTooBig": "{name} {mb} MB'dan büyük.",
    "errTotalTooBig": "Toplam dosya boyutu {mb} MB'ı geçemez.",
    "errUpload": "Yükleme hatası: {name}"
  }
}
```

EN, RU, AR için aynı anahtarları glossary'ye uygun çevirilerle ekle. (Çeviri içeriği: implementer üretir; anahtar şema aynı kalmalı.)

- [ ] **Step 2: `i18n/request.ts` namespace'leri oku (rfq.json yeni namespace)**

Mevcut `i18n/request.ts`'te JSON load logic her dosyayı otomatik birleştiriyorsa değişiklik gerekmez. Değilse `rfq` anahtarını merge listesine ekle:

```bash
grep -n "messages" i18n/request.ts
```

Gerekirse `rfq.json` include edilsin diye dosyayı güncelle.

- [ ] **Step 3: `CustomRfqForm.tsx` implement**

```typescript
// components/rfq/CustomRfqForm.tsx
"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { FileUploader, type UploadedFile } from "./FileUploader";
import { TurnstileWidget } from "./TurnstileWidget";

const SECTORS = ["cam-yikama", "kapak", "tekstil", "diger"] as const;
const VOLUMES = ["1k", "5k", "10k", "50k", "100k+", "unknown"] as const;
const TOLERANCES = ["low", "medium", "high"] as const;
const MATERIALS = ["PP", "PE", "ABS", "POM", "PA", "PC", "PET", "Other"] as const;

type Status = "idle" | "submitting" | "success" | "error";

export function CustomRfqForm() {
  const t = useTranslations("rfq.custom");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const rfqDraftId = useMemo(() => crypto.randomUUID(), []);
  const [attachments, setAttachments] = useState<UploadedFile[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [materials, setMaterials] = useState<string[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!turnstileToken) { setErr(t("errorTurnstile")); return; }
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      kind: "custom" as const,
      contact: {
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        country: String(data.get("country") ?? "TR").trim(),
      },
      sector: String(data.get("sector") ?? "diger"),
      description: String(data.get("description") ?? "").trim(),
      materials,
      annualVolume: String(data.get("annualVolume") ?? "unknown"),
      tolerance: String(data.get("tolerance") ?? "medium") || undefined,
      targetDate: String(data.get("targetDate") ?? ""),
      ndaRequired: data.get("nda") === "on",
      kvkkConsent: data.get("consent") === "on" ? true : false,
      attachments,
      locale,
      turnstileToken,
      honeypot: String(data.get("website") ?? ""),
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setErr(t("errorRateLimit", { minutes: Math.max(1, Math.ceil(Number(j?.retryAfter ?? 60) / 60)) }));
        setStatus("error"); return;
      }
      if (res.status === 403) { setErr(t("errorTurnstile")); setStatus("error"); return; }
      if (!res.ok) { setErr(t("errorGeneric")); setStatus("error"); return; }
      setStatus("success");
      form.reset();
      setAttachments([]);
      setMaterials([]);
      setTurnstileToken(null);
    } catch {
      setErr(t("errorGeneric"));
      setStatus("error");
    }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "placeholder:text-text-secondary/60 focus:outline-none",
    "focus:border-[var(--color-accent-blue)] focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {/* Contact */}
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("contactSection")}</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("nameLabel")} required><input name="name" required className={inputClass} autoComplete="name" /></L>
          <L label={t("companyLabel")} required><input name="company" required className={inputClass} autoComplete="organization" /></L>
          <L label={t("emailLabel")} required><input name="email" type="email" required className={inputClass} autoComplete="email" /></L>
          <L label={t("phoneLabel")} required><input name="phone" type="tel" required className={inputClass} autoComplete="tel" /></L>
          <L label={t("countryLabel")} required><input name="country" defaultValue="TR" maxLength={4} required className={inputClass} /></L>
        </div>
      </fieldset>

      {/* Project */}
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("projectSection")}</legend>
        <L label={t("sectorLabel")} required>
          <select name="sector" required className={inputClass}>
            {SECTORS.map((s) => <option key={s} value={s}>{t(`sectorOptions.${s}`)}</option>)}
          </select>
        </L>
        <L label={t("descriptionLabel")} required hint={t("descriptionHint")}>
          <textarea name="description" required minLength={50} maxLength={2000} rows={6} className={inputClass} />
        </L>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("volumeLabel")} required>
            <select name="annualVolume" required className={inputClass}>
              {VOLUMES.map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </L>
          <L label={t("toleranceLabel")}>
            <select name="tolerance" defaultValue="medium" className={inputClass}>
              {TOLERANCES.map((x) => <option key={x} value={x}>{t(`toleranceOptions.${x}`)}</option>)}
            </select>
          </L>
        </div>
        <L label={t("materialsLabel")}>
          <div className="flex flex-wrap gap-2">
            {MATERIALS.map((m) => (
              <label key={m} className="text-text-primary inline-flex cursor-pointer items-center gap-1 rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs">
                <input
                  type="checkbox"
                  checked={materials.includes(m)}
                  onChange={(e) => setMaterials(e.target.checked ? [...materials, m] : materials.filter((x) => x !== m))}
                />
                <span>{m}</span>
              </label>
            ))}
          </div>
        </L>
        <div className="grid gap-3 md:grid-cols-2">
          <L label={t("targetDateLabel")}><input name="targetDate" type="date" className={inputClass} /></L>
          <L label={t("ndaLabel")}><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" name="nda" /> NDA</label></L>
        </div>
      </fieldset>

      {/* Files */}
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("filesSection")}</legend>
        <FileUploader rfqDraftId={rfqDraftId} value={attachments} onChange={setAttachments} />
      </fieldset>

      {/* Honeypot + consent + turnstile */}
      <label aria-hidden="true" className="sr-only" tabIndex={-1}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <label className="text-text-primary flex items-start gap-2 text-xs">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>{t("consent")}</span>
      </label>

      <TurnstileWidget onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} action="rfq_custom" />

      {err && <p role="alert" className="text-sm text-[var(--color-accent-red)]">{err}</p>}
      {status === "success" && <p role="status" className="text-sm text-emerald-400">{t("success")}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || !turnstileToken}
        className={cn("rounded-sm bg-[var(--color-accent-red)] px-5 py-2.5 text-sm font-semibold text-white",
          "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60")}
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}

function L({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-text-primary mb-1 block text-xs font-medium">
        {label}{required && <span className="ms-1 text-[var(--color-accent-red)]">*</span>}
      </span>
      {children}
      {hint && <span className="text-text-secondary mt-1 block text-xs">{hint}</span>}
    </label>
  );
}
```

- [ ] **Step 4: Route `/teklif-iste/ozel-uretim` sayfası**

```typescript
// app/[locale]/teklif-iste/ozel-uretim/page.tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { CustomRfqForm } from "@/components/rfq/CustomRfqForm";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq.custom" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/teklif-iste/ozel-uretim`,
      languages: buildAlternates("/teklif-iste/ozel-uretim", origin).languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq.custom");
  return (
    <section className="container mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-text-primary text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="text-text-secondary mt-2 text-sm md:text-base">{t("subtitle")}</p>
      </header>
      <CustomRfqForm />
    </section>
  );
}
```

- [ ] **Step 5: `lib/seo/routes.ts`'in `/teklif-iste/*` yollarını zaten içerip içermediğini kontrol et**

```bash
grep -n "teklif-iste" lib/seo/routes.ts
```

Eğer sitemap'te yoksa `/teklif-iste`, `/teklif-iste/ozel-uretim`, `/teklif-iste/standart` yollarını ekle.

- [ ] **Step 6: Typecheck + build smoke**

```bash
pnpm typecheck
pnpm build
```

- [ ] **Step 7: Commit**

```bash
git add components/rfq/CustomRfqForm.tsx app/[locale]/teklif-iste/ozel-uretim messages lib/seo/routes.ts
git commit -m "feat(rfq): custom RFQ form with file upload and Turnstile"
```

---

### Task 24: `components/rfq/StandartRfqForm.tsx` + ProductPicker + route

**Files:**
- Create: `components/rfq/ProductPicker.tsx`
- Create: `components/rfq/StandartRfqForm.tsx`
- Create: `app/[locale]/teklif-iste/standart/page.tsx`

Not: Standart RFQ için ürün seçimi gerekiyor. `products` tablosu şu an boş (Plan 4'te CRUD). MVP için ProductPicker: kullanıcı **manuel** "Ürün kodu / adı" yazar + varyant + adet girer — catalog dropdown yok. Plan 4'te `products` tablosu dolduktan sonra gerçek catalog picker olacak.

- [ ] **Step 1: `ProductPicker.tsx` (free-text entry MVP)**

```typescript
// components/rfq/ProductPicker.tsx
"use client";

import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface ItemRow {
  productSlug: string;
  variant: string;
  qty: number;
}

interface Props {
  value: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  maxItems?: number;
}

export function ProductPicker({ value, onChange, maxItems = 20 }: Props) {
  const t = useTranslations("rfq.standart");
  const canAdd = value.length < maxItems;

  function update(i: number, patch: Partial<ItemRow>) {
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function remove(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([...value, { productSlug: "", variant: "", qty: 100 }]);
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-2 py-1.5 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none",
  );

  return (
    <div className="space-y-3">
      {value.map((row, i) => (
        <div key={i} className="grid grid-cols-1 gap-2 md:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            className={inputClass}
            placeholder="Ürün adı / kodu"
            value={row.productSlug}
            onChange={(e) => update(i, { productSlug: e.target.value })}
          />
          <input
            className={inputClass}
            placeholder={t("variantLabel")}
            value={row.variant}
            onChange={(e) => update(i, { variant: e.target.value })}
          />
          <input
            type="number"
            min={1}
            max={1_000_000}
            className={inputClass}
            placeholder={t("qtyLabel")}
            value={row.qty}
            onChange={(e) => update(i, { qty: Math.max(1, Number(e.target.value) || 1) })}
          />
          <button
            type="button"
            onClick={() => remove(i)}
            className="text-xs text-[var(--color-accent-red)] hover:underline"
          >
            ×
          </button>
        </div>
      ))}
      {canAdd && (
        <button
          type="button"
          onClick={add}
          className="rounded-sm border border-[var(--color-border-subtle-dark)] px-3 py-1.5 text-xs"
        >
          + {t("addItem")}
        </button>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `StandartRfqForm.tsx`**

```typescript
// components/rfq/StandartRfqForm.tsx
"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ProductPicker, type ItemRow } from "./ProductPicker";
import { TurnstileWidget } from "./TurnstileWidget";

const INCOTERMS = ["EXW", "FOB", "CIF", "DAP"] as const;
type Status = "idle" | "submitting" | "success" | "error";

export function StandartRfqForm() {
  const t = useTranslations("rfq.standart");
  const locale = useLocale() as "tr" | "en" | "ru" | "ar";
  const [items, setItems] = useState<ItemRow[]>([{ productSlug: "", variant: "", qty: 100 }]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    if (!turnstileToken) { setErr(t("errorTurnstile")); return; }
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      kind: "standart" as const,
      contact: {
        name: String(data.get("name") ?? "").trim(),
        email: String(data.get("email") ?? "").trim(),
        company: String(data.get("company") ?? "").trim(),
        phone: String(data.get("phone") ?? "").trim(),
        country: String(data.get("country") ?? "TR").trim(),
      },
      items: items.filter((r) => r.productSlug.trim().length > 0),
      deliveryCountry: String(data.get("deliveryCountry") ?? ""),
      incoterm: (String(data.get("incoterm") ?? "") || undefined) as "EXW" | "FOB" | "CIF" | "DAP" | undefined,
      notes: String(data.get("notes") ?? ""),
      urgent: data.get("urgent") === "on",
      kvkkConsent: data.get("consent") === "on" ? true : false,
      locale,
      turnstileToken,
      honeypot: String(data.get("website") ?? ""),
    };

    setStatus("submitting");
    try {
      const res = await fetch("/api/rfq", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.status === 429) {
        const j = await res.json().catch(() => ({}));
        setErr(t("errorRateLimit", { minutes: Math.max(1, Math.ceil(Number(j?.retryAfter ?? 60) / 60)) }));
        setStatus("error"); return;
      }
      if (res.status === 403) { setErr(t("errorTurnstile")); setStatus("error"); return; }
      if (!res.ok) { setErr(t("errorGeneric")); setStatus("error"); return; }
      setStatus("success");
      form.reset();
      setItems([{ productSlug: "", variant: "", qty: 100 }]);
      setTurnstileToken(null);
    } catch { setErr(t("errorGeneric")); setStatus("error"); }
  }

  const inputClass = cn(
    "w-full rounded-sm border border-[var(--color-border-subtle-dark)]",
    "bg-bg-primary/60 px-3 py-2 text-sm text-text-primary",
    "focus:border-[var(--color-accent-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-blue)]/30",
  );

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">{t("itemsSection")}</legend>
        <ProductPicker value={items} onChange={setItems} />
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-text-primary text-sm font-semibold">Contact</legend>
        <div className="grid gap-3 md:grid-cols-2">
          <input name="name" required placeholder="Ad Soyad" className={inputClass} autoComplete="name" />
          <input name="company" required placeholder="Şirket" className={inputClass} autoComplete="organization" />
          <input name="email" type="email" required placeholder="E-posta" className={inputClass} autoComplete="email" />
          <input name="phone" type="tel" required placeholder="Telefon" className={inputClass} autoComplete="tel" />
          <input name="country" defaultValue="TR" maxLength={4} required placeholder="Ülke" className={inputClass} />
          <input name="deliveryCountry" maxLength={4} placeholder="Teslimat ülkesi" className={inputClass} />
          <select name="incoterm" defaultValue="" className={inputClass}>
            <option value="">Incoterm seçiniz</option>
            {INCOTERMS.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
      </fieldset>

      <label className="block">
        <span className="text-text-primary mb-1 block text-xs font-medium">{t("notesLabel")}</span>
        <textarea name="notes" maxLength={1000} rows={4} className={inputClass} />
      </label>

      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="urgent" /> {t("urgentLabel")}
      </label>

      <label aria-hidden="true" className="sr-only" tabIndex={-1}>
        <input type="text" name="website" tabIndex={-1} autoComplete="off" />
      </label>

      <label className="text-text-primary flex items-start gap-2 text-xs">
        <input type="checkbox" name="consent" required className="mt-0.5" />
        <span>{t("consent")}</span>
      </label>

      <TurnstileWidget onSuccess={setTurnstileToken} onExpire={() => setTurnstileToken(null)} action="rfq_standart" />

      {err && <p role="alert" className="text-sm text-[var(--color-accent-red)]">{err}</p>}
      {status === "success" && <p role="status" className="text-sm text-emerald-400">{t("success")}</p>}

      <button
        type="submit"
        disabled={status === "submitting" || !turnstileToken}
        className={cn("rounded-sm bg-[var(--color-accent-red)] px-5 py-2.5 text-sm font-semibold text-white",
          "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60")}
      >
        {status === "submitting" ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
```

- [ ] **Step 3: Route sayfası**

```typescript
// app/[locale]/teklif-iste/standart/page.tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";
import { StandartRfqForm } from "@/components/rfq/StandartRfqForm";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq.standart" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("subtitle"),
    alternates: {
      canonical: `${origin}/${locale}/teklif-iste/standart`,
      languages: buildAlternates("/teklif-iste/standart", origin).languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq.standart");
  return (
    <section className="container mx-auto max-w-3xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-text-primary text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
        <p className="text-text-secondary mt-2 text-sm md:text-base">{t("subtitle")}</p>
      </header>
      <StandartRfqForm />
    </section>
  );
}
```

- [ ] **Step 4: Typecheck + build smoke**

```bash
pnpm typecheck
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add components/rfq/ProductPicker.tsx components/rfq/StandartRfqForm.tsx app/[locale]/teklif-iste/standart
git commit -m "feat(rfq): standart RFQ form with ProductPicker and Turnstile"
```

---

### Task 25: `/teklif-iste` hub sayfası

**Files:**
- Create: `app/[locale]/teklif-iste/page.tsx`

- [ ] **Step 1: Implement**

```typescript
// app/[locale]/teklif-iste/page.tsx
import type { Metadata } from "next";
import { setRequestLocale, getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import { Link } from "@/i18n/navigation";
import { buildAlternates } from "@/lib/seo/routes";
import { env } from "@/lib/env";

interface PageProps { params: Promise<{ locale: Locale }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "rfq.hub" });
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "https://kitaplastik.com";
  return {
    title: `${t("title")} | Kıta Plastik`,
    description: t("customDescription"),
    alternates: {
      canonical: `${origin}/${locale}/teklif-iste`,
      languages: buildAlternates("/teklif-iste", origin).languages,
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("rfq.hub");
  return (
    <section className="container mx-auto max-w-5xl px-6 py-12">
      <header className="mb-10 max-w-2xl">
        <p className="eyebrow">{t("eyebrow")}</p>
        <h1 className="text-text-primary mt-2 text-3xl font-semibold tracking-tight md:text-4xl">{t("title")}</h1>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Link
          href="/teklif-iste/ozel-uretim"
          className="bg-bg-secondary/40 block rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-red)]/50"
        >
          <h2 className="text-text-primary text-xl font-semibold">{t("customTitle")}</h2>
          <p className="text-text-secondary mt-2 text-sm">{t("customDescription")}</p>
        </Link>
        <Link
          href="/teklif-iste/standart"
          className="bg-bg-secondary/40 block rounded-lg border border-[var(--color-border-subtle-dark)] p-6 transition hover:border-[var(--color-accent-blue)]/50"
        >
          <h2 className="text-text-primary text-xl font-semibold">{t("standartTitle")}</h2>
          <p className="text-text-secondary mt-2 text-sm">{t("standartDescription")}</p>
        </Link>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Header nav'a link ekle (common.json veya nav.json'da "rfq" key'i varsa)**

```bash
grep -n "teklif-iste\|rfq\|quote" components/layout/Header.tsx messages/tr/nav.json
```

Eğer nav'da yoksa `nav.json`'a `"rfq": "Teklif İste"` ekle ve Header'da link göster.

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/teklif-iste/page.tsx messages
git commit -m "feat(rfq): /teklif-iste hub page with two funnel cards"
```

---

## Phase G — Admin Paneli

### Task 26: İlk admin kullanıcıyı manuel oluştur

**Files:** (yok — manuel dashboard adımı)

Not: Bu task plan ilerisi için ön koşul. İnteraktif olduğu için kullanıcı elle yapacak.

- [ ] **Step 1: Supabase dashboard → Authentication → Users → "Add user" (email: `berkayturk6@gmail.com`, auto-confirm)**

- [ ] **Step 2: User UUID'yi kopyala; `admin_users` tablosuna insert**

```bash
pnpm exec supabase db psql -c "insert into public.admin_users (user_id, role, display_name) values ('<user-uuid>','admin','Berkay') on conflict (user_id) do update set role='admin';"
```

Not: Uzak DB için `--linked` ile psql: `pnpm exec supabase db psql --linked -c "..."`.

- [ ] **Step 3: Supabase Auth → Settings → Email Auth → enable "Enable Email provider", **disable** "Enable sign ups" (manuel kullanıcı ekleme politikası)**

- [ ] **Step 4: Auth Email templates → Magic Link template'i → Link:**

```
{{ .SiteURL }}/admin/auth/callback?code={{ .TokenHash }}&type=magiclink
```

Not: Supabase default PKCE flow kullanıyor; yukarıdaki `@supabase/ssr` docs'unda önerilen pattern. Subject TR: "Kıta Plastik admin giriş bağlantınız".

---

### Task 27: `lib/admin/auth.ts` — `requireAdmin` + `getAdminUser` helpers

**Files:**
- Create: `lib/admin/auth.ts`

- [ ] **Step 1: Implement**

```typescript
// lib/admin/auth.ts
import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export interface AdminUser {
  id: string;
  email: string;
  role: "admin" | "sales" | "viewer";
  displayName: string | null;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user?.email) return null;

  // Service client to read admin_users across RLS (policy allows self-read; either works)
  const svc = createServiceClient();
  const { data: adminRow } = await svc
    .from("admin_users")
    .select("user_id, role, display_name")
    .eq("user_id", user.id)
    .single();
  if (!adminRow) return null;
  return {
    id: user.id,
    email: user.email,
    role: adminRow.role as AdminUser["role"],
    displayName: adminRow.display_name,
  };
}

export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdminRole(): Promise<AdminUser> {
  const user = await requireAdmin();
  if (user.role !== "admin") redirect("/admin/inbox");
  return user;
}
```

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```

- [ ] **Step 3: Commit**

```bash
git add lib/admin/auth.ts
git commit -m "feat(admin): getAdminUser + requireAdmin helpers"
```

---

### Task 28: `/admin/login` sayfası + magic link form

**Files:**
- Create: `app/admin/login/page.tsx`
- Create: `app/admin/login/actions.ts`

- [ ] **Step 1: Server action (magic link gönder)**

```typescript
// app/admin/login/actions.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

interface Result { ok: boolean; message: string }

export async function sendMagicLink(prevState: Result, formData: FormData): Promise<Result> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = String(formData.get("next") ?? "/admin/inbox");
  if (!email || !email.includes("@")) {
    return { ok: false, message: "Geçerli bir e-posta girin." };
  }
  const supabase = await createClient();
  const origin = env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/admin/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: false,   // sadece var olan admin kullanıcılar
    },
  });
  if (error) {
    return { ok: false, message: "Bağlantı gönderilemedi. Lütfen tekrar deneyin." };
  }
  return { ok: true, message: "E-posta gönderildi. Lütfen gelen kutunuzu kontrol edin." };
}
```

- [ ] **Step 2: Login sayfası**

```typescript
// app/admin/login/page.tsx
"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

interface SearchParams { next?: string }

export default function LoginPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [state, action, pending] = useActionState(sendMagicLink, { ok: false, message: "" });
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <form
        action={action}
        className="w-full max-w-sm space-y-4 rounded-lg border border-[var(--color-border-subtle-dark)] bg-bg-secondary/40 p-6"
      >
        <h1 className="text-text-primary text-xl font-semibold">Admin Girişi</h1>
        <p className="text-text-secondary text-xs">
          Kayıtlı e-posta adresinize tek kullanımlık giriş bağlantısı göndeririz.
        </p>
        <label className="block">
          <span className="text-text-primary mb-1 block text-xs font-medium">E-posta</span>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm text-text-primary"
          />
        </label>
        <NextField searchParams={searchParams} />
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Gönderiliyor…" : "Bağlantıyı Gönder"}
        </button>
        {state.message && (
          <p className={state.ok ? "text-emerald-400 text-sm" : "text-[var(--color-accent-red)] text-sm"}>
            {state.message}
          </p>
        )}
      </form>
    </main>
  );
}

async function NextField({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  return <input type="hidden" name="next" value={sp?.next ?? "/admin/inbox"} />;
}
```

Not: `NextField` client boundary'de async olamaz. Düzelt: `next` query'yi `useSearchParams()` ile al.

**Doğru versiyon:**

```typescript
// app/admin/login/page.tsx
"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { sendMagicLink } from "./actions";

export default function LoginPage() {
  const sp = useSearchParams();
  const next = sp.get("next") ?? "/admin/inbox";
  const [state, action, pending] = useActionState(sendMagicLink, { ok: false, message: "" });
  return (
    <main className="min-h-screen bg-bg-primary flex items-center justify-center px-6">
      <form action={action} className="w-full max-w-sm space-y-4 rounded-lg border border-[var(--color-border-subtle-dark)] bg-bg-secondary/40 p-6">
        <h1 className="text-text-primary text-xl font-semibold">Admin Girişi</h1>
        <p className="text-text-secondary text-xs">Kayıtlı e-posta adresinize tek kullanımlık giriş bağlantısı göndeririz.</p>
        <label className="block">
          <span className="text-text-primary mb-1 block text-xs font-medium">E-posta</span>
          <input name="email" type="email" required className="w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm text-text-primary" />
        </label>
        <input type="hidden" name="next" value={next} />
        <button type="submit" disabled={pending} className="w-full rounded-sm bg-[var(--color-accent-red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
          {pending ? "Gönderiliyor…" : "Bağlantıyı Gönder"}
        </button>
        {state.message && (
          <p className={state.ok ? "text-emerald-400 text-sm" : "text-[var(--color-accent-red)] text-sm"}>{state.message}</p>
        )}
      </form>
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add app/admin/login
git commit -m "feat(admin): magic-link login page with server action"
```

---

### Task 29: `/admin/auth/callback` — code exchange

**Files:**
- Create: `app/admin/auth/callback/route.ts`

- [ ] **Step 1: Implement**

```typescript
// app/admin/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/admin/inbox";

  if (!code) {
    return NextResponse.redirect(`${origin}/admin/login?error=missing_code`);
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/admin/login?error=exchange_failed`);
  }
  return NextResponse.redirect(`${origin}${next}`);
}
```

- [ ] **Step 2: Manuel test**

1. Lokal dev'de `/admin/login` aç
2. `berkayturk6@gmail.com` gir → Gmail'e magic link gelir
3. Link'e tıkla → `/admin/auth/callback?code=...` → `/admin/inbox` redirect

- [ ] **Step 3: Commit**

```bash
git add app/admin/auth/callback
git commit -m "feat(admin): auth callback route — exchange code for session"
```

---

### Task 30: `/admin` root + layout + Shell

**Files:**
- Create: `app/admin/layout.tsx`
- Create: `app/admin/page.tsx`
- Create: `components/admin/Shell.tsx`

- [ ] **Step 1: Admin layout (NextIntl TR-only provider + global shell)**

```typescript
// app/admin/layout.tsx
import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

const TR_LOCALE = "tr";

// Statik admin namespace'i tek dilde yüklüyoruz
async function loadAdminMessages() {
  const admin = (await import("@/messages/tr/admin.json")).default;
  const common = (await import("@/messages/tr/common.json")).default;
  return { admin, common };
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  setRequestLocale(TR_LOCALE);
  const messages = await loadAdminMessages();
  return (
    <NextIntlClientProvider locale={TR_LOCALE} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 2: Admin root redirect**

```typescript
// app/admin/page.tsx
import { redirect } from "next/navigation";

export default function Page() {
  redirect("/admin/inbox");
}
```

- [ ] **Step 3: `components/admin/Shell.tsx` — header + nav**

```typescript
// components/admin/Shell.tsx
import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { AdminUser } from "@/lib/admin/auth";

interface Props {
  user: AdminUser;
  active: "inbox" | "bildirimler";
  children: ReactNode;
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export function Shell({ user, active, children }: Props) {
  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <header className="flex items-center justify-between border-b border-[var(--color-border-subtle-dark)] px-6 py-3">
        <nav className="flex items-center gap-4 text-sm">
          <span className="font-semibold">Kıta Admin</span>
          <Link href="/admin/inbox" className={active === "inbox" ? "text-[var(--color-accent-red)]" : "text-text-secondary hover:text-text-primary"}>Gelen Kutusu</Link>
          <Link href="/admin/ayarlar/bildirimler" className={active === "bildirimler" ? "text-[var(--color-accent-red)]" : "text-text-secondary hover:text-text-primary"}>Bildirim Alıcıları</Link>
        </nav>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-text-secondary">{user.displayName ?? user.email} · {user.role}</span>
          <form action={signOut}>
            <button type="submit" className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1">Çıkış</button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: `messages/tr/admin.json` iskelet**

```json
{
  "admin": {
    "inbox": {
      "title": "Gelen Kutusu",
      "empty": "Henüz RFQ yok.",
      "filters": {
        "allTypes": "Tüm tipler",
        "allStatuses": "Tüm durumlar",
        "searchPlaceholder": "E-posta, şirket veya isim ara…"
      },
      "columns": {
        "id": "ID",
        "type": "Tip",
        "status": "Durum",
        "company": "Şirket",
        "contact": "İletişim",
        "created": "Tarih"
      },
      "types": { "custom": "Özel", "standart": "Standart" },
      "statuses": {
        "new": "Yeni",
        "reviewing": "İnceleniyor",
        "quoted": "Teklif verildi",
        "won": "Kazanıldı",
        "lost": "Kaybedildi",
        "archived": "Arşiv"
      }
    },
    "detail": {
      "title": "RFQ Detayı",
      "contactSection": "İletişim",
      "payloadSection": "Form Verisi",
      "attachmentsSection": "Ekler",
      "notesLabel": "Dahili Not (markdown)",
      "saveNotes": "Notu Kaydet",
      "statusLabel": "Durum",
      "updateStatus": "Durumu Güncelle",
      "openFile": "İndir"
    },
    "bildirimler": {
      "title": "Bildirim Alıcıları",
      "subtitle": "Yeni RFQ geldiğinde hangi e-postalara bildirim gitsin.",
      "emailLabel": "E-posta",
      "typesLabel": "RFQ tipleri",
      "activeLabel": "Aktif",
      "addButton": "Alıcı Ekle",
      "removeButton": "Kaldır"
    }
  },
  "footer": { "legalName": "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti." }
}
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/layout.tsx app/admin/page.tsx components/admin/Shell.tsx messages/tr/admin.json
git commit -m "feat(admin): TR-only layout, root redirect, and Shell component"
```

---

### Task 31: `/admin/inbox` — RFQ listesi

**Files:**
- Create: `app/admin/inbox/page.tsx`
- Create: `components/admin/InboxTable.tsx`
- Create: `components/admin/StatusBadge.tsx`

- [ ] **Step 1: `StatusBadge`**

```typescript
// components/admin/StatusBadge.tsx
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type RfqStatus = "new" | "reviewing" | "quoted" | "won" | "lost" | "archived";

const STYLES: Record<RfqStatus, string> = {
  new: "bg-blue-500/15 text-blue-300",
  reviewing: "bg-amber-500/15 text-amber-300",
  quoted: "bg-violet-500/15 text-violet-300",
  won: "bg-emerald-500/15 text-emerald-300",
  lost: "bg-red-500/15 text-red-300",
  archived: "bg-slate-500/15 text-slate-300",
};

export function StatusBadge({ status }: { status: RfqStatus }) {
  const t = useTranslations("admin.inbox.statuses");
  return (
    <span className={cn("inline-flex rounded-sm px-2 py-0.5 text-xs font-medium", STYLES[status])}>
      {t(status)}
    </span>
  );
}
```

- [ ] **Step 2: `InboxTable`**

```typescript
// components/admin/InboxTable.tsx
import { useTranslations } from "next-intl";
import Link from "next/link";
import { StatusBadge, type RfqStatus } from "./StatusBadge";

export interface InboxRow {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  company: string;
  name: string;
  email: string;
  createdAt: string;
}

export function InboxTable({ rows }: { rows: InboxRow[] }) {
  const t = useTranslations("admin.inbox");
  if (rows.length === 0) {
    return <p className="text-text-secondary text-sm">{t("empty")}</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead className="border-b border-[var(--color-border-subtle-dark)] text-left text-xs text-text-secondary">
          <tr>
            <th className="py-2 pe-3">{t("columns.type")}</th>
            <th className="py-2 pe-3">{t("columns.status")}</th>
            <th className="py-2 pe-3">{t("columns.company")}</th>
            <th className="py-2 pe-3">{t("columns.contact")}</th>
            <th className="py-2 pe-3">{t("columns.created")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-[var(--color-border-subtle-dark)]/50 align-top hover:bg-white/[0.02]">
              <td className="py-2 pe-3"><Link href={`/admin/inbox/${r.id}`} className="hover:underline">{t(`types.${r.type}`)}</Link></td>
              <td className="py-2 pe-3"><StatusBadge status={r.status} /></td>
              <td className="py-2 pe-3">{r.company}</td>
              <td className="py-2 pe-3">{r.name}<br /><span className="text-text-secondary text-xs">{r.email}</span></td>
              <td className="py-2 pe-3 text-xs text-text-secondary">{new Date(r.createdAt).toLocaleString("tr-TR")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

- [ ] **Step 3: Inbox sayfası**

```typescript
// app/admin/inbox/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { InboxTable, type InboxRow } from "@/components/admin/InboxTable";
import type { RfqStatus } from "@/components/admin/StatusBadge";

interface Row {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  contact: { name?: string; email?: string; company?: string };
  created_at: string;
}

export default async function InboxPage() {
  const user = await requireAdmin();
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("rfqs")
    .select("id, type, status, contact, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const rows: InboxRow[] = !error && data
    ? (data as Row[]).map((r) => ({
        id: r.id,
        type: r.type,
        status: r.status,
        company: r.contact?.company ?? "—",
        name: r.contact?.name ?? "—",
        email: r.contact?.email ?? "—",
        createdAt: r.created_at,
      }))
    : [];

  return (
    <Shell user={user} active="inbox">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight mb-4">Gelen Kutusu</h1>
      <InboxTable rows={rows} />
    </Shell>
  );
}
```

- [ ] **Step 4: Build smoke**

```bash
pnpm typecheck
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/inbox/page.tsx components/admin/InboxTable.tsx components/admin/StatusBadge.tsx
git commit -m "feat(admin): inbox list page with RFQ table"
```

---

### Task 32: `/admin/inbox/[id]` — RFQ detay + status change

**Files:**
- Create: `app/admin/inbox/[id]/page.tsx`
- Create: `app/admin/inbox/[id]/actions.ts`

- [ ] **Step 1: Server actions**

```typescript
// app/admin/inbox/[id]/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";
import { headers } from "next/headers";

const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "archived"] as const;
type Status = (typeof STATUSES)[number];

export async function updateStatus(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "new") as Status;
  if (!STATUSES.includes(status)) throw new Error("invalid_status");

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

  const svc = createServiceClient();
  const { data: before } = await svc.from("rfqs").select("status").eq("id", id).single();
  const { error } = await svc.from("rfqs").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);

  await recordAudit({
    action: "rfq_status_changed",
    entity_type: "rfq",
    entity_id: id,
    user_id: user.id,
    ip,
    diff: { from: before?.status ?? null, to: status },
  });
  revalidatePath(`/admin/inbox/${id}`);
  revalidatePath("/admin/inbox");
}

export async function saveNotes(formData: FormData): Promise<void> {
  const user = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const svc = createServiceClient();
  const { error } = await svc.from("rfqs").update({ internal_notes: notes }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({
    action: "rfq_notes_updated",
    entity_type: "rfq",
    entity_id: id,
    user_id: user.id,
    ip: null,
    diff: { length: notes.length },
  });
  revalidatePath(`/admin/inbox/${id}`);
}
```

- [ ] **Step 2: Detay sayfası**

```typescript
// app/admin/inbox/[id]/page.tsx
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { StatusBadge, type RfqStatus } from "@/components/admin/StatusBadge";
import { updateStatus, saveNotes } from "./actions";

interface Attachment { path: string; name: string; size: number; mime: string }
interface Rfq {
  id: string;
  type: "custom" | "standart";
  status: RfqStatus;
  locale: string;
  contact: Record<string, string>;
  payload: Record<string, unknown>;
  attachments: Attachment[];
  internal_notes: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PageProps { params: Promise<{ id: string }> }

const STATUSES = ["new", "reviewing", "quoted", "won", "lost", "archived"] as const;

export default async function Page({ params }: PageProps) {
  const user = await requireAdmin();
  const { id } = await params;

  const svc = createServiceClient();
  const { data, error } = await svc.from("rfqs").select("*").eq("id", id).single();
  if (error || !data) notFound();
  const rfq = data as Rfq;

  // Signed URLs for attachments
  const signed: Array<Attachment & { url: string | null }> = [];
  for (const a of rfq.attachments ?? []) {
    const { data: s } = await svc.storage.from("rfq-attachments").createSignedUrl(a.path, 60 * 10);
    signed.push({ ...a, url: s?.signedUrl ?? null });
  }

  return (
    <Shell user={user} active="inbox">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-text-primary text-2xl font-semibold tracking-tight">RFQ {rfq.id.slice(0, 8)}</h1>
          <p className="text-text-secondary text-xs">{new Date(rfq.created_at).toLocaleString("tr-TR")} · {rfq.type} · <StatusBadge status={rfq.status} /></p>
        </div>
        <form action={updateStatus} className="flex items-center gap-2">
          <input type="hidden" name="id" value={rfq.id} />
          <select name="status" defaultValue={rfq.status} className="rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-2 py-1 text-xs">
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button type="submit" className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1 text-xs font-semibold text-white">Güncelle</button>
        </form>
      </div>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="bg-bg-secondary/30 rounded-lg border border-[var(--color-border-subtle-dark)] p-4">
          <h2 className="text-text-primary mb-2 text-sm font-semibold">İletişim</h2>
          <dl className="text-xs">
            {Object.entries(rfq.contact).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-2 py-0.5">
                <dt className="text-text-secondary">{k}</dt>
                <dd className="text-text-primary">{String(v)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-2 py-0.5">
              <dt className="text-text-secondary">IP</dt>
              <dd className="text-text-primary">{rfq.ip_address ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <div className="bg-bg-secondary/30 rounded-lg border border-[var(--color-border-subtle-dark)] p-4">
          <h2 className="text-text-primary mb-2 text-sm font-semibold">Ekler ({signed.length})</h2>
          <ul className="space-y-1 text-xs">
            {signed.map((a) => (
              <li key={a.path} className="flex items-center justify-between gap-2">
                <span className="truncate">{a.name} · {(a.size / 1024).toFixed(0)} KB</span>
                {a.url ? <a href={a.url} className="text-[var(--color-accent-blue)] hover:underline" target="_blank" rel="noopener noreferrer">İndir</a> : <span>—</span>}
              </li>
            ))}
            {signed.length === 0 && <li className="text-text-secondary">Ek yok.</li>}
          </ul>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-text-primary mb-2 text-sm font-semibold">Form Verisi</h2>
        <pre className="overflow-x-auto rounded-lg border border-[var(--color-border-subtle-dark)] bg-bg-secondary/30 p-4 text-xs">
{JSON.stringify(rfq.payload, null, 2)}
        </pre>
      </section>

      <section className="mt-6">
        <form action={saveNotes} className="space-y-2">
          <input type="hidden" name="id" value={rfq.id} />
          <label className="block">
            <span className="text-text-primary text-sm font-semibold">Dahili Not</span>
            <textarea
              name="notes"
              rows={6}
              defaultValue={rfq.internal_notes ?? ""}
              className="mt-1 w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 font-mono text-xs text-text-primary"
            />
          </label>
          <button type="submit" className="rounded-sm bg-[var(--color-accent-red)] px-3 py-1.5 text-xs font-semibold text-white">Notu Kaydet</button>
        </form>
      </section>
    </Shell>
  );
}
```

- [ ] **Step 3: Typecheck + build**

```bash
pnpm typecheck
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add app/admin/inbox/[id]
git commit -m "feat(admin): RFQ detail page with status change, notes, signed attachment URLs"
```

---

### Task 33: `/admin/ayarlar/bildirimler` — notification recipients CRUD

**Files:**
- Create: `app/admin/ayarlar/bildirimler/page.tsx`
- Create: `app/admin/ayarlar/bildirimler/actions.ts`

- [ ] **Step 1: Server actions**

```typescript
// app/admin/ayarlar/bildirimler/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { recordAudit } from "@/lib/audit";

export async function addRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const typesRaw = formData.getAll("types").map(String);
  const types = typesRaw.filter((t): t is "custom" | "standart" => t === "custom" || t === "standart");
  if (!email || types.length === 0) return;

  const svc = createServiceClient();
  const { error } = await svc.from("notification_recipients").insert({ email, rfq_types: types, active: true });
  if (error) throw new Error(error.message);
  await recordAudit({ action: "recipient_added", entity_type: "notification_recipient", entity_id: null, user_id: user.id, ip: null, diff: { email, types } });
  revalidatePath("/admin/ayarlar/bildirimler");
}

export async function toggleRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "false") === "true";
  const svc = createServiceClient();
  const { error } = await svc.from("notification_recipients").update({ active: !active }).eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "recipient_toggled", entity_type: "notification_recipient", entity_id: id, user_id: user.id, ip: null, diff: { active: !active } });
  revalidatePath("/admin/ayarlar/bildirimler");
}

export async function removeRecipient(formData: FormData): Promise<void> {
  const user = await requireAdminRole();
  const id = String(formData.get("id") ?? "");
  const svc = createServiceClient();
  const { error } = await svc.from("notification_recipients").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAudit({ action: "recipient_removed", entity_type: "notification_recipient", entity_id: id, user_id: user.id, ip: null, diff: null });
  revalidatePath("/admin/ayarlar/bildirimler");
}
```

- [ ] **Step 2: Sayfa**

```typescript
// app/admin/ayarlar/bildirimler/page.tsx
import { requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { Shell } from "@/components/admin/Shell";
import { addRecipient, toggleRecipient, removeRecipient } from "./actions";

interface Recipient {
  id: string;
  email: string;
  rfq_types: ("custom" | "standart")[];
  active: boolean;
  created_at: string;
}

export default async function Page() {
  const user = await requireAdmin();
  const svc = createServiceClient();
  const { data } = await svc.from("notification_recipients").select("*").order("created_at", { ascending: false });
  const rows: Recipient[] = (data as Recipient[] | null) ?? [];

  const canManage = user.role === "admin";

  return (
    <Shell user={user} active="bildirimler">
      <h1 className="text-text-primary text-2xl font-semibold tracking-tight mb-4">Bildirim Alıcıları</h1>
      <p className="text-text-secondary mb-6 text-sm">Yeni RFQ geldiğinde hangi e-postalara bildirim gitsin.</p>

      {canManage && (
        <form action={addRecipient} className="mb-8 flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border-subtle-dark)] bg-bg-secondary/30 p-4">
          <label className="flex-1">
            <span className="text-text-primary mb-1 block text-xs font-medium">E-posta</span>
            <input name="email" type="email" required className="w-full rounded-sm border border-[var(--color-border-subtle-dark)] bg-bg-primary/60 px-3 py-2 text-sm text-text-primary" />
          </label>
          <fieldset className="flex gap-3 pt-5 text-xs">
            <label><input type="checkbox" name="types" value="custom" defaultChecked /> custom</label>
            <label><input type="checkbox" name="types" value="standart" defaultChecked /> standart</label>
          </fieldset>
          <button type="submit" className="rounded-sm bg-[var(--color-accent-red)] px-3 py-2 text-xs font-semibold text-white">Ekle</button>
        </form>
      )}

      <ul className="divide-y divide-[var(--color-border-subtle-dark)]/50 rounded-lg border border-[var(--color-border-subtle-dark)]">
        {rows.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 p-3 text-sm">
            <div>
              <span className={r.active ? "text-text-primary" : "text-text-secondary line-through"}>{r.email}</span>
              <span className="text-text-secondary ms-2 text-xs">{r.rfq_types.join(", ")}</span>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <form action={toggleRecipient}>
                  <input type="hidden" name="id" value={r.id} />
                  <input type="hidden" name="active" value={String(r.active)} />
                  <button type="submit" className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs">{r.active ? "Pasifleştir" : "Aktifleştir"}</button>
                </form>
                <form action={removeRecipient}>
                  <input type="hidden" name="id" value={r.id} />
                  <button type="submit" className="rounded-sm border border-[var(--color-border-subtle-dark)] px-2 py-1 text-xs text-[var(--color-accent-red)]">Kaldır</button>
                </form>
              </div>
            )}
          </li>
        ))}
        {rows.length === 0 && <li className="p-3 text-text-secondary text-sm">Henüz alıcı yok.</li>}
      </ul>
    </Shell>
  );
}
```

- [ ] **Step 3: RFQ API'yi güncelle — notification_recipients'tan gelen e-postalara ek gönder**

Mevcut `app/api/rfq/route.ts`'te ekibe e-posta şu an `env.RESEND_TEAM_EMAIL`'e gidiyor. Bunu recipient listesi ile değiştir:

```typescript
// app/api/rfq/route.ts içinde email block'u
// "team" e-postası tek adrese gidiyordu; şimdi recipients tablosundan çek
const { data: recipients } = await supabase
  .from("notification_recipients")
  .select("email, rfq_types, active")
  .eq("active", true);
const matchedEmails = (recipients ?? [])
  .filter((r) => (r.rfq_types as string[]).includes(kind))
  .map((r) => r.email);
// Fallback: boşsa env.RESEND_TEAM_EMAIL
const teamTo = matchedEmails.length > 0 ? matchedEmails : [env.RESEND_TEAM_EMAIL];

await Promise.all([
  resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: teamTo,
    replyTo: contact.email,
    subject: team.subject,
    html: team.html,
    text: team.text,
  }),
  // ... customer email (unchanged)
]);
```

`supabase` değişkeninin burada mevcut olduğundan emin ol — yukarıda `createServiceClient()` çağrısı var.

- [ ] **Step 4: Typecheck + build**

```bash
pnpm typecheck
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add app/admin/ayarlar/bildirimler app/api/rfq/route.ts
git commit -m "feat(admin): notification recipients CRUD and dynamic RFQ routing"
```

---

## Phase H — E2E Testler

Not: E2E testlerin lokal Supabase start (Docker) + `.env.local`'de test Turnstile anahtarları gerektirdiğini belirt. Resend gerçek API key ile dev modda e-posta atacak; bundan kaçınmak için ya test Resend account (`onboarding@resend.dev` gönderilebilir adresle) ya da API POST mock'u kullan — plan'da her RFQ/contact test'i lokal POST ile test edilip dev sunucuda Resend e-posta atmayı kabul edilebilir görüyoruz (MVP, düşük hacim).

### Task 34: E2E — Contact form submit (happy path)

**Files:**
- Create: `tests/e2e/contact.spec.ts`

- [ ] **Step 1: Test yaz**

```typescript
// tests/e2e/contact.spec.ts
import { test, expect } from "@playwright/test";

test("contact form submits and shows success state", async ({ page }) => {
  await page.goto("/tr/iletisim");
  await page.fill('input[name="name"]', "Test Kullanıcı");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="company"]', "Acme");
  await page.selectOption('select[name="subject"]', "general");
  await page.fill('textarea[name="message"]', "Bu bir test mesajıdır, uzunca.");

  // Turnstile: test site key her zaman otomatik pass verir; widget ekrana geldikten sonra success callback tetiklenir.
  // `TurnstileWidget`'in success callback'i state'e token yazar → button enable olur.
  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });

  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});

test("contact form blocks submit when turnstile missing (disabled submit)", async ({ page, browser }) => {
  // İstemciden Turnstile script yüklenmesini engelle (network route)
  const ctx = await browser.newContext();
  await ctx.route("**/challenges.cloudflare.com/**", (r) => r.abort());
  const p2 = await ctx.newPage();
  await p2.goto("/tr/iletisim");
  await expect(p2.locator('button[type="submit"]')).toBeDisabled();
});
```

- [ ] **Step 2: Test'i çalıştır**

```bash
pnpm exec supabase start
pnpm dev &   # veya test hook içinde webServer config kullan
pnpm test:e2e -- tests/e2e/contact.spec.ts
```

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/contact.spec.ts
git commit -m "test(e2e): contact form happy path + turnstile gate"
```

---

### Task 35: E2E — Custom RFQ submit

**Files:**
- Create: `tests/e2e/rfq-custom.spec.ts`

- [ ] **Step 1: Test yaz**

```typescript
// tests/e2e/rfq-custom.spec.ts
import { test, expect } from "@playwright/test";

test("custom RFQ submits successfully", async ({ page }) => {
  await page.goto("/tr/teklif-iste/ozel-uretim");

  await page.fill('input[name="name"]', "Test Mühendis");
  await page.fill('input[name="company"]', "TestCo");
  await page.fill('input[name="email"]', "eng@test.co");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="country"]', "TR");
  await page.selectOption('select[name="sector"]', "kapak");
  await page.fill(
    'textarea[name="description"]',
    "Plastik enjeksiyon ile üretilecek 33mm geniş bir kapak tasarımı için tedarikçi arıyoruz; yıllık 50k adet planlanıyor ve ISO sertifikalı üretici tercih edilecektir.",
  );
  await page.selectOption('select[name="annualVolume"]', "50k");
  await page.selectOption('select[name="tolerance"]', "medium");
  await page.check('input[name="consent"]');

  // Turnstile test key → auto-success
  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });
  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/rfq-custom.spec.ts
git commit -m "test(e2e): custom RFQ happy path"
```

---

### Task 36: E2E — Standart RFQ submit

**Files:**
- Create: `tests/e2e/rfq-standart.spec.ts`

- [ ] **Step 1: Test yaz**

```typescript
// tests/e2e/rfq-standart.spec.ts
import { test, expect } from "@playwright/test";

test("standart RFQ submits with one product row", async ({ page }) => {
  await page.goto("/tr/teklif-iste/standart");

  // İlk satır zaten var (default) — slug, variant, qty doldur
  await page.getByPlaceholder("Ürün adı / kodu").fill("kapak-33mm");
  await page.fill('input[name="name"]', "Test");
  await page.fill('input[name="company"]', "TestCo");
  await page.fill('input[name="email"]', "t@t.co");
  await page.fill('input[name="phone"]', "+905551112233");
  await page.fill('input[name="country"]', "TR");
  await page.check('input[name="consent"]');

  await expect(page.locator('button[type="submit"]')).toBeEnabled({ timeout: 15_000 });
  await page.click('button[type="submit"]');
  await expect(page.getByRole("status")).toBeVisible({ timeout: 15_000 });
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/rfq-standart.spec.ts
git commit -m "test(e2e): standart RFQ happy path"
```

---

### Task 37: E2E — Admin auth + inbox

**Files:**
- Create: `tests/e2e/admin.spec.ts`

Not: Magic link gerçek Gmail akışı içerdiği için otomatik E2E'de zor. Yaklaşım: Supabase service role ile **test user cookie'sini programatik olarak yerleştir**. Playwright `context.addCookies()` ile.

- [ ] **Step 1: Test yaz (unauth flow + form render)**

```typescript
// tests/e2e/admin.spec.ts
import { test, expect } from "@playwright/test";

test("unauthenticated /admin redirects to /admin/login", async ({ page }) => {
  const res = await page.goto("/admin");
  expect(page.url()).toContain("/admin/login");
});

test("/admin/login renders email form", async ({ page }) => {
  await page.goto("/admin/login");
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('button[type="submit"]')).toBeVisible();
});

// Otantike admin akışı: CI'de Supabase test kullanıcısı + service key ile session manuel kurulmalı.
// MVP için skip — gerçek magic link flow manuel test edilir.
test.skip("authenticated admin sees inbox", async ({ page }) => {
  // TODO: programmatic login hook (Plan 4'te)
});
```

- [ ] **Step 2: Commit**

```bash
git add tests/e2e/admin.spec.ts
git commit -m "test(e2e): admin login gate smoke tests"
```

---

## Phase I — Polish, Docs ve Release Hazırlığı

### Task 38: CI environment checks

**Files:**
- Modify: `.github/workflows/ci.yml`

Not: Mevcut CI bu env'lerin olmaması nedeniyle `lib/env.ts` build zamanında hata verebilir. CI'ya dummy server-only env'leri enjekte et.

- [ ] **Step 1: CI env'leri ekle**

```yaml
# .github/workflows/ci.yml — build/test job'a env bloğu ekle
env:
  NEXT_PUBLIC_SITE_URL: https://kitaplastik.com
  NEXT_PUBLIC_SUPABASE_URL: https://dummy.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY: dummy-anon
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: 1x00000000000000000000AA
  SUPABASE_SERVICE_ROLE_KEY: dummy-service
  TURNSTILE_SECRET_KEY: 1x0000000000000000000000000000000AA
  RESEND_API_KEY: re_dummy_00000000
  RESEND_FROM_EMAIL: noreply@kitaplastik.com
  RESEND_TEAM_EMAIL: info@kitaplastik.com
```

- [ ] **Step 2: CI'yı yerelde simüle et**

```bash
pnpm typecheck && pnpm lint && pnpm test -- --run && pnpm build
```

- [ ] **Step 3: Push ve GitHub Actions'ta yeşil gördüğünü doğrula**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: inject dummy Supabase/Turnstile/Resend env vars for build+test"
git push
```

---

### Task 39: Vercel environment variables kurulumu

**Files:** (yok — Vercel dashboard)

- [ ] **Step 1: Vercel dashboard → Project → Settings → Environment Variables**

Production + Preview için şu env'leri ekle (gerçek değerlerle):

```
NEXT_PUBLIC_SUPABASE_URL          = https://<ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = <anon>
SUPABASE_SERVICE_ROLE_KEY         = <service>   [Sensitive]
NEXT_PUBLIC_TURNSTILE_SITE_KEY    = <site-key>
TURNSTILE_SECRET_KEY              = <secret>    [Sensitive]
RESEND_API_KEY                    = re_...      [Sensitive]
RESEND_FROM_EMAIL                 = noreply@kitaplastik.com
RESEND_TEAM_EMAIL                 = info@kitaplastik.com
NEXT_PUBLIC_SITE_URL              = https://kitaplastik.com
```

- [ ] **Step 2: Cloudflare Turnstile dashboard'dan site key + secret key oluştur (prod domain: kitaplastik.com)**

- [ ] **Step 3: Resend dashboard'dan domain ekle ve DNS kayıtlarını yap; `noreply@kitaplastik.com` verified olana kadar `onboarding@resend.dev` kullan**

- [ ] **Step 4: Supabase Auth → Settings → Site URL: `https://kitaplastik.com` ve Redirect URLs listesine `https://kitaplastik.com/admin/auth/callback` + Vercel preview domain pattern'ı**

Commit yok — sadece dashboard config.

---

### Task 40: RESUME.md güncelle — Plan 3 bölümü tamamlandı

**Files:**
- Modify: `docs/superpowers/RESUME.md`

- [ ] **Step 1: Plan 3 bölümünü güncelle (✅ işareti, commit sayısı, önemli kararlar)**

```markdown
## Plan 3 ✅ — RFQ + Supabase + Admin Paneli

- **Supabase:** 4 migration (init tables, RLS, storage, seed) + local CLI + remote project (`<ref>`)
- **API endpoints:** `/api/contact` (Resend + Turnstile + rate limit + audit), `/api/rfq` (custom + standart, kind discriminator)
- **Forms:** CustomRfqForm (description 50-2000ch, malzeme multi, targetDate, NDA, FileUploader 5×10MB), StandartRfqForm (ProductPicker free-text MVP, Incoterm), ContactForm mailto→API migration
- **Admin:** magic link login + callback (`exchangeCodeForSession`), inbox list, RFQ detail (signed URL attachments, status update + notes with audit), notification recipients CRUD
- **Middleware:** next-intl + Supabase session refresh + admin guard birleşik
- **References migration:** `lib/references/data.ts` sync mock → async Supabase `clients` fetch; interface sabit
- **Tests:** unit (rate-limit, turnstile, audit, email templates, validation schemas × 2, references) + e2e (contact, rfq-custom, rfq-standart, admin login gate)
- **CI:** dummy env injection; GitHub Actions yeşil

**Önemli kararlar/caveats:**
- Rate limit in-memory LRU → Vercel multi-instance'da kısmi; Plan 4'te Upstash Redis
- Admin TR-only (NextIntlClientProvider manuel TR setup)
- File upload client-side Storage direct (anon insert policy); path validation yok (Turnstile + rate limit + audit ile katmanlı)
- `/admin/urunler`, `/admin/sektorler`, `/admin/ayarlar/sirket`, `/admin/ayarlar/sablonlar` Plan 4'e; `products` ve `sectors` tabloları Plan 3'te oluşturuldu ama CRUD yok (Supabase Studio ile manuel veri)
- Standart RFQ ProductPicker free-text; Plan 4'te catalog-backed picker

## Plan 4 — Sıradaki

- `/admin/urunler` + `/admin/sektorler` CRUD (4-dil tab, görsel upload)
- `/admin/ayarlar/sirket` + `/admin/ayarlar/sablonlar`
- Müşteri RFQ tracking `/rfq/[uuid]/`
- Upstash Redis rate limit upgrade
- Plausible + Sentry + OG image generator + Schema.org Organization/Product
- Lighthouse 85+ optimizasyonu
```

- [ ] **Step 2: Session log'a bağlantı ekle**

```markdown
## Post-Plan-3 Notları (2026-04-18+ oturumu)

- Supabase uzak proje: `<ref>` (eu-central-1, Frankfurt)
- Resend domain verify: `<tarih>`
- İlk admin user: `berkayturk6@gmail.com` (admin role)
- Cloudflare Turnstile site: kitaplastik.com
```

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/RESUME.md
git commit -m "docs(resume): mark Plan 3 complete with key decisions and Plan 4 roadmap"
```

---

### Task 41: Manuel smoke — tüm akışların son kontrolü

**Files:** (yok — manuel QA)

Bu task'ı implementer tek bir oturumda manuel yapmalı. Gerçek Resend API key ve Turnstile prod key gerekli (test key'ler Turnstile'da her zaman pass verir; Resend test modu e-posta atmaz).

- [ ] **Step 1: Lokal dev + lokal Supabase**

```bash
pnpm exec supabase start
pnpm dev
```

- [ ] **Step 2: Manuel smoke checklist**

```
[ ] /tr/iletisim — form submit → success state + gerçek e-posta geldi mi
[ ] /en/iletisim, /ru/iletisim, /ar/iletisim — hero + form RTL Arapça doğru
[ ] /tr/teklif-iste → hub 2 kart, CTA'lar çalışıyor
[ ] /tr/teklif-iste/ozel-uretim — form submit + dosya upload + e-posta
[ ] /tr/teklif-iste/standart — 2 item ekle + submit + e-posta
[ ] /tr/referanslar — 8 logo Supabase'den geliyor mu (client sayısı)
[ ] Anasayfa ReferencesStrip — logo'lar render oluyor
[ ] /admin → /admin/login redirect
[ ] /admin/login → magic link gönder → Gmail'e geldi mi
[ ] Magic link tıkla → /admin/inbox açılır
[ ] /admin/inbox — submit edilen RFQ'lar listeleniyor
[ ] /admin/inbox/<id> — status güncelle, not yaz, ek indir (signed URL)
[ ] /admin/ayarlar/bildirimler — recipient ekle, toggle, remove
[ ] Yeni RFQ submit → eklenen recipient e-postasına bildirim gitti mi
[ ] Rate limit: aynı IP'den 4. RFQ → 429
[ ] Honeypot: "website" alanı doldurulmuş POST → 422
```

- [ ] **Step 3: Bulunan her bug için ayrı task aç (ve fix commit)**

---

## Plan Özet Tablosu

| Task | Faz | Dosya Sayısı | Testler |
|---|---|---|---|
| 1-7 | A: Supabase | 6 SQL + 4 TS | typecheck |
| 8-9 | B: Env + deps | 1 + deps | env test |
| 10-13 | B: Primitives | 4 TS | 4 test dosyası |
| 14-16 | C: Validation + refs | 3 | 3 test dosyası |
| 17-18 | D: Middleware | 2 | smoke |
| 19-20 | E: Contact API | 3 | manuel |
| 21-25 | F: RFQ | 6 + messages | smoke |
| 26-33 | G: Admin | 9 | typecheck |
| 34-37 | H: E2E | 4 | Playwright |
| 38-41 | I: Release | 2 + docs | manuel |

**Toplam:** ~41 task, ~80 dosya, tahmini 10-15 iş günü (solo dev, batch mode).

---

## Self-Review Checklist (plan yazarı için)

- [x] Spec bölüm 8 (RFQ flows) kapsanıyor → Task 21-25
- [x] Spec bölüm 9 (Data model) kapsanıyor → Task 2-5
- [x] Spec bölüm 10 (Admin) MVP kapsanıyor → Task 26-33 (urunler/sektorler CRUD OUT)
- [x] Spec bölüm 16 (Security) — rate limit, audit, RLS, CSP hariç (mevcut next.config.ts'te yoksa Plan 4)
- [x] Placeholder yok — her task'ta tam kod
- [x] Type consistency — `UploadedFile` Task 22'de tanımlı, Task 23'te import ediliyor; `AdminUser` Task 27'de, Task 30-33'te import; `ItemRow` Task 24'te tanımlı ve export ediliyor
- [x] File paths tam
- [x] Contact form migration `/api/contact` ile RFQ altyapısını paylaşıyor (Resend, Turnstile, rate limit, audit) — spec gereği
- [x] References migration interface korunuyor (`Reference` shape sabit, async imza değişikliği)
- [x] Türkçe regex caveat plan kapsamında kritik değil (validation non-regex, email regex latin-only)

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-18-faz1-plan3-rfq-supabase-admin.md`.**

İki execution seçeneği:

**1. Subagent-Driven (recommended)** — `superpowers:subagent-driven-development` ile her task fresh subagent; pragmatik batch mode (RESUME.md stratejik kararları):
- Mekanik (Task 1, 4, 5, 6, 26, 38-41): tek implementer batch + self-review
- Medium (Task 2, 3, 7, 8-13, 17-18, 25, 28-30, 34-37): tek implementer + combined review
- Logic-heavy (Task 14-16, 19-24, 27, 31-33): tam 3-stage review (implementer + spec + quality)

**2. Inline** — `superpowers:executing-plans` tek oturumda batch execution with checkpoints.

**Tavsiye:** Subagent-driven (RESUME'daki pragmatik batch mode); her faz sonunda smoke test + user checkpoint. Her task için Context7 latest docs check (özellikle `@supabase/ssr`, `next-intl` v3, `resend`, `@marsidev/react-turnstile`).
