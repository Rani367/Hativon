"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronDown, ChevronUp, Calendar } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import type { ArchiveMonth } from "@/lib/posts/queries";
import {
  monthNumberToEnglish,
  monthNumberToHebrew,
  getCurrentMonthYear,
} from "@/lib/date/months";

interface ArchiveSidebarProps {
  archives: ArchiveMonth[];
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

export function ArchiveSidebar({ archives }: ArchiveSidebarProps) {
  const params = useParams();
  const currentYear = params?.year ? parseInt(params.year as string, 10) : null;
  const currentMonth = params?.month ? (params.month as string) : null;

  // Get current month/year for "Latest" link
  const { year: latestYear, month: latestMonth } = getCurrentMonthYear();
  const isLatestPage =
    currentYear === latestYear && currentMonth === latestMonth;

  // Group archives by year
  const yearGroups: YearGroup[] = [];
  const yearsMap = new Map<number, YearGroup>();

  for (const archive of archives) {
    if (!yearsMap.has(archive.year)) {
      const yearGroup: YearGroup = {
        year: archive.year,
        months: [],
      };
      yearsMap.set(archive.year, yearGroup);
      yearGroups.push(yearGroup);
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

  // State to track if sidebar is open (default: false)
  const [isOpen, setIsOpen] = useState(false);

  // State to track which years are expanded (default: current year)
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

  if (yearGroups.length === 0) {
    return (
      <aside className="w-full lg:w-64 bg-card overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            <h2 className="text-lg font-semibold">ארכיון</h2>
          </div>
          {isOpen ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4">
                <p className="text-sm text-muted-foreground">
                  אין כתבות בארכיון
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-64 bg-card border-s border-border overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent transition-colors"
      >
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          <h2 className="text-lg font-semibold">ארכיון</h2>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="space-y-2 px-4 pb-4 overflow-hidden"
          >
            <div className="overflow-y-auto max-h-[calc(100vh-12rem)]">
              <Link
                href={`/${latestYear}/${latestMonth}`}
                className={cn(
                  "block px-3 py-2 rounded-lg text-sm font-semibold transition-colors mb-2",
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
                      onClick={() => toggleYear(yearGroup.year)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors",
                        "hover:bg-accent",
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

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <div className="mt-1 me-4 space-y-1">
                            {yearGroup.months.map((month) => {
                              const isActive =
                                isCurrentYear &&
                                currentMonth === month.monthNameEn;

                              return (
                                <Link
                                  key={month.month}
                                  href={`/${yearGroup.year}/${month.monthNameEn}`}
                                  className={cn(
                                    "block px-3 py-2 rounded-lg text-sm transition-colors",
                                    "hover:bg-accent",
                                    isActive &&
                                      "bg-primary text-primary-foreground hover:bg-primary/90",
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>
                                      גיליון {month.monthNameHe}{" "}
                                      {yearGroup.year}
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
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </aside>
  );
}
