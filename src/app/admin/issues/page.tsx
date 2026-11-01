import type { Metadata } from "next";
import { ActionForm } from "@/components/studio/action-form";
import {
  getIssueLabel,
  getIssues,
  getMergeGroups,
} from "@/lib/issues/issues";
import {
  HOME_ISSUE_PIN_SETTING_KEY,
  parseHomeIssuePin,
} from "@/lib/issues/merge-core";
import { SIGNUP_CODE_KEY, getSetting } from "@/lib/settings";
import { studioCopy } from "@/lib/studio-copy";
import {
  mergeMonths,
  pinHomeIssue,
  saveSignupCode,
  unmergeMonths,
} from "../actions";

const { admin: text } = studioCopy;

export const metadata: Metadata = { title: text.issuesTitle };

const monthValue = (year: number, month: number) =>
  `${year}-${String(month).padStart(2, "0")}`;

export default async function AdminIssuesPage() {
  const [issues, groups, rawPin, code] = await Promise.all([
    getIssues(),
    getMergeGroups(),
    getSetting(HOME_ISSUE_PIN_SETTING_KEY),
    getSetting(SIGNUP_CODE_KEY),
  ]);

  const pin = parseHomeIssuePin(rawPin);

  return (
    <div className="narrow">
      <h1 className="studio-title">{text.issuesTitle}</h1>

      <h2 className="studio-subtitle">{text.homeTitle}</h2>
      <ActionForm action={pinHomeIssue} submitLabel={text.saveHome}>
        <label className="field">
          <small>{text.homeHint}</small>
          <select
            name="issue"
            defaultValue={pin ? monthValue(pin.year, pin.month) : ""}
          >
            <option value="">{text.automatic}</option>
            {issues.map((issue) => (
              <option
                key={monthValue(issue.year, issue.month)}
                value={monthValue(issue.year, issue.month)}
              >
                {`${getIssueLabel(issue)} ${issue.year}`}
              </option>
            ))}
          </select>
        </label>
      </ActionForm>

      <h2 className="studio-subtitle">{text.mergeTitle}</h2>
      <p className="studio-note">{text.mergeHint}</p>

      {groups.length > 0 ? (
        <div className="rows" style={{ marginBlock: "1rem" }}>
          {groups.map((group) => (
            <div key={`${group.startYear}-${group.startMonth}`} className="row">
              <p className="row-title">{`${group.label} ${group.canonicalYear}`}</p>
              <form
                className="row-actions"
                action={unmergeMonths.bind(null, group.startYear, group.startMonth)}
              >
                <button type="submit" className="text-button">
                  {text.unmerge}
                </button>
              </form>
            </div>
          ))}
        </div>
      ) : null}

      <ActionForm action={mergeMonths} submitLabel={text.merge}>
        <div className="field-row">
          <label className="field">
            <span>{text.from}</span>
            <input type="month" name="from" dir="ltr" required />
          </label>
          <label className="field">
            <span>{text.to}</span>
            <input type="month" name="to" dir="ltr" required />
          </label>
        </div>
      </ActionForm>

      <h2 className="studio-subtitle">{text.codeTitle}</h2>
      <ActionForm action={saveSignupCode} submitLabel={text.saveCode}>
        <label className="field">
          <small>{text.codeHint}</small>
          <input name="code" dir="ltr" defaultValue={code ?? ""} autoComplete="off" />
        </label>
      </ActionForm>
    </div>
  );
}
