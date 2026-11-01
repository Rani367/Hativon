import type { Metadata } from "next";
import { UserActions } from "@/components/studio/user-actions";
import { requireTeacher } from "@/lib/auth/guards";
import { studioCopy } from "@/lib/studio-copy";
import { listUsers } from "@/lib/users/queries";
import { type User, isPendingTeacher } from "@/lib/users/types";

const { admin: text, auth } = studioCopy;

export const metadata: Metadata = { title: text.usersTitle };

function UserRow({ user, viewerId }: { user: User; viewerId: string }) {
  return (
    <article className="row">
      <p className="row-title">{user.displayName}</p>
      <p className="row-meta">
        <span dir="ltr">{user.username}</span>
        {user.isTeacher ? <span>{text.teacherBadge}</span> : null}
        {user.grade && user.classNumber ? (
          <span>{`${auth.grade} ${user.grade}${user.classNumber}`}</span>
        ) : null}
      </p>
      <UserActions
        id={user.id}
        isSelf={user.id === viewerId}
        isTeacher={user.isTeacher}
        isPending={isPendingTeacher(user)}
        resetRequested={user.passwordResetRequested}
      />
    </article>
  );
}

function Section({
  title,
  users,
  viewerId,
}: {
  title?: string;
  users: User[];
  viewerId: string;
}) {
  if (users.length === 0) return null;

  return (
    <>
      {title ? <h2 className="studio-subtitle">{title}</h2> : null}
      <div className="rows">
        {users.map((user) => (
          <UserRow key={user.id} user={user} viewerId={viewerId} />
        ))}
      </div>
    </>
  );
}

export default async function AdminUsersPage() {
  const teacher = await requireTeacher();
  const users = await listUsers();

  const pending = users.filter(isPendingTeacher);
  const resets = users.filter((user) => user.passwordResetRequested);

  return (
    <>
      <h1 className="studio-title">{text.usersTitle}</h1>
      <Section title={text.pendingTitle} users={pending} viewerId={teacher.id} />
      <Section title={text.resetRequests} users={resets} viewerId={teacher.id} />
      <Section
        title={pending.length + resets.length > 0 ? text.usersTitle : undefined}
        users={users}
        viewerId={teacher.id}
      />
    </>
  );
}
