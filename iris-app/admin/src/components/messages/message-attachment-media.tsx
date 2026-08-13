import { ImageIcon, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type MessageAttachmentMediaProps = {
  url: string;
  mediaType?: string | null;
  className?: string;
};

function isVideoAttachment(mediaType: string | null | undefined, url: string): boolean {
  const type = mediaType?.toLowerCase() ?? "";
  if (type.includes("video")) {
    return true;
  }
  return /\.(mp4|mov|webm)(\?|$)/i.test(url);
}

export function MessageAttachmentMedia({
  url,
  mediaType,
  className,
}: MessageAttachmentMediaProps) {
  const isVideo = isVideoAttachment(mediaType, url);

  return (
    <div
      className={cn(
        "relative mt-2 w-full max-w-sm overflow-hidden rounded-[var(--iris-radius-lg)] bg-muted/80 ring-1 ring-border/60",
        className,
      )}
    >
      <div className="relative aspect-[4/5] max-h-72 w-full">
        {isVideo ? (
          <>
            <img
              src={url}
              alt=""
              className="absolute inset-0 size-full object-cover"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
              <PlayCircle className="size-10 text-white drop-shadow-md" />
            </div>
          </>
        ) : (
          <img
            src={url}
            alt=""
            className="absolute inset-0 size-full object-contain p-1"
            loading="lazy"
          />
        )}
      </div>
      {!isVideo ? (
        <div className="sr-only">
          <ImageIcon aria-hidden />
        </div>
      ) : null}
    </div>
  );
}
