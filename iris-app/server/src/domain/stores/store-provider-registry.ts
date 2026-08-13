import type { StoreProvider } from "../../ports/store-provider.ts";
import type { StoreProviderType } from "./store-types.ts";

export type StoreProviderRegistry = {
  register(provider: StoreProvider): void;
  get(providerType: StoreProviderType): StoreProvider;
  listTypes(): StoreProviderType[];
};

export function createStoreProviderRegistry(
  initial: StoreProvider[] = [],
): StoreProviderRegistry {
  const providers = new Map<StoreProviderType, StoreProvider>();

  for (const provider of initial) {
    providers.set(provider.providerType, provider);
  }

  return {
    register(provider) {
      providers.set(provider.providerType, provider);
    },

    get(providerType) {
      const provider = providers.get(providerType);
      if (!provider) {
        throw new Error(`store provider not registered: ${providerType}`);
      }
      return provider;
    },

    listTypes() {
      return [...providers.keys()];
    },
  };
}
