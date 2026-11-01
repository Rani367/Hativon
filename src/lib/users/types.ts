export interface User {
  id: string;
  username: string;
  displayName: string;
  grade: string | null;
  classNumber: number | null;
  isTeacher: boolean;
  passwordResetRequested: boolean;
  aiImageSurveyDismissed: boolean;
  /** Raising this signs the user out everywhere. */
  sessionVersion: number;
  createdAt: string;
  lastLogin: string | null;
}

/** Signed up as a teacher and waiting for another teacher to confirm them. */
export function isPendingTeacher(user: User): boolean {
  return !user.isTeacher && user.grade === null;
}
