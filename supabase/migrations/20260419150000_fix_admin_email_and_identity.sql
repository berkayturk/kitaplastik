-- Fix: sync identity.email with users.email + correct notification_recipients seed
--
-- Reason: auth.admin.updateUserById({ email }) updates users.email but leaves
-- identities.identity_data.email stale (supabase-js / GoTrue limitation). This
-- causes auth edge cases for email-provider identities where the two emails
-- diverge.
--
-- Also patches notification_recipients if a prior seed inserted the wrong
-- admin email (typo fix). Idempotent.

-- 1) Sync identities.email with users.email for all email-provider identities
update auth.identities i
set identity_data = jsonb_set(i.identity_data, '{email}', to_jsonb(u.email))
from auth.users u
where i.user_id = u.id
  and i.provider = 'email'
  and coalesce(i.identity_data->>'email', '') <> u.email;

-- 2) Fix stale admin email in notification_recipients (typo correction)
update public.notification_recipients
set email = 'berkaytrk6@gmail.com'
where email = 'berkayturk6@gmail.com';
