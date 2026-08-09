const STORAGE_KEY = "iris.desk.credentials";

const CREDENTIAL_URLS = [
  new URL("../iris.credentials.json", import.meta.url).href,
  new URL("../../iris.credentials.json", import.meta.url).href,
];

function pageCredentialUrls() {
  if (typeof window === "undefined") return [];
  const base = new URL(".", window.location.href);
  return [
    new URL("../iris.credentials.json", base).href,
    new URL("iris.credentials.json", base).href,
  ];
}

function parseConfig(raw) {
  const apiUrl = typeof raw.apiUrl === "string" ? raw.apiUrl.trim().replace(/\/$/, "") : "";
  const agentToken = typeof raw.agentToken === "string" ? raw.agentToken.trim() : "";

  if (!apiUrl || !agentToken) {
    throw new Error("apiUrl e agentToken são obrigatórios em iris.credentials.json.");
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
      /* tenta próxima origem */
    }
  }
  return null;
}

export function saveCredentialsToStorage(raw) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(raw));
}

export async function loadAgentConfig() {
  if (typeof window !== "undefined" && window.location.protocol === "file:") {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return parseConfig(JSON.parse(stored));
    }
    throw new Error("Carregue iris.credentials.json para continuar.");
  }

  const urls = [...new Set([...CREDENTIAL_URLS, ...pageCredentialUrls()])];

  const fetched = await fetchCredentialsFromUrls(urls);
  if (fetched) {
    saveCredentialsToStorage(fetched);
    return parseConfig(fetched);
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    return parseConfig(JSON.parse(stored));
  }

  throw new Error("iris.credentials.json não encontrado.");
}

export function loadAgentConfigFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const raw = JSON.parse(String(reader.result));
        saveCredentialsToStorage(raw);
        resolve(parseConfig(raw));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Arquivo de credenciais inválido."));
      }
    };
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo."));
    reader.readAsText(file);
  });
}
