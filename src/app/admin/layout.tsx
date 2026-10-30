import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import { inter } from "@/lib/fonts";
import "../globals.css";

export const metadata: Metadata = { title: { default: "Admin", template: "%s | eazy admin" }, robots: { index: false, follow: false } };

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" translate="no" suppressHydrationWarning>
      <body className={inter.variable}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>{children}</ThemeProvider>
      </body>
    </html>
  );
}
