export const hexToRgb = (hex?: string) => {
  const m = /^#?([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return undefined;
  const n = parseInt(m[1], 16);
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
};

/** CSS variables overriding the default blue/orange with admin-chosen brand colors. */
export const brandVars = (b: { primary?: string; accent?: string }) => {
  const v: Record<string, string> = {};
  const p = hexToRgb(b.primary), a = hexToRgb(b.accent);
  if (p) v["--primary"] = p;
  if (a) v["--accent"] = a;
  return v as React.CSSProperties;
};
