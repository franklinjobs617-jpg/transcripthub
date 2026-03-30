import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "AI Transcript Generator - Turn Video to Text Online Free",
  description:
    "Convert TikTok, Instagram, and Facebook videos to text in seconds. No signup required. Free 1-minute preview with 1-click copy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="system" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col bg-app-bg text-app-text selection:bg-app-primary-soft">
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var savedMode = localStorage.getItem("theme-mode") || "system";
                  var isDark = savedMode === "dark" || (savedMode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                  var root = document.documentElement;
                  root.setAttribute("data-theme", savedMode);
                  root.classList.toggle("dark", isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
        <AuthProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
      </body>
    </html>
  );
}
