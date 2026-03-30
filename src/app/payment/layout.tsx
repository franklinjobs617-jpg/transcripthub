import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Status - Transcripthub",
  description: "Verify payment status and sync billing entitlements.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
