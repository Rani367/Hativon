"use client";

import { flushSync } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { animate, createLayout } from "animejs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LoginForm } from "./login-form";
import { RegisterForm } from "./register-form";
import { triggerLoginHaptic } from "@/lib/utils";
import {
  canUseDomAnimation,
  createMountTimeline,
  motionTokens,
  useAnimeScope,
  useReducedMotionPreference,
} from "@/lib/anime/motion";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTab?: "login" | "register";
}

export function AuthDialog({
  open,
  onOpenChange,
  defaultTab = "login",
}: AuthDialogProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
  const [activeTab, setActiveTab] = useState<"login" | "register">(defaultTab);
  const prefersReducedMotion = useReducedMotionPreference();

  useEffect(() => {
    if (open) {
      triggerLoginHaptic();
      setActiveTab(defaultTab);
    }
  }, [defaultTab, open]);

  useAnimeScope(
    shellRef,
    ({ root }) => {
      if (!open) {
        return;
      }

      const layoutRoot = root.querySelector<HTMLElement>("[data-auth-layout]");
      if (canUseDomAnimation() && layoutRoot) {
        layoutRef.current = createLayout(layoutRoot, {
          children: "[data-auth-layout-item]",
          duration: 720,
          ease: motionTokens.ease.entrance,
          enterFrom: {
            opacity: 0,
            y: 20,
            scale: 0.97,
          },
          leaveTo: {
            opacity: 0,
            y: -14,
            scale: 0.97,
          },
        });
      }

      createMountTimeline(root, "[data-auth-dialog-intro]", {
        staggerDelay: 90,
        y: 18,
      });

      const halo = root.querySelector("[data-auth-dialog-halo]");
      if (halo) {
        animate(halo, {
          opacity: [0.2, 0.46],
          scale: [0.96, 1.06],
          duration: motionTokens.duration.loop,
          ease: motionTokens.ease.settle,
          alternate: true,
          loop: true,
        });
      }

      return () => {
        layoutRef.current?.revert();
        layoutRef.current = null;
      };
    },
    [activeTab, open],
  );

  const handleTabChange = (nextTab: "login" | "register") => {
    if (nextTab === activeTab) {
      return;
    }

    const commitTab = () => {
      flushSync(() => {
        setActiveTab(nextTab);
      });
    };

    if (prefersReducedMotion || !layoutRef.current) {
      commitTab();
      return;
    }

    layoutRef.current.update(commitTab, {
      duration: 720,
      ease: motionTokens.ease.entrance,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="overflow-hidden border-white/50 bg-background/92 p-0 shadow-[0_30px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl sm:max-w-[470px]"
        dir="rtl"
      >
        <div ref={shellRef} className="relative px-6 py-6">
          <div
            data-auth-dialog-halo
            className="pointer-events-none absolute inset-x-8 top-4 h-28 rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18),rgba(14,165,233,0.12),rgba(255,255,255,0))] blur-2xl"
          />

          <DialogHeader className="relative text-center sm:text-center">
            <DialogTitle data-auth-dialog-intro className="text-center">
              ברוך הבא לחטיבון
            </DialogTitle>
            <DialogDescription
              data-auth-dialog-intro
              className="text-center leading-6"
            >
              התחברו או הירשמו כדי לכתוב, לשמור טיוטות ולפרסם כתבות לקהילת בית
              הספר
            </DialogDescription>
          </DialogHeader>

          <div
            data-auth-dialog-intro
            className="relative mt-5 rounded-full border border-foreground/8 bg-muted/70 p-1"
            role="tablist"
            aria-label="אפשרויות התחברות"
          >
            <div className="grid grid-cols-2 gap-1">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "login"}
                onClick={() => handleTabChange("login")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "login"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                התחברות
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "register"}
                onClick={() => handleTabChange("register")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  activeTab === "register"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                הרשמה
              </button>
            </div>
          </div>

          <div data-auth-layout className="relative mt-4">
            <div data-auth-layout-item>
              {activeTab === "login" ? (
                <LoginForm onSuccess={() => onOpenChange(false)} />
              ) : (
                <RegisterForm onSuccess={() => onOpenChange(false)} />
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
