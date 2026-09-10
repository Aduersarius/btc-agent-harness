import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { DEFAULT_HARNESS_CONFIG } from "../types.js";

export async function runInit(dir = process.cwd()): Promise<{ path: string }> {
  const path = resolve(dir, "harness.json");
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(DEFAULT_HARNESS_CONFIG, null, 2)}\n`);
  return { path };
}
