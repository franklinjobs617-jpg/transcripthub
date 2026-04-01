import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PaymentSuccessClient } from "@/components/pages/payment-success-client";

export const metadata: Metadata = {
  title: "Payment Success - Transcripthub",
  description: "Payment completed. Verifying order status and syncing your credits.",
  alternates: {
    canonical: "/payment/success",
  },
};

function VerifyingFallback() {
  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="ui-card w-full bg-app-surface p-6 sm:p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-app-primary" />
          <h1 className="mt-4 text-2xl font-extrabold text-app-text">Verifying payment</h1>
          <p className="mt-2 text-sm text-app-text-muted">
            Finalizing your payment status...
          </p>
        </div>
      </section>
    </main>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<VerifyingFallback />}>
      <PaymentSuccessClient />
    </Suspense>
  );
}

