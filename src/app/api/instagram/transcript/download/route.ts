import { getTranscriptBackendBaseUrl } from "@/lib/transcript-backend";

export async function GET(request: Request) {
  try {
    const baseUrl = getTranscriptBackendBaseUrl();
    const requestUrl = new URL(request.url);
    const queryString = requestUrl.searchParams.toString();
    const upstreamUrl = `${baseUrl}/api/instagram/transcript/download${
      queryString ? `?${queryString}` : ""
    }`;

    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      cache: "no-store",
    });

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type");
    const contentDisposition = upstream.headers.get("content-disposition");

    if (contentType) {
      headers.set("content-type", contentType);
    }
    if (contentDisposition) {
      headers.set("content-disposition", contentDisposition);
    }

    return new Response(upstream.body, {
      status: upstream.status,
      headers,
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
