export function getBillingBackendBaseUrl(): string {
  const candidates = [
    process.env.BILLING_BASE_URL,
    process.env.NEXT_PUBLIC_BILLING_BASE_URL,
    process.env.AUTH_BASE_URL,
    process.env.NEXT_PUBLIC_AUTH_BASE_URL,
  ];
  const baseUrl =
    candidates.find((item) => typeof item === "string" && item.trim().length > 0)?.trim() || "";

  if (!baseUrl) {
    throw new Error(
      "Billing backend base URL is not configured. Please set BILLING_BASE_URL or NEXT_PUBLIC_BILLING_BASE_URL."
    );
  }

  return baseUrl.replace(/\/+$/, "");
}

export function getAppBaseUrlFromHeaders(headers: Headers): string {
  const proto = headers.get("x-forwarded-proto") || "https";
  const host = headers.get("x-forwarded-host") || headers.get("host");

  if (!host) {
    return process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";
  }

  return `${proto}://${host}`;
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 15000, ...requestInit } = init;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(input, {
      ...requestInit,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
