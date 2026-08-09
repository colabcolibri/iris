import { postDisplayDate, truncate } from "./date-utils.js";

const COLUMNS = [
  { id: "draft", label: "Rascunho" },
  { id: "scheduled", label: "Agendado" },
  { id: "published", label: "Publicado" },
  { id: "failed", label: "Falhou" },
  { id: "cancelled", label: "Cancelado" },
];

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "scheduled", label: "Agendado" },
  { value: "cancelled", label: "Cancelado" },
];

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

export function createKanbanView(root, { onSelect, onStatusChange }) {
  const boardEl = root.querySelector("#kanban-board");
  let posts = [];

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

        const badge = document.createElement("span");
        badge.className = "status-badge";
        badge.dataset.status = post.status;
        badge.textContent = post.status;

        const heading = document.createElement("button");
        heading.type = "button";
        heading.className = "kanban-card-title";
        heading.textContent = truncate(post.caption, 72);
        heading.addEventListener("click", () => onSelect(post));

        const meta = document.createElement("p");
        meta.className = "kanban-card-meta";
        meta.textContent = formatWhen(postDisplayDate(post));

        const actions = document.createElement("div");
        actions.className = "kanban-card-actions";

        const select = document.createElement("select");
        select.className = "kanban-status-select";
        select.setAttribute("aria-label", "Mover postagem");

        const placeholder = document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Mover para…";
        select.appendChild(placeholder);

        for (const option of STATUS_OPTIONS) {
          if (option.value === post.status) continue;
          const el = document.createElement("option");
          el.value = option.value;
          el.textContent = option.label;
          select.appendChild(el);
        }

        select.addEventListener("change", () => {
          const nextStatus = select.value;
          select.value = "";
          if (nextStatus && nextStatus !== post.status) {
            onStatusChange?.(post, nextStatus);
          }
        });

        actions.appendChild(select);
        card.append(badge, heading, meta, actions);
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
  };
}
