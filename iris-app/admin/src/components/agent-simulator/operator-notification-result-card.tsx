import { Badge } from "@/components/ui/badge";
import type { OperatorNotificationLog } from "@/lib/api";

type OperatorNotificationResultCardProps = {
  notifications: OperatorNotificationLog[];
  labels: {
    title: string;
    none: string;
    channel: string;
    recipient: string;
    statusSent: string;
    statusSkipped: string;
    statusFailed: string;
    error: string;
  };
};

function statusLabel(
  status: OperatorNotificationLog["status"],
  labels: OperatorNotificationResultCardProps["labels"],
) {
  if (status === "sent") return labels.statusSent;
  if (status === "skipped") return labels.statusSkipped;
  return labels.statusFailed;
}

function statusVariant(
  status: OperatorNotificationLog["status"],
): "default" | "secondary" | "destructive" {
  if (status === "sent") return "default";
  if (status === "skipped") return "secondary";
  return "destructive";
}

export function OperatorNotificationResultCard({
  notifications,
  labels,
}: OperatorNotificationResultCardProps) {
  return (
    <section className="mb-6 rounded-(--iris-radius-lg) border border-border bg-card p-4 sm:p-5">
      <h3 className="font-display text-lg font-semibold text-foreground">{labels.title}</h3>

      {notifications.length === 0 ? (
        <p className="mt-2 text-sm text-muted-foreground">{labels.none}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {notifications.map((item) => (
            <li
              key={item.id}
              className="rounded-(--iris-radius-md) border border-border/80 bg-muted/20 px-3 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant={statusVariant(item.status)}>{statusLabel(item.status, labels)}</Badge>
                <span className="text-muted-foreground">
                  {labels.channel}: <span className="text-foreground">{item.channel}</span>
                </span>
              </div>
              {item.recipient ? (
                <p className="mt-2 break-all text-muted-foreground">
                  {labels.recipient}: <span className="text-foreground">{item.recipient}</span>
                </p>
              ) : null}
              {item.error_message ? (
                <p className="mt-2 break-words text-destructive">
                  {labels.error}: {item.error_message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
