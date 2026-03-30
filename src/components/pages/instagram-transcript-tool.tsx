"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  Languages,
  Link as LinkIcon,
  Loader2,
  Sparkles,
  Video,
} from "lucide-react";

import {
  getInstagramTranscriptContent,
  getInstagramTranscriptInfo,
  type InstagramContentPayload,
  type InstagramInfoPayload,
} from "@/lib/instagram-transcript-api";

const EXAMPLE_INSTAGRAM_URL =
  "https://www.instagram.com/reel/Cw4z2h3o6jL/";

const LOADING_STEPS = [
  "Validating URL",
  "Fetching video",
  "Extracting audio",
  "Generating transcript",
] as const;

type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

function validateInstagramUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Please paste an Instagram video link.";
  }
  if (!trimmed.includes("instagram.com")) {
    return "Only Instagram links are supported in this tool.";
  }
  return null;
}

function formatTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }
  const total = Math.floor(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatSrtTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function formatVttTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
}

function toTimestampedTxt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`.trim())
    .join("\n");
}

function toPlainTxt(segments: TranscriptSegment[]): string {
  return segments.map((seg) => seg.text).join("\n");
}

function toSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, index) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end > seg.start ? seg.end : seg.start + 2);
      return `${index + 1}\n${start} --> ${end}\n${seg.text}`;
    })
    .join("\n\n");
}

function toVtt(segments: TranscriptSegment[]): string {
  const body = segments
    .map((seg) => {
      const start = formatVttTime(seg.start);
      const end = formatVttTime(seg.end > seg.start ? seg.end : seg.start + 2);
      return `${start} --> ${end}\n${seg.text}`;
    })
    .join("\n\n");
  return `WEBVTT\n\n${body}`;
}

function sanitizeFileName(input: string): string {
  return input
    .replace(/[\\/:*?"<>|]+/g, "_")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .slice(0, 80);
}

export default function InstagramTranscriptTool() {
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [info, setInfo] = useState<InstagramInfoPayload | null>(null);
  const [content, setContent] = useState<InstagramContentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const errorCardRef = useRef<HTMLDivElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const autoStartedUrlRef = useRef("");

  const isBusy = isSubmitting || isLoadingContent;
  const canSubmit = !isBusy;

  async function loadContent(targetUrl: string, lang: string) {
    setIsLoadingContent(true);
    setErrorMessage("");
    try {
      const payload = await getInstagramTranscriptContent(targetUrl, lang);
      setSelectedLang(payload.lang_used || lang);
      setContent(payload);
      return payload;
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load transcript content.";
      setErrorMessage(message);
      setContent(null);
      return null;
    } finally {
      setIsLoadingContent(false);
    }
  }

  async function submitUrl(nextUrl: string) {
    const inputError = validateInstagramUrl(nextUrl);
    if (inputError) {
      setErrorMessage(inputError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setInfo(null);
    setContent(null);
    setLoadingStepIndex(0);
    setLoadingSeconds(0);

    try {
      const cleanUrl = nextUrl.trim();
      const infoPayload = await getInstagramTranscriptInfo(cleanUrl, "en");
      setLoadingStepIndex(1);
      setInfo(infoPayload);
      setSubmittedUrl(cleanUrl);

      const initialLang =
        infoPayload.subtitle.default_lang ||
        infoPayload.subtitle.languages[0]?.code ||
        "en";
      setSelectedLang(initialLang);
      setLoadingStepIndex(2);
      await loadContent(cleanUrl, initialLang);
      setLoadingStepIndex(3);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to process Instagram URL.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitUrl(url);
  }

  async function handleRefreshLanguage() {
    if (!submittedUrl || !selectedLang) {
      return;
    }
    await loadContent(submittedUrl, selectedLang);
  }

  const normalizedSegments = useMemo<TranscriptSegment[]>(() => {
    const raw = content?.content.segments || [];
    const safe = raw
      .map((seg) => ({
        start: Number.isFinite(seg.start) ? seg.start : 0,
        end: Number.isFinite(seg.end) ? seg.end : 0,
        text: (seg.text || "").trim(),
      }))
      .filter((seg) => seg.text.length > 0);

    if (safe.length > 0) {
      return safe;
    }
    if (content?.content.full_text?.trim()) {
      return [{ start: 0, end: 0, text: content.content.full_text.trim() }];
    }
    return [];
  }, [content]);

  const previewText = useMemo(() => {
    if (!normalizedSegments.length) {
      return "";
    }
    if (!showTimestamps) {
      return normalizedSegments.map((seg) => seg.text).join("\n");
    }
    return normalizedSegments
      .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
      .join("\n");
  }, [normalizedSegments, showTimestamps]);

  async function handleCopyPreview() {
    if (!previewText) {
      return;
    }
    try {
      await navigator.clipboard.writeText(previewText);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      setErrorMessage("Failed to copy transcript preview.");
    }
  }

  function triggerDownload(fileName: string, contentText: string, mimeType: string) {
    const blob = new Blob([contentText], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(blobUrl);
  }

  function handleDownload(type: "srt" | "vtt" | "txt_ts" | "txt_plain") {
    if (!normalizedSegments.length || !content) {
      return;
    }

    const baseName = sanitizeFileName(content.video?.title || "instagram_transcript");
    const lang = content.lang_used || selectedLang || "en";

    if (type === "srt") {
      triggerDownload(
        `${baseName}.${lang}.srt`,
        toSrt(normalizedSegments),
        "application/x-subrip;charset=utf-8"
      );
      return;
    }
    if (type === "vtt") {
      triggerDownload(
        `${baseName}.${lang}.vtt`,
        toVtt(normalizedSegments),
        "text/vtt;charset=utf-8"
      );
      return;
    }
    if (type === "txt_ts") {
      triggerDownload(
        `${baseName}.${lang}.timestamp.txt`,
        toTimestampedTxt(normalizedSegments),
        "text/plain;charset=utf-8"
      );
      return;
    }
    triggerDownload(
      `${baseName}.${lang}.txt`,
      toPlainTxt(normalizedSegments),
      "text/plain;charset=utf-8"
    );
  }

  const thumbnailUrl = info?.video.thumbnail || content?.video?.thumbnail || "";
  const sourceLabel =
    content?.source === "asr"
      ? "AI transcription"
      : content?.source === "audio_extracted"
        ? "Media prepared"
        : "Built-in subtitles";
  const thumbnailProxyUrl = thumbnailUrl
    ? `/api/instagram/transcript/thumbnail?url=${encodeURIComponent(thumbnailUrl)}`
    : "";
  const loadingProgress = isBusy
    ? Math.max(
        12,
        Math.min(
          95,
          Math.round(((loadingStepIndex + 1) / LOADING_STEPS.length) * 100)
        )
      )
    : content
      ? 100
      : 0;
  const loadingStatusText = isSubmitting
    ? "Fetching video metadata and available tracks..."
    : "Generating transcript content...";
  const shouldLimitPreviewHeight = normalizedSegments.length > 6;
  const errorHint = useMemo(() => {
    const text = errorMessage.toLowerCase();
    if (text.includes("temporarily unavailable")) {
      return "Service is busy right now. Retry in 1-2 minutes or use a video with built-in subtitles.";
    }
    if (text.includes("private") || text.includes("login")) {
      return "Use a public video URL that can be accessed without login.";
    }
    return "Check the link, then retry. If it still fails, try another public Instagram video.";
  }, [errorMessage]);
  const languageOptions =
    info?.subtitle.languages.length && info.subtitle.languages.length > 0
      ? info.subtitle.languages
      : [{ code: "en", label: "English", source: "automatic" as const }];

  useEffect(() => {
    if (!isBusy) {
      return;
    }
    const ticker = window.setInterval(() => {
      setLoadingSeconds((prev) => prev + 1);
      setLoadingStepIndex((prev) =>
        prev < LOADING_STEPS.length - 1 ? prev + 1 : prev
      );
    }, 1200);
    return () => window.clearInterval(ticker);
  }, [isBusy]);

  useEffect(() => {
    if (!content) {
      return;
    }
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [content]);

  useEffect(() => {
    setThumbnailLoadFailed(false);
  }, [thumbnailUrl]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    errorCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [errorMessage]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const rawQueryUrl = (
      new URLSearchParams(window.location.search).get("url") || ""
    ).trim();
    if (!rawQueryUrl) {
      return;
    }
    const normalized = /^https?:\/\//i.test(rawQueryUrl)
      ? rawQueryUrl
      : `https://${rawQueryUrl}`;
    if (autoStartedUrlRef.current === normalized) {
      return;
    }
    autoStartedUrlRef.current = normalized;
    setUrl(normalized);
    void submitUrl(normalized);
  }, []);

  return (
    <div className="w-full max-w-6xl">
      <form className="ui-tool-form mb-4 w-full" onSubmit={handleSubmit}>
        <div className="ui-input-shell rounded-2xl border-fuchsia-300/55 bg-gradient-to-br from-white to-fuchsia-50/45 p-2.5 shadow-[0_18px_40px_-30px_rgba(192,38,211,0.45)] dark:border-fuchsia-900/45 dark:from-zinc-950 dark:to-fuchsia-950/20">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon className="ui-input-icon absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-80" />
              <input
                ref={urlInputRef}
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Paste Instagram Reel / video link..."
                className="ui-tool-input h-12 w-full rounded-xl border-none bg-transparent pl-10 pr-4 text-sm font-semibold text-app-text outline-none placeholder:text-app-text-muted/55 focus:ring-0"
              />
            </div>
            <button
              type="submit"
              disabled={!canSubmit}
              className="ui-tool-submit ui-generate-btn h-12 shrink-0 rounded-xl px-6 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[190px]"
            >
              {isBusy ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing...
                </span>
              ) : (
                "Generate Transcript"
              )}
            </button>
          </div>
        </div>
      </form>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-xs text-app-text-muted">
        <span className="font-medium">Paste once and we handle fetch + transcription automatically.</span>
        <button
          type="button"
          onClick={() => setUrl(EXAMPLE_INSTAGRAM_URL)}
          className="rounded-md px-2 py-1 font-semibold text-fuchsia-600 transition-colors hover:bg-fuchsia-50 hover:text-fuchsia-500 dark:text-fuchsia-300 dark:hover:bg-fuchsia-900/30 dark:hover:text-fuchsia-200"
        >
          Use example URL
        </button>
      </div>

      {isBusy ? (
        <div className="mb-5 rounded-xl border border-fuchsia-300/65 bg-fuchsia-50/85 px-4 py-3 dark:border-fuchsia-800/45 dark:bg-fuchsia-950/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {LOADING_STEPS[loadingStepIndex]}...
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-fuchsia-100/95 dark:bg-fuchsia-900/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 via-violet-500 to-orange-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-fuchsia-700/85 dark:text-fuchsia-300/85">
            {loadingStatusText} Running for {loadingSeconds}s.
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          ref={errorCardRef}
          className="mb-5 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-4 text-rose-800 shadow-sm dark:border-rose-700/70 dark:bg-rose-950/35 dark:text-rose-200"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-[220px] flex-1 items-start gap-3">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/45 dark:text-rose-300">
                <AlertCircle className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700/90 dark:text-rose-300/90">
                  Generation failed
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed">{errorMessage}</p>
                <p className="mt-2 text-xs text-rose-700/85 dark:text-rose-300/90">
                  {errorHint}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {info ? (
                <button
                  type="button"
                  onClick={handleRefreshLanguage}
                  disabled={isLoadingContent}
                  className="ui-btn-primary inline-flex h-9 items-center rounded-md px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoadingContent ? "Retrying..." : "Retry"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => urlInputRef.current?.focus()}
                  className="ui-btn-secondary inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold"
                >
                  Edit URL
                </button>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {info ? (
        <div
          ref={resultRef}
          className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-app-border bg-app-bg shadow-sm">
                {thumbnailProxyUrl && !thumbnailLoadFailed ? (
                  <img
                    src={thumbnailProxyUrl}
                    alt={info.video.title || "Instagram thumbnail"}
                    className="aspect-[9/16] w-full object-cover"
                    loading="lazy"
                    onError={() => setThumbnailLoadFailed(true)}
                  />
                ) : (
                  <div className="flex aspect-[9/16] w-full items-center justify-center text-app-text-muted">
                    <Video className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-xl border border-app-border bg-app-bg px-3 py-3 text-[11px] text-app-text-muted">
                <div className="rounded-md bg-app-surface px-2 py-1.5">
                  Source: <span className="font-semibold text-app-text">{sourceLabel}</span>
                </div>
                {submittedUrl ? (
                  <a
                    href={submittedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ui-btn-secondary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-semibold"
                  >
                    Open Instagram Page
                  </a>
                ) : null}
              </div>
            </aside>

            <main>
              <div className="mb-5 rounded-xl border border-app-border bg-app-bg/70 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-600 via-violet-600 to-orange-500 text-white shadow-sm">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight text-app-text sm:text-[1.6rem]">
                    {info.video.title || "Instagram Transcript"}
                  </h3>
                </div>
                <p className="text-sm font-medium text-app-text-muted">
                  Auto-detected language: {content?.lang_used || selectedLang || "en"}
                </p>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-app-border bg-app-bg/70 p-3">
                <label className="relative inline-flex items-center">
                  <Languages className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-app-text-muted" />
                  <select
                    value={selectedLang}
                    onChange={(event) => setSelectedLang(event.target.value)}
                    disabled={isBusy}
                    className="h-9 rounded-md border border-app-border bg-app-surface pl-7 pr-2 text-xs font-semibold text-app-text outline-none transition-colors hover:border-app-text-muted/50 focus:border-fuchsia-500 disabled:opacity-60"
                  >
                    {languageOptions.map((item) => (
                      <option key={`${item.code}-${item.source}`} value={item.code}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={handleRefreshLanguage}
                  disabled={isBusy}
                  className="ui-btn-secondary inline-flex h-9 items-center rounded-md px-3 text-xs font-semibold"
                >
                  {isLoadingContent ? "Updating..." : "Regenerate"}
                </button>

                <button
                  type="button"
                  onClick={() => setShowTimestamps((prev) => !prev)}
                  disabled={isBusy}
                  className="inline-flex h-9 items-center rounded-md border border-app-border bg-app-surface px-3 text-xs font-semibold text-app-text transition-colors hover:bg-app-bg"
                >
                  {showTimestamps ? "Hide timestamps" : "Show timestamps"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  disabled={isBusy || !previewText}
                  className="ui-btn-primary inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold"
                >
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? "Copied" : "Copy transcript"}
                </button>
              </div>

              <div className="mb-5 rounded-xl border border-app-border bg-app-bg/70 p-3">
                <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-text-muted">
                  Export subtitle file
                </p>
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
                  <button
                    type="button"
                    onClick={() => handleDownload("srt")}
                    disabled={isBusy || !normalizedSegments.length}
                    className="ui-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    SRT (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("vtt")}
                    disabled={isBusy || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    VTT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("txt_ts")}
                    disabled={isBusy || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    TXT (TS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("txt_plain")}
                    disabled={isBusy || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold"
                  >
                    <Download className="h-3.5 w-3.5" />
                    TXT
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-app-border bg-app-bg/60 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-app-text-muted">
                  Preview - {content?.content.line_count || 0} lines - {content?.content.char_count || 0} chars
                </p>
                <div className="relative min-h-[180px]">
                  {isLoadingContent ? (
                    <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg border border-fuchsia-200/70 bg-fuchsia-50/80 backdrop-blur-[1px] dark:border-fuchsia-800/60 dark:bg-fuchsia-950/45">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-fuchsia-700 dark:text-fuchsia-200">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating transcript...
                      </span>
                    </div>
                  ) : null}
                  <div
                    className={`space-y-2.5 ${
                      shouldLimitPreviewHeight
                        ? "max-h-[460px] overflow-y-auto pr-1"
                        : ""
                    }`}
                  >
                    {normalizedSegments.length > 0 ? (
                      normalizedSegments.map((segment, idx) => (
                        <div
                          key={`${segment.start}-${idx}`}
                          className={`grid items-start gap-2.5 ${
                            showTimestamps ? "grid-cols-[86px_minmax(0,1fr)]" : "grid-cols-1"
                          }`}
                        >
                          {showTimestamps ? (
                            <span className="pt-2 text-sm font-extrabold tabular-nums text-fuchsia-600 dark:text-fuchsia-300">
                              {formatTimestamp(segment.start)}
                            </span>
                          ) : null}
                          <div className="rounded-lg border border-app-border bg-app-surface px-4 py-3 text-base font-medium leading-8 text-app-text">
                            {segment.text}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-lg border border-app-border bg-app-surface px-4 py-3 text-base text-app-text-muted">
                        No transcript preview available.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      ) : null}
    </div>
  );
}
