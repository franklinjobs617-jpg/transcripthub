"use client";

import { useState } from "react";

type UseCaseTab = {
  key: string;
  label: string;
  title: string;
  bullets: string[];
};

const tabs: UseCaseTab[] = [
  {
    key: "creators",
    label: "Creators",
    title: "Ship short-form content faster",
    bullets: [
      "Extract Reels and TikTok scripts to remix hooks quickly.",
      "Turn one transcript into multiple post captions.",
      "Reuse high-performing lines for next-week content.",
    ],
  },
  {
    key: "marketers",
    label: "Marketers",
    title: "Convert social videos into campaign assets",
    bullets: [
      "Convert product videos into clean copy blocks.",
      "Pull claim lines for paid ads and landing pages.",
      "Draft subtitles and summaries for multi-channel publishing.",
    ],
  },
  {
    key: "agencies",
    label: "Agencies",
    title: "Scale client workflows with less manual effort",
    bullets: [
      "Create transcript pipelines for recurring client content.",
      "Prepare export-ready transcript packages with SRT/PDF.",
      "Reduce time spent on manual note-taking and script extraction.",
    ],
  },
];

export function UseCaseTabs() {
  const [activeKey, setActiveKey] = useState<string>(tabs[0].key);
  const active = tabs.find((item) => item.key === activeKey) ?? tabs[0];

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = tab.key === active.key;
          return (
            <button
              key={tab.key}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveKey(tab.key)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                isActive
                  ? "ui-btn-primary"
                  : "ui-btn-secondary"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <article className="ui-card-soft ui-card-hover mt-4 p-5">
        <h3 className="text-lg font-semibold">{active.title}</h3>
        <ul className="mt-3 space-y-2 text-sm text-app-text-muted">
          {active.bullets.map((bullet) => (
            <li key={bullet}>• {bullet}</li>
          ))}
        </ul>
      </article>
    </div>
  );
}
