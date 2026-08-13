import { KanbanCard } from "@/components/kanban/kanban-card";
import { KanbanColumnShell } from "@/components/templates/kanban-column-shell";
import { useDomainMessages } from "@/i18n/provider";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

type KanbanColumnProps = {
  column: { id: PostStatus; label: string };
  posts: Post[];
  timeZone: string;
  globalReplyMode: ReplyMode;
  onOpenPost: (post: Post) => void;
  onStatusChange: (post: Post, status: PostStatus) => void;
  onPurgePost?: (post: Post) => void;
};

export function KanbanColumn({
  column,
  posts,
  timeZone,
  globalReplyMode,
  onOpenPost,
  onStatusChange,
  onPurgePost,
}: KanbanColumnProps) {
  const postsMessages = useDomainMessages("posts");
  const emptyMessage =
    column.id === "cancelled"
      ? postsMessages.kanbanColumn.dropToCancel
      : undefined;

  return (
    <KanbanColumnShell
      status={column.id}
      label={column.label}
      count={posts.length}
    >
      {posts.length === 0 ? (
        <KanbanColumnShell.Empty message={emptyMessage} />
      ) : (
        posts.map((post) => (
          <KanbanCard
            key={post.id}
            post={post}
            timeZone={timeZone}
            globalReplyMode={globalReplyMode}
            onOpen={() => onOpenPost(post)}
            onStatusChange={(status) => onStatusChange(post, status)}
            onPurge={onPurgePost ? () => onPurgePost(post) : undefined}
          />
        ))
      )}
    </KanbanColumnShell>
  );
}
