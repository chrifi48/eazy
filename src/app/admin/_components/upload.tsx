"use client";

import { useState } from "react";
import { Upload, X } from "lucide-react";

/** Uploads an image through /api/upload (admin session required) and returns its public URL. */
export async function uploadMedia(file: File, folder: string): Promise<string> {
  const body = new FormData();
  body.set("file", file); body.set("bucket", "media"); body.set("folder", folder);
  const res = await fetch("/api/upload", { method: "POST", body });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(j.error ?? "Upload failed");
  return j.url as string;
}

export function ImageField({ value, onChange, folder }: { value: string; onChange: (v: string) => void; folder: string }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  return (
    <div>
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {value ? <img src={value} alt="" className="h-16 w-24 rounded-lg border border-border object-cover" /> : <div className="grid h-16 w-24 place-items-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">No image</div>}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
          <Upload className="h-4 w-4" />{busy ? "Uploading…" : "Upload"}
          <input type="file" accept="image/*" className="sr-only" disabled={busy} onChange={async (e) => {
            const f = e.target.files?.[0]; if (!f) return;
            setBusy(true); setErr("");
            try { onChange(await uploadMedia(f, folder)); } catch (x) { setErr((x as Error).message); }
            setBusy(false); e.target.value = "";
          }} />
        </label>
        {value && <button type="button" onClick={() => onChange("")} aria-label="Remove image" className="text-muted-foreground hover:text-red-600"><X className="h-4 w-4" /></button>}
      </div>
      {err && <p role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}

/** Multi-image field. `devices` adds a desktop/mobile selector per image (template screenshots). */
export function MultiImageField<T extends { image_url: string; device?: string }>({ items, onChange, folder, devices }: { items: T[]; onChange: (v: T[]) => void; folder: string; devices?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const move = (i: number, d: number) => { const a = [...items]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  return (
    <div>
      <ul className="mb-3 grid gap-3 sm:grid-cols-2">
        {items.map((it, i) => (
          <li key={it.image_url + i} className="flex items-center gap-3 rounded-lg border border-border p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={it.image_url} alt="" className="h-14 w-20 rounded object-cover" />
            <div className="flex flex-1 flex-col gap-1">
              {devices && (
                <select value={it.device ?? "desktop"} onChange={(e) => onChange(items.map((x, k) => (k === i ? { ...x, device: e.target.value } : x)))} className="rounded border border-border bg-background px-2 py-1 text-xs">
                  <option value="desktop">Desktop</option><option value="mobile">Mobile</option>
                </select>
              )}
              <div className="flex gap-1 text-xs">
                <button type="button" onClick={() => move(i, -1)} className="rounded border border-border px-2 hover:bg-muted" aria-label="Move up">↑</button>
                <button type="button" onClick={() => move(i, 1)} className="rounded border border-border px-2 hover:bg-muted" aria-label="Move down">↓</button>
                <button type="button" onClick={() => onChange(items.filter((_, k) => k !== i))} className="rounded border border-border px-2 text-red-600 hover:bg-muted">Remove</button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
        <Upload className="h-4 w-4" />{busy ? "Uploading…" : "Add images"}
        <input type="file" accept="image/*" multiple className="sr-only" disabled={busy} onChange={async (e) => {
          const files = Array.from(e.target.files ?? []); if (!files.length) return;
          setBusy(true); setErr("");
          try {
            const urls = await Promise.all(files.map((f) => uploadMedia(f, folder)));
            onChange([...items, ...urls.map((u) => ({ image_url: u, device: "desktop" }) as T)]);
          } catch (x) { setErr((x as Error).message); }
          setBusy(false); e.target.value = "";
        }} />
      </label>
      {err && <p role="alert" className="mt-1 text-xs text-red-600">{err}</p>}
    </div>
  );
}
