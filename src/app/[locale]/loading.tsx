// Shown instantly while the next page is being prepared, so navigation never feels frozen.
export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-4 py-12 sm:px-6" aria-busy="true" aria-live="polite">
      <div className="h-9 w-64 rounded-xl bg-muted" />
      <div className="mt-3 h-4 w-96 max-w-full rounded-lg bg-muted" />
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (<div key={i} className="h-72 rounded-2xl bg-muted" />))}
      </div>
    </div>
  );
}
