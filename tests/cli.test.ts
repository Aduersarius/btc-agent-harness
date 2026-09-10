import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { run } from "../src/cli.js";
import { STUB_EXIT } from "../src/commands/stubs.js";
import { DEFAULT_HARNESS_CONFIG } from "../src/types.js";

describe("cli", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints help and exits 0", async () => {
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const code = await run(["--help"]);
    expect(code).toBe(0);
    expect(stdout.mock.calls.map(String).join("")).toContain("btc-agent-harness");
  });

  it("init writes a regtest-only harness.json", async () => {
    const dir = await mkdtemp(join(tmpdir(), "btc-agent-harness-"));
    const stdout = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const code = await run(["init", "--dir", dir]);
    expect(code).toBe(0);

    const written = JSON.parse(await readFile(join(dir, "harness.json"), "utf8"));
    expect(written).toEqual(DEFAULT_HARNESS_CONFIG);
    expect(written.network).toBe("regtest");
    expect(stdout.mock.calls.map(String).join("")).toContain("harness.json");
  });

  it("assert --timed-out fails even with --exit-code 0", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const code = await run(["assert", "--exit-code", "0", "--timed-out"]);
    expect(code).toBe(1);
    expect(stderr.mock.calls.map(String).join("")).toMatch(/timedOut===true/);
  });

  it("stubs do not report success", async () => {
    const stderr = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    expect(await run(["verify"])).toBe(STUB_EXIT);
    expect(await run(["regtest-up"])).toBe(STUB_EXIT);
    expect(await run(["scaffold"])).toBe(STUB_EXIT);
    expect(stderr.mock.calls.map(String).join("")).toMatch(/W0 stub/);
  });
});
