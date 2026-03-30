import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Instagram Reel Transcript Generator - Convert IG Video to Text Online",
    description: "Extract accurate scripts from any Instagram Reel or Video instantly. High-accuracy AI optimized for IG content. Perfect for repurposing and SEO. No signup needed.",
};

export default function InstagramLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
