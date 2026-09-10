/** Bitcoin JSON-RPC error object (mocked in unit tests). */
export interface RpcError {
  code: number;
  message: string;
}

/**
 * Outcome of a command or RPC-backed check.
 * Timeouts are first-class: `timedOut === true` is never success.
 */
export interface CommandOutcome {
  exitCode: number;
  timedOut: boolean;
  stdout?: string;
  stderr?: string;
  rpcError?: RpcError | null;
}

export interface AssertResult {
  passed: boolean;
  failures: string[];
}

export interface HarnessConfig {
  network: "regtest";
  rpc: {
    host: string;
    port: number;
  };
  assert: {
    /** Hard rule: a timeout is a failed ASSERT, even if exitCode is 0. */
    timeoutIsFailure: true;
  };
}

export const DEFAULT_HARNESS_CONFIG: HarnessConfig = {
  network: "regtest",
  rpc: {
    host: "127.0.0.1",
    port: 18443,
  },
  assert: {
    timeoutIsFailure: true,
  },
};
