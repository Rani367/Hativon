import Link from "next/link";
import { AiSurvey } from "@/components/studio/ai-survey";
import { PostFilter } from "@/components/studio/post-filter";
import { PostRows } from "@/components/studio/post-rows";
import { requireUser } from "@/lib/auth/guards";
import { listPosts } from "@/lib/posts/studio";
import { studioCopy } from "@/lib/studio-copy";

const { list: text, nav } = studioCopy;

interface DashboardPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireUser();
  const { q, status } = await searchParams;
  const filter = {
    search: q || undefined,
    status: status === "published" || status === "draft" ? status : undefined,
  };

  const [posts, all] = await Promise.all([
    listPosts(filter, user.id),
    user.aiImageSurveyDismissed ? [] : listPosts({}, user.id),
  ]);

  const unlabelled = all.filter((post) => post.coverImage);
  const filtering = Boolean(filter.search || filter.status);

  return (
    <main id="main" className="studio-page">
      <h1 className="studio-title">{nav.myArticles}</h1>

      {posts.length > 0 || filtering ? (
        <PostFilter search={filter.search} status={filter.status} />
      ) : null}

      {posts.length > 0 ? (
        <>
          <PostRows posts={posts} />
          <p className="studio-note">{text.readsSince}</p>
        </>
      ) : filtering ? (
        <p className="studio-note">{text.empty}</p>
      ) : (
        <>
          <p className="studio-note">{text.none}</p>
          <p>
            <Link className="button" href="/dashboard/posts/new">
              {text.start}
            </Link>
          </p>
        </>
      )}

      {unlabelled.length > 0 ? <AiSurvey posts={unlabelled} /> : null}
    </main>
  );
}
