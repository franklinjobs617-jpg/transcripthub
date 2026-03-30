import { NextRequest } from "next/server";
import { fetchWithTimeout, getBillingBackendBaseUrl } from "@/lib/billing-backend";
import { errorResponse, normalizeRemoteError, parseRemoteJson, successResponse } from "@/lib/payment-bff";
import { fetchAuthUserByToken, getBearerTokenFromHeaders } from "@/lib/auth-backend";
import type { PayPalIntent, PaymentChannel } from "@/lib/payment-types";

type VerifyRequestBody = {
  channel?: PaymentChannel;
  sessionId?: string;
  orderId?: string;
  subscriptionId?: string;
  payerId?: string;
  paypalIntent?: PayPalIntent;
};

function resolveStatus(payload: unknown): "paid" | "pending" | "failed" {
  if (!payload || typeof payload !== "object") return "failed";
  const obj = payload as Record<string, unknown>;
  const data = obj.data;
  const rawStatus =
    (typeof obj.status === "string" ? obj.status : undefined) ||
    (typeof obj.state === "string" ? obj.state : undefined) ||
    (typeof data === "string" ? data : undefined) ||
    (data && typeof data === "object" && typeof (data as Record<string, unknown>).status === "string"
      ? ((data as Record<string, unknown>).status as string)
      : undefined);
  const normalized = rawStatus?.toLowerCase();

  if (
    normalized === "paid" ||
    normalized === "success" ||
    normalized === "succeeded" ||
    normalized === "completed" ||
    normalized === "active"
  ) {
    return "paid";
  }
  if (normalized === "pending" || normalized === "processing" || normalized === "created") {
    return "pending";
  }
  if (normalized && (normalized.includes("not found") || normalized.includes("not_found"))) {
    return "pending";
  }

  const code = obj.code;
  const msg = typeof obj.msg === "string" ? obj.msg.toLowerCase() : "";
  if ((code === 200 || code === "200") && (!normalized || normalized === "ok" || msg === "ok")) {
    return "paid";
  }
  if (!normalized && (code === 0 || code === "0")) return "paid";
  return "failed";
}

function resolveRawStatus(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const obj = payload as Record<string, unknown>;
  if (typeof obj.status === "string") return obj.status;
  if (typeof obj.state === "string") return obj.state;
  if (typeof obj.msg === "string") return obj.msg;
  if (typeof obj.message === "string") return obj.message;
  if (typeof obj.data === "string") return obj.data;
  return undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyRequestBody;
    const channel = body.channel;
    if (!channel || (channel !== "stripe" && channel !== "paypal")) {
      return errorResponse("INVALID_CHANNEL", "channel must be stripe or paypal", 400);
    }

    const token = getBearerTokenFromHeaders(request.headers);
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Login is required to verify payment.", 401);
    }
    const authUser = await fetchAuthUserByToken(token);
    if (!authUser?.email) {
      return errorResponse("UNAUTHORIZED", "Unable to verify current user.", 401);
    }
    const billingBase = getBillingBackendBaseUrl();

    if (channel === "stripe") {
      if (!body.sessionId) {
        return errorResponse("MISSING_SESSION_ID", "sessionId is required for stripe verify.", 400);
      }

      const stripeVerifyPath =
        process.env.BILLING_STRIPE_VERIFY_PATH || "/prod-api/stripe/check-order-status";
      const upstream = await fetchWithTimeout(
        `${billingBase}${stripeVerifyPath}?sessionId=${encodeURIComponent(body.sessionId)}`,
        {
          method: "GET",
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
          timeoutMs: 18000,
        }
      );

      const payload = await parseRemoteJson(upstream);
      if (!upstream.ok) {
        const err = normalizeRemoteError(
          payload,
          "BILLING_UPSTREAM_ERROR",
          "Failed to verify Stripe payment."
        );
        return errorResponse(err.code, err.message, upstream.status, err.details);
      }

      const paymentStatus = resolveStatus(payload);
      return successResponse({
        paymentStatus,
        rawStatus: resolveRawStatus(payload),
      });
    }

    const intent: PayPalIntent =
      body.paypalIntent || (body.subscriptionId ? "subscription" : "capture");

    if (intent === "capture") {
      if (!body.orderId) {
        return errorResponse("MISSING_ORDER_ID", "orderId is required for PayPal capture.", 400);
      }

      const capturePath =
        process.env.BILLING_PAYPAL_CAPTURE_PATH || "/prod-api/paypal/smart/capture-order";
      const upstream = await fetchWithTimeout(`${billingBase}${capturePath}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          orderId: body.orderId,
          googleUserId: authUser?.googleUserId,
          userId: authUser?.id,
          email: authUser?.email,
          project: "transcripthub",
        }),
        timeoutMs: 18000,
      });

      const payload = await parseRemoteJson(upstream);
      if (!upstream.ok) {
        const err = normalizeRemoteError(
          payload,
          "BILLING_UPSTREAM_ERROR",
          "Failed to verify PayPal payment."
        );
        return errorResponse(err.code, err.message, upstream.status, err.details);
      }

      const paymentStatus = resolveStatus(payload);
      return successResponse({
        paymentStatus,
        rawStatus: resolveRawStatus(payload),
      });
    }

    if (!body.subscriptionId) {
      return errorResponse(
        "MISSING_SUBSCRIPTION_ID",
        "subscriptionId is required for PayPal subscription verify.",
        400
      );
    }

    const verifySubscriptionPath =
      process.env.BILLING_PAYPAL_VERIFY_SUBSCRIPTION_PATH || "/prod-api/paypal/retUrl";
    const verifyUrl = `${billingBase}${verifySubscriptionPath}?token=${encodeURIComponent(
      body.subscriptionId
    )}${body.payerId ? `&PayerID=${encodeURIComponent(body.payerId)}` : ""}`;
    const upstream = await fetchWithTimeout(verifyUrl, {
      method: "GET",
      headers: token ? { authorization: `Bearer ${token}` } : undefined,
      timeoutMs: 18000,
    });

    const payload = await parseRemoteJson(upstream);
    if (!upstream.ok) {
      const err = normalizeRemoteError(
        payload,
        "BILLING_UPSTREAM_ERROR",
        "Failed to verify PayPal subscription."
      );
      return errorResponse(err.code, err.message, upstream.status, err.details);
    }

    const paymentStatus = resolveStatus(payload);
    return successResponse({
      paymentStatus,
      rawStatus: resolveRawStatus(payload),
    });
  } catch (error) {
    const err = normalizeRemoteError(error, "INTERNAL_ERROR", "Payment verify failed.");
    return errorResponse(err.code, err.message, 500, err.details);
  }
}
