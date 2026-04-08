"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Check,
  ChevronDown,
  Clock3,
  CreditCard,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import {
  PayPalButtons,
  PayPalScriptProvider,
  usePayPalScriptReducer,
} from "@paypal/react-paypal-js";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { PAYMENTS_ENABLED, PAYPAL_CLIENT_ID } from "@/lib/payment-config";
import { createPayment, verifyPayment } from "@/lib/payment-gateway-client";
import { trackPaymentEvent } from "@/lib/payment-tracking";
import type {
  BillingCycle,
  PayPalIntent,
  PaymentPlanCode,
} from "@/lib/payment-types";

type Plan = {
  name: string;
  description: string;
  price: string;
  period?: string;
  helper?: string;
  credits: string;
  features: string[];
  cta: string;
  href?: string;
  highlight?: boolean;
  badge?: string;
  planCode?: PaymentPlanCode;
  backendType?: string;
  paypalIntent?: PayPalIntent;
};

type PayPalCheckoutPaneProps = {
  billingCycle: BillingCycle;
  plan: Plan;
  paypalClientId: string;
  reloadSeed: number;
  processing: boolean;
  onRetry: () => void;
  onCreateOrder?: () => Promise<string>;
  onCreateSubscription?: () => Promise<string>;
  onApprove: (data: { orderId?: string; subscriptionId?: string }) => Promise<void>;
  onCancel: () => void;
  onError: () => void;
};

const paypalClientId = PAYPAL_CLIENT_ID;

function PayPalButtonsContent({
  plan,
  billingCycle,
  processing,
  onRetry,
  onCreateOrder,
  onCreateSubscription,
  onApprove,
  onCancel,
  onError,
}: Omit<PayPalCheckoutPaneProps, "paypalClientId" | "reloadSeed">) {
  const [{ isPending, isRejected }] = usePayPalScriptReducer();

  return (
    <div className="rounded-[1.35rem] border border-app-border/90 bg-white/80 p-3 shadow-[0_18px_50px_-34px_rgba(15,23,42,0.5)] backdrop-blur-sm dark:bg-app-bg/70">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-text-muted">
            PayPal
          </p>
          <p className="mt-1 text-sm font-semibold text-app-text">
            {plan.paypalIntent === "subscription"
              ? `Subscribe with PayPal ${billingCycle === "yearly" ? "yearly" : "monthly"}`
              : "Complete a one-time PayPal payment"}
          </p>
        </div>
        <span className="rounded-full border border-app-border bg-app-surface px-2.5 py-1 text-[11px] font-semibold text-app-text-muted">
          Secure popup checkout
        </span>
      </div>

      {isPending ? (
        <div className="space-y-2">
          <div className="h-11 animate-pulse rounded-full bg-app-primary-soft" />
          <div className="h-11 animate-pulse rounded-full bg-app-primary-soft/80" />
          <p className="text-xs text-app-text-muted">Loading PayPal checkout...</p>
        </div>
      ) : null}

      {isRejected ? (
        <div className="rounded-2xl border border-app-danger/25 bg-app-danger-soft/55 px-3 py-3 text-sm text-app-danger">
          <p className="font-semibold">PayPal failed to load.</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-app-danger/20 bg-white px-3 py-2 text-xs font-bold text-app-text transition hover:border-app-danger/40 dark:bg-app-surface"
          >
            Reload PayPal
          </button>
        </div>
      ) : null}

      <div className={isPending || isRejected ? "hidden" : "block"}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "pill",
            label: plan.paypalIntent === "subscription" ? "subscribe" : "pay",
            height: 46,
          }}
          forceReRender={[plan.planCode, plan.paypalIntent, billingCycle]}
          createOrder={plan.paypalIntent === "capture" ? onCreateOrder : undefined}
          createSubscription={
            plan.paypalIntent === "subscription" ? onCreateSubscription : undefined
          }
          onApprove={async (data) => {
            await onApprove({
              orderId: data.orderID ?? undefined,
              subscriptionId: data.subscriptionID ?? undefined,
            });
          }}
          onCancel={onCancel}
          onError={onError}
        />
      </div>

      {processing ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1.5 text-xs font-semibold text-app-text-muted">
          <Clock3 className="h-3.5 w-3.5" />
          Confirming your PayPal payment...
        </div>
      ) : null}
    </div>
  );
}

function PayPalCheckoutPane(props: PayPalCheckoutPaneProps) {
  const { plan, billingCycle, paypalClientId, reloadSeed } = props;
  const dataNamespace =
    plan.paypalIntent === "subscription" ? "paypal_sdk_subscriptions" : "paypal_sdk_capture";
  const providerKey =
    plan.paypalIntent === "subscription"
      ? `${plan.name}-${billingCycle}-${reloadSeed}`
      : `${plan.name}-${reloadSeed}`;

  return (
    <PayPalScriptProvider
      key={providerKey}
      options={{
        clientId: paypalClientId,
        currency: "USD",
        intent: plan.paypalIntent === "subscription" ? "subscription" : "capture",
        vault: plan.paypalIntent === "subscription",
        dataNamespace,
      }}
    >
      <PayPalButtonsContent {...props} />
    </PayPalScriptProvider>
  );
}

export default function PricingPage() {
  const { user, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paypalProcessingPlan, setPaypalProcessingPlan] = useState<string | null>(null);
  const [paypalReloadSeed, setPaypalReloadSeed] = useState(0);
  const [paymentError, setPaymentError] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const qs = new URLSearchParams(window.location.search);
      const returnUrl = qs.get("returnUrl");
      if (returnUrl) {
        window.sessionStorage.setItem("postPaymentRedirect", returnUrl);
      }
    }

    const resetCheckoutUiState = () => {
      setLoadingPlan(null);
      setPaypalProcessingPlan(null);
      setPaypalReloadSeed((prev) => prev + 1);
    };

    const onPageShow = () => {
      resetCheckoutUiState();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        resetCheckoutUiState();
      }
    };

    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const plans = useMemo<Plan[]>(() => {
    const isYearly = billingCycle === "yearly";

    return [
      {
        name: "Free",
        description: "Best for testing transcript quality on short clips.",
        price: "$0",
        period: "/forever",
        helper: "No card required",
        credits: "3 successful videos / month",
        features: ["1-minute preview", "Supports source video download", "No signup to try", "1-click copy"],
        cta: "Start Free",
        href: "/#hero",
      },
      {
        name: "Pro",
        description: "Built for creators and teams shipping content daily.",
        price: isYearly ? "$79" : "$9.9",
        period: isYearly ? "/year" : "/mo",
        helper: isYearly ? "$6.58/mo billed yearly" : "Monthly billing",
        credits: isYearly ? "1200 successful videos / year" : "100 successful videos / month",
        features: [
          "Full transcript export",
          "SRT, TXT and PDF download",
          "Supports source video download",
          "Up to 20-minute video",
          "Priority processing",
          isYearly ? "Save $40 every year" : "Switch to yearly anytime",
        ],
        cta: "Choose Pro",
        planCode: isYearly ? "pro_yearly" : "pro_monthly",
        backendType: isYearly ? "transcripthub_pro_yearly" : "transcripthub_pro_monthly",
        paypalIntent: "subscription",
        highlight: true,
        badge: isYearly ? "Most Chosen" : "Popular",
      },
      {
        name: "Pay As You Go",
        description: "Flexible one-time credits with no subscription.",
        price: "$29",
        period: "/once",
        helper: "Credits never expire",
        credits: "150 successful videos total",
        features: [
          "All Pro export formats",
          "Supports source video download",
          "No recurring billing",
          "Lifetime credit validity",
          "Fast one-time checkout",
        ],
        cta: "Buy Credits",
        planCode: "payg_150",
        backendType: "pay_as_you_go",
        paypalIntent: "capture",
      },
    ];
  }, [billingCycle]);

  const currentPlanName = (user?.plan || "free").toLowerCase();

  function bumpPaypalReloadSeed() {
    setPaypalReloadSeed((prev) => prev + 1);
  }

  function ensureLoggedIn(): boolean {
    if (user?.email) return true;
    setIsLoginModalOpen(true);
    return false;
  }

  async function handleStripePayment(plan: Plan) {
    if (!plan.planCode) return;
    if (!PAYMENTS_ENABLED) {
      setPaymentError("Payments are temporarily unavailable.");
      return;
    }
    if (!ensureLoggedIn()) return;

    setPaymentError("");
    setLoadingPlan(plan.planCode);
    trackPaymentEvent("pay_create_start", {
      channel: "stripe",
      planCode: plan.planCode,
      billingCycle,
    });

    const created = await createPayment({
      channel: "stripe",
      type: plan.backendType,
      project: "transcripthub",
      googleUserId: user?.googleUserId,
    });

    setLoadingPlan(null);

    if (!created.ok) {
      setPaymentError(created.error.message || "Failed to create Stripe checkout.");
      trackPaymentEvent("pay_create_fail", {
        channel: "stripe",
        planCode: plan.planCode,
        code: created.error.code,
      });
      return;
    }

    if (!created.data.checkoutUrl) {
      setPaymentError("Billing service did not return a checkout URL.");
      trackPaymentEvent("pay_create_fail", {
        channel: "stripe",
        planCode: plan.planCode,
        code: "CHECKOUT_URL_MISSING",
      });
      return;
    }

    trackPaymentEvent("pay_create_success", {
      channel: "stripe",
      planCode: plan.planCode,
    });

    window.location.assign(created.data.checkoutUrl);
  }

  async function handlePayPalApprove(
    plan: Plan,
    payload: { orderId?: string; subscriptionId?: string }
  ) {
    if (!plan.planCode || !plan.paypalIntent) return;
    setPaymentError("");
    setPaypalProcessingPlan(plan.planCode);

    const verified = await verifyPayment({
      channel: "paypal",
      paypalIntent: plan.paypalIntent,
      orderId: payload.orderId,
      subscriptionId: payload.subscriptionId,
    });

    setPaypalProcessingPlan(null);

    if (!verified.ok) {
      setPaymentError(verified.error.message || "PayPal verification failed.");
      bumpPaypalReloadSeed();
      trackPaymentEvent("pay_verify_fail", {
        channel: "paypal",
        planCode: plan.planCode,
        code: verified.error.code,
      });
      return;
    }

    if (verified.data.paymentStatus === "failed") {
      setPaymentError("Payment verification failed. Please retry.");
      bumpPaypalReloadSeed();
      trackPaymentEvent("pay_verify_fail", {
        channel: "paypal",
        planCode: plan.planCode,
        code: "PAYMENT_FAILED",
      });
      return;
    }

    trackPaymentEvent("pay_verify_success", {
      channel: "paypal",
      planCode: plan.planCode,
      paymentStatus: verified.data.paymentStatus,
    });

    await refreshUser();
    const params = new URLSearchParams({
      channel: "paypal",
      paymentStatus: verified.data.paymentStatus,
    });
    if (payload.orderId) params.set("order_id", payload.orderId);
    if (payload.subscriptionId) params.set("subscription_id", payload.subscriptionId);
    window.location.assign(`/payment/success?${params.toString()}`);
  }

  return (
    <main className="ui-page-bg relative overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,rgba(59,102,204,0.16),transparent_56%)]" />
      <div className="pointer-events-none absolute right-[-8rem] top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(122,92,255,0.12),transparent_68%)] blur-3xl" />

      <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.25rem] border border-app-border/80 bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(248,250,252,0.9))] px-6 py-8 shadow-[0_36px_90px_-52px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-[linear-gradient(180deg,rgba(24,24,27,0.94),rgba(9,9,11,0.96))] sm:px-8 lg:px-10 lg:py-10">
          <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(59,102,204,0.6),transparent)]" />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.9fr)] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-bg/80 px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] text-app-text-muted">
                <Sparkles className="h-3.5 w-3.5 text-app-accent" />
                Pricing
              </div>
              <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.04em] text-app-text sm:text-5xl lg:text-6xl">
                Choose a plan that matches how often you turn videos into usable text.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-app-text-muted sm:text-base">
                Start with free previews, upgrade for full exports and longer
                videos, or buy credits once for flexible one-off work.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-app-text-muted">
                <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-bg px-3 py-1.5 font-semibold">
                  <BadgeCheck className="h-4 w-4 text-emerald-500" />
                  Current plan: {currentPlanName === "premium" ? "Pro" : "Free"}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-app-border bg-app-bg px-3 py-1.5 font-semibold">
                  <ShieldCheck className="h-4 w-4 text-app-accent" />
                  Stripe and PayPal supported
                </span>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-app-border bg-app-bg/80 p-5 shadow-[0_20px_50px_-38px_rgba(15,23,42,0.55)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-text-muted">
                    Billing
                  </p>
                  <p className="mt-1 text-xl font-black text-app-text">
                    Choose your billing style
                  </p>
                </div>
                <span className="rounded-full bg-emerald-500/12 px-3 py-1 text-xs font-black text-emerald-700 dark:text-emerald-300">
                  Save 33%
                </span>
              </div>

              <div className="mt-5 inline-flex w-full items-center gap-1 rounded-2xl border border-app-border bg-app-surface p-1.5">
                <button
                  type="button"
                  onClick={() => setBillingCycle("monthly")}
                  className={`flex-1 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all ${billingCycle === "monthly"
                    ? "bg-app-bg text-app-text shadow-sm ring-1 ring-app-border"
                    : "text-app-text-muted hover:text-app-text"
                    }`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle("yearly")}
                  className={`flex-1 cursor-pointer rounded-xl px-4 py-3 text-sm font-black transition-all ${billingCycle === "yearly"
                    ? "ui-btn-primary"
                    : "text-app-text-muted hover:text-app-text"
                    }`}
                >
                  Yearly
                </button>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-app-border bg-app-surface px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-app-text-muted">
                    Best value
                  </p>
                  <p className="mt-1 text-sm font-semibold text-app-text">
                    Yearly Pro lowers the monthly cost
                  </p>
                </div>
                <div className="rounded-2xl border border-app-border bg-app-surface px-4 py-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-app-text-muted">
                    Flexible option
                  </p>
                  <p className="mt-1 text-sm font-semibold text-app-text">
                    Buy credits once and use them anytime
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {paymentError ? (
          <div className="mt-6 rounded-[1.4rem] border border-app-danger/25 bg-app-danger-soft/70 px-4 py-3 text-sm text-app-danger">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="font-semibold">{paymentError}</p>
            </div>
          </div>
        ) : null}

        {!PAYMENTS_ENABLED ? (
          <div className="mt-6 rounded-[1.4rem] border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
            Payments are temporarily paused. Free preview still works normally.
          </div>
        ) : null}

        <section className="mt-10 grid items-stretch gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <article
              key={plan.name}
              className={`relative flex h-full flex-col overflow-hidden rounded-[2rem] border transition-transform duration-300 hover:-translate-y-1 ${plan.highlight
                ? "border-app-accent/35 bg-[linear-gradient(180deg,rgba(59,102,204,0.14),rgba(255,255,255,0.97)_18%,rgba(255,255,255,0.99)_100%)] shadow-[0_32px_90px_-46px_rgba(59,102,204,0.5)] dark:bg-[linear-gradient(180deg,rgba(59,102,204,0.2),rgba(9,9,11,0.95)_18%,rgba(9,9,11,0.98)_100%)]"
                : "border-app-border bg-app-surface shadow-[0_24px_70px_-48px_rgba(15,23,42,0.38)]"
                }`}
            >
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text-muted">
                      {plan.name}
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-app-text">
                      {plan.price}
                      {plan.period ? (
                        <span className="ml-1 text-base font-bold text-app-text-muted">
                          {plan.period}
                        </span>
                      ) : null}
                    </h2>
                    {plan.helper ? (
                      <p className="mt-2 text-sm font-semibold text-app-text-muted">
                        {plan.helper}
                      </p>
                    ) : null}
                  </div>

                  {plan.badge ? (
                    <span className="rounded-full border border-app-accent/20 bg-app-accent-soft px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-app-accent">
                      {plan.badge}
                    </span>
                  ) : null}
                </div>

                <p className="mt-5 max-w-xs text-sm leading-6 text-app-text-muted">
                  {plan.description}
                </p>

                <div
                  className={`mt-6 rounded-[1.4rem] border px-4 py-4 ${plan.highlight
                    ? "border-app-accent/15 bg-white/70 dark:bg-app-bg/55"
                    : "border-app-border bg-app-bg/75"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-app-primary text-app-primary-foreground">
                      <Zap className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-app-text-muted">
                        Credits
                      </p>
                      <p className="text-sm font-black text-app-text">
                        {plan.credits}
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-app-accent/10 text-app-accent">
                        <Check className="h-3 w-3" strokeWidth={3} />
                      </span>
                      <span className="font-semibold text-app-text">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto border-t border-app-border/80 px-6 py-6 sm:px-7">
                {!plan.planCode ? (
                  <Link
                    href={plan.href || "/#hero"}
                    className="ui-btn-primary inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-[11px] font-black uppercase tracking-[0.2em] text-app-text-muted">
                        Checkout
                      </p>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-app-text-muted">
                        <CreditCard className="h-3.5 w-3.5" />
                        Stripe + PayPal
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleStripePayment(plan)}
                      disabled={!PAYMENTS_ENABLED || loadingPlan === plan.planCode}
                      className={`ui-btn-primary flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black ${!PAYMENTS_ENABLED || loadingPlan === plan.planCode
                        ? "cursor-not-allowed opacity-70"
                        : ""
                        }`}
                    >
                      {loadingPlan === plan.planCode ? (
                        <>
                          <Clock3 className="h-4 w-4 animate-pulse" />
                          Opening Stripe checkout...
                        </>
                      ) : (
                        <>
                          Pay with Stripe
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    {!paypalClientId ? (
                      <div className="rounded-[1.35rem] border border-app-border bg-app-bg px-4 py-4 text-sm text-app-text-muted">
                        PayPal is not configured yet.
                      </div>
                    ) : !PAYMENTS_ENABLED ? (
                      <div className="rounded-[1.35rem] border border-app-border bg-app-bg px-4 py-4 text-sm text-app-text-muted">
                        PayPal checkout is currently paused.
                      </div>
                    ) : !user ? (
                      <div className="rounded-[1.35rem] border border-app-border bg-app-bg p-4">
                        <p className="text-sm font-semibold text-app-text">
                          Sign in to unlock PayPal checkout
                        </p>
                        <p className="mt-1 text-sm text-app-text-muted">
                          We show the payment path up front, but account credits are
                          attached after login.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsLoginModalOpen(true)}
                          className="mt-4 inline-flex h-11 w-full cursor-pointer items-center justify-center rounded-2xl border border-app-border bg-app-surface text-sm font-black text-app-text transition hover:border-app-accent/35 hover:bg-app-accent-soft/35"
                        >
                          Sign in for PayPal
                        </button>
                      </div>
                    ) : (
                      <PayPalCheckoutPane
                        billingCycle={billingCycle}
                        plan={plan}
                        paypalClientId={paypalClientId}
                        reloadSeed={paypalReloadSeed}
                        processing={paypalProcessingPlan === plan.planCode}
                        onRetry={bumpPaypalReloadSeed}
                        onCreateOrder={
                          plan.paypalIntent === "capture"
                            ? async () => {
                              const created = await createPayment({
                                channel: "paypal",
                                planCode: plan.planCode!,
                                type: plan.backendType,
                                project: "transcripthub",
                                googleUserId: user?.googleUserId,
                                billingCycle,
                                paypalIntent: "capture",
                              });

                              if (
                                created.ok &&
                                !created.data.orderId &&
                                created.data.approvalUrl
                              ) {
                                window.location.assign(created.data.approvalUrl);
                                return "";
                              }

                              if (
                                created.ok &&
                                typeof created.data.orderId === "string" &&
                                created.data.orderId.startsWith("http")
                              ) {
                                window.location.assign(created.data.orderId);
                                return "";
                              }

                              if (!created.ok || !created.data.orderId) {
                                setPaymentError(
                                  created.ok
                                    ? "PayPal order was not created."
                                    : created.error.message
                                );
                                bumpPaypalReloadSeed();
                                trackPaymentEvent("pay_create_fail", {
                                  channel: "paypal",
                                  planCode: plan.planCode,
                                  code: created.ok
                                    ? "PAYPAL_ORDER_ID_MISSING"
                                    : created.error.code,
                                });
                                return "";
                              }

                              trackPaymentEvent("pay_create_success", {
                                channel: "paypal",
                                planCode: plan.planCode,
                                intent: "capture",
                              });
                              return created.data.orderId;
                            }
                            : undefined
                        }
                        onCreateSubscription={
                          plan.paypalIntent === "subscription"
                            ? async () => {
                              const created = await createPayment({
                                channel: "paypal",
                                planCode: plan.planCode!,
                                type: plan.backendType,
                                project: "transcripthub",
                                googleUserId: user?.googleUserId,
                                billingCycle,
                                paypalIntent: "subscription",
                              });

                              if (
                                created.ok &&
                                !created.data.subscriptionId &&
                                created.data.approvalUrl
                              ) {
                                window.location.assign(created.data.approvalUrl);
                                return "";
                              }

                              if (
                                created.ok &&
                                typeof created.data.subscriptionId === "string" &&
                                created.data.subscriptionId.startsWith("http")
                              ) {
                                window.location.assign(created.data.subscriptionId);
                                return "";
                              }

                              if (!created.ok || !created.data.subscriptionId) {
                                setPaymentError(
                                  created.ok
                                    ? "PayPal subscription was not created."
                                    : created.error.message
                                );
                                bumpPaypalReloadSeed();
                                trackPaymentEvent("pay_create_fail", {
                                  channel: "paypal",
                                  planCode: plan.planCode,
                                  code: created.ok
                                    ? "PAYPAL_SUBSCRIPTION_ID_MISSING"
                                    : created.error.code,
                                });
                                return "";
                              }

                              trackPaymentEvent("pay_create_success", {
                                channel: "paypal",
                                planCode: plan.planCode,
                                intent: "subscription",
                              });
                              return created.data.subscriptionId;
                            }
                            : undefined
                        }
                        onApprove={async (data) => {
                          await handlePayPalApprove(plan, data);
                        }}
                        onCancel={() => {
                          setPaymentError(
                            "PayPal checkout was cancelled. The button has been refreshed and is ready again."
                          );
                          bumpPaypalReloadSeed();
                          trackPaymentEvent("pay_create_fail", {
                            channel: "paypal",
                            planCode: plan.planCode,
                            code: "USER_CANCELLED",
                          });
                        }}
                        onError={() => {
                          setPaymentError("PayPal checkout failed. Please retry.");
                          bumpPaypalReloadSeed();
                          trackPaymentEvent("pay_create_fail", {
                            channel: "paypal",
                            planCode: plan.planCode,
                            code: "PAYPAL_BUTTON_ERROR",
                          });
                        }}
                      />
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr]">
          <div className="rounded-[1.8rem] border border-app-border bg-app-surface px-6 py-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)]">
            <p className="text-[11px] font-black uppercase tracking-[0.22em] text-app-text-muted">
              What changes when you upgrade
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-app-text">
              More output, cleaner files, fewer interruptions.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-app-text-muted">
              Paid plans are designed for real production work: longer uploads,
              export-friendly transcripts, and a faster path from link to usable
              content.
            </p>
          </div>

          {[
            {
              icon: ShieldCheck,
              title: "Secure checkout",
              desc: "Pay with Stripe or PayPal using a familiar, trusted flow.",
            },
            {
              icon: BadgeCheck,
              title: "Clear credit value",
              desc: "Each plan shows exactly how many credits you receive.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[1.8rem] border border-app-border bg-app-surface px-5 py-6 shadow-[0_20px_60px_-42px_rgba(15,23,42,0.45)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-app-accent-soft text-app-accent">
                <item.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-black tracking-[-0.03em] text-app-text">
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-app-text-muted">
                {item.desc}
              </p>
            </div>
          ))}
        </section>

        <section id="faq" className="mx-auto mt-14 w-full max-w-3xl">
          <h2 className="text-center text-2xl font-black tracking-[-0.04em] text-app-text sm:text-3xl">
            Frequently asked questions
          </h2>
          <div className="mt-6 space-y-3">
            {[
              {
                q: "What is 1 credit?",
                a: "1 credit equals 1 successful video conversion, regardless of the video length.",
              },
              {
                q: "Can I switch from monthly to yearly later?",
                a: "Yes. You can move to yearly any time from your account flow.",
              },
              {
                q: "Do pay-as-you-go credits expire?",
                a: "No. One-time credits stay available until you use them.",
              },
              {
                q: "If I cancel PayPal, do I need to reload the page?",
                a: "No. You can return to pricing and continue checkout again right away.",
              },
            ].map((faq) => (
              <details
                key={faq.q}
                className="group rounded-[1.4rem] border border-app-border bg-app-surface px-4 py-2 shadow-[0_20px_60px_-48px_rgba(15,23,42,0.38)]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-sm font-black text-app-text">
                  {faq.q}
                  <ChevronDown className="h-4 w-4 text-app-text-muted transition-transform group-open:rotate-180" />
                </summary>
                <p className="pb-3 text-sm leading-7 text-app-text-muted">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="mt-14 rounded-[2rem] border border-app-border bg-app-surface px-6 py-10 text-center shadow-[0_30px_80px_-50px_rgba(15,23,42,0.42)] sm:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-app-text-muted">
            Start small, scale when needed
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-app-text sm:text-4xl">
            Use free previews first, then upgrade only when the workload justifies it.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-app-text-muted sm:text-base">
            Whether you need a recurring transcript workflow or one batch of
            credits, the checkout path stays quick and straightforward.
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href="/#hero"
              className="ui-btn-primary inline-flex h-12 items-center justify-center rounded-2xl px-6 text-sm font-black"
            >
              Start For Free
            </Link>
          </div>
        </section>

        {isLoginModalOpen ? (
          <GoogleLoginModal
            isOpen={isLoginModalOpen}
            onClose={() => setIsLoginModalOpen(false)}
          />
        ) : null}
      </div>
    </main>
  );
}
