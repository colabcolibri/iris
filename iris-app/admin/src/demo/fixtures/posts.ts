import type { Asset, Post } from "@/lib/types";
import { demoPostPreviewUrl } from "@/demo/demo-images";
import { DEMO_BRAND_REPLY_HANDLE, DEMO_IG_HANDLE } from "@/demo/demo-brand";
import {
  buildDemoAssets,
  buildDemoPostInsights,
  buildDemoPosts,
} from "@/demo/fixtures/build-demo-posts";

export const DEMO_BRAND = DEMO_IG_HANDLE;

/** @deprecated use demoPostPreviewUrl(postId) */
export const DEMO_PREVIEW_IMAGE = demoPostPreviewUrl("fallback");

/** Gerado em runtime — 40 posts (10 mês anterior, 15 atual, 15 seguinte). */
export function getDemoPosts(referenceDate = new Date()): Post[] {
  return buildDemoPosts(referenceDate);
}

export function getDemoAssets(referenceDate = new Date()): Record<string, Asset[]> {
  return buildDemoAssets(buildDemoPosts(referenceDate));
}

export function getDemoPostInsights(referenceDate = new Date()) {
  return buildDemoPostInsights(referenceDate);
}

/** @deprecated prefer getDemoPosts() — snapshot na carga do módulo. */
export const DEMO_POSTS = buildDemoPosts();
export const DEMO_ASSETS = buildDemoAssets(DEMO_POSTS);
export const DEMO_POST_INSIGHTS = buildDemoPostInsights();

export const DEMO_BRAND_REPLY = DEMO_BRAND_REPLY_HANDLE;

export { demoPostPreviewUrl };
