import { getStoredAuthToken } from "@/lib/auth-session";
import type {
  BillingApiErrorResponse,
  BillingApiResponse,
  PaymentCreateRequest,
  PaymentCreateResponse,
  PaymentOrdersResponse,
  PaymentPortalResponse,
  PaymentVerifyRequest,
  PaymentVerifyResponse,
} from "@/lib/payment-types";

function normalizeError(
  error: unknown,
  fallbackCode: string,
  fallbackMessage: string
): BillingApiErrorResponse {
  if (error && typeof error === "object" && "error" in error) {
    const unsafe = error as { error?: { code?: string; message?: string; details?: unknown } };
    if (unsafe.error?.message) {
      return {
        ok: false,
        error: {
          code: unsafe.error.code || fallbackCode,
          message: unsafe.error.message,
          details: unsafe.error.details,
        },
      };
    }
  }

  if (error instanceof Error) {
    return {
      ok: false,
      error: {
        code: fallbackCode,
        message: error.message || fallbackMessage,
      },
    };
  }

  return {
    ok: false,
    error: {
      code: fallbackCode,
      message: fallbackMessage,
    },
  };
}

async function requestApi<T>(
  input: RequestInfo | URL,
  init: RequestInit,
  fallbackCode: string,
  fallbackMessage: string
): Promise<BillingApiResponse<T>> {
  try {
    const token = getStoredAuthToken();
    const headers = new Headers(init.headers || {});
    headers.set("content-type", "application/json");
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }

    const response = await fetch(input, {
      ...init,
      headers,
      cache: "no-store",
    });

    const payload = (await response.json()) as BillingApiResponse<T>;
    if (!response.ok || (payload as BillingApiErrorResponse).ok === false) {
      return normalizeError(payload, fallbackCode, fallbackMessage);
    }

    return payload;
  } catch (error) {
    return normalizeError(error, fallbackCode, fallbackMessage);
  }
}

export async function createPayment(
  body: PaymentCreateRequest
): Promise<BillingApiResponse<PaymentCreateResponse["data"]>> {
  return requestApi<PaymentCreateResponse["data"]>(
    "/api/pay/create",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "PAY_CREATE_FAILED",
    "Failed to create payment session."
  );
}

export async function verifyPayment(
  body: PaymentVerifyRequest
): Promise<BillingApiResponse<PaymentVerifyResponse["data"]>> {
  return requestApi<PaymentVerifyResponse["data"]>(
    "/api/pay/verify",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    "PAY_VERIFY_FAILED",
    "Failed to verify payment."
  );
}

export async function createBillingPortal(): Promise<
  BillingApiResponse<PaymentPortalResponse["data"]>
> {
  return requestApi<PaymentPortalResponse["data"]>(
    "/api/pay/portal",
    {
      method: "POST",
      body: JSON.stringify({}),
    },
    "PORTAL_CREATE_FAILED",
    "Failed to open billing portal."
  );
}

export async function fetchBillingOrders(): Promise<
  BillingApiResponse<PaymentOrdersResponse["data"]>
> {
  return requestApi<PaymentOrdersResponse["data"]>(
    "/api/pay/orders",
    {
      method: "GET",
    },
    "ORDERS_FETCH_FAILED",
    "Failed to fetch billing orders."
  );
}
