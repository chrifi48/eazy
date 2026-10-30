import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }] },
  experimental: { serverActions: { bodySizeLimit: "4mb" }, serverComponentsExternalPackages: ["@electric-sql/pglite"] },
};
export default withNextIntl(nextConfig);
