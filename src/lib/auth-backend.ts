export type RemoteAuthUser = {
  id?: string;
  email?: string;
  googleUserId?: string;
  name?: string;
  picture?: string;
  credits?: number;
  plan?: string;
};

type ConsumeCreditsMetadata = {
  platform?: string;
  linkKey?: string;
  dayKey?: string;
  sourceUrl?: string;
};

type ConsumeCreditsParams = {
  token: string;
  amount: number;
  reason: string;
  idempotencyKey: string;
  metadata?: ConsumeCreditsMetadata;
};

type ConsumeCreditsSuccess = {
  ok: true;
  remainingCredits?: number;
  raw?: unknown;
};

type ConsumeCreditsFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
  insufficient: boolean;
  unauthorized: boolean;
  raw?: unknown;
};

export type ConsumeCreditsResult = ConsumeCreditsSuccess | ConsumeCreditsFailure;

export function getAuthBackendBaseUrl(): string {
  const baseUrl =
    process.env.AUTH_BASE_URL ||
    process.env.NEXT_PUBLIC_AUTH_BASE_URL ||
    "https://api.transcripthub.net";

  return baseUrl.replace(/\/+$/, "");
}

export function getAuthCreditConsumePath(): string {
  const path = process.env.AUTH_CREDIT_CONSUME_PATH || "/prod-api/g/credits/consume";
  if (!path) return "/prod-api/g/credits/consume";
  return path.startsWith("/") ? path : `/${path}`;
}

export function getBearerTokenFromHeaders(headers: Headers): string | null {
  const authHeader = headers.get("authorization") || headers.get("Authorization");
  if (!authHeader) return null;
  if (!authHeader.toLowerCase().startsWith("bearer ")) return null;
  return authHeader.slice(7).trim();
}

export async function fetchAuthUserByToken(token: string): Promise<RemoteAuthUser | null> {
  try {
    const authBaseUrl = getAuthBackendBaseUrl();
    const response = await fetch(`${authBaseUrl}/prod-api/g/getUser`, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });

    if (!response.ok) return null;
    const payload = (await response.json()) as { data?: RemoteAuthUser };
    if (!payload?.data?.email) return null;
    return payload.data;
  } catch {
    return null;
  }
}

function parseRemoteError(
  status: number,
  payload: unknown
): Pick<ConsumeCreditsFailure, "code" | "message" | "insufficient" | "unauthorized"> {
  const parsed = payload as
    | {
        ok?: boolean;
        error?: { code?: string; message?: string };
        code?: string | number;
        msg?: string;
        message?: string;
      }
    | undefined;

  const codeRaw = parsed?.error?.code ?? parsed?.code;
  const messageRaw = parsed?.error?.message ?? parsed?.message ?? parsed?.msg;
  const code = String(codeRaw ?? "");
  const message = String(messageRaw ?? "").trim();

  const lowerMessage = message.toLowerCase();
  const insufficient =
    status === 402 ||
    code === "402" ||
    code === "INSUFFICIENT_CREDITS" ||
    lowerMessage.includes("insufficient");
  const unauthorized = status === 401 || code === "401" || code === "UNAUTHORIZED";

  return {
    code: code || (insufficient ? "INSUFFICIENT_CREDITS" : unauthorized ? "UNAUTHORIZED" : "CREDIT_CONSUME_FAILED"),
    message: message || (insufficient ? "Insufficient credits." : unauthorized ? "Authentication required." : "Credit consume request failed."),
    insufficient,
    unauthorized,
  };
}

export async function consumeAuthCredits(params: ConsumeCreditsParams): Promise<ConsumeCreditsResult> {
  try {
    const authBaseUrl = getAuthBackendBaseUrl();
    const response = await fetch(`${authBaseUrl}${getAuthCreditConsumePath()}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${params.token}`,
      },
      body: JSON.stringify({
        amount: params.amount,
        reason: params.reason,
        idempotencyKey: params.idempotencyKey,
        metadata: params.metadata || {},
      }),
      cache: "no-store",
    });

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = text;
      }
    }

    if (!response.ok) {
      const parsed = parseRemoteError(response.status, payload);
      return {
        ok: false,
        status: response.status,
        code: parsed.code,
        message: parsed.message,
        insufficient: parsed.insufficient,
        unauthorized: parsed.unauthorized,
        raw: payload,
      };
    }

    const body = payload as
      | {
          ok?: boolean;
          data?: { remainingCredits?: number };
          remainingCredits?: number;
        }
      | undefined;

    const remainingCredits =
      typeof body?.data?.remainingCredits === "number"
        ? body.data.remainingCredits
        : typeof body?.remainingCredits === "number"
        ? body.remainingCredits
        : undefined;

    return {
      ok: true,
      remainingCredits,
      raw: payload,
    };
  } catch {
    return {
      ok: false,
      status: 503,
      code: "CREDIT_CONSUME_UNAVAILABLE",
      message: "Credit consume service is temporarily unavailable.",
      insufficient: false,
      unauthorized: false,
    };
  }
}
