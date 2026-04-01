"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Copy,
  Download,
  Languages,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";

import {
  getTikTokDirectLink,
  getTikTokTranscriptInfo,
  TikTokTranscriptApiError,
  type TikTokContentPayload,
  type TikTokDirectLinkPayload,
  type TikTokInfoPayload,
} from "@/lib/tiktok-transcript-api";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { TikTokIcon } from "@/components/shared/social-icons";

const EXAMPLE_TIKTOK_URL =
  "https://www.tiktok.com/@fddxjbf/video/7613766437814930718?is_from_webapp=1&sender_device=pc";

const LOADING_STEPS = [
  "Validating URL",
  "Fetching video",
  "Extracting audio",
  "Generating transcript",
] as const;
const KIE_POLL_MAX_ROUNDS = 12;
const KIE_POLL_INTERVAL_MS = 3000;

type TranscriptSegment = {
  start: number;
  end: number;
  text: string;
};

function validateTikTokUrl(url: string): string | null {
  const trimmed = url.trim();
  if (!trimmed) {
    return "Please paste a TikTok video URL.";
  }
  if (!trimmed.includes("tiktok.com")) {
    return "Only TikTok links are supported in this tool.";
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
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatSrtTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
}

function formatVttTime(seconds: number): string {
  const safe = Math.max(0, seconds || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}.${String(millis).padStart(3, "0")}`;
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

function splitLongTextIntoParagraphs(text: string, maxChars = 220): string[] {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) {
    return [];
  }

  const sentences = clean
    .split(/(?<=[.!?。！？])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  if (sentences.length <= 1) {
    const chunks: string[] = [];
    let cursor = 0;
    while (cursor < clean.length) {
      chunks.push(clean.slice(cursor, cursor + maxChars).trim());
      cursor += maxChars;
    }
    return chunks.filter(Boolean);
  }

  const chunks: string[] = [];
  let current = "";
  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }
    if ((current + " " + sentence).length <= maxChars) {
      current = `${current} ${sentence}`;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }
  if (current) {
    chunks.push(current);
  }
  return chunks;
}

function normalizeKieLanguage(raw?: string): string {
  const value = (raw || "").trim().toLowerCase();
  if (!value) return "en";
  if (value.startsWith("en")) return "en";
  return value;
}

function buildKieTranscriptContent(
  directPayload: TikTokDirectLinkPayload,
  infoPayload: TikTokInfoPayload
): TikTokContentPayload | null {
  const kie = directPayload.kie;
  if (!kie || !kie.submitted || kie.state !== "success") {
    return null;
  }

  const resultObject =
    (kie.result as { resultObject?: { language_code?: string } } | undefined)
      ?.resultObject || {};
  const transcriptText = String(kie.transcript_text || "").trim();
  if (!transcriptText) {
    return null;
  }

  const segments: TranscriptSegment[] = [
    { start: 0, end: 0, text: transcriptText },
  ];
  return {
    ok: true,
    platform: "tiktok",
    lang_used: normalizeKieLanguage(resultObject.language_code),
    source: "asr",
    asr_provider: "none",
    transcript_available: true,
    asr_error: null,
    asr_trace: kie.result,
    debug_steps: [],
    video: {
      id: directPayload.video.id || infoPayload.video.id,
      title: directPayload.video.title || infoPayload.video.title,
      thumbnail: directPayload.video.thumbnail || infoPayload.video.thumbnail,
      duration: directPayload.video.duration || infoPayload.video.duration,
      uploader: directPayload.video.uploader || infoPayload.video.uploader,
      webpage_url:
        directPayload.video.webpage_url || infoPayload.video.webpage_url,
      direct_media_url:
        directPayload.direct_link?.recommended_url ||
        infoPayload.video.direct_media_url,
      direct_media_expires_at:
        directPayload.direct_link?.direct_media_expires_at ||
        infoPayload.video.direct_media_expires_at,
      direct_media_source:
        directPayload.direct_link?.direct_media_source ||
        infoPayload.video.direct_media_source,
      worker_media_url:
        directPayload.direct_link?.worker_media_url ||
        infoPayload.video.worker_media_url,
    },
    content: {
      segments,
      full_text: transcriptText,
      line_count: 1,
      char_count: transcriptText.length,
    },
  };
}

function getKieErrorMessage(payload: TikTokDirectLinkPayload): string {
  const kie = payload.kie;
  const details = kie?.error?.details as
    | {
        code?: number;
        msg?: string;
        details?: { msg?: string; payload?: { msg?: string; code?: number } };
        payload?: { msg?: string; code?: number };
      }
    | undefined;
  const code =
    Number(details?.code) ||
    Number(details?.details?.payload?.code) ||
    Number((details?.payload as { code?: number } | undefined)?.code) ||
    0;
  if (code === 402) {
    return "Credits insufficient. Please top up and retry.";
  }
  const nestedMessage =
    details?.msg ||
    details?.details?.msg ||
    details?.payload?.msg ||
    details?.details?.payload?.msg;
  if (nestedMessage && nestedMessage.trim()) {
    return "Transcription failed. Please retry later.";
  }
  const detailMessage = kie?.error?.message;
  if (detailMessage) {
    return "Transcription failed. Please retry later.";
  }
  if (kie?.state && kie.state !== "success") {
    return "Transcription is still processing. Please retry.";
  }
  return "Transcription is not available for this video right now.";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export default function TikTokTranscriptTool() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [selectedLang, setSelectedLang] = useState("en");
  const [info, setInfo] = useState<TikTokInfoPayload | null>(null);
  const [content, setContent] = useState<TikTokContentPayload | null>(null);
  const [directLink, setDirectLink] = useState<TikTokDirectLinkPayload | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const [thumbnailLoadFailed, setThumbnailLoadFailed] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAutoRetryUrl, setPendingAutoRetryUrl] = useState("");
  const [isAutoRetryingAfterLogin, setIsAutoRetryingAfterLogin] =
    useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [showTimestamps, setShowTimestamps] = useState(true);
  const [loadingStepIndex, setLoadingStepIndex] = useState(0);
  const [loadingSeconds, setLoadingSeconds] = useState(0);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const errorCardRef = useRef<HTMLDivElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);
  const autoStartedUrlRef = useRef("");

  const isBusy = isSubmitting;
  const canSubmit = !isBusy;

  async function submitUrl(nextUrl: string) {
    const cleanUrl = nextUrl.trim();
    const inputError = validateTikTokUrl(nextUrl);
    if (inputError) {
      setErrorCode("INVALID_URL");
      setErrorMessage(inputError);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    setErrorCode("");
    setInfo(null);
    setContent(null);
    setDirectLink(null);
    setLoadingStepIndex(0);
    setLoadingSeconds(0);

    try {
      const infoPayload = await getTikTokTranscriptInfo(cleanUrl, "en");
      setLoadingStepIndex(1);
      setInfo(infoPayload);
      setSubmittedUrl(cleanUrl);

      const initialLang =
        infoPayload.subtitle.default_lang ||
        infoPayload.subtitle.languages[0]?.code ||
        "en";
      setSelectedLang(initialLang);

      setLoadingStepIndex(2);
      let latestPayload = await getTikTokDirectLink(cleanUrl);
      setDirectLink(latestPayload);
      let kieContent = buildKieTranscriptContent(latestPayload, infoPayload);

      for (
        let round = 0;
        !kieContent && round < KIE_POLL_MAX_ROUNDS;
        round += 1
      ) {
        const kie = latestPayload.kie;
        if (kie?.state === "fail" || kie?.submitted === false) {
          break;
        }
        setLoadingStepIndex(3);
        await sleep(KIE_POLL_INTERVAL_MS);
        latestPayload = await getTikTokDirectLink(cleanUrl);
        setDirectLink(latestPayload);
        kieContent = buildKieTranscriptContent(latestPayload, infoPayload);
      }

      if (!kieContent) {
        setContent(null);
        setErrorCode("");
        setErrorMessage(getKieErrorMessage(latestPayload));
        return;
      }
      setSelectedLang(kieContent.lang_used || initialLang);
      setContent(kieContent);
      setLoadingStepIndex(3);
    } catch (error) {
      if (error instanceof TikTokTranscriptApiError) {
        setErrorCode(error.code || "");
        if (error.code === "LOGIN_REQUIRED") {
          setIsLoginModalOpen(true);
          if (!user && cleanUrl) {
            setPendingAutoRetryUrl(cleanUrl);
          }
        }
      } else {
        setErrorCode("");
      }
      const message =
        error instanceof Error
          ? error.message
          : "Failed to process TikTok URL.";
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (
      !user ||
      !pendingAutoRetryUrl ||
      isSubmitting ||
      isAutoRetryingAfterLogin
    ) {
      return;
    }
    const retryUrl = pendingAutoRetryUrl;
    setPendingAutoRetryUrl("");
    setIsAutoRetryingAfterLogin(true);
    setIsLoginModalOpen(false);
    setErrorMessage("");
    setErrorCode("");
    void submitUrl(retryUrl).finally(() => {
      setIsAutoRetryingAfterLogin(false);
    });
  }, [user, pendingAutoRetryUrl, isSubmitting, isAutoRetryingAfterLogin]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await submitUrl(url);
  }

  async function handleLanguageChange(nextLang: string) {
    setSelectedLang(nextLang);
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

  const hasReliableTimestamps = useMemo(() => {
    if (normalizedSegments.length <= 1) {
      return false;
    }
    const starts = normalizedSegments
      .map((seg) => seg.start)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const uniqueStarts = new Set(starts.map((value) => value.toFixed(2)));
    const hasSequentialRange =
      normalizedSegments.some((seg) => seg.start > 0 || seg.end > seg.start) &&
      uniqueStarts.size > 1;
    return hasSequentialRange;
  }, [normalizedSegments]);

  const previewSegments = useMemo<TranscriptSegment[]>(() => {
    if (normalizedSegments.length !== 1) {
      return normalizedSegments;
    }
    const only = normalizedSegments[0];
    if (hasReliableTimestamps || only.text.length < 380) {
      return normalizedSegments;
    }
    return splitLongTextIntoParagraphs(only.text).map((item) => ({
      start: 0,
      end: 0,
      text: item,
    }));
  }, [normalizedSegments, hasReliableTimestamps]);

  const showTimestampInPreview = showTimestamps && hasReliableTimestamps;
  const isParagraphMode = !hasReliableTimestamps && previewSegments.length > 1;

  const previewText = useMemo(() => {
    if (!previewSegments.length) {
      return "";
    }
    if (!showTimestampInPreview) {
      return previewSegments.map((seg) => seg.text).join("\n");
    }
    return previewSegments
      .map((seg) => `[${formatTimestamp(seg.start)}] ${seg.text}`)
      .join("\n");
  }, [previewSegments, showTimestampInPreview]);

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

  function triggerDownload(
    fileName: string,
    contentText: string,
    mimeType: string
  ) {
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

    const baseName = sanitizeFileName(
      content.video?.title || "tiktok_transcript"
    );
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
    if (!errorMessage) {
      return;
    }
    errorCardRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
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

  const thumbnailUrl = info?.video.thumbnail || content?.video?.thumbnail || "";
  const thumbnailProxyUrl = thumbnailUrl
    ? `/api/tiktok/transcript/thumbnail?url=${encodeURIComponent(thumbnailUrl)}`
    : "";
  const directLinkRecommendedUrl =
    directLink?.direct_link?.recommended_url || "";
  const directMediaUrl =
    directLinkRecommendedUrl ||
    info?.video.direct_media_url ||
    content?.video?.direct_media_url ||
    "";
  const effectiveMediaUrl = directMediaUrl;
  const downloadSourceUrl = directMediaUrl;
  const webpageUrl =
    info?.video.webpage_url ||
    content?.video?.webpage_url ||
    submittedUrl ||
    "";
  const directMediaExpiresAt =
    directLink?.direct_link?.direct_media_expires_at ||
    info?.video.direct_media_expires_at ||
    content?.video?.direct_media_expires_at ||
    null;
  const directMediaSource =
    directLink?.source ||
    directLink?.direct_link?.direct_media_source ||
    info?.video.direct_media_source ||
    content?.video?.direct_media_source ||
    "";
  const effectiveMediaHost = useMemo(() => {
    if (!effectiveMediaUrl) {
      return "";
    }
    try {
      return new URL(effectiveMediaUrl).host;
    } catch {
      return "";
    }
  }, [effectiveMediaUrl]);
  const kieState = String(directLink?.kie?.state || "").toLowerCase();
  const kieSubmitted = directLink?.kie?.submitted === true;
  const kiePending =
    kieSubmitted &&
    !!kieState &&
    kieState !== "success" &&
    kieState !== "fail";
  const sourceLabel =
    directLink?.kie?.state === "success"
      ? "Transcription ready"
      : "Transcription pending";
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
  const languageOptions =
    info?.subtitle.languages.length && info.subtitle.languages.length > 0
      ? info.subtitle.languages
      : [{ code: "en", label: "English", source: "automatic" as const }];
  useEffect(() => {
    setThumbnailLoadFailed(false);
  }, [thumbnailUrl]);
  const isTranscriptUnavailable = content?.transcript_available === false;
  const isFailurePlaceholder =
    (content?.content.full_text || "").trim().toLowerCase() ===
      "audio extracted successfully. transcription failed." ||
    (content?.content.full_text || "").trim().toLowerCase() ===
      "audio extracted successfully.";
  const loadingStatusText = isSubmitting
    ? "Fetching metadata and generating transcript..."
    : "Transcript ready";
  const shouldLimitPreviewHeight =
    previewSegments.length > 6 || previewText.length > 1500;
  const showPreviewLoading =
    (isSubmitting || kiePending) &&
    previewSegments.length === 0 &&
    !errorMessage;
  const transcriptReady =
    !isBusy &&
    !!content &&
    !isTranscriptUnavailable &&
    !isFailurePlaceholder &&
    previewSegments.length > 0 &&
    (content.content.char_count || 0) > 0;
  const directLinkLikelyBrowserBlocked =
    effectiveMediaHost.includes("webapp-prime");
  const canDownloadSourceVideo = !!downloadSourceUrl;

  return (
    <>
      <div className="w-full max-w-6xl">
      <form className="ui-tool-form mb-4 w-full" onSubmit={handleSubmit}>
        <div className="ui-input-shell rounded-2xl border-cyan-300/60 bg-gradient-to-br from-white to-cyan-50/40 p-2.5 dark:border-cyan-900/50 dark:from-zinc-950 dark:to-cyan-950/20">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <LinkIcon className="ui-input-icon absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-80" />
              <input
                ref={urlInputRef}
                type="url"
                required
                value={url}
                onChange={(event) => setUrl(event.target.value)}
                placeholder="Paste TikTok video link..."
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
        <span className="font-medium">
          Paste once and we handle fetch + transcription automatically.
        </span>
        <button
          type="button"
          onClick={() => setUrl(EXAMPLE_TIKTOK_URL)}
          className="rounded-md px-2 py-1 font-semibold text-cyan-600 transition-colors hover:bg-cyan-50 hover:text-cyan-500 dark:text-cyan-300 dark:hover:bg-cyan-900/30 dark:hover:text-cyan-200"
        >
          Use example URL
        </button>
      </div>

      {isBusy ? (
        <div className="mb-5 rounded-xl border border-cyan-300/60 bg-cyan-50/80 px-4 py-3 dark:border-cyan-800/50 dark:bg-cyan-950/30">
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700 dark:text-cyan-200">
            <Loader2 className="h-4 w-4 animate-spin" />
            {LOADING_STEPS[loadingStepIndex]}...
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-cyan-100/90 dark:bg-cyan-900/40">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-fuchsia-500 transition-all duration-300"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
          <div className="mt-1 text-xs text-cyan-700/80 dark:text-cyan-300/80">
            {loadingStatusText} Running for {loadingSeconds}s.
          </div>
        </div>
      ) : null}

      {errorMessage ? (
        <div
          ref={errorCardRef}
          className="mb-5 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-4 text-rose-800 shadow-sm dark:border-rose-700/70 dark:bg-rose-950/35 dark:text-rose-200"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700 dark:bg-rose-900/45 dark:text-rose-300">
              <AlertCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-wide text-rose-700/90 dark:text-rose-300/90">
                Processing failed
              </p>
              <p className="mt-1 text-sm font-semibold leading-relaxed">
                {errorMessage}
              </p>
              {errorCode === "INSUFFICIENT_CREDITS" ? (
                <div className="mt-3">
                  <a
                    href="/billing"
                    className="ui-btn-primary inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Top up credits
                  </a>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {info ? (
        <div
          ref={resultRef}
          className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm"
        >
          <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-3">
              <div className="overflow-hidden rounded-xl border border-app-border bg-app-bg shadow-sm">
                {thumbnailProxyUrl && !thumbnailLoadFailed ? (
                  <Image
                    src={thumbnailProxyUrl}
                    alt={info.video.title || "TikTok thumbnail"}
                    width={540}
                    height={960}
                    unoptimized
                    className="aspect-[9/16] w-full object-cover"
                    onError={() => setThumbnailLoadFailed(true)}
                  />
                ) : (
                  <div className="flex aspect-[9/16] w-full items-center justify-center text-app-text-muted">
                    <TikTokIcon className="h-6 w-6" />
                  </div>
                )}
              </div>
              <div className="space-y-2 rounded-xl border border-app-border bg-app-bg px-3 py-3 text-[11px] text-app-text-muted">
                <div className="rounded-md bg-app-surface px-2 py-1.5">
                  Source:{" "}
                  <span className="font-semibold text-app-text">
                    {sourceLabel}
                  </span>
                </div>
                {webpageUrl ? (
                  <a
                    href={webpageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ui-btn-secondary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-semibold"
                  >
                    Open TikTok Page
                  </a>
                ) : null}
                {downloadSourceUrl && canDownloadSourceVideo ? (
                  <a
                    href={downloadSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ui-btn-primary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-bold"
                  >
                    Download Source Video
                  </a>
                ) : null}
                {downloadSourceUrl && !canDownloadSourceVideo ? (
                  <button
                    type="button"
                    disabled
                    className="ui-btn-primary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    Download Source Video
                  </button>
                ) : null}
                {directLinkLikelyBrowserBlocked ? (
                  <p className="rounded-md border border-amber-300/70 bg-amber-50 px-2 py-1.5 text-[10px] leading-relaxed text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200">
                    This direct URL may fail in browser due TikTok anti-hotlink
                    policy.
                  </p>
                ) : null}
              </div>
            </aside>

            <main>
              <div className="mb-5 rounded-xl border border-app-border bg-app-bg/70 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">
                    <TikTokIcon className="h-5 w-5" />
                  </div>
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight text-app-text sm:text-[1.65rem]">
                    {info.video.title || "TikTok Transcript"}
                  </h3>
                </div>
                <p className="text-sm font-medium text-app-text-muted">
                  Auto-detected language:{" "}
                  {content?.lang_used || selectedLang || "en"}
                </p>
              </div>

              <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-app-border bg-app-bg/70 p-3">
                <label className="relative inline-flex items-center">
                  <Languages className="pointer-events-none absolute left-2 h-3.5 w-3.5 text-app-text-muted" />
                  <select
                    value={selectedLang}
                    onChange={(event) =>
                      void handleLanguageChange(event.target.value)
                    }
                    disabled={isBusy}
                    className="h-9 rounded-md border border-app-border bg-app-surface pl-7 pr-2 text-xs font-semibold text-app-text outline-none transition-colors hover:border-app-text-muted/50 focus:border-cyan-500 disabled:opacity-60"
                  >
                    {languageOptions.map((item) => (
                      <option
                        key={`${item.code}-${item.source}`}
                        value={item.code}
                      >
                        {item.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setShowTimestamps((prev) => !prev)}
                  disabled={
                    isBusy || !transcriptReady || !hasReliableTimestamps
                  }
                  className="inline-flex h-9 items-center rounded-md border border-app-border bg-app-surface px-3 text-xs font-semibold text-app-text transition-colors hover:bg-app-bg disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {hasReliableTimestamps
                    ? showTimestamps
                      ? "Hide timestamps"
                      : "Show timestamps"
                    : "No native timestamps"}
                </button>

                <button
                  type="button"
                  onClick={handleCopyPreview}
                  disabled={!transcriptReady || !previewText}
                  className="ui-btn-primary inline-flex h-9 items-center gap-1.5 rounded-md px-3 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {copied ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
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
                    disabled={!transcriptReady || !normalizedSegments.length}
                    className="ui-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-3.5 w-3.5" />
                    SRT (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("vtt")}
                    disabled={!transcriptReady || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-3.5 w-3.5" />
                    VTT
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("txt_ts")}
                    disabled={!transcriptReady || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-3.5 w-3.5" />
                    TXT (TS)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownload("txt_plain")}
                    disabled={!transcriptReady || !normalizedSegments.length}
                    className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    <Download className="h-3.5 w-3.5" />
                    TXT
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-app-border bg-app-bg/60 p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-app-text-muted">
                  Preview - {content?.content.line_count || 0} lines -{" "}
                  {content?.content.char_count || 0} chars
                </p>
                {isParagraphMode ? (
                  <div className="mb-3 rounded-lg border border-cyan-200/70 bg-cyan-50 px-3 py-2 text-xs font-medium text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/35 dark:text-cyan-100">
                    Native timestamps are unavailable for this transcript. We
                    switched to readable paragraph mode.
                  </div>
                ) : null}
                <div className="relative min-h-[180px]">
                  <div
                    className={`space-y-2.5 ${
                      shouldLimitPreviewHeight
                        ? "max-h-[460px] overflow-y-auto pr-1"
                        : ""
                    }`}
                  >
                    {isTranscriptUnavailable && isFailurePlaceholder ? (
                      <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-base text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200">
                        No usable subtitles were generated for this video yet.
                        Click <span className="font-bold">Refresh</span> to
                        retry.
                      </div>
                    ) : previewSegments.length > 0 ? (
                      previewSegments.map((segment, idx) => (
                        <div
                          key={`${segment.start}-${idx}`}
                          className={`grid items-start gap-2.5 ${
                            showTimestampInPreview
                              ? "grid-cols-[86px_minmax(0,1fr)]"
                              : "grid-cols-1"
                          }`}
                        >
                          {showTimestampInPreview ? (
                            <span className="pt-2 text-sm font-extrabold tabular-nums text-cyan-600 dark:text-cyan-300">
                              {formatTimestamp(segment.start)}
                            </span>
                          ) : null}
                          <div className="rounded-lg border border-app-border bg-app-surface px-4 py-3 text-[1.04rem] font-medium leading-8 text-app-text">
                            {segment.text}
                          </div>
                        </div>
                      ))
                    ) : showPreviewLoading ? (
                      <div className="rounded-lg border border-cyan-200/70 bg-cyan-50/80 px-4 py-3 text-base text-cyan-800 dark:border-cyan-800/60 dark:bg-cyan-950/35 dark:text-cyan-200">
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Transcription in progress, please wait...
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-app-border bg-app-surface px-4 py-3 text-base text-app-text-muted">
                        No transcript preview available.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {content?.transcript_available === false && content.asr_error ? (
                <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-700/60 dark:bg-amber-950/35 dark:text-amber-200">
                  <span className="font-bold">Transcription failed:</span>{" "}
                  {content.asr_error.message}
                </div>
              ) : null}
            </main>
          </div>
        </div>
      ) : null}
      </div>
      {isLoginModalOpen ? (
        <GoogleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      ) : null}
    </>
  );
}
