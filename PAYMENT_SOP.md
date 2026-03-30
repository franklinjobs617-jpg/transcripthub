# Transcripthub Payment SOP (Execution-Ready)

This SOP is written for the current project:
- Repo: `E:\前端 github\transcripthub`
- App: `E:\前端 github\transcripthub\web`
- Date baseline: 2026-03-29

Goal:
- Implement payment safely and predictably.
- Minimize launch risk with clear checks, rollback, and monitoring.

---

## 1. Current Project Reality (Important)

The project currently has:
- Pricing UI page: `src/app/pricing/page.tsx`
- Google auth provider and user session storage:
  - `src/components/providers/auth-provider.tsx`
  - `src/lib/auth-session.ts`
- Transcript APIs (TikTok / Instagram / Facebook) proxied to transcript backend:
  - `src/app/api/*/transcript/*/route.ts`

The project currently does **not** have:
- Payment creation API routes (`/api/pay/*`)
- Webhook handler routes
- Billing page route (`/billing` path is referenced but missing)
- Payment success/cancel callback pages
- Server-side entitlement check tied to billing status

Conclusion:
- Tomorrow should be treated as a **payment implementation + controlled launch**, not just a toggle-on.

---

## 2. Architecture Decision (Use This)

Use this 3-layer pattern:
1. Frontend (Next.js in this repo): starts checkout and shows status.
2. Billing backend (external trusted service): creates orders, verifies webhooks, updates user entitlement.
3. Transcript backend: enforces credits/plan at API level.

Rules:
- Frontend never decides final payment success alone.
- Final entitlement source of truth is billing backend/database.
- Webhook confirmation is authoritative; frontend polling is only UX.

---

## 3. Required Env Variables (Before Coding)

Add these to deployment secrets (do not hardcode):
- `NEXT_PUBLIC_AUTH_BASE_URL`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_GOOGLE_REDIRECT_URI`
- `NEXT_PUBLIC_BILLING_BASE_URL`
- `NEXT_PUBLIC_APP_BASE_URL`
- `BILLING_SERVER_SECRET` (server-only, for signed backend calls if needed)

Optional but recommended:
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET` (server-only, if webhook is in this repo)
- `PAYPAL_CLIENT_ID`
- `PAYPAL_WEBHOOK_ID`

---

## 4. Implementation Plan (File-Level)

## 4.1 Create missing billing route pages
Create:
- `src/app/billing/page.tsx`
- `src/app/payment/success/page.tsx`
- `src/app/payment/cancel/page.tsx`

Behavior:
- `billing`: shows current plan, credits, invoices, actions (upgrade, manage, cancel).
- `payment/success`: verifies session/order with backend, then refreshes user.
- `payment/cancel`: clear message and retry button.

## 4.2 Add payment API proxy routes in Next
Create:
- `src/app/api/pay/create/route.ts` (create checkout session)
- `src/app/api/pay/verify/route.ts` (verify by session/order id)
- `src/app/api/pay/portal/route.ts` (customer billing portal URL)

All routes must:
- validate payload strictly
- forward to billing backend
- return normalized response format

Response format standard:
- success: `{ ok: true, data: {...} }`
- error: `{ ok: false, error: { code, message, details? } }`

## 4.3 Wire pricing CTA to real payment actions
Update:
- `src/app/pricing/page.tsx`

Replace static `href`-based CTA with:
- logged-in check
- call `/api/pay/create`
- redirect to returned checkout URL
- button loading state and retry-safe behavior

## 4.4 Refresh entitlement after payment
Update:
- `src/components/providers/auth-provider.tsx`

After payment verification:
- call `refreshUser()`
- update local auth store
- render updated credits/plan in header and tools

## 4.5 Protect transcript usage by entitlement
Current transcript routes proxy directly. Add entitlement guard:
- check auth token and user plan/credits before forwarding heavy transcript calls
- return explicit error when no credits

Suggested routes to guard first:
- `src/app/api/tiktok/transcript/content/route.ts`
- `src/app/api/instagram/transcript/content/route.ts`
- `src/app/api/facebook/transcript/content/route.ts`

---

## 5. Tomorrow Execution Schedule (Recommended)

1. 09:30-10:00 Environment freeze
- Confirm all env values in staging + production.
- Confirm billing backend endpoint health.

2. 10:00-12:00 Build and integration
- Add payment routes/pages.
- Wire pricing buttons.
- Implement success verification path.

3. 13:30-15:00 QA matrix run
- Run full checklist in section 6.

4. 15:00-16:00 Staging canary
- Internal users only.
- Validate logs and entitlement propagation.

5. 16:00-17:00 Production rollout
- Gradual traffic release.
- Monitor error budgets and payment success ratio.

---

## 6. Mandatory QA Checklist (Pass All)

Authentication:
- user not logged in -> clicking paid CTA opens login flow
- logged in user can start checkout

Stripe/PayPal flow:
- successful payment redirects to success page
- success page verifies with backend and updates entitlement
- canceled payment lands on cancel page with retry path

Entitlement:
- plan/credits update visible in header and protected actions
- transcript request denied when credits exhausted
- transcript request allowed after successful top-up

Reliability:
- double-click payment button does not create duplicate sessions
- transient backend timeout shows retry-safe message
- verify endpoint handles unknown/expired session ids safely

---

## 7. Monitoring and Alerts

Track at minimum:
- `payment.create.started`
- `payment.create.failed`
- `payment.redirected`
- `payment.verify.success`
- `payment.verify.failed`
- `entitlement.refresh.success`
- `entitlement.refresh.failed`

Alert thresholds:
- payment creation failure rate > 3% over 10 min
- verify failure rate > 2% over 10 min
- webhook lag > 5 min

---

## 8. Rollback Plan (No Ambiguity)

If severe failure appears:
1. Disable paid CTA (feature flag or hide buttons).
2. Keep transcript service available for free preview paths.
3. Route users to support page with incident notice.
4. Keep verification endpoint active for already-paid sessions.
5. Reconcile affected users from billing backend logs and restore credits manually if needed.

---

## 9. Acceptance Criteria (Launch Gate)

Launch only if all are true:
- 100% QA checklist in section 6 passed on staging
- payment success -> entitlement visible within 10 seconds
- no critical error in canary period
- rollback switch tested once before full release

---

## 10. Known Gaps To Fix Immediately

1. `/billing` link is referenced in UI but route missing.
2. Pricing page still static-link based and not connected to payment API.
3. No payment API routes exist in this repo yet.
4. No webhook or backend verification path in this repo.

These 4 items must be completed before production payment launch.

---

## 11. Owner Assignment Template

- Frontend payment flow owner:
- Backend billing owner:
- Webhook/reconciliation owner:
- QA owner:
- Incident commander:

Do not start release without filling these names.

