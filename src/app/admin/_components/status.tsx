import { cn } from "@/lib/utils";

export const STATUSES = [
  ["new", "New"], ["contacted", "Contacted"], ["meeting_done", "Meeting done"], ["quote_sent", "Quote sent"],
  ["won", "Won"], ["in_progress", "In progress"], ["delivered", "Delivered"], ["lost", "Lost"], ["cancelled", "Cancelled"],
] as const;

const tone: Record<string, string> = {
  new: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  contacted: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300",
  meeting_done: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
  quote_sent: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  won: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  in_progress: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  lost: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  cancelled: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  done: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  rescheduled: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
};

export const statusLabel = (s: string) => STATUSES.find(([k]) => k === s)?.[1] ?? s.replace("_", " ");

export function StatusBadge({ status }: { status: string }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", tone[status] ?? "bg-muted")}>{statusLabel(status)}</span>;
}
