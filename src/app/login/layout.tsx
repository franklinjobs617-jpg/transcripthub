import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Transcripthub",
  description: "Sign in with Google to access billing, credits, and account settings.",
  robots: {
    index: false,
    follow: false,
  },
  alternates: {
    canonical: "/login",
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
