import { from } from "@/lib/backend/query";

/** Append-only audit trail shown in Admin → Account. Best effort: never blocks the action. */
export async function logActivity(_sb: unknown, adminId: string, action: string, entity: string, entityId?: string, details?: unknown) {
  try {
    await from("activity_logs").insert({ admin_id: adminId, action, entity, entity_id: entityId ?? null, details: details ?? null });
  } catch { /* ignore */ }
}
