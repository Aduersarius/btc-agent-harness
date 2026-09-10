import type { RpcError } from "./types.js";

export interface RpcResponse {
  result?: unknown;
  error?: RpcError | null;
}

export interface RpcClient {
  call(method: string, params?: unknown[]): Promise<RpcResponse>;
}

/**
 * Treat a JSON-RPC envelope as an ASSERT input.
 * Unit tests inject mock responses — no network, no Docker.
 */
export function outcomeFromRpc(response: RpcResponse): {
  exitCode: number;
  timedOut: false;
  rpcError: RpcError | null;
} {
  if (response.error) {
    return { exitCode: 1, timedOut: false, rpcError: response.error };
  }
  return { exitCode: 0, timedOut: false, rpcError: null };
}

export function createMockRpc(
  handler: (method: string, params?: unknown[]) => RpcResponse,
): RpcClient {
  return {
    async call(method, params) {
      return handler(method, params);
    },
  };
}
