"use client";

import { useEffect } from "react";

const SECONDS_TO_COUNT = 10;

/**
 * Counts a read after 10 visible seconds, once per device. Hidden tabs and
 * pages the browser fetched ahead of time don't count.
 */
export function ReadBeacon({ postId }: { postId: string }) {
  useEffect(() => {
    const key = `hativon_read_${postId}`;

    try {
      if (localStorage.getItem(key)) return;
    } catch {
      return;
    }

    let remaining = SECONDS_TO_COUNT;

    const timer = setInterval(() => {
      if (document.visibilityState !== "visible") return;

      remaining -= 1;
      if (remaining > 0) return;

      clearInterval(timer);
      navigator.sendBeacon(
        "/api/reads",
        new Blob([JSON.stringify({ id: postId })], { type: "application/json" }),
      );

      try {
        localStorage.setItem(key, "1");
      } catch {
        // At worst this device counts again later.
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [postId]);

  return null;
}
