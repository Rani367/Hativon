/** What a Server Action behind a form hands back to show the person. */
export interface FormState {
  error?: string;
  success?: string;
  /** A value to show, like a generated reset link. */
  value?: string;
}
