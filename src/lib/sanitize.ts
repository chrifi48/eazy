import sanitizeHtml from "sanitize-html";

/** Whitelist for admin-authored legal text. Applied when saving AND when rendering. */
export function cleanHtml(html: string) {
  return sanitizeHtml(html, {
    allowedTags: ["h2", "h3", "p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li", "a", "blockquote"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    transformTags: {
      div: "p",
      b: "strong",
      i: "em",
      a: (tag, attribs) => ({ tagName: "a", attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" } }),
    },
  });
}

/** Old plain-text values (paragraphs separated by blank lines) become HTML paragraphs. */
export function toHtml(value: string) {
  if (!value) return "";
  if (/^\s*</.test(value)) return cleanHtml(value);
  return value.split(/\n{2,}/).map((p) => `<p>${sanitizeHtml(p, { allowedTags: [], allowedAttributes: {} }).replace(/\n/g, "<br>")}</p>`).join("");
}
