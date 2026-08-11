import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PostFormSection } from "@/components/posts/post-form-section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generatePostCarouselSummary, updatePost } from "@/lib/api";

type CarouselSummaryEditorProps = {
  postId: string;
  initialSummary?: string | null;
};

export function CarouselSummaryEditor({
  postId,
  initialSummary,
}: CarouselSummaryEditorProps) {
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    setSummary(initialSummary ?? "");
  }, [initialSummary, postId]);

  async function handleSave() {
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

  return (
    <PostFormSection
      title="Resumo do carrossel"
      description="O harness usa este texto em vez das imagens. Para posts do Iris usa os arquivos locais; para publicações externas, busca as URLs do Instagram na Meta."
      action={
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
      }
    >
      <Textarea
        id={`carousel-summary-${postId}`}
        rows={5}
        value={summary}
        onChange={(event) => setSummary(event.target.value)}
        placeholder="Descreva o que aparece no carrossel…"
        className="min-h-[7.5rem] resize-y bg-background"
      />
    </PostFormSection>
  );
}
