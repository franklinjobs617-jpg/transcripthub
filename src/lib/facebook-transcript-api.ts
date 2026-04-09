import { getStoredAuthToken } from "@/lib/auth-session";

export type FacebookApiError = {
  code: string;
  message: string;
  details?: unknown;
};

type ErrorPayload = {
  ok: false;
  error: FacebookApiError;
};

type TranscriptApiErrorInit = {
  code?: string;
  status?: number;
  details?: unknown;
};

export class FacebookTranscriptApiError extends Error {
  readonly code?: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(message: string, init: TranscriptApiErrorInit = {}) {
    super(message);
    this.name = "FacebookTranscriptApiError";
    this.code = init.code;
    this.status = init.status;
    this.details = init.details;
  }
}

export type FacebookInfoPayload = {
  ok: true;
  platform: "facebook";
  video: {
    id?: string;
    title?: string;
    thumbnail?: string;
    duration?: number;
    uploader?: string;
    webpage_url?: string;
    direct_media_url?: string;
    direct_media_format_id?: string;
    direct_media_ext?: string;
    direct_media_expires_at?: number;
    direct_media_source?: string;
  };
  subtitle: {
    available: boolean;
    languages: Array<{
      code: string;
      label: string;
      source: "manual" | "automatic";
    }>;
    default_lang: string;
    fallback_order: string[];
  };
  media_probe?: {
    audio_only_available: boolean;
    direct_download_candidate: {
      kind: "audio_only" | "video_with_audio";
      ext?: string;
      format_id?: string;
      filesize?: number;
      tbr?: number;
      abr?: number;
    } | null;
  };
};

export type FacebookDirectLinkPayload = {
  ok: true;
  platform: "facebook";
  source: "yt_dlp_cli";
  video: {
    id?: string;
    title?: string;
    thumbnail?: string;
    duration?: number;
    uploader?: string;
    webpage_url?: string;
  };
  direct_link: {
    recommended_url?: string;
    hq_url?: string;
    audio_url?: string;
    audio_only_url?: string;
    play_url?: string;
    download_url?: string;
    direct_media_source?: string;
    direct_media_expires_at?: number;
  };
  fla_ai_input_url?: string;
  kie?: {
    enabled?: boolean;
    submitted?: boolean;
    task_id?: string;
    record_id?: string;
    state?: string;
    transcript_text?: string;
    result?: unknown;
    error?: {
      code?: string;
      message?: string;
      details?: unknown;
    };
  };
  debug?: Record<string, unknown>;
};

export type FacebookContentPayload = {
  ok: true;
  platform: "facebook";
  lang_used: string;
  source: "raw" | "asr" | "audio_extracted";
  asr_provider?: "huggingface" | "openai";
  video?: {
    title?: string;
    thumbnail?: string;
  };
  content: {
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
    full_text: string;
    line_count: number;
    char_count: number;
  };
};

function toFriendlyMessage(code?: string, fallback?: string): string {
  const map: Record<string, string> = {
    INVALID_URL: "Please paste a valid Facebook video link.",
    UNSUPPORTED_PLATFORM: "Please use a Facebook video link.",
    PRIVATE_OR_LOGIN_REQUIRED: "This Facebook video is private or requires login.",
    GEO_RESTRICTED: "This video is not available in your region.",
    VIDEO_UNAVAILABLE: "We couldn't open this Facebook video right now.",
    NO_SUBTITLE: "No built-in subtitles found. We'll try speech transcription.",
    LANG_NOT_AVAILABLE: "This language track is not available for the current video.",
    SUBTITLE_FETCH_FAILED: "We couldn't fetch subtitle content for this video.",
    ASR_MEDIA_UNAVAILABLE: "We couldn't access media for transcription. Please try another public video.",
    ASR_MEDIA_TOO_LARGE: "This video is too long for instant transcription. Please try a shorter clip.",
    ASR_NOT_CONFIGURED: "Transcription service is temporarily unavailable. Please try again soon.",
    ASR_FAILED: "We couldn't transcribe this video this time. Please retry or try a shorter clip.",
    LOGIN_REQUIRED: "Free guest limit reached. Please sign in to continue.",
    INSUFFICIENT_CREDITS: "Your credits are currently insufficient. Please top up and try again.",
    RATE_LIMITED: "Too many requests right now. Please wait a moment and retry.",
    PERMISSION_DENIED: "Your account does not have permission for this action right now.",
    ENTITLEMENT_REQUIRED: "Please upgrade your plan or top up credits to continue.",
    INTERNAL_ERROR: "Something went wrong. Please try again.",
  };

  if (code && map[code]) {
    return map[code];
  }
  return fallback || "Unable to complete this request right now.";
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ErrorPayload;

  if (!response.ok || (data as ErrorPayload).ok === false) {
    const errorData = data as ErrorPayload;
    const code = errorData?.error?.code;
    const message = toFriendlyMessage(code, errorData?.error?.message);
    throw new FacebookTranscriptApiError(message, {
      code,
      status: response.status,
      details: errorData?.error?.details,
    });
  }

  return data as T;
}

export async function getFacebookTranscriptInfo(url: string, preferredLang?: string) {
  const token = getStoredAuthToken();
  const response = await fetch("/api/facebook/transcript/info", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      url,
      preferred_lang: preferredLang,
    }),
  });

  return parseJsonResponse<FacebookInfoPayload>(response);
}

export async function getFacebookTranscriptContent(url: string, lang?: string) {
  const token = getStoredAuthToken();
  const response = await fetch("/api/facebook/transcript/content", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      url,
      lang,
    }),
  });

  return parseJsonResponse<FacebookContentPayload>(response);
}

export async function getFacebookDirectLink(url: string) {
  const token = getStoredAuthToken();
  const response = await fetch("/api/facebook/transcript/direct-link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      url,
    }),
  });

  return parseJsonResponse<FacebookDirectLinkPayload>(response);
}

export function buildFacebookDownloadUrl(
  url: string,
  lang: string,
  type: "srt" | "txt" | "vtt"
) {
  const params = new URLSearchParams({
    url,
    lang,
    type,
  });

  return `/api/facebook/transcript/download?${params.toString()}`;
}

export async function getFacebookTaskStatus(taskId: string) {
  const token = getStoredAuthToken();
  const response = await fetch(`/api/facebook/transcript/task-status?task_id=${taskId}`, {
    method: "GET",
    headers: {
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
  });

  return parseJsonResponse<{ ok: true; task_id: string; kie: FacebookDirectLinkPayload["kie"] }>(response);
}

