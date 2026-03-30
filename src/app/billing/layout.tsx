import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Billing - Transcripthub",
  description: "Manage your subscription, credits, and billing orders.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/billing",
  },
};

export default function BillingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
