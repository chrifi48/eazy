// Declarative description of every admin-managed resource. Plain data only (it is passed to client components).

export type Opt = { value: string; label: string };
export type FieldDef =
  | { kind: "text" | "textarea" | "number" | "url"; name: string; label: string; required?: boolean; hint?: string; nullable?: boolean }
  | { kind: "bool"; name: string; label: string }
  | { kind: "select"; name: string; label: string; options?: Opt[]; optionsFrom?: string; nullable?: boolean; required?: boolean }
  | { kind: "i18n"; name: string; label: string; textarea?: boolean; required?: boolean }
  | { kind: "lines"; name: string; label: string }          // items_fr / items_ar / items_en  (jsonb string arrays)
  | { kind: "list"; name: string; label: string; hint?: string } // text[] column, one entry per line
  | { kind: "image"; name: string; label: string }
  | { kind: "images"; name: string; label: string }         // text[] of image urls
  | { kind: "multi"; name: string; label: string; table: string; key: string; other: string; optionsFrom: string; hint?: string }
  | { kind: "gallery"; name: string; label: string };       // template_images rows

export type Column = { name: string; label: string; type?: "text" | "bool" | "price" | "image" | "rel"; optionsFrom?: string };

export type Resource = {
  key: string; slug: string; title: string; table: string; fields: FieldDef[]; columns: Column[];
  ordered?: boolean; hasSlug?: boolean; slugFrom?: string; newestFirst?: boolean;
};

const active: FieldDef = { kind: "bool", name: "is_active", label: "Active" };

export const resources: Resource[] = [
  {
    key: "project_types", slug: "project-types", title: "Project types", table: "project_types", ordered: true, hasSlug: true, slugFrom: "name_en",
    fields: [
      { kind: "i18n", name: "name", label: "Name", required: true },
      { kind: "text", name: "slug", label: "Slug (url)", hint: "Auto-generated if empty. Used by the configurator: website / mobile / desktop." },
      { kind: "text", name: "icon", label: "Icon (lucide name, e.g. Globe)" },
      { kind: "i18n", name: "description", label: "Description", textarea: true },
      active,
    ],
    columns: [{ name: "name_fr", label: "Name" }, { name: "slug", label: "Slug" }, { name: "icon", label: "Icon" }, { name: "is_active", label: "Active", type: "bool" }],
  },
  {
    key: "categories", slug: "categories", title: "Categories", table: "categories", ordered: true, hasSlug: true, slugFrom: "name_en",
    fields: [
      { kind: "i18n", name: "name", label: "Name", required: true },
      { kind: "text", name: "slug", label: "Slug (url)" },
      { kind: "text", name: "icon", label: "Icon (lucide name, e.g. ShoppingCart)" },
      { kind: "image", name: "image_url", label: "Image" },
      { kind: "i18n", name: "description", label: "Description", textarea: true },
      { kind: "multi", name: "project_type_ids", label: "Project types", table: "category_project_types", key: "category_id", other: "project_type_id", optionsFrom: "project_types" },
      active,
    ],
    columns: [{ name: "name_fr", label: "Name" }, { name: "slug", label: "Slug" }, { name: "is_active", label: "Active", type: "bool" }],
  },
  {
    key: "templates", slug: "templates", title: "Templates / Models", table: "templates", ordered: true, hasSlug: true, slugFrom: "name_en",
    fields: [
      { kind: "i18n", name: "name", label: "Name", required: true },
      { kind: "text", name: "slug", label: "Slug (url)" },
      { kind: "select", name: "category_id", label: "Category", optionsFrom: "categories", required: true },
      { kind: "multi", name: "project_type_ids", label: "Project types", table: "template_project_types", key: "template_id", other: "project_type_id", optionsFrom: "project_types" },
      { kind: "i18n", name: "short_desc", label: "Short description" },
      { kind: "i18n", name: "long_desc", label: "Long description", textarea: true },
      { kind: "image", name: "thumbnail_url", label: "Thumbnail" },
      { kind: "gallery", name: "gallery", label: "Screenshots (desktop / mobile, ordered)" },
      { kind: "url", name: "demo_url", label: "Live demo URL" },
      { kind: "number", name: "price_min", label: "Base price min (MAD)" },
      { kind: "number", name: "price_max", label: "Base price max (MAD)" },
      { kind: "number", name: "delivery_days", label: "Estimated delivery (days)" },
      { kind: "list", name: "included_features", label: "Included features", hint: "One per line" },
      { kind: "list", name: "technologies", label: "Technologies", hint: "One per line" },
      { kind: "bool", name: "is_featured", label: "Featured on home page" },
      active,
    ],
    columns: [{ name: "thumbnail_url", label: "", type: "image" }, { name: "name_fr", label: "Name" }, { name: "category_id", label: "Category", type: "rel", optionsFrom: "categories" }, { name: "price_min", label: "From", type: "price" }, { name: "is_featured", label: "Featured", type: "bool" }, { name: "is_active", label: "Active", type: "bool" }],
  },
  {
    key: "feature_groups", slug: "feature-groups", title: "Feature groups", table: "feature_groups", ordered: true,
    fields: [{ kind: "i18n", name: "name", label: "Name", required: true }],
    columns: [{ name: "name_fr", label: "Name" }, { name: "name_en", label: "English" }],
  },
  {
    key: "features", slug: "features", title: "Features (configurator)", table: "features", ordered: true,
    fields: [
      { kind: "select", name: "group_id", label: "Group", optionsFrom: "feature_groups", required: true },
      { kind: "i18n", name: "name", label: "Name", required: true },
      { kind: "i18n", name: "description", label: "Description", textarea: true },
      { kind: "number", name: "price_min", label: "Price min (MAD)" },
      { kind: "number", name: "price_max", label: "Price max (MAD)" },
      { kind: "number", name: "extra_days", label: "Extra days" },
      { kind: "multi", name: "category_ids", label: "Available for categories", table: "feature_categories", key: "feature_id", other: "category_id", optionsFrom: "categories", hint: "Leave empty = available for every category" },
      active,
    ],
    columns: [{ name: "name_fr", label: "Name" }, { name: "group_id", label: "Group", type: "rel", optionsFrom: "feature_groups" }, { name: "price_min", label: "Min", type: "price" }, { name: "price_max", label: "Max", type: "price" }, { name: "extra_days", label: "Days" }, { name: "is_active", label: "Active", type: "bool" }],
  },
  {
    key: "packages", slug: "packages", title: "Packages & maintenance plans", table: "packages", ordered: true,
    fields: [
      { kind: "select", name: "kind", label: "Kind", options: [{ value: "project", label: "Project package" }, { value: "maintenance", label: "Maintenance / hosting plan" }] },
      { kind: "i18n", name: "name", label: "Name", required: true },
      { kind: "i18n", name: "description", label: "Description" },
      { kind: "number", name: "price", label: "Price (MAD)" },
      { kind: "select", name: "billing_type", label: "Billing", options: [{ value: "one_time", label: "One-time" }, { value: "monthly", label: "Monthly" }, { value: "yearly", label: "Yearly" }] },
      { kind: "lines", name: "items", label: "Included items (one per line)" },
      { kind: "select", name: "category_id", label: "Linked category (optional)", optionsFrom: "categories", nullable: true },
      { kind: "bool", name: "is_highlighted", label: "Highlighted (most popular)" },
      active,
    ],
    columns: [{ name: "name_fr", label: "Name" }, { name: "kind", label: "Kind" }, { name: "price", label: "Price", type: "price" }, { name: "billing_type", label: "Billing" }, { name: "is_highlighted", label: "Highlighted", type: "bool" }, { name: "is_active", label: "Active", type: "bool" }],
  },
  {
    key: "portfolio_projects", slug: "portfolio", title: "Portfolio", table: "portfolio_projects", ordered: true, hasSlug: true, slugFrom: "title_en",
    fields: [
      { kind: "i18n", name: "title", label: "Title", required: true },
      { kind: "text", name: "slug", label: "Slug (url)" },
      { kind: "text", name: "client_name", label: "Client (optional)" },
      { kind: "select", name: "category_id", label: "Category", optionsFrom: "categories", nullable: true },
      { kind: "images", name: "images", label: "Images" },
      { kind: "i18n", name: "description", label: "Description", textarea: true },
      { kind: "i18n", name: "result", label: "Result", textarea: true },
      { kind: "list", name: "technologies", label: "Technologies", hint: "One per line" },
      { kind: "url", name: "link", label: "Project link" },
      { kind: "bool", name: "is_featured", label: "Featured" },
      { kind: "bool", name: "is_published", label: "Published (otherwise draft)" },
    ],
    columns: [{ name: "title_fr", label: "Title" }, { name: "client_name", label: "Client" }, { name: "is_featured", label: "Featured", type: "bool" }, { name: "is_published", label: "Published", type: "bool" }],
  },
  {
    key: "testimonials", slug: "testimonials", title: "Testimonials", table: "testimonials", ordered: true,
    fields: [
      { kind: "text", name: "client_name", label: "Client name", required: true },
      { kind: "text", name: "business", label: "Business" },
      { kind: "image", name: "photo_url", label: "Photo" },
      { kind: "i18n", name: "text", label: "Testimonial", textarea: true, required: true },
      { kind: "number", name: "rating", label: "Rating (1-5)" },
      { kind: "bool", name: "is_published", label: "Published (otherwise hidden)" },
    ],
    columns: [{ name: "client_name", label: "Client" }, { name: "business", label: "Business" }, { name: "rating", label: "Rating" }, { name: "is_published", label: "Published", type: "bool" }],
  },
  {
    key: "faqs", slug: "faq", title: "FAQ", table: "faqs", ordered: true,
    fields: [
      { kind: "i18n", name: "question", label: "Question", required: true },
      { kind: "i18n", name: "answer", label: "Answer", textarea: true, required: true },
      active,
    ],
    columns: [{ name: "question_fr", label: "Question" }, { name: "is_active", label: "Active", type: "bool" }],
  },
];

export const bySlug = (slug: string) => resources.find((r) => r.slug === slug);
export const byKey = (key: string) => resources.find((r) => r.key === key);

/** Label column used when a table is shown in a <select>. */
export const labelColumn: Record<string, string> = {
  project_types: "name_fr", categories: "name_fr", feature_groups: "name_fr", templates: "name_fr", features: "name_fr", packages: "name_fr",
};
