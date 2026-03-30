import { Metadata } from "next";
import { HomeClient } from "@/components/pages/home-client";

export const metadata: Metadata = {
  title: "AI Transcript Generator - Video Transcript Generator for Social Media",
  description:
    "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Convert videos to text online with free preview.",
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
    title: "AI Transcript Generator - Video Transcript Generator for Social Media",
    description:
      "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Convert videos to text online with free preview.",
    url: "https://transcripthub.com",
    siteName: "Transcripthub",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Transcript Generator - Video Transcript Generator for Social Media",
    description:
      "AI Transcript Generator and Video Transcript Generator for TikTok, Instagram, and Facebook. Convert videos to text online with free preview.",
  },
};

export default function Home() {
  return <HomeClient />;
}
