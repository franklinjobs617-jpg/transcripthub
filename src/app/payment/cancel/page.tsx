import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Payment Canceled - Transcripthub",
  description: "Payment was canceled. Return to pricing to retry checkout anytime.",
  alternates: {
    canonical: "/payment/cancel",
  },
};

export default function PaymentCancelPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="ui-card w-full bg-app-surface p-6 text-center sm:p-8">
        <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
        <h1 className="mt-4 text-2xl font-extrabold text-app-text">Payment canceled</h1>
        <p className="mt-2 text-sm text-app-text-muted">
          No charge was made. You can return to pricing any time to complete checkout.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/pricing"
            className="ui-btn-primary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
          >
            Back to Pricing
          </Link>
          <Link
            href="/"
            className="ui-btn-secondary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </section>
    </main>
  );
}
