import { useCallback, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, PanelLeft } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { PageContainer } from "@/components/templates/page-container";
import { PagePanel } from "@/components/templates/page-panel";
import { PageScrollArea } from "@/components/templates/page-scroll-area";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type PreferencesSection = {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
};

type PreferencesSplitLayoutProps = {
  title: string;
  description: string;
  sections: PreferencesSection[];
  loading?: boolean;
  loadingMessage?: string;
};

function PreferencesSectionNav({
  sections,
  selectedId,
  onSelect,
}: {
  sections: PreferencesSection[];
  selectedId: string;
  onSelect: (sectionId: string) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {sections.map((section) => {
        const selected = section.id === selectedId;

        return (
          <button
            key={section.id}
            type="button"
            onClick={() => onSelect(section.id)}
            className={cn(
              "flex w-full flex-col gap-0.5 border-b border-border/50 px-4 py-3.5 text-left transition-colors hover:bg-muted/40",
              selected && "bg-muted/60",
            )}
          >
            <span className="text-sm font-semibold text-foreground">
              {section.title}
            </span>
            {section.description ? (
              <span className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {section.description}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function PreferencesSplitLayout({
  title,
  description,
  sections,
  loading = false,
  loadingMessage = "Carregando…",
}: PreferencesSplitLayoutProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [listSheetOpen, setListSheetOpen] = useState(false);

  const sectionParam = searchParams.get("section")?.trim() ?? "";
  const explicitSection = sections.find((section) => section.id === sectionParam);

  const selectSection = useCallback(
    (sectionId: string) => {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set("section", sectionId);
        return next;
      });
      setListSheetOpen(false);
    },
    [setSearchParams],
  );

  const clearSection = useCallback(() => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete("section");
      return next;
    });
  }, [setSearchParams]);

  const activeSection = useMemo(() => {
    if (explicitSection) return explicitSection;
    return sections[0] ?? null;
  }, [explicitSection, sections]);

  const inStage = Boolean(explicitSection);
  const navSelectedId = activeSection?.id ?? "";

  const pageHeader = (
    <PageContainer.Header title={title} description={description} />
  );

  const navBody = loading ? (
    <p className="px-4 py-6 text-sm text-muted-foreground">{loadingMessage}</p>
  ) : (
    <PreferencesSectionNav
      sections={sections}
      selectedId={navSelectedId}
      onSelect={selectSection}
    />
  );

  const detailBody = loading ? (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      {loadingMessage}
    </div>
  ) : activeSection ? (
    <PagePanel className="flex min-h-0 flex-1 flex-col border-0 bg-transparent md:rounded-none md:border-l md:border-border/60 md:bg-card">
      <PagePanel.Body>
        <PageScrollArea contentClassName="space-y-5 p-4 sm:p-6 md:max-w-3xl">
          {activeSection.content}
        </PageScrollArea>
      </PagePanel.Body>
    </PagePanel>
  ) : (
    <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
      Selecione uma seção na lista ao lado.
    </div>
  );

  return (
    <PageContainer variant="fill">
      <PageContainer.Content width="full" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b border-border/60 px-4 py-4 sm:px-6">
            {pageHeader}
          </div>

          <div className="flex min-h-0 flex-1 overflow-hidden">
            <aside
              className={cn(
                "flex min-h-0 flex-col overflow-hidden border-border/60 md:w-[30%] md:min-w-70 md:max-w-sm md:shrink-0 md:border-r",
                inStage ? "hidden md:flex" : "flex w-full flex-1",
              )}
            >
              <PageScrollArea className="min-h-0 flex-1 bg-transparent">
                {navBody}
              </PageScrollArea>
            </aside>

            <main
              className={cn(
                "flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden",
                inStage ? "w-full md:w-[70%]" : "hidden md:flex",
              )}
            >
              {inStage ? (
                <>
                  <div className="flex shrink-0 items-center gap-2 border-b border-border/60 px-3 py-2 md:hidden">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="min-h-10 gap-2"
                      onClick={clearSection}
                    >
                      <ArrowLeft className="size-4" />
                      Voltar
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="size-10"
                      onClick={() => setListSheetOpen(true)}
                    >
                      <PanelLeft className="size-4" />
                    </Button>
                    <p className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                      {activeSection?.title}
                    </p>
                  </div>
                  {detailBody}
                </>
              ) : (
                detailBody
              )}
            </main>
          </div>
        </div>
      </PageContainer.Content>

      <Sheet open={listSheetOpen} onOpenChange={setListSheetOpen}>
        <SheetContent
          side="left"
          className="flex w-full max-w-md flex-col gap-0 overflow-hidden p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-border">
            <SheetTitle className="text-base font-semibold text-foreground">
              {title}
            </SheetTitle>
          </SheetHeader>
          <PageScrollArea className="min-h-0 flex-1">{navBody}</PageScrollArea>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
}
