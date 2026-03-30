import { NextRequest } from "next/server";
import {
  fetchWithTimeout,
  getAppBaseUrlFromHeaders,
  getBillingBackendBaseUrl,
} from "@/lib/billing-backend";
import { errorResponse, normalizeRemoteError, parseRemoteJson, successResponse } from "@/lib/payment-bff";
import { fetchAuthUserByToken, getBearerTokenFromHeaders } from "@/lib/auth-backend";
import { isKnownPlanCode, mapPlanCodeToBackend } from "@/lib/payment-config";
import type { BillingCycle, PayPalIntent, PaymentChannel } from "@/lib/payment-types";

type CreateRequestBody = {
  channel?: PaymentChannel;
  planCode?: string;
  type?: string;
  project?: string;
  googleUserId?: string;
  billingCycle?: BillingCycle;
  paypalIntent?: PayPalIntent;
};

function extractCheckoutUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const obj = payload as Record<string, unknown>;
  const dataObj = (obj.data && typeof obj.data === "object" ? obj.data : null) as
    | Record<string, unknown>
    | null;
  const dataStr = typeof obj.data === "string" ? obj.data : null;

  const candidates = [
    dataStr,
    obj.checkoutUrl,
    obj.url,
    obj.paymentUrl,
    dataObj?.checkoutUrl,
    dataObj?.url,
    dataObj?.paymentUrl,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.startsWith("http")) {
      return value;
    }
  }
  return null;
}

function extractPayPalToken(payload: unknown): {
  orderId?: string;
  subscriptionId?: string;
  approvalUrl?: string;
} {
  if (!payload || typeof payload !== "object") return {};
  const obj = payload as Record<string, unknown>;
  const dataObj = (obj.data && typeof obj.data === "object" ? obj.data : null) as
    | Record<string, unknown>
    | null;

  const orderIdCandidates = [obj.orderId, obj.orderID, obj.id, dataObj?.orderId, dataObj?.orderID, dataObj?.id];
  const subscriptionCandidates = [
    obj.subscriptionId,
    obj.subscriptionID,
    dataObj?.subscriptionId,
    dataObj?.subscriptionID,
    obj.data,
  ];

  const links =
    (Array.isArray(obj.links) ? obj.links : Array.isArray(dataObj?.links) ? dataObj?.links : []) as Array<
      Record<string, unknown>
    >;
  const approveLink = links.find(
    (link) =>
      (typeof link.rel === "string" && link.rel.toLowerCase().includes("approve")) ||
      (typeof link.href === "string" && link.href.includes("paypal.com"))
  );

  const result: { orderId?: string; subscriptionId?: string; approvalUrl?: string } = {};
  for (const candidate of orderIdCandidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      result.orderId = candidate;
      break;
    }
  }
  for (const candidate of subscriptionCandidates) {
    if (
      typeof candidate === "string" &&
      candidate.trim() &&
      (candidate.startsWith("I-") || !result.orderId)
    ) {
      result.subscriptionId = candidate;
      break;
    }
  }
  if (approveLink && typeof approveLink.href === "string") {
    result.approvalUrl = approveLink.href;
  }
  return result;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateRequestBody;
    const channel = body.channel;
    const planCode = body.planCode;
    const requestedType = typeof body.type === "string" ? body.type.trim() : "";
    const requestedProject = typeof body.project === "string" ? body.project.trim() : "";
    const requestedGoogleUserId =
      typeof body.googleUserId === "string" ? body.googleUserId.trim() : "";
    const hasKnownPlanCode = typeof planCode === "string" && isKnownPlanCode(planCode);
    const normalizedPlanCode = hasKnownPlanCode
      ? (planCode as Parameters<typeof mapPlanCodeToBackend>[0])
      : undefined;

    if (!channel || (channel !== "stripe" && channel !== "paypal")) {
      return errorResponse("INVALID_CHANNEL", "channel must be stripe or paypal", 400);
    }

    if (channel === "paypal" && !hasKnownPlanCode) {
      return errorResponse("INVALID_PLAN", "Unsupported plan code.", 400);
    }
    if (channel === "stripe" && !requestedType && !hasKnownPlanCode) {
      return errorResponse("INVALID_TYPE", "Stripe payment requires type or valid plan code.", 400);
    }

    const token = getBearerTokenFromHeaders(request.headers);
    if (!token) {
      return errorResponse("UNAUTHORIZED", "Login is required to create payment.", 401);
    }
    const authUser = await fetchAuthUserByToken(token);
    if (!authUser?.email) {
      return errorResponse("UNAUTHORIZED", "Unable to verify current user.", 401);
    }

    const backendPlanCode =
      requestedType ||
      (normalizedPlanCode ? mapPlanCodeToBackend(normalizedPlanCode) : "");
    if (!backendPlanCode) {
      return errorResponse("INVALID_TYPE", "Unable to resolve backend type.", 400);
    }
    const billingBase = getBillingBackendBaseUrl();

    if (channel === "stripe") {
      const resolvedGoogleUserId = requestedGoogleUserId || authUser.googleUserId;
      if (!resolvedGoogleUserId) {
        return errorResponse(
          "USER_ID_MISSING",
          "googleUserId is required for Stripe checkout.",
          400
        );
      }
      const stripePath = process.env.BILLING_STRIPE_CREATE_PATH || "/prod-api/stripe/getPayUrl";
      const stripePayload = {
        project: requestedProject || "transcripthub",
        type: backendPlanCode,
        googleUserId: resolvedGoogleUserId,
      };
      const upstream = await fetchWithTimeout(`${billingBase}${stripePath}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(stripePayload),
        timeoutMs: 18000,
      });

      const payload = await parseRemoteJson(upstream);
      if (!upstream.ok) {
        const err = normalizeRemoteError(
          payload,
          "BILLING_UPSTREAM_ERROR",
          "Failed to create Stripe checkout."
        );
        return errorResponse(err.code, err.message, upstream.status, err.details);
      }

      const checkoutUrl = extractCheckoutUrl(payload);
      if (!checkoutUrl) {
        return errorResponse(
          "CHECKOUT_URL_MISSING",
          "Stripe checkout URL was not returned by billing backend.",
          502,
          payload
        );
      }

      return successResponse({
        channel: "stripe",
        checkoutUrl,
      });
    }

    const appBaseUrl = getAppBaseUrlFromHeaders(request.headers);
    const successUrl = `${appBaseUrl}/payment/success?channel=${channel}`;
    const cancelUrl = `${appBaseUrl}/payment/cancel?channel=${channel}`;
    const commonPayload = {
      project: requestedProject || "transcripthub",
      type: backendPlanCode,
      planCode: backendPlanCode,
      billingCycle: body.billingCycle,
      googleUserId: requestedGoogleUserId || authUser?.googleUserId,
      email: authUser?.email,
      userId: authUser?.id,
      successUrl,
      cancelUrl,
    };

    const paypalIntent: PayPalIntent =
      body.paypalIntent ||
      (normalizedPlanCode === "payg_150" ? "capture" : "subscription");
    const paypalPath =
      paypalIntent === "subscription"
        ? process.env.BILLING_PAYPAL_CREATE_SUBSCRIPTION_PATH ||
          "/prod-api/paypal/smart/create-subscription"
        : process.env.BILLING_PAYPAL_CREATE_ORDER_PATH || "/prod-api/paypal/smart/create-order";

    const upstream = await fetchWithTimeout(`${billingBase}${paypalPath}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        ...commonPayload,
        paypalIntent,
      }),
      timeoutMs: 18000,
    });

    const payload = await parseRemoteJson(upstream);
    if (!upstream.ok) {
      const err = normalizeRemoteError(
        payload,
        "BILLING_UPSTREAM_ERROR",
        "Failed to create PayPal checkout."
      );
      return errorResponse(err.code, err.message, upstream.status, err.details);
    }

    const extracted = extractPayPalToken(payload);
    if (paypalIntent === "subscription" && !extracted.subscriptionId) {
      return errorResponse(
        "PAYPAL_SUBSCRIPTION_ID_MISSING",
        "PayPal subscription ID was not returned.",
        502,
        payload
      );
    }
    if (paypalIntent === "capture" && !extracted.orderId) {
      return errorResponse(
        "PAYPAL_ORDER_ID_MISSING",
        "PayPal order ID was not returned.",
        502,
        payload
      );
    }

    return successResponse({
      channel: "paypal",
      orderId: extracted.orderId,
      subscriptionId: extracted.subscriptionId,
      approvalUrl: extracted.approvalUrl,
    });
  } catch (error) {
    const err = normalizeRemoteError(error, "INTERNAL_ERROR", "Payment creation failed.");
    return errorResponse(err.code, err.message, 500, err.details);
  }
}
