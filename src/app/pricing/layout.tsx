import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Transcripthub Pricing | AI Transcript Plans & Credits",
    description: "Compare transparent AI transcript plans with free preview, monthly credits, and pay-as-you-go options for creators and teams.",
    alternates: {
        canonical: "/pricing",
    },
    openGraph: {
        title: "Transcripthub Pricing | AI Transcript Plans & Credits",
        description:
            "Compare transparent AI transcript plans with free preview, monthly credits, and pay-as-you-go options for creators and teams.",
        url: "/pricing",
        siteName: "Transcripthub",
        type: "website",
        images: [
            {
                url: "/captures/home-unified-20260329.png",
                alt: "Transcripthub pricing and plans overview",
            },
        ],
    },
    twitter: {
        card: "summary_large_image",
        title: "Transcripthub Pricing | AI Transcript Plans & Credits",
        description:
            "Compare transparent AI transcript plans with free preview, monthly credits, and pay-as-you-go options for creators and teams.",
        images: ["/captures/home-unified-20260329.png"],
    },
};

export default function PricingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
