-- =====================================================================
-- Plan 5b PR A: catalog_requests data minimization
-- =====================================================================
-- KVKK-aligned data minimization without consent banner.
--
-- Background: the original 2026-04-22 migration added ip_address + user_agent
-- columns "for spam forensics". In practice, in-memory rate limiting +
-- Turnstile + Cloudflare's dashboard already cover that use case, so
-- persisting these values only enlarges the personal-data surface for zero
-- operational gain.
--
-- This migration:
--   1. Wipes historical IP/UA values (belt-and-suspenders before DROP).
--   2. Drops both columns from the schema.
--   3. Installs a daily pg_cron job that purges rows older than 30 days.
--
-- Prerequisite: pg_cron must be enabled (Supabase Studio → Database →
-- Extensions → pg_cron) before applying. The DO-block below raises a
-- clear error if it is not.

-- ---------------------------------------------------------------------
-- 0. Guard: pg_cron must be enabled before we can register the job.
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_extension where extname = 'pg_cron') then
    raise exception
      'pg_cron extension is not enabled. Enable it via Supabase Studio (Database → Extensions → pg_cron) before applying this migration.';
  end if;
end
$$;

-- ---------------------------------------------------------------------
-- 1. Amnesia: explicit wipe of historical IP/UA values.
--    Creates a clean record-keeping trail before the structural change.
-- ---------------------------------------------------------------------
update public.catalog_requests
   set ip_address = null,
       user_agent = null
 where ip_address is not null
    or user_agent is not null;

-- ---------------------------------------------------------------------
-- 2. Drop the columns. Schema after this:
--    (id, email, locale, created_at)
-- ---------------------------------------------------------------------
alter table public.catalog_requests drop column if exists ip_address;
alter table public.catalog_requests drop column if exists user_agent;

-- ---------------------------------------------------------------------
-- 3. Schedule the 30-day auto-purge.
--    cron.schedule with a name is idempotent — re-running this migration
--    overwrites the existing job rather than duplicating it.
--    Schedule: every day at 03:00 UTC (06:00 TRT).
-- ---------------------------------------------------------------------
select cron.schedule(
  'catalog_requests_purge_30d',
  '0 3 * * *',
  $$delete from public.catalog_requests where created_at < now() - interval '30 days'$$
);

-- ---------------------------------------------------------------------
-- 4. Refresh the table comment to reflect the new contract.
-- ---------------------------------------------------------------------
comment on table public.catalog_requests is
  'Email log of catalog PDF requests. Minimum data set (email + locale + created_at). Auto-purged after 30 days by pg_cron job catalog_requests_purge_30d. No IP/UA — Plan 5b data minimization.';
