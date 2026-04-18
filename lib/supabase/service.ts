// lib/supabase/service.ts
// ATTENTION: SERVER-ONLY. Bypasses RLS. Use only inside /api routes or server
// actions that have already authenticated the caller as admin, or for controlled
// operations like sending notifications where RLS would block legitimate flows.
// Migrated to env.SUPABASE_SERVICE_ROLE_KEY (Task 8).
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env, serverEnv } from "@/lib/env";
import type { Database } from "./types";

export function createServiceClient() {
  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}
