import { createStoreProviderRegistry } from "./store-provider-registry.ts";
import { createYampiStoreProvider } from "../../adapters/yampi/yampi-store-provider.ts";

export function createDefaultStoreProviderRegistry() {
  return createStoreProviderRegistry([createYampiStoreProvider()]);
}
