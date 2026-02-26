"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Database, AlertCircle } from "lucide-react";

export function DbNotConfiguredView() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">ניהול משתמשים</h1>
        <p className="text-muted-foreground mt-1">
          צפייה ומחיקה של משתמשים במערכת
        </p>
      </div>

      <Alert variant="warning">
        <Database className="h-4 w-4" />
        <AlertTitle>מסד נתונים לא מוגדר</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>
            ניהול משתמשים דורש חיבור למסד נתונים PostgreSQL. התכונה הזו פועלת
            רק כאשר המערכת מחוברת למסד נתונים.
          </p>
          <div className="mt-4 space-y-2">
            <p className="font-medium">אפשרויות:</p>
            <ul className="list-disc list-inside space-y-1 mr-4">
              <li>
                <strong>פיתוח מקומי:</strong> הגדר{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  POSTGRES_URL
                </code>{" "}
                בקובץ{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  .env.local
                </code>
              </li>
              <li>
                <strong>ייצור (מומלץ):</strong> פרוס לVercel - מסד הנתונים
                יוגדר אוטומטית עם Vercel Postgres
              </li>
            </ul>
          </div>
          <p className="text-xs mt-3 text-muted-foreground">
            לאחר הגדרת מסד הנתונים, רענן את הדף כדי לראות את רשימת המשתמשים.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            הוראות התקנה
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">להגדרה מקומית:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm mr-4">
              <li>התקן PostgreSQL במחשב שלך</li>
              <li>
                הוסף{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  POSTGRES_URL
                </code>{" "}
                לקובץ{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  .env.local
                </code>
              </li>
              <li>
                הרץ{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  pnpm run db:init
                </code>{" "}
                ליצירת הטבלאות
              </li>
              <li>
                הרץ{" "}
                <code className="bg-muted px-1 py-0.5 rounded">
                  pnpm run create-admin
                </code>{" "}
                ליצירת משתמש ראשון
              </li>
              <li>רענן את הדף</li>
            </ol>
          </div>
          <div>
            <h3 className="font-medium mb-2">לפריסה בVercel (מומלץ):</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm mr-4">
              <li>פרוס את הפרויקט לVercel</li>
              <li>הוסף Vercel Postgres דרך לוח הבקרה</li>
              <li>התכונה תעבוד אוטומטית ללא הגדרות נוספות</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
