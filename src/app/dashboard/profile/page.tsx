"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/features/auth/auth-provider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { toast } from "sonner";
import { logError } from '@/lib/logger';
import { User as UserIcon, Save, Loader2 } from "lucide-react";
import { Grade } from "@/types/user.types";

export default function ProfilePage() {
  const { user, checkAuth } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    grade: "" as Grade,
    classNumber: 1,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || "",
        grade: user.grade,
        classNumber: user.classNumber,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.displayName.trim()) {
      toast.error("שם התצוגה הוא שדה חובה");
      return;
    }

    if (formData.classNumber < 1 || formData.classNumber > 4) {
      toast.error("מספר כיתה חייב להיות בין 1 ל-4");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update profile");
      }

      const data = await response.json();

      // Refresh user data in auth context
      await checkAuth();

      toast.success("הפרופיל עודכן בהצלחה");
      router.push("/dashboard");
    } catch (error: any) {
      logError("Failed to update profile:", error);
      toast.error(`שגיאה בעדכון הפרופיל: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
        <p className="text-muted-foreground mt-1">
          עדכן את פרטי הפרופיל שלך
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5" />
            פרטי משתמש
          </CardTitle>
          <CardDescription>
            שם המשתמש: <strong>@{user.username}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-right block">שם תצוגה *</Label>
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

            {/* Grade and Class Number - Side by Side */}
            <div className="flex gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="classNumber" className="text-right block">מספר כיתה *</Label>
                <Select
                  value={formData.classNumber.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, classNumber: Number(value) })
                  }
                >
                  <SelectTrigger id="classNumber" className="w-full" dir="rtl">
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
                <Label htmlFor="grade" className="text-right block">כיתה *</Label>
                <Select
                  value={formData.grade}
                  onValueChange={(value) =>
                    setFormData({ ...formData, grade: value as Grade })
                  }
                >
                  <SelectTrigger id="grade" className="w-full" dir="rtl">
                    <SelectValue placeholder="בחר כיתה" />
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

            {/* Preview */}
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium mb-2">תצוגה מקדימה:</p>
              <p className="text-sm text-muted-foreground">
                הכתבות שלך יוצגו כ:{" "}
                <strong>
                  {formData.displayName || "שם תצוגה"} - {formData.grade}'
                  {formData.classNumber}
                </strong>
              </p>
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
              <Button type="submit" disabled={saving}>
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
