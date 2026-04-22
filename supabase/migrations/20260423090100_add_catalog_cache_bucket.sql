-- =====================================================================
-- Create catalog-cache storage bucket — on-demand PDF cache
-- =====================================================================
-- Context: /api/catalog/[sector]/[lang] renders product data through
-- Puppeteer into an A4 PDF. Cold generation takes ~10 s; subsequent
-- requests stream the cached artefact. Cache key format:
--   {sector}-{lang}-{dataHash}.pdf    (dataHash = sha256 of max(updated_at))
-- Private bucket with NO storage.objects policies — authenticated users
-- are denied by default; the API route uses the service-role client,
-- which bypasses RLS entirely. Public ingress flows through the Next.js
-- route only, never directly to Storage.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-cache', 'catalog-cache', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;
