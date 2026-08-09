import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanColumnShell } from "@/components/templates/kanban-column-shell";
import type { Post, PostStatus } from "@/lib/types";

const EMPTY_MESSAGES: Partial<Record<PostStatus, string>> = {
  cancelled: "Solte aqui para cancelar",
};

type KanbanColumnProps = {
  column: { id: PostStatus; label: string };
  posts: Post[];
  timeZone: string;
  onOpenPost: (post: Post) => void;
  onStatusChange: (post: Post, status: PostStatus) => void;
};

export function KanbanColumn({
  column,
  posts,
  timeZone,
  onOpenPost,
  onStatusChange,
}: KanbanColumnProps) {
  return (
    <KanbanColumnShell status={column.id} label={column.label} count={posts.length}>
      {posts.length === 0 ? (
        <KanbanColumnShell.Empty message={EMPTY_MESSAGES[column.id]} />
      ) : (
        posts.map((post) => (
          <KanbanCard
            key={post.id}
            post={post}
            timeZone={timeZone}
            onOpen={() => onOpenPost(post)}
            onStatusChange={(status) => onStatusChange(post, status)}
          />
        ))
      )}
    </KanbanColumnShell>
  );
}
