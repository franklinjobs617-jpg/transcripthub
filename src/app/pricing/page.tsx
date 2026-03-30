"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  Globe,
  Loader2,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { PAYMENTS_ENABLED, PAYPAL_CLIENT_ID } from "@/lib/payment-config";
import { createPayment, verifyPayment } from "@/lib/payment-gateway-client";
import { trackPaymentEvent } from "@/lib/payment-tracking";
import type { BillingCycle, PayPalIntent, PaymentPlanCode } from "@/lib/payment-types";

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
  paypalIntent?: PayPalIntent;
};

const paypalClientId = PAYPAL_CLIENT_ID;

export default function PricingPage() {
  const { user, refreshUser } = useAuth();
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("yearly");
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [paypalProcessingPlan, setPaypalProcessingPlan] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState("");
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const plans = useMemo<Plan[]>(() => {
    const isYearly = billingCycle === "yearly";

    return [
      {
        name: "Free",
        description: "Best for testing transcript quality on short clips.",
        price: "$0",
        period: "/forever",
        helper: "No card required",
        credits: "3 credits / month",
        features: [
          "1-minute preview",
          "No signup to try",
          "1-click copy",
          "Community support",
        ],
        cta: "Start Free",
        href: "/#hero",
      },
      {
        name: "Pro",
        description: "Built for creators and teams shipping content daily.",
        price: isYearly ? "$79" : "$9.9",
        period: isYearly ? "/year" : "/mo",
        helper: isYearly ? "$6.58/mo billed yearly" : "Monthly billing",
        credits: isYearly ? "1200 credits/yr" : "100 credits/mo",
        features: [
          "Full transcript export",
          "SRT / TXT / PDF export",
          "Up to 20-min video",
          "Priority queue",
          isYearly ? "Save $40 every year" : "Switch to yearly anytime",
        ],
        cta: "Choose Pro",
        planCode: isYearly ? "pro_yearly" : "pro_monthly",
        paypalIntent: "subscription",
        highlight: true,
        badge: isYearly ? "Best Value" : "Most Popular",
      },
      {
        name: "Pay As You Go",
        description: "Flexible one-time credits with no subscription.",
        price: "$29",
        period: "/one-time",
        helper: "Credits never expire",
        credits: "150 credits total",
        features: [
          "All Pro export formats",
          "No monthly commitment",
          "Lifetime credit validity",
          "Fast checkout",
        ],
        cta: "Buy Credits",
        planCode: "payg_150",
        paypalIntent: "capture",
      },
    ];
  }, [billingCycle]);

  const currentPlanName = (user?.plan || "free").toLowerCase();

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
      planCode: plan.planCode,
      billingCycle,
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
      trackPaymentEvent("pay_verify_fail", {
        channel: "paypal",
        planCode: plan.planCode,
        code: verified.error.code,
      });
      return;
    }

    if (verified.data.paymentStatus === "failed") {
      setPaymentError("Payment verification failed. Please retry.");
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
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <section className="mb-10 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-app-text sm:text-4xl lg:text-5xl">
          Simple pricing, <span className="text-app-primary">no friction.</span>
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-app-text-muted sm:text-base">
          Start free, then upgrade when your content velocity grows.
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-app-border bg-app-surface px-3 py-1 text-xs font-semibold text-app-text-muted">
          <span className="inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Current plan: {currentPlanName === "premium" ? "Pro" : "Free"}
        </div>

        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-1 rounded-xl border border-app-border bg-app-surface p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setBillingCycle("monthly")}
              className={`h-9 cursor-pointer rounded-lg px-4 text-sm font-bold transition-all ${
                billingCycle === "monthly"
                  ? "bg-app-bg text-app-text shadow-sm ring-1 ring-app-border"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle("yearly")}
              className={`inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg px-4 text-sm font-bold transition-all ${
                billingCycle === "yearly"
                  ? "bg-app-primary text-app-primary-foreground shadow-md"
                  : "text-app-text-muted hover:text-app-text"
              }`}
            >
              Yearly
              <span
                className={`rounded-md px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                  billingCycle === "yearly"
                    ? "bg-white/25"
                    : "bg-emerald-500/15 text-emerald-700 dark:bg-emerald-400/15 dark:text-emerald-400"
                }`}
              >
                Save 33%
              </span>
            </button>
          </div>
        </div>
      </section>

      {paymentError ? (
        <div className="mb-6 rounded-2xl border border-app-danger/35 bg-app-danger-soft px-4 py-3 text-sm text-app-danger">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <p className="font-semibold">{paymentError}</p>
          </div>
        </div>
      ) : null}

      {!PAYMENTS_ENABLED ? (
        <div className="mb-6 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
          Payments are temporarily paused. You can continue using free preview now.
        </div>
      ) : null}

      <section className="mb-16 grid items-stretch gap-6 lg:grid-cols-3 xl:gap-8">
        {plans.map((plan) => (
          <article
            key={plan.name}
            className={`relative flex h-full flex-col overflow-hidden rounded-3xl border transition-all duration-300 ${
              plan.highlight
                ? "z-10 border-app-primary bg-app-surface shadow-xl shadow-app-primary/5 lg:-translate-y-2 ring-1 ring-app-primary/20"
                : "border-app-border bg-app-surface shadow-sm hover:shadow-md"
            }`}
          >
            {plan.highlight ? <div className="absolute inset-x-0 top-0 h-1.5 bg-app-primary" /> : null}

            <div className="p-6 pb-0 sm:p-8 sm:pb-0">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h3
                    className={`text-lg font-black tracking-tight ${
                      plan.highlight ? "text-app-primary" : "text-app-text"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-1.5 min-h-[40px] text-xs leading-relaxed text-app-text-muted sm:text-sm">
                    {plan.description}
                  </p>
                </div>
                {plan.badge ? (
                  <span className="shrink-0 rounded-full bg-app-primary px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-app-primary-foreground">
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              <div className="mb-5">
                <div className="flex items-end gap-1.5">
                  <span className="text-4xl font-black tracking-tight text-app-text sm:text-5xl">
                    {plan.price}
                  </span>
                  {plan.period ? (
                    <span className="pb-1.5 text-sm font-bold text-app-text-muted">{plan.period}</span>
                  ) : null}
                </div>
                {plan.helper ? (
                  <p className="mt-1 text-xs font-semibold text-app-text-muted">{plan.helper}</p>
                ) : null}
              </div>

              <div
                className={`mb-6 flex items-center gap-3 rounded-xl border p-3 ${
                  plan.highlight
                    ? "border-app-primary/20 bg-app-primary/5"
                    : "border-app-border bg-app-bg"
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    plan.highlight
                      ? "bg-app-primary text-app-primary-foreground"
                      : "border border-app-border bg-app-surface text-app-primary"
                  }`}
                >
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-black text-app-text">{plan.credits}</p>
                </div>
              </div>

              <ul className="mb-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <span
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                        plan.highlight
                          ? "bg-app-primary text-app-primary-foreground"
                          : "bg-app-primary/10 text-app-primary"
                      }`}
                    >
                      <Check className="h-2.5 w-2.5" strokeWidth={3} />
                    </span>
                    <span className="font-semibold text-app-text">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-auto p-6 pt-0 sm:p-8 sm:pt-0">
              {!plan.planCode ? (
                <Link
                  href={plan.href || "/#hero"}
                  className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition-all ${
                    plan.highlight
                      ? "ui-btn-primary"
                      : "border border-app-border bg-app-bg text-app-text hover:border-app-primary/50 hover:bg-app-surface"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleStripePayment(plan)}
                    disabled={!PAYMENTS_ENABLED || loadingPlan === plan.planCode}
                    className={`flex h-11 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition-all ${
                      plan.highlight
                        ? "ui-btn-primary"
                        : "border border-app-border bg-app-bg text-app-text hover:border-app-primary/50 hover:bg-app-surface"
                    } ${
                      !PAYMENTS_ENABLED || loadingPlan === plan.planCode
                        ? "cursor-not-allowed opacity-70"
                        : "cursor-pointer"
                    }`}
                  >
                    {loadingPlan === plan.planCode ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Opening checkout...
                      </>
                    ) : (
                      <>
                        Pay with Stripe
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  {!paypalClientId ? (
                    <p className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-muted">
                      PayPal is not configured yet.
                    </p>
                  ) : !PAYMENTS_ENABLED ? (
                    <p className="rounded-lg border border-app-border bg-app-bg px-3 py-2 text-xs text-app-text-muted">
                      PayPal checkout is currently paused.
                    </p>
                  ) : !user ? (
                    <button
                      type="button"
                      onClick={() => setIsLoginModalOpen(true)}
                      className="h-11 w-full cursor-pointer rounded-xl border border-app-border bg-app-bg text-sm font-bold text-app-text hover:border-app-primary/40"
                    >
                      Sign in for PayPal checkout
                    </button>
                  ) : (
                    <PayPalScriptProvider
                      options={{
                        clientId: paypalClientId,
                        currency: "USD",
                        intent: plan.paypalIntent === "subscription" ? "subscription" : "capture",
                        vault: plan.paypalIntent === "subscription",
                      }}
                    >
                      <div className="rounded-xl border border-app-border bg-app-bg p-2">
                        <PayPalButtons
                          style={{
                            layout: "vertical",
                            color: "gold",
                            shape: "pill",
                            label: plan.paypalIntent === "subscription" ? "subscribe" : "pay",
                            height: 42,
                          }}
                          forceReRender={[plan.planCode, plan.paypalIntent, billingCycle]}
                          createOrder={
                            plan.paypalIntent === "capture"
                              ? async () => {
                                  const created = await createPayment({
                                    channel: "paypal",
                                    planCode: plan.planCode!,
                                    billingCycle,
                                    paypalIntent: "capture",
                                  });
                                  if (!created.ok || !created.data.orderId) {
                                    setPaymentError(
                                      created.ok
                                        ? "PayPal order was not created."
                                        : created.error.message
                                    );
                                    trackPaymentEvent("pay_create_fail", {
                                      channel: "paypal",
                                      planCode: plan.planCode,
                                      code: created.ok ? "PAYPAL_ORDER_ID_MISSING" : created.error.code,
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
                          createSubscription={
                            plan.paypalIntent === "subscription"
                              ? async () => {
                                  const created = await createPayment({
                                    channel: "paypal",
                                    planCode: plan.planCode!,
                                    billingCycle,
                                    paypalIntent: "subscription",
                                  });
                                  if (!created.ok || !created.data.subscriptionId) {
                                    setPaymentError(
                                      created.ok
                                        ? "PayPal subscription was not created."
                                        : created.error.message
                                    );
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
                            await handlePayPalApprove(plan, {
                              orderId: data.orderID ?? undefined,
                              subscriptionId: data.subscriptionID ?? undefined,
                            });
                          }}
                          onCancel={() => {
                            trackPaymentEvent("pay_create_fail", {
                              channel: "paypal",
                              planCode: plan.planCode,
                              code: "USER_CANCELLED",
                            });
                          }}
                          onError={() => {
                            setPaymentError("PayPal checkout failed. Please retry.");
                            trackPaymentEvent("pay_create_fail", {
                              channel: "paypal",
                              planCode: plan.planCode,
                              code: "PAYPAL_BUTTON_ERROR",
                            });
                          }}
                        />
                      </div>
                    </PayPalScriptProvider>
                  )}

                  {paypalProcessingPlan === plan.planCode ? (
                    <p className="text-xs font-semibold text-app-text-muted">Finalizing PayPal payment...</p>
                  ) : null}
                </div>
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="mb-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: "Fast Publish Loop",
            desc: "From link to export in one workflow.",
          },
          {
            icon: ShieldCheck,
            title: "Secure Payments",
            desc: "256-bit SSL encrypted checkout via Stripe & PayPal.",
          },
          {
            icon: Globe,
            title: "Global Access",
            desc: "Fast delivery anywhere, anytime for creators globally.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="flex flex-col items-center rounded-2xl border border-app-border bg-app-surface p-5 text-center shadow-sm"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-app-primary/10 text-app-primary">
              <item.icon className="h-4 w-4" />
            </div>
            <h2 className="mt-3 text-xs font-black uppercase tracking-wide text-app-text">
              {item.title}
            </h2>
            <p className="mt-1 text-xs text-app-text-muted">{item.desc}</p>
          </div>
        ))}
      </section>

      <section id="faq" className="mx-auto mb-20 w-full max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-app-text sm:text-3xl">
          Frequently Asked Questions
        </h2>
        <div className="space-y-3">
          {[
            {
              q: "What is 1 credit?",
              a: "1 credit covers up to 3 minutes of transcription. Longer videos consume more credits proportionally.",
            },
            {
              q: "Can I switch from monthly to yearly later?",
              a: "Yes. You can switch billing cycles anytime from your account settings.",
            },
            {
              q: "Do Pay As You Go credits expire?",
              a: "No. One-time credits stay in your account until you use them all.",
            },
            {
              q: "Is the payment secure?",
              a: "Absolutely. We use industry standard Stripe and PayPal checkouts for all transactions with 256-bit SSL encryption.",
            },
          ].map((faq) => (
            <details
              key={faq.q}
              className="group rounded-2xl border border-app-border bg-app-surface"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-bold text-app-text hover:text-app-primary sm:p-5">
                {faq.q}
                <ChevronDown className="h-4 w-4 text-app-text-muted transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t border-app-border px-4 pb-4 pt-3 text-xs leading-relaxed text-app-text-muted sm:px-5 sm:pb-5 sm:text-sm">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[2rem] border border-app-border bg-app-surface px-6 py-12 text-center shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-app-text sm:text-3xl">
          Ready to scale your output?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-app-text-muted sm:text-base">
          Join thousands of creators saving time on transcripts every day.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <Link
            href="/#hero"
            className="ui-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-black"
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
    </main>
  );
}
