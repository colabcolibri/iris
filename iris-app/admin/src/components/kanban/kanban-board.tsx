import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KANBAN_COLUMNS } from "@/lib/status";
import type { Post, PostStatus } from "@/lib/types";

type KanbanBoardProps = {
  posts: Post[];
  onOpenPost: (post: Post) => void;
  onStatusChange: (post: Post, status: PostStatus) => void;
};

export function KanbanBoard({ posts, onOpenPost, onStatusChange }: KanbanBoardProps) {
  return (
    <div className="kanban-scroll flex h-full min-h-0 gap-6 overflow-x-auto pb-2">
      {KANBAN_COLUMNS.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          posts={posts.filter((post) => post.status === column.id)}
          onOpenPost={onOpenPost}
          onStatusChange={onStatusChange}
        />
      ))}
    </div>
  );
}
