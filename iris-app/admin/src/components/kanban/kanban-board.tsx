import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KANBAN_COLUMNS } from "@/lib/status";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

type KanbanBoardProps = {
  posts: Post[];
  timeZone: string;
  globalReplyMode: ReplyMode;
  onOpenPost: (post: Post) => void;
  onStatusChange: (post: Post, status: PostStatus) => void;
};

export function KanbanBoard({
  posts,
  timeZone,
  globalReplyMode,
  onOpenPost,
  onStatusChange,
}: KanbanBoardProps) {
  return (
    <div className="kanban-scroll flex h-full min-h-0 gap-6 overflow-x-auto pb-2">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          posts={posts.filter((post) => post.status === column.id)}
          timeZone={timeZone}
          globalReplyMode={globalReplyMode}
          onOpenPost={onOpenPost}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
