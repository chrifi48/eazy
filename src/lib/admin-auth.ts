import "server-only";
import { createClient } from "@/lib/backend/server";

/** For server actions: returns an RLS-bound client plus the admin user, or throws. */
export async function requireAdmin() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  const { data: p } = await sb.from("profiles").select("role").eq("id", user.id).single();
  if (p?.role !== "admin") throw new Error("Not an admin");
  return { sb, user };
}
