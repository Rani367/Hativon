"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { RichTextEditorProps } from "./types";

// Dynamically import the heavy RichTextEditor (TipTap ~150KB)
const RichTextEditor = dynamic(
  () => import("./rich-text-editor").then((mod) => ({ default: mod.RichTextEditor })),
  {
    ssr: false,
    loading: () => (
      <div className="rounded-md border bg-background">
        <div className="flex items-center gap-1 p-2 border-b bg-muted/50">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-px mx-1" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
        <Skeleton className="h-[250px] m-4" />
      </div>
    ),
  }
);

export function LazyRichTextEditor(props: RichTextEditorProps) {
  return <RichTextEditor {...props} />;
}
