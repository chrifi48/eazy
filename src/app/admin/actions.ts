"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/backend/server";

type State = { error?: string; step?: "2fa" } | undefined;

export async function signIn(_: State, formData: FormData): Promise<State> {
  const sb = createClient();
  const { data, error, requires2fa } = await sb.auth.signInWithPassword({
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
  });
  if (error) return { error: error.message };
  if (requires2fa) return { step: "2fa" };
  if (!data.user || data.user.role !== "admin") {
    await sb.auth.signOut();
    return { error: "This account is not an admin" };
  }
  redirect("/admin");
}

export async function verifyTwoFactor(_: State, formData: FormData): Promise<State> {
  const sb = createClient();
  const { data, error } = await sb.auth.completeTwoFactor(String(formData.get("code") ?? ""));
  if (error) return { step: "2fa", error: error.message };
  if (data.user?.role !== "admin") return { error: "This account is not an admin" };
  redirect("/admin");
}

export async function signOut() {
  await createClient().auth.signOut();
  redirect("/admin/login");
}
