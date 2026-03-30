"use client";

import { Check, ChevronDown, Laptop, Moon, Sun } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type ThemeMode = "light" | "dark" | "system";

const modes: ThemeMode[] = ["light", "dark", "system"];
const systemDarkMedia = "(prefers-color-scheme: dark)";

const applyTheme = (nextMode: ThemeMode) => {
  const root = document.documentElement;
  root.setAttribute("data-theme", nextMode);

  const resolvedMode =
    nextMode === "system"
      ? window.matchMedia(systemDarkMedia).matches
        ? "dark"
        : "light"
      : nextMode;

  root.classList.toggle("dark", resolvedMode === "dark");
};

const modeMeta: Record<
  ThemeMode,
  { label: string; icon: typeof Sun }
> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Laptop },
};

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "system";
    }
    const saved = window.localStorage.getItem("theme-mode") as ThemeMode | null;
    return saved && modes.includes(saved) ? saved : "system";
  });
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    const mediaQuery = window.matchMedia(systemDarkMedia);

    const syncSystemTheme = () => {
      if (mode !== "system") return;
      document.documentElement.classList.toggle("dark", mediaQuery.matches);
    };

    syncSystemTheme();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", syncSystemTheme);
      return () => mediaQuery.removeEventListener("change", syncSystemTheme);
    }

    mediaQuery.addListener(syncSystemTheme);
    return () => mediaQuery.removeListener(syncSystemTheme);
  }, [mode]);

  useEffect(() => {
    if (!open) return;

    const onClickOutside = (event: MouseEvent) => {
      if (!rootRef.current) return;
      if (event.target instanceof Node && !rootRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const handleSwitch = (nextMode: ThemeMode) => {
    setMode(nextMode);
    window.localStorage.setItem("theme-mode", nextMode);
    applyTheme(nextMode);
    setOpen(false);
  };

  const current = useMemo(() => modeMeta[mode], [mode]);
  const CurrentIcon = current.icon;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Change theme"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="ui-btn-secondary inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium"
      >
        <CurrentIcon className="h-4 w-4" />
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="ui-card absolute right-0 z-50 mt-2 w-40 overflow-hidden p-1" role="menu">
          {modes.map((item) => {
            const meta = modeMeta[item];
            const Icon = meta.icon;
            const selected = item === mode;

            return (
              <button
                key={item}
                type="button"
                role="menuitemradio"
                aria-checked={selected}
                onClick={() => handleSwitch(item)}
                className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-sm transition ${
                  selected ? "bg-app-primary-soft text-app-primary" : "hover:bg-app-bg"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  {meta.label}
                </span>
                {selected ? <Check className="h-4 w-4" /> : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
