export type PriceInput = {
  template?: { price_min: number; price_max: number; delivery_days: number } | null;
  features: { price_min: number; price_max: number; extra_days: number }[];
};

/** Estimate = template base + selected features (business rule §7). */
export function estimate({ template, features }: PriceInput) {
  const min = Number(template?.price_min ?? 0) + features.reduce((s, f) => s + Number(f.price_min), 0);
  const max = Number(template?.price_max ?? 0) + features.reduce((s, f) => s + Number(f.price_max), 0);
  const days = Number(template?.delivery_days ?? 0) + features.reduce((s, f) => s + Number(f.extra_days), 0);
  return { min, max, days };
}
