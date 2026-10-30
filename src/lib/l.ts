/** Localized field: row.name_ar -> falls back to fr, then en. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function L(row: any, base: string, locale: string): string {
  if (!row) return "";
  return row[`${base}_${locale}`] || row[`${base}_fr`] || row[`${base}_en`] || "";
}
