# Transcripthub Web

Next.js frontend for transcript extraction and billing flows.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

### Auth

- `NEXT_PUBLIC_AUTH_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`

### Transcript backend

- `TRANSCRIPT_BACKEND_URL` (or `NEXT_PUBLIC_TRANSCRIPT_BACKEND_URL`)

### Billing / payment

- `NEXT_PUBLIC_BILLING_BASE_URL`
- `NEXT_PUBLIC_PAYMENTS_ENABLED` (`true` by default, set `false` to hide paid checkout)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_PAYPAL_CLIENT_ID`

### Optional backend path overrides

- `BILLING_STRIPE_CREATE_PATH`
- `BILLING_STRIPE_VERIFY_PATH`
- `BILLING_PAYPAL_CREATE_ORDER_PATH`
- `BILLING_PAYPAL_CREATE_SUBSCRIPTION_PATH`
- `BILLING_PAYPAL_CAPTURE_PATH`
- `BILLING_PAYPAL_VERIFY_SUBSCRIPTION_PATH`
- `BILLING_PORTAL_PATH`
- `BILLING_ORDERS_PATH`

## Payment routes (frontend BFF)

- `POST /api/pay/create`
- `POST /api/pay/verify`
- `POST /api/pay/portal`
- `GET /api/pay/orders`

All routes return unified payloads:

- success: `{ ok: true, data: ... }`
- failure: `{ ok: false, error: { code, message, details? } }`

## Payment pages

- `/pricing`
- `/payment/success`
- `/payment/cancel`
- `/billing`

## Notes

- Payment entitlements are backend-authoritative.
- Transcript content APIs now forward auth headers and return a unified `INSUFFICIENT_CREDITS` error when logged-in credits are exhausted.

