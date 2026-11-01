import type { Metadata } from "next";
import { Story } from "@/components/public/story";
import { searchPublishedPosts } from "@/lib/posts/queries";
import type { PostSummary } from "@/lib/posts/types";
import { getClientIp, isRateLimited } from "@/lib/rate-limit";
import { studioCopy } from "@/lib/studio-copy";

const { search: text } = studioCopy;

const MIN_LENGTH = 2;
const MAX_LENGTH = 80;

export const metadata: Metadata = {
  title: text.title,
  robots: { index: false },
};

interface SearchPageProps {
  searchParams: Promise<{ q?: string | string[] }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const term = (typeof q === "string" ? q : "").trim().slice(0, MAX_LENGTH);

  let results: PostSummary[] | null = null;
  let message: string | null = null;

  if (term.length >= MIN_LENGTH) {
    if (await isRateLimited("search", await getClientIp())) {
      message = text.tooMany;
    } else {
      results = await searchPublishedPosts(term);
      message = results.length === 0 ? text.empty(term) : text.results(results.length);
    }
  } else if (term) {
    message = text.tooShort;
  }

  return (
    <main id="main" className="archive">
      <h1 className="archive-title">{text.title}</h1>

      {/* A plain GET form: it works with no JavaScript, and results can be shared. */}
      <form className="search-form" role="search">
        <input
          name="q"
          type="search"
          aria-label={text.label}
          placeholder={text.label}
          defaultValue={term}
          maxLength={MAX_LENGTH}
          autoFocus={!term}
        />
        <button type="submit">{text.button}</button>
      </form>

      {message ? <p className="search-count">{message}</p> : null}

      {results && results.length > 0 ? (
        <div className="search-results">
          {results.map((post) => (
            <Story key={post.id} post={post} />
          ))}
        </div>
      ) : null}
    </main>
  );
}
