/* eslint-disable @typescript-eslint/no-explicit-any */
import "server-only";
import { getDb, type Meta } from "./pg";

// A small query builder with the chainable API the app uses (from().select().eq()...),
// including embedded relations like  "*, categories(name_fr), items(id, products!inner(slug))".

export type DbError = { message: string; code?: string; details?: string };
export type Result = { data: any; error: DbError | null; count: number | null };

const ID = /^[a-z_][a-z0-9_]*$/i;
const ident = (s: string) => {
  if (!ID.test(s)) throw new Error(`Bad identifier: ${s}`);
  return `"${s}"`;
};

type Parsed = { all: boolean; cols: string[]; embeds: { name: string; inner: boolean; sub: Parsed }[] };

function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0, cur = "";
  for (const ch of s) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out;
}

function parseSelect(sel: string): Parsed {
  const p: Parsed = { all: false, cols: [], embeds: [] };
  for (const raw of splitTop(sel)) {
    const tok = raw.trim();
    if (!tok) continue;
    if (tok === "*") { p.all = true; continue; }
    const m = /^([a-z_][a-z0-9_]*)(!inner)?\(([\s\S]*)\)$/i.exec(tok);
    if (m) p.embeds.push({ name: m[1], inner: !!m[2], sub: parseSelect(m[3]) });
    else { ident(tok); p.cols.push(tok); }
  }
  return p;
}

type Filter = { path: string[]; col: string; op: string; val: any };
type Ctx = { meta: Meta; params: any[]; i: number; add: (v: any) => string };
const newCtx = (meta: Meta): Ctx => {
  const c: Ctx = { meta, params: [], i: 1, add: (v) => { c.params.push(v); return `$${c.params.length}`; } };
  return c;
};

function relation(parent: string, name: string, meta: Meta) {
  const one = meta.fks.find((f) => f.child === parent && f.parent === name);
  if (one) return { kind: "one" as const, a: one.parentCol, b: one.childCol };
  const many = meta.fks.find((f) => f.parent === parent && f.child === name);
  if (many) return { kind: "many" as const, a: many.childCol, b: many.parentCol };
  throw new Error(`No relationship between ${parent} and ${name}`);
}

const OPS: Record<string, string> = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=" };

function cond(alias: string, f: Filter, ctx: Ctx): string {
  if (f.op === "or") {
    const terms = String(f.val).split(",").map((t) => {
      const i1 = t.indexOf("."), i2 = t.indexOf(".", i1 + 1);
      return cond(alias, { path: [], col: t.slice(0, i1), op: t.slice(i1 + 1, i2), val: t.slice(i2 + 1) }, ctx);
    });
    return `(${terms.join(" or ")})`;
  }
  const c = `${alias}.${ident(f.col)}`;
  if (OPS[f.op]) return f.val === null && f.op === "eq" ? `${c} is null` : `${c} ${OPS[f.op]} ${ctx.add(f.val)}`;
  if (f.op === "in") return f.val.length ? `${c} in (${f.val.map((v: any) => ctx.add(v)).join(",")})` : "false";
  if (f.op === "is") return f.val === null ? `${c} is null` : `${c} is ${f.val ? "true" : "false"}`;
  if (f.op === "ilike" || f.op === "like") return `${c} ${f.op} ${ctx.add(f.val)}`;
  throw new Error(`Unsupported operator ${f.op}`);
}

/** Builds the JSON row expression and WHERE conditions for one level of the select tree. */
function level(table: string, alias: string, P: Parsed, filters: Filter[], ctx: Ctx): { row: string; where: string[] } {
  const where: string[] = filters.filter((f) => !f.path.length).map((f) => cond(alias, f, ctx));
  const base = P.all || (!P.cols.length && !P.embeds.length)
    ? `to_jsonb(${alias})`
    : P.cols.length ? `jsonb_build_object(${P.cols.map((c) => `'${c}', ${alias}.${ident(c)}`).join(", ")})` : "'{}'::jsonb";

  const parts: string[] = [];
  for (const e of P.embeds) {
    const rel = relation(table, e.name, ctx.meta);
    const sub = filters.filter((f) => f.path[0] === e.name).map((f) => ({ ...f, path: f.path.slice(1) }));
    const b = `t${ctx.i++}`;
    const inner = level(e.name, b, e.sub, sub, ctx);
    const wh = [`${b}.${ident(rel.a)} = ${alias}.${ident(rel.b)}`, ...inner.where].join(" and ");
    parts.push(rel.kind === "one"
      ? `'${e.name}', (select ${inner.row} from ${ident(e.name)} ${b} where ${wh} limit 1)`
      : `'${e.name}', coalesce((select jsonb_agg(${inner.row}) from ${ident(e.name)} ${b} where ${wh}), '[]'::jsonb)`);
    if (e.inner) where.push(`exists (select 1 from ${ident(e.name)} ${b} where ${wh})`);
  }
  return { row: parts.length ? `${base} || jsonb_build_object(${parts.join(", ")})` : base, where };
}

const pgArray = (arr: any[]) => `{${arr.map((v) => (v == null ? "NULL" : `"${String(v).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`)).join(",")}}`;

function valueExpr(meta: Meta, table: string, col: string, val: any, ctx: Ctx) {
  const info = meta.cols[table]?.[col];
  if (!info) throw new Error(`Unknown column ${table}.${col}`);
  if (val === null) return "null";
  if (info.type === "jsonb" || info.type === "json") return `${ctx.add(JSON.stringify(val))}::jsonb`;
  if (info.type === "ARRAY") return `${ctx.add(pgArray(val))}::${info.udt.slice(1)}[]`;
  return ctx.add(val);
}

type Mode = "select" | "insert" | "update" | "upsert" | "delete";

export class Builder implements PromiseLike<Result> {
  private mode: Mode = "select";
  private selStr = "*";
  private returning?: string;
  private opts: { count?: boolean; head?: boolean } = {};
  private filters: Filter[] = [];
  private orders: { col: string; asc: boolean }[] = [];
  private lim?: number;
  private off?: number;
  private one?: "single" | "maybe";
  private payload: any;
  private conflict?: string;

  constructor(private table: string) {}

  select(cols = "*", opts?: { count?: "exact"; head?: boolean }) {
    if (this.mode === "select") { this.selStr = cols; this.opts = { count: !!opts?.count, head: !!opts?.head }; }
    else this.returning = cols;
    return this;
  }
  insert(rows: any) { this.mode = "insert"; this.payload = rows; return this; }
  update(values: any) { this.mode = "update"; this.payload = values; return this; }
  upsert(rows: any, o?: { onConflict?: string }) { this.mode = "upsert"; this.payload = rows; this.conflict = o?.onConflict; return this; }
  delete() { this.mode = "delete"; return this; }

  private f(col: string, op: string, val: any) { const p = col.split("."); this.filters.push({ path: p.slice(0, -1), col: p[p.length - 1], op, val }); return this; }
  eq(c: string, v: any) { return this.f(c, "eq", v); }
  neq(c: string, v: any) { return this.f(c, "neq", v); }
  gt(c: string, v: any) { return this.f(c, "gt", v); }
  gte(c: string, v: any) { return this.f(c, "gte", v); }
  lt(c: string, v: any) { return this.f(c, "lt", v); }
  lte(c: string, v: any) { return this.f(c, "lte", v); }
  in(c: string, v: any[]) { return this.f(c, "in", v); }
  is(c: string, v: null | boolean) { return this.f(c, "is", v); }
  ilike(c: string, v: string) { return this.f(c, "ilike", v); }
  like(c: string, v: string) { return this.f(c, "like", v); }
  or(expr: string) { this.filters.push({ path: [], col: "", op: "or", val: expr }); return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orders.push({ col, asc: o?.ascending !== false }); return this; }
  limit(n: number) { this.lim = n; return this; }
  range(from: number, to: number) { this.off = from; this.lim = to - from + 1; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, bad?: ((e: any) => B | PromiseLike<B>) | null) {
    return this.run().then(ok, bad);
  }

  private async run(): Promise<Result> {
    try {
      const { db, meta } = await getDb();
      if (!meta.cols[this.table]) throw new Error(`Unknown table ${this.table}`);
      if (this.mode === "select") return await this.runSelect(db, meta);
      return await this.runMutation(db, meta);
    } catch (e: any) {
      return { data: null, error: { message: e?.message ?? String(e), code: e?.code, details: e?.detail }, count: null };
    }
  }

  private async runSelect(db: any, meta: Meta): Promise<Result> {
    const ctx = newCtx(meta);
    const lv = level(this.table, "t0", parseSelect(this.selStr), this.filters, ctx);
    const whereSql = lv.where.length ? ` where ${lv.where.join(" and ")}` : "";

    let count: number | null = null;
    if (this.opts.count) {
      const cctx = newCtx(meta);
      const cl = level(this.table, "t0", parseSelect("*"), this.filters, cctx);
      const r = await db.query(`select count(*)::int as c from ${ident(this.table)} t0${cl.where.length ? ` where ${cl.where.join(" and ")}` : ""}`, cctx.params);
      count = r.rows[0].c;
    }
    if (this.opts.head) return { data: null, error: null, count };

    const order = this.orders.length ? ` order by ${this.orders.map((o) => `t0.${ident(o.col)} ${o.asc ? "asc" : "desc"}`).join(", ")}` : "";
    const lim = this.one ? (this.lim ?? 2) : this.lim; // 2 so "multiple rows" is detectable
    const sql = `select ${lv.row} as r from ${ident(this.table)} t0${whereSql}${order}${lim != null ? ` limit ${Math.max(0, Math.floor(lim))}` : ""}${this.off ? ` offset ${Math.floor(this.off)}` : ""}`;
    const rows: any[] = (await db.query(sql, ctx.params)).rows.map((x: any) => x.r);

    if (this.one) {
      if (rows.length === 1) return { data: rows[0], error: null, count };
      if (rows.length === 0 && this.one === "maybe") return { data: null, error: null, count };
      return { data: null, error: { code: "PGRST116", message: rows.length ? "Multiple rows returned" : "No rows found" }, count };
    }
    return { data: rows, error: null, count };
  }

  private async runMutation(db: any, meta: Meta): Promise<Result> {
    const t = this.table;
    const hasId = !!meta.cols[t].id;
    const ret = hasId ? " returning id" : "";
    const ctx = newCtx(meta);
    let sql: string;

    if (this.mode === "insert" || this.mode === "upsert") {
      const rows: any[] = Array.isArray(this.payload) ? this.payload : [this.payload];
      if (!rows.length) return { data: this.returning ? [] : null, error: null, count: null };
      const cols = [...new Set(rows.flatMap((r) => Object.keys(r).filter((k) => r[k] !== undefined)))];
      const values = rows.map((r) => `(${cols.map((c) => (r[c] === undefined ? "default" : valueExpr(meta, t, c, r[c], ctx))).join(", ")})`).join(", ");
      sql = `insert into ${ident(t)} (${cols.map(ident).join(", ")}) values ${values}`;
      if (this.mode === "upsert") {
        const keys = (this.conflict ?? "id").split(",").map((s) => s.trim());
        const upd = cols.filter((c) => !keys.includes(c));
        sql += ` on conflict (${keys.map(ident).join(", ")}) ` + (upd.length ? `do update set ${upd.map((c) => `${ident(c)} = excluded.${ident(c)}`).join(", ")}` : "do nothing");
      }
      sql += ret;
    } else {
      if (!this.filters.length) throw new Error(`${this.mode} on ${t} requires a filter`);
      const where = this.filters.map((f) => cond("t0", f, ctx));
      if (this.mode === "update") {
        const entries = Object.entries(this.payload as Record<string, any>).filter(([, v]) => v !== undefined);
        sql = `update ${ident(t)} t0 set ${entries.map(([c, v]) => `${ident(c)} = ${valueExpr(meta, t, c, v, ctx)}`).join(", ")} where ${where.join(" and ")}${hasId ? " returning t0.id" : ""}`;
      } else {
        sql = `delete from ${ident(t)} t0 where ${where.join(" and ")}${hasId ? " returning t0.id" : ""}`;
      }
    }

    const res = await db.query(sql, ctx.params);
    if (!this.returning || !hasId) return { data: null, error: null, count: null };

    // re-read the affected rows with the requested columns / embedded relations
    const ids = res.rows.map((r: any) => r.id);
    const q = new Builder(t).select(this.returning).in("id", ids);
    if (this.one === "single") q.single(); else if (this.one === "maybe") q.maybeSingle();
    return await q.then((r) => r);
  }
}

export const from = (table: string) => new Builder(table);
