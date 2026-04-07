import type { Metadata } from "next";
import InstagramTranscriptTool from "@/components/pages/instagram-transcript-tool";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Free Instagram Script Extractor & Transcript Preview",
  description:
    "Try a free Instagram Script Extractor and transcript preview online. Paste a link, generate text, and validate output quality before upgrading.",
  keywords: [
    "free instagram transcript",
    "free instagram script extractor",
    "free instagram transcript extractor",
    "instagram transcript free",
    "instagram video to text free",
  ],
  alternates: {
    canonical: "/free-instagram-transcript",
  },
};

export default function FreeInstagramTranscriptPage() {
  return (
    <PageShell
      eyebrow="Free Preview"
      title="Free Instagram transcript & script extractor preview"
      description="Generate transcript previews without signup, validate extractor output quality, then continue to full export when needed."
      primaryCta={{ href: "/pricing", label: "Compare Plans" }}
      secondaryCta={{ href: "/instagram-transcript", label: "Main Instagram Page" }}
    >
      <InstagramTranscriptTool />
    </PageShell>
  );
}

