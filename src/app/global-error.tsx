"use client";

import { copy } from "@/lib/copy";

// Replaces the root layout when it fails, so it has to bring its own html tag.
export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <main>
          <h1>{copy.errors.failedTitle}</h1>
          <p>{copy.errors.failedBody}</p>
          <button type="button" onClick={reset}>
            {copy.errors.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
