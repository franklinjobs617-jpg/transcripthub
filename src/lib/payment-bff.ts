import { NextResponse } from "next/server";
import type { BillingApiErrorResponse } from "@/lib/payment-types";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: unknown
) {
  const payload: BillingApiErrorResponse = {
    ok: false,
    error: {
      code,
      message,
      details,
    },
  };

  return NextResponse.json(payload, {
    status,
    headers: NO_STORE_HEADERS,
  });
}

export function successResponse<T>(data: T) {
  return NextResponse.json(
    {
      ok: true,
      data,
    },
    {
      headers: NO_STORE_HEADERS,
    }
  );
}

export async function parseRemoteJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export function normalizeRemoteError(
  payload: unknown,
  fallbackCode: string,
  fallbackMessage: string
): BillingApiErrorResponse["error"] {
  if (payload && typeof payload === "object") {
    const unsafe = payload as Record<string, unknown>;
    const maybeError = unsafe.error;
    if (maybeError && typeof maybeError === "object") {
      const errObj = maybeError as Record<string, unknown>;
      const message = typeof errObj.message === "string" ? errObj.message : fallbackMessage;
      const code = typeof errObj.code === "string" ? errObj.code : fallbackCode;
      return { code, message, details: errObj.details };
    }

    const code =
      typeof unsafe.code === "string"
        ? unsafe.code
        : typeof unsafe.status === "string"
        ? unsafe.status
        : fallbackCode;
    const message =
      typeof unsafe.message === "string"
        ? unsafe.message
        : typeof unsafe.msg === "string"
        ? unsafe.msg
        : fallbackMessage;
    return {
      code,
      message,
      details: payload,
    };
  }

  return {
    code: fallbackCode,
    message: fallbackMessage,
    details: payload,
  };
}
