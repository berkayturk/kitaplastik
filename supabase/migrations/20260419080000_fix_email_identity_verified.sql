-- Fix: ensure all email-provider identities have identity_data.email_verified=true
--
-- Reason: auth.admin.createUser({ email_confirm: true }) via Supabase JS SDK
-- sets `users.email_confirmed_at` but leaves `identities.identity_data.email_verified`
-- at its default `false` (supabase-js bug / GoTrue API limitation).
--
-- When `disable_signup=true` is active (our prod-style config), newer GoTrue
-- versions (2.163+) reject OTP requests for emails whose identity
-- email_verified flag is false, returning `400 email_address_invalid`.
-- This migration patches the flag to true for all email-provider identities.
--
-- Idempotent: safe to re-run; only rows where flag is false are touched.
update auth.identities
set identity_data = jsonb_set(identity_data, '{email_verified}', 'true'::jsonb)
where provider = 'email'
  and coalesce(identity_data->>'email_verified', 'false') = 'false';
