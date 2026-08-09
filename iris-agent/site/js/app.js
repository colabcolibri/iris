import { loadAgentConfig, loadAgentConfigFromFile } from "./config.js";
import { createApiClient } from "./api-client.js";
import { loadPosts } from "./posts-service.js";
import { createCalendarView } from "./calendar-view.js";
import { createKanbanView } from "./kanban-view.js";
import { createDetailPanel } from "./detail-panel.js";

const root = document.querySelector("#app");
const html = document.documentElement;
const connectionLabel = root.querySelector("#connection-label");
const setupPanel = root.querySelector("#setup-panel");
const deskMain = root.querySelector("#desk-main");
const calendarView = root.querySelector("#calendar-view");
const kanbanView = root.querySelector("#kanban-view");
const refreshBtn = root.querySelector("#refresh-btn");
const credentialsFile = root.querySelector("#credentials-file");
const navItems = root.querySelectorAll(".desk-tab");

let apiClient = null;
const getApiClient = () => apiClient;

const detail = createDetailPanel(root, { getApiClient });
const calendar = createCalendarView(root, { onSelect: (post) => void detail.open(post) });
const kanban = createKanbanView(root, { onSelect: (post) => void detail.open(post), getApiClient });

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
  setConnection("Sincronizando…", "");
  try {
    const result = await loadPosts(apiClient);
    calendar.setPosts(result.posts);
    kanban.setPosts(result.posts);

    if (selectedId) {
      calendar.setSelected(selectedId);
      kanban.setSelected(selectedId);
    }

    if (result.source === "live") {
      setConnection(`Online · ${result.posts.length} posts`, "is-online");
    } else {
      const when = new Date(result.fetchedAt).toLocaleString("pt-BR");
      setConnection(`Offline · cache ${when}`, "is-offline");
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
  void loadAgentConfigFromFile(file)
    .then((config) => startWithConfig(config))
    .catch((error) => {
      setConnection(error instanceof Error ? error.message : "Credenciais inválidas", "is-error");
    })
    .finally(() => {
      credentialsFile.value = "";
    });
});

window.addEventListener("online", () => {
  void refresh();
});

if ("serviceWorker" in navigator && window.location.protocol !== "file:") {
  navigator.serviceWorker.register("./sw.js").catch(() => {
    /* opcional */
  });
}

void bootstrap();
