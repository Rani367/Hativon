import { redirect } from "next/navigation";
import type { User } from "@/lib/users/types";
import { getSessionUser } from "./session";

/** For pages and actions. Sends anyone signed out to the login page. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

export async function requireTeacher(): Promise<User> {
  const user = await requireUser();
  if (!user.isTeacher) redirect("/dashboard");
  return user;
}

/**
 * For route handlers. Server Actions get this check from Next itself. Combined
 * with SameSite cookies, this stops other sites making requests as the user.
 */
export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}
