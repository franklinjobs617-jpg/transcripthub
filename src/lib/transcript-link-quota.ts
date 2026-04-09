import type { NextResponse } from "next/server";
import type { RemoteAuthUser } from "@/lib/auth-backend";

const GUEST_COOKIE_NAME = "th_guest_id";
const DEFAULT_GUEST_DAILY_LIMIT = 2;
const QUOTA_TIMEZONE = process.env.QUOTA_TIMEZONE || "Asia/Shanghai";
const DEFAULT_GUEST_QUOTA_STRATEGY = "legacy_daily";
const GUEST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const chargedLinkKeysByActorDay = new Map<string, Set<string>>();
let lastSweepDayKey = "";

const TRACKING_QUERY_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "igsh",
  "is_from_webapp",
  "sender_device",
  "fbclid",
  "si",
]);

export type LinkActorIdentity = {
  actorType: "guest" | "user";
  actorId: string;
  guestId?: string;
  userKey?: string;
};

export type GuestResolution = {
  guestId: string;
  shouldSetCookie: boolean;
};

export type GuestQuotaStrategy = "legacy_daily" | "lifetime_one_time";

export type GuestQuotaPolicy = {
  strategy: GuestQuotaStrategy;
  dayKey: string;
  guestLimit: number;
};

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return Math.floor(parsed);
}

function normalizeGuestQuotaStrategy(value: string | undefined): GuestQuotaStrategy {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "lifetime_one_time") {
    return "lifetime_one_time";
  }
  return "legacy_daily";
}

function randomId(prefix: string): string {
  const randomUUID = globalThis.crypto?.randomUUID?.();
  if (randomUUID) return `${prefix}_${randomUUID}`;
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function readCookie(headers: Headers, name: string): string | null {
  const raw = headers.get("cookie");
  if (!raw) return null;
  const pairs = raw.split(";");
  for (const pair of pairs) {
    const [k, ...rest] = pair.trim().split("=");
    if (k !== name) continue;
    return decodeURIComponent(rest.join("=") || "");
  }
  return null;
}

function getDatePart(date: Date, type: "year" | "month" | "day"): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: QUOTA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  return parts.find((part) => part.type === type)?.value || "";
}

function toActorDayKey(actorId: string, dayKey: string): string {
  return `${actorId}|${dayKey}`;
}

function sweepIfNeeded(currentDayKey: string): void {
  if (lastSweepDayKey === currentDayKey) return;
  for (const key of chargedLinkKeysByActorDay.keys()) {
    if (!key.endsWith(`|${currentDayKey}`)) {
      chargedLinkKeysByActorDay.delete(key);
    }
  }
  lastSweepDayKey = currentDayKey;
}

function fnv1aHash(input: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

export function getShanghaiDayKey(now = new Date()): string {
  const year = getDatePart(now, "year");
  const month = getDatePart(now, "month");
  const day = getDatePart(now, "day");
  return `${year}-${month}-${day}`;
}

export function getGuestDailyLimit(): number {
  return parsePositiveInt(process.env.GUEST_DAILY_LIMIT, DEFAULT_GUEST_DAILY_LIMIT);
}

export function getGuestQuotaStrategy(): GuestQuotaStrategy {
  return normalizeGuestQuotaStrategy(
    process.env.GUEST_QUOTA_STRATEGY || DEFAULT_GUEST_QUOTA_STRATEGY
  );
}

export function getGuestQuotaPolicy(now = new Date()): GuestQuotaPolicy {
  return {
    strategy: getGuestQuotaStrategy(),
    dayKey: getShanghaiDayKey(now),
    guestLimit: getGuestDailyLimit(),
  };
}

export function resolveGuestIdentity(request: Request): GuestResolution {
  const existing = readCookie(request.headers, GUEST_COOKIE_NAME);
  if (existing && existing.trim()) {
    return {
      guestId: existing.trim(),
      shouldSetCookie: false,
    };
  }

  return {
    guestId: randomId("guest"),
    shouldSetCookie: true,
  };
}

export function buildLinkActorIdentity(
  authUser: RemoteAuthUser | null,
  guestResolution: GuestResolution
): LinkActorIdentity {
  const userKey = authUser?.id || authUser?.googleUserId || authUser?.email;
  if (userKey) {
    return {
      actorType: "user",
      actorId: `user:${String(userKey)}`,
      userKey: String(userKey),
    };
  }

  return {
    actorType: "guest",
    actorId: `guest:${guestResolution.guestId}`,
    guestId: guestResolution.guestId,
  };
}

export function normalizeSourceUrl(rawUrl: string): string {
  const value = (rawUrl || "").trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    parsed.hash = "";

    for (const key of Array.from(parsed.searchParams.keys())) {
      if (TRACKING_QUERY_KEYS.has(key.toLowerCase())) {
        parsed.searchParams.delete(key);
      }
    }

    const sortedPairs = Array.from(parsed.searchParams.entries()).sort((a, b) => {
      if (a[0] === b[0]) return a[1].localeCompare(b[1]);
      return a[0].localeCompare(b[0]);
    });
    parsed.search = "";
    for (const [key, val] of sortedPairs) {
      parsed.searchParams.append(key, val);
    }

    return parsed.toString();
  } catch {
    return value;
  }
}

export function buildLinkKey(platform: string, sourceUrl: string, videoId?: string | null): string {
  const normalizedPlatform = (platform || "").trim().toLowerCase() || "unknown";
  const normalizedVideoId = String(videoId || "").trim();

  if (normalizedVideoId) {
    return `${normalizedPlatform}:video:${normalizedVideoId}`;
  }

  const normalizedSource = normalizeSourceUrl(sourceUrl);
  return `${normalizedPlatform}:url:${normalizedSource || "unknown"}`;
}

export function hasChargedLink(actorId: string, dayKey: string, linkKey: string): boolean {
  sweepIfNeeded(dayKey);
  const actorDayKey = toActorDayKey(actorId, dayKey);
  const current = chargedLinkKeysByActorDay.get(actorDayKey);
  return Boolean(current?.has(linkKey));
}

export function getChargedCount(actorId: string, dayKey: string): number {
  sweepIfNeeded(dayKey);
  const actorDayKey = toActorDayKey(actorId, dayKey);
  return chargedLinkKeysByActorDay.get(actorDayKey)?.size || 0;
}

export function markLinkCharged(actorId: string, dayKey: string, linkKey: string): {
  alreadyCharged: boolean;
  usageCount: number;
} {
  sweepIfNeeded(dayKey);

  const actorDayKey = toActorDayKey(actorId, dayKey);
  let current = chargedLinkKeysByActorDay.get(actorDayKey);
  if (!current) {
    current = new Set<string>();
    chargedLinkKeysByActorDay.set(actorDayKey, current);
  }

  if (current.has(linkKey)) {
    return {
      alreadyCharged: true,
      usageCount: current.size,
    };
  }

  current.add(linkKey);
  return {
    alreadyCharged: false,
    usageCount: current.size,
  };
}

export function buildCreditIdempotencyKey(
  actorId: string,
  dayKey: string,
  platform: string,
  linkKey: string
): string {
  const payload = `${actorId}|${dayKey}|${platform}|${linkKey}`;
  return `th_direct_link_v1_${fnv1aHash(payload)}`;
}

export function applyGuestCookie(
  response: NextResponse,
  request: Request,
  guestResolution: GuestResolution
): void {
  if (!guestResolution.shouldSetCookie) return;
  const requestUrl = request.url || "";
  const forwardedProto = request.headers.get("x-forwarded-proto") || "";
  const secure = forwardedProto.toLowerCase() === "https" || requestUrl.startsWith("https://");

  response.cookies.set({
    name: GUEST_COOKIE_NAME,
    value: guestResolution.guestId,
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: GUEST_COOKIE_MAX_AGE_SECONDS,
  });
}
