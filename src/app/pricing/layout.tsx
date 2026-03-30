import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing & Plans - Transcripthub | Affordable AI Transcription",
    description: "Simple, transparent pricing for AI transcription. Start for free, subscribe for bulk credits, or pay as you go. No hidden fees. Optimized for creators.",
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
