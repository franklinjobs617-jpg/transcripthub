import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  FileText,
  Sparkles,
  Users,
  Terminal,
  Bird,
  Mail,
  SquarePen,
  MonitorPlay,
  Layout,
  Share2,
  Check,
  ChevronDown,
} from "lucide-react";
import InstagramTranscriptTool from "@/components/pages/instagram-transcript-tool";
import { RealImageCard } from "@/components/shared/real-image-card";

const InstagramIcon = ({ className }: { className?: string }) => (
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
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export const metadata: Metadata = {
  title: "Instagram Transcript Generator & Video Transcript Tool",
  description:
    "Generate an Instagram Video Transcript with our Instagram Transcript Generator and Instagram Script Extractor for reels, captions, and subtitle export.",
  keywords: [
    "instagram transcript",
    "instagram transcript generator",
    "instagram reels transcript",
    "instagram video transcript",
    "instagram script extractor",
    "ig reels script",
  ],
  alternates: {
    canonical: "/instagram-transcript",
  },
  openGraph: {
    title: "Instagram Transcript Generator & Video Transcript Tool",
    description:
      "Generate an Instagram Video Transcript with our Instagram Transcript Generator and Instagram Script Extractor for reels, captions, and subtitle export.",
    url: "/instagram-transcript",
    siteName: "Transcripthub",
    type: "website",
    images: [
      {
        url: "/captures/instagram-20260329.png",
        alt: "Instagram transcript generator preview on Transcripthub",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Instagram Transcript Generator & Video Transcript Tool",
    description:
      "Generate an Instagram Video Transcript with our Instagram Transcript Generator and Instagram Script Extractor for reels, captions, and subtitle export.",
    images: ["/captures/instagram-20260329.png"],
  },
};

const faqItems = [
  {
    q: "Can I transcribe Instagram reels directly?",
    a: "Yes. For supported public links, you can generate transcript preview and export-ready subtitle output.",
  },
  {
    q: "Do I get subtitles output?",
    a: "Yes, export subtitles as SRT and plain transcript as TXT for editing.",
  },
  {
    q: "Do I need signup to test first?",
    a: "No. You can use preview flow first and upgrade only when you need full transcript export.",
  },
  {
    q: "How accurate is the transcript?",
    a: "The model is optimized for short-form creator content and handles fast speech well.",
  },
  {
    q: "Is this suitable for teams?",
    a: "Yes, especially for social teams who need repeatable repurpose pipelines.",
  },
  {
    q: "Can I copy text for captions instantly?",
    a: "Yes. You can copy clean transcript text directly and adapt it for captions, posts, and newsletters.",
  },
];



const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function InstagramTranscriptPage() {
  return (
    <div className="w-full bg-app-bg text-app-text overflow-x-hidden transition-colors duration-300">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section
        id="hero"
        className="relative mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-20 lg:px-8"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[420px] w-full -translate-x-1/2 bg-[radial-gradient(circle_at_30%_10%,rgba(168,85,247,0.18),transparent_45%),radial-gradient(circle_at_70%_12%,rgba(249,115,22,0.14),transparent_46%)]" />

        <div className="flex flex-col items-center text-center">
          <div className="mb-5 inline-flex items-center rounded-lg border border-fuchsia-300/55 bg-fuchsia-50/70 px-3 py-1 text-xs font-bold text-fuchsia-700 shadow-sm dark:border-fuchsia-900/40 dark:bg-fuchsia-900/10 dark:text-fuchsia-300">
            <InstagramIcon className="mr-2 h-3.5 w-3.5" />
            Instagram Transcript Generator
          </div>

          <h1 className="mb-5 max-w-4xl text-3xl font-bold leading-tight tracking-tight text-app-text sm:text-5xl lg:text-6xl">
            Turn Instagram videos into
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 via-purple-600 to-orange-500">
              {" "}
              transcript-ready scripts
            </span>
            {" "}and captions in seconds
          </h1>

          <p className="mb-7 max-w-2xl text-base leading-relaxed text-app-text-muted sm:text-lg">
            Built for creators: run Instagram transcript extraction, clean subtitle files,
            and repurpose each Reel into blog, email, and social content.
          </p>

          <div id="instagram-transcript-input" className="mb-6 flex w-full scroll-mt-28 justify-center">
            <InstagramTranscriptTool />
          </div>

          <div className="mb-8 flex flex-wrap justify-center gap-2">
            {[
              "Reels",
              "Stories",
              "Posts",
              "SRT/TXT Export",
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
              { label: "Creators", value: "12k+" },
              { label: "Accuracy", value: "99.8%" },
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
              Instagram Video Transcript and Script Extractor Workflow
            </h2>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-app-text-muted">
              This page combines Instagram Video Transcript generation with an Instagram Script
              Extractor workflow, so creators can move from spoken video to editable text in one
              pass. You can start with preview mode, validate transcript quality, and then export
              subtitle-ready output for publishing and repurposing.
            </p>
            <div className="mt-4 flex flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:gap-5">
              <Link href="/free-instagram-transcript" className="ui-link-arrow">
                <span>Try Free Instagram Transcript Preview</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/pricing" className="ui-link-arrow">
                <span>Compare Export Plans</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>
        </div>
      </section>

      <section className="w-full py-10 px-4 lg:px-8 border-y border-app-border bg-app-surface/30">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              icon: MonitorPlay,
              title: "Paste Instagram URL",
              desc: "Works for public Reels, posts, and most story links.",
            },
            {
              icon: FileText,
              title: "Generate Transcript",
              desc: "Convert speech to text with timestamped output in seconds.",
            },
            {
              icon: Layout,
              title: "Export Captions",
              desc: "Use SRT/TXT export for editing, publishing, and SEO content.",
            },
          ].map((item) => (
            <article key={item.title} className="ui-card p-5 bg-app-surface">
              <div className="h-9 w-9 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center mb-4">
                <item.icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-app-text mb-2">
                {item.title}
              </h2>
              <p className="text-sm text-app-text-muted leading-relaxed">
                {item.desc}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="w-full py-12 px-4 lg:px-8">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
          <div className="border border-app-border rounded-2xl bg-app-surface shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-app-border p-4 bg-app-bg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-orange-500 flex items-center justify-center text-white shadow-md">
                  <InstagramIcon className="h-4 w-4" />
                </div>
                <span className="text-xs font-bold text-app-text">
                  instagram_reel_9034.srt
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-app-primary-soft text-app-text">
                Preview Ready
              </span>
            </div>

            <div className="p-6 space-y-5 min-h-[310px]">
              {[
                {
                  t: "0:00",
                  p: "Let me show you the hook formula we use for high-retention Reels.",
                  sub: "Start with a clear angle so viewers stay for the next line.",
                },
                {
                  t: "0:11",
                  p: "Open with a pain point, then deliver one tactical step in 7 seconds.",
                  sub: "Pain point + practical step keeps short-form scripts actionable.",
                },
              ].map((row) => (
                <div key={row.t} className="flex gap-4">
                  <span className="text-[10px] font-mono font-bold text-fuchsia-600/60 tabular-nums shrink-0 mt-0.5">
                    {row.t}
                  </span>
                  <div>
                    <p className="text-sm font-medium leading-relaxed text-app-text/90">
                      {row.p}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-app-text-muted">
                      {row.sub}
                    </p>
                  </div>
                </div>
              ))}

              <div className="rounded-xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-3 dark:bg-fuchsia-500/14">
                <p className="text-[11px] font-semibold leading-relaxed text-fuchsia-800 dark:text-fuchsia-100">
                  Full sample stays visible for better readability. Paste your
                  Instagram link above to generate complete transcript and
                  subtitle files.
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

          <div className="ui-card p-6 sm:p-7 bg-app-surface">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-app-text">
                Instagram Transcript Panel
              </h2>
              <span className="text-[10px] font-bold px-2 py-1 rounded bg-app-primary-soft text-app-text-muted uppercase tracking-wide">
                New
              </span>
            </div>

            <div className="space-y-3 mb-6">
              {[
                {
                  icon: FileText,
                  label: "Transcript",
                  meta: "Timestamped Text",
                },
                { icon: Layout, label: "Subtitle", meta: "SRT / TXT" },
                {
                  icon: Share2,
                  label: "Repurpose",
                  meta: "Thread / Blog / Mail",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between rounded-xl border border-app-border p-3.5 bg-app-bg hover:bg-app-surface transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-300 flex items-center justify-center">
                      <row.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-app-text">
                        {row.label}
                      </div>
                      <div className="text-[11px] text-app-text-muted">
                        {row.meta}
                      </div>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button className="ui-btn-primary h-11 rounded-lg font-bold text-sm">
                View Full Transcript
              </button>
              <button className="ui-btn-secondary h-11 rounded-lg font-bold text-sm">
                Copy Transcript
              </button>
            </div>

            <p className="mt-4 text-xs text-app-text-muted leading-relaxed">
              Purpose-built for transcript-first workflow with clear subtitle
              export.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
          <div className="md:col-span-2 border border-app-border rounded-2xl p-7 flex flex-col justify-between group bg-fuchsia-500/8 dark:bg-fuchsia-500/12">
            <div>
              <div className="h-10 w-10 bg-app-surface border border-fuchsia-300/35 rounded-lg flex items-center justify-center mb-6 shadow-sm group-hover:bg-fuchsia-600 group-hover:text-white transition-all">
                <Terminal className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold mb-3 tracking-tight text-app-text">
                Precision AI Engine
              </h2>
              <p className="text-app-text-muted text-sm max-w-sm">
                Detect slang, accents, and fast speech for creator-focused short
                video audio.
              </p>
            </div>
            <div className="mt-7 ui-link-arrow text-xs text-fuchsia-600 dark:text-fuchsia-200">
              <span>Technology details</span> <ArrowRight className="h-3 w-3" />
            </div>
          </div>

          <div className="border border-app-border rounded-2xl p-7 hover:border-orange-200 transition-all bg-app-surface">
            <div className="h-9 w-9 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-4 text-orange-600 dark:text-orange-300">
              <Clock className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-app-text">15s Speed</h3>
            <p className="text-app-text-muted text-xs leading-relaxed">
              Most reels finish quickly, so your content team can move without
              delays.
            </p>
          </div>

          <div className="border border-app-border rounded-2xl p-7 hover:border-emerald-200 transition-all bg-app-surface">
            <div className="h-9 w-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-300">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-app-text">
              Privacy-first
            </h3>
            <p className="text-app-text-muted text-xs leading-relaxed">
              Processed securely with minimal retention and no unnecessary
              account friction.
            </p>
          </div>

          <div className="md:col-span-2 border border-app-border rounded-2xl p-7 flex flex-col md:flex-row items-start gap-8 group overflow-hidden bg-app-bg">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-3 text-app-text flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-fuchsia-500" />
                Content Repurpose Hub
              </h3>
              <p className="text-app-text-muted text-sm">
                One transcript, multiple outputs with ready-to-edit formats.
              </p>
            </div>
            <div className="flex-1 w-full space-y-2">
              {[
                {
                  icon: <Bird className="h-3.5 w-3.5" />,
                  label: "Thread Draft",
                },
                {
                  icon: <Users className="h-3.5 w-3.5" />,
                  label: "Community Recap",
                },
                {
                  icon: <Mail className="h-3.5 w-3.5" />,
                  label: "Newsletter Copy",
                },
                {
                  icon: <SquarePen className="h-3.5 w-3.5" />,
                  label: "SEO Blog Draft",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center gap-3 p-2.5 bg-app-surface border border-app-border rounded-lg shadow-sm hover:translate-x-1 transition-transform"
                >
                  <div className="p-1.5 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-md text-fuchsia-600 dark:text-fuchsia-300">
                    {item.icon}
                  </div>
                  <span className="text-xs font-bold text-app-text">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="w-full py-12 bg-app-primary text-app-primary-foreground px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-10 items-center">
          <div className="md:w-1/4 text-left">
            <h2 className="text-2xl font-bold mb-3 tracking-tight">
              3-step workflow
            </h2>
            <p className="opacity-70 text-sm">Made for creator habits.</p>
          </div>
          <div className="md:w-3/4 grid sm:grid-cols-3 gap-4 text-left">
            {[
              { n: "01", t: "Paste URL", d: "Copy any IG link." },
              { n: "02", t: "Extract", d: "Generate transcript quickly." },
              {
                n: "03",
                t: "Export",
                d: "Use SRT/TXT for subtitles and publishing.",
              },
            ].map((step) => (
              <div
                key={step.n}
                className="p-4 border border-white/15 rounded-xl bg-white/5 space-y-2"
              >
                <div className="text-xs font-black text-fuchsia-300">
                  {step.n}
                </div>
                <h3 className="text-base font-bold">{step.t}</h3>
                <p className="opacity-70 text-[11px]">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <RealImageCard
            src="/images/instagram/instagram-real-result.svg"
            alt="Instagram Reel transcript preview and export options"
            title="Instagram input to transcript result"
            description="Real product view for reels: URL input, transcript preview, and one-click actions. Replace this file with your production screenshot."
            accentClassName="from-fuchsia-500/25 to-orange-500/20"
          />
          <RealImageCard
            src="/images/instagram/instagram-export-panel.svg"
            alt="Instagram transcript exported in SRT and TXT"
            title="Instagram export and repurpose panel"
            description="Real export flow for subtitles and script reuse. Replace this file with your actual export screenshot."
            accentClassName="from-fuchsia-500/25 to-purple-500/20"
          />
        </div>
      </section>

      <section className="w-full py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto grid grid-cols-1 gap-6">
        <div className="ui-card p-6 bg-app-surface">
          <h2 className="text-xl font-bold mb-5 text-app-text">
            Performance comparison
          </h2>
          <div className="overflow-x-auto border border-app-border rounded-xl">
            <table className="w-full text-left text-sm">
              <thead className="bg-app-bg border-b border-app-border">
                <tr>
                  <th className="p-4 font-bold text-app-text-muted text-[10px] uppercase">
                    Metric
                  </th>
                  <th className="p-4 font-bold text-app-text text-center">
                    Transcripthub
                  </th>
                  <th className="p-4 font-bold text-app-text-muted text-center">
                    Legacy tools
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-app-border/30">
                {[
                  { f: "Speed", us: "15s", them: "30m" },
                  { f: "Accuracy", us: "99%", them: "80%" },
                  {
                    f: "Output",
                    us: "Transcript + SRT/TXT",
                    them: "Text only",
                  },
                  { f: "Repurpose", us: "Built-in", them: "Manual work" },
                ].map((row) => (
                  <tr key={row.f} className="hover:bg-app-surface/50">
                    <td className="p-4 font-bold text-app-text-muted text-xs">
                      {row.f}
                    </td>
                    <td className="p-4 text-center font-bold text-fuchsia-600">
                      {row.us}
                    </td>
                    <td className="p-4 text-center opacity-50 text-xs">
                      {row.them}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="ui-card p-6 bg-app-surface">
          <h2 className="text-xl font-bold mb-5 text-app-text">FAQ</h2>
          <div className="space-y-3">
            {faqItems.map((faq) => (
              <details
                key={faq.q}
                className="group border border-app-border rounded-xl p-4 bg-app-bg/40"
              >
                <summary className="flex items-center justify-between cursor-pointer text-sm font-bold text-app-text">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-app-text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="mt-3 text-sm text-app-text-muted leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full py-16 px-4 sm:px-6 lg:px-8 border-t border-app-border bg-app-bg">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-5 tracking-tight text-app-text leading-tight">
            Build your Instagram content pipeline faster
          </h2>
          <p className="text-base text-app-text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
            A dedicated transcript-first page keeps the user path clear: paste
            link, view full transcript text, and export subtitle files.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="#instagram-transcript-input"
              className="bg-fuchsia-600 text-white px-8 py-4 rounded-xl font-bold text-base hover:bg-fuchsia-700 transition-all shadow-md active:scale-95"
            >
              Start for Free
            </Link>
            <Link
              href="/pricing"
              className="ui-link-arrow text-sm font-bold px-4"
            >
              <span>View Plans</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-7 flex items-center justify-center gap-4 text-xs text-app-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              No credit card for preview
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-emerald-500" />
              Fast export workflow
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
