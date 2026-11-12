import type { Metadata } from "next";
import { ActionForm } from "@/components/studio/action-form";
import {
  getIssueLabel,
  getIssues,
  getMergeGroups,
} from "@/lib/issues/issues";
import {
  HOME_ISSUE_PIN_SETTING_KEY,
  findMergeGroup,
  monthIndex,
  parseHomeIssuePin,
} from "@/lib/issues/merge-core";
import { getArchiveMonths } from "@/lib/posts/queries";
import { monthNumberToHebrew } from "@/lib/date/months";
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
  const [issues, months, groups, rawPin, code] = await Promise.all([
    getIssues(),
    getArchiveMonths(),
    getMergeGroups(),
    getSetting(HOME_ISSUE_PIN_SETTING_KEY),
    getSetting(SIGNUP_CODE_KEY),
  ]);

  const pin = parseHomeIssuePin(rawPin);
  // Months with articles that aren't already part of a merge, oldest first.
  const mergeable = months
    .filter((m) => !findMergeGroup(groups, m.year, m.month))
    .sort((a, b) => monthIndex(a.year, a.month) - monthIndex(b.year, b.month));

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
          {(["from", "to"] as const).map((name) => (
            <label key={name} className="field">
              <span>{text[name]}</span>
              <select name={name} required defaultValue="">
                <option value="" disabled>
                  {text.chooseMonth}
                </option>
                {mergeable.map((m) => (
                  <option
                    key={monthValue(m.year, m.month)}
                    value={monthValue(m.year, m.month)}
                  >
                    {`${monthNumberToHebrew(m.month)} ${m.year}`}
                  </option>
                ))}
              </select>
            </label>
          ))}
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
