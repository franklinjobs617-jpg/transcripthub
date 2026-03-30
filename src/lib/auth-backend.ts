type RemoteAuthUser = {
  id?: string;
  email?: string;
  googleUserId?: string;
  name?: string;
  picture?: string;
  credits?: number;
  plan?: string;
};

export function getAuthBackendBaseUrl(): string {
  const baseUrl =
    process.env.AUTH_BASE_URL ||
    process.env.NEXT_PUBLIC_AUTH_BASE_URL ||
    "https://api.ytvidhub.com";

  return baseUrl.replace(/\/+$/, "");
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
