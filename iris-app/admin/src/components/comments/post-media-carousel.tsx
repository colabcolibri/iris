import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ImageIcon, Loader2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type CarouselSlide = {
  src: string;
  mediaType?: string | null;
};

type PostMediaCarouselProps = {
  slides: CarouselSlide[];
  loading?: boolean;
  caption?: string | null;
  className?: string;
  layout?: "default" | "hero";
};

const NAV_BUTTON_CLASS =
  "flex size-8 shrink-0 items-center justify-center rounded-full border border-border/60 bg-background text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-30";

function isVideoSlide(slide: CarouselSlide): boolean {
  const type = slide.mediaType?.toUpperCase() ?? "";
  if (type.includes("VIDEO") || type.includes("REEL")) {
    return true;
  }
  return slide.src.toLowerCase().includes(".mp4");
}

export function PostMediaCarousel({
  slides,
  loading = false,
  caption,
  className,
  layout = "default",
}: PostMediaCarouselProps) {
  const [index, setIndex] = useState(0);
  const initial = (caption?.trim()?.[0] ?? "I").toUpperCase();
  const hasMultiple = slides.length > 1;
  const current = slides[index];
  const isHero = layout === "hero";

  useEffect(() => {
    setIndex(0);
  }, [slides]);

  const goPrev = () => {
    setIndex((currentIndex) => (currentIndex === 0 ? slides.length - 1 : currentIndex - 1));
  };

  const goNext = () => {
    setIndex((currentIndex) => (currentIndex === slides.length - 1 ? 0 : currentIndex + 1));
  };

  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden bg-muted/80",
          isHero
            ? "aspect-[4/5] w-full max-h-[min(52vh,520px)] shrink-0"
            : "aspect-[4/5] rounded-[var(--iris-radius-lg)] shadow-[var(--iris-product-shadow)] ring-1 ring-border/60",
        )}
      >
        {current ? (
          <div className="absolute inset-0 flex items-center justify-center p-2">
            {isVideoSlide(current) ? (
              <div className="relative flex size-full items-center justify-center">
                <img
                  key={current.src}
                  src={current.src}
                  alt=""
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/10">
                  <PlayCircle className="size-12 text-white drop-shadow-md" />
                </div>
              </div>
            ) : (
              <img
                key={current.src}
                src={current.src}
                alt=""
                className="max-h-full max-w-full object-contain"
                loading="lazy"
              />
            )}
          </div>
        ) : loading ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center gap-3 bg-muted p-6 text-center",
              isHero ? "size-full" : "absolute inset-0",
            )}
          >
            <div className="flex size-16 items-center justify-center rounded-[var(--iris-radius-lg)] bg-background/80 text-2xl font-semibold text-primary">
              {initial}
            </div>
            <div className="space-y-1">
              <ImageIcon className="mx-auto size-5 text-muted-foreground/70" />
              <p className="text-xs text-muted-foreground">Prévia indisponível</p>
            </div>
          </div>
        )}

        {hasMultiple && isHero ? (
          <>
            <button
              type="button"
              className="absolute top-1/2 left-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30"
              onClick={goPrev}
              aria-label="Slide anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-sm transition-colors hover:bg-black/50 disabled:pointer-events-none disabled:opacity-30"
              onClick={goNext}
              aria-label="Próximo slide"
            >
              <ChevronRight className="size-4" />
            </button>
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 bg-linear-to-t from-black/45 to-transparent px-4 pt-8 pb-3">
              {slides.map((slide, slideIndex) => (
                <button
                  key={`${slide.src}-${slideIndex}`}
                  type="button"
                  onClick={() => setIndex(slideIndex)}
                  className={cn(
                    "h-1.5 rounded-full transition-[width,background-color]",
                    slideIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/45",
                  )}
                  aria-label={`Ir para slide ${slideIndex + 1}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>

      {hasMultiple && !isHero ? (
        <div className="mt-2 flex h-9 items-center justify-center gap-2">
          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            onClick={goPrev}
            aria-label="Slide anterior"
          >
            <ChevronLeft className="size-4" />
          </button>

          <div className="flex min-w-[4.5rem] items-center justify-center gap-1.5">
            {slides.map((slide, slideIndex) => (
              <button
                key={`${slide.src}-${slideIndex}`}
                type="button"
                onClick={() => setIndex(slideIndex)}
                className={cn(
                  "h-1.5 rounded-full transition-[width,background-color]",
                  slideIndex === index ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/35",
                )}
                aria-label={`Ir para slide ${slideIndex + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            className={NAV_BUTTON_CLASS}
            onClick={goNext}
            aria-label="Próximo slide"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      ) : !isHero && slides.length === 1 ? (
        <div className="mt-2 flex h-9 items-center justify-center gap-2">
          <span className="text-xs text-muted-foreground tabular-nums">1 / 1</span>
        </div>
      ) : null}
    </div>
  );
}
