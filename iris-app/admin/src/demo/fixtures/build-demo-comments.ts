import type {
  Comment,
  CommentActivityItem,
  CommentsInbox,
  Post,
} from "@/lib/types";
import { DEMO_BRAND_REPLY_HANDLE } from "@/demo/demo-brand";
import { listDemoManagedPosts } from "@/demo/domain/managed-posts";
import {
  ELABORATE_THREADS,
  MEDIUM_THREADS,
  REALISTIC_PAIRS,
  type CommentTurn,
} from "@/demo/fixtures/demo-comment-threads";

const BRAND = DEMO_BRAND_REPLY_HANDLE;

const USER_POOL = [
  "marina.mods",
  "julia.style",
  "ana.closet",
  "fernanda.shop",
  "camila.fit",
  "lucas.menstyle",
  "pri.travel",
  "beatriz.moda",
  "carla.lifestyle",
  "renata.basics",
  "paty.wardrobe",
  "luiza.remote",
  "gabi.capsule",
  "helena.shop",
  "isa.boho",
];

/** Posts com mais engajamento fictício — prioridade na distribuição de threads. */
const FEATURED_COMMENT_TARGETS: Partial<Record<string, number>> = {
  "demo-post-carousel": 22,
  "demo-post-published": 14,
  "demo-post-monitored": 12,
  "demo-post-loja": 10,
  "demo-post-viagem": 10,
  "demo-post-collab": 10,
  "demo-post-sustentavel": 10,
};

/** Qual par vira pendente de aprovação (simulador / inbox). */
const PENDING_PAIR_INDEX = 2;

let igSeq = 1000;
let commentSeq = 1;
let userPoolIndex = 0;

function commentTargetsForManagedPosts(
  managedPosts: Post[],
  targetTotal = 110,
): Map<string, number> {
  const targets = new Map<string, number>();
  let remaining = targetTotal;

  for (const post of managedPosts) {
    const featured = FEATURED_COMMENT_TARGETS[post.id];
    if (featured == null) continue;
    const count = Math.min(featured, remaining);
    if (count > 0) {
      targets.set(post.id, count);
      remaining -= count;
    }
  }

  let tier = 0;
  for (const post of managedPosts) {
    if (targets.has(post.id) || remaining <= 0) continue;
    const count = Math.min(remaining, tier < 8 ? 6 : tier < 18 ? 4 : 2);
    targets.set(post.id, count);
    remaining -= count;
    tier += 1;
  }

  return targets;
}

function nextIgId(): string {
  igSeq += 1;
  return `ig-demo-${igSeq}`;
}

function nextCommentId(): string {
  const id = `demo-comment-${commentSeq}`;
  commentSeq += 1;
  return id;
}

function nextUser(): string {
  const user = pickUser(userPoolIndex);
  userPoolIndex += 1;
  return user;
}

function pickUser(index: number): string {
  return USER_POOL[index % USER_POOL.length]!;
}

function isoAt(referenceDate: Date, daysAgo: number, hour: number): string {
  const d = new Date(referenceDate);
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, (commentSeq * 3) % 60, 0, 0);
  return d.toISOString();
}

function turnsToComments(
  turns: CommentTurn[],
  referenceDate: Date,
  daysAgo: number,
): Comment[] {
  const out: Comment[] = [];
  let parentIg: string | null = null;

  turns.forEach((turn, i) => {
    const igId = nextIgId();
    const isBrand = turn.author === "brand";
    out.push({
      id: nextCommentId(),
      ig_comment_id: igId,
      text: turn.text,
      status: "replied",
      author_username: isBrand ? BRAND : nextUser(),
      parent_ig_comment_id: parentIg,
      created_at: isoAt(referenceDate, daysAgo, 9 + i),
    });
    parentIg = igId;
  });

  return out;
}

function pairToComments(
  pair: { user: string; brand: string },
  referenceDate: Date,
  daysAgo: number,
  pairIndex: number,
): Comment[] {
  const userIg = nextIgId();
  const pending = pairIndex === PENDING_PAIR_INDEX;
  const userComment: Comment = {
    id: nextCommentId(),
    ig_comment_id: userIg,
    text: pair.user,
    status: pending ? "pending" : "replied",
    author_username: nextUser(),
    parent_ig_comment_id: null,
    created_at: isoAt(referenceDate, daysAgo, 11),
    ...(pending ? { draft_text: pair.brand, draft_status: "draft" } : {}),
  };

  if (pending) {
    return [userComment];
  }

  return [
    userComment,
    {
      id: nextCommentId(),
      ig_comment_id: nextIgId(),
      text: pair.brand,
      status: "replied",
      author_username: BRAND,
      parent_ig_comment_id: userIg,
      created_at: isoAt(referenceDate, daysAgo, 12),
    },
  ];
}

function fillCommentBucket(
  postId: string,
  target: number,
  referenceDate: Date,
  state: {
    elaborateIdx: number;
    mediumIdx: number;
    pairIdx: number;
    result: Record<string, Comment[]>;
  },
): void {
  const bucket: Comment[] = [];

  while (bucket.length < target && state.elaborateIdx < ELABORATE_THREADS.length) {
    const thread = turnsToComments(
      ELABORATE_THREADS[state.elaborateIdx]!,
      referenceDate,
      24 + state.elaborateIdx,
    );
    if (bucket.length + thread.length <= target) {
      bucket.push(...thread);
      state.elaborateIdx += 1;
    } else {
      break;
    }
  }

  while (bucket.length < target && state.mediumIdx < MEDIUM_THREADS.length) {
    const thread = turnsToComments(
      MEDIUM_THREADS[state.mediumIdx]!,
      referenceDate,
      14 + state.mediumIdx,
    );
    if (bucket.length + thread.length <= target) {
      bucket.push(...thread);
      state.mediumIdx += 1;
    } else {
      break;
    }
  }

  while (bucket.length < target && state.pairIdx < REALISTIC_PAIRS.length) {
    const pair = pairToComments(
      REALISTIC_PAIRS[state.pairIdx]!,
      referenceDate,
      6 + state.pairIdx,
      state.pairIdx,
    );
    if (bucket.length + pair.length <= target) {
      bucket.push(...pair);
      state.pairIdx += 1;
    } else if (bucket.length < target) {
      bucket.push(pair[0]!);
      state.pairIdx += 1;
    } else {
      break;
    }
  }

  while (bucket.length < target) {
    const pair = REALISTIC_PAIRS[state.pairIdx % REALISTIC_PAIRS.length]!;
    const extra = pairToComments(pair, referenceDate, 3, -1);
    bucket.push(extra[0]!);
    if (bucket.length < target && extra[1]) {
      bucket.push(extra[1]);
    }
    state.pairIdx += 1;
  }

  state.result[postId] = bucket.slice(0, target);
}

export function buildDemoComments(
  posts: Post[],
  referenceDate = new Date(),
): Record<string, Comment[]> {
  igSeq = 1000;
  commentSeq = 1;
  userPoolIndex = 0;

  const managedPosts = listDemoManagedPosts(posts);
  const targets = commentTargetsForManagedPosts(managedPosts);
  const state = {
    elaborateIdx: 0,
    mediumIdx: 0,
    pairIdx: 0,
    result: {} as Record<string, Comment[]>,
  };

  for (const post of managedPosts) {
    const target = targets.get(post.id) ?? 0;
    if (target <= 0) continue;
    fillCommentBucket(post.id, target, referenceDate, state);
  }

  let brands = 0;
  for (const list of Object.values(state.result)) {
    for (const comment of list) {
      if (comment.author_username === BRAND) brands += 1;
    }
  }

  if (brands < 50) {
    for (const post of managedPosts) {
      const list = state.result[post.id];
      const cap = targets.get(post.id) ?? 0;
      if (!list || list.length >= cap) continue;
      const root = list.find(
        (comment) => comment.ig_comment_id && !comment.parent_ig_comment_id,
      );
      if (!root?.ig_comment_id) continue;
      list.push({
        id: nextCommentId(),
        ig_comment_id: nextIgId(),
        text: "Se ainda tiver dúvida de medida, compara busto/cintura/quadril com a tabela do último slide — medimos em superfície plana, sem esticar o tecido. Estamos por aqui se quiser chutar tamanho antes de fechar o pedido.\nEquipe Estúdio Nômade 💛",
        status: "replied",
        author_username: BRAND,
        parent_ig_comment_id: root.ig_comment_id,
        created_at: isoAt(referenceDate, 4, 16),
      });
      break;
    }
  }

  return state.result;
}

export function buildDemoCommentActivity(
  commentsByPost: Record<string, Comment[]>,
  posts: Post[],
): CommentActivityItem[] {
  const items: CommentActivityItem[] = [];

  for (const post of listDemoManagedPosts(posts)) {
    const comments = commentsByPost[post.id] ?? [];
    for (const comment of comments) {
      if (comment.status !== "pending" && !comment.draft_text) {
        continue;
      }
      items.push({
        comment_id: comment.id,
        post_id: post.id,
        ig_media_id: post.ig_media_id ?? null,
        text_preview:
          comment.text.slice(0, 48) + (comment.text.length > 48 ? "…" : ""),
        author_username: comment.author_username ?? null,
        occurred_at: comment.created_at,
        post_caption_preview: post.caption?.split("\n")[0] ?? null,
        post_pending_count: comments.filter(
          (entry) => entry.status === "pending",
        ).length,
        draft_text_preview: comment.draft_text?.slice(0, 56) ?? null,
      });
    }
  }

  return items
    .sort((a, b) => b.occurred_at.localeCompare(a.occurred_at))
    .slice(0, 12);
}

export function buildDemoCommentsInbox(
  commentsByPost: Record<string, Comment[]>,
  posts: Post[],
  referenceDate = new Date(),
): CommentsInbox {
  const managedPosts = listDemoManagedPosts(posts);
  let total = 0;
  for (const list of Object.values(commentsByPost)) {
    total += list.length;
  }

  const media = managedPosts.slice(0, 6).map((post) => {
    const comments = (commentsByPost[post.id] ?? [])
      .filter(
        (comment) =>
          !comment.parent_ig_comment_id && comment.author_username !== BRAND,
      )
      .slice(0, 8)
      .map((comment) => ({
        ig_comment_id: comment.ig_comment_id ?? comment.id,
        parent_ig_comment_id: null,
        author_username: comment.author_username ?? "fan",
        text: comment.text,
        timestamp: comment.created_at,
        iris_comment_id: comment.id,
        status: comment.status,
      }));

    return {
      ig_media_id: post.ig_media_id ?? post.id,
      post_id: post.id,
      caption: post.caption?.split("\n")[0] ?? "",
      media_timestamp:
        post.published_at ?? post.created_at ?? referenceDate.toISOString(),
      reported_comments_count: commentsByPost[post.id]?.length ?? 0,
      comments,
    };
  });

  return {
    source: "local",
    synced_at: referenceDate.toISOString(),
    days: 30,
    summary: {
      media_scanned: managedPosts.length,
      comments_reported: total,
      comments_fetched: total,
      access_limited: false,
      warning: null,
    },
    media,
  };
}

export const DEMO_BRAND_USERNAME = DEMO_BRAND_REPLY_HANDLE;
