import { useEffect, useId, useState, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Se definido, o usuário precisa digitar exatamente este texto para confirmar. */
  confirmPhrase?: string;
  confirmPhraseHint?: string;
  variant?: "default" | "destructive";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/** Template sobre AlertDialog do shadcn — confirmação destrutiva com frase opcional. */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  confirmPhrase,
  confirmPhraseHint,
  variant = "default",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const inputId = useId();
  const [typed, setTyped] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!open) {
      setTyped("");
      setPending(false);
    }
  }, [open]);

  const phraseRequired = Boolean(confirmPhrase);
  const phraseOk = !phraseRequired || typed.trim() === confirmPhrase;
  const busy = loading || pending;

  async function handleConfirm() {
    if (!phraseOk || busy) {
      return;
    }
    setPending(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // Mantém aberto para o usuário tentar de novo / cancelar.
    } finally {
      setPending(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="default" className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-lg font-semibold tracking-tight">
            {title}
          </AlertDialogTitle>
          {description ? <AlertDialogDescription>{description}</AlertDialogDescription> : null}
        </AlertDialogHeader>

        {phraseRequired && confirmPhrase ? (
          <div className="space-y-2">
            <Label htmlFor={inputId} className="text-sm font-medium text-foreground">
              {confirmPhraseHint ?? (
                <>
                  Digite <span className="font-mono font-semibold">{confirmPhrase}</span> para
                  confirmar
                </>
              )}
            </Label>
            <Input
              id={inputId}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              autoFocus
              disabled={busy}
              className="font-mono"
              placeholder={confirmPhrase}
            />
          </div>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>{cancelLabel}</AlertDialogCancel>
          <Button
            type="button"
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={!phraseOk || busy}
            className={cn(variant === "destructive" && "bg-destructive text-white")}
            onClick={() => void handleConfirm()}
          >
            {busy ? "Aguarde…" : confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
