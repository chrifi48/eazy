/* eslint-disable @typescript-eslint/no-explicit-any */
export type ReqSearch = { q?: string; status?: string; category?: string; type?: string; from?: string; to?: string; sort?: string; dir?: string; page?: string };

export const REQUEST_SELECT = "*, categories(name_fr), templates(name_fr), project_types(name_fr), appointments(date,start_time,end_time,status,meeting_type)";
export const SORTABLE = ["created_at", "estimated_max", "client_name", "status", "reference"];

export function applyRequestFilters(q: any, sp: ReqSearch) {
  if (sp.status) q = q.eq("status", sp.status);
  if (sp.category) q = q.eq("category_id", sp.category);
  if (sp.type) q = q.eq("project_type_id", sp.type);
  if (sp.from) q = q.gte("created_at", sp.from);
  if (sp.to) q = q.lte("created_at", sp.to + "T23:59:59");
  if (sp.q) {
    const s = sp.q.replace(/[%,()]/g, " ").trim();
    if (s) q = q.or(`client_name.ilike.%${s}%,business_name.ilike.%${s}%,reference.ilike.%${s}%,email.ilike.%${s}%`);
  }
  const sort = SORTABLE.includes(sp.sort ?? "") ? sp.sort! : "created_at";
  return q.order(sort, { ascending: sp.dir === "asc" });
}
