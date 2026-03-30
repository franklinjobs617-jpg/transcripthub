export function getTranscriptBackendBaseUrl(): string {
  const baseUrl =
    process.env.TRANSCRIPT_BACKEND_URL ||
    process.env.NEXT_PUBLIC_TRANSCRIPT_BACKEND_URL ||
    "https://ytdlp.vistaflyer.com";

  return baseUrl.replace(/\/+$/, "");
}

