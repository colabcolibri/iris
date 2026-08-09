import {
  createPost,
  ensureAuthenticated,
  fetchAssetBlob,
  fetchComments,
  fetchPost,
  fetchPosts,
  listAssets,
  logout,
  replyToComment,
  subscribeRealtimeEvents,
  updatePost,
  uploadAsset,
} from "./api-client.js";
import { createCalendarView } from "./calendar-view.js";
import { createKanbanView } from "./kanban-view.js";
import { monthRange } from "./date-utils.js";
import { toDatetimeLocalFromIso, toIsoFromDatetimeLocal } from "./datetime.js";

const root = document.querySelector("#app");
const postFormEl = document.querySelector("#post-form");
const detailEmptyEl = document.querySelector("#detail-empty");
const detailTitleEl = document.querySelector("#detail-title");
const captionEl = document.querySelector("#caption");
const scheduledAtEl = document.querySelector("#scheduled-at");
const autoReplyEnabledEl = document.querySelector("#auto-reply-enabled");
const assetFilesEl = document.querySelector("#asset-files");
const assetPreviewEl = document.querySelector("#asset-preview");
const formErrorEl = document.querySelector("#form-error");
const newPostBtn = document.querySelector("#new-post-btn");
const scheduleBtn = document.querySelector("#schedule-btn");
const cancelFormBtn = document.querySelector("#cancel-form-btn");
const logoutBtn = document.querySelector("#logout-btn");
const commentsPanelEl = document.querySelector("#comments-panel");
const commentsListEl = document.querySelector("#comments-list");
const calendarViewEl = document.querySelector("#calendar-view");
const kanbanViewEl = document.querySelector("#kanban-view");
const tabs = root.querySelectorAll(".tab");

let posts = [];
let selectedPostId = null;
let editingPostId = null;
let activeView = "calendar";
const previewUrls = [];

const calendar = createCalendarView(root, {
  onSelect: (post) => {
    void selectPost(post.id);
  },
  onMonthChange: () => {
    void refreshPosts();
  },
});

const kanban = createKanbanView(root, {
  onSelect: (post) => {
    void selectPost(post.id);
  },
  onStatusChange: (post, nextStatus) => {
    void changePostStatus(post, nextStatus);
  },
});

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

function showView(name) {
  activeView = name;
  calendarViewEl.hidden = name !== "calendar";
  kanbanViewEl.hidden = name !== "kanban";

  for (const tab of tabs) {
    const isActive = tab.dataset.view === name;
    tab.classList.toggle("is-active", isActive);
    tab.setAttribute("aria-selected", isActive ? "true" : "false");
  }

  void refreshPosts();
}

for (const tab of tabs) {
  tab.addEventListener("click", () => showView(tab.dataset.view));
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
  autoReplyEnabledEl.checked = Boolean(post?.auto_reply_enabled);
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
  commentsPanelEl.hidden = true;
  editingPostId = null;
  showError("");
  clearPreviewUrls();
}

async function renderComments(postId) {
  commentsPanelEl.hidden = false;
  commentsListEl.replaceChildren();

  const comments = await fetchComments(postId);

  if (comments.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "Nenhum comentário ainda.";
    commentsListEl.append(empty);
    return;
  }

  for (const comment of comments) {
    const item = document.createElement("article");
    item.className = "comment-item";
    item.dataset.commentId = comment.id;

    const meta = document.createElement("div");
    meta.className = "comment-meta";

    const author = document.createElement("strong");
    author.textContent = comment.author_username ?? "usuário";

    const status = document.createElement("span");
    status.className = "comment-status";
    status.dataset.status = comment.status;
    status.textContent = comment.status;
    if (comment.error_message) {
      status.title = comment.error_message;
    }

    const time = document.createElement("span");
    time.textContent = new Date(comment.created_at).toLocaleString("pt-BR");

    meta.append(author, status, time);

    const text = document.createElement("p");
    text.textContent = comment.text ?? "";

    item.append(meta, text);

    if (comment.status === "pending") {
      const form = document.createElement("form");
      form.className = "comment-reply-form";

      const textarea = document.createElement("textarea");
      textarea.placeholder = "Sua resposta…";
      textarea.required = true;

      const button = document.createElement("button");
      button.type = "submit";
      button.className = "btn-primary";
      button.textContent = "Responder";

      form.append(textarea, button);
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        button.disabled = true;
        void replyToComment(comment.id, textarea.value.trim())
          .then(() => renderComments(postId))
          .catch((error) => {
            button.disabled = false;
            showError(error instanceof Error ? error.message : "Falha ao responder.");
          });
      });

      item.append(form);
    }

    commentsListEl.append(item);
  }
}

function renderViews() {
  calendar.setPosts(posts);
  kanban.setPosts(posts);
}

async function refreshPosts() {
  if (activeView === "calendar") {
    const { from, to } = monthRange(calendar.getCursor());
    posts = await fetchPosts({ from, to });
  } else {
    posts = await fetchPosts();
  }
  renderViews();
}

async function selectPost(postId) {
  selectedPostId = postId;
  const post = await fetchPost(postId);
  showForm("edit", post);
  await renderComments(postId);
}

async function changePostStatus(post, nextStatus) {
  showError("");
  try {
    await updatePost(post.id, { status: nextStatus });
    await refreshPosts();
    if (selectedPostId === post.id) {
      const updated = await fetchPost(post.id);
      showForm("edit", updated);
    }
  } catch (error) {
    showError(error instanceof Error ? error.message : "Falha ao atualizar status.");
  }
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
        auto_reply_enabled: autoReplyEnabledEl.checked,
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
    await renderComments(postId);
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
  showForm("create");
});

cancelFormBtn.addEventListener("click", () => {
  hideForm();
});

logoutBtn?.addEventListener("click", () => {
  void logout().finally(() => {
    window.location.href = "/login.html";
  });
});

subscribeRealtimeEvents({
  onPostsChanged: () => {
    void refreshPosts();
  },
  onCommentsChanged: (payload) => {
    if (payload?.post_id && payload.post_id === selectedPostId) {
      void renderComments(selectedPostId);
    }
  },
});

void ensureAuthenticated()
  .then((ok) => {
    if (!ok) {
      return;
    }
    return refreshPosts();
  })
  .catch((error) => {
    showError(error instanceof Error ? error.message : "Falha ao carregar posts.");
  });
