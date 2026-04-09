"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  AlertCircle,
  Copy,
  CreditCard,
  Download,
  Link as LinkIcon,
  Loader2,
} from "lucide-react";
import {
  FacebookTranscriptApiError,
  getFacebookDirectLink,
  getFacebookTranscriptInfo,
  getFacebookTaskStatus,
  type FacebookContentPayload,
  type FacebookDirectLinkPayload,
  type FacebookInfoPayload,
} from "@/lib/facebook-transcript-api";
import { parseKieTranscriptResult } from "@/lib/kie-word-segments";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { FacebookIcon } from "@/components/shared/social-icons";

const EXAMPLE_FACEBOOK_URL = "https://www.facebook.com/watch/?v=1256476318892918";
const KIE_POLL_MAX_ROUNDS = 12;
const KIE_POLL_INTERVAL_MS = 1200;

type TranscriptSegment = { start: number; end: number; text: string };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
    : `${minutes}:${String(secs).padStart(2, "0")}`;
}

function formatSrtTime(seconds: number): string {
  const safe = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const secs = Math.floor(safe % 60);
  const millis = Math.floor((safe - Math.floor(safe)) * 1000);
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")},${String(millis).padStart(3, "0")}`;
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

function toTxt(segments: TranscriptSegment[], withTimestamp: boolean): string {
  if (withTimestamp) {
    return segments.map((s) => `[${formatTimestamp(s.start)}] ${s.text}`.trim()).join("\n");
  }
  return segments.map((s) => s.text).join("\n");
}

function normalizeKieLanguage(raw?: string): string {
  const value = (raw || "").trim().toLowerCase();
  return value.startsWith("en") ? "en" : value || "en";
}

function buildKieTranscriptContent(
  directPayload: FacebookDirectLinkPayload,
  infoPayload: FacebookInfoPayload
): FacebookContentPayload | null {
  const kie = directPayload.kie;
  if (!kie?.submitted || kie.state !== "success") return null;
  const parsedKie = parseKieTranscriptResult(kie.result, kie.transcript_text);
  const transcriptText = parsedKie.transcriptText;
  // 如果任务成功但文字为空，也返回有效 content
  const segments: TranscriptSegment[] =
    parsedKie.segments.length > 0
      ? parsedKie.segments
      : [{ start: 0, end: 0, text: transcriptText || "" }];
  return {
    ok: true,
    platform: "facebook",
    lang_used: normalizeKieLanguage(parsedKie.languageCode),
    source: "asr",
    video: {
      title: directPayload.video.title || infoPayload.video.title,
      thumbnail: directPayload.video.thumbnail || infoPayload.video.thumbnail,
    },
    content: {
      segments,
      full_text: transcriptText,
      line_count: segments.length,
      char_count: transcriptText.length,
    },
  };
}

function getKieErrorMessage(payload: FacebookDirectLinkPayload): string {
  const message = payload.kie?.error?.message;
  if (message) return "Transcription failed. Please retry later.";
  if (payload.kie?.state && payload.kie.state !== "success") return "Transcription is still processing. Please retry.";
  return "Transcription is not available for this video right now.";
}

export default function FacebookTranscriptTool() {
  const { user } = useAuth();
  const [url, setUrl] = useState("");
  const [submittedUrl, setSubmittedUrl] = useState("");
  const [info, setInfo] = useState<FacebookInfoPayload | null>(null);
  const [directLink, setDirectLink] = useState<FacebookDirectLinkPayload | null>(null);
  const [content, setContent] = useState<FacebookContentPayload | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pendingAutoRetryUrl, setPendingAutoRetryUrl] = useState("");
  const [isAutoRetryingAfterLogin, setIsAutoRetryingAfterLogin] =
    useState(false);
  const [errorCode, setErrorCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [showTimestamps, setShowTimestamps] = useState(true);

  const resultRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function submitUrl(nextUrl: string) {
    const raw = nextUrl.trim();
    if (!raw || (!raw.includes("facebook.com") && !raw.includes("fb.watch"))) {
      setErrorCode("INVALID_URL");
      setErrorMessage("Please paste a valid Facebook video link.");
      return;
    }
    setIsSubmitting(true);
    setErrorMessage("");
    setErrorCode("");
    setInfo(null);
    setDirectLink(null);
    setContent(null);
    setLoadingSeconds(0);

    try {
      const infoPromise = getFacebookTranscriptInfo(raw, "en");
      const directPromise = getFacebookDirectLink(raw);
      const infoPayload = await infoPromise;
      setInfo(infoPayload);
      setSubmittedUrl(raw);

      let latest = await directPromise;
      setDirectLink(latest);
      let kieContent = buildKieTranscriptContent(latest, infoPayload);

      for (let round = 0; !kieContent && round < KIE_POLL_MAX_ROUNDS; round += 1) {
        const kie = latest.kie;
        if (kie?.state === "success" || kie?.state === "fail" || kie?.submitted === false || !kie?.task_id) break;
        await sleep(KIE_POLL_INTERVAL_MS);
        const statusPayload = await getFacebookTaskStatus(kie.task_id);
        latest = { ...latest, kie: statusPayload.kie };
        setDirectLink(latest);
        kieContent = buildKieTranscriptContent(latest, infoPayload);
      }

      if (!kieContent) {
        setErrorCode("");
        setErrorMessage(getKieErrorMessage(latest));
        return;
      }
      setContent(kieContent);
    } catch (error) {
      if (error instanceof FacebookTranscriptApiError) {
        setErrorCode(error.code || "");
        if (error.code === "LOGIN_REQUIRED") {
          setIsLoginModalOpen(true);
          if (!user && raw) {
            setPendingAutoRetryUrl(raw);
          }
        }
      } else {
        setErrorCode("");
      }
      setErrorMessage(error instanceof Error ? error.message : "Failed to process Facebook URL.");
    } finally {
      setIsSubmitting(false);
    }
  }

  useEffect(() => {
    if (!isSubmitting) return;
    const ticker = window.setInterval(() => setLoadingSeconds((v) => v + 1), 1000);
    return () => window.clearInterval(ticker);
  }, [isSubmitting]);

  useEffect(() => {
    if (!content) return;
    resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [content]);

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

  const segments = useMemo<TranscriptSegment[]>(() => {
    const raw = content?.content.segments || [];
    const safe = raw
      .map((seg) => ({
        start: Number.isFinite(seg.start) ? seg.start : 0,
        end: Number.isFinite(seg.end) ? seg.end : 0,
        text: (seg.text || "").trim(),
      }))
      .filter((s) => s.text.length > 0);
    if (safe.length) return safe;
    const text = (content?.content.full_text || "").trim();
    return text ? [{ start: 0, end: 0, text }] : [];
  }, [content]);

  const hasReliableTimestamps = useMemo(() => {
    if (segments.length <= 1) {
      return false;
    }
    const starts = segments
      .map((seg) => seg.start)
      .filter((value) => Number.isFinite(value) && value >= 0);
    const uniqueStarts = new Set(starts.map((value) => value.toFixed(2)));
    const hasSequentialRange =
      segments.some((seg) => seg.start > 0 || seg.end > seg.start) &&
      uniqueStarts.size > 1;
    return hasSequentialRange;
  }, [segments]);

  const showTimestampInPreview = showTimestamps && hasReliableTimestamps;
  const transcriptReady = !!content && segments.length > 0 && !isSubmitting;
  const showPreviewLoading = isSubmitting && segments.length === 0;
  const previewText = useMemo(() => {
    if (!segments.length) {
      return "";
    }
    if (!showTimestampInPreview) {
      return segments.map((segment) => segment.text).join("\n");
    }
    return segments
      .map((segment) => `[${formatTimestamp(segment.start)}] ${segment.text}`)
      .join("\n");
  }, [segments, showTimestampInPreview]);
  const thumbnail = info?.video.thumbnail || content?.video?.thumbnail || "";
  const thumbnailProxy = thumbnail
    ? `/api/facebook/transcript/thumbnail?url=${encodeURIComponent(thumbnail)}`
    : "";
  const videoTitle = info?.video.title || content?.video?.title || "Facebook Transcript";
  const directVideoUrl = directLink?.direct_link?.recommended_url || info?.video.direct_media_url || "";
  const sourceLabel = directLink?.kie?.state === "success" ? "Transcription ready" : "Transcription pending";

  function downloadFile(name: string, data: string, type: string) {
    const blob = new Blob([data], { type });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(href);
  }

  return (
    <>
      <div className="w-full max-w-6xl">
        <form className="ui-tool-form mb-4 w-full" onSubmit={(e) => { e.preventDefault(); void submitUrl(url); }}>
          <div className="ui-input-shell rounded-2xl border-cyan-300/60 bg-gradient-to-br from-white to-cyan-50/40 p-2.5">
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 opacity-80" />
                <input
                  ref={inputRef}
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste Facebook video link..."
                  className="h-12 w-full rounded-xl border-none bg-transparent pl-10 pr-4 text-sm font-semibold outline-none"
                />
              </div>
              <button type="submit" disabled={isSubmitting} className="ui-generate-btn h-12 rounded-xl px-6 text-sm font-bold disabled:opacity-60">
                {isSubmitting ? "Processing..." : "Generate Transcript"}
              </button>
            </div>
          </div>
        </form>

        <div className="mb-5 flex items-center justify-between rounded-xl border border-app-border bg-app-surface px-3 py-2.5 text-xs text-app-text-muted">
          <span className="font-medium">Paste once and we handle fetch + transcription.</span>
          <button type="button" onClick={() => setUrl(EXAMPLE_FACEBOOK_URL)} className="rounded-md px-2 py-1 font-semibold text-cyan-600 transition-colors hover:bg-cyan-50">
            Use example URL
          </button>
        </div>

        {isSubmitting ? (
          <div className="mb-5 rounded-xl border border-cyan-300/60 bg-cyan-50/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-cyan-700">
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating transcript...
            </div>
            <div className="mt-1 text-xs text-cyan-700/80">Generating transcript... Running for {loadingSeconds}s.</div>
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mb-5 rounded-2xl border-2 border-rose-300 bg-rose-50 px-4 py-4 text-rose-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-4 w-4" />
              <div>
                <p className="text-sm font-semibold leading-relaxed">
                  {errorMessage}
                </p>
                {errorCode === "INSUFFICIENT_CREDITS" ? (
                  <div className="mt-3">
                    <a
                      href={`/pricing?plan=payg_150&from=insufficient_credits&returnUrl=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname + window.location.search : "")}`}
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
          <div ref={resultRef} className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-sm">
            <div className="grid gap-5 p-5 lg:grid-cols-[260px_minmax(0,1fr)]">
              <aside className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-app-border bg-app-bg shadow-sm">
                  {thumbnailProxy ? (
                    <Image src={thumbnailProxy} alt={videoTitle} width={540} height={960} unoptimized className="aspect-[9/16] w-full object-cover" />
                  ) : (
                    <div className="flex aspect-[9/16] w-full items-center justify-center text-app-text-muted">
                      <FacebookIcon className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="space-y-2 rounded-xl border border-app-border bg-app-bg px-3 py-3 text-[11px] text-app-text-muted">
                  <div className="rounded-md bg-app-surface px-2 py-1.5">Source: <span className="font-semibold text-app-text">{sourceLabel}</span></div>
                  {submittedUrl ? <a href={submittedUrl} target="_blank" rel="noreferrer" className="ui-btn-secondary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-semibold">Open Facebook Page</a> : null}
                  {directVideoUrl ? <a href={directVideoUrl} target="_blank" rel="noreferrer" className="ui-btn-primary inline-flex h-8 w-full items-center justify-center rounded-md px-2 text-[11px] font-bold">Download Source Video</a> : null}
                </div>
              </aside>

              <main>
                <div className="mb-5 rounded-xl border border-app-border bg-app-bg/70 p-3">
                  <div className="mb-1.5 flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1877F2] text-white">
                      <FacebookIcon className="h-5 w-5" />
                    </div>
                  </div>
                  <h3 className="line-clamp-2 text-xl font-bold leading-tight text-app-text sm:text-[1.65rem]">{videoTitle}</h3>
                  <p className="text-sm font-medium text-app-text-muted">Auto-detected language: {content?.lang_used || "en"}</p>
                </div>

                <div className="mb-5 rounded-xl border border-app-border bg-app-bg/70 p-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-app-text-muted">Export subtitle file</p>
                  <div className="grid gap-2 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
                    <button type="button" onClick={() => downloadFile("facebook.srt", toSrt(segments), "application/x-subrip;charset=utf-8")} disabled={!transcriptReady} className="ui-btn-primary inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold disabled:opacity-45"><Download className="h-3.5 w-3.5" />SRT (Recommended)</button>
                    <button type="button" onClick={() => downloadFile("facebook.txt", toTxt(segments, true), "text/plain;charset=utf-8")} disabled={!transcriptReady} className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:opacity-45"><Download className="h-3.5 w-3.5" />TXT (TS)</button>
                    <button type="button" onClick={() => downloadFile("facebook_plain.txt", toTxt(segments, false), "text/plain;charset=utf-8")} disabled={!transcriptReady} className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:opacity-45"><Download className="h-3.5 w-3.5" />TXT</button>
                    <button type="button" onClick={async () => { if (!previewText) return; await navigator.clipboard.writeText(previewText); setCopied(true); setTimeout(() => setCopied(false), 1200); }} disabled={!transcriptReady} className="ui-btn-secondary inline-flex h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-semibold disabled:opacity-45"><Copy className="h-3.5 w-3.5" />{copied ? "Copied" : "Copy"}</button>
                  </div>
                </div>

                <div className="rounded-xl border border-app-border bg-app-bg/60 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                      Preview - {content?.content.line_count || 0} lines -{" "}
                      {content?.content.char_count || 0} chars
                    </p>
                    {hasReliableTimestamps ? (
                      <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-app-text-muted">
                        <input
                          type="checkbox"
                          checked={showTimestamps}
                          onChange={(event) =>
                            setShowTimestamps(event.target.checked)
                          }
                          className="h-3.5 w-3.5 rounded border-app-border text-app-accent focus:ring-app-accent"
                        />
                        Show timestamps
                      </label>
                    ) : null}
                  </div>
                  <div className="min-h-[180px]">
                    {segments.length > 0 ? (
                      <div className="space-y-2.5">
                        {segments.map((segment, idx) => (
                          <div
                            key={`${idx}-${segment.start}`}
                            className={`grid items-start gap-2.5 ${showTimestampInPreview
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
                        ))}
                      </div>
                    ) : showPreviewLoading ? (
                      <div className="rounded-lg border border-cyan-200/70 bg-cyan-50/80 px-4 py-3 text-base text-cyan-800">
                        <span className="inline-flex items-center gap-2 font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Transcription is in progress, please wait...
                        </span>
                      </div>
                    ) : (
                      <div className="rounded-lg border border-app-border bg-app-surface px-4 py-3 text-base text-app-text-muted">No transcript preview available.</div>
                    )}
                  </div>
                </div>
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
