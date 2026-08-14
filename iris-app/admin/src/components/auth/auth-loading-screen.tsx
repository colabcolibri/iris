import { Loader2 } from "lucide-react";
import { useDomainMessages } from "@/i18n/provider";

/** Tela neutra durante bootstrap de sessão — compartilhada por Protected e Guest. */
export function AuthLoadingScreen() {
  const shell = useDomainMessages("shell");

  return (
    <div className="flex min-h-svh items-center justify-center bg-background">
      <Loader2
        className="size-8 animate-spin text-muted-foreground"
        aria-label={shell.common.verifyingSession}
      />
    </div>
  );
}
