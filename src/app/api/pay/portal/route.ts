import { NextRequest } from "next/server";
import { fetchWithTimeout, getBillingBackendBaseUrl } from "@/lib/billing-backend";
import { errorResponse, normalizeRemoteError, parseRemoteJson, successResponse } from "@/lib/payment-bff";
import { fetchAuthUserByToken, getBearerTokenFromHeaders } from "@/lib/auth-backend";

function extractPortalUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const data = (obj.data && typeof obj.data === "object" ? obj.data : null) as Record<
    string,
    unknown
  > | null;

  const candidates = [obj.url, obj.portalUrl, data?.url, data?.portalUrl];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.startsWith("http")) {
      return candidate;
    }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const token = getBearerTokenFromHeaders(request.headers);
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Login is required.", 401);
    }
    const authUser = await fetchAuthUserByToken(token);
    if (!authUser?.email) {
      return errorResponse("UNAUTHORIZED", "Unable to verify current user.", 401);
    }

    const billingBase = getBillingBackendBaseUrl();
    const portalPath = process.env.BILLING_PORTAL_PATH || "/prod-api/pay/portal";

    const upstream = await fetchWithTimeout(`${billingBase}${portalPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        project: "transcripthub",
        googleUserId: authUser.googleUserId,
        userId: authUser.id,
        email: authUser.email,
      }),
      timeoutMs: 18000,
    });

    const payload = await parseRemoteJson(upstream);
    if (!upstream.ok) {
      const err = normalizeRemoteError(payload, "BILLING_UPSTREAM_ERROR", "Failed to open billing portal.");
      return errorResponse(err.code, err.message, upstream.status, err.details);
    }

    const url = extractPortalUrl(payload);
    if (!url) {
      return errorResponse("PORTAL_URL_MISSING", "Billing portal URL was not returned.", 502, payload);
    }

    return successResponse({ url });
  } catch (error) {
    const err = normalizeRemoteError(error, "INTERNAL_ERROR", "Failed to open billing portal.");
    return errorResponse(err.code, err.message, 500, err.details);
  }
}
