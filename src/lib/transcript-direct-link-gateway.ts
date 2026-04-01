import { NextResponse } from "next/server";
import {
  consumeAuthCredits,
  fetchAuthUserByToken,
  getBearerTokenFromHeaders,
} from "@/lib/auth-backend";
import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";
import {
  applyGuestCookie,
  buildCreditIdempotencyKey,
  buildLinkActorIdentity,
  buildLinkKey,
  getChargedCount,
  getGuestDailyLimit,
  getShanghaiDayKey,
  hasChargedLink,
  markLinkCharged,
  resolveGuestIdentity,
} from "@/lib/transcript-link-quota";

type TranscriptPlatform = "tiktok" | "instagram" | "facebook";

type ErrorBody = {
  ok: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

const LOGIN_REQUIRED_MESSAGE = "Free daily limit reached. Please sign in to continue.";
const INSUFFICIENT_CREDITS_MESSAGE = "Your credits are currently insufficient. Please top up and retry.";
const INTERNAL_ERROR_MESSAGE = "Direct-link service is temporarily unavailable. Please retry.";
const RATE_LIMITED_MESSAGE = "Too many requests. Please wait a moment and try again.";
const DIRECT_LINK_IP_RATE_LIMIT_ENABLED =
  (process.env.DIRECT_LINK_IP_RATE_LIMIT_ENABLED || "true").toLowerCase() ===
  "true";
const DIRECT_LINK_IP_WINDOW_SECONDS = Math.max(
  10,
  Number.parseInt(process.env.DIRECT_LINK_IP_WINDOW_SECONDS || "60", 10) || 60
);
const DIRECT_LINK_IP_MAX_REQUESTS_GUEST = Math.max(
  10,
  Number.parseInt(
    process.env.DIRECT_LINK_IP_MAX_REQUESTS_GUEST || "120",
    10
  ) || 120
);
const DIRECT_LINK_IP_MAX_REQUESTS_USER = Math.max(
  20,
  Number.parseInt(
    process.env.DIRECT_LINK_IP_MAX_REQUESTS_USER || "300",
    10
  ) || 300
);
const DIRECT_LINK_RETRY_ATTEMPTS = Math.max(
  1,
  Number.parseInt(process.env.DIRECT_LINK_RETRY_ATTEMPTS || "3", 10) || 3
);
const DIRECT_LINK_RETRY_BASE_DELAY_MS = Math.max(
  100,
  Number.parseInt(process.env.DIRECT_LINK_RETRY_BASE_DELAY_MS || "500", 10) || 500
);
const RETRYABLE_UPSTREAM_ERROR_CODES = new Set([
  "DIRECT_LINK_UNAVAILABLE",
  "VIDEO_UNAVAILABLE",
  "INTERNAL_ERROR",
  "UPSTREAM_TIMEOUT",
  "UPSTREAM_UNAVAILABLE",
  "TIMEOUT",
  "NETWORK_ERROR",
]);

const DIRECT_LINK_KEYS = [
  "recommended_url",
  "hq_url",
  "play_url",
  "download_url",
  "audio_url",
  "audio_only_url",
] as const;

type UpstreamDirectLinkResponse = {
  upstream: Response;
  text: string;
  contentType: string;
  parsedBody: unknown;
};

type IpRateLimitState = {
  count: number;
  resetAtMs: number;
};

const ipRateLimitByKey = new Map<string, IpRateLimitState>();
let lastIpRateSweepAtMs = 0;

function parseJsonSafely(rawText: string): unknown {
  try {
    return JSON.parse(rawText);
  } catch {
    return null;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

function extractErrorCode(payload: unknown): string {
  const rawCode = (payload as { error?: { code?: unknown } } | null)?.error?.code;
  if (typeof rawCode !== "string") return "";
  return rawCode.trim().toUpperCase();
}

function extractAttemptStatus(payload: unknown): string {
  const attempts = (
    payload as {
      error?: {
        details?: {
          attempts?: Array<{ status?: unknown }>;
        };
      };
    } | null
  )?.error?.details?.attempts;
  if (!Array.isArray(attempts) || attempts.length === 0) return "";
  const firstStatus = attempts[0]?.status;
  if (typeof firstStatus !== "string") return "";
  return firstStatus.trim().toLowerCase();
}

function shouldRetryUpstreamResponse(status: number, parsedBody: unknown): boolean {
  if (status >= 500 || status === 429) {
    return true;
  }

  const errorCode = extractErrorCode(parsedBody);
  if (errorCode && RETRYABLE_UPSTREAM_ERROR_CODES.has(errorCode)) {
    return true;
  }

  const attemptStatus = extractAttemptStatus(parsedBody);
  if (attemptStatus === "failed_returncode" || attemptStatus === "timeout") {
    return true;
  }

  return false;
}

async function fetchDirectLinkWithRetry({
  baseUrl,
  platform,
  token,
  bodyText,
}: {
  baseUrl: string;
  platform: TranscriptPlatform;
  token: string | null;
  bodyText: string;
}): Promise<UpstreamDirectLinkResponse> {
  let lastCaughtError: unknown;

  for (let attempt = 0; attempt < DIRECT_LINK_RETRY_ATTEMPTS; attempt += 1) {
    try {
      const upstream = await fetch(`${baseUrl}/api/${platform}/transcript/direct-link`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: bodyText,
        cache: "no-store",
      });

      const text = await upstream.text();
      const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";
      const parsedBody = parseJsonSafely(text);

      const shouldRetry =
        attempt < DIRECT_LINK_RETRY_ATTEMPTS - 1 &&
        shouldRetryUpstreamResponse(upstream.status, parsedBody);

      if (!shouldRetry) {
        return {
          upstream,
          text,
          contentType,
          parsedBody,
        };
      }
    } catch (error) {
      lastCaughtError = error;
      if (attempt >= DIRECT_LINK_RETRY_ATTEMPTS - 1) {
        break;
      }
    }

    if (attempt < DIRECT_LINK_RETRY_ATTEMPTS - 1) {
      const delay = DIRECT_LINK_RETRY_BASE_DELAY_MS * (attempt + 1);
      await sleep(delay);
    }
  }

  throw lastCaughtError ?? new Error("UPSTREAM_RETRY_EXHAUSTED");
}

function buildErrorBody(code: string, message: string, details?: unknown): ErrorBody {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

function normalizeIp(raw: string | null): string {
  if (!raw) return "";
  let value = raw.trim();
  if (!value) return "";

  if (value.includes(",")) {
    value = value.split(",")[0]?.trim() || "";
  }
  if (!value || value.toLowerCase() === "unknown") return "";

  if (value.startsWith("[") && value.includes("]")) {
    value = value.slice(1, value.indexOf("]"));
  }

  const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;
  const matchIpv4Port = value.match(ipv4WithPort);
  if (matchIpv4Port?.[1]) {
    return matchIpv4Port[1];
  }

  return value;
}

function extractClientIp(request: Request): string {
  const headers = request.headers;
  const candidates = [
    headers.get("cf-connecting-ip"),
    headers.get("x-real-ip"),
    headers.get("x-forwarded-for"),
    headers.get("x-client-ip"),
    headers.get("true-client-ip"),
    headers.get("x-cluster-client-ip"),
    headers.get("fastly-client-ip"),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeIp(candidate);
    if (normalized) return normalized;
  }
  return "";
}

function sweepIpRateLimit(nowMs: number): void {
  if (nowMs - lastIpRateSweepAtMs < 30_000) return;
  for (const [key, state] of ipRateLimitByKey.entries()) {
    if (state.resetAtMs <= nowMs) {
      ipRateLimitByKey.delete(key);
    }
  }
  lastIpRateSweepAtMs = nowMs;
}

function consumeIpRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): { limited: boolean; retryAfterSeconds: number } {
  const nowMs = Date.now();
  const windowMs = windowSeconds * 1000;
  sweepIpRateLimit(nowMs);

  const current = ipRateLimitByKey.get(key);
  if (!current || current.resetAtMs <= nowMs) {
    ipRateLimitByKey.set(key, {
      count: 1,
      resetAtMs: nowMs + windowMs,
    });
    return { limited: false, retryAfterSeconds: windowSeconds };
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAtMs - nowMs) / 1000)
    );
    return { limited: true, retryAfterSeconds };
  }

  current.count += 1;
  ipRateLimitByKey.set(key, current);
  return {
    limited: false,
    retryAfterSeconds: Math.max(
      1,
      Math.ceil((current.resetAtMs - nowMs) / 1000)
    ),
  };
}

function extractRequestUrl(bodyText: string): string {
  const payload = parseJsonSafely(bodyText) as { url?: unknown } | null;
  if (!payload || typeof payload.url !== "string") return "";
  return payload.url.trim();
}

function extractVideoId(payload: unknown): string {
  const data = payload as { video?: { id?: unknown } } | null;
  const raw = data?.video?.id;
  if (raw === undefined || raw === null) return "";
  return String(raw).trim();
}

function hasUsableDirectLink(payload: unknown): boolean {
  const data = payload as { ok?: unknown; direct_link?: Record<string, unknown> } | null;
  if (data?.ok !== true) return false;

  const directLink = data?.direct_link;
  if (!directLink || typeof directLink !== "object") return false;

  for (const key of DIRECT_LINK_KEYS) {
    const value = directLink[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return true;
    }
  }
  return false;
}

function withGuestCookie(
  request: Request,
  response: NextResponse,
  guestResolution: ReturnType<typeof resolveGuestIdentity>
): NextResponse {
  applyGuestCookie(response, request, guestResolution);
  return response;
}

function buildLoginRequiredResponse(
  request: Request,
  guestResolution: ReturnType<typeof resolveGuestIdentity>
): NextResponse {
  const response = NextResponse.json(
    buildErrorBody("LOGIN_REQUIRED", LOGIN_REQUIRED_MESSAGE),
    { status: 401 }
  );
  return withGuestCookie(request, response, guestResolution);
}

function buildInsufficientCreditsResponse(
  request: Request,
  guestResolution: ReturnType<typeof resolveGuestIdentity>
): NextResponse {
  const response = NextResponse.json(
    buildErrorBody("INSUFFICIENT_CREDITS", INSUFFICIENT_CREDITS_MESSAGE),
    { status: 402 }
  );
  return withGuestCookie(request, response, guestResolution);
}

function buildInternalErrorResponse(
  request: Request,
  guestResolution: ReturnType<typeof resolveGuestIdentity>,
  details?: unknown
): NextResponse {
  const response = NextResponse.json(
    buildErrorBody("INTERNAL_ERROR", INTERNAL_ERROR_MESSAGE, details),
    { status: 502 }
  );
  return withGuestCookie(request, response, guestResolution);
}

function buildRateLimitedResponse(
  request: Request,
  guestResolution: ReturnType<typeof resolveGuestIdentity>,
  retryAfterSeconds: number
): NextResponse {
  const response = NextResponse.json(
    buildErrorBody("RATE_LIMITED", RATE_LIMITED_MESSAGE, {
      retry_after_seconds: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        "retry-after": String(retryAfterSeconds),
      },
    }
  );
  return withGuestCookie(request, response, guestResolution);
}

export async function handleTranscriptDirectLink(
  request: Request,
  platform: TranscriptPlatform
): Promise<Response> {
  const guestResolution = resolveGuestIdentity(request);
  const token = getBearerTokenFromHeaders(request.headers);
  const authUser = token ? await fetchAuthUserByToken(token) : null;
  const actor = buildLinkActorIdentity(authUser, guestResolution);

  const bodyText = await request.text();
  const requestUrl = extractRequestUrl(bodyText);
  const dayKey = getShanghaiDayKey();
  const guestDailyLimit = getGuestDailyLimit();
  const preLinkKey = buildLinkKey(platform, requestUrl);

  if (actor.actorType === "guest") {
    const currentGuestCount = getChargedCount(actor.actorId, dayKey);
    const isPreChargedByRequestLink = hasChargedLink(
      actor.actorId,
      dayKey,
      preLinkKey
    );
    if (currentGuestCount >= guestDailyLimit && !isPreChargedByRequestLink) {
      return buildLoginRequiredResponse(request, guestResolution);
    }
  }

  if (DIRECT_LINK_IP_RATE_LIMIT_ENABLED) {
    const clientIp = extractClientIp(request);
    if (clientIp) {
      const maxRequests =
        actor.actorType === "guest"
          ? DIRECT_LINK_IP_MAX_REQUESTS_GUEST
          : DIRECT_LINK_IP_MAX_REQUESTS_USER;
      const rateKey =
        actor.actorType === "guest"
          ? `guest_ip:${clientIp}`
          : `user_ip:${actor.actorId}:${clientIp}`;
      const rateResult = consumeIpRateLimit(
        rateKey,
        maxRequests,
        DIRECT_LINK_IP_WINDOW_SECONDS
      );
      if (rateResult.limited) {
        return buildRateLimitedResponse(
          request,
          guestResolution,
          rateResult.retryAfterSeconds
        );
      }
    }
  }

  if (actor.actorType === "user" && typeof authUser?.credits === "number" && authUser.credits <= 0) {
    return buildInsufficientCreditsResponse(request, guestResolution);
  }

  const baseUrl = getTranscriptBackendBaseUrl();
  let upstreamResult: UpstreamDirectLinkResponse;
  try {
    upstreamResult = await fetchDirectLinkWithRetry({
      baseUrl,
      platform,
      token,
      bodyText,
    });
  } catch {
    return buildInternalErrorResponse(request, guestResolution);
  }

  const { upstream, text, contentType, parsedBody } = upstreamResult;

  const responseVideoId = extractVideoId(parsedBody);
  const finalLinkKey = buildLinkKey(platform, requestUrl, responseVideoId || undefined);
  const alreadyChargedByFinalKey = hasChargedLink(actor.actorId, dayKey, finalLinkKey);
  const isSuccessfulDirectLink = upstream.ok && hasUsableDirectLink(parsedBody);

  if (isSuccessfulDirectLink && !alreadyChargedByFinalKey) {
    if (actor.actorType === "guest") {
      const currentGuestCount = getChargedCount(actor.actorId, dayKey);
      if (currentGuestCount >= guestDailyLimit) {
        return buildLoginRequiredResponse(request, guestResolution);
      }

      markLinkCharged(actor.actorId, dayKey, finalLinkKey);
    } else {
      if (!token) {
        return buildInternalErrorResponse(request, guestResolution);
      }

      const idempotencyKey = buildCreditIdempotencyKey(actor.actorId, dayKey, platform, finalLinkKey);
      const consumeResult = await consumeAuthCredits({
        token,
        amount: 1,
        reason: "transcript_direct_link",
        idempotencyKey,
        metadata: {
          platform,
          linkKey: finalLinkKey,
          dayKey,
          sourceUrl: requestUrl,
        },
      });

      if (!consumeResult.ok) {
        if (consumeResult.insufficient) {
          return buildInsufficientCreditsResponse(request, guestResolution);
        }
        if (consumeResult.unauthorized) {
          return buildLoginRequiredResponse(request, guestResolution);
        }
        return buildInternalErrorResponse(request, guestResolution, {
          code: consumeResult.code,
          message: consumeResult.message,
        });
      }

      markLinkCharged(actor.actorId, dayKey, finalLinkKey);
    }
  }

  const response = new NextResponse(text, {
    status: upstream.status,
    headers: {
      "content-type": contentType,
    },
  });
  return withGuestCookie(request, response, guestResolution);
}
