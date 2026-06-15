"use client";

import { CalendarDays } from "lucide-react";
import { cn, triggerHaptic } from "@/lib/utils";
import { MAARECHET_URL } from "@/lib/constants";

interface ScheduleLinkProps {
  className?: string;
}

/**
 * Link to the sister "מערכת שעות" (school schedule) app.
 * Styled to match the header's ArchiveMenuButton: icon-only on mobile,
 * icon + label from the `sm` breakpoint up.
 */
export function ScheduleLink({ className }: ScheduleLinkProps) {
  return (
    <a
      href={MAARECHET_URL}
      onClick={() => triggerHaptic()}
      className={cn(
        "flex h-11 min-w-11 items-center justify-center gap-2 rounded-lg px-3 transition-colors hover:bg-accent",
        className,
      )}
      aria-label="מערכת שעות"
    >
      <CalendarDays className="h-5 w-5" />
      <span className="hidden text-sm font-medium sm:inline">מערכת שעות</span>
    </a>
  );
}
