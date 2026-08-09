(() => {
  // js/config.js
  var import_meta = {};
  var STORAGE_KEY = "iris.desk.credentials";
  var CREDENTIAL_URLS = [
    new URL("../iris.credentials.json", import_meta.url).href,
    new URL("../../iris.credentials.json", import_meta.url).href
  ];
  function pageCredentialUrls() {
    if (typeof window === "undefined") return [];
    const base = new URL(".", window.location.href);
    return [
      new URL("../iris.credentials.json", base).href,
      new URL("iris.credentials.json", base).href
    ];
  }
  function parseConfig(raw) {
    const apiUrl = typeof raw.apiUrl === "string" ? raw.apiUrl.trim().replace(/\/$/, "") : "";
    const agentToken = typeof raw.agentToken === "string" ? raw.agentToken.trim() : "";
    if (!apiUrl || !agentToken) {
      throw new Error("apiUrl e agentToken s\xE3o obrigat\xF3rios em iris.credentials.json.");
    }
    let resolvedApiUrl = apiUrl;
    if (typeof window !== "undefined" && resolvedApiUrl === window.location.origin) {
      resolvedApiUrl = "";
    }
    return { apiUrl: resolvedApiUrl, agentToken };
  }
  async function fetchCredentialsFromUrls(urls) {
    for (const url of urls) {
      try {
        const response = await fetch(url, { cache: "no-store" });
        if (response.ok) {
          return response.json();
        }
      } catch {
      }
    }
    return null;
  }
  function saveCredentialsToStorage(raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
  }
  async function loadAgentConfig() {
    if (typeof window !== "undefined" && window.location.protocol === "file:") {
      const stored2 = localStorage.getItem(STORAGE_KEY);
      if (stored2) {
        return parseConfig(JSON.parse(stored2));
      }
      throw new Error("Carregue iris.credentials.json para continuar.");
    }
    const urls = [.../* @__PURE__ */ new Set([...CREDENTIAL_URLS, ...pageCredentialUrls()])];
    const fetched = await fetchCredentialsFromUrls(urls);
    if (fetched) {
      saveCredentialsToStorage(fetched);
      return parseConfig(fetched);
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return parseConfig(JSON.parse(stored));
    }
    throw new Error("iris.credentials.json n\xE3o encontrado.");
  }
  function loadAgentConfigFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const raw = JSON.parse(String(reader.result));
          saveCredentialsToStorage(raw);
          resolve(parseConfig(raw));
        } catch (error) {
          reject(error instanceof Error ? error : new Error("Arquivo de credenciais inv\xE1lido."));
        }
      };
      reader.onerror = () => reject(new Error("N\xE3o foi poss\xEDvel ler o arquivo."));
      reader.readAsText(file);
    });
  }

  // js/api-client.js
  function createApiClient(config) {
    const baseUrl = config.apiUrl.replace(/\/$/, "");
    async function request(path, init = {}) {
      const headers = new Headers(init.headers ?? {});
      headers.set("Authorization", `Bearer ${config.agentToken}`);
      if (init.body && !(init.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
      }
      const normalized = path.startsWith("/") ? path : `/${path}`;
      const url = baseUrl ? `${baseUrl}${normalized}` : normalized;
      const response = await fetch(url, {
        ...init,
        headers
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        const message = typeof payload.error === "string" ? payload.error : `Erro ${response.status}`;
        const error = new Error(message);
        error.status = response.status;
        throw error;
      }
      return response.json();
    }
    async function fetchBinary(path) {
      const headers = new Headers();
      headers.set("Authorization", `Bearer ${config.agentToken}`);
      const normalized = path.startsWith("/") ? path : `/${path}`;
      const url = baseUrl ? `${baseUrl}${normalized}` : normalized;
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}`);
      }
      return response.blob();
    }
    return {
      async listPosts(params = {}) {
        const query = new URLSearchParams();
        if (params.from) query.set("from", params.from);
        if (params.to) query.set("to", params.to);
        if (params.status) query.set("status", params.status);
        const suffix = query.toString() ? `?${query}` : "";
        const payload = await request(`/api/posts${suffix}`);
        return payload.posts ?? [];
      },
      async listAssets(postId) {
        const payload = await request(`/api/posts/${postId}/assets`);
        return payload.assets ?? [];
      },
      async fetchAssetBlob(postId, filename) {
        return fetchBinary(`/api/posts/${postId}/assets/${filename}`);
      },
      async health() {
        const url = baseUrl ? `${baseUrl}/health` : "/health";
        const response = await fetch(url);
        return response.ok;
      }
    };
  }

  // js/cache-store.js
  var STORAGE_KEY2 = "iris-desk:posts:v1";
  function readCachedPosts() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY2);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.posts)) return null;
      return parsed;
    } catch {
      return null;
    }
  }
  function writeCachedPosts(posts) {
    const payload = {
      fetchedAt: (/* @__PURE__ */ new Date()).toISOString(),
      posts
    };
    localStorage.setItem(STORAGE_KEY2, JSON.stringify(payload));
    return payload;
  }

  // js/posts-service.js
  async function loadPosts(apiClient2) {
    if (!navigator.onLine) {
      const cached = readCachedPosts();
      if (cached) {
        return { posts: cached.posts, source: "cache", fetchedAt: cached.fetchedAt };
      }
      throw new Error("Sem conex\xE3o e sem dados em cache.");
    }
    try {
      const posts = await apiClient2.listPosts();
      const saved = writeCachedPosts(posts);
      return { posts, source: "live", fetchedAt: saved.fetchedAt };
    } catch (error) {
      const cached = readCachedPosts();
      if (cached) {
        return {
          posts: cached.posts,
          source: "cache",
          fetchedAt: cached.fetchedAt,
          error
        };
      }
      throw error;
    }
  }

  // js/date-utils.js
  var WEEKDAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "S\xE1b"];
  var MONTHS = [
    "Janeiro",
    "Fevereiro",
    "Mar\xE7o",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"
  ];
  function formatMonthLabel(year, monthIndex) {
    return `${MONTHS[monthIndex]} ${year}`;
  }
  function postDisplayDate(post) {
    return post.scheduled_at ?? post.published_at ?? post.created_at;
  }
  function truncate(text, max = 48) {
    const value = (text ?? "").trim();
    if (value.length <= max) return value || "(sem legenda)";
    return `${value.slice(0, max - 1)}\u2026`;
  }
  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }
  function addMonths(date, delta) {
    return new Date(date.getFullYear(), date.getMonth() + delta, 1);
  }
  function calendarCells(year, monthIndex) {
    const first = new Date(year, monthIndex, 1);
    const start = new Date(year, monthIndex, 1 - first.getDay());
    const cells = [];
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      cells.push(day);
    }
    return cells;
  }

  // js/calendar-view.js
  function formatChipTime(iso) {
    if (!iso) return "";
    const date = new Date(iso);
    return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  function createCalendarView(root2, { onSelect }) {
    const headingEl = root2.querySelector("#calendar-heading");
    const gridEl = root2.querySelector("#calendar-grid");
    const prevBtn = root2.querySelector("#cal-prev");
    const nextBtn = root2.querySelector("#cal-next");
    let cursor = /* @__PURE__ */ new Date();
    let posts = [];
    let selectedId = null;
    function render() {
      const year = cursor.getFullYear();
      const month = cursor.getMonth();
      headingEl.textContent = formatMonthLabel(year, month);
      const cells = calendarCells(year, month);
      const today = /* @__PURE__ */ new Date();
      gridEl.replaceChildren();
      for (const label of WEEKDAYS) {
        const weekday = document.createElement("div");
        weekday.className = "cal-weekday";
        weekday.textContent = label;
        gridEl.appendChild(weekday);
      }
      for (const day of cells) {
        const cell = document.createElement("div");
        cell.className = "cal-day";
        cell.setAttribute("role", "gridcell");
        if (day.getMonth() !== month) {
          cell.classList.add("is-outside");
        }
        if (sameDay(day, today)) {
          cell.classList.add("is-today");
        }
        const number = document.createElement("div");
        number.className = "cal-day-number";
        number.textContent = String(day.getDate());
        cell.appendChild(number);
        const dayPosts = posts.filter((post) => {
          const raw = postDisplayDate(post);
          if (!raw) return false;
          return sameDay(new Date(raw), day);
        });
        for (const post of dayPosts.slice(0, 3)) {
          const chip = document.createElement("button");
          chip.type = "button";
          chip.className = "cal-chip";
          chip.dataset.status = post.status;
          chip.dataset.postId = post.id;
          if (selectedId === post.id) {
            chip.classList.add("is-selected");
          }
          const time = post.scheduled_at ? formatChipTime(post.scheduled_at) : "";
          const label = time ? `${time} \xB7 ${truncate(post.caption, 24)}` : truncate(post.caption, 28);
          chip.textContent = label;
          chip.addEventListener("click", () => onSelect(post));
          cell.appendChild(chip);
        }
        if (dayPosts.length > 3) {
          const more = document.createElement("span");
          more.className = "cal-more";
          more.textContent = `+${dayPosts.length - 3} mais`;
          cell.appendChild(more);
        }
        gridEl.appendChild(cell);
      }
    }
    prevBtn.addEventListener("click", () => {
      cursor = addMonths(cursor, -1);
      render();
    });
    nextBtn.addEventListener("click", () => {
      cursor = addMonths(cursor, 1);
      render();
    });
    return {
      setPosts(nextPosts) {
        posts = nextPosts;
        render();
      },
      setSelected(id) {
        selectedId = id;
        for (const chip of gridEl.querySelectorAll(".cal-chip")) {
          chip.classList.toggle("is-selected", chip.dataset.postId === id);
        }
      }
    };
  }

  // js/kanban-view.js
  var COLUMNS = [
    { id: "draft", label: "Rascunho" },
    { id: "scheduled", label: "Agendado" },
    { id: "published", label: "Publicado" },
    { id: "failed", label: "Falhou" },
    { id: "cancelled", label: "Cancelado" }
  ];
  var STATUS_LABELS = {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
    failed: "Falhou",
    cancelled: "Cancelado"
  };
  var thumbCache = /* @__PURE__ */ new Map();
  function formatWhen(iso) {
    if (!iso) return "\u2014";
    const date = new Date(iso);
    return date.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }
  function assetFilename(asset) {
    return asset.storage_path?.split("/").pop() ?? "";
  }
  async function loadThumb(post, apiClient2) {
    if (!apiClient2 || !(post.assets_count > 0)) return null;
    if (thumbCache.has(post.id)) return thumbCache.get(post.id);
    try {
      const assets = await apiClient2.listAssets(post.id);
      const first = assets[0];
      const filename = first ? assetFilename(first) : "";
      if (!filename) return null;
      const blob = await apiClient2.fetchAssetBlob(post.id, filename);
      const url = URL.createObjectURL(blob);
      thumbCache.set(post.id, url);
      return url;
    } catch {
      return null;
    }
  }
  function createKanbanView(root2, { onSelect, getApiClient: getApiClient2 }) {
    const boardEl = root2.querySelector("#kanban-board");
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
            const apiClient2 = getApiClient2?.();
            if (apiClient2) {
              void loadThumb(post, apiClient2).then((url) => {
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
      }
    };
  }

  // js/detail-panel.js
  var STATUS_LABELS2 = {
    draft: "Rascunho",
    scheduled: "Agendado",
    published: "Publicado",
    failed: "Falhou",
    cancelled: "Cancelado"
  };
  var objectUrls = [];
  function revokeObjectUrls() {
    for (const url of objectUrls) {
      URL.revokeObjectURL(url);
    }
    objectUrls.length = 0;
  }
  function formatDateTime(iso) {
    if (!iso) return "\u2014";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
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
  function assetFilename2(asset) {
    return asset.storage_path?.split("/").pop() ?? "";
  }
  function createDetailPanel(root2, { getApiClient: getApiClient2 }) {
    const panel = root2.querySelector("#post-detail");
    const empty = root2.querySelector("#detail-empty");
    const body = root2.querySelector("#detail-body");
    const title = root2.querySelector("#detail-title");
    const closeBtn = root2.querySelector("#detail-close");
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
    async function loadMedia(postId, apiClient2) {
      const mediaTitle = document.createElement("h3");
      mediaTitle.className = "detail-section-title";
      mediaTitle.textContent = "M\xEDdia";
      const gallery = document.createElement("div");
      gallery.className = "detail-media-gallery";
      try {
        const assets = await apiClient2.listAssets(postId);
        if (assets.length === 0) {
          const placeholder = document.createElement("div");
          placeholder.className = "detail-media-empty";
          placeholder.textContent = "Sem imagens";
          gallery.appendChild(placeholder);
        } else {
          for (const asset of assets) {
            const filename = assetFilename2(asset);
            if (!filename) continue;
            const figure = document.createElement("figure");
            figure.className = "detail-media-item";
            const img = document.createElement("img");
            img.alt = asset.original_filename ?? filename;
            img.loading = "lazy";
            img.decoding = "async";
            const blob = await apiClient2.fetchAssetBlob(postId, filename);
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
        placeholder.textContent = "N\xE3o foi poss\xEDvel carregar as imagens";
        gallery.appendChild(placeholder);
      }
      return { mediaTitle, gallery };
    }
    async function open(post) {
      revokeObjectUrls();
      const badge = document.createElement("span");
      badge.className = "status-badge";
      badge.dataset.status = post.status;
      badge.textContent = STATUS_LABELS2[post.status] ?? post.status;
      const meta = document.createElement("div");
      meta.className = "detail-meta";
      meta.appendChild(metaRow("ID", post.id, true));
      meta.appendChild(metaRow("Canal", post.channel ?? "\u2014"));
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
      const apiClient2 = getApiClient2?.();
      if (apiClient2 && (post.assets_count ?? 0) > 0) {
        const loading = document.createElement("p");
        loading.className = "detail-media-loading";
        loading.textContent = "Carregando m\xEDdia\u2026";
        body.appendChild(loading);
        const { mediaTitle, gallery } = await loadMedia(post.id, apiClient2);
        loading.remove();
        body.append(mediaTitle, gallery);
      } else if ((post.assets_count ?? 0) === 0) {
        const mediaTitle = document.createElement("h3");
        mediaTitle.className = "detail-section-title";
        mediaTitle.textContent = "M\xEDdia";
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
      }
    };
  }

  // js/app.js
  var root = document.querySelector("#app");
  var html = document.documentElement;
  var connectionLabel = root.querySelector("#connection-label");
  var setupPanel = root.querySelector("#setup-panel");
  var deskMain = root.querySelector("#desk-main");
  var calendarView = root.querySelector("#calendar-view");
  var kanbanView = root.querySelector("#kanban-view");
  var refreshBtn = root.querySelector("#refresh-btn");
  var credentialsFile = root.querySelector("#credentials-file");
  var navItems = root.querySelectorAll(".desk-tab");
  var apiClient = null;
  var getApiClient = () => apiClient;
  var detail = createDetailPanel(root, { getApiClient });
  var calendar = createCalendarView(root, { onSelect: (post) => void detail.open(post) });
  var kanban = createKanbanView(root, { onSelect: (post) => void detail.open(post), getApiClient });
  detail.onSelectionChange((selectedId) => {
    calendar.setSelected(selectedId);
    kanban.setSelected(selectedId);
  });
  function setAppState(state) {
    html.dataset.state = state;
  }
  function setConnection(text, className) {
    if (!connectionLabel) return;
    connectionLabel.textContent = text;
    connectionLabel.className = `sync-pill ${className}`.trim();
  }
  function showView(name) {
    detail.close();
    calendarView.hidden = name !== "calendar";
    kanbanView.hidden = name !== "kanban";
    for (const item of navItems) {
      const isActive = item.dataset.view === name;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", isActive ? "true" : "false");
    }
  }
  for (const item of navItems) {
    item.addEventListener("click", () => showView(item.dataset.view));
  }
  async function refresh() {
    if (!apiClient) return;
    const selectedId = detail.getSelectedId();
    setConnection("Sincronizando\u2026", "");
    try {
      const result = await loadPosts(apiClient);
      calendar.setPosts(result.posts);
      kanban.setPosts(result.posts);
      if (selectedId) {
        calendar.setSelected(selectedId);
        kanban.setSelected(selectedId);
      }
      if (result.source === "live") {
        setConnection(`Online \xB7 ${result.posts.length} posts`, "is-online");
      } else {
        const when = new Date(result.fetchedAt).toLocaleString("pt-BR");
        setConnection(`Offline \xB7 cache ${when}`, "is-offline");
      }
    } catch (error) {
      setConnection(error instanceof Error ? error.message : "Falha ao carregar", "is-error");
    }
  }
  async function startWithConfig(config) {
    apiClient = createApiClient(config);
    setupPanel.hidden = true;
    deskMain.hidden = false;
    calendarView.hidden = false;
    kanbanView.hidden = true;
    setAppState("ready");
    await refresh();
  }
  async function bootstrap() {
    setAppState("loading");
    try {
      const config = await loadAgentConfig();
      await startWithConfig(config);
    } catch {
      setupPanel.hidden = false;
      deskMain.hidden = true;
      setAppState("setup");
      setConnection("Configure credenciais", "is-error");
    }
  }
  refreshBtn.addEventListener("click", () => {
    void refresh();
  });
  credentialsFile?.addEventListener("change", () => {
    const file = credentialsFile.files?.[0];
    if (!file) return;
    void loadAgentConfigFromFile(file).then((config) => startWithConfig(config)).catch((error) => {
      setConnection(error instanceof Error ? error.message : "Credenciais inv\xE1lidas", "is-error");
    }).finally(() => {
      credentialsFile.value = "";
    });
  });
  window.addEventListener("online", () => {
    void refresh();
  });
  if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
    navigator.serviceWorker.register("./sw.js").catch(() => {
    });
  }
  void bootstrap();
})();
