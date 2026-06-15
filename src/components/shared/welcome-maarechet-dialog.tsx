"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { motion } from "framer-motion";
import { ArrowLeft, CalendarDays, Sparkles, X } from "lucide-react";
import { triggerHaptic } from "@/lib/utils";
import { MAARECHET_URL } from "@/lib/constants";

/**
 * One-time announcement of the sister "מערכת שעות" (schedule) app.
 *
 * Shows once per browser, gated by a versioned localStorage flag. Bump the
 * version suffix to re-announce after a future change. Mounted from
 * LayoutClient, so it only appears on the public site (not admin/dashboard).
 */
const STORAGE_KEY = "hativon_maarechet_announcement_v1";

export function WelcomeMaarechetDialog() {
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let alreadySeen = true;
    try {
      alreadySeen = window.localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      // localStorage blocked (private mode etc.) — don't nag on every load.
      alreadySeen = true;
    }

    if (alreadySeen) {
      return;
    }

    // Let the page paint first so the popup feels intentional, not jarring.
    const timer = window.setTimeout(() => setOpen(true), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = React.useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Best-effort: if we can't persist, it'll just show again next visit.
    }
    setOpen(false);
  }, []);

  return (
    <DialogPrimitive.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          dismiss();
        }
      }}
    >
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          {/* Gradient hero */}
          <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-500 px-6 pb-8 pt-10 text-center">
            <div className="pointer-events-none absolute -right-10 -top-12 h-36 w-36 rounded-full bg-white/20 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-8 h-36 w-36 rounded-full bg-fuchsia-400/30 blur-2xl" />

            <DialogPrimitive.Close
              onClick={() => triggerHaptic()}
              className="absolute left-3 top-3 inline-flex size-9 items-center justify-center rounded-full text-white/80 transition hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              aria-label="סגור"
            >
              <X className="size-5" />
            </DialogPrimitive.Close>

            <motion.div
              initial={{ scale: 0.6, opacity: 0, rotate: -8 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 16, delay: 0.05 }}
              className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/40 backdrop-blur"
            >
              <CalendarDays className="size-8 text-white" strokeWidth={1.75} />
            </motion.div>

            <motion.span
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.3 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white ring-1 ring-inset ring-white/30"
            >
              <Sparkles className="size-3.5" />
              חדש באתר
            </motion.span>
          </div>

          {/* Body */}
          <div className="px-6 pb-6 pt-5 text-center">
            <DialogPrimitive.Title className="text-2xl font-extrabold tracking-tight text-foreground">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22, duration: 0.3 }}
              >
                מערכת השעות הגיעה!
              </motion.span>
            </DialogPrimitive.Title>

            <DialogPrimitive.Description className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28, duration: 0.3 }}
              >
                עכשיו אפשר לראות את מערכת השעות היומית של בית הספר ישירות מחטיבון —
                בוחרים כיתה וצופים בשיעורים של היום.
              </motion.span>
            </DialogPrimitive.Description>

            <motion.div
              className="mt-6 flex flex-col gap-2.5"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.3 }}
            >
              <a
                href={MAARECHET_URL}
                onClick={() => {
                  triggerHaptic();
                  dismiss();
                }}
                className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-violet-600 to-indigo-600 px-5 text-sm font-bold text-white shadow-lg shadow-indigo-600/25 transition hover:brightness-110 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <CalendarDays className="size-4" />
                למערכת השעות
                <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  dismiss();
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl px-5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                אולי אחר כך
              </button>
            </motion.div>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
