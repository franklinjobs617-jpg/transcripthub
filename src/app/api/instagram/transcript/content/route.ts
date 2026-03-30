import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";
import { fetchAuthUserByToken, getBearerTokenFromHeaders } from "@/lib/auth-backend";

export async function POST(request: Request) {
  try {
    const baseUrl = getTranscriptBackendBaseUrl();
    const bodyText = await request.text();
    const authHeader = request.headers.get("authorization");
    const token = getBearerTokenFromHeaders(request.headers);

    if (token) {
      const authUser = await fetchAuthUserByToken(token);
      if (authUser && typeof authUser.credits === "number" && authUser.credits <= 0) {
        return Response.json(
          {
            ok: false,
            error: {
              code: "INSUFFICIENT_CREDITS",
              message: "Your credits are currently insufficient. Please top up and retry.",
            },
          },
          { status: 402 }
        );
      }
    }

    const upstream = await fetch(`${baseUrl}/api/instagram/transcript/content`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(authHeader ? { authorization: authHeader } : {}),
      },
      body: bodyText,
      cache: "no-store",
    });

    const text = await upstream.text();
    const contentType = upstream.headers.get("content-type") || "application/json; charset=utf-8";

    return new Response(text, {
      status: upstream.status,
      headers: {
        "content-type": contentType,
      },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Instagram transcript service is temporarily unavailable.",
        },
      },
      { status: 502 }
    );
  }
}

