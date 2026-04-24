-- supabase/migrations/20260424170000_settings_company.sql
-- Plan 5c Part 2: DB-backed company settings (replaces lib/company.ts static).
-- Single-row table; public read (contact info already public-facing);
-- admin-only write via public.is_admin_role() (Plan 4b pattern).

CREATE TABLE public.settings_company (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX settings_company_singleton
  ON public.settings_company ((true));

ALTER TABLE public.settings_company ENABLE ROW LEVEL SECURITY;

CREATE POLICY settings_company_public_read
  ON public.settings_company FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY settings_company_admin_insert
  ON public.settings_company FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin_role());

CREATE POLICY settings_company_admin_update
  ON public.settings_company FOR UPDATE
  TO authenticated
  USING (public.is_admin_role())
  WITH CHECK (public.is_admin_role());

CREATE OR REPLACE FUNCTION public.update_company(new_data jsonb)
RETURNS public.settings_company
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row public.settings_company;
BEGIN
  IF NOT public.is_admin_role() THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  UPDATE public.settings_company
    SET data = new_data,
        updated_at = now(),
        updated_by = auth.uid()
    RETURNING * INTO updated_row;

  IF updated_row.id IS NULL THEN
    RAISE EXCEPTION 'settings_company not seeded';
  END IF;

  RETURN updated_row;
END;
$$;

REVOKE ALL ON FUNCTION public.update_company(jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_company(jsonb) TO authenticated;

-- Seed with current lib/company.ts values (2026-04-24 state).
INSERT INTO public.settings_company (data) VALUES ('{
  "legalName": "Kıta Plastik ve Tekstil San. Tic. Ltd. Şti.",
  "brandName": "Kıta Plastik",
  "shortName": "KITA",
  "founded": 1989,
  "address": {
    "street": "Eski Gemlik Yolu Kadem Sk. No: 37-40",
    "district": "Osmangazi",
    "city": "Bursa",
    "countryCode": "TR",
    "maps": "https://www.google.com/maps/search/?api=1&query=K%C4%B1ta+Plastik%2C+Eski+Gemlik+Yolu+Kadem+Sk.+No%3A+37-40%2C+Osmangazi%2C+Bursa"
  },
  "phone": { "display": "+90 224 216 16 94", "tel": "+902242161694" },
  "cellPhone": { "display": "+90 532 237 13 24", "tel": "+905322371324" },
  "fax": { "display": "+90 224 215 05 25" },
  "email": { "primary": "info@kitaplastik.com", "secondary": "kitaplastik@hotmail.com" },
  "whatsapp": { "display": "+90 224 216 16 94", "wa": "905322371324" },
  "telegram": { "handle": "kitaplastik", "display": "@kitaplastik" },
  "web": { "primary": "https://www.kitaplastik.com", "alt": "https://www.kitaplastik.com.tr" }
}'::jsonb);
