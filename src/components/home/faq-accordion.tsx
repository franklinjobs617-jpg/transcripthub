"use client";

import { useState } from "react";

type FaqItem = {
  q: string;
  a: string;
};

type FaqAccordionProps = {
  items: FaqItem[];
};

export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number>(0);

  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const isOpen = index === openIndex;
        return (
          <article key={item.q} className="ui-card-soft ui-card-hover overflow-hidden">
            <button
              type="button"
              className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              aria-expanded={isOpen}
              onClick={() => setOpenIndex(isOpen ? -1 : index)}
            >
              <span className="font-medium">{item.q}</span>
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full border border-app-border text-app-text-muted transition ${
                  isOpen ? "rotate-45" : ""
                }`}
              >
                +
              </span>
            </button>
            {isOpen ? (
              <div className="border-t border-app-border px-4 py-3 text-sm text-app-text-muted">
                {item.a}
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
