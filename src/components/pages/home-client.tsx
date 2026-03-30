"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { RealImageCard } from "@/components/shared/real-image-card";
import {
  Link as LinkIcon,
  Zap,
  Clock,
  ShieldCheck,
  CheckCircle2,
  ChevronRight,
  Wand2,
  ArrowRight,
  Loader2,
  FileText,
  PlaySquare,
  Sparkles,
  Users,
  Briefcase,
  Megaphone,
  XCircle,
  Check,
  MousePointerClick,
  MonitorPlay,
  Share2,
} from "lucide-react";

// 鑷畾涔夌ぞ浜ゅ獟浣撳浘鏍?
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
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
const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
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
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

function normalizeInputUrl(raw: string): string {
  const value = raw.trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  return `https://${value}`;
}

function detectTranscriptPath(raw: string): string | null {
  const normalized = normalizeInputUrl(raw);
  if (!normalized) {
    return null;
  }

  let host = "";
  try {
    host = new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }

  if (host.includes("tiktok.com")) {
    return "/tiktok-transcript";
  }
  if (host.includes("instagram.com")) {
    return "/instagram-transcript";
  }
  if (host.includes("facebook.com") || host.includes("fb.watch")) {
    return "/facebook-transcript";
  }
  return null;
}

export function HomeClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "creators" | "marketers" | "agencies"
  >("creators");
  const [heroUrl, setHeroUrl] = useState("");
  const [heroError, setHeroError] = useState("");
  const [isRouting, setIsRouting] = useState(false);

  function handleHeroSubmit(event: React.FormEvent<HTMLFormElement>) {
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

  // 涓夊ぇ Hub 椤甸潰閰嶇疆
  const hubs = [
    {
      id: "ig",
      name: "Instagram Transcript",
      slug: "instagram-transcript",
      icon: InstagramIcon,
      iconWrapClass:
        "bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white border-white/20 shadow-[0_10px_24px_-12px_rgba(221,42,123,0.75)]",
      benefitClass: "text-[#dd2a7b] dark:text-[#ff73bd]",
      cardClass:
        "bg-gradient-to-b from-[#fff3f9] to-app-surface dark:from-[#28141f] dark:to-app-surface",
      barClass: "bg-gradient-to-r from-[#f58529] via-[#dd2a7b] to-[#8134af]",
      desc: "Instantly extract scripts from Instagram Reels and Videos. High accuracy AI optimized for fast-paced viral content.",
      benefit: "Best for Reels repurposing",
      stats: "900% YoY Growth",
      ctaLabel: "Open Instagram Transcript Tool",
    },
    {
      id: "tt",
      name: "TikTok Script Extractor",
      slug: "tiktok-transcript",
      icon: TikTokIcon,
      iconWrapClass:
        "bg-black text-white border-cyan-400/20 shadow-[0_10px_24px_-12px_rgba(34,211,238,0.65)]",
      benefitClass: "text-cyan-600 dark:text-cyan-300",
      cardClass:
        "bg-gradient-to-b from-cyan-50 to-app-surface dark:from-[#10242e] dark:to-app-surface",
      barClass: "bg-gradient-to-r from-cyan-400 via-blue-500 to-fuchsia-500",
      desc: "Decode viral TikToks into structured text. Perfect for analyzing hooks, CTAs, and storytelling frameworks.",
      benefit: "Creator workflow ready",
      stats: "Used by 10k+ Creators",
      ctaLabel: "Open TikTok Transcript Tool",
    },
    {
      id: "fb",
      name: "Facebook Video to Text",
      slug: "facebook-transcript",
      icon: FacebookIcon,
      iconWrapClass:
        "bg-[#1877F2] text-white border-blue-300/30 shadow-[0_10px_24px_-12px_rgba(24,119,242,0.65)]",
      benefitClass: "text-[#1877F2] dark:text-blue-300",
      cardClass:
        "bg-gradient-to-b from-blue-50 to-app-surface dark:from-[#10213f] dark:to-app-surface",
      barClass: "bg-gradient-to-r from-blue-500 via-[#1877F2] to-cyan-500",
      desc: "Convert Facebook video speech into clean, editable captions. Save hours of manual transcription for FB long-form.",
      benefit: "Enterprise level accuracy",
      stats: "Ultra low KD Blue Ocean",
      ctaLabel: "Open Facebook Transcript Tool",
    },
  ];

  const useCasesData = {
    creators: {
      title: "For Content Creators",
      desc: "Repurpose your viral TikToks or IG Reels into Twitter threads, blog posts, and newsletter content without re-watching them 10 times.",
      icon: Users,
      points: [
        "Extract exact hooks and CTAs",
        "Save 5+ hours weekly on manual typing",
        "Perfect for cross-platform posting",
      ],
    },
    marketers: {
      title: "For Marketers",
      desc: "Analyze competitor ads and viral organic content. Extract their exact scripts to build your own high-converting swipe file.",
      icon: Megaphone,
      points: [
        "Decode competitor video scripts",
        "Create better ad briefs for influencers",
        "Generate SEO articles from video",
      ],
    },
    agencies: {
      title: "For Creative Agencies",
      desc: "Standardize your captioning and summarization workflow. Export clean SRTs to speed up your video editing pipeline.",
      icon: Briefcase,
      points: [
        "Export accurate SRT subtitles",
        "Bulk process client videos",
        "Client-ready text formatting",
      ],
    },
  };

  const useCaseVisuals = {
    creators: {
      label: "Creator Workflow",
      gradient: "from-fuchsia-500/18 via-purple-500/14 to-orange-400/14",
      metric: "3x Faster Repurpose",
      outputs: ["Hook Library", "Caption Draft", "Thread Outline"],
    },
    marketers: {
      label: "Marketing Intelligence",
      gradient: "from-cyan-500/18 via-blue-500/14 to-fuchsia-500/12",
      metric: "2.4x Better Brief Speed",
      outputs: ["Competitor Script", "Ad Brief", "SEO Angle"],
    },
    agencies: {
      label: "Agency Delivery",
      gradient: "from-emerald-500/16 via-cyan-500/14 to-blue-500/14",
      metric: "60% Less Manual Ops",
      outputs: ["SRT Package", "Client Summary", "Revision Notes"],
    },
  };

  const activeVisual = useCaseVisuals[activeTab];

  const homeFaqs = [
    {
      q: "Is it really free to start?",
      a: "Yes. You can generate a 1-minute transcript preview for any supported video link without creating an account.",
    },
    {
      q: "How many videos can I transcribe?",
      a: "Free users can do unlimited previews. Pro users get 100 Credits per month, where 1 Credit equals 3 minutes of transcription.",
    },
    {
      q: "Which formats can I export?",
      a: "Pro users can export transcripts as clean Text, PDF, and SRT subtitle files.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: homeFaqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <main className="flex flex-col items-center overflow-hidden bg-[radial-gradient(900px_420px_at_65%_10%,rgba(56,189,248,0.12),transparent_60%),radial-gradient(760px_380px_at_25%_12%,rgba(236,72,153,0.10),transparent_58%)]">
      {/* === SEO Structured Data (JSON-LD) === */}
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
              "AI-powered video transcript generator for TikTok, Instagram, and Facebook.",
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: "4.9",
              ratingCount: "1200",
            },
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            url: "https://transcripthub.com",
            potentialAction: {
              "@type": "SearchAction",
              target: {
                "@type": "EntryPoint",
                urlTemplate:
                  "https://transcripthub.com/?url={search_term_string}",
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

      <section
        id="hero"
        className="w-full px-4 pt-16 pb-12 sm:pt-24 sm:pb-24 lg:px-8 max-w-7xl relative mx-auto"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative w-full max-w-4xl flex flex-col items-center">

            <div className="relative mb-10 w-full flex flex-col items-center">

              <div className="absolute -top-12 right-0 sm:right-4 lg:right-10 h-24 w-24 sm:h-28 sm:w-28 z-20">
                <div className="ui-float absolute left-0 top-9 h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] border border-white/20 bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] shadow-lg flex items-center justify-center text-white -rotate-3">
                  <InstagramIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ui-float ui-float-delay-2 absolute right-0 top-0 h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] border border-cyan-400/20 bg-black shadow-lg flex items-center justify-center text-white scale-110 z-10">
                  <TikTokIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="ui-float ui-float-delay-1 absolute right-5 bottom-0 h-10 w-10 sm:h-12 sm:w-12 rounded-[1rem] border border-blue-400/20 bg-[#1877F2] shadow-lg flex items-center justify-center text-white rotate-3">
                  <FacebookIcon className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>

              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.04] text-app-text">
                <span className="block">AI Transcript Generator</span>
                <span className="block">for</span>
              </h1>

              {/* 浼樺寲鍚庣殑 Any Social Video 寰芥爣 (鍙傝€?Leadverse 鐨?What You Offer) */}
              <div className="mt-4 sm:mt-5">
                <span className="relative inline-flex max-w-full items-center justify-center rounded-[1.2rem] border border-cyan-300/45 bg-app-surface px-5 py-2.5 sm:px-9 sm:py-3 shadow-[0_12px_28px_-18px_rgba(34,211,238,0.30)]">
                  <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-r from-cyan-500/5 via-fuchsia-500/5 to-blue-500/5" />
                  <span className="relative bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-blue-500 bg-clip-text text-transparent font-black text-[clamp(2.2rem,7vw,5.1rem)] tracking-[-0.02em] leading-none sm:whitespace-nowrap">
                    Any Social Video
                  </span>
                </span>
              </div>
            </div>

            {/* 鍓爣棰?*/}
            <p className="text-lg sm:text-xl text-app-text-muted mb-10 max-w-2xl leading-relaxed font-medium mx-auto">
              This Video Transcript Generator helps creators and marketers convert TikTok,
              Instagram, and Facebook videos into readable scripts quickly and clearly.
            </p>

            {/* 琛ㄥ崟 */}
            <form
              onSubmit={handleHeroSubmit}
              className="ui-tool-form mx-auto w-full max-w-[580px] ui-input-shell group flex flex-col gap-3 rounded-2xl p-2 sm:flex-row border border-cyan-300/30 dark:border-cyan-500/30 shadow-lg shadow-cyan-500/5 bg-app-surface/60 transition-all hover:border-cyan-400/50 hover:shadow-cyan-500/10"
            >
              <div className="relative flex-1">
                <LinkIcon className="ui-input-icon absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-cyan-500" />
                <input
                  type="url"
                  required
                  value={heroUrl}
                  onChange={(event) => {
                    setHeroUrl(event.target.value);
                    if (heroError) {
                      setHeroError("");
                    }
                  }}
                  placeholder="Paste TikTok / Instagram / Facebook URL"
                  className="ui-tool-input h-14 w-full rounded-xl pl-12 pr-4 text-base font-medium bg-transparent border-none outline-none focus:ring-0 placeholder:text-app-text-muted/60"
                />
              </div>
              <button
                type="submit"
                disabled={isRouting}
                className="ui-tool-submit group relative flex h-14 sm:h-auto items-center justify-center gap-2 rounded-xl px-8 text-base font-bold text-app-primary-foreground bg-app-primary hover:bg-app-primary/90 shadow-md transition-all whitespace-nowrap"
              >
                {isRouting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirecting...
                  </>
                ) : (
                  <>
                    Find Transcripts <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {heroError ? (
              <p className="mt-3 text-sm font-semibold text-rose-600 dark:text-rose-300">
                {heroError}
              </p>
            ) : null}

            <div className="mt-5 flex justify-center flex-wrap items-center gap-6 text-[13px] font-bold text-app-text-muted opacity-80">
              No charge today · Cancel anytime · Free previews
            </div>

            <div className="mt-12 flex justify-center items-center gap-2 text-xs font-semibold text-app-text-muted uppercase tracking-wider bg-app-bg px-4 py-2 rounded-full border border-app-border/40">
              <Users className="h-4 w-4 text-cyan-500" /> Join 4,000+ businesses and freelancers
            </div>
          </div>
        </div>
   
      </section>

      {/* === 2. 涓夊ぇ Hub 瑙ｅ喅鏂规鍏ュ彛 (SEO 鏍稿績) === */}
      <section
        id="hubs"
        className="w-full py-24 bg-gradient-to-b from-app-surface via-app-bg to-app-surface border-y border-app-border px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-app-text mb-4">
              Optimized for Every Platform
            </h2>
            <p className="text-lg text-app-text-muted">
              Dedicated transcription engines tailored for specific social media
              content formats.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {hubs.map((hub) => {
              const Icon = hub.icon;
              return (
                <Link
                  key={hub.id}
                  href={`/${hub.slug}`}
                  className={`ui-card ui-card-hover group relative overflow-hidden p-8 flex flex-col items-start text-left ${hub.cardClass}`}
                >
                  <div
                    className={`absolute inset-x-0 top-0 h-1.5 ${hub.barClass}`}
                  />
                  {/* 淇鍚庣殑鍥炬爣瀹瑰櫒 */}
                  <div
                    className={`h-14 w-14 rounded-2xl border flex items-center justify-center mb-6 transition-all ${hub.iconWrapClass}`}
                  >
                    <Icon className="h-7 w-7" />
                  </div>

                  <div
                    className={`text-xs font-bold uppercase tracking-widest mb-2 ${hub.benefitClass}`}
                  >
                    {hub.benefit}
                  </div>
                  <h3 className="text-2xl font-bold mb-4 text-app-text">
                    {hub.name}
                  </h3>
                  <p className="text-app-text-muted text-sm leading-relaxed mb-6 flex-grow">
                    {hub.desc}
                  </p>

                  <div className="flex items-center justify-between w-full pt-6 border-t border-app-border">
                    <span className="text-xs font-medium text-app-text-muted">
                      {hub.stats}
                    </span>
                    <span className="flex items-center text-sm font-bold text-app-text group-hover:text-app-primary transition-colors">
                      {hub.ctaLabel}{" "}
                      <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* === 3. Before vs After 鍖哄潡 (浠峰€奸敋鐐? === */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-app-text mb-6">
              Stop manually typing scripts. <br /> Let AI do the heavy lifting.
            </h2>
            <p className="text-lg text-app-text-muted mb-10 leading-relaxed">
              Traditional transcription is slow and painful. Transcripthub
              automates the entire flow, giving you clean, structured text ready
              for repurposing in seconds.
            </p>
            <div className="space-y-4">
              {[
                "AI-driven paragraph structuring",
                "High-accuracy punctuation engine",
                "Bulk processing for agencies",
                "SRT & PDF export ready",
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 font-semibold text-app-text"
                >
                  <div className="h-6 w-6 rounded-full bg-app-success-soft flex items-center justify-center text-app-success">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-4">
            <div className="ui-card p-6 border-app-danger-soft bg-app-danger-soft/10 text-app-text-muted flex gap-4 opacity-70">
              <XCircle className="h-6 w-6 text-app-danger shrink-0" />
              <div>
                <p className="font-bold text-app-danger mb-1">The Old Way</p>
                <p className="text-sm italic">
                  Re-watching video 5x, typing manually, making typos, wasting
                  20 mins per post.
                </p>
              </div>
            </div>
            <div className="ui-card p-8 border-app-primary shadow-2xl bg-app-surface flex gap-4 transform lg:translate-x-6">
              <CheckCircle2 className="h-8 w-8 text-app-primary shrink-0" />
              <div>
                <p className="font-bold text-app-primary text-xl mb-1">
                  Transcripthub Way
                </p>
                <p className="text-app-text font-medium leading-relaxed">
                  Paste URL, wait 15s, 1-click copy. Instant content repurposing
                  for TikTok, IG, and Twitter.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === 4. Use Case Tabs (鍔ㄦ€佷氦浜? === */}
      <section
        id="use-cases"
        className="w-full bg-app-bg border-y border-app-border py-24 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Built for Content Teams</h2>
            <p className="text-app-text-muted">
              Scale your content creation without scaling your headcount.
            </p>
          </div>
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="flex flex-row lg:flex-col gap-2 w-full lg:w-1/3 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide">
              {(
                Object.keys(useCasesData) as Array<keyof typeof useCasesData>
              ).map((key) => {
                const TabIcon = useCasesData[key].icon;
                return (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`ui-tab-trigger flex w-full items-center gap-4 rounded-2xl px-6 py-5 text-left font-bold ${activeTab === key ? "ui-tab-trigger-active" : ""
                      }`}
                  >
                    <TabIcon
                      className={`h-5 w-5 ${activeTab === key ? "text-app-primary" : "opacity-50"
                        }`}
                    />
                    {useCasesData[key].title}
                  </button>
                );
              })}
            </div>
            <div className="ui-card p-10 w-full lg:w-2/3 bg-app-surface animate-in fade-in slide-in-from-right-4 duration-500">
              {(() => {
                const ActiveIcon = useCasesData[activeTab].icon;
                return (
                  <ActiveIcon className="h-10 w-10 text-app-primary mb-6" />
                );
              })()}
              <h3 className="text-3xl font-bold mb-4">
                {useCasesData[activeTab].title}
              </h3>
              <p className="text-lg text-app-text-muted mb-8 leading-relaxed">
                {useCasesData[activeTab].desc}
              </p>
              <div className="mb-8 grid gap-4 sm:grid-cols-2">
                <div
                  className={`rounded-2xl border border-app-border p-4 bg-gradient-to-br ${activeVisual.gradient} dark:from-app-primary-soft/40 dark:via-app-primary-soft/20 dark:to-transparent`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
                      {activeVisual.label}
                    </span>
                    <PlaySquare className="h-4 w-4 text-app-text-muted" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-2 rounded-full bg-app-surface/70 dark:bg-app-bg/70">
                      <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
                    </div>
                    <div className="h-2 rounded-full bg-app-surface/70 dark:bg-app-bg/70">
                      <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
                    </div>
                    <div className="h-2 rounded-full bg-app-surface/70 dark:bg-app-bg/70">
                      <div className="h-full w-[54%] rounded-full bg-gradient-to-r from-orange-400 to-fuchsia-500" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af] text-white shadow-sm">
                      <InstagramIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-black text-cyan-400 shadow-sm">
                      <TikTokIcon className="h-3.5 w-3.5" />
                    </span>
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#1877F2] text-white shadow-sm">
                      <FacebookIcon className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-bg p-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-app-text-muted">
                    Output Bundle
                  </p>
                  <div className="space-y-2">
                    {activeVisual.outputs.map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-2 rounded-lg border border-app-border bg-app-surface px-2.5 py-2 text-xs font-semibold text-app-text"
                      >
                        <span className="h-2 w-2 rounded-full bg-gradient-to-r from-cyan-500 to-fuchsia-500" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-lg border border-app-border bg-app-surface px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    {activeVisual.metric}
                  </div>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {useCasesData[activeTab].points.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 font-semibold text-app-text text-sm"
                  >
                    <Check className="h-4 w-4 text-app-success" /> {p}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* === 5. SEO 闀挎枃鍐呭鍖哄潡 (澧炲姞椤甸潰鏉冮噸) === */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h2 className="text-3xl font-bold mb-8">
            Why use an AI Transcript Generator for Social Media?
          </h2>
          <div className="ui-card mb-8 rounded-2xl bg-app-surface p-6 not-prose">
            <h3 className="text-xl font-bold text-app-text">What is a Video Transcript Generator?</h3>
            <p className="mt-3 text-sm leading-relaxed text-app-text-muted">
              A Video Transcript Generator is a tool that converts spoken audio into readable text so
              teams can publish faster, repurpose content, and improve accessibility. Transcripthub is
              an AI Transcript Generator built for social workflows, with dedicated pages for{" "}
              <Link href="/instagram-transcript" className="ui-link-arrow font-bold">
                Instagram transcript extraction
              </Link>
              ,{" "}
              <Link href="/tiktok-transcript" className="ui-link-arrow font-bold">
                TikTok transcript generation
              </Link>
              , and{" "}
              <Link href="/facebook-transcript" className="ui-link-arrow font-bold">
                Facebook video-to-text conversion
              </Link>
              .
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-10">
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-app-primary" /> Boost
                Productivity
              </h3>
              <p className="text-app-text-muted text-sm leading-relaxed">
                Manually transcribing a 60-second TikTok can take up to 15
                minutes. With Transcripthub, you can convert video to text in
                under 20 seconds. This allows creator teams to focus on strategy
                rather than clerical work.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <MonitorPlay className="h-5 w-5 text-app-primary" /> Better SEO
                & Accessibility
              </h3>
              <p className="text-app-text-muted text-sm leading-relaxed">
                Adding transcripts to your video captions or blog posts
                significantly improves your search engine rankings and ensures
                your content is accessible to the hearing impaired or those
                watching without sound.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <Share2 className="h-5 w-5 text-app-primary" /> Repurpose Like a
                Pro
              </h3>
              <p className="text-app-text-muted text-sm leading-relaxed">
                Turn your best Instagram Reels scripts into viral Twitter
                threads, Linkedin posts, or high-converting email newsletters.
                One video, ten pieces of content.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                <FileText className="h-5 w-5 text-app-primary" /> Accurate SRT
                Export
              </h3>
              <p className="text-app-text-muted text-sm leading-relaxed">
                Our Pro plans allow you to export transcripts as SRT files. You
                can upload these directly to Adobe Premiere Pro, Final Cut, or
                YouTube for perfect subtitle timing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* === 6. FAQ 鍖哄潡 === */}
      <section
        id="faq"
        className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-app-border"
      >
        <h2 className="text-3xl font-bold text-center mb-12">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {homeFaqs.map((faq) => (
            <details
              key={faq.q}
              className="group ui-card bg-app-surface p-6 open:bg-app-bg transition-colors cursor-pointer"
            >
              <summary className="flex font-semibold justify-between items-center text-lg outline-none marker:content-none text-app-text select-none">
                {faq.q}
                <span className="ml-4 flex h-6 w-6 items-center justify-center rounded-full bg-app-border text-app-text-muted group-open:bg-app-text group-open:text-app-surface transition-colors shrink-0">
                  +
                </span>
              </summary>
              <p className="mt-4 text-app-text-muted leading-relaxed animate-in fade-in duration-300">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="w-full py-24 px-4 text-center">
        <div className="mx-auto max-w-5xl rounded-[2.5rem] bg-app-text px-6 py-20 text-app-surface shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none">
            <Zap className="h-64 w-64 text-app-surface" />
          </div>
          <div className="relative z-10">
            <h2 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-8">
              Ready to automate your <br /> content workflow?
            </h2>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="ui-inverse-cta-btn h-16 rounded-2xl px-10 text-lg font-bold !text-slate-900 dark:!text-slate-900 opacity-100"
              style={{ color: "#0f172a" }}
            >
              Start Extracting Now - Free
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
