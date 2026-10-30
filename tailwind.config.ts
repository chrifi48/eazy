import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        border: "hsl(var(--border))",
        card: "hsl(var(--card))",
        primary: { DEFAULT: "rgb(var(--primary) / <alpha-value>)", foreground: "#fff" },
        accent: { DEFAULT: "rgb(var(--accent) / <alpha-value>)", foreground: "#fff" },
      },
      fontFamily: {
        sans: ["var(--font-inter, system-ui)", "var(--font-cairo, system-ui)", "system-ui", "sans-serif"],
      },
      borderRadius: { xl: "0.9rem", "2xl": "1.25rem" },
      boxShadow: { soft: "0 4px 24px -6px rgb(0 0 0 / 0.08)" },
    },
  },
  plugins: [],
};
export default config;
