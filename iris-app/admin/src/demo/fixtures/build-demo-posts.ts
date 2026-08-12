import type { Asset, Post, PostStatus } from "@/lib/types";
import type { DemoLocale } from "@/demo/locale";
import { DEMO_STORE_URL } from "@/demo/demo-brand";
import type { DemoPostTemplate } from "@/demo/fixtures/demo-post-templates";
import { getDemoPostTemplates } from "@/demo/fixtures/i18n";

const SLOTS_PREV_MONTH = 10;
const SLOTS_CURRENT_MONTH = 15;
const SLOTS_NEXT_MONTH = 15;

function daysInMonth(year: number, monthIndex: number): number {
  return new Date(year, monthIndex + 1, 0).getDate();
}

/** Distribui `count` dias únicos entre startDay e endDay (inclusive). */
function spreadDays(count: number, startDay: number, endDay: number): number[] {
  if (count <= 0 || endDay < startDay) return [];
  const span = endDay - startDay + 1;
  const step = span / count;
  const days: number[] = [];
  for (let i = 0; i < count; i += 1) {
    const day = Math.min(endDay, Math.round(startDay + step * i + step / 2));
    if (!days.includes(day)) {
      days.push(day);
    }
  }
  let cursor = startDay;
  while (days.length < count && cursor <= endDay) {
    if (!days.includes(cursor)) days.push(cursor);
    cursor += 1;
  }
  return days.sort((a, b) => a - b).slice(0, count);
}

function utcIso(
  year: number,
  monthIndex: number,
  day: number,
  hour: number,
  minute = 0,
): string {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0)).toISOString();
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function demoIgMediaId(postId: string): string {
  let hash = 0;
  for (const char of postId) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  return `1789${String(hash).padStart(14, "0").slice(0, 14)}`;
}

function resolveIgMediaId(
  template: DemoPostTemplate,
  status: PostStatus,
): string | null {
  if (template.ig_media_id) return template.ig_media_id;
  if (status === "published" || status === "monitored") {
    return demoIgMediaId(template.id);
  }
  return null;
}

function captionHook(caption: string): string {
  return caption.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
}

function demoReplyPromptDefault(locale: DemoLocale): string {
  if (locale === "en") {
    return `Store link: ${DEMO_STORE_URL}. Prioritize size, stock, and delivery questions.`;
  }
  return `Link da loja: ${DEMO_STORE_URL}. Priorizar dúvidas de tamanho, estoque e prazo.`;
}

function demoCarouselSummaryDefault(
  template: DemoPostTemplate,
  locale: DemoLocale,
): string {
  const hook = captionHook(template.caption);
  const slideCount = template.assets?.length ?? 0;
  if (slideCount > 1) {
    return locale === "en"
      ? `Carousel (${slideCount} slides): ${hook}`
      : `Carrossel (${slideCount} slides): ${hook}`;
  }
  return locale === "en" ? `Single post: ${hook}` : `Post único: ${hook}`;
}

function isOnAirPost(status: PostStatus, igMediaId: string | null): boolean {
  return (
    Boolean(igMediaId) && (status === "published" || status === "monitored")
  );
}
function resolveStatus(
  template: DemoPostTemplate,
  year: number,
  monthIndex: number,
  day: number,
  referenceDate: Date,
): PostStatus {
  if (template.status) return template.status;

  const slot = startOfLocalDay(new Date(year, monthIndex, day));
  const today = startOfLocalDay(referenceDate);

  if (slot < today) {
    return day % 9 === 0 ? "failed" : "published";
  }
  if (slot.getTime() === today.getTime()) {
    return "published";
  }
  return "scheduled";
}

function applyDates(
  template: DemoPostTemplate,
  year: number,
  monthIndex: number,
  day: number,
  referenceDate: Date,
): Pick<
  Post,
  | "status"
  | "scheduled_at"
  | "published_at"
  | "created_at"
  | "updated_at"
  | "error_message"
> {
  const status = resolveStatus(template, year, monthIndex, day, referenceDate);
  const hour = 9 + (day % 10);
  const scheduledAt = utcIso(year, monthIndex, day, hour, 30);
  const publishedAt = utcIso(year, monthIndex, day, hour, 35);
  const createdAt = utcIso(year, monthIndex, Math.max(1, day - 2), 10, 0);

  if (status === "draft") {
    return {
      status,
      scheduled_at: null,
      published_at: null,
      created_at: createdAt,
      updated_at: utcIso(year, monthIndex, day, 14, 0),
    };
  }

  if (status === "cancelled") {
    return {
      status,
      scheduled_at: scheduledAt,
      published_at: null,
      created_at: createdAt,
      updated_at: scheduledAt,
    };
  }

  if (status === "scheduled" || status === "failed") {
    return {
      status,
      scheduled_at: scheduledAt,
      published_at: null,
      created_at: createdAt,
      updated_at: scheduledAt,
      ...(status === "failed"
        ? { error_message: "Container de mídia não ficou pronto a tempo (demonstração)." }
        : {}),
    };
  }

  if (status === "monitored") {
    return {
      status,
      scheduled_at: null,
      published_at: publishedAt,
      created_at: createdAt,
      updated_at: publishedAt,
    };
  }

  return {
    status: "published",
    scheduled_at: scheduledAt,
    published_at: publishedAt,
    created_at: createdAt,
    updated_at: publishedAt,
  };
}

export function buildDemoPosts(
  referenceDate = new Date(),
  locale: DemoLocale = "pt",
): Post[] {
  const templates = getDemoPostTemplates(locale);
  const year = referenceDate.getFullYear();
  const monthIndex = referenceDate.getMonth();

  const prevAnchor = new Date(year, monthIndex - 1, 1);
  const prevYear = prevAnchor.getFullYear();
  const prevMonthIndex = prevAnchor.getMonth();

  const nextAnchor = new Date(year, monthIndex + 1, 1);
  const nextYear = nextAnchor.getFullYear();
  const nextMonthIndex = nextAnchor.getMonth();

  const prevDays = spreadDays(
    SLOTS_PREV_MONTH,
    1,
    daysInMonth(prevYear, prevMonthIndex),
  );
  const currentDays = spreadDays(
    SLOTS_CURRENT_MONTH,
    1,
    daysInMonth(year, monthIndex),
  );
  const nextDays = spreadDays(
    SLOTS_NEXT_MONTH,
    1,
    daysInMonth(nextYear, nextMonthIndex),
  );

  return templates.map((template, index) => {
    let slotYear: number;
    let slotMonth: number;
    let day: number;

    if (index < SLOTS_PREV_MONTH) {
      slotYear = prevYear;
      slotMonth = prevMonthIndex;
      day = prevDays[index]!;
    } else if (index < SLOTS_PREV_MONTH + SLOTS_CURRENT_MONTH) {
      const slotIndex = index - SLOTS_PREV_MONTH;
      slotYear = year;
      slotMonth = monthIndex;
      day = currentDays[slotIndex]!;
    } else {
      const slotIndex = index - SLOTS_PREV_MONTH - SLOTS_CURRENT_MONTH;
      slotYear = nextYear;
      slotMonth = nextMonthIndex;
      day = nextDays[slotIndex]!;
    }

    const dates = template.skipCalendar
      ? {
          status: template.status ?? "draft",
          scheduled_at:
            template.status === "cancelled"
              ? utcIso(year, monthIndex, 20, 14, 0)
              : null,
          published_at: null,
          created_at: utcIso(year, monthIndex, 5, 10, 0),
          updated_at: utcIso(year, monthIndex, 8, 16, 0),
        }
      : applyDates(template, slotYear, slotMonth, day, referenceDate);

    const assets = template.assets ?? [];
    const status = dates.status;
    const ig_media_id = resolveIgMediaId(template, status);
    const onAir = isOnAirPost(status, ig_media_id);

    return {
      id: template.id,
      caption: template.caption,
      channel: "instagram",
      collaborators: template.collaborators,
      carousel_summary:
        template.carousel_summary ??
        (onAir ? demoCarouselSummaryDefault(template, locale) : null),
      reply_prompt:
        template.reply_prompt ?? (onAir ? demoReplyPromptDefault(locale) : null),
      reply_mode: template.reply_mode ?? "inherit",
      ig_media_id,
      assets_count: assets.length,
      ...dates,
    } satisfies Post;
  });
}

function asset(
  id: string,
  postId: string,
  sortOrder: number,
  filename: string,
  opts: Partial<Asset> = {},
): Asset {
  return {
    id,
    post_id: postId,
    sort_order: sortOrder,
    storage_path: `${postId}/${filename}`,
    original_filename: filename,
    mime: filename.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
    width: opts.width ?? 1080,
    height: opts.height ?? (filename.includes("reel") ? 1920 : 1350),
    ...opts,
  };
}

export function buildDemoAssets(
  posts: Post[],
  locale: DemoLocale = "pt",
): Record<string, Asset[]> {
  const byId = new Map(getDemoPostTemplates(locale).map((t) => [t.id, t]));
  const result: Record<string, Asset[]> = {};

  for (const post of posts) {
    const template = byId.get(post.id);
    if (!template?.assets?.length) continue;
    result[post.id] = template.assets.map((spec, index) =>
      asset(
        spec.id ?? `${post.id}-asset-${index + 1}`,
        post.id,
        index + 1,
        spec.filename,
        {
          alt_text: spec.alt_text,
          user_tags: spec.user_tags,
          width: spec.width,
          height: spec.height,
        },
      ),
    );
  }

  return result;
}

export function buildDemoPostInsights(
  referenceDate = new Date(),
  locale: DemoLocale = "pt",
): Record<
  string,
  {
    ok: boolean;
    post_id: string;
    ig_media_id: string;
    fetched_at: string;
    from_cache: boolean;
    insights: Array<{ name: string; period: string; values: Array<{ value: number }> }>;
    media: {
      source: "local";
      items: Array<{
        source: "local";
        preview_filename: string;
        preview_mime: string;
      }>;
    };
  }
> {
  const fetchedAt = referenceDate.toISOString();
  const posts = buildDemoPosts(referenceDate, locale);
  const templates = getDemoPostTemplates(locale);
  const insights: ReturnType<typeof buildDemoPostInsights> = {};

  for (const post of posts) {
    if (post.status !== "published" && post.status !== "monitored") continue;
    if (!post.ig_media_id) continue;
    const template = templates.find((t) => t.id === post.id);
    const preview = template?.assets?.[0]?.filename ?? "cover.jpg";
    insights[post.id] = {
      ok: true,
      post_id: post.id,
      ig_media_id: post.ig_media_id,
      fetched_at: fetchedAt,
      from_cache: true,
      insights: [
        { name: "reach", period: "lifetime", values: [{ value: 3200 + post.id.length * 137 }] },
        { name: "likes", period: "lifetime", values: [{ value: 180 + post.id.length * 11 }] },
        { name: "comments", period: "lifetime", values: [{ value: 12 + (post.id.length % 20) }] },
        { name: "saved", period: "lifetime", values: [{ value: 45 + (post.id.length % 30) }] },
      ],
      media: {
        source: "local",
        items: [
          {
            source: "local",
            preview_filename: preview,
            preview_mime: preview.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
          },
        ],
      },
    };
  }

  return insights;
}

export const DEMO_REPLY_PROMPT_LOJA = `Link da loja: ${DEMO_STORE_URL}. Priorizar dúvidas de tamanho, estoque e prazo.`;
