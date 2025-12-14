"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/features/auth/auth-provider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { logError } from "@/lib/logger";
import { User as UserIcon, Save, Loader2, AlertCircle } from "lucide-react";
import { Grade } from "@/types/user.types";

interface ProfileFormData {
  displayName: string;
  grade: Grade | null;
  classNumber: number | null;
}

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<ProfileFormData | null>(null);

  const isTeacher = user?.isTeacher || false;

  // Initialize form data only when user data is available
  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        grade: user.grade || null,
        classNumber: user.classNumber || null,
      });
    }
  }, [user]);

  // Check if any changes were made
  const hasChanges =
    formData &&
    user &&
    (formData.displayName.trim() !== (user.displayName || "") ||
      (!isTeacher &&
        (formData.grade !== (user.grade || null) ||
          formData.classNumber !== (user.classNumber || null))));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData) return;

    // Validate display name
    if (!formData.displayName.trim()) {
      toast.error("שם התצוגה הוא שדה חובה");
      return;
    }

    // Validate grade selection (only for students)
    if (!isTeacher && !formData.grade) {
      toast.error("יש לבחור כיתה");
      return;
    }

    // Validate class number (only for students)
    if (
      !isTeacher &&
      (formData.classNumber === null ||
        formData.classNumber < 1 ||
        formData.classNumber > 4)
    ) {
      toast.error("מספר כיתה חייב להיות בין 1 ל-4");
      return;
    }

    try {
      setSaving(true);

      const updateData: Record<string, unknown> = {
        displayName: formData.displayName.trim(),
      };

      // Only include grade/class for students
      if (!isTeacher) {
        updateData.grade = formData.grade;
        updateData.classNumber = formData.classNumber;
      }

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }

      // Refresh user data in auth context
      await checkAuth();

      toast.success("הפרופיל עודכן בהצלחה");
      router.push("/dashboard");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logError("Failed to update profile:", error);
      toast.error(`שגיאה בעדכון הפרופיל: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while user data is loading
  if (!user || !formData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Helper to get grade display text
  const getGradeDisplay = (grade: Grade | null) => {
    if (!grade) return null;
    const gradeMap: Record<Grade, string> = {
      ז: "כיתה ז",
      ח: "כיתה ח",
      ט: "כיתה ט",
      י: "כיתה י",
    };
    return gradeMap[grade];
  };

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
        <p className="text-muted-foreground mt-1">עדכן את פרטי הפרופיל שלך</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            פרטי משתמש
            {isTeacher && (
              <Badge className="bg-amber-500 text-white ms-2">מורה</Badge>
            )}
          </CardTitle>
          <CardDescription>
            שם המשתמש: <strong>@{user.username}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-right block">
                שם תצוגה <span className="text-destructive">*</span>
              </Label>
              <Input
                id="displayName"
                type="text"
                value={formData.displayName}
                onChange={(e) =>
                  setFormData({ ...formData, displayName: e.target.value })
                }
                placeholder="השם שיוצג בכתבות שלך"
                className="text-right"
                required
              />
              <p className="text-xs text-muted-foreground text-right">
                זהו השם שיוצג על הכתבות שלך
              </p>
            </div>

            {/* Grade and Class Number - Side by Side (Students only) */}
            {!isTeacher && (
              <>
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2">
                    <Label htmlFor="classNumber" className="text-right block">
                      מספר כיתה <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.classNumber?.toString() || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, classNumber: Number(value) })
                      }
                    >
                      <SelectTrigger
                        id="classNumber"
                        className="w-full"
                        dir="rtl"
                      >
                        <SelectValue placeholder="בחר מספר" />
                      </SelectTrigger>
                      <SelectContent className="text-right" dir="rtl">
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="grade" className="text-right block">
                      כיתה <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.grade || ""}
                      onValueChange={(value) =>
                        setFormData({ ...formData, grade: value as Grade })
                      }
                    >
                      <SelectTrigger id="grade" className="w-full" dir="rtl">
                        <SelectValue placeholder="בחר כיתה">
                          {formData.grade
                            ? getGradeDisplay(formData.grade)
                            : "בחר כיתה"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="text-right" dir="rtl">
                        <SelectItem value="ז">כיתה ז</SelectItem>
                        <SelectItem value="ח">כיתה ח</SelectItem>
                        <SelectItem value="ט">כיתה ט</SelectItem>
                        <SelectItem value="י">כיתה י</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Warning if grade not selected */}
                {!formData.grade && (
                  <div className="flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 text-amber-600 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <p className="text-sm">יש לבחור כיתה לפני שמירה</p>
                  </div>
                )}
              </>
            )}

            {/* Preview */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">תצוגה מקדימה:</p>
              <p className="text-sm text-muted-foreground">
                הכתבות שלך יוצגו כ:{" "}
                <strong>
                  {formData.displayName || "שם תצוגה"}
                  {isTeacher
                    ? " (מורה)"
                    : formData.grade
                      ? ` - ${formData.grade}'${formData.classNumber}`
                      : " - [כיתה לא נבחרה]"}
                </strong>
              </p>
            </div>

            {/* Current Values Display */}
            <div className="rounded-lg border bg-blue-500/10 border-blue-500/50 p-4">
              <p className="text-sm font-medium mb-2 text-blue-600 dark:text-blue-400">
                ערכים נוכחיים:
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>
                  שם תצוגה: <strong>{user.displayName || "לא הוגדר"}</strong>
                </p>
                {isTeacher ? (
                  <p>
                    סוג חשבון: <strong>מורה</strong>
                  </p>
                ) : (
                  <>
                    <p>
                      כיתה:{" "}
                      <strong>
                        {user.grade ? getGradeDisplay(user.grade) : "לא הוגדר"}
                      </strong>
                    </p>
                    <p>
                      מספר כיתה:{" "}
                      <strong>{user.classNumber || "לא הוגדר"}</strong>
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/dashboard")}
                disabled={saving}
              >
                ביטול
              </Button>
              <Button
                type="submit"
                disabled={
                  saving || !hasChanges || (!isTeacher && !formData.grade)
                }
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 me-2" />
                    שמור שינויים
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
