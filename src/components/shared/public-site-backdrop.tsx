"use client";

import { animate, stagger } from "animejs";
import { useRef } from "react";
import {
  motionTokens,
  useAnimeScope,
  useReducedMotionPreference,
} from "@/lib/anime/motion";

export function PublicSiteBackdrop() {
  const rootRef = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotionPreference();

  useAnimeScope(
    rootRef,
    ({ root }) => {
      if (prefersReducedMotion) {
        return;
      }

      const orbs = Array.from(
        root.querySelectorAll<HTMLElement>("[data-backdrop-orb]"),
      );

      orbs.forEach((orb, index) => {
        animate(orb, {
          translateX: index % 2 === 0 ? 18 : -24,
          translateY: index % 2 === 0 ? -24 : 18,
          scale: index % 2 === 0 ? 1.08 : 0.92,
          opacity: [0.22, 0.42],
          duration: motionTokens.duration.loop + 1000,
          delay: stagger(260)(orb, index, orbs.length),
          ease: motionTokens.ease.settle,
          alternate: true,
          loop: true,
        });
      });

      const grid = root.querySelector("[data-backdrop-grid]");
      if (grid) {
        animate(grid, {
          opacity: [0.12, 0.2],
          scale: [1, 1.03],
          duration: motionTokens.duration.loop + 1800,
          ease: motionTokens.ease.settle,
          alternate: true,
          loop: true,
        });
      }

      const beam = root.querySelector("[data-backdrop-beam]");
      if (beam) {
        animate(beam, {
          translateY: ["-6%", "6%"],
          rotate: [0, 6],
          opacity: [0.16, 0.34],
          duration: motionTokens.duration.loop + 2400,
          ease: motionTokens.ease.settle,
          alternate: true,
          loop: true,
        });
      }
    },
    [prefersReducedMotion],
  );

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        data-backdrop-grid
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
          maskImage:
            "radial-gradient(circle at center, rgba(0,0,0,0.9), transparent 78%)",
        }}
      />
      <div
        data-backdrop-beam
        className="absolute inset-x-[12%] top-[-12rem] h-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.16),rgba(251,191,36,0))] blur-3xl"
      />
      <div
        data-backdrop-orb
        className="absolute top-24 left-[-8rem] h-64 w-64 rounded-full bg-amber-200/30 blur-3xl"
      />
      <div
        data-backdrop-orb
        className="absolute top-40 right-[-7rem] h-72 w-72 rounded-full bg-sky-200/30 blur-3xl"
      />
      <div
        data-backdrop-orb
        className="absolute bottom-[-9rem] left-[18%] h-80 w-80 rounded-full bg-rose-200/20 blur-3xl"
      />
    </div>
  );
}
