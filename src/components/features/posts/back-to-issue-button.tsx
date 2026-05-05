"use client";

import { useRouter } from "next/navigation";
import { getRememberedIssuePath } from "@/lib/navigation/last-issue-path";
import { triggerHaptic } from "@/lib/utils";

interface BackToIssueButtonProps {
  postId: string;
}

export function BackToIssueButton({ postId }: BackToIssueButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    triggerHaptic();

    const rememberedIssuePath = getRememberedIssuePath(postId);
    if (rememberedIssuePath && window.history.length > 1) {
      window.history.back();
      return;
    }

    router.push(rememberedIssuePath || "/");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex min-h-10 items-center rounded-full border px-3 py-1 text-sm text-muted-foreground transition-colors hover:bg-muted"
    >
      חזרה לגיליון
    </button>
  );
}
