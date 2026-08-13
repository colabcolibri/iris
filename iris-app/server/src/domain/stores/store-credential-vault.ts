import {
  decryptToken,
  encryptToken,
  resolveEncryptionKey,
} from "../../adapters/crypto/token-vault.ts";
import type { StoreCredentials } from "../domain/stores/store-types.ts";

export type StoreCredentialVault = {
  encrypt(credentials: StoreCredentials): string;
  decrypt(vault: string): StoreCredentials;
};

export function createStoreCredentialVault(options?: {
  encryptionKey?: string;
}): StoreCredentialVault {
  const key = resolveEncryptionKey(options?.encryptionKey);

  return {
    encrypt(credentials) {
      return encryptToken(JSON.stringify(credentials), key);
    },

    decrypt(vault) {
      const parsed = JSON.parse(decryptToken(vault, key)) as StoreCredentials;
      return parsed;
    },
  };
}
