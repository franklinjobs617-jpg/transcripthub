import type { Metadata } from "next";
import InstagramTranscriptTool from "@/components/pages/instagram-transcript-tool";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Free Instagram Transcript - Online Preview",
  description:
    "Try free Instagram transcript preview online. Paste link, generate text, and validate output quality before upgrading.",
  keywords: [
    "free instagram transcript",
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
      title="Free Instagram transcript preview"
      description="Generate transcript previews without signup, then continue to full export when needed."
      primaryCta={{ href: "/pricing", label: "Compare Plans" }}
      secondaryCta={{ href: "/instagram-transcript", label: "Main Instagram Page" }}
    >
      <InstagramTranscriptTool />
    </PageShell>
  );
}

