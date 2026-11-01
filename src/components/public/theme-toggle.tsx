"use client";

import { type MouseEvent, useSyncExternalStore } from "react";
import { copy } from "@/lib/copy";
import { THEME_STORAGE_KEY } from "@/lib/theme";

function isDark() {
  return document.documentElement.classList.contains("dark");
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, dark ? "dark" : "light");
  } catch {
    // Private windows can refuse storage. The theme still applies to this page.
  }
  window.dispatchEvent(new Event("hativon-theme"));
}

function subscribe(onChange: () => void) {
  window.addEventListener("hativon-theme", onChange);
  return () => window.removeEventListener("hativon-theme", onChange);
}

/** Paper floods the page from the button, like ink spreading the other way. */
function wipeTheme(event: MouseEvent, dark: boolean) {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (!document.startViewTransition || reducedMotion) {
    applyTheme(dark);
    return;
  }

  const root = document.documentElement;
  const { clientX: x, clientY: y } = event;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.classList.add("theme-wipe");
  const transition = document.startViewTransition(() => applyTheme(dark));

  transition.ready
    .then(() =>
      root.animate(
        {
          clipPath: [
            `circle(0 at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 620,
          easing: "cubic-bezier(0.16, 1, 0.3, 1)",
          pseudoElement: "::view-transition-new(root)",
        },
      ),
    )
    .catch(() => {});

  transition.finished.finally(() => root.classList.remove("theme-wipe"));
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, isDark, () => false);

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={dark ? copy.nav.themeToLight : copy.nav.themeToDark}
      onClick={(event) => wipeTheme(event, !dark)}
    />
  );
}
