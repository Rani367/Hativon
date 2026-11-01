import { copy } from "@/lib/copy";

export default function NotFound() {
  return (
    <main id="main" className="notice">
      <h1>{copy.errors.notFoundTitle}</h1>
      <p>{copy.errors.notFoundBody}</p>
      <a href="/">{copy.nav.home}</a>
    </main>
  );
}
