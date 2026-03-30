import type { PaymentPlanCode } from "@/lib/payment-types";

export const PAYMENTS_ENABLED =
  process.env.NEXT_PUBLIC_PAYMENTS_ENABLED !== "false";
export const BILLING_BASE_URL =
  process.env.NEXT_PUBLIC_BILLING_BASE_URL || "";
export const STRIPE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
export const PAYPAL_CLIENT_ID =
  process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

export function isKnownPlanCode(value: string): value is PaymentPlanCode {
  return value === "pro_monthly" || value === "pro_yearly" || value === "payg_150";
}

export function mapPlanCodeToBackend(planCode: PaymentPlanCode): string {
  const map: Record<PaymentPlanCode, string> = {
    pro_monthly:
      process.env.BILLING_PLAN_PRO_MONTHLY || "transcripthub_pro_monthly",
    pro_yearly:
      process.env.BILLING_PLAN_PRO_YEARLY || "transcripthub_pro_yearly",
    payg_150: process.env.BILLING_PLAN_PAYG_150 || "pay_as_you_go",
  };

  return map[planCode];
}
