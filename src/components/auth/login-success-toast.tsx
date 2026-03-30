"use client";

import Link from "next/link";
import { CheckCircle2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { consumeLoginSuccessFlag } from "@/lib/auth-session";

function getFirstName(name?: string) {
  const raw = (name || "").trim();
  if (!raw) return "there";
  return raw.split(/\s+/)[0] || "there";
}

export function LoginSuccessToast() {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);
  const unmountTimerRef = useRef<number | null>(null);

  const closeToast = () => {
    setVisible(false);
    if (unmountTimerRef.current !== null) {
      window.clearTimeout(unmountTimerRef.current);
    }
    unmountTimerRef.current = window.setTimeout(() => {
      setMounted(false);
    }, 220);
  };

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) {
        window.clearTimeout(closeTimerRef.current);
      }
      if (unmountTimerRef.current !== null) {
        window.clearTimeout(unmountTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!user?.email) return;
    if (!consumeLoginSuccessFlag()) return;

    setMounted(true);
    const frame = window.requestAnimationFrame(() => {
      setVisible(true);
    });

    if (closeTimerRef.current !== null) {
      window.clearTimeout(closeTimerRef.current);
    }
    closeTimerRef.current = window.setTimeout(() => {
      closeToast();
    }, 3600);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [user?.email]);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-[140] w-[min(92vw,360px)] transition-all duration-200 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="overflow-hidden rounded-2xl border border-app-border bg-app-surface shadow-[0_16px_45px_-24px_rgba(16,185,129,0.5)]">
        <div className="h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-blue-500" />
        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Signed in
                </p>
                <p className="mt-1 text-sm font-bold text-app-text">
                  Welcome back, {getFirstName(user?.name)}.
                </p>
                <p className="mt-1 text-xs text-app-text-muted">
                  Your account is synced. You can now checkout and manage billing.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeToast}
              className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-app-text-muted transition-colors hover:bg-app-bg hover:text-app-text"
              aria-label="Close login success message"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <Link
              href="/billing"
              className="ui-btn-primary inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-bold"
            >
              Open Billing
            </Link>
            <Link
              href="/pricing"
              className="ui-btn-secondary inline-flex h-8 items-center justify-center rounded-md px-3 text-xs font-semibold"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

