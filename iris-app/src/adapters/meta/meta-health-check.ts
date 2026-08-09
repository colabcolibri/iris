export type MetaHealthCode =
  | "ok"
  | "not_connected"
  | "token_expired"
  | "permission_denied"
  | "network"
  | "unknown";

export type MetaHealthResult = {
  ok: boolean;
  code: MetaHealthCode;
  message?: string;
};

type MetaHealthCheckOptions = {
  igUserId: string;
  token: string;
  graphApiVersion?: string;
  fetchImpl?: typeof fetch;
};

type GraphUserResponse = {
  id?: string;
  username?: string;
  error?: { message?: string; code?: number; type?: string };
};

export async function checkMetaConnection(
  options: MetaHealthCheckOptions,
): Promise<MetaHealthResult> {
  const version = options.graphApiVersion ?? "v21.0";
  const fetchFn = options.fetchImpl ?? fetch;
  const url = new URL(
    `https://graph.facebook.com/${version}/${options.igUserId}`,
  );
  url.searchParams.set("fields", "id,username");
  url.searchParams.set("access_token", options.token);

  try {
    const response = await fetchFn(url.toString());
    const json = (await response.json()) as GraphUserResponse;

    if (response.ok && json.id) {
      return { ok: true, code: "ok" };
    }

    const errorCode = json.error?.code;
    if (errorCode === 190) {
      return {
        ok: false,
        code: "token_expired",
        message: "Token expirado ou inválido.",
      };
    }

    if (errorCode === 10 || errorCode === 200) {
      return {
        ok: false,
        code: "permission_denied",
        message: "Permissão insuficiente para esta conta.",
      };
    }

    return {
      ok: false,
      code: "unknown",
      message: json.error?.message ?? "Falha ao verificar conexão.",
    };
  } catch {
    return {
      ok: false,
      code: "network",
      message: "Não foi possível contactar a Meta.",
    };
  }
}
