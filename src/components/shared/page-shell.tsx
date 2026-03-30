import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

type Cta = {
  href: string;
  label: string;
};

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: Cta;
  secondaryCta?: Cta;
  children: ReactNode;
};

export function PageShell({
  eyebrow,
  title,
  description,
  primaryCta,
  secondaryCta,
  children,
}: PageShellProps) {
  return (
    <div className="w-full bg-app-bg text-app-text">
      <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-14 sm:pb-14 sm:pt-20 lg:px-8">
        <div className="text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-300">
            {eyebrow}
          </p>
          <h1 className="mx-auto mt-3 max-w-4xl text-3xl font-extrabold tracking-tight sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-app-text-muted sm:text-base">
            {description}
          </p>
          {(primaryCta || secondaryCta) && (
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
              {primaryCta ? (
                <Link
                  href={primaryCta.href}
                  className="ui-btn-primary inline-flex h-11 items-center rounded-lg px-6 text-sm font-bold"
                >
                  {primaryCta.label}
                </Link>
              ) : null}
              {secondaryCta ? (
                <Link href={secondaryCta.href} className="ui-link-arrow text-sm font-bold">
                  <span>{secondaryCta.label}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 lg:px-8">{children}</section>
    </div>
  );
}

