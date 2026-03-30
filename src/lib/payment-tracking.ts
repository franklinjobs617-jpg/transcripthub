export function trackPaymentEvent(
  event: string,
  payload?: Record<string, unknown>
): void {
  if (typeof window === "undefined") return;

  try {
    const w = window as Window & {
      gtag?: (...args: unknown[]) => void;
      dataLayer?: Array<Record<string, unknown>>;
    };

    if (typeof w.gtag === "function") {
      w.gtag("event", event, payload || {});
    } else if (Array.isArray(w.dataLayer)) {
      w.dataLayer.push({
        event,
        ...payload,
      });
    } else {
      // Keep console output only in development for easy troubleshooting.
      if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.info("[payment-event]", event, payload || {});
      }
    }
  } catch {
    // Silent no-op: tracking should never block checkout.
  }
}
