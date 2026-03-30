"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Loader2, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";

export default function LoginPage() {
  const router = useRouter();
  const { user, login, isAuthenticating, authError } = useAuth();

  useEffect(() => {
    if (user?.email) {
      router.replace("/billing");
    }
  }, [router, user]);

  return (
    <main className="mx-auto flex min-h-[70vh] w-full max-w-3xl items-center px-4 py-12 sm:px-6">
      <section className="ui-card w-full bg-app-surface p-6 text-center sm:p-8">
        <h1 className="text-2xl font-extrabold text-app-text">Sign in to continue</h1>
        <p className="mt-2 text-sm text-app-text-muted">
          Use Google sign-in to sync your credits, billing status, and transcript history.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => void login()}
            disabled={isAuthenticating}
            className={`ui-btn-primary inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold ${
              isAuthenticating ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            {isAuthenticating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Opening Google...
              </>
            ) : (
              <>
                <LogIn className="h-4 w-4" />
                Continue with Google
              </>
            )}
          </button>
          <Link
            href="/"
            className="ui-btn-secondary inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-bold"
          >
            Back Home
          </Link>
        </div>
        {authError ? (
          <p className="mt-3 text-sm font-semibold text-app-danger">{authError}</p>
        ) : null}
      </section>
    </main>
  );
}
