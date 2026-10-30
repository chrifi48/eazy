"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type Testi = { id: string; name: string; business?: string; photo?: string; text: string; rating: number };

export function TestimonialSlider({ items }: { items: Testi[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (items.length < 2) return;
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 6000);
    return () => clearInterval(id);
  }, [items.length]);
  if (!items.length) return null;
  const t = items[i];
  return (
    <div className="mx-auto max-w-3xl text-center" aria-live="polite">
      <div className="mb-4 flex justify-center gap-1" aria-label={`${t.rating}/5`}>
        {Array.from({ length: 5 }).map((_, k) => (<Star key={k} className={cn("h-5 w-5", k < t.rating ? "fill-accent text-accent" : "text-border")} />))}
      </div>
      <blockquote className="text-xl font-medium leading-relaxed sm:text-2xl">“{t.text}”</blockquote>
      <div className="mt-6 flex items-center justify-center gap-3">
        {t.photo && <Image src={t.photo} alt={t.name} width={44} height={44} className="h-11 w-11 rounded-full object-cover" />}
        <div className="text-start"><p className="font-semibold">{t.name}</p>{t.business && <p className="text-sm text-muted-foreground">{t.business}</p>}</div>
      </div>
      {items.length > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {items.map((_, k) => (<button key={k} onClick={() => setI(k)} aria-label={`${k + 1}`} className={cn("h-2 rounded-full transition-all", k === i ? "w-6 bg-accent" : "w-2 bg-border")} />))}
        </div>
      )}
    </div>
  );
}

export function ImageGallery({ images, alt }: { images: { url: string; device: string }[]; alt: string }) {
  const [i, setI] = useState(0);
  if (!images.length) return <div className="grid aspect-[16/10] place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-5xl font-black text-primary/30">{alt.slice(0, 1)}</div>;
  const cur = images[i];
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted">
        <div className={cn("relative mx-auto", cur.device === "mobile" ? "aspect-[9/16] max-h-[560px]" : "aspect-[16/10] w-full")}>
          <Image src={cur.url} alt={`${alt} ${i + 1}`} unoptimized={cur.url.endsWith(".svg")} fill sizes="(max-width:1024px) 100vw, 60vw" className="object-contain" priority={i === 0} />
        </div>
        {images.length > 1 && (<>
          <button onClick={() => setI((i - 1 + images.length) % images.length)} aria-label="Previous" className="absolute start-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow rtl:rotate-180"><ChevronLeft className="h-4 w-4" /></button>
          <button onClick={() => setI((i + 1) % images.length)} aria-label="Next" className="absolute end-3 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-background/90 shadow rtl:rotate-180"><ChevronRight className="h-4 w-4" /></button>
        </>)}
      </div>
      {images.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`${k + 1}`} className={cn("relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2", k === i ? "border-accent" : "border-transparent")}>
              <Image src={im.url} alt="" unoptimized={im.url.endsWith(".svg")} fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
