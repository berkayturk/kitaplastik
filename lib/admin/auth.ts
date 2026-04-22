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

  // Service client reads admin_users to determine role (RLS self-read policy would also work)
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
    role: adminRow.role,
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
  if (user.role !== "admin") redirect("/admin/catalog-requests");
  return user;
}
