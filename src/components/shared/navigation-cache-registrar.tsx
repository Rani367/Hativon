"use client";

import { useEffect } from "react";

const SERVICE_WORKER_PATH = "/sw.js";

export function NavigationCacheRegistrar() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    navigator.serviceWorker.register(SERVICE_WORKER_PATH).catch(() => {
      // Navigation still works normally if a browser blocks service workers.
    });
  }, []);

  return null;
}
