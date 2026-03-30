"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CreditCard,
  ExternalLink,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { createBillingPortal, fetchBillingOrders } from "@/lib/payment-gateway-client";
import type { BillingOrderItem } from "@/lib/payment-types";
import { trackPaymentEvent } from "@/lib/payment-tracking";

function formatCurrency(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function normalizeStatus(status: string): "paid" | "pending" | "failed" {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("paid") ||
    normalized.includes("success") ||
    normalized.includes("succeed") ||
    normalized.includes("completed") ||
    normalized.includes("active")
  ) {
    return "paid";
  }
  if (normalized.includes("pending") || normalized.includes("processing")) {
    return "pending";
  }
  return "failed";
}

export default function BillingPage() {
  const { user, isLoading, refreshUser } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orders, setOrders] = useState<BillingOrderItem[]>([]);
  const [ordersError, setOrdersError] = useState("");
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState("");

  const planLabel = useMemo(() => {
    const plan = (user?.plan || "free").toLowerCase();
    if (plan === "premium" || plan.includes("pro")) return "Pro";
    return "Free";
  }, [user?.plan]);

  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;
    const loadOrders = async () => {
      setOrdersLoading(true);
      setOrdersError("");
      const response = await fetchBillingOrders();
      if (cancelled) return;
      if (!response.ok) {
        setOrdersError(response.error.message || "Failed to load billing orders.");
        setOrdersLoading(false);
        return;
      }
      setOrders(response.data);
      setOrdersLoading(false);
    };

    void loadOrders();
    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  async function onOpenPortal() {
    if (!user?.email) {
      setIsLoginModalOpen(true);
      return;
    }

    setPortalError("");
    setPortalLoading(true);
    trackPaymentEvent("billing_portal_open", { source: "billing_page" });
    const response = await createBillingPortal();
    setPortalLoading(false);

    if (!response.ok) {
      setPortalError(response.error.message || "Failed to open billing portal.");
      return;
    }
    window.location.href = response.data.url;
  }

  async function onRefreshBilling() {
    if (!user?.email) return;
    setOrdersLoading(true);
    setOrdersError("");
    await refreshUser();
    const response = await fetchBillingOrders();
    setOrdersLoading(false);
    if (!response.ok) {
      setOrdersError(response.error.message || "Failed to refresh billing data.");
      return;
    }
    setOrders(response.data);
  }

  if (!isLoading && !user) {
    return (
      <main className="mx-auto flex min-h-[70vh] w-full max-w-4xl items-center px-4 py-12 sm:px-6">
        <section className="ui-card w-full bg-app-surface p-6 text-center sm:p-8">
          <h1 className="text-2xl font-extrabold text-app-text">Sign in to view billing</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            Billing details are available after sign-in.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setIsLoginModalOpen(true)}
              className="ui-btn-primary inline-flex h-11 cursor-pointer items-center justify-center rounded-xl px-5 text-sm font-bold"
            >
              Sign In with Google
            </button>
            <Link
              href="/pricing"
              className="ui-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
            >
              View Pricing
            </Link>
          </div>
          {isLoginModalOpen ? (
            <GoogleLoginModal
              isOpen={isLoginModalOpen}
              onClose={() => setIsLoginModalOpen(false)}
            />
          ) : null}
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <article className="ui-card bg-app-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Current Plan</p>
          <p className="mt-2 text-2xl font-extrabold text-app-text">{planLabel}</p>
          <p className="mt-1 text-xs text-app-text-muted">Managed by billing backend</p>
        </article>
        <article className="ui-card bg-app-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Credits</p>
          <p className="mt-2 text-2xl font-extrabold text-app-text">
            {typeof user?.credits === "number" ? user.credits : "-"}
          </p>
          <p className="mt-1 text-xs text-app-text-muted">Updated after successful verify</p>
        </article>
        <article className="ui-card bg-app-surface p-5">
          <p className="text-xs font-bold uppercase tracking-wide text-app-text-muted">Subscription</p>
          <p className="mt-2 text-sm font-semibold text-app-text">
            {user?.nextBillingAt ? `Renews on ${formatDateTime(user.nextBillingAt)}` : "No renewal date"}
          </p>
          <p className="mt-1 text-xs text-app-text-muted">
            {user?.billingCycle ? `Cycle: ${user.billingCycle}` : "Cycle unavailable"}
          </p>
        </article>
      </section>

      <section className="mb-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={() => void onOpenPortal()}
          disabled={portalLoading}
          className={`ui-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold ${
            portalLoading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
          }`}
        >
          {portalLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Opening...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4" />
              Manage Subscription
            </>
          )}
        </button>
        <button
          type="button"
          onClick={() => void onRefreshBilling()}
          className="ui-btn-secondary inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Billing Data
        </button>
      </section>

      {portalError ? (
        <div className="mb-4 rounded-xl border border-app-danger/40 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-semibold">{portalError}</p>
          </div>
        </div>
      ) : null}

      <section className="ui-card bg-app-surface p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="text-xl font-extrabold text-app-text">Recent Billing Orders</h1>
          <span className="rounded-full border border-app-border bg-app-bg px-3 py-1 text-xs font-semibold text-app-text-muted">
            {orders.length} records
          </span>
        </div>

        {ordersLoading ? (
          <div className="flex items-center gap-2 rounded-xl border border-app-border bg-app-bg px-4 py-3 text-sm text-app-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading billing orders...
          </div>
        ) : ordersError ? (
          <div className="rounded-xl border border-app-danger/40 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="font-semibold">{ordersError}</p>
            </div>
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-app-border bg-app-bg px-4 py-6 text-center text-sm text-app-text-muted">
            No billing orders found yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-app-border text-xs uppercase tracking-wide text-app-text-muted">
                  <th className="px-3 py-2">Order</th>
                  <th className="px-3 py-2">Channel</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Created At</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const normalizedStatus = normalizeStatus(order.status);
                  return (
                    <tr key={order.id} className="border-b border-app-border/60 text-app-text">
                      <td className="px-3 py-3 text-xs font-semibold">{order.id}</td>
                      <td className="px-3 py-3 capitalize">{order.channel}</td>
                      <td className="px-3 py-3">{order.planCode}</td>
                      <td className="px-3 py-3">{formatCurrency(order.amount, order.currency)}</td>
                      <td className="px-3 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                            normalizedStatus === "paid"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                              : normalizedStatus === "pending"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                              : "bg-app-danger-soft text-app-danger"
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-xs text-app-text-muted">
                        {formatDateTime(order.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        {normalizedStatus === "failed" ? (
                          <Link
                            href="/pricing"
                            className="inline-flex items-center gap-1 text-xs font-bold text-app-primary hover:underline"
                          >
                            <RefreshCw className="h-3.5 w-3.5" />
                            Retry
                          </Link>
                        ) : normalizedStatus === "paid" ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-300">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-app-text-muted">
                            <CreditCard className="h-3.5 w-3.5" />
                            Processing
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
