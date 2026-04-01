import { Metadata } from "next";
import { HomeClient } from "@/components/pages/home-client";

export const metadata: Metadata = {
  title: "AI Transcript Generator for TikTok, Instagram & Facebook",
  description:
    "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Paste a link, preview free, then copy or export subtitles.",
  keywords: [
    "transcript generator",
    "ai transcript generator",
    "video transcript generator",
    "video to text",
    "instagram transcript",
    "tiktok transcript",
    "facebook transcript",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "AI Transcript Generator for TikTok, Instagram & Facebook",
    description:
      "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Paste a link, preview free, then copy or export subtitles.",
    url: "/",
    siteName: "Transcripthub",
    type: "website",
    images: [
      {
        url: "/captures/home-unified-20260329.png",
        alt: "Transcripthub AI transcript generator homepage preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Transcript Generator for TikTok, Instagram & Facebook",
    description:
      "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Paste a link, preview free, then copy or export subtitles.",
    images: ["/captures/home-unified-20260329.png"],
  },
};

export default function Home() {
  return <HomeClient />;
}
