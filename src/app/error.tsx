"use client";

import { copy } from "@/lib/copy";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="notice">
      <h1>{copy.errors.failedTitle}</h1>
      <p>{copy.errors.failedBody}</p>
      <button type="button" onClick={reset}>
        {copy.errors.retry}
      </button>
    </main>
  );
}
