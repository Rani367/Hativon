'use client';

import { cn } from "@/lib/utils";
import Image from "next/image";
import type React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// Use Prism version for better compatibility with Next.js
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
// Use ESM version instead of CJS for better tree-shaking
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Badge } from "./ui/badge";

const components = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="mb-4 font-bold text-4xl">{children}</h1>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="mb-4">{children}</p>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a href={href} className="text-blue-500">
      {children}
    </a>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="mb-4 list-disc ps-5">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="mb-4 list-decimal ps-5">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="mb-2">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="mb-4 border-neutral-300 border-s-2 py-2 ps-4 italic">
      {children}
    </blockquote>
  ),
  code: ({
    className,
    children,
    ...props
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => {
    const match = /language-(\w+)/.exec(className || "");
    return match ? (
      <SyntaxHighlighter
        style={vscDarkPlus}
        language={match[1]}
        PreTag="div"
        {...props}
        className="rounded-md [&>code]:bg-transparent [&>code]:p-2 [&>code]:rounded-md"
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    ) : (
      <Badge variant="pre" className="font-mono rounded-md text-sm">
        {children}
      </Badge>
    );
  },
  pre: ({ className, ...props }: React.HTMLAttributes<HTMLPreElement>) => {
    return <pre className={cn("bg-transparent p-0", className)} {...props} />;
  },
  img: ({ src, alt }: { src?: string | Blob; alt?: string }) => {
    const imageUrl = src
      ? typeof src === "string"
        ? src
        : URL.createObjectURL(src)
      : "";
    return (
      <div className="relative mb-4 w-full aspect-video rounded-md overflow-hidden">
        <Image
          src={imageUrl}
          alt={alt || ""}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyMCIgaGVpZ2h0PSIxMDgwIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZlcnNpb249IjEuMSIvPg=="
        />
      </div>
    );
  },
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="mb-2 font-bold text-2xl">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="mb-1 font-bold text-xl">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="mb-1 font-bold text-lg">{children}</h4>
  ),
  h5: ({ children }: { children?: React.ReactNode }) => (
    <h5 className="mb-1 font-bold text-base">{children}</h5>
  ),
  h6: ({ children }: { children?: React.ReactNode }) => (
    <h6 className="mb-1 font-bold text-sm">{children}</h6>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <Table className="rounded-md">{children}</Table>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <TableHeader className="bg-muted first:rounded-t-md">
      {children}
    </TableHeader>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <TableBody className="[&>tr:nth-child(even)]:bg-muted/50">
      {children}
    </TableBody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <TableRow className="border-border group">{children}</TableRow>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <TableCell className="border-r border-border last:border-r-0 group-last:first:rounded-bl-md group-last:last:rounded-br-md">
      {children}
    </TableCell>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <TableHead className="font-bold  border-r border-border last:border-r-0 first:rounded-tl-md last:rounded-tr-md">
      {children}
    </TableHead>
  ),
};

export { components };
