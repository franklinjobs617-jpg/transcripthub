"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ComponentType, type FormEvent, useState } from "react";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Link as LinkIcon,
  Loader2,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  FacebookIcon,
  InstagramIcon,
  TikTokIcon,
} from "@/components/shared/social-icons";

const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_APP_BASE_URL || "https://transcripthub.com"
).replace(/\/+$/, "");

type PlatformItem = {
  name: string;
  path: string;
  icon: ComponentType<{ className?: string }>;
  iconWrapClass: string;
  summary: string;
  keywords: string[];
};

const PLATFORM_ITEMS: PlatformItem[] = [
  {
    name: "Instagram Transcript",
    path: "/instagram-transcript",
    icon: InstagramIcon,
    iconWrapClass:
      "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white",
    summary:
      "Extract Instagram Reels Transcript fast, then copy or export subtitle text.",
    keywords: [
      "instagram transcript",
      "instagram reels transcript",
      "free instagram transcript",
    ],
  },
  {
    name: "TikTok Transcript",
    path: "/tiktok-transcript",
    icon: TikTokIcon,
    iconWrapClass: "bg-black text-white",
    summary:
      "TikTok Transcript Generator for script research, repurposing, and subtitle output.",
    keywords: [
      "tiktok transcript",
      "tiktok transcript generator",
      "tiktok script extractor",
    ],
  },
  {
    name: "Facebook Transcript",
    path: "/facebook-transcript",
    icon: FacebookIcon,
    iconWrapClass: "bg-[#1877F2] text-white",
    summary:
      "Facebook Video to Text workflow for ads, creators, and long-form social clips.",
    keywords: [
      "facebook transcript",
      "facebook video to text",
      "facebook transcript generator",
    ],
  },
];

const KEYWORD_QUERIES = [
  {
    phrase: "Turn Instagram Reels into clean transcript",
    hint: "Get readable lines for captions, hooks, and repost content.",
    href: "/instagram-transcript",
  },
  {
    phrase: "Start free, then unlock more after sign-in",
    hint: "Try guest access first and continue with starter credits after sign-in.",
    href: "/instagram-transcript",
  },
  {
    phrase: "Extract TikTok scripts you can actually reuse",
    hint: "Break long speech into reusable points for content planning.",
    href: "/tiktok-transcript",
  },
  {
    phrase: "Convert TikTok video to text in seconds",
    hint: "Generate clear transcript output with stable formatting.",
    href: "/tiktok-transcript",
  },
  {
    phrase: "Convert Facebook clips to editable text",
    hint: "One paste action, then transcript preview and export.",
    href: "/facebook-transcript",
  },
  {
    phrase: "Use one workflow for all three platforms",
    hint: "Instagram, TikTok, and Facebook in the same experience.",
    href: "/",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Paste your link",
    desc: "Add a public TikTok, Instagram, or Facebook URL. We validate it instantly.",
  },
  {
    step: "02",
    title: "Generate transcript",
    desc: "The system fetches source media, retries transient failures, and creates text output.",
  },
  {
    step: "03",
    title: "Export and repurpose",
    desc: "Copy the transcript or export files like SRT, then reuse in scripts or captions.",
  },
];

const VALUE_POINTS = [
  {
    title: "Conversion-first first screen",
    desc: "Hero keeps URL input and CTA above the fold on mobile for faster starts.",
  },
  {
    title: "Only successful links count",
    desc: "Credits are consumed only after direct-link success, reducing user friction.",
  },
  {
    title: "Guest-friendly onboarding",
    desc: "Guest access is available, then smooth login flow unlocks starter credits.",
  },
  {
    title: "Built for SEO intent coverage",
    desc: "Home + platform hubs target both core and long-tail transcript keywords naturally.",
  },
];

const USE_CASES = [
  {
    role: "Creators",
    desc: "Turn spoken video into reusable hooks, subtitles, and short-form scripts quickly.",
    actions: [
      "Build caption drafts from transcript lines",
      "Reuse winning hooks across channels",
      "Prepare subtitle exports for upload tools",
    ],
  },
  {
    role: "Performance marketers",
    desc: "Extract ad messaging patterns and compare social creative angles in minutes.",
    actions: [
      "Review competitor talking points by timestamp",
      "Convert ad voiceovers to editable text",
      "Create summary notes for rapid testing",
    ],
  },
  {
    role: "Teams and agencies",
    desc: "Standardize multi-platform transcript workflows with predictable output quality.",
    actions: [
      "Share clean transcript previews internally",
      "Reduce manual transcription operations",
      "Move faster from video research to deliverables",
    ],
  },
];

const HOME_FAQS = [
  {
    q: "Can I use this AI Transcript Generator without login?",
    a: "Yes. You can start in guest mode. Login is required after the free guest limit is reached.",
  },
  {
    q: "When do credits get deducted?",
    a: "A credit is consumed only when a direct link is successfully generated for a transcript task.",
  },
  {
    q: "Do you support video to text for all three platforms?",
    a: "Yes. You can process Instagram Transcript, TikTok Transcript, and Facebook Transcript from one site.",
  },
  {
    q: "Can I export subtitle files after generation?",
    a: "Yes. You can copy transcript text and export subtitle-friendly formats such as SRT.",
  },
  {
    q: "Is this affiliated with Instagram, Meta, TikTok, or ByteDance?",
    a: "No. This is an independent tool and is not affiliated with, endorsed, or sponsored by those platforms.",
  },
];

function normalizeInputUrl(raw: string): string {
  const value = raw.trim();
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  return `https://${value}`;
}

function detectTranscriptPath(raw: string): string | null {
  const normalized = normalizeInputUrl(raw);
  if (!normalized) return null;

  let host = "";
  try {
    host = new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (host.includes("tiktok.com")) return "/tiktok-transcript";
  if (host.includes("instagram.com")) return "/instagram-transcript";
  if (host.includes("facebook.com") || host.includes("fb.watch")) {
    return "/facebook-transcript";
  }
  return null;
}

export function HomeClient() {
  const router = useRouter();
  const [heroUrl, setHeroUrl] = useState("");
  const [heroError, setHeroError] = useState("");
  const [isRouting, setIsRouting] = useState(false);

  function handleHeroSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeInputUrl(heroUrl);
    const targetPath = detectTranscriptPath(heroUrl);

    if (!normalized) {
      setHeroError("Please paste a TikTok, Instagram, or Facebook URL.");
      return;
    }
    if (!targetPath) {
      setHeroError("Only TikTok, Instagram, and Facebook links are supported.");
      return;
    }

    setHeroError("");
    setIsRouting(true);
    router.push(`${targetPath}?url=${encodeURIComponent(normalized)}`);
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="w-full overflow-x-hidden bg-app-bg">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "Transcripthub",
            operatingSystem: "Web",
            applicationCategory: "MultimediaApplication",
            offers: {
              "@type": "Offer",
              price: "0.00",
              priceCurrency: "USD",
            },
            description:
              "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook video to text workflows.",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: PUBLIC_SITE_URL,
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate: `${PUBLIC_SITE_URL}/?url={search_term_string}`,
              },
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="relative isolate w-full overflow-hidden border-b border-app-border">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(920px_520px_at_16%_8%,rgba(236,72,153,0.12),transparent_64%),radial-gradient(980px_520px_at_82%_4%,rgba(56,189,248,0.15),transparent_64%)]" />

        <div className="relative mx-auto grid w-full max-w-7xl gap-10 px-4 pb-14 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:px-8 lg:pb-20 lg:pt-14">
          <div className="flex flex-col justify-center">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-app-text-muted">
              <Sparkles className="h-3.5 w-3.5 text-cyan-500" />
              AI Transcript Generator
            </div>

            <h1 className="mt-5 text-balance text-4xl font-black leading-[1.03] tracking-tight text-app-text sm:text-6xl lg:text-7xl">
              Video Transcript Generator for{" "}
              <span className="bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent">
                TikTok, Instagram, and Facebook
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-app-text-muted sm:text-lg">
              Convert social video to text in seconds. Paste one URL, generate a
              clean transcript preview, then export for subtitle, content, and
              script workflows.
            </p>

            <form
              onSubmit={handleHeroSubmit}
              className="mt-8 w-full max-w-2xl rounded-2xl border border-cyan-300/35 bg-app-surface/90 p-2 shadow-[0_20px_45px_-30px_rgba(56,189,248,0.42)] backdrop-blur"
            >
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <LinkIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-app-text-muted" />
                  <input
                    type="url"
                    required
                    value={heroUrl}
                    onChange={(event) => {
                      setHeroUrl(event.target.value);
                      if (heroError) setHeroError("");
                    }}
                    placeholder="Paste TikTok / Instagram / Facebook URL"
                    className="h-12 w-full rounded-xl border border-transparent bg-transparent pl-10 pr-4 text-sm font-semibold text-app-text outline-none placeholder:text-app-text-muted/60"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isRouting}
                  className="ui-btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-65"
                >
                  {isRouting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirecting...
                    </>
                  ) : (
                    <>
                      Generate Transcript
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>

            {heroError ? (
              <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
                {heroError}
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center gap-4 text-xs font-semibold text-app-text-muted">
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Guest mode available
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Sign in bonus: 2 credits
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Clean video to text export flow
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <div className="relative w-full max-w-[540px] overflow-hidden rounded-[2rem] border border-app-border bg-gradient-to-br from-white via-app-surface to-app-bg p-6 shadow-[0_28px_60px_-36px_rgba(15,23,42,0.38)] dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950 sm:p-7">
              <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-cyan-400/18 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-fuchsia-400/18 blur-3xl" />

              <div className="mb-5 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
                  <Zap className="h-3.5 w-3.5 text-cyan-500" />
                  Transcript Preview
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-black text-white">
                    <TikTokIcon className="h-4 w-4" />
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white">
                    <InstagramIcon className="h-4 w-4" />
                  </span>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#1877F2] text-white">
                    <FacebookIcon className="h-4 w-4" />
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-app-border bg-app-surface p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                    Hook
                  </p>
                  <p className="mt-1 text-sm font-semibold text-app-text">
                    [00:00] Here is the fastest way to repurpose this video
                    script...
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-surface p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                    Key Point
                  </p>
                  <p className="mt-1 text-sm font-semibold text-app-text">
                    [00:14] Every spoken line is converted into readable
                    transcript text.
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-surface p-3">
                  <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                    Output
                  </p>
                  <p className="mt-1 text-sm font-semibold text-app-text">
                    [00:42] Copy instantly or export subtitle-ready lines for
                    publishing.
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3 border-t border-app-border pt-5 text-xs font-bold text-app-text-muted">
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3.5 w-3.5 text-cyan-500" />
                  Fast generation loop
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                  Stable direct-link flow
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
              What you can do in one click
            </h2>
            <p className="mt-2 text-sm text-app-text-muted sm:text-base">
              Choose your goal, open the right tool, and get transcript output
              fast.
            </p>
          </div>

          {/* <div className="mb-6 overflow-hidden rounded-2xl border border-app-border bg-app-surface/60">
            <Image
              src="/images/home/hero-transcript-flow.svg"
              alt="AI video transcript generator illustration for TikTok Instagram and Facebook video to text workflow"
              width={1200}
              height={900}
              className="h-auto w-full"
              priority={false}
            />
          </div> */}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {KEYWORD_QUERIES.map((item) => (
              <Link
                key={item.phrase}
                href={item.href}
                className="group rounded-xl border border-app-border bg-app-surface px-4 py-3 transition-colors hover:border-cyan-300/70 hover:bg-cyan-50/35 dark:hover:bg-cyan-950/20"
              >
                <p className="text-sm font-bold text-app-text">{item.phrase}</p>
                <p className="mt-1 text-xs text-app-text-muted">{item.hint}</p>
                <p className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 dark:text-cyan-300">
                  Open tool{" "}
                  <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
              Platform-focused transcript tools
            </h2>
            <p className="mt-2 text-sm text-app-text-muted sm:text-base">
              Each hub targets its own platform behavior, URL pattern, and
              transcript intent.
            </p>
          </div>

          <div className="space-y-3">
            {PLATFORM_ITEMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <Link
                  key={platform.path}
                  href={platform.path}
                  className="group flex flex-col gap-3 rounded-2xl border border-app-border bg-app-surface px-4 py-4 transition-colors hover:border-cyan-300/70 hover:bg-cyan-50/35 sm:flex-row sm:items-center sm:justify-between dark:hover:bg-cyan-950/20"
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <span
                      className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${platform.iconWrapClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-base font-bold text-app-text">
                        {platform.name}
                      </p>
                      <p className="mt-1 text-sm text-app-text-muted">
                        {platform.summary}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {platform.keywords.map((keyword) => (
                          <span
                            key={keyword}
                            className="inline-flex rounded-full border border-app-border bg-app-bg px-2 py-1 text-[11px] font-semibold text-app-text-muted"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="hidden h-5 w-5 shrink-0 text-app-text-muted transition-transform group-hover:translate-x-1 group-hover:text-app-text sm:block" />
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
              Three steps. Clean output.
            </h2>
            <p className="mt-2 text-sm text-app-text-muted sm:text-base">
              Optimized flow from URL paste to transcript export with clear
              loading states.
            </p>
          </div>

          <div className="mb-8 overflow-hidden rounded-2xl border border-app-border bg-app-surface/60">
            <Image
              src="/images/home/three-step-transcript.webp"
              alt="Three-step video to text process illustration for transcript generation and subtitle export"
              width={1200}
              height={760}
              className="h-auto w-full"
            />
          </div>

          <div className="grid gap-7 md:grid-cols-3">
            {WORKFLOW_STEPS.map((item) => (
              <div
                key={item.step}
                className="relative border-l-2 border-app-border pl-5"
              >
                <p className="text-xs font-black uppercase tracking-widest text-cyan-600 dark:text-cyan-300">
                  {item.step}
                </p>
                <h3 className="mt-2 text-lg font-bold text-app-text">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
              Why teams choose Transcripthub
            </h2>
            <p className="mt-2 text-sm text-app-text-muted sm:text-base">
              Built for stable user experience, clear credit logic, and
              mobile-first conversion.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {VALUE_POINTS.map((point) => (
              <div
                key={point.title}
                className="border-l-2 border-app-border pl-4"
              >
                <h3 className="text-base font-bold text-app-text">
                  {point.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                  {point.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
              Built for creators, marketers, and agencies
            </h2>
            <p className="mt-2 text-sm text-app-text-muted sm:text-base">
              One transcript workflow, multiple downstream content outcomes.
            </p>
          </div>

          <div className="mb-8 overflow-hidden rounded-2xl border border-app-border bg-app-surface/60">
            <Image
              src="/images/home/use-cases-transcript.svg"
              alt="Video transcript generator use cases illustration for creators marketers and agencies"
              width={1200}
              height={760}
              className="h-auto w-full"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {USE_CASES.map((item) => (
              <div
                key={item.role}
                className="rounded-2xl border border-app-border bg-app-surface p-5"
              >
                <h3 className="text-lg font-bold text-app-text">{item.role}</h3>
                <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
                  {item.desc}
                </p>
                <ul className="mt-3 space-y-2">
                  {item.actions.map((action) => (
                    <li
                      key={action}
                      className="inline-flex items-start gap-2 text-sm text-app-text-muted"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-b border-app-border py-14">
        <div className="mx-auto w-full max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl">
            Frequently asked questions
          </h2>
          <div className="mt-8 space-y-3">
            {HOME_FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-app-border bg-app-surface px-5 py-4"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-bold text-app-text marker:content-none">
                  {faq.q}
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-app-border text-app-text-muted transition-colors group-open:border-app-text group-open:text-app-text">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-app-text-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-[2.2rem] bg-app-text px-6 py-14 text-app-surface shadow-[0_30px_70px_-42px_rgba(2,6,23,0.66)] sm:px-10">
            <h2 className="text-balance text-3xl font-black tracking-tight sm:text-5xl">
              Ready to generate your next transcript?
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-app-surface/75 sm:text-base">
              Start with free usage, then scale with credits when you need
              higher throughput.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/instagram-transcript"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-bold text-zinc-900 transition-transform hover:-translate-y-0.5"
              >
                Open Transcript Tools
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                className="inline-flex h-11 items-center justify-center rounded-xl border border-white/30 px-5 text-sm font-bold text-white/95 transition-colors hover:bg-white/10"
              >
                Back to top
              </button>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/25 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/75">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
              Built for mobile-first social transcript workflows
            </div>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-app-border bg-app-surface/70 py-6">
        <div className="mx-auto w-full max-w-7xl px-4 text-center text-xs leading-relaxed text-app-text-muted sm:px-6 lg:px-8">
          Not affiliated with, endorsed, or sponsored by Instagram, Meta,
          TikTok, or ByteDance.
        </div>
      </section>
    </main>
  );
}
