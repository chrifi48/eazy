// Generates placeholder mockup images (SVG) for the sample models and portfolio: node scripts/gen-samples.mjs
import fs from "node:fs";
import path from "node:path";

const out = path.join(process.cwd(), "public", "samples");
fs.mkdirSync(out, { recursive: true });

const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// slug -> [title, c1, c2, kind]   kind: landing | shop | dashboard | booking | menu | school
const models = {
  "vitrine-corporate": ["Corporate", "#1E3A8A", "#3B82F6", "landing"],
  "vitrine-portfolio": ["Creative Portfolio", "#7C3AED", "#EC4899", "landing"],
  "shop-fashion": ["Fashion Store", "#BE185D", "#F97316", "shop"],
  "shop-multi": ["Marketplace", "#0F766E", "#22C55E", "shop"],
  "stock-simple": ["Simple Stock", "#1D4ED8", "#06B6D4", "dashboard"],
  "stock-pro": ["Multi-warehouse Stock", "#334155", "#6366F1", "dashboard"],
  "booking-clinic": ["Clinic Booking", "#0E7490", "#10B981", "booking"],
  "booking-salon": ["Salon & Beauty", "#A21CAF", "#F472B6", "booking"],
  "resto-menu": ["Digital Menu", "#B45309", "#F59E0B", "menu"],
  "resto-full": ["Full Restaurant", "#9F1239", "#FB923C", "menu"],
  "school-basic": ["School Essentials", "#1E40AF", "#38BDF8", "school"],
  "school-pro": ["Full School Suite", "#4338CA", "#A78BFA", "school"],
};

const defs = (id, a, b) => `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`;
const font = 'font-family="Arial, Helvetica, sans-serif"';
const chrome = (title) => `<rect width="800" height="500" fill="#EEF2F7"/><rect x="40" y="30" width="720" height="440" rx="16" fill="#fff" stroke="#D5DCE6"/><rect x="40" y="30" width="720" height="36" rx="16" fill="#F1F5F9"/><rect x="40" y="50" width="720" height="16" fill="#F1F5F9"/>
<circle cx="64" cy="48" r="5" fill="#F87171"/><circle cx="82" cy="48" r="5" fill="#FBBF24"/><circle cx="100" cy="48" r="5" fill="#34D399"/><rect x="300" y="40" width="200" height="16" rx="8" fill="#E2E8F0"/>`;

function desktop(slug, variant) {
  const [title, a, b, kind] = models[slug];
  const g = defs("g", a, b);
  let body = "";
  if (variant === 1) {
    const cards = kind === "shop" ? [0, 1, 2, 3] : [0, 1, 2];
    body = `<rect x="40" y="66" width="720" height="40" fill="#fff"/><rect x="64" y="80" width="70" height="12" rx="6" fill="url(#g)"/>${[0, 1, 2, 3].map((i) => `<rect x="${520 + i * 56}" y="82" width="42" height="8" rx="4" fill="#CBD5E1"/>`).join("")}
<rect x="64" y="120" width="672" height="150" rx="14" fill="url(#g)"/><text x="92" y="180" ${font} font-size="30" font-weight="800" fill="#fff">${esc(title)}</text><text x="92" y="206" ${font} font-size="14" fill="#fff" opacity=".85">Modern. Fast. Made to convert.</text><rect x="92" y="226" width="110" height="26" rx="13" fill="#fff"/>
${cards.map((i, k) => `<rect x="${64 + k * (672 / cards.length)}" y="290" width="${672 / cards.length - 14}" height="150" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/><rect x="${76 + k * (672 / cards.length)}" y="302" width="${672 / cards.length - 38}" height="70" rx="8" fill="${k % 2 ? b : a}" opacity=".25"/><rect x="${76 + k * (672 / cards.length)}" y="386" width="80" height="10" rx="5" fill="#94A3B8"/><rect x="${76 + k * (672 / cards.length)}" y="406" width="50" height="10" rx="5" fill="${a}"/>`).join("")}`;
  } else if (["dashboard", "school"].includes(kind)) {
    body = `<rect x="40" y="66" width="140" height="404" fill="#0F172A"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="56" y="${90 + i * 36}" width="108" height="22" rx="6" fill="${i === 0 ? a : "#1E293B"}"/>`).join("")}
${[0, 1, 2].map((i) => `<rect x="${200 + i * 184}" y="86" width="170" height="70" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/><rect x="${214 + i * 184}" y="100" width="60" height="9" rx="4" fill="#94A3B8"/><text x="${214 + i * 184}" y="140" ${font} font-size="24" font-weight="800" fill="${i === 1 ? b : a}">${[1284, 86, 24][i]}</text>`).join("")}
<rect x="200" y="176" width="360" height="280" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>${[60, 110, 80, 150, 120, 190, 160].map((h, i) => `<rect x="${222 + i * 46}" y="${440 - h}" width="28" height="${h}" rx="6" fill="url(#g)" opacity="${0.55 + i * 0.06}"/>`).join("")}
<rect x="576" y="176" width="168" height="280" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="590" y="${192 + i * 40}" width="140" height="28" rx="6" fill="${i % 2 ? "#E2E8F0" : "#EEF2F7"}"/>`).join("")}
<text x="200" y="76" ${font} font-size="11" font-weight="700" fill="#64748B">${esc(title)}</text>`;
  } else if (kind === "booking") {
    body = `<rect x="64" y="86" width="330" height="360" rx="14" fill="#F8FAFC" stroke="#E2E8F0"/><text x="84" y="116" ${font} font-size="16" font-weight="800" fill="${a}">${esc(title)}</text>${Array.from({ length: 35 }, (_, i) => `<rect x="${84 + (i % 7) * 42}" y="${136 + Math.floor(i / 7) * 46}" width="34" height="34" rx="8" fill="${i === 16 ? "url(#g)" : i % 5 === 0 ? "#E2E8F0" : "#fff"}" stroke="#E2E8F0"/>`).join("")}
<rect x="420" y="86" width="316" height="360" rx="14" fill="#fff" stroke="#E2E8F0"/>${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="440" y="${106 + i * 52}" width="276" height="40" rx="10" fill="${i === 2 ? "url(#g)" : "#F1F5F9"}"/><rect x="456" y="${122 + i * 52}" width="${i === 2 ? 80 : 60}" height="9" rx="4" fill="${i === 2 ? "#fff" : "#94A3B8"}"/>`).join("")}`;
  } else {
    body = `<rect x="40" y="66" width="720" height="130" fill="url(#g)"/><text x="72" y="130" ${font} font-size="30" font-weight="800" fill="#fff">${esc(title)}</text><text x="72" y="158" ${font} font-size="14" fill="#fff" opacity=".85">Order · Reserve · Enjoy</text>
${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${64 + (i % 3) * 228}" y="${214 + Math.floor(i / 3) * 124}" width="216" height="112" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/><circle cx="${116 + (i % 3) * 228}" cy="${262 + Math.floor(i / 3) * 124}" r="30" fill="${i % 2 ? b : a}" opacity=".3"/><rect x="${160 + (i % 3) * 228}" y="${244 + Math.floor(i / 3) * 124}" width="90" height="10" rx="5" fill="#64748B"/><rect x="${160 + (i % 3) * 228}" y="${264 + Math.floor(i / 3) * 124}" width="50" height="10" rx="5" fill="${a}"/>`).join("")}`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-label="${esc(title)}">${g}${chrome(title)}${body}</svg>`;
}

function mobile(slug) {
  const [title, a, b] = models[slug];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" width="360" height="640" role="img" aria-label="${esc(title)} mobile">${defs("g", a, b)}
<rect width="360" height="640" fill="#EEF2F7"/><rect x="50" y="20" width="260" height="600" rx="34" fill="#0F172A"/><rect x="58" y="32" width="244" height="576" rx="26" fill="#fff"/><rect x="140" y="38" width="80" height="14" rx="7" fill="#0F172A"/>
<rect x="58" y="60" width="244" height="110" fill="url(#g)"/><text x="76" y="112" ${font} font-size="20" font-weight="800" fill="#fff">${esc(title)}</text><text x="76" y="134" ${font} font-size="11" fill="#fff" opacity=".85">Welcome back</text>
${[0, 1, 2, 3, 4].map((i) => `<rect x="72" y="${186 + i * 70}" width="216" height="58" rx="12" fill="#F8FAFC" stroke="#E2E8F0"/><circle cx="102" cy="${215 + i * 70}" r="16" fill="${i % 2 ? b : a}" opacity=".35"/><rect x="128" y="${204 + i * 70}" width="100" height="9" rx="4" fill="#64748B"/><rect x="128" y="${222 + i * 70}" width="60" height="8" rx="4" fill="#CBD5E1"/>`).join("")}
<rect x="58" y="556" width="244" height="52" fill="#fff"/>${[0, 1, 2, 3].map((i) => `<circle cx="${90 + i * 60}" cy="582" r="9" fill="${i === 0 ? a : "#CBD5E1"}"/>`).join("")}</svg>`;
}

function portfolio(n, title, a, b) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500" width="800" height="500" role="img" aria-label="${esc(title)}">${defs("g", a, b)}<rect width="800" height="500" fill="url(#g)"/>
<circle cx="640" cy="120" r="150" fill="#fff" opacity=".08"/><circle cx="120" cy="430" r="190" fill="#fff" opacity=".07"/>
<rect x="150" y="90" width="500" height="320" rx="18" fill="#fff" opacity=".95"/><rect x="150" y="90" width="500" height="34" rx="18" fill="#F1F5F9"/><rect x="150" y="108" width="500" height="16" fill="#F1F5F9"/>
<rect x="176" y="150" width="200" height="120" rx="10" fill="${a}" opacity=".25"/><rect x="396" y="150" width="228" height="14" rx="7" fill="#94A3B8"/><rect x="396" y="176" width="180" height="10" rx="5" fill="#CBD5E1"/><rect x="396" y="196" width="200" height="10" rx="5" fill="#CBD5E1"/><rect x="396" y="232" width="90" height="28" rx="14" fill="${b}"/>
${[0, 1, 2].map((i) => `<rect x="${176 + i * 150}" y="296" width="136" height="90" rx="10" fill="#F8FAFC" stroke="#E2E8F0"/>`).join("")}
<text x="400" y="460" text-anchor="middle" ${font} font-size="22" font-weight="800" fill="#fff">${esc(title)}</text></svg>`;
}

for (const slug of Object.keys(models)) {
  fs.writeFileSync(path.join(out, `${slug}.svg`), desktop(slug, 1));
  fs.writeFileSync(path.join(out, `${slug}-1.svg`), desktop(slug, 1));
  fs.writeFileSync(path.join(out, `${slug}-2.svg`), desktop(slug, 2));
  fs.writeFileSync(path.join(out, `${slug}-m.svg`), mobile(slug));
}
[["Boutique en ligne", "#BE185D", "#F97316"], ["Gestion de stock", "#1D4ED8", "#06B6D4"], ["Réservation de rendez-vous", "#0E7490", "#10B981"]]
  .forEach(([t, a, b], i) => fs.writeFileSync(path.join(out, `portfolio-${i + 1}.svg`), portfolio(i + 1, t, a, b)));
console.log("generated", fs.readdirSync(out).length, "files in public/samples");
