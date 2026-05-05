"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { X, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn, triggerHaptic } from "@/lib/utils";
import type { ArchiveMonth } from "@/lib/posts/queries";
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
  const currentYear = params?.year ? parseInt(params.year as string, 10) : null;
  const currentMonth = params?.month ? (params.month as string) : null;

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

  const toggleYear = (year: number) => {
    setExpandedYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) {
        next.delete(year);
      } else {
        next.add(year);
      }
      return next;
    });
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50"
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
          />

          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed right-0 top-0 z-50 h-dvh w-[min(20rem,calc(100vw-1rem))] overflow-y-auto overscroll-contain bg-card shadow-xl"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-4 py-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <h2 className="text-lg font-semibold">ארכיון</h2>
              </div>
              <button
                onClick={() => {
                  triggerHaptic();
                  onClose();
                }}
                className="inline-flex size-11 items-center justify-center rounded-lg transition-colors hover:bg-accent"
                aria-label="סגור תפריט"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4">
              {archives.length === 0 ? (
                <p className="text-sm text-muted-foreground">טוען...</p>
              ) : yearGroups.length === 0 ? (
                <p className="text-sm text-muted-foreground">אין כתבות בארכיון</p>
              ) : (
                <nav className="space-y-2">
                  <Link
                    href={`/${latestYear}/${latestMonth}`}
                    prefetch={false}
                    onClick={() => {
                      triggerHaptic();
                      onClose();
                    }}
                    className={cn(
                      "block rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                      "hover:bg-accent",
                      isLatestPage &&
                        "bg-primary text-primary-foreground hover:bg-primary/90",
                    )}
                  >
                    הגיליון האחרון
                  </Link>

                  {yearGroups.map((yearGroup) => {
                    const isExpanded = expandedYears.has(yearGroup.year);
                    const isCurrentYear = currentYear === yearGroup.year;

                    return (
                      <div key={yearGroup.year}>
                        <button
                          onClick={() => {
                            triggerHaptic();
                            toggleYear(yearGroup.year);
                          }}
                          className={cn(
                            "flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors",
                            "hover:bg-accent",
                            isCurrentYear && "bg-accent/50",
                          )}
                        >
                          <span className="font-semibold">{yearGroup.year}</span>
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: "easeInOut" }}
                              className="overflow-hidden"
                            >
                              <div className="me-4 mt-1 space-y-1">
                                {yearGroup.months.map((month) => {
                                  const isActive =
                                    isCurrentYear &&
                                    currentMonth === month.monthNameEn;

                                  return (
                                    <Link
                                      key={month.month}
                                      href={`/${yearGroup.year}/${month.monthNameEn}`}
                                      prefetch={false}
                                      onClick={() => {
                                        triggerHaptic();
                                        onClose();
                                      }}
                                      className={cn(
                                        "block rounded-lg px-3 py-2 text-sm transition-colors",
                                        "hover:bg-accent",
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
                                  );
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </nav>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
