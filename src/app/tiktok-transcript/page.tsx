import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Globe,
  Layout,
  MonitorPlay,
  ShieldCheck,
  Sparkles,
  Users,
  Wand2,
  Zap,
} from "lucide-react";
import TikTokTranscriptTool from "@/components/pages/tiktok-transcript-tool";
import { RealImageCard } from "@/components/shared/real-image-card";

export const metadata: Metadata = {
  title: "TikTok Transcript Generator Online & Video Transcription Tool",
  description:
    "Use our TikTok Transcript Generator online for fast TikTok Video Transcription and clean TikTok Script output for captions, repurposing, and subtitle export.",
  keywords: [
    "tiktok transcript",
    "tiktok transcript generator",
    "tiktok transcript generator online",
    "free tiktok transcript generator",
    "tiktok video transcription",
    "tiktok script",
    "tiktok video to text",
    "tiktok subtitles srt",
    "tiktok to script",
  ],
  alternates: {
    canonical: "/tiktok-transcript",
  },
  openGraph: {
    title: "TikTok Transcript Generator Online & Video Transcription Tool",
    description:
      "Use our TikTok Transcript Generator online for fast TikTok Video Transcription and clean TikTok Script output for captions, repurposing, and subtitle export.",
    url: "/tiktok-transcript",
    siteName: "Transcripthub",
    type: "website",
    images: [
      {
        url: "/captures/tiktok-20260329.png",
        alt: "TikTok transcript generator preview on Transcripthub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "TikTok Transcript Generator Online & Video Transcription Tool",
    description:
      "Use our TikTok Transcript Generator online for fast TikTok Video Transcription and clean TikTok Script output for captions, repurposing, and subtitle export.",
    images: ["/captures/tiktok-20260329.png"],
  },
};

const faqItems = [
  {
    question: "Can I convert TikTok videos to transcript online?",
    answer:
      "Yes. Paste a supported TikTok URL and generate clean transcript output for captions, scripts, and publishing workflows.",
  },
  {
    question: "Can I export subtitles for editing software?",
    answer:
      "Yes. You can export subtitle-friendly formats like SRT and plain TXT for editing, posting, and repurposing.",
  },
  {
    question: "Do I need an account for preview?",
    answer:
      "No. You can start free, view the full transcript output, and export subtitle formats when needed.",
  },
  {
    question: "Is this page focused on transcript or subtitle export?",
    answer:
      "It is transcript-first. You get readable full-script output and subtitle export workflow for publishing.",
  },
  {
    question: "How fast is TikTok transcription?",
    answer:
      "Most short-form videos process in seconds, and long clips are queued with priority for Pro users.",
  },
  {
    question: "Can I copy transcript text directly?",
    answer:
      "Yes. You can copy clean transcript text for quick reuse in captions, posts, and campaign docs.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function TikTokTranscriptPage() {
  return (
    <div className="w-full overflow-x-hidden bg-app-bg text-app-text transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section
        id="hero"
        className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-20 lg:px-8"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_30%_10%,rgba(22,227,255,0.16),transparent_45%),radial-gradient(circle_at_70%_12%,rgba(255,0,80,0.15),transparent_46%)]" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center rounded-lg border border-cyan-200/70 bg-cyan-50/70 px-3 py-1 text-xs font-bold text-cyan-700 shadow-sm dark:border-cyan-900/40 dark:bg-cyan-900/10 dark:text-cyan-300">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            TikTok Transcript Generator
          </div>

          <h1 className="mb-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-app-text sm:text-5xl lg:text-6xl">
            Turn TikTok videos into
            <span className="bg-gradient-to-r from-cyan-500 via-blue-500 to-pink-500 bg-clip-text text-transparent">
              {" "}
              transcript-ready scripts
            </span>{" "}
            and captions in seconds
          </h1>

          <p className="mb-7 max-w-2xl text-base leading-relaxed text-app-text-muted sm:text-lg">
            Built for global creators: run TikTok Video Transcription, clean subtitle files,
            and repurpose every TikTok Script into blog, email, and social content.
          </p>

          <div id="tiktok-transcript-input" className="mb-6 flex w-full scroll-mt-28 justify-center">
            <TikTokTranscriptTool />
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {[
              "TikTok to Text",
              "TikTok Script",
              "SRT / TXT Export",
              "No Signup Preview",
              "Fast Processing",
              "Creator SEO Content",
            ].map((chip) => (
              <span
                key={chip}
                className="ui-chip px-3 py-1 text-[11px] font-bold uppercase tracking-wide"
              >
                {chip}
              </span>
            ))}
          </div>

          <div className="grid w-full max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Creators", value: "18k+" },
              { label: "Accuracy", value: "99%" },
              { label: "Avg Speed", value: "15s" },
              { label: "Export Types", value: "SRT/TXT" },
            ].map((item) => (
              <div key={item.label} className="ui-card rounded-xl bg-app-surface p-4 text-left">
                <div className="text-lg font-extrabold text-app-text">{item.value}</div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-app-text-muted">
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 pb-10 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <article className="ui-card rounded-2xl bg-app-surface p-6 sm:p-7">
            <h2 className="text-xl font-bold text-app-text">
              TikTok Video Transcription and Script Workflow
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-app-text-muted">
              This workflow combines fast TikTok Video Transcription with editable TikTok Script
              output so teams can move directly into caption writing, short-form repurposing, and
              subtitle publishing. Start with full transcript visibility, validate transcript quality,
              and export formats when needed.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:gap-5">
              <Link href="/pricing" className="ui-link-arrow">
                <span>Compare Transcript Plans</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/tiktok-transcript" className="ui-link-arrow">
                <span>Run TikTok Transcript Generator</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="w-full border-y border-app-border bg-app-surface/30 px-4 py-10 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: MonitorPlay,
              title: "Paste TikTok URL",
              desc: "Start from a public TikTok link and validate the media source.",
            },
            {
              icon: FileText,
              title: "Generate Transcript",
              desc: "Process speech into clear, timestamped script output.",
            },
            {
              icon: Layout,
              title: "Export Captions",
              desc: "Convert transcript into subtitle-ready formats for publishing.",
            },
          ].map((item) => (
            <article key={item.title} className="ui-card bg-app-surface p-5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="mb-2 text-base font-bold text-app-text">{item.title}</h2>
              <p className="text-sm leading-relaxed text-app-text-muted">{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full px-4 py-12 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-lg">
            <div className="flex items-center justify-between border-b border-app-border bg-app-bg p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-pink-500 text-white shadow-md">
                  <Wand2 className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-app-text">
                  tiktok_campaign_script_1042.srt
                </span>
              </div>
              <span className="rounded-md bg-app-primary-soft px-2.5 py-1 text-[10px] font-bold text-app-text-muted">
                Transcript Preview
              </span>
            </div>

            <div className="min-h-[320px] space-y-5 p-6">
              {[
                {
                  t: "0:00",
                  p: "If your first sentence does not hook in 2 seconds, retention drops fast.",
                  sub: "Lead with a sharp hook to keep watch-time high.",
                },
                {
                  t: "0:10",
                  p: "Use this pattern: pain point, micro-proof, and one tactical action.",
                  sub: "Simple structure helps creators turn clips into scripts.",
                },
                {
                  t: "0:19",
                  p: "Then add CTA with clear benefit and deadline for stronger conversion.",
                  sub: "Close with one clear next step for better response.",
                },
              ].map((row) => (
                <div key={row.t} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold tabular-nums text-cyan-600/70">
                    {row.t}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-relaxed text-app-text/90">{row.p}</p>
                    <p className="mt-1 text-xs leading-relaxed text-app-text-muted">{row.sub}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-cyan-400/30 bg-cyan-500/10 p-3 dark:bg-cyan-500/14">
                <p className="text-[11px] font-semibold leading-relaxed text-cyan-800 dark:text-cyan-100">
                  Full sample is visible for clarity. Paste your TikTok URL above to generate your own complete transcript and subtitle files.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                <button className="ui-btn-primary h-10 rounded-lg px-3 text-xs font-bold">
                  View Full Transcript
                </button>
                <button className="ui-btn-secondary h-10 rounded-lg px-3 text-xs font-bold">
                  Copy Transcript
                </button>
              </div>
            </div>
          </div>

          <div className="ui-card bg-app-surface p-6 sm:p-7">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-app-text">TikTok Transcript Panel</h2>
              <span className="rounded bg-app-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-app-text-muted">
                Creator Flow
              </span>
            </div>

            <div className="mb-6 space-y-3">
              {[
                { icon: FileText, label: "Transcript Preview", meta: "Timestamped Text" },
                { icon: Layout, label: "Subtitle Export", meta: "SRT / TXT" },
                { icon: Globe, label: "Global Content", meta: "Repurpose for EN audience" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-app-border bg-app-bg p-3.5 transition-colors hover:bg-app-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
                      <row.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-text">{row.label}</div>
                      <div className="text-[11px] text-app-text-muted">{row.meta}</div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="ui-btn-primary h-11 rounded-lg text-sm font-bold">
                View Full Transcript
              </button>
              <button className="ui-btn-secondary h-11 rounded-lg text-sm font-bold">
                Copy Transcript
              </button>
            </div>

            <div className="mt-5 rounded-xl border border-app-border bg-app-bg p-4">
              <h3 className="mb-2 text-sm font-bold text-app-text">SEO-ready output ideas</h3>
              <div className="space-y-2 text-xs text-app-text-muted">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  TikTok transcript to blog post outline
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Video script to newsletter summary
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Short caption pack for cross-platform posting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-app-border bg-cyan-500/8 p-7 dark:bg-cyan-500/12 md:col-span-2">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-100 bg-app-surface shadow-sm dark:border-cyan-800/30">
              <Zap className="h-5 w-5 text-cyan-600 dark:text-cyan-300" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-app-text">Built for high-volume creators</h2>
            <p className="max-w-md text-sm leading-relaxed text-app-text-muted">
              Convert TikTok audio to text at scale and keep your publishing cadence
              consistent across Instagram, YouTube Shorts, X, and newsletters.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-cyan-700 dark:text-cyan-300">
              <span>Advanced speech pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-7">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-app-text">Team collaboration</h3>
            <p className="text-xs leading-relaxed text-app-text-muted">
              Shared transcript output helps social, content, and growth teams align
              faster.
            </p>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-7">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-app-text">Security-first</h3>
            <p className="text-xs leading-relaxed text-app-text-muted">
              Stable processing and protected pipeline for daily creator operations.
            </p>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg p-7 md:col-span-2">
            <h3 className="mb-4 text-xl font-bold text-app-text">Use this TikTok transcript for</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "SEO article drafts",
                "Hook library building",
                "Ad copy ideation",
                "Caption localization",
                "Course notes and summaries",
                "Community recap posts",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface p-2.5 text-xs font-medium text-app-text"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-cyan-600" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-app-primary px-4 py-12 text-app-primary-foreground sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center gap-10 md:flex-row">
          <div className="text-left md:w-1/4">
            <h2 className="mb-3 text-2xl font-bold tracking-tight">3-step TikTok flow</h2>
            <p className="text-sm opacity-70">Simple and clear for first-time users.</p>
          </div>
          <div className="grid gap-4 text-left sm:grid-cols-3 md:w-3/4">
            {[
              { n: "01", t: "Paste TikTok URL", d: "Input a public video link." },
              { n: "02", t: "Process", d: "Extract transcript automatically." },
              { n: "03", t: "Export", d: "Export SRT/TXT subtitles for publishing." },
            ].map((step) => (
              <div key={step.n} className="space-y-2 rounded-xl border border-white/15 bg-white/5 p-4">
                <div className="text-xs font-black text-cyan-300">{step.n}</div>
                <h3 className="text-base font-bold">{step.t}</h3>
                <p className="text-[11px] opacity-70">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full px-4 py-12 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
          <RealImageCard
            src="/images/tiktok/tiktok-real-result.svg"
            alt="TikTok transcript result with timestamps and export actions"
            title="TikTok input to transcript result"
            description="Real product view: URL input, transcript preview, and next-step actions. Replace this file with your production screenshot."
            accentClassName="from-cyan-500/25 to-fuchsia-500/20"
          />
          <RealImageCard
            src="/images/tiktok/tiktok-export-panel.svg"
            alt="TikTok transcript exported as SRT and TXT"
            title="TikTok export and repurpose panel"
            description="Real export flow: subtitle format output and repurpose-ready script panel. Replace this file with your actual export screenshot."
            accentClassName="from-cyan-500/25 to-blue-500/20"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="ui-card bg-app-surface p-6">
          <h2 className="mb-5 text-xl font-bold text-app-text">TikTok transcript comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-app-border">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-app-border bg-app-bg">
                <tr>
                  <th className="p-4 text-[10px] font-bold uppercase text-app-text-muted">
                    Metric
                  </th>
                  <th className="p-4 text-center font-bold text-app-text">Transcripthub</th>
                  <th className="p-4 text-center font-bold text-app-text-muted">Legacy tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/30">
                {[
                  { f: "Transcription speed", us: "~15s", them: "~20m+" },
                  { f: "Subtitle export", us: "SRT/TXT", them: "Limited" },
                  { f: "Full transcript visibility", us: "Yes", them: "No" },
                  { f: "Repurpose workflow", us: "Built-in", them: "Manual" },
                ].map((row) => (
                  <tr key={row.f} className="hover:bg-app-surface/50">
                    <td className="p-4 text-xs font-bold text-app-text-muted">{row.f}</td>
                    <td className="p-4 text-center font-bold text-cyan-600">{row.us}</td>
                    <td className="p-4 text-center text-xs opacity-50">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card bg-app-surface p-6">
          <h2 className="mb-5 text-xl font-bold text-app-text">FAQ: TikTok transcript</h2>
          <div className="space-y-3">
            {faqItems.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-app-border bg-app-bg/40 p-4">
                <summary className="flex cursor-pointer items-center justify-between text-sm font-bold text-app-text">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 text-app-text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-app-text-muted">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-app-border bg-app-bg px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-5 text-3xl font-bold leading-tight tracking-tight text-app-text sm:text-5xl">
            Ready to scale with TikTok transcript automation?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-app-text-muted">
            Use this page as your dedicated TikTok conversion funnel: view full transcript,
            export subtitle files, and repurpose content with clear user flow.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#tiktok-transcript-input"
              className="rounded-xl bg-cyan-600 px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-cyan-700 active:scale-95"
            >
              Start for Free
            </Link>
            <Link href="/pricing" className="ui-link-arrow px-4 text-sm font-bold">
              <span>View Plans</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="mt-7 flex items-center justify-center gap-4 text-xs text-app-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              No credit card for preview
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-emerald-500" />
              Fast transcript generation
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
