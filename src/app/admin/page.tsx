import { PostFilter } from "@/components/studio/post-filter";
import { PostRows } from "@/components/studio/post-rows";
import { getPostStats, listPosts } from "@/lib/posts/studio";
import { studioCopy } from "@/lib/studio-copy";

const { admin: text, list } = studioCopy;

interface AdminPageProps {
  searchParams: Promise<{ q?: string; status?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { q, status } = await searchParams;
  const filter = {
    search: q || undefined,
    status: status === "published" || status === "draft" ? status : undefined,
  };

  const [stats, posts] = await Promise.all([getPostStats(), listPosts(filter)]);

  return (
    <>
      <h1 className="studio-title">{text.title}</h1>

      <dl className="stats">
        <div>
          <dt>{text.total}</dt>
          <dd>{stats.total}</dd>
        </div>
        <div>
          <dt>{text.published}</dt>
          <dd>{stats.published}</dd>
        </div>
        <div>
          <dt>{text.drafts}</dt>
          <dd>{stats.drafts}</dd>
        </div>
        <div>
          <dt>{text.week}</dt>
          <dd>{stats.week}</dd>
        </div>
        <div>
          <dt>{text.reads}</dt>
          <dd>{stats.reads}</dd>
        </div>
      </dl>

      <PostFilter search={filter.search} status={filter.status} />

      {posts.length > 0 ? (
        <PostRows posts={posts} showAuthor />
      ) : (
        <p className="studio-note">{list.empty}</p>
      )}
    </>
  );
}
