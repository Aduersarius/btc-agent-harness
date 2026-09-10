import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { evaluateAssert } from "../src/assert.js";
import { runAssert } from "../src/commands/assert.js";
import { createMockRpc, outcomeFromRpc } from "../src/rpc.js";

describe("evaluateAssert", () => {
  it("rejects timeout even when exitCode===0", () => {
    const result = evaluateAssert({
      exitCode: 0,
      timedOut: true,
    });

    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("timedOut===true"))).toBe(true);
  });

  it("passes a clean zero-exit outcome", () => {
    const result = evaluateAssert({
      exitCode: 0,
      timedOut: false,
      rpcError: null,
    });

    expect(result.passed).toBe(true);
    expect(result.failures).toEqual([]);
  });

  it("fails when the mocked RPC returns an error", async () => {
    const rpc = createMockRpc(() => ({
      error: { code: -32603, message: "internal error" },
    }));

    const response = await rpc.call("getblockchaininfo");
    const result = evaluateAssert(outcomeFromRpc(response));

    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("rpc-error"))).toBe(true);
    expect(result.failures.some((f) => f.includes("-32603"))).toBe(true);
  });
});

describe("runAssert CLI helper", () => {
  it("loads a result file and fails on rpc-error", async () => {
    const dir = await mkdtemp(join(tmpdir(), "btc-agent-harness-"));
    const from = join(dir, "result.json");
    await writeFile(
      from,
      JSON.stringify({
        exitCode: 0,
        timedOut: false,
        rpcError: { code: -18, message: "No wallet is loaded" },
      }),
    );

    const { exitCode, result } = await runAssert({ from });
    expect(exitCode).toBe(1);
    expect(result.passed).toBe(false);
    expect(result.failures.some((f) => f.includes("rpc-error"))).toBe(true);
  });
});
