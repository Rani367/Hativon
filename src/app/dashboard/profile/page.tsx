import type { Metadata } from "next";
import { ActionForm } from "@/components/studio/action-form";
import { requireUser } from "@/lib/auth/guards";
import { studioCopy } from "@/lib/studio-copy";
import { saveProfile } from "../actions";

const { auth: text, nav } = studioCopy;

export const metadata: Metadata = { title: nav.profile };

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <main id="main" className="studio-page narrow">
      <h1 className="studio-title">{nav.profile}</h1>

      <ActionForm action={saveProfile} submitLabel={text.save}>
        <label className="field">
          <span>{text.username}</span>
          <input value={user.username} dir="ltr" disabled readOnly />
        </label>
        <label className="field">
          <span>{text.displayName}</span>
          <input
            name="displayName"
            defaultValue={user.displayName}
            minLength={2}
            required
          />
        </label>

        {user.grade ? (
          <div className="field-row">
            <label className="field">
              <span>{text.grade}</span>
              <select name="grade" defaultValue={user.grade}>
                {["ז", "ח", "ט", "י"].map((grade) => (
                  <option key={grade}>{grade}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>{text.classNumber}</span>
              <select name="classNumber" defaultValue={user.classNumber ?? 1}>
                {[1, 2, 3, 4].map((number) => (
                  <option key={number}>{number}</option>
                ))}
              </select>
            </label>
          </div>
        ) : null}
      </ActionForm>
    </main>
  );
}
