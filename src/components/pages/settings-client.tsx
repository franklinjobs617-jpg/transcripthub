"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  LogIn,
  LogOut,
  Mail,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { PageShell } from "@/components/shared/page-shell";
import { useAuth } from "@/components/providers/auth-provider";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";

function formatDateTime(value?: string): string {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function resolvePlanLabel(plan?: string): string {
  const normalized = (plan || "free").toLowerCase();
  if (normalized === "premium" || normalized.includes("pro")) return "Pro";
  return "Free";
}

export function SettingsClient() {
  const { user, isLoading, logout, refreshUser, isAuthenticating } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isSignedIn = Boolean(user?.email);
  const avatarUrl = user?.picture || user?.avatarUrl || "";
  const title = isSignedIn ? "Account settings" : "Account settings";
  const description = isSignedIn
    ? "Manage profile details, plan status, and account controls for your transcript workspace."
    : "Sign in to manage profile details and account preferences for your transcript workspace.";

  async function handleRefresh() {
    setIsRefreshing(true);
    await refreshUser();
    setIsRefreshing(false);
  }

  return (
    <>
      <PageShell
        eyebrow="Account"
        title={title}
        description={description}
        primaryCta={
          isSignedIn
            ? { href: "/billing", label: "Open Billing" }
            : { href: "/login", label: "Sign In to Continue" }
        }
        secondaryCta={
          isSignedIn
            ? { href: "/pricing", label: "View Plans" }
            : { href: "/billing", label: "Open Billing" }
        }
      >
        {isLoading ? (
          <div className="ui-card bg-app-surface p-6 sm:p-8">
            <div className="h-6 w-44 animate-pulse rounded bg-app-primary-soft" />
            <div className="mt-4 h-4 w-full animate-pulse rounded bg-app-primary-soft" />
            <div className="mt-2 h-4 w-5/6 animate-pulse rounded bg-app-primary-soft" />
          </div>
        ) : !isSignedIn ? (
          <div className="ui-card bg-app-surface p-6 sm:p-8">
            <h2 className="text-lg font-bold text-app-text">Settings availability</h2>
            <p className="mt-2 text-sm leading-relaxed text-app-text-muted">
              Account settings are available after sign-in. Once logged in, this page shows
              profile, plan, credits, and subscription controls.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                disabled={isAuthenticating}
                className="ui-btn-primary inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-bold disabled:cursor-not-allowed disabled:opacity-65"
              >
                <LogIn className="h-4 w-4" />
                {isAuthenticating ? "Opening Google..." : "Sign In"}
              </button>
              <Link
                href="/contact"
                className="ui-btn-secondary inline-flex h-10 items-center justify-center rounded-lg text-sm font-bold"
              >
                Contact Support
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="ui-card bg-app-surface p-5 lg:col-span-2">
              <div className="flex items-start gap-4">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user?.name || "User avatar"}
                    width={64}
                    height={64}
                    unoptimized
                    className="h-16 w-16 rounded-2xl border border-app-border object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-app-border bg-app-bg text-app-text-muted">
                    <UserRound className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                    Signed in
                  </p>
                  <h2 className="truncate text-xl font-extrabold text-app-text">
                    {user?.name || "Transcripthub user"}
                  </h2>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm text-app-text-muted">
                    <Mail className="h-3.5 w-3.5" />
                    {user?.email}
                  </p>
                </div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Current plan
                  </p>
                  <p className="mt-1 text-base font-bold text-app-text">
                    {resolvePlanLabel(user?.plan)}
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Credits
                  </p>
                  <p className="mt-1 text-base font-bold text-app-text">
                    {typeof user?.credits === "number" ? user.credits : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className="ui-card bg-app-surface p-5">
              <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">
                Quick actions
              </p>
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={isRefreshing}
                  className="ui-btn-secondary inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-65"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                  {isRefreshing ? "Refreshing..." : "Refresh Profile"}
                </button>
                <Link
                  href="/billing"
                  className="ui-btn-primary inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg text-sm font-bold"
                >
                  <CreditCard className="h-4 w-4" />
                  Open Billing
                </Link>
                <button
                  type="button"
                  onClick={logout}
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-app-danger/35 bg-app-danger-soft text-sm font-bold text-app-danger transition-colors hover:border-app-danger/60"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>

            <div className="ui-card bg-app-surface p-5 lg:col-span-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Billing cycle
                  </p>
                  <p className="mt-1 text-sm font-bold text-app-text">
                    {user?.billingCycle || "Not available"}
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Next renewal
                  </p>
                  <p className="mt-1 text-sm font-bold text-app-text">
                    {formatDateTime(user?.nextBillingAt)}
                  </p>
                </div>
                <div className="rounded-xl border border-app-border bg-app-bg p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-app-text-muted">
                    Account status
                  </p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-emerald-600 dark:text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" />
                    Active
                  </p>
                </div>
              </div>
              <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-app-text-muted">
                <ShieldCheck className="h-3.5 w-3.5" />
                Google sign-in is active and your profile is synced from the auth backend.
              </p>
            </div>
          </div>
        )}
      </PageShell>

      {isLoginModalOpen ? (
        <GoogleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      ) : null}
    </>
  );
}
