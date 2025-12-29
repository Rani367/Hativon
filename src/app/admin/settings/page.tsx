"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Check, AlertCircle } from "lucide-react";
import { logError } from "@/lib/logger";

interface MonthOption {
  year: number;
  month: string;
  hebrewMonth: string;
  postCount: number;
  isDefault: boolean;
}

interface DefaultMonthData {
  currentDefault: {
    year: number;
    month: string;
    hebrewMonth: string;
  } | null;
  availableMonths: MonthOption[];
  pendingMonth: {
    year: number;
    month: string;
    hebrewMonth: string;
    postCount: number;
  } | null;
}

export default function AdminSettingsPage() {
  const [data, setData] = useState<DefaultMonthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  async function fetchData() {
    try {
      const response = await fetch("/api/admin/settings/default-month");
      if (!response.ok) {
        throw new Error("Failed to fetch settings");
      }
      const result = await response.json();
      setData(result);

      // Set initial selected value
      if (result.currentDefault) {
        setSelectedMonth(
          `${result.currentDefault.year}-${result.currentDefault.month}`,
        );
      }
    } catch (error) {
      logError("Failed to fetch settings:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  async function handleSave() {
    if (!selectedMonth) return;

    const [yearStr, month] = selectedMonth.split("-");
    const year = parseInt(yearStr, 10);

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings/default-month", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save");
      }

      setMessage({ type: "success", text: "Default month updated" });
      await fetchData(); // Refresh data
    } catch (error) {
      logError("Failed to save default month:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to save",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleApprovePending() {
    if (!data?.pendingMonth) return;

    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/settings/default-month", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: data.pendingMonth.year,
          month: data.pendingMonth.month,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to approve");
      }

      setMessage({ type: "success", text: "New month approved as default" });
      await fetchData(); // Refresh data
    } catch (error) {
      logError("Failed to approve pending month:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to approve",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <div className="h-9 w-32 rounded bg-muted animate-pulse" />
          <div className="h-4 w-64 rounded bg-muted animate-pulse" />
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 w-48 rounded bg-muted animate-pulse" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-10 w-full rounded bg-muted animate-pulse" />
            <div className="h-10 w-32 rounded bg-muted animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">הגדרות</h1>
        <p className="text-muted-foreground mt-1">
          נהל את הגדרות האתר
        </p>
      </div>

      {/* Pending Month Alert */}
      {data?.pendingMonth && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-amber-800 dark:text-amber-200">
                חודש חדש מחכה לאישור
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="font-medium text-lg">
                  {data.pendingMonth.hebrewMonth} {data.pendingMonth.year}
                </p>
                <p className="text-sm text-muted-foreground">
                  {data.pendingMonth.postCount} כתבות מפורסמות
                </p>
              </div>
              <Button
                onClick={handleApprovePending}
                disabled={saving}
                className="bg-amber-600 hover:bg-amber-700"
              >
                {saving ? "מאשר..." : "אשר כחודש ברירת מחדל"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Default Month */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <CardTitle>חודש ברירת מחדל</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-sm text-muted-foreground">
            החודש שיוצג כברירת מחדל בעמוד הבית. כשמשתמשים נכנסים לאתר, הם יראו
            את כתבות החודש הזה.
          </p>

          {data?.currentDefault && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-medium">
                כרגע מוגדר: {data.currentDefault.hebrewMonth}{" "}
                {data.currentDefault.year}
              </span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">בחר חודש</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="w-full sm:w-[300px]">
                  <SelectValue placeholder="בחר חודש..." />
                </SelectTrigger>
                <SelectContent>
                  {data?.availableMonths.map((m) => (
                    <SelectItem
                      key={`${m.year}-${m.month}`}
                      value={`${m.year}-${m.month}`}
                    >
                      <div className="flex items-center gap-2">
                        <span>
                          {m.hebrewMonth} {m.year}
                        </span>
                        <span className="text-muted-foreground text-xs">
                          ({m.postCount} כתבות)
                        </span>
                        {m.isDefault && (
                          <span className="text-green-600 text-xs">[נוכחי]</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={handleSave} disabled={saving || !selectedMonth}>
              {saving ? "שומר..." : "שמור שינויים"}
            </Button>
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg ${
                message.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200"
                  : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200"
              }`}
            >
              {message.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* All Months List */}
      {data?.availableMonths && data.availableMonths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>כל החודשים עם כתבות</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {data.availableMonths.map((m) => (
                <div
                  key={`${m.year}-${m.month}`}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    m.isDefault
                      ? "bg-primary/10 border border-primary"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {m.isDefault && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                    <span className="font-medium">
                      {m.hebrewMonth} {m.year}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {m.postCount} כתבות
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
