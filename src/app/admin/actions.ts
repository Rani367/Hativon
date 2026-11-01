"use server";

import { revalidatePath } from "next/cache";
import { requireTeacher } from "@/lib/auth/guards";
import { monthNumberToEnglish, monthNumberToHebrew } from "@/lib/date/months";
import type { FormState } from "@/lib/form-state";
import { getMergeGroups, getIssues } from "@/lib/issues/issues";
import {
  HOME_ISSUE_PIN_SETTING_KEY,
  MERGED_ISSUES_SETTING_KEY,
  type MergeGroup,
  monthIndex,
} from "@/lib/issues/merge-core";
import { refreshAllPublicPages } from "@/lib/public-cache";
import { SIGNUP_CODE_KEY, setSetting } from "@/lib/settings";
import { CREATOR_USERNAME, getSiteUrl } from "@/lib/site";
import { studioCopy } from "@/lib/studio-copy";
import {
  clearPasswordResetFlag,
  countTeachers,
  createResetToken,
  deleteUser,
  getUserById,
  setTeacher,
} from "@/lib/users/queries";

const { admin: text } = studioCopy;

async function guardOtherUser(id: string) {
  const teacher = await requireTeacher();
  if (id === teacher.id) return { error: text.notSelf };
  return { teacher };
}

export async function approveTeacher(id: string): Promise<FormState> {
  const { error } = await guardOtherUser(id);
  if (error) return { error };

  await setTeacher(id, true);
  revalidatePath("/admin/users");
  return { success: text.saved };
}

export async function demoteTeacher(id: string): Promise<FormState> {
  const { error } = await guardOtherUser(id);
  if (error) return { error };

  if ((await countTeachers()) <= 1) return { error: text.lastTeacher };

  await setTeacher(id, false);
  revalidatePath("/admin/users");
  return { success: text.saved };
}

export async function removeUser(id: string): Promise<FormState> {
  const { error } = await guardOtherUser(id);
  if (error) return { error };

  const target = await getUserById(id);
  if (target?.isTeacher && (await countTeachers()) <= 1) {
    return { error: text.lastTeacher };
  }

  await deleteUser(id);
  // Their posts stay, with the byline marked as deleted.
  refreshAllPublicPages();
  revalidatePath("/admin/users");
  return { success: text.saved };
}

export async function makeResetLink(id: string): Promise<FormState> {
  const teacher = await requireTeacher();

  const target = await getUserById(id);
  if (!target) return { error: text.notSelf };

  // Otherwise one teacher could take over another's account.
  if (target.isTeacher && teacher.username !== CREATOR_USERNAME) {
    return { error: text.onlyCreator };
  }

  const token = await createResetToken(target.id);
  await clearPasswordResetFlag(target.id);
  revalidatePath("/admin/users");
  return { value: `${getSiteUrl()}/reset-password?token=${token}` };
}

export async function dismissResetRequest(id: string): Promise<FormState> {
  await requireTeacher();

  await clearPasswordResetFlag(id);
  revalidatePath("/admin/users");
  return { success: text.saved };
}

function parseMonth(value: FormDataEntryValue | null) {
  const match = /^(\d{4})-(\d{2})$/.exec(String(value ?? ""));
  if (!match) return null;

  const [year, month] = [Number(match[1]), Number(match[2])];
  return month >= 1 && month <= 12 ? { year, month } : null;
}

/** Choosing "auto" stores nothing to pin, and the newest full issue is shown. */
export async function pinHomeIssue(_: FormState, form: FormData): Promise<FormState> {
  await requireTeacher();

  const pin = parseMonth(form.get("issue"));
  await setSetting(HOME_ISSUE_PIN_SETTING_KEY, pin ? JSON.stringify(pin) : "");

  // The old app reads these, so rolling back would still show the right issue.
  const issues = await getIssues();
  const shown = pin ?? issues[0];
  if (shown) {
    await setSetting("default_month", monthNumberToEnglish(shown.month) ?? "");
    await setSetting("default_year", String(shown.year));
  }

  refreshAllPublicPages();
  revalidatePath("/admin/issues");
  return { success: text.saved };
}

async function saveMergeGroups(groups: MergeGroup[]) {
  await setSetting(MERGED_ISSUES_SETTING_KEY, JSON.stringify(groups));
  refreshAllPublicPages();
  revalidatePath("/admin/issues");
}

export async function mergeMonths(_: FormState, form: FormData): Promise<FormState> {
  await requireTeacher();

  const start = parseMonth(form.get("from"));
  const end = parseMonth(form.get("to"));

  if (
    !start ||
    !end ||
    monthIndex(start.year, start.month) >= monthIndex(end.year, end.month)
  ) {
    return { error: text.mergeInvalid };
  }

  const groups = await getMergeGroups();
  const overlaps = groups.some(
    (group) =>
      monthIndex(start.year, start.month) <=
        monthIndex(group.endYear, group.endMonth) &&
      monthIndex(end.year, end.month) >=
        monthIndex(group.startYear, group.startMonth),
  );
  if (overlaps) return { error: text.mergeOverlap };

  await saveMergeGroups([
    ...groups,
    {
      startYear: start.year,
      startMonth: start.month,
      endYear: end.year,
      endMonth: end.month,
      canonicalYear: end.year,
      canonicalMonth: end.month,
      label: `${monthNumberToHebrew(start.month)}–${monthNumberToHebrew(end.month)}`,
    },
  ]);
  return { success: text.saved };
}

export async function unmergeMonths(
  startYear: number,
  startMonth: number,
): Promise<void> {
  await requireTeacher();

  const groups = await getMergeGroups();
  await saveMergeGroups(
    groups.filter(
      (group) =>
        group.startYear !== startYear || group.startMonth !== startMonth,
    ),
  );
}

export async function saveSignupCode(_: FormState, form: FormData): Promise<FormState> {
  await requireTeacher();

  const code = String(form.get("code") ?? "").trim();
  await setSetting(SIGNUP_CODE_KEY, code);
  revalidatePath("/admin/issues");
  return { success: text.saved };
}
