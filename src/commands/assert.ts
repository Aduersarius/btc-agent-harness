import { readFile } from "node:fs/promises";
import { evaluateAssert } from "../assert.js";
import type { CommandOutcome, RpcError } from "../types.js";

export interface AssertCliInput {
  exitCode?: number;
  timedOut?: boolean;
  rpcError?: RpcError | null;
  from?: string;
}

export async function loadOutcome(input: AssertCliInput): Promise<CommandOutcome> {
  let base: Partial<CommandOutcome> = {};

  if (input.from) {
    const raw = await readFile(input.from, "utf8");
    base = JSON.parse(raw) as Partial<CommandOutcome>;
  }

  const exitCode = input.exitCode ?? base.exitCode;
  if (typeof exitCode !== "number" || !Number.isInteger(exitCode)) {
    throw new Error("assert requires --exit-code <int> or --from <file> with exitCode");
  }

  return {
    exitCode,
    timedOut: input.timedOut ?? base.timedOut ?? false,
    rpcError: input.rpcError !== undefined ? input.rpcError : (base.rpcError ?? null),
    stdout: base.stdout,
    stderr: base.stderr,
  };
}

export async function runAssert(input: AssertCliInput): Promise<{
  exitCode: number;
  result: ReturnType<typeof evaluateAssert>;
}> {
  const outcome = await loadOutcome(input);
  const result = evaluateAssert(outcome);
  return { exitCode: result.passed ? 0 : 1, result };
}
