"use client";

import { useEffect, useRef } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, RemoveFormatting } from "lucide-react";

/** Small WYSIWYG editor (contentEditable). Output is sanitized again on the server before saving. */
export default function RichText({ value, onChange, rtl }: { value: string; onChange: (html: string) => void; rtl?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  // set the initial content once; afterwards the DOM is the source of truth (keeps the caret stable)
  useEffect(() => { if (ref.current) ref.current.innerHTML = value || ""; /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  };
  const link = () => {
    const url = prompt("Link URL (https://…)");
    if (url) exec("createLink", url);
  };

  const btn = "grid h-8 w-8 place-items-center rounded-lg hover:bg-muted";
  return (
    <div className="rounded-xl border border-border bg-background focus-within:ring-2 focus-within:ring-accent">
      <div className="flex flex-wrap gap-1 border-b border-border p-1.5" role="toolbar" aria-label="Formatting">
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "h2")} aria-label="Heading"><Heading2 className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("formatBlock", "h3")} aria-label="Subheading"><Heading3 className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("bold")} aria-label="Bold"><Bold className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("italic")} aria-label="Italic"><Italic className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertUnorderedList")} aria-label="Bullet list"><List className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => exec("insertOrderedList")} aria-label="Numbered list"><ListOrdered className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={link} aria-label="Link"><Link2 className="h-4 w-4" /></button>
        <button type="button" className={btn} onMouseDown={(e) => e.preventDefault()} onClick={() => { exec("formatBlock", "p"); exec("removeFormat"); }} aria-label="Clear formatting"><RemoveFormatting className="h-4 w-4" /></button>
      </div>
      <div ref={ref} contentEditable suppressContentEditableWarning dir={rtl ? "rtl" : "ltr"} role="textbox" aria-multiline="true" onInput={() => onChange(ref.current?.innerHTML ?? "")}
        className="rich min-h-48 max-h-[28rem] overflow-y-auto p-4 text-sm leading-relaxed outline-none" />
    </div>
  );
}
