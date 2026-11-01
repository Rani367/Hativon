"use client";

import { copy } from "@/lib/copy";

export function PrintButton() {
  return (
    <button
      type="button"
      className="print-button"
      onClick={() => window.print()}
    >
      {copy.print.button}
    </button>
  );
}
