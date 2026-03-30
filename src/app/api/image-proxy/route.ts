const ALLOWED_HOST_KEYWORDS = [
  "instagram",
  "cdninstagram",
  "fbcdn",
  "tiktok",
  "tiktokcdn",
  "muscdn",
  "bytecdn",
];

function isAllowedImageHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return ALLOWED_HOST_KEYWORDS.some((keyword) => host.includes(keyword));
}

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const target = requestUrl.searchParams.get("url") || "";
    if (!target) {
      return new Response("Missing image url", { status: 400 });
    }

    const parsed = new URL(target);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return new Response("Invalid protocol", { status: 400 });
    }
    if (!isAllowedImageHost(parsed.hostname)) {
      return new Response("Host not allowed", { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), {
      method: "GET",
      cache: "no-store",
      redirect: "follow",
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return new Response("Image unavailable", { status: 404 });
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    headers.set("content-type", contentType);
    headers.set("cache-control", "public, max-age=300");
    headers.set("cross-origin-resource-policy", "cross-origin");

    return new Response(upstream.body, {
      status: 200,
      headers,
    });
  } catch {
    return new Response("Image proxy unavailable", { status: 502 });
  }
}

