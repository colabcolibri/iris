import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PostFormSection } from "@/components/posts/post-form-section";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updatePost } from "@/lib/api";

type PostReplyBriefingEditorProps = {
  postId?: string;
  initialReplyPrompt?: string | null;
  initialSilenceSoul?: boolean;
  initialSilencePage?: boolean;
  initialSilenceKnowledge?: boolean;
  initialSilenceRestrictions?: boolean;
  replyPrompt?: string;
  onReplyPromptChange?: (value: string) => void;
  silenceSoul?: boolean;
  onSilenceSoulChange?: (value: boolean) => void;
  silencePage?: boolean;
  onSilencePageChange?: (value: boolean) => void;
  silenceKnowledge?: boolean;
  onSilenceKnowledgeChange?: (value: boolean) => void;
  silenceRestrictions?: boolean;
  onSilenceRestrictionsChange?: (value: boolean) => void;
  embedded?: boolean;
};

const SILENCE_BLOCKS = [
  {
    key: "silence_soul" as const,
    label: "SOUL",
    description: "Omite voz e tom globais neste post.",
  },
  {
    key: "silence_page" as const,
    label: "Sobre a página",
    description: "Omite contexto de perfil/campanha global.",
  },
  {
    key: "silence_knowledge" as const,
    label: "Base de conhecimento",
    description: "Omite fatos e políticas globais.",
  },
  {
    key: "silence_restrictions" as const,
    label: "Restrições",
    description: "Omite restrições editoriais globais.",
  },
] as const;

type SilenceKey = (typeof SILENCE_BLOCKS)[number]["key"];

export function PostReplyBriefingEditor({
  postId,
  initialReplyPrompt,
  initialSilenceSoul = false,
  initialSilencePage = false,
  initialSilenceKnowledge = false,
  initialSilenceRestrictions = false,
  replyPrompt: controlledReplyPrompt,
  onReplyPromptChange,
  silenceSoul: controlledSilenceSoul,
  onSilenceSoulChange,
  silencePage: controlledSilencePage,
  onSilencePageChange,
  silenceKnowledge: controlledSilenceKnowledge,
  onSilenceKnowledgeChange,
  silenceRestrictions: controlledSilenceRestrictions,
  onSilenceRestrictionsChange,
  embedded = false,
}: PostReplyBriefingEditorProps) {
  const isReplyPromptControlled = onReplyPromptChange !== undefined;
  const [internalReplyPrompt, setInternalReplyPrompt] = useState(
    initialReplyPrompt ?? "",
  );
  const replyPrompt = isReplyPromptControlled
    ? (controlledReplyPrompt ?? "")
    : internalReplyPrompt;

  const isSilenceSoulControlled = onSilenceSoulChange !== undefined;
  const [internalSilenceSoul, setInternalSilenceSoul] = useState(
    initialSilenceSoul,
  );
  const silenceSoul = isSilenceSoulControlled
    ? (controlledSilenceSoul ?? false)
    : internalSilenceSoul;

  const isSilencePageControlled = onSilencePageChange !== undefined;
  const [internalSilencePage, setInternalSilencePage] = useState(
    initialSilencePage,
  );
  const silencePage = isSilencePageControlled
    ? (controlledSilencePage ?? false)
    : internalSilencePage;

  const isSilenceKnowledgeControlled = onSilenceKnowledgeChange !== undefined;
  const [internalSilenceKnowledge, setInternalSilenceKnowledge] = useState(
    initialSilenceKnowledge,
  );
  const silenceKnowledge = isSilenceKnowledgeControlled
    ? (controlledSilenceKnowledge ?? false)
    : internalSilenceKnowledge;

  const isSilenceRestrictionsControlled =
    onSilenceRestrictionsChange !== undefined;
  const [internalSilenceRestrictions, setInternalSilenceRestrictions] =
    useState(initialSilenceRestrictions);
  const silenceRestrictions = isSilenceRestrictionsControlled
    ? (controlledSilenceRestrictions ?? false)
    : internalSilenceRestrictions;

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isReplyPromptControlled) {
      setInternalReplyPrompt(initialReplyPrompt ?? "");
    }
    if (!isSilenceSoulControlled) {
      setInternalSilenceSoul(initialSilenceSoul);
    }
    if (!isSilencePageControlled) {
      setInternalSilencePage(initialSilencePage);
    }
    if (!isSilenceKnowledgeControlled) {
      setInternalSilenceKnowledge(initialSilenceKnowledge);
    }
    if (!isSilenceRestrictionsControlled) {
      setInternalSilenceRestrictions(initialSilenceRestrictions);
    }
  }, [
    initialReplyPrompt,
    initialSilenceSoul,
    initialSilencePage,
    initialSilenceKnowledge,
    initialSilenceRestrictions,
    postId,
    isReplyPromptControlled,
    isSilenceSoulControlled,
    isSilencePageControlled,
    isSilenceKnowledgeControlled,
    isSilenceRestrictionsControlled,
  ]);

  const silenceValues: Record<SilenceKey, boolean> = {
    silence_soul: silenceSoul,
    silence_page: silencePage,
    silence_knowledge: silenceKnowledge,
    silence_restrictions: silenceRestrictions,
  };

  function setReplyPrompt(value: string) {
    if (isReplyPromptControlled) {
      onReplyPromptChange?.(value);
    } else {
      setInternalReplyPrompt(value);
    }
  }

  function setSilenceValue(key: SilenceKey, checked: boolean) {
    switch (key) {
      case "silence_soul":
        if (isSilenceSoulControlled) {
          onSilenceSoulChange?.(checked);
        } else {
          setInternalSilenceSoul(checked);
        }
        break;
      case "silence_page":
        if (isSilencePageControlled) {
          onSilencePageChange?.(checked);
        } else {
          setInternalSilencePage(checked);
        }
        break;
      case "silence_knowledge":
        if (isSilenceKnowledgeControlled) {
          onSilenceKnowledgeChange?.(checked);
        } else {
          setInternalSilenceKnowledge(checked);
        }
        break;
      case "silence_restrictions":
        if (isSilenceRestrictionsControlled) {
          onSilenceRestrictionsChange?.(checked);
        } else {
          setInternalSilenceRestrictions(checked);
        }
        break;
    }
  }

  async function handleSave() {
    if (!postId) return;
    setSaving(true);
    try {
      await updatePost(postId, {
        reply_prompt: replyPrompt.trim() || null,
        silence_soul: silenceSoul,
        silence_page: silencePage,
        silence_knowledge: silenceKnowledge,
        silence_restrictions: silenceRestrictions,
      });
      toast.success("Briefing de reply salvo.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Falha ao salvar briefing.",
      );
    } finally {
      setSaving(false);
    }
  }

  const formBody = (
    <>
      <Textarea
        id={postId ? `reply-prompt-${postId}` : "reply-prompt-pending"}
        rows={6}
        value={replyPrompt}
        onChange={(event) => setReplyPrompt(event.target.value)}
        placeholder="Ex.: produto em destaque, preço promocional, link da landing…"
        className="min-h-[9rem] w-full max-w-full resize-y bg-background"
      />

      <div className="w-full max-w-full min-w-0 space-y-3 border-t border-border/60 pt-4">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Silenciar blocos globais
          </p>
          <p className="text-xs text-muted-foreground">
            Marque o que não deve entrar no harness deste post. Os guardrails do
            sistema (regras fixas de segurança) permanecem ativos mesmo ao
            silenciar restrições editoriais.
          </p>
        </div>

        <div className="grid w-full max-w-full min-w-0 gap-3 sm:grid-cols-2">
          {SILENCE_BLOCKS.map((block) => (
            <label
              key={block.key}
              className="flex min-w-0 items-start gap-2 rounded-[var(--iris-radius-sm)] border border-border/60 bg-muted/10 px-3 py-2.5 text-sm"
            >
              <input
                type="checkbox"
                checked={silenceValues[block.key]}
                onChange={(event) =>
                  setSilenceValue(block.key, event.target.checked)
                }
                className="mt-0.5 size-4 shrink-0 rounded border-input"
                aria-label={`Silenciar ${block.label}`}
              />
              <span className="min-w-0 space-y-0.5">
                <span className="block font-medium text-foreground">
                  {block.label}
                </span>
                <span className="block text-xs leading-relaxed text-muted-foreground">
                  {block.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </>
  );

  if (embedded) {
    return (
      <div className="w-full max-w-full min-w-0 space-y-4">
        <p className="text-xs text-muted-foreground">
          Contexto específico desta publicação no harness. Tem precedência sobre
          o conteúdo global do agente quando definido.
        </p>
        {formBody}
        {postId ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Salvar briefing
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <PostFormSection
      title="Briefing de reply"
      description="Contexto específico desta publicação no harness. Tem precedência sobre o conteúdo global do agente quando definido."
      action={
        postId ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : null}
            Salvar briefing
          </Button>
        ) : null
      }
      className="w-full max-w-full min-w-0"
    >
      {formBody}
    </PostFormSection>
  );
}
