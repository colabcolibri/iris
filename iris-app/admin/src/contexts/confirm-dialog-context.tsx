import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ConfirmDialog,
  type ConfirmDialogProps,
} from "@/components/templates/confirm-dialog";

type ConfirmRequest = Omit<
  ConfirmDialogProps,
  "open" | "onOpenChange" | "onConfirm" | "loading"
>;

type ConfirmDialogContextValue = {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
};

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(
  null,
);

export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const close = useCallback((result: boolean) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setOpen(false);
    setRequest(null);
    resolve?.(result);
  }, []);

  const confirm = useCallback((next: ConfirmRequest) => {
    return new Promise<boolean>((resolve) => {
      if (resolverRef.current) {
        resolverRef.current(false);
        resolverRef.current = null;
      }
      resolverRef.current = resolve;
      setRequest(next);
      setOpen(true);
    });
  }, []);

  const value = useMemo(() => ({ confirm }), [confirm]);

  return (
    <ConfirmDialogContext.Provider value={value}>
      {children}
      {request ? (
        <ConfirmDialog
          open={open}
          onOpenChange={(next) => {
            if (!next) {
              // Cancel / Escape — se já confirmou, resolver já é null.
              close(false);
            }
          }}
          title={request.title}
          description={request.description}
          confirmLabel={request.confirmLabel}
          cancelLabel={request.cancelLabel}
          confirmPhrase={request.confirmPhrase}
          confirmPhraseHint={request.confirmPhraseHint}
          variant={request.variant}
          onConfirm={async () => {
            close(true);
          }}
        />
      ) : null}
    </ConfirmDialogContext.Provider>
  );
}

export function useConfirmDialog() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error(
      "useConfirmDialog must be used within ConfirmDialogProvider",
    );
  }
  return context;
}
