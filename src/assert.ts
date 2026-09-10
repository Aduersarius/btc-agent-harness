import type { AssertResult, CommandOutcome } from "./types.js";

/**
 * Deterministic ASSERT gate.
 *
 * A timeout must never count as success — even when `exitCode === 0`.
 * RPC errors also fail the gate. Only a clean, non-timed-out, zero-exit
 * outcome with no `rpcError` passes.
 */
export function evaluateAssert(outcome: CommandOutcome): AssertResult {
  const failures: string[] = [];

  if (outcome.timedOut) {
    failures.push(
      "ASSERT failed: timedOut===true (timeout must not count as success)",
    );
  }

  if (outcome.exitCode !== 0) {
    failures.push(`ASSERT failed: exitCode===${outcome.exitCode}`);
  }

  if (outcome.rpcError) {
    failures.push(
      `ASSERT failed: rpc-error code=${outcome.rpcError.code} message=${outcome.rpcError.message}`,
    );
  }

  return {
    passed: failures.length === 0,
    failures,
  };
}
