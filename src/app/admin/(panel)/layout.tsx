import { createClient } from "@/lib/backend/server";
import { signOut } from "../actions";
import ThemeToggle from "../_components/theme-toggle";
import Sidebar from "../_components/sidebar";

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { data: { user } } = await createClient().auth.getUser();
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:flex-row">
      <aside className="border-b border-border bg-card p-4 print:hidden md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:overflow-y-auto md:border-b-0 md:border-r">
        <p className="mb-5 px-2 text-xl font-extrabold tracking-tight">eazy<span className="text-accent">.</span> <span className="text-sm font-medium text-muted-foreground">admin</span></p>
        <Sidebar />
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-end gap-3 border-b border-border bg-background/80 px-6 py-3 text-sm backdrop-blur print:hidden">
          <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
          <ThemeToggle />
          <form action={signOut}><button className="rounded-lg border border-border px-3 py-1.5 transition hover:bg-muted">Log out</button></form>
        </header>
        <main className="p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
