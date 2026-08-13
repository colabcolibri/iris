export const MCP_DOMAINS = [
  "posts",
  "media",
  "comments",
  "messages",
  "products",
  "stores",
  "insights",
  "settings",
  "simulator",
] as const;

export type McpDomain = (typeof MCP_DOMAINS)[number];
export type McpAction = "read" | "write" | "delete";

export type McpPermissionPreset = "full" | "read_only" | "editor" | "custom";

export type McpDomainCapabilities = {
  read: boolean;
  write: boolean;
  delete: boolean;
};

export type McpDomainDefinition = {
  id: McpDomain;
  label: string;
  description: string;
  capabilities: McpDomainCapabilities;
};

export type McpDomainPermissionOverride = Partial<McpDomainCapabilities>;

export type McpPermissionPolicyInput = {
  preset: McpPermissionPreset;
  domainOverrides?: Partial<Record<McpDomain, McpDomainPermissionOverride>>;
};

export type McpPermissionPolicy = McpPermissionPolicyInput & {
  domains: Record<McpDomain, McpDomainCapabilities>;
};

export const MCP_DOMAIN_CATALOG: McpDomainDefinition[] = [
  {
    id: "posts",
    label: "Posts",
    description: "Listar, criar, editar, cancelar e apagar publicações editoriais.",
    capabilities: { read: true, write: true, delete: true },
  },
  {
    id: "media",
    label: "Mídia",
    description: "Assets de post, upload assinado e resumo de carrossel.",
    capabilities: { read: true, write: true, delete: true },
  },
  {
    id: "comments",
    label: "Comentários",
    description: "Comentários sincronizados, contexto de reply e webhooks Meta.",
    capabilities: { read: true, write: false, delete: false },
  },
  {
    id: "messages",
    label: "DMs",
    description: "Conversas, mensagens e contexto de reply em mensagens privadas.",
    capabilities: { read: true, write: false, delete: false },
  },
  {
    id: "products",
    label: "Produtos",
    description: "Catálogo de produtos usado na triagem de DMs.",
    capabilities: { read: true, write: true, delete: true },
  },
  {
    id: "stores",
    label: "Lojas",
    description: "Conexões Yampi, sync de catálogo e políticas de campos.",
    capabilities: { read: true, write: true, delete: true },
  },
  {
    id: "insights",
    label: "Insights",
    description: "Métricas de posts, conta e refresh em lote.",
    capabilities: { read: true, write: true, delete: false },
  },
  {
    id: "settings",
    label: "Settings e persona",
    description: "Config operacional, persona de reply e blocos editoriais.",
    capabilities: { read: true, write: true, delete: false },
  },
  {
    id: "simulator",
    label: "Simulador",
    description: "Cenários de sandbox e execução do harness de reply.",
    capabilities: { read: true, write: true, delete: false },
  },
];

const DOMAIN_DEFINITIONS = Object.fromEntries(
  MCP_DOMAIN_CATALOG.map((entry) => [entry.id, entry]),
) as Record<McpDomain, McpDomainDefinition>;

function fullDomainPermissions(): Record<McpDomain, McpDomainCapabilities> {
  return Object.fromEntries(
    MCP_DOMAINS.map((domain) => [
      domain,
      { ...DOMAIN_DEFINITIONS[domain].capabilities },
    ]),
  ) as Record<McpDomain, McpDomainCapabilities>;
}

function presetBasePermissions(
  preset: Exclude<McpPermissionPreset, "custom">,
): Record<McpDomain, McpDomainCapabilities> {
  const domains = fullDomainPermissions();

  for (const domain of MCP_DOMAINS) {
    const caps = DOMAIN_DEFINITIONS[domain].capabilities;
    if (preset === "read_only") {
      domains[domain] = {
        read: caps.read,
        write: false,
        delete: false,
      };
      continue;
    }

    if (preset === "editor") {
      domains[domain] = {
        read: caps.read,
        write: caps.write,
        delete: false,
      };
      continue;
    }

    domains[domain] = { ...caps };
  }

  return domains;
}

function mergeDomainOverride(
  base: McpDomainCapabilities,
  override: McpDomainPermissionOverride | undefined,
  definition: McpDomainDefinition,
): McpDomainCapabilities {
  const next = {
    read: override?.read ?? base.read,
    write: override?.write ?? base.write,
    delete: override?.delete ?? base.delete,
  };

  return {
    read: definition.capabilities.read ? next.read : false,
    write: definition.capabilities.write ? next.write : false,
    delete: definition.capabilities.delete ? next.delete : false,
  };
}

export function resolveMcpPermissionPolicy(
  input: McpPermissionPolicyInput | null | undefined,
): McpPermissionPolicy {
  const preset = input?.preset ?? "full";
  const base =
    preset === "custom"
      ? presetBasePermissions("full")
      : presetBasePermissions(preset);

  const domains = Object.fromEntries(
    MCP_DOMAINS.map((domain) => [
      domain,
      mergeDomainOverride(
        base[domain],
        input?.domainOverrides?.[domain],
        DOMAIN_DEFINITIONS[domain],
      ),
    ]),
  ) as Record<McpDomain, McpDomainCapabilities>;

  return {
    preset,
    domainOverrides: input?.domainOverrides,
    domains,
  };
}

export function isMcpActionAllowed(
  policy: McpPermissionPolicy,
  domain: McpDomain,
  action: McpAction,
): boolean {
  const permissions = policy.domains[domain];
  if (!permissions) {
    return false;
  }

  return permissions[action];
}

export function normalizeMcpPermissionPolicyInput(
  body: unknown,
): McpPermissionPolicyInput {
  if (!body || typeof body !== "object") {
    throw new Error("Invalid MCP permission policy body");
  }

  const record = body as Record<string, unknown>;
  const preset = record.preset;
  if (
    preset !== "full" &&
    preset !== "read_only" &&
    preset !== "editor" &&
    preset !== "custom"
  ) {
    throw new Error("Invalid MCP permission preset");
  }

  const domainOverrides: Partial<
    Record<McpDomain, McpDomainPermissionOverride>
  > = {};

  if (record.domain_overrides !== undefined) {
    if (!record.domain_overrides || typeof record.domain_overrides !== "object") {
      throw new Error("Invalid domain_overrides");
    }

    for (const [domain, value] of Object.entries(
      record.domain_overrides as Record<string, unknown>,
    )) {
      if (!MCP_DOMAINS.includes(domain as McpDomain)) {
        throw new Error(`Unknown MCP domain: ${domain}`);
      }

      if (!value || typeof value !== "object") {
        throw new Error(`Invalid override for domain: ${domain}`);
      }

      const override = value as Record<string, unknown>;
      const next: McpDomainPermissionOverride = {};
      if (override.read !== undefined) {
        if (typeof override.read !== "boolean") {
          throw new Error(`Invalid read override for domain: ${domain}`);
        }
        next.read = override.read;
      }
      if (override.write !== undefined) {
        if (typeof override.write !== "boolean") {
          throw new Error(`Invalid write override for domain: ${domain}`);
        }
        next.write = override.write;
      }
      if (override.delete !== undefined) {
        if (typeof override.delete !== "boolean") {
          throw new Error(`Invalid delete override for domain: ${domain}`);
        }
        next.delete = override.delete;
      }

      domainOverrides[domain as McpDomain] = next;
    }
  }

  return {
    preset,
    domainOverrides:
      Object.keys(domainOverrides).length > 0 ? domainOverrides : undefined,
  };
}

export function serializeMcpPermissionPolicy(policy: McpPermissionPolicy) {
  return {
    preset: policy.preset,
    domain_overrides: policy.domainOverrides ?? null,
    domains: MCP_DOMAIN_CATALOG.map((definition) => ({
      id: definition.id,
      label: definition.label,
      description: definition.description,
      capabilities: definition.capabilities,
      permissions: policy.domains[definition.id],
    })),
    catalog: MCP_DOMAIN_CATALOG.map((definition) => ({
      id: definition.id,
      label: definition.label,
      description: definition.description,
      capabilities: definition.capabilities,
    })),
  };
}
