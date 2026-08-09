import { postDisplayDate, truncate } from "./date-utils.js";

const COLUMNS = [
  { id: "draft", label: "Rascunho" },
  { id: "scheduled", label: "Agendado" },
  { id: "published", label: "Publicado" },
  { id: "failed", label: "Falhou" },
  { id: "cancelled", label: "Cancelado" },
];

const STATUS_LABELS = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const thumbCache = new Map();

function formatWhen(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function assetFilename(asset) {
  return asset.storage_path?.split("/").pop() ?? "";
}

async function loadThumb(post, apiClient) {
  if (!apiClient || !(post.assets_count > 0)) return null;
  if (thumbCache.has(post.id)) return thumbCache.get(post.id);

  try {
    const assets = await apiClient.listAssets(post.id);
    const first = assets[0];
    const filename = first ? assetFilename(first) : "";
    if (!filename) return null;

    const blob = await apiClient.fetchAssetBlob(post.id, filename);
    const url = URL.createObjectURL(blob);
    thumbCache.set(post.id, url);
    return url;
  } catch {
    return null;
  }
}

export function createKanbanView(root, { onSelect, getApiClient }) {
  const boardEl = root.querySelector("#kanban-board");
  let posts = [];
  let selectedId = null;

  function render() {
    boardEl.replaceChildren();

    for (const column of COLUMNS) {
      const colPosts = posts.filter((post) => post.status === column.id);
      const col = document.createElement("div");
      col.className = "kanban-col";
      col.dataset.status = column.id;

      const header = document.createElement("div");
      header.className = "kanban-col-header";

      const title = document.createElement("h3");
      title.className = "kanban-col-title";
      title.innerHTML = `${column.label} <span class="kanban-count">${colPosts.length}</span>`;
      header.appendChild(title);
      col.appendChild(header);

      const list = document.createElement("div");
      list.className = "kanban-cards";

      if (colPosts.length === 0) {
        const empty = document.createElement("p");
        empty.className = "kanban-empty";
        empty.textContent = "Vazio";
        list.appendChild(empty);
      }

      for (const post of colPosts) {
        const card = document.createElement("article");
        card.className = "kanban-card";
        card.dataset.postId = post.id;
        if (selectedId === post.id) {
          card.classList.add("is-selected");
        }

        if (post.assets_count > 0) {
          const thumbWrap = document.createElement("div");
          thumbWrap.className = "kanban-card-thumb";
          thumbWrap.setAttribute("aria-hidden", "true");
          card.appendChild(thumbWrap);

          const apiClient = getApiClient?.();
          if (apiClient) {
            void loadThumb(post, apiClient).then((url) => {
              if (!url || !card.isConnected) return;
              const img = document.createElement("img");
              img.src = url;
              img.alt = "";
              thumbWrap.appendChild(img);
            });
          }
        }

        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.dataset.status = post.status;
        badge.textContent = STATUS_LABELS[post.status] ?? post.status;

        const heading = document.createElement("button");
        heading.type = "button";
        heading.className = "kanban-card-title";
        heading.textContent = truncate(post.caption, 72);
        heading.addEventListener("click", () => onSelect(post));

        const meta = document.createElement("p");
        meta.className = "kanban-card-meta";
        meta.textContent = formatWhen(postDisplayDate(post));

        card.append(badge, heading, meta);
        list.appendChild(card);
      }

      col.appendChild(list);
      boardEl.appendChild(col);
    }
  }

  return {
    setPosts(nextPosts) {
      posts = nextPosts;
      render();
    },
    setSelected(id) {
      selectedId = id;
      for (const card of boardEl.querySelectorAll(".kanban-card")) {
        card.classList.toggle("is-selected", card.dataset.postId === id);
      }
    },
  };
}
