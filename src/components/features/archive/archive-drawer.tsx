"use client";

import Link from "next/link";
import { flushSync } from "react-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate, createLayout, stagger } from "animejs";
import { useParams } from "next/navigation";
import { X, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import type { ArchiveMonth } from "@/lib/posts/queries";
import {
  canUseDomAnimation,
  motionTokens,
  useAnimeScope,
  useReducedMotionPreference,
} from "@/lib/anime/motion";
import {
  monthNumberToEnglish,
  monthNumberToHebrew,
  getCurrentMonthYear,
} from "@/lib/date/months";

interface ArchiveDrawerProps {
  archives: ArchiveMonth[];
  isOpen: boolean;
  onClose: () => void;
}

interface YearGroup {
  year: number;
  months: Array<{
    month: number;
    monthNameEn: string;
    monthNameHe: string;
    count: number;
  }>;
}

export function ArchiveDrawer({
  archives,
  isOpen,
  onClose,
}: ArchiveDrawerProps) {
  const params = useParams();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const layoutRef = useRef<ReturnType<typeof createLayout> | null>(null);
  const [shouldRender, setShouldRender] = useState(isOpen);
  const currentYear = params?.year ? parseInt(params.year as string, 10) : null;
  const currentMonth = params?.month ? (params.month as string) : null;
  const prefersReducedMotion = useReducedMotionPreference();

  const { year: latestYear, month: latestMonth } = getCurrentMonthYear();
  const isLatestPage =
    currentYear === latestYear && currentMonth === latestMonth;

  const yearGroups = useMemo(() => {
    const groups: YearGroup[] = [];
    const yearsMap = new Map<number, YearGroup>();

    for (const archive of archives) {
      if (!yearsMap.has(archive.year)) {
        const yearGroup: YearGroup = {
          year: archive.year,
          months: [],
        };
        yearsMap.set(archive.year, yearGroup);
        groups.push(yearGroup);
      }

      const yearGroup = yearsMap.get(archive.year);
      const monthNameEn = monthNumberToEnglish(archive.month);
      const monthNameHe = monthNumberToHebrew(archive.month);

      if (yearGroup && monthNameEn && monthNameHe) {
        yearGroup.months.push({
          month: archive.month,
          monthNameEn,
          monthNameHe,
          count: archive.count,
        });
      }
    }

    return groups;
  }, [archives]);

  const [expandedYears, setExpandedYears] = useState<Set<number>>(
    new Set(currentYear ? [currentYear] : []),
  );

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    }
  }, [isOpen]);

  useEffect(() => {
    setExpandedYears(new Set(currentYear ? [currentYear] : []));
  }, [currentYear]);

  useEffect(() => {
    if (!canUseDomAnimation() || !navRef.current) {
      return;
    }

    layoutRef.current = createLayout(navRef.current, {
      children: "[data-archive-layout-item]",
      duration: 720,
      ease: motionTokens.ease.entrance,
      enterFrom: {
        opacity: 0,
        y: 16,
        scale: 0.96,
      },
      leaveTo: {
        opacity: 0,
        y: -10,
        scale: 0.96,
      },
    });

    return () => {
      layoutRef.current?.revert();
      layoutRef.current = null;
    };
  }, [shouldRender]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.documentElement.style.overflow = "";
    };
  }, [isOpen, onClose]);

  useAnimeScope(
    wrapperRef,
    ({ root }) => {
      if (!shouldRender) {
        return;
      }

      const overlay = root.querySelector<HTMLElement>("[data-archive-overlay]");
      const drawer = root.querySelector<HTMLElement>("[data-archive-panel]");
      const items = root.querySelectorAll("[data-archive-drawer-item]");

      if (isOpen) {
        if (overlay) {
          animate(overlay, {
            opacity: [0, 1],
            duration: 360,
            ease: motionTokens.ease.entrance,
          });
        }

        if (drawer) {
          animate(drawer, {
            translateX: ["104%", "0%"],
            rotate: ["-1.5deg", "0deg"],
            duration: 760,
            ease: motionTokens.ease.entrance,
          });
        }

        if (items.length) {
          animate(items, {
            opacity: [0, 1],
            translateX: [22, 0],
            delay: stagger(55, { start: 160 }),
            duration: 540,
            ease: motionTokens.ease.entrance,
          });
        }

        return;
      }

      if (overlay) {
        animate(overlay, {
          opacity: 0,
          duration: 220,
          ease: motionTokens.ease.settle,
        });
      }

      if (drawer) {
        animate(drawer, {
          translateX: "104%",
          rotate: "-1.5deg",
          duration: 460,
          ease: motionTokens.ease.settle,
          onComplete: () => setShouldRender(false),
        });
      } else {
        setShouldRender(false);
      }
    },
    [isOpen, shouldRender, expandedYears.size],
  );

  if (!shouldRender) {
    return null;
  }

  const toggleYear = (year: number) => {
    const updateExpandedYears = () => {
      flushSync(() => {
        setExpandedYears((previousYears) => {
          const nextYears = new Set(previousYears);
          if (nextYears.has(year)) {
            nextYears.delete(year);
          } else {
            nextYears.add(year);
          }
          return nextYears;
        });
      });
    };

    if (prefersReducedMotion || !layoutRef.current) {
      updateExpandedYears();
      return;
    }

    layoutRef.current.update(updateExpandedYears, {
      duration: 720,
      ease: motionTokens.ease.entrance,
    });
  };

  return (
    <div ref={wrapperRef} className="fixed inset-0 z-50">
      <div
        data-archive-overlay
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          triggerHaptic();
          onClose();
        }}
      />

      <div
        data-archive-panel
        className="absolute top-0 right-0 flex h-full w-80 max-w-[calc(100vw-1rem)] flex-col overflow-y-auto border-l border-border/70 bg-card/92 shadow-[0_26px_90px_rgba(15,23,42,0.22)] backdrop-blur-xl"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border/70 bg-card/92 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h2 className="text-lg font-semibold">ארכיון</h2>
          </div>
          <button
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
            className="rounded-lg p-2 transition-colors hover:bg-accent"
            aria-label="סגור תפריט"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          {archives.length === 0 ? (
            <p className="text-sm text-muted-foreground">טוען...</p>
          ) : yearGroups.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין כתבות בארכיון</p>
          ) : (
            <nav ref={navRef} className="space-y-2">
              <div data-archive-layout-item data-archive-drawer-item>
                <Link
                  href={`/${latestYear}/${latestMonth}`}
                  onClick={() => {
                    triggerHaptic();
                    onClose();
                  }}
                  className={cn(
                    "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent",
                    isLatestPage &&
                      "bg-primary text-primary-foreground hover:bg-primary/90",
                  )}
                >
                  הגיליון האחרון
                </Link>
              </div>

              {yearGroups.map((yearGroup) => {
                const isExpanded = expandedYears.has(yearGroup.year);
                const isCurrentYear = currentYear === yearGroup.year;

                return (
                  <div
                    key={yearGroup.year}
                    data-archive-layout-item
                    data-archive-drawer-item
                    className="space-y-1"
                  >
                    <button
                      onClick={() => {
                        triggerHaptic();
                        toggleYear(yearGroup.year);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-accent",
                        isCurrentYear && "bg-accent/50",
                      )}
                    >
                      <span className="font-semibold">{yearGroup.year}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="me-4 space-y-1 overflow-hidden">
                        {yearGroup.months.map((month) => {
                          const isActive =
                            isCurrentYear && currentMonth === month.monthNameEn;

                          return (
                            <div
                              key={month.month}
                              data-archive-layout-item
                              data-archive-drawer-item
                            >
                              <Link
                                href={`/${yearGroup.year}/${month.monthNameEn}`}
                                onClick={() => {
                                  triggerHaptic();
                                  onClose();
                                }}
                                className={cn(
                                  "block rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent",
                                  isActive &&
                                    "bg-primary text-primary-foreground hover:bg-primary/90",
                                )}
                              >
                                <div className="flex items-center justify-between">
                                  <span>
                                    גיליון {month.monthNameHe} {yearGroup.year}
                                  </span>
                                  <span
                                    className={cn(
                                      "text-xs",
                                      isActive
                                        ? "text-primary-foreground/70"
                                        : "text-muted-foreground",
                                    )}
                                  >
                                    ({month.count})
                                  </span>
                                </div>
                              </Link>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          )}
        </div>
      </div>
    </div>
  );
}
