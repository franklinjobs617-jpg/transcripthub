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
import FacebookTranscriptTool from "@/components/pages/facebook-transcript-tool";
import { RealImageCard } from "@/components/shared/real-image-card";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

export const metadata: Metadata = {
  title: "Facebook Transcript Generator & Video to Text Tool",
  description:
    "Convert Facebook videos into clean transcript text and subtitle-ready files for repurposing, caption workflows, and content publishing.",
  keywords: [
    "facebook transcript",
    "facebook transcript generator",
    "facebook video to text",
    "fb video transcript",
    "facebook video script",
    "facebook subtitle srt",
    "facebook transcript download",
  ],
  alternates: {
    canonical: "/facebook-transcript",
  },
  openGraph: {
    title: "Facebook Transcript Generator & Video to Text Tool",
    description:
      "Convert Facebook videos into clean transcript text and subtitle-ready files for repurposing, caption workflows, and content publishing.",
    url: "/facebook-transcript",
    siteName: "Transcripthub",
    type: "website",
    images: [
      {
        url: "/captures/facebook-20260329.png",
        alt: "Facebook transcript generator preview on Transcripthub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Facebook Transcript Generator & Video to Text Tool",
    description:
      "Convert Facebook videos into clean transcript text and subtitle-ready files for repurposing, caption workflows, and content publishing.",
    images: ["/captures/facebook-20260329.png"],
  },
};

const faqItems = [
  {
    question: "Can I generate a Facebook transcript online?",
    answer:
      "Yes. Paste a supported public Facebook video link and generate transcript preview in seconds.",
  },
  {
    question: "Can I export subtitle formats for editing?",
    answer:
      "Yes. You can export transcript text and subtitle-ready SRT/TXT formats for your editing workflow.",
  },
  {
    question: "Can I try it without account first?",
    answer:
      "Yes. Start free, view the full transcript output, and export subtitle files when your team is ready.",
  },
  {
    question: "Is this useful for Facebook content teams?",
    answer:
      "Yes. It is designed for marketers, creators, and agencies that repurpose Facebook videos into cross-platform content.",
  },
  {
    question: "How fast is Facebook transcription?",
    answer:
      "Most short and mid-length videos process quickly, and Pro users get faster queue priority for heavier workloads.",
  },
  {
    question: "Can I copy transcript text for campaign docs?",
    answer:
      "Yes. You can copy clean transcript output and use it in briefs, captions, and recap content.",
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

export default function FacebookTranscriptPage() {
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
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_30%_10%,rgba(24,119,242,0.16),transparent_45%),radial-gradient(circle_at_75%_15%,rgba(56,189,248,0.15),transparent_46%)]" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center rounded-lg border border-blue-200/70 bg-blue-50/70 px-3 py-1 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-900/40 dark:bg-blue-900/10 dark:text-blue-300">
            <FacebookIcon className="mr-2 h-3.5 w-3.5" />
            Facebook Transcript + Download-ready Export
          </div>

          <h1 className="mb-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-app-text sm:text-5xl lg:text-6xl">
            Convert Facebook videos into
            <span className="bg-gradient-to-r from-blue-500 via-cyan-500 to-indigo-500 bg-clip-text text-transparent">
              {" "}
              accurate scripts and captions
            </span>{" "}
            in seconds
          </h1>

          <p className="mb-7 max-w-2xl text-base leading-relaxed text-app-text-muted sm:text-lg">
            Extract spoken content, build subtitle files, and repurpose your Facebook
            videos for blogs, emails, and social campaigns.
          </p>

          <div id="facebook-transcript-input" className="mb-6 flex w-full scroll-mt-28 justify-center">
            <FacebookTranscriptTool />
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {[
              "Facebook Transcript",
              "FB Video to Text",
              "SRT / TXT Export",
              "No Signup Preview",
              "Fast Processing",
              "Repurpose Workflow",
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
              { label: "Creators", value: "9k+" },
              { label: "Accuracy", value: "99%" },
              { label: "Avg Speed", value: "18s" },
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

      <section className="w-full border-y border-app-border bg-app-surface/30 px-4 py-10 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 md:grid-cols-3">
          {[
            {
              icon: MonitorPlay,
              title: "Paste FB URL",
              desc: "Start from a public Facebook video link and validate source availability.",
            },
            {
              icon: FileText,
              title: "Generate Transcript",
              desc: "Process speech into clean, timestamped script output.",
            },
            {
              icon: Layout,
              title: "Export Captions",
              desc: "Build SRT/TXT subtitle-ready files for publishing and editing.",
            },
          ].map((item) => (
            <article key={item.title} className="ui-card bg-app-surface p-5">
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-500 to-cyan-500 text-white shadow-md">
                  <FacebookIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-app-text">
                  facebook_campaign_script_2078.srt
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
                  p: "In this update, we break down the 3 most important Facebook video ranking signals.",
                  sub: "Use transcript highlights to turn long videos into clear post notes.",
                },
                {
                  t: "0:12",
                  p: "First, opening retention in the first 5 seconds has the strongest distribution impact.",
                  sub: "Early retention strongly affects delivery and recommendation.",
                },
                {
                  t: "0:24",
                  p: "Second, comments and shares from your warm audience accelerate reach.",
                  sub: "Community engagement gives better secondary distribution.",
                },
              ].map((row) => (
                <div key={row.t} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 text-[10px] font-bold tabular-nums text-blue-600/70">
                    {row.t}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-relaxed text-app-text/90">{row.p}</p>
                    <p className="mt-1 text-xs leading-relaxed text-app-text-muted">{row.sub}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-blue-400/30 bg-blue-500/10 p-3 dark:bg-blue-500/14">
                <p className="text-[11px] font-semibold leading-relaxed text-blue-800 dark:text-blue-100">
                  Full sample is visible for transparent preview. Paste your Facebook link above to generate complete transcript and subtitle files.
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
              <h2 className="text-lg font-bold text-app-text">Facebook Transcript Panel</h2>
              <span className="rounded bg-app-primary-soft px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-app-text-muted">
                Team Ready
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
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
              <h3 className="mb-2 text-sm font-bold text-app-text">Repurpose outputs</h3>
              <div className="space-y-2 text-xs text-app-text-muted">
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Facebook transcript to blog post draft
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Video script to campaign summary
                </div>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                  Caption pack for multi-channel posting
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-app-border bg-blue-500/8 p-7 dark:bg-blue-500/12 md:col-span-2">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg border border-blue-100 bg-app-surface shadow-sm dark:border-blue-800/30">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-300" />
            </div>
            <h2 className="mb-3 text-xl font-bold text-app-text">Built for Facebook growth workflows</h2>
            <p className="max-w-md text-sm leading-relaxed text-app-text-muted">
              Convert FB video speech to text at scale, improve caption quality, and ship
              repurposed content faster across channels.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
              <span>Stable speech pipeline</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-7">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300">
              <Users className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-app-text">Team collaboration</h3>
            <p className="text-xs leading-relaxed text-app-text-muted">
              Shared transcript output helps content, growth, and media teams align faster.
            </p>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-surface p-7">
            <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-app-text">Security-first</h3>
            <p className="text-xs leading-relaxed text-app-text-muted">
              Stable processing and protected workflow for repeatable production use.
            </p>
          </div>

          <div className="rounded-2xl border border-app-border bg-app-bg p-7 md:col-span-2">
            <h3 className="mb-4 text-xl font-bold text-app-text">Use this Facebook transcript for</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                "SEO article drafts",
                "Campaign post variants",
                "Video recap newsletters",
                "Community update posts",
                "Ad testing copy ideas",
                "Caption localization",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface p-2.5 text-xs font-medium text-app-text"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
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
            <h2 className="mb-3 text-2xl font-bold tracking-tight">3-step Facebook flow</h2>
            <p className="text-sm opacity-70">Simple and clear for first-time users.</p>
          </div>
          <div className="grid gap-4 text-left sm:grid-cols-3 md:w-3/4">
            {[
              { n: "01", t: "Paste FB URL", d: "Input a public Facebook video link." },
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
            src="/images/facebook/facebook-real-result.svg"
            alt="Facebook video transcript result with text and export actions"
            title="Facebook input to transcript result"
            description="Real product view for FB video: URL input, transcript preview, and action buttons. Replace this file with your production screenshot."
            accentClassName="from-blue-500/25 to-cyan-500/20"
          />
          <RealImageCard
            src="/images/facebook/facebook-export-panel.svg"
            alt="Facebook transcript exported in SRT and TXT"
            title="Facebook export and repurpose panel"
            description="Real export flow for subtitle files and campaign reuse. Replace this file with your actual export screenshot."
            accentClassName="from-blue-500/25 to-indigo-500/20"
          />
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-12 sm:px-6 lg:px-8">
        <div className="ui-card bg-app-surface p-6">
          <h2 className="mb-5 text-xl font-bold text-app-text">Facebook transcript comparison</h2>
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
                  { f: "Transcription speed", us: "~18s", them: "~25m+" },
                  { f: "Subtitle export", us: "SRT/TXT", them: "Limited" },
                  { f: "Full transcript visibility", us: "Yes", them: "No" },
                  { f: "Repurpose workflow", us: "Built-in", them: "Manual" },
                ].map((row) => (
                  <tr key={row.f} className="hover:bg-app-surface/50">
                    <td className="p-4 text-xs font-bold text-app-text-muted">{row.f}</td>
                    <td className="p-4 text-center font-bold text-blue-600">{row.us}</td>
                    <td className="p-4 text-center text-xs opacity-50">{row.them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card bg-app-surface p-6">
          <h2 className="mb-5 text-xl font-bold text-app-text">FAQ: Facebook transcript</h2>
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
            Ready to scale with Facebook transcript automation?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-app-text-muted">
            Use this page as your dedicated Facebook conversion funnel: view full transcript,
            export subtitle files, and repurpose content with a clear user path.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#facebook-transcript-input"
              className="rounded-xl bg-blue-600 px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:bg-blue-700 active:scale-95"
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
