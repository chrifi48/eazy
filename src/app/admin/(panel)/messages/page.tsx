import { createClient } from "@/lib/backend/server";
import { Card } from "@/components/ui";

export const dynamic = "force-dynamic";

export default async function MessagesPage() {
  const { data } = await createClient().from("contact_messages").select("*").order("created_at", { ascending: false }).limit(100);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Contact messages</h1>
      <div className="space-y-3">
        {(data ?? []).map((m) => (
          <Card key={m.id} className="p-4 text-sm">
            <div className="flex flex-wrap justify-between gap-2"><p className="font-semibold">{m.name} <a className="font-normal text-accent" href={`mailto:${m.email}`}>{m.email}</a> {m.phone && <span className="font-normal text-muted-foreground">{m.phone}</span>}</p><span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString("fr-FR")}</span></div>
            <p className="mt-2 whitespace-pre-line">{m.message}</p>
          </Card>
        ))}
        {!data?.length && <p className="py-10 text-center text-muted-foreground">No messages yet.</p>}
      </div>
    </div>
  );
}
