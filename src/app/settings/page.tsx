import type { Metadata } from "next";
import { SettingsClient } from "@/components/pages/settings-client";

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
  return <SettingsClient />;
}

