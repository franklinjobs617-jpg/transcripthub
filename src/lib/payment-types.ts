export type PaymentChannel = "stripe" | "paypal";

export type BillingCycle = "monthly" | "yearly";

export type PayPalIntent = "capture" | "subscription";

export type PaymentPlanCode = "pro_monthly" | "pro_yearly" | "payg_150";

export type BillingApiError = {
  code: string;
  message: string;
  details?: unknown;
};

export type BillingOrderItem = {
  id: string;
  channel: PaymentChannel;
  planCode: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
};

export type PaymentCreateRequest = {
  channel: PaymentChannel;
  planCode: PaymentPlanCode;
  billingCycle?: BillingCycle;
  paypalIntent?: PayPalIntent;
};

export type PaymentCreateResponse = {
  ok: true;
  data: {
    channel: PaymentChannel;
    checkoutUrl?: string;
    orderId?: string;
    subscriptionId?: string;
    approvalUrl?: string;
  };
};

export type PaymentVerifyRequest = {
  channel: PaymentChannel;
  sessionId?: string;
  orderId?: string;
  subscriptionId?: string;
  payerId?: string;
  paypalIntent?: PayPalIntent;
};

export type PaymentVerifyResponse = {
  ok: true;
  data: {
    paymentStatus: "paid" | "pending" | "failed";
    plan?: string;
    creditsDelta?: number;
    rawStatus?: string;
  };
};

export type PaymentPortalResponse = {
  ok: true;
  data: {
    url: string;
  };
};

export type PaymentOrdersResponse = {
  ok: true;
  data: BillingOrderItem[];
};

export type BillingApiErrorResponse = {
  ok: false;
  error: BillingApiError;
};

export type BillingApiSuccessResponse<T> = {
  ok: true;
  data: T;
};

export type BillingApiResponse<T> =
  | BillingApiSuccessResponse<T>
  | BillingApiErrorResponse;
