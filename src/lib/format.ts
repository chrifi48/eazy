const nf = (locale: string) => new Intl.NumberFormat(locale === "ar" ? "ar-MA-u-nu-latn" : locale === "fr" ? "fr-FR" : "en-US", { maximumFractionDigits: 0 });

export const formatMoney = (n: number, locale = "fr", currency: "MAD" | "EUR" = "MAD", eurRate = 0.092) => {
  const v = currency === "EUR" ? n * eurRate : n;
  const sym = currency === "EUR" ? "€" : locale === "ar" ? "د.م." : "MAD";
  return currency === "EUR" ? `${nf(locale).format(v)} ${sym}` : `${nf(locale).format(v)} ${sym}`;
};

export const formatRange = (min: number, max: number, locale = "fr", currency: "MAD" | "EUR" = "MAD", eurRate = 0.092) =>
  min === max ? formatMoney(min, locale, currency, eurRate) : `${formatMoney(min, locale, currency, eurRate)} – ${formatMoney(max, locale, currency, eurRate)}`;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export const hhmm = (t: string) => t.slice(0, 5);
