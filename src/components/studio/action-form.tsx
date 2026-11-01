"use client";

import { type ReactNode, useActionState } from "react";
import type { FormState } from "@/lib/form-state";

interface ActionFormProps {
  action: (state: FormState, form: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
}

/** A form that sends to a Server Action and shows what came back. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "form",
}: ActionFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={className}>
      {children}

      {state.error ? (
        <p className="form-error" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="form-success" role="status">
          {state.success}
        </p>
      ) : null}

      <button type="submit" className="button" disabled={pending}>
        {submitLabel}
      </button>
    </form>
  );
}
