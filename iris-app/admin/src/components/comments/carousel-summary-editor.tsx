import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PostFormSection } from "@/components/posts/post-form-section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePostCarouselSummary, updatePost } from "@/lib/api";

type CarouselSummaryEditorProps = {
  postId?: string;
  initialSummary?: string | null;
  summary?: string;
  onSummaryChange?: (value: string) => void;
  embedded?: boolean;
};

export function CarouselSummaryEditor({
  postId,
  initialSummary,
  summary: controlledSummary,
  onSummaryChange,
  embedded = false,
}: CarouselSummaryEditorProps) {
  const isControlled = onSummaryChange !== undefined;
  const [internalSummary, setInternalSummary] = useState(initialSummary ?? "");
  const summary = isControlled ? (controlledSummary ?? "") : internalSummary;
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!isControlled) {
      setInternalSummary(initialSummary ?? "");
    }
  }, [initialSummary, postId, isControlled]);

  function setSummary(value: string) {
    if (isControlled) {
      onSummaryChange?.(value);
    } else {
      setInternalSummary(value);
    }
  }

  async function handleSave() {
    if (!postId) return;
    setSaving(true);
    try {
      await updatePost(postId, { carousel_summary: summary.trim() || null });
      toast.success("Resumo do carrossel salvo.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao salvar resumo.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerate() {
    if (!postId) return;
    setGenerating(true);
    try {
      const result = await generatePostCarouselSummary(postId);
      setSummary(result.carousel_summary);
      toast.success("Resumo gerado com IA (visão nas imagens).");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao gerar resumo.",
      );
    } finally {
      setGenerating(false);
    }
  }

  const textarea = (
    <Textarea
      id={postId ? `carousel-summary-${postId}` : "carousel-summary-pending"}
      rows={5}
      value={summary}
      onChange={(event) => setSummary(event.target.value)}
      placeholder="Descreva o que aparece no carrossel…"
      className="min-h-[7.5rem] resize-y bg-background"
    />
  );

  if (embedded) {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          O harness usa este texto em vez das imagens. Para posts do Iris usa os
          arquivos locais; para publicações externas, busca as URLs do Instagram
          na Meta.
        </p>
        {textarea}
        {postId ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 size-3.5" />
              )}
              Gerar com IA
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Salvar resumo
            </Button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <PostFormSection
      title="Resumo do carrossel"
      description="O harness usa este texto em vez das imagens. Para posts do Iris usa os arquivos locais; para publicações externas, busca as URLs do Instagram na Meta."
      action={
        postId ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void handleGenerate()}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Sparkles className="mr-1.5 size-3.5" />
              )}
              Gerar com IA
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => void handleSave()}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : null}
              Salvar resumo
            </Button>
          </div>
        ) : null
      }
    >
      {textarea}
    </PostFormSection>
  );
}
