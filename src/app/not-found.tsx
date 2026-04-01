import Link from "next/link";
import { ArrowLeft, Home, SearchX } from "lucide-react";

const QUICK_LINKS = [
  { href: "/instagram-transcript", label: "Instagram Transcript" },
  { href: "/tiktok-transcript", label: "TikTok Transcript" },
  { href: "/facebook-transcript", label: "Facebook Transcript" },
  { href: "/pricing", label: "Pricing" },
];

export default function NotFoundPage() {
  return (
    <div className="relative w-full overflow-hidden bg-app-bg">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(780px_420px_at_20%_0%,rgba(236,72,153,0.12),transparent_62%),radial-gradient(760px_420px_at_80%_2%,rgba(56,189,248,0.15),transparent_62%)]" />

      <section className="relative mx-auto flex min-h-[calc(100vh-140px)] w-full max-w-6xl items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="w-full overflow-hidden rounded-[2rem] border border-app-border bg-app-surface p-6 shadow-[0_24px_64px_-44px_rgba(15,23,42,0.45)] sm:p-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-bg px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-app-text-muted">
            <SearchX className="h-3.5 w-3.5 text-cyan-500" />
            404
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-app-text sm:text-5xl">
            We can&apos;t find that page.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-app-text-muted sm:text-base">
            The link may be outdated, or the page may have moved. Use the
            transcript tools below to continue quickly.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/"
              className="ui-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-bold"
            >
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
            <Link
              href="/tiktok-transcript"
              className="ui-btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-lg px-6 text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Open Transcript Tool
            </Link>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {QUICK_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm font-semibold text-app-text transition-colors hover:border-cyan-300/70 hover:bg-cyan-50/40 dark:hover:bg-cyan-950/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
