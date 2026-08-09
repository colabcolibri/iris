import {
  createPost,
  fetchAssetBlob,
  fetchPost,
  fetchPosts,
  listAssets,
  subscribePostsChanged,
  updatePost,
  uploadAsset,
} from "./api-client.js";
import { toDatetimeLocalFromIso, toIsoFromDatetimeLocal } from "./datetime.js";

const postListEl = document.querySelector("#post-list");
const postFormEl = document.querySelector("#post-form");
const detailEmptyEl = document.querySelector("#detail-empty");
const detailTitleEl = document.querySelector("#detail-title");
const captionEl = document.querySelector("#caption");
const scheduledAtEl = document.querySelector("#scheduled-at");
const assetFilesEl = document.querySelector("#asset-files");
const assetPreviewEl = document.querySelector("#asset-preview");
const formErrorEl = document.querySelector("#form-error");
const newPostBtn = document.querySelector("#new-post-btn");
const scheduleBtn = document.querySelector("#schedule-btn");
const cancelFormBtn = document.querySelector("#cancel-form-btn");

let posts = [];
let selectedPostId = null;
let editingPostId = null;
const previewUrls = [];

function clearPreviewUrls() {
  for (const url of previewUrls) {
    URL.revokeObjectURL(url);
  }
  previewUrls.length = 0;
  assetPreviewEl.replaceChildren();
}

function showError(message) {
  formErrorEl.textContent = message;
  formErrorEl.hidden = !message;
}

function postTitle(post) {
  const caption = (post.caption ?? "").trim();
  if (caption) {
    return caption.length > 80 ? `${caption.slice(0, 80)}…` : caption;
  }
  return `Post ${post.id.slice(0, 8)}`;
}

function renderPostList() {
  postListEl.replaceChildren();

  if (posts.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhuma postagem ainda.";
    postListEl.append(empty);
    return;
  }

  for (const post of posts) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `post-card${post.id === selectedPostId ? " selected" : ""}`;
    button.dataset.postId = post.id;

    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = post.status;
    badge.textContent = post.status;

    const title = document.createElement("p");
    title.className = "post-card-title";
    title.textContent = postTitle(post);

    const meta = document.createElement("p");
    meta.className = "post-card-meta";
    meta.textContent = post.scheduled_at
      ? `Agendado: ${new Date(post.scheduled_at).toLocaleString("pt-BR")}`
      : post.channel;

    button.append(badge, title, meta);
    button.addEventListener("click", () => {
      void selectPost(post.id);
    });
    postListEl.append(button);
  }
}

async function renderAssetPreview(postId) {
  clearPreviewUrls();
  const assets = await listAssets(postId);

  for (const asset of assets) {
    const filename = asset.storage_path.split("/").pop();
    const blob = await fetchAssetBlob(postId, filename);
    const url = URL.createObjectURL(blob);
    previewUrls.push(url);

    const img = document.createElement("img");
    img.src = url;
    img.alt = asset.original_filename ?? filename;
    assetPreviewEl.append(img);
  }
}

function showForm(mode, post = null) {
  editingPostId = mode === "edit" ? post?.id ?? null : null;
  postFormEl.hidden = false;
  detailEmptyEl.hidden = true;
  detailTitleEl.textContent = mode === "create" ? "Nova postagem" : "Editar postagem";
  showError("");

  captionEl.value = post?.caption ?? "";
  scheduledAtEl.value = toDatetimeLocalFromIso(post?.scheduled_at);
  assetFilesEl.value = "";
  clearPreviewUrls();

  if (post?.id) {
    void renderAssetPreview(post.id);
  }
}

function hideForm() {
  postFormEl.hidden = true;
  detailEmptyEl.hidden = false;
  detailTitleEl.textContent = "Detalhe";
  editingPostId = null;
  showError("");
  clearPreviewUrls();
}

async function refreshPosts() {
  posts = await fetchPosts();
  renderPostList();
}

async function selectPost(postId) {
  selectedPostId = postId;
  renderPostList();
  const post = await fetchPost(postId);
  showForm("edit", post);
}

async function uploadSelectedFiles(postId) {
  const files = [...assetFilesEl.files];
  let sortOrder = (await listAssets(postId)).length + 1;

  for (const file of files) {
    await uploadAsset(postId, file, sortOrder);
    sortOrder += 1;
  }
}

async function savePost({ schedule }) {
  showError("");

  try {
    const scheduledAt = toIsoFromDatetimeLocal(scheduledAtEl.value);
    let postId = editingPostId;

    if (!postId) {
      const created = await createPost({
        caption: captionEl.value,
        channel: "instagram",
        scheduled_at: scheduledAt,
      });
      postId = created.id;
      editingPostId = postId;
    } else {
      await updatePost(postId, {
        caption: captionEl.value,
        scheduled_at: scheduledAt,
      });
    }

    if (assetFilesEl.files.length > 0) {
      await uploadSelectedFiles(postId);
    }

    if (schedule) {
      if (!scheduledAt) {
        throw new Error("Informe data e hora para agendar.");
      }
      await updatePost(postId, {
        status: "scheduled",
        scheduled_at: scheduledAt,
      });
    }

    selectedPostId = postId;
    await refreshPosts();
    const post = await fetchPost(postId);
    showForm("edit", post);
  } catch (error) {
    showError(error instanceof Error ? error.message : "Falha ao salvar.");
  }
}

postFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  void savePost({ schedule: false });
});

scheduleBtn.addEventListener("click", () => {
  void savePost({ schedule: true });
});

newPostBtn.addEventListener("click", () => {
  selectedPostId = null;
  renderPostList();
  showForm("create");
});

cancelFormBtn.addEventListener("click", () => {
  hideForm();
});

subscribePostsChanged(() => {
  void refreshPosts();
});

void refreshPosts().catch((error) => {
  showError(error instanceof Error ? error.message : "Falha ao carregar posts.");
});
