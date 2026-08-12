import { ScrollArea } from "@/components/ui/scroll-area";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KANBAN_COLUMNS } from "@/lib/status";
import type { Post, PostStatus, ReplyMode } from "@/lib/types";

type KanbanBoardProps = {
  posts: Post[];
  timeZone: string;
  globalReplyMode: ReplyMode;
  onOpenPost: (post: Post) => void;
  onStatusChange: (post: Post, status: PostStatus) => void;
  onPurgePost?: (post: Post) => void;
};

export function KanbanBoard({
  posts,
  timeZone,
  globalReplyMode,
  onOpenPost,
  onStatusChange,
  onPurgePost,
}: KanbanBoardProps) {
  return (
    <div className="min-h-0 min-w-0 flex-1 overflow-hidden">
      <ScrollArea className="h-full w-full">
        <div className="flex h-full min-h-0 w-max min-w-full gap-6 pb-2">
          {KANBAN_COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              posts={posts.filter((post) => post.status === column.id)}
              timeZone={timeZone}
              globalReplyMode={globalReplyMode}
              onOpenPost={onOpenPost}
              onStatusChange={onStatusChange}
              onPurgePost={onPurgePost}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
