import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { AuthProvider } from "@/components/providers/auth-provider";
import { LoginSuccessToast } from "@/components/auth/login-success-toast";

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
          <LoginSuccessToast />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </AuthProvider>
        <Script id="ms-clarity" strategy="lazyOnload">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "w3ptlzj6kf");
          `}
        </Script>
        <Script
          id="gtag-src"
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-WD4XJWBRTG"
        />
        <Script id="gtag-config" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-WD4XJWBRTG');
          `}
        </Script>
      </body>
    </html>
  );
}
