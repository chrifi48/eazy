/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/backend/server";
import { defaultEmailTemplates } from "@/lib/email";
import SettingsEditor from "./editor";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data } = await createClient().from("site_settings").select("*");
  const values: Record<string, any> = {};
  (data ?? []).forEach((r) => (values[r.key] = r.value));
  return <SettingsEditor values={values} emailDefaults={defaultEmailTemplates} />;
}
