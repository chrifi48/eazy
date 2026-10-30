import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["fr", "ar", "en"],
  defaultLocale: "fr",
  localePrefix: "as-needed",
  localeDetection: false,
});
export type Locale = (typeof routing.locales)[number];
