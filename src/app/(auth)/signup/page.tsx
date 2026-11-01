import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ActionForm } from "@/components/studio/action-form";
import { getSessionUser } from "@/lib/auth/session";
import { studioCopy } from "@/lib/studio-copy";
import { signup } from "../actions";

const { auth: text } = studioCopy;

export const metadata: Metadata = { title: text.signupTitle };

export default async function SignupPage() {
  if (await getSessionUser()) redirect("/dashboard");

  return (
    <>
      <h1 className="auth-title">{text.signupTitle}</h1>
      <ActionForm action={signup} submitLabel={text.signup} className="form signup-form">
        <label className="field">
          <span>{text.displayName}</span>
          <input name="displayName" autoComplete="name" minLength={2} required />
        </label>
        <label className="field">
          <span>{text.username}</span>
          <input
            name="username"
            autoComplete="username"
            dir="ltr"
            pattern="[a-zA-Z0-9_]{3,50}"
            required
          />
          <small>{text.usernameHint}</small>
        </label>
        <label className="field">
          <span>{text.password}</span>
          <input
            name="password"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            minLength={8}
            required
          />
        </label>
        <label className="field">
          <span>{text.confirmPassword}</span>
          <input
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            dir="ltr"
            required
          />
        </label>

        <fieldset className="field choice">
          <legend>{text.role}</legend>
          <label>
            <input type="radio" name="role" value="student" defaultChecked />
            {text.student}
          </label>
          <label>
            <input type="radio" name="role" value="teacher" />
            {text.teacher}
          </label>
        </fieldset>

        {/* Shown or hidden by the radio above, in CSS, so this needs no script. */}
        <div className="field-row student-only">
          <label className="field">
            <span>{text.grade}</span>
            <select name="grade" defaultValue="">
              <option value="" />
              {["ז", "ח", "ט", "י"].map((grade) => (
                <option key={grade}>{grade}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>{text.classNumber}</span>
            <select name="classNumber" defaultValue="">
              <option value="" />
              {[1, 2, 3, 4].map((number) => (
                <option key={number}>{number}</option>
              ))}
            </select>
          </label>
        </div>
        <small className="teacher-only">{text.teacherHint}</small>

        <label className="field">
          <span>{text.classCode}</span>
          <input name="classCode" autoComplete="off" dir="ltr" required />
          <small>{text.classCodeHint}</small>
        </label>
      </ActionForm>
      <p className="auth-links">
        <Link href="/login">{text.toLogin}</Link>
      </p>
    </>
  );
}
