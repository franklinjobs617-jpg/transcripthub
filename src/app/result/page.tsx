import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock3, Copy, FileText, Sparkles } from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Transcript Result - Preview, Copy, and Export",
  description:
    "View transcript results, copy text, and continue to full export workflow for TikTok, Instagram, and Facebook videos.",
  keywords: [
    "transcript result",
    "transcript preview",
    "copy transcript",
    "export srt",
  ],
  alternates: {
    canonical: "/result",
  },
};

export default function ResultPage() {
  return (
    <PageShell
      eyebrow="Transcript Result"
      title="Your transcript result is ready to review"
      description="Use this step to preview content quality, copy useful lines, and continue to full export."
      primaryCta={{ href: "/tiktok-transcript", label: "Open Transcript Tool" }}
      secondaryCta={{ href: "/pricing", label: "View Export Plans" }}
    >
      <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <article className="ui-card bg-app-surface p-6 sm:p-7">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-cyan-600 dark:text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Preview
          </div>
          <h2 className="text-xl font-bold text-app-text">Transcript Preview</h2>
          <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
            This page is the standard completion step after generation. If you reached this
            route directly, open one of the transcript tools and submit a video URL first.
          </p>
          <div className="mt-5 space-y-3">
            {[
              "Paste a supported URL from TikTok, Instagram, or Facebook.",
              "Generate transcript and review initial quality output.",
              "Copy content directly or continue to subtitle export.",
            ].map((line) => (
              <div
                key={line}
                className="flex items-start gap-2 rounded-lg border border-app-border bg-app-bg px-3 py-2.5 text-sm text-app-text"
              >
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                <span>{line}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className="space-y-4">
          <article className="ui-card bg-app-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-app-text">
              <Copy className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              Copy Workflow
            </h3>
            <p className="mt-2 text-sm text-app-text-muted">
              Copy clean transcript lines and move directly into content repurposing.
            </p>
          </article>
          <article className="ui-card bg-app-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-app-text">
              <FileText className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              Export Workflow
            </h3>
            <p className="mt-2 text-sm text-app-text-muted">
              Export subtitle-friendly files such as SRT and TXT for publishing or editing.
            </p>
          </article>
          <article className="ui-card bg-app-surface p-5">
            <h3 className="flex items-center gap-2 text-sm font-bold text-app-text">
              <Clock3 className="h-4 w-4 text-cyan-600 dark:text-cyan-300" />
              Typical Processing
            </h3>
            <p className="mt-2 text-sm text-app-text-muted">
              Most short videos complete quickly. Longer clips can take more time based on load.
            </p>
          </article>
          <Link
            href="/instagram-transcript"
            className="ui-btn-secondary inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-bold"
          >
            Try Instagram Transcript
          </Link>
        </aside>
      </div>
    </PageShell>
  );
}

