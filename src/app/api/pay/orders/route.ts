import { NextRequest } from "next/server";
import { fetchWithTimeout, getBillingBackendBaseUrl } from "@/lib/billing-backend";
import { errorResponse, normalizeRemoteError, parseRemoteJson, successResponse } from "@/lib/payment-bff";
import { fetchAuthUserByToken, getBearerTokenFromHeaders } from "@/lib/auth-backend";
import type { BillingOrderItem, PaymentChannel } from "@/lib/payment-types";

function normalizeChannel(value: unknown): PaymentChannel {
  if (typeof value !== "string") return "stripe";
  return value.toLowerCase().includes("paypal") ? "paypal" : "stripe";
}

function normalizeOrders(payload: unknown): BillingOrderItem[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const data = obj.data;
  const list = Array.isArray(data)
    ? data
    : data && typeof data === "object"
    ? ((data as Record<string, unknown>).list as unknown[]) ||
      ((data as Record<string, unknown>).orders as unknown[]) ||
      []
    : [];

  if (!Array.isArray(list)) return [];

  return list
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const raw = item as Record<string, unknown>;
      const amountNumber = Number(raw.amount ?? raw.total ?? raw.price ?? 0);

      return {
        id:
          (typeof raw.id === "string" ? raw.id : undefined) ||
          (typeof raw.orderId === "string" ? raw.orderId : undefined) ||
          (typeof raw.orderNo === "string" ? raw.orderNo : undefined) ||
          `order-${index}`,
        channel: normalizeChannel(raw.channel ?? raw.paymentChannel ?? raw.businessType),
        planCode:
          (typeof raw.planCode === "string" ? raw.planCode : undefined) ||
          (typeof raw.type === "string" ? raw.type : undefined) ||
          "unknown",
        amount: Number.isFinite(amountNumber) ? amountNumber : 0,
        currency: (typeof raw.currency === "string" ? raw.currency : "USD").toUpperCase(),
        status:
          (typeof raw.status === "string" ? raw.status : undefined) ||
          (typeof raw.state === "string" ? raw.state : undefined) ||
          "unknown",
        createdAt:
          (typeof raw.createdAt === "string" ? raw.createdAt : undefined) ||
          (typeof raw.createTime === "string" ? raw.createTime : undefined) ||
          new Date().toISOString(),
      } satisfies BillingOrderItem;
    })
    .filter((item): item is BillingOrderItem => item !== null);
}

export async function GET(request: NextRequest) {
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
    const ordersPath = process.env.BILLING_ORDERS_PATH || "/prod-api/pay/orders";
    const query = new URLSearchParams();
    if (authUser.googleUserId) query.set("googleUserId", authUser.googleUserId);
    if (authUser.email) query.set("email", authUser.email);
    query.set("project", "transcripthub");

    const upstream = await fetchWithTimeout(`${billingBase}${ordersPath}?${query.toString()}`, {
      method: "GET",
      headers: {
        authorization: `Bearer ${token}`,
      },
      timeoutMs: 18000,
    });

    const payload = await parseRemoteJson(upstream);
    if (!upstream.ok) {
      const err = normalizeRemoteError(payload, "BILLING_UPSTREAM_ERROR", "Failed to load billing orders.");
      return errorResponse(err.code, err.message, upstream.status, err.details);
    }

    const orders = normalizeOrders(payload);
    return successResponse(orders);
  } catch (error) {
    const err = normalizeRemoteError(error, "INTERNAL_ERROR", "Failed to load billing orders.");
    return errorResponse(err.code, err.message, 500, err.details);
  }
}
