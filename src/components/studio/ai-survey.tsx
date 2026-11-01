"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { saveAiSurvey } from "@/app/dashboard/actions";
import { studioCopy } from "@/lib/studio-copy";
import { Modal } from "./modal";

const { survey: text } = studioCopy;

// Closing it postpones the question for this session, not forever.
const SNOOZE_KEY = "aiImageSurveySnoozed";

function isSnoozed(): boolean {
  try {
    return sessionStorage.getItem(SNOOZE_KEY) === "1";
  } catch {
    return false;
  }
}

interface SurveyPost {
  id: string;
  title: string;
  aiGeneratedImage: boolean;
}

/** Asks once about older posts, from before covers were labelled. */
export function AiSurvey({ posts }: { posts: SurveyPost[] }) {
  const [open, setOpen] = useState(() =>
    typeof window === "undefined" ? false : !isSnoozed(),
  );
  const [answers, setAnswers] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(posts.map((post) => [post.id, post.aiGeneratedImage])),
  );
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function snooze() {
    try {
      sessionStorage.setItem(SNOOZE_KEY, "1");
    } catch {
      // Then it just asks again next time.
    }
    setOpen(false);
  }

  return (
    <Modal title={text.title} onClose={snooze}>
      <p>{text.body}</p>

      <div className="survey-list">
        {posts.map((post) => (
          <label key={post.id}>
            <span>{post.title}</span>
            <input
              type="checkbox"
              aria-label={text.checkbox}
              checked={answers[post.id]}
              onChange={(event) =>
                setAnswers((current) => ({
                  ...current,
                  [post.id]: event.target.checked,
                }))
              }
            />
          </label>
        ))}
      </div>

      <div className="modal-actions">
        <button type="button" className="button button-quiet" onClick={snooze}>
          {text.later}
        </button>
        <button
          type="button"
          className="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await saveAiSurvey(answers);
              toast.success(text.saved);
              setOpen(false);
            })
          }
        >
          {text.save}
        </button>
      </div>
    </Modal>
  );
}
