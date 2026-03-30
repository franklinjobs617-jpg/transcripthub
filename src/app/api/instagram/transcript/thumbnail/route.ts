import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";

export async function GET(request: Request) {
  try {
    const baseUrl = getTranscriptBackendBaseUrl();
    const requestUrl = new URL(request.url);
    const queryString = requestUrl.searchParams.toString();
    const upstreamUrl = `${baseUrl}/api/instagram/transcript/thumbnail${queryString ? `?${queryString}` : ""}`;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!upstream.ok || !upstream.body) {
      return new Response(null, { status: 404 });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=300",
      },
    });
  } catch {
    return new Response(null, { status: 502 });
  }
}
