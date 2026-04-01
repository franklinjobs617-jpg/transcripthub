"use client";

import { useAuth } from "@/components/providers/auth-provider";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

export function GoogleLoginModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { login, user, isAuthenticating, authError, clearAuthError } =
    useAuth();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    clearAuthError();
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, clearAuthError]);

  useEffect(() => {
    if (user && isOpen) {
      handleClose();
    }
  }, [user, isOpen, handleClose]);

  useEffect(() => {
    const onEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        handleClose();
      }
    };
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [isOpen, handleClose]);

  if (typeof window === "undefined" || !isOpen) return null;

  return createPortal(
    <div
      className="ui-auth-root fixed inset-0 z-[120] flex items-center justify-center px-4 py-8"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) {
          event.preventDefault();
          handleClose();
        }
      }}
    >
      <div className="ui-auth-overlay absolute inset-0 h-full w-full" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in with Google"
        className="ui-auth-modal relative z-[121] w-full max-w-[500px] overflow-hidden rounded-3xl border border-app-border"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="ui-auth-glow pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full" />
        <div className="ui-auth-glow-secondary pointer-events-none absolute -left-16 bottom-8 h-32 w-32 rounded-full" />

        <button
          type="button"
          onPointerDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
          }}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            handleClose();
          }}
          className="ui-auth-close absolute right-4 top-4 inline-flex h-9 w-9 items-center justify-center rounded-lg"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative px-6 pb-6 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
          <div className="ui-auth-kicker inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            Secure login
          </div>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-app-text sm:text-[1.95rem]">
            Welcome back to Transcripthub
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-app-text-muted sm:text-[0.95rem]">
            Sign in with Google to sync credits, keep transcript history, and continue
            your workflow across TikTok, Instagram, and Facebook pages. Sign in now
            to get <span className="font-bold text-app-text">2 starter credits</span>.
          </p>

          <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div className="ui-auth-feature">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>OAuth verified</span>
            </div>
            <div className="ui-auth-feature">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Sign in bonus: 2 credits</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void login()}
            disabled={isAuthenticating}
            className="ui-google-login-btn mt-6 inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl px-4 text-sm font-semibold"
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for Google...
              </>
            ) : (
              <>
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.1 0 5.9 1.1 8.1 3.3l6-6C34.3 3.3 29.5 1 24 1 14.6 1 6.6 6.4 2.8 14.2l7.2 5.6C11.8 13.3 17.4 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.5 24.5c0-1.7-.2-3.3-.5-4.9H24v9.3h12.6c-.5 3-2.2 5.6-4.7 7.3l7.3 5.6c4.3-4 7.3-9.8 7.3-17.3z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10 28.2c-.5-1.4-.8-2.8-.8-4.2s.3-2.9.8-4.2l-7.2-5.6C1 17.7 0 20.8 0 24s1 6.3 2.8 9.8l7.2-5.6z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 47c6.5 0 12-2.1 16.1-5.8l-7.3-5.6c-2 1.4-4.6 2.3-8.8 2.3-6.6 0-12.2-3.8-14.2-10.2l-7.2 5.6C6.6 41.6 14.6 47 24 47z"
                  />
                </svg>
                Continue with Google
              </>
            )}
          </button>

          {authError ? (
            <div className="ui-auth-error mt-4 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm font-medium">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{authError}</span>
            </div>
          ) : null}

          <p className="mt-3 text-center text-xs text-app-text-muted/90">
            We never post without permission.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
