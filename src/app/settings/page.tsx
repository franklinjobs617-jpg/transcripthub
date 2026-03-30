import type { Metadata } from "next";
import Link from "next/link";
import { PageShell } from "@/components/shared/page-shell";

export const metadata: Metadata = {
  title: "Account Settings - Transcripthub",
  description:
    "Manage your profile details and account preferences for Transcripthub.",
  robots: {
    index: false,
    follow: true,
  },
  alternates: {
    canonical: "/settings",
  },
};

export default function SettingsPage() {
  return (
    <PageShell
      eyebrow="Account"
      title="Account settings"
      description="Manage profile details and sign-in preferences for your transcript workspace."
      primaryCta={{ href: "/login", label: "Sign In to Continue" }}
      secondaryCta={{ href: "/billing", label: "Open Billing" }}
    >
      <div className="ui-card bg-app-surface p-6 sm:p-8">
        <h2 className="text-lg font-bold text-app-text">Settings availability</h2>
        <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
          Account settings are available after sign-in. If you are already signed in, refresh this
          page or return from the account menu.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Link
            href="/login"
            className="ui-btn-primary inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold"
          >
            Sign In
          </Link>
          <Link
            href="/contact"
            className="ui-btn-secondary inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold"
          >
            Contact Support
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

