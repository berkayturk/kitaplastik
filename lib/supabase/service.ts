// lib/supabase/service.ts
// ATTENTION: SERVER-ONLY. Bypasses RLS. Use only inside /api routes or server
// actions that have already authenticated the caller as admin, or for controlled
// operations like sending notifications where RLS would block legitimate flows.
import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./types";

export function createServiceClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY missing (server-only env)");
  }
  return createSupabaseClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
