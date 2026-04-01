"use client";

import { GoogleLoginModal } from "@/components/auth/google-login-modal";
import { useAuth } from "@/components/providers/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Menu,
  X,
  ChevronDown,
  LogOut,
  Settings,
  CreditCard,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavItem = {
  label: string;
  href: string;
};

const DEFAULT_NAV_ITEMS: NavItem[] = [
  { label: "Instagram Transcript", href: "/instagram-transcript" },
  { label: "TikTok Transcript", href: "/tiktok-transcript" },
  { label: "Facebook Transcript", href: "/facebook-transcript" },
  { label: "Pricing", href: "/pricing" },
];

type SiteHeaderProps = {
  navItems?: NavItem[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function SiteHeader({
  navItems = DEFAULT_NAV_ITEMS,
  ctaHref = "#hero",
  ctaLabel = "Get Started",
}: SiteHeaderProps) {
  const { user, logout, isLoading } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isUserMenuOpen) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [isUserMenuOpen]);

  const initials = (() => {
    if (!user?.name) return "U";
    const parts = user.name.split(" ").filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  })();
  const avatarUrl = user?.avatarUrl || user?.picture || "";

  const onSignOut = () => {
    logout();
    setIsUserMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-app-border bg-app-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/icon.png?v=20260401b"
              alt="Transcripthub logo"
              width={40}
              height={40}
              priority
              unoptimized
              className="h-10 w-10 object-contain"
            />
            <span className="text-lg font-bold tracking-tight">
              Transcripthub
            </span>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          {navItems.map((item) => (
            <Link key={item.label} href={item.href} className="ui-nav-link">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-24 animate-pulse rounded-md bg-app-primary-soft" />
          ) : user ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="ui-btn-secondary inline-flex h-10 items-center gap-2 rounded-full px-2 pr-3 text-sm font-medium cursor-pointer"
              >
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={user.name || "User avatar"}
                    width={28}
                    height={28}
                    unoptimized
                    className="h-7 w-7 rounded-full object-cover"
                  />
                ) : (
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-app-primary-soft text-xs font-semibold text-app-primary cursor-pointer">
                    {initials}
                  </span>
                )}
                <span className="max-w-24 truncate">{user.name}</span>
                <ChevronDown className="h-4 w-4 text-app-text-muted" />
              </button>
              {isUserMenuOpen ? (
                <div className="ui-card absolute right-0 mt-2 w-56 overflow-hidden p-1">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium">{user.name}</p>
                    <p className="truncate text-xs text-app-text-muted">
                      {user.email}
                    </p>
                  </div>
                  <div className="my-1 h-px bg-app-border" />
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-app-bg"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <Link
                    href="/billing"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-app-bg"
                  >
                    <CreditCard className="h-4 w-4" />
                    Billing
                  </Link>
                  <button
                    type="button"
                    onClick={onSignOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-app-danger hover:bg-app-danger-soft"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setIsLoginModalOpen(true)}
                className="cursor-pointer text-sm font-medium text-app-text-muted transition-colors hover:text-app-text"
              >
                Sign In
              </button>
              <Link
                href={ctaHref}
                className="ui-btn-primary inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
              >
                {ctaLabel}
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setIsMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="ui-btn-secondary inline-flex h-9 w-9 items-center justify-center rounded-md"
          >
            {isMobileOpen ? (
              <X className="h-4 w-4" />
            ) : (
              <Menu className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {isMobileOpen ? (
        <div className="border-t border-app-border bg-app-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-app-bg"
                onClick={() => setIsMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-4 flex flex-col gap-2 border-t border-app-border pt-4">
            {isLoading ? (
              <div className="h-10 w-full animate-pulse rounded-md bg-app-primary-soft" />
            ) : user ? (
              <>
                <div className="rounded-md bg-app-bg px-3 py-2 text-sm">
                  <p className="font-medium">{user.name}</p>
                  <p className="text-xs text-app-text-muted">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  className="rounded-md px-2 py-2 text-sm font-medium hover:bg-app-bg"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/billing"
                  className="rounded-md px-2 py-2 text-sm font-medium hover:bg-app-bg"
                  onClick={() => setIsMobileOpen(false)}
                >
                  Billing
                </Link>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-md px-2 py-2 text-left text-sm font-medium text-app-danger hover:bg-app-danger-soft"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="cursor-pointer rounded-md px-2 py-2 text-left text-sm font-medium hover:bg-app-bg"
                  onClick={() => {
                    setIsMobileOpen(false);
                    setIsLoginModalOpen(true);
                  }}
                >
                  Sign In
                </button>
                <Link
                  href={ctaHref}
                  className="ui-btn-primary inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-medium"
                  onClick={() => setIsMobileOpen(false)}
                >
                  {ctaLabel}
                </Link>
              </>
            )}
          </div>
        </div>
      ) : null}
      </header>
      {isLoginModalOpen ? (
        <GoogleLoginModal
          isOpen={isLoginModalOpen}
          onClose={() => setIsLoginModalOpen(false)}
        />
      ) : null}
    </>
  );
}
