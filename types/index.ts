export interface Pattern {
  name: string;
  line: number;
  code: string;
}

export interface ScanResult {
  isHoneypot: boolean;
  confidence: number;
  patterns: readonly Pattern[];
  message: string;
  chain: string;
}

export interface KVNamespace {
  get(
    key: string,
    type?: "text" | "json" | "arrayBuffer" | "stream",
  ): Promise<unknown>;
  put(
    key: string,
    value: string,
    options?: { expirationTtl?: number },
  ): Promise<void>;
}

export type EnvCache = KVNamespace | undefined;
export type EnvApiKey = string | undefined;

export interface Env {
  CACHE: EnvCache;
  ETHERSCAN_API_KEY_1: EnvApiKey;
  ETHERSCAN_API_KEY_2: EnvApiKey;
  ETHERSCAN_API_KEY_3: EnvApiKey;
  ETHERSCAN_API_KEY_4: EnvApiKey;
  ETHERSCAN_API_KEY_5: EnvApiKey;
  ETHERSCAN_API_KEY_6: EnvApiKey;
}

export interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}
