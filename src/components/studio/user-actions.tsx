"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveTeacher,
  demoteTeacher,
  dismissResetRequest,
  makeResetLink,
  removeUser,
} from "@/app/admin/actions";
import type { FormState } from "@/lib/form-state";
import { studioCopy } from "@/lib/studio-copy";

const { admin: text } = studioCopy;

interface UserActionsProps {
  id: string;
  isSelf: boolean;
  isTeacher: boolean;
  isPending: boolean;
  resetRequested: boolean;
}

export function UserActions({
  id,
  isSelf,
  isTeacher,
  isPending,
  resetRequested,
}: UserActionsProps) {
  const [pending, startTransition] = useTransition();
  const [link, setLink] = useState<string | null>(null);

  function run(action: () => Promise<FormState>) {
    startTransition(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      if (result.value) setLink(result.value);
    });
  }

  function button(label: string, action: () => Promise<FormState>) {
    return (
      <button
        type="button"
        className="text-button"
        disabled={pending}
        onClick={() => run(action)}
      >
        {label}
      </button>
    );
  }

  return (
    <>
      <div className="row-actions">
        {isPending ? button(text.approve, () => approveTeacher(id)) : null}
        {!isSelf && isTeacher ? button(text.demote, () => demoteTeacher(id)) : null}
        {button(text.resetLink, () => makeResetLink(id))}
        {resetRequested ? button(text.dismiss, () => dismissResetRequest(id)) : null}
        {!isSelf ? (
          <button
            type="button"
            className="text-button"
            disabled={pending}
            onClick={() => {
              if (window.confirm(text.confirmDeleteUser)) run(() => removeUser(id));
            }}
          >
            {text.deleteUser}
          </button>
        ) : null}
      </div>

      {link ? (
        <div className="link-box">
          <span>{text.linkReady}</span>
          <code dir="ltr">{link}</code>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              void navigator.clipboard.writeText(link);
              toast.success(text.copied);
            }}
          >
            {text.copy}
          </button>
        </div>
      ) : null}
    </>
  );
}
