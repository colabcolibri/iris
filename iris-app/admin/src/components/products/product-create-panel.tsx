import { Loader2, Plus } from "lucide-react";
import { PagePanel } from "@/components/templates/page-panel";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ProductCreatePanelProps = {
  slug: string;
  name: string;
  creating: boolean;
  onSlugChange: (value: string) => void;
  onNameChange: (value: string) => void;
  onSubmit: () => void;
};

export function ProductCreatePanel({
  slug,
  name,
  creating,
  onSlugChange,
  onNameChange,
  onSubmit,
}: ProductCreatePanelProps) {
  return (
    <PagePanel className="flex min-h-0 flex-1 flex-col border-0 bg-transparent md:rounded-none md:border-l md:border-border/60 md:bg-card">
      <PagePanel.Header
        title="Novo produto"
        description="Slug único usado na triagem. Nome e descrições podem ser editados depois."
      />
      <PagePanel.Body>
        <PageScrollArea contentClassName="p-4 sm:p-6">
          <div className="mx-auto w-full max-w-2xl space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-new-slug" className="text-sm font-semibold">
                Slug
              </Label>
              <Input
                id="product-new-slug"
                value={slug}
                onChange={(event) => onSlugChange(event.target.value)}
                placeholder="plano-premium"
                className="h-11 font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-new-name" className="text-sm font-semibold">
                Nome
              </Label>
              <Input
                id="product-new-name"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
                placeholder="Plano premium"
                className="h-11"
              />
            </div>
          </div>

          <Button
            type="button"
            disabled={creating}
            onClick={onSubmit}
            className="w-full sm:w-auto"
          >
            {creating ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <Plus className="size-4" aria-hidden />
            )}
            Criar produto
          </Button>
          </div>
        </PageScrollArea>
      </PagePanel.Body>
    </PagePanel>
  );
}
