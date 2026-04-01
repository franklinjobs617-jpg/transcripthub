import { handleTranscriptDirectLink } from "@/lib/transcript-direct-link-gateway";

export async function POST(request: Request) {
  return handleTranscriptDirectLink(request, "facebook");
}
