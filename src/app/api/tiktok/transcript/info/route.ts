import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";

export async function POST(request: Request) {
  try {
    const baseUrl = getTranscriptBackendBaseUrl();
    const bodyText = await request.text();
    const authHeader = request.headers.get("authorization");

    const upstream = await fetch(`${baseUrl}/api/tiktok/transcript/info`, {
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
          message: "TikTok transcript service is temporarily unavailable.",
        },
      },
      { status: 502 }
    );
  }
}
