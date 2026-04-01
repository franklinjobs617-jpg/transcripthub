"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Clock3, Home, Loader2, RefreshCw, XCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPayment } from "@/lib/payment-gateway-client";
import type { PaymentChannel, PaymentVerifyRequest } from "@/lib/payment-types";
import { useAuth } from "@/components/providers/auth-provider";
import { trackPaymentEvent } from "@/lib/payment-tracking";

type VerifyStatus = "verifying" | "success" | "pending" | "error";

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState<VerifyStatus>("verifying");
  const [message, setMessage] = useState("Verifying your payment status...");
  const [attemptCount, setAttemptCount] = useState(0);
  const successRedirectTimerRef = useRef<number | null>(null);
  const channelParam = searchParams.get("channel");

  const verifyRequest = useMemo<PaymentVerifyRequest | null>(() => {
    const channel: PaymentChannel =
      channelParam === "paypal" || channelParam === "stripe"
        ? channelParam
        : searchParams.get("session_id")
          ? "stripe"
          : "paypal";

    const sessionId = searchParams.get("session_id") || undefined;
    const orderId = searchParams.get("order_id") || undefined;
    const subscriptionId = searchParams.get("subscription_id") || undefined;
    const payerId = searchParams.get("payer_id") || undefined;

    if (!sessionId && !orderId && !subscriptionId) {
      return null;
    }

    return {
      channel,
      sessionId,
      orderId,
      subscriptionId,
      payerId,
      paypalIntent: subscriptionId ? "subscription" : orderId ? "capture" : undefined,
    };
  }, [channelParam, searchParams]);

  useEffect(() => {
    let cancelled = false;

    const runVerification = async () => {
      if (!verifyRequest) {
        if (channelParam === "stripe") {
          router.replace("/payment/cancel?channel=stripe");
          return;
        }
        setStatus("error");
        setMessage("Missing payment identifiers. Please contact support if you were charged.");
        return;
      }

      const maxAttempts = verifyRequest.channel === "stripe" ? 30 : 12;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        if (cancelled) return;
        setAttemptCount(attempt);

        const result = await verifyPayment(verifyRequest);
        if (!result.ok) {
          if (attempt === maxAttempts) {
            setStatus("error");
            setMessage(result.error.message || "Could not verify payment.");
            trackPaymentEvent("pay_verify_fail", {
              channel: verifyRequest.channel,
              code: result.error.code,
              attempt,
            });
            return;
          }
          setMessage("Finalizing your payment. Please wait...");
          await wait(2000);
          continue;
        }

        if (verifyRequest.channel === "stripe") {
          if (result.data.paymentStatus === "paid") {
            await refreshUser();
            setStatus("success");
            setMessage("Payment confirmed and your credits were added. Redirecting...");
            trackPaymentEvent("pay_verify_success", {
              channel: verifyRequest.channel,
              paymentStatus: result.data.paymentStatus,
            });

            const postPaymentRedirect = window.sessionStorage.getItem("postPaymentRedirect");
            if (postPaymentRedirect) {
              window.sessionStorage.removeItem("postPaymentRedirect");
              successRedirectTimerRef.current = window.setTimeout(() => {
                router.replace(postPaymentRedirect);
              }, 1800);
            } else {
              successRedirectTimerRef.current = window.setTimeout(() => {
                router.replace("/");
              }, 2000);
            }
            return;
          }

          if (attempt === maxAttempts) {
            setStatus("pending");
            setMessage("Payment is still processing. Please check Billing in a moment.");
            return;
          }

          setMessage("Waiting for Stripe webhook confirmation...");
          await wait(2000);
          continue;
        }

        if (result.data.paymentStatus === "paid") {
          await refreshUser();
          setStatus("success");
          setMessage("Payment confirmed and your account has been updated.");
          trackPaymentEvent("pay_verify_success", {
            channel: verifyRequest.channel,
            paymentStatus: result.data.paymentStatus,
          });

          const postPaymentRedirect = window.sessionStorage.getItem("postPaymentRedirect");
          if (postPaymentRedirect) {
            window.sessionStorage.removeItem("postPaymentRedirect");
            successRedirectTimerRef.current = window.setTimeout(() => {
              router.replace(postPaymentRedirect);
            }, 1800);
          }
          return;
        }

        if (result.data.paymentStatus === "pending") {
          if (attempt === maxAttempts) {
            setStatus("pending");
            setMessage("Payment is still processing. Credits should update shortly.");
            return;
          }
          setMessage("Payment is processing. We are checking again...");
          await wait(2000);
          continue;
        }

        setStatus("error");
        setMessage("Payment was not completed. Please retry from billing.");
        trackPaymentEvent("pay_verify_fail", {
          channel: verifyRequest.channel,
          code: "PAYMENT_NOT_COMPLETED",
        });
        return;
      }
    };

    void runVerification();
    return () => {
      cancelled = true;
      if (successRedirectTimerRef.current !== null) {
        window.clearTimeout(successRedirectTimerRef.current);
      }
    };
  }, [channelParam, refreshUser, router, verifyRequest]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="ui-card w-full bg-app-surface p-6 sm:p-8">
        {status === "verifying" ? (
          <div className="text-center">
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-app-primary" />
            <h1 className="mt-4 text-2xl font-extrabold text-app-text">Verifying payment</h1>
            <p className="mt-2 text-sm text-app-text-muted">{message}</p>
            <p className="mt-1 text-xs text-app-text-muted">
              Attempt {attemptCount} / {verifyRequest?.channel === "stripe" ? 30 : 12}
            </p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-app-text">Payment successful</h1>
            <p className="mt-2 text-sm text-app-text-muted">{message}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/billing"
                className="ui-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
              >
                Open Billing
              </Link>
              <Link
                href="/"
                className="ui-btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
              >
                <Home className="h-4 w-4" />
                Back Home
              </Link>
            </div>
          </div>
        ) : null}

        {status === "pending" ? (
          <div className="text-center">
            <Clock3 className="mx-auto h-10 w-10 text-amber-500" />
            <h1 className="mt-4 text-2xl font-extrabold text-app-text">Payment processing</h1>
            <p className="mt-2 text-sm text-app-text-muted">{message}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/billing"
                className="ui-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
              >
                Check Billing
              </Link>
              <Link
                href="/pricing"
                className="ui-btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
              >
                <RefreshCw className="h-4 w-4" />
                Retry Payment
              </Link>
            </div>
          </div>
        ) : null}

        {status === "error" ? (
          <div className="text-center">
            <XCircle className="mx-auto h-10 w-10 text-app-danger" />
            <h1 className="mt-4 text-2xl font-extrabold text-app-text">Payment verification failed</h1>
            <p className="mt-2 text-sm text-app-text-muted">{message}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/pricing"
                className="ui-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
              >
                Retry Payment
              </Link>
              <Link
                href="/contact"
                className="ui-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
              >
                Contact Support
              </Link>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
