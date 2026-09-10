#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { runAssert } from "./commands/assert.js";
import { runInit } from "./commands/init.js";
import { runStub, type StubCommand } from "./commands/stubs.js";
import type { RpcError } from "./types.js";

const HELP = `btc-agent-harness — Bitcoin regtest ASSERT gates for coding agents

Usage:
  btc-agent-harness <command> [options]

Commands:
  init          Write a local harness.json (regtest-only)
  assert        Evaluate an ASSERT gate (timeout is never success)
  regtest-up    Stub: start bitcoind regtest (see docker-compose.yml)
  scaffold      Stub: scaffold an agent workspace
  verify        Stub: run the full verification pipeline

Options:
  -h, --help    Show this help
  -v, --version Print version

ASSERT examples:
  btc-agent-harness assert --exit-code 0
  btc-agent-harness assert --exit-code 0 --timed-out
  btc-agent-harness assert --from ./result.json
  btc-agent-harness assert --exit-code 0 --rpc-error '{"code":-32603,"message":"boom"}'

Safety:
  Regtest / mocks only. No mainnet keys, no fund custody, no wallet signing.
`;

function packageVersion(): string {
  const here = dirname(fileURLToPath(import.meta.url));
  const candidates = [join(here, "../package.json"), join(here, "../../package.json")];
  for (const path of candidates) {
    try {
      const pkg = JSON.parse(readFileSync(path, "utf8")) as { version?: string };
      if (pkg.version) return pkg.version;
    } catch {
      // try next
    }
  }
  return "0.0.0";
}

function takeFlag(argv: string[], name: string): boolean {
  const i = argv.indexOf(name);
  if (i === -1) return false;
  argv.splice(i, 1);
  return true;
}

function takeOption(argv: string[], name: string): string | undefined {
  const i = argv.indexOf(name);
  if (i === -1) return undefined;
  const value = argv[i + 1];
  if (value === undefined || value.startsWith("-")) {
    throw new Error(`${name} requires a value`);
  }
  argv.splice(i, 2);
  return value;
}

function parseRpcError(raw: string | undefined): RpcError | undefined {
  if (raw === undefined) return undefined;
  const parsed = JSON.parse(raw) as RpcError;
  if (typeof parsed.code !== "number" || typeof parsed.message !== "string") {
    throw new Error("--rpc-error must be JSON { code: number, message: string }");
  }
  return parsed;
}

export async function run(argv: string[]): Promise<number> {
  const args = [...argv];

  if (args.length === 0 || args[0] === "-h" || args[0] === "--help") {
    process.stdout.write(HELP);
    return 0;
  }
  if (args[0] === "-v" || args[0] === "--version") {
    process.stdout.write(`${packageVersion()}\n`);
    return 0;
  }

  const command = args.shift();
  if (!command) {
    process.stdout.write(HELP);
    return 0;
  }

  if (command === "init") {
    const dir = takeOption(args, "--dir") ?? process.cwd();
    const { path } = await runInit(dir);
    process.stdout.write(`wrote ${path}\n`);
    return 0;
  }

  if (command === "assert") {
    if (takeFlag(args, "-h") || takeFlag(args, "--help")) {
      process.stdout.write(HELP);
      return 0;
    }
    const from = takeOption(args, "--from");
    const exitRaw = takeOption(args, "--exit-code");
    const timedOut = takeFlag(args, "--timed-out");
    const rpcError = parseRpcError(takeOption(args, "--rpc-error"));
    const exitCode = exitRaw === undefined ? undefined : Number(exitRaw);
    if (exitRaw !== undefined && !Number.isInteger(exitCode)) {
      process.stderr.write("assert: --exit-code must be an integer\n");
      return 1;
    }
    try {
      const { exitCode: code, result } = await runAssert({
        exitCode,
        timedOut,
        rpcError,
        from,
      });
      if (result.passed) {
        process.stdout.write("ASSERT passed\n");
      } else {
        process.stderr.write(`${result.failures.join("\n")}\n`);
      }
      return code;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`assert: ${message}\n`);
      return 1;
    }
  }

  if (command === "regtest-up" || command === "scaffold" || command === "verify") {
    const { exitCode, message } = runStub(command as StubCommand);
    process.stderr.write(`${message}\n`);
    return exitCode;
  }

  process.stderr.write(`unknown command: ${command}\n\n${HELP}`);
  return 1;
}

const invokedDirectly =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedDirectly) {
  run(process.argv.slice(2))
    .then((code) => {
      process.exitCode = code;
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      process.stderr.write(`${message}\n`);
      process.exitCode = 1;
    });
}
