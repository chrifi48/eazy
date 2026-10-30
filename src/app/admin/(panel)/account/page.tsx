import { createClient } from "@/lib/backend/server";
import { Card } from "@/components/ui";
import AccountForms from "./forms";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const sb = createClient();
  const { data: { user } } = await sb.auth.getUser();
  const { data: logs } = await sb.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin account</h1>
      <AccountForms email={user?.email ?? ""} twoFactor={await sb.auth.twoFactorStatus()} />
      <Card className="overflow-x-auto p-5">
        <h2 className="mb-3 font-semibold">Activity log</h2>
        <table className="w-full min-w-[480px] text-sm">
          <thead><tr className="text-start text-xs text-muted-foreground"><th className="pb-2 text-start">When</th><th className="text-start">Action</th><th className="text-start">Entity</th><th className="text-start">Details</th></tr></thead>
          <tbody>
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-t border-border"><td className="py-2 pe-3 whitespace-nowrap">{new Date(l.created_at).toLocaleString("fr-FR")}</td><td className="pe-3 capitalize">{l.action}</td><td className="pe-3">{l.entity}</td><td className="max-w-xs truncate text-muted-foreground">{l.details ? JSON.stringify(l.details) : ""}</td></tr>
            ))}
            {!logs?.length && <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">Nothing logged yet.</td></tr>}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
