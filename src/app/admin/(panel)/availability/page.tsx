import { createClient } from "@/lib/backend/server";
import AvailabilityEditor from "./editor";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const sb = createClient();
  const [{ data: avail }, { data: blocked }] = await Promise.all([
    sb.from("availability").select("*"),
    sb.from("blocked_dates").select("*").gte("date", new Date().toISOString().slice(0, 10)).order("date"),
  ]);
  return <AvailabilityEditor avail={avail ?? []} blocked={blocked ?? []} />;
}
