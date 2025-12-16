"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md mx-auto px-4">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-6">
            <WifiOff className="h-12 w-12 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold">אין חיבור לאינטרנט</h1>
          <p className="text-muted-foreground">
            נראה שאתה במצב לא מקוון. בדוק את החיבור לאינטרנט ונסה שוב.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            נסה שוב
          </Button>
          <Link href="/">
            <Button variant="outline">חזרה לדף הבית</Button>
          </Link>
        </div>

        <p className="text-sm text-muted-foreground">
          חלק מהתכנים עשויים להיות זמינים במצב לא מקוון
        </p>
      </div>
    </div>
  );
}
