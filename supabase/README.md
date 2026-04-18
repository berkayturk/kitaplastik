# Supabase

## Lokal geliştirme

`pnpm exec supabase start` (Docker gereklidir), `pnpm exec supabase db reset` (migrations + seed), `pnpm exec supabase status` (URL/anon key → .env.local'e kopyala).

## Uzak projeye bağlan

`pnpm exec supabase login`, `pnpm exec supabase link --project-ref <ref>`, `pnpm exec supabase db push`, `pnpm exec supabase gen types typescript --linked > lib/supabase/types.ts`.

Projenin canonical dev değerleri `.env.local` içinde; asla commit etme.
