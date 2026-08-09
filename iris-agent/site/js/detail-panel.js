const STATUS_LABELS = {
  draft: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
  failed: "Falhou",
  cancelled: "Cancelado",
};

const objectUrls = [];

function revokeObjectUrls() {
  for (const url of objectUrls) {
    URL.revokeObjectURL(url);
  }
  objectUrls.length = 0;
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function metaRow(label, value, monospace = false) {
  const row = document.createElement("div");
  row.className = "detail-meta-row";
  const labelEl = document.createElement("span");
  labelEl.textContent = label;
  const val = monospace ? document.createElement("code") : document.createElement("strong");
  val.textContent = value;
  row.appendChild(labelEl);
  row.appendChild(val);
  return row;
}

function assetFilename(asset) {
  return asset.storage_path?.split("/").pop() ?? "";
}

export function createDetailPanel(root, { getApiClient }) {
  const panel = root.querySelector("#post-detail");
  const empty = root.querySelector("#detail-empty");
  const body = root.querySelector("#detail-body");
  const title = root.querySelector("#detail-title");
  const closeBtn = root.querySelector("#detail-close");

  let selectedId = null;
  let onSelectionChange = null;

  function close() {
    if (!selectedId) return;
    const prev = selectedId;
    selectedId = null;
    panel.classList.remove("is-open");
    empty.hidden = false;
    body.hidden = true;
    title.textContent = "Detalhe";
    closeBtn && (closeBtn.hidden = true);
    body.replaceChildren();
    revokeObjectUrls();
    onSelectionChange?.(null, prev);
  }

  async function loadMedia(postId, apiClient) {
    const mediaTitle = document.createElement("h3");
    mediaTitle.className = "detail-section-title";
    mediaTitle.textContent = "Mídia";

    const gallery = document.createElement("div");
    gallery.className = "detail-media-gallery";

    try {
      const assets = await apiClient.listAssets(postId);
      if (assets.length === 0) {
        const placeholder = document.createElement("div");
        placeholder.className = "detail-media-empty";
        placeholder.textContent = "Sem imagens";
        gallery.appendChild(placeholder);
      } else {
        for (const asset of assets) {
          const filename = assetFilename(asset);
          if (!filename) continue;

          const figure = document.createElement("figure");
          figure.className = "detail-media-item";

          const img = document.createElement("img");
          img.alt = asset.original_filename ?? filename;
          img.loading = "lazy";
          img.decoding = "async";

          const blob = await apiClient.fetchAssetBlob(postId, filename);
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          img.src = url;

          const caption = document.createElement("figcaption");
          caption.textContent = asset.original_filename ?? filename;

          figure.append(img, caption);
          gallery.appendChild(figure);
        }
      }
    } catch {
      const placeholder = document.createElement("div");
      placeholder.className = "detail-media-empty";
      placeholder.textContent = "Não foi possível carregar as imagens";
      gallery.appendChild(placeholder);
    }

    return { mediaTitle, gallery };
  }

  async function open(post) {
    revokeObjectUrls();

    const badge = document.createElement("span");
    badge.className = "status-badge";
    badge.dataset.status = post.status;
    badge.textContent = STATUS_LABELS[post.status] ?? post.status;

    const meta = document.createElement("div");
    meta.className = "detail-meta";
    meta.appendChild(metaRow("ID", post.id, true));
    meta.appendChild(metaRow("Canal", post.channel ?? "—"));
    meta.appendChild(metaRow("Agendado", formatDateTime(post.scheduled_at)));
    meta.appendChild(metaRow("Publicado", formatDateTime(post.published_at)));
    meta.appendChild(metaRow("Criado", formatDateTime(post.created_at)));

    const captionTitle = document.createElement("h3");
    captionTitle.className = "detail-section-title";
    captionTitle.textContent = "Legenda";

    const caption = document.createElement("p");
    caption.className = "detail-caption";
    caption.textContent = post.caption?.trim() || "(sem legenda)";

    body.replaceChildren(badge, meta);

    const apiClient = getApiClient?.();
    if (apiClient && (post.assets_count ?? 0) > 0) {
      const loading = document.createElement("p");
      loading.className = "detail-media-loading";
      loading.textContent = "Carregando mídia…";
      body.appendChild(loading);

      const { mediaTitle, gallery } = await loadMedia(post.id, apiClient);
      loading.remove();
      body.append(mediaTitle, gallery);
    } else if ((post.assets_count ?? 0) === 0) {
      const mediaTitle = document.createElement("h3");
      mediaTitle.className = "detail-section-title";
      mediaTitle.textContent = "Mídia";
      const emptyMedia = document.createElement("div");
      emptyMedia.className = "detail-media-empty";
      emptyMedia.textContent = "Sem imagens";
      body.append(mediaTitle, emptyMedia);
    }

    body.append(captionTitle, caption);

    const prev = selectedId;
    selectedId = post.id;
    title.textContent = "Postagem";
    closeBtn && (closeBtn.hidden = false);
    empty.hidden = true;
    body.hidden = false;
    panel.classList.add("is-open");
    onSelectionChange?.(post.id, prev);
  }

  closeBtn?.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && selectedId) {
      close();
    }
  });

  return {
    open,
    close,
    isOpen: () => Boolean(selectedId),
    getSelectedId: () => selectedId,
    onSelectionChange(callback) {
      onSelectionChange = callback;
    },
  };
}
