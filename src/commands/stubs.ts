export const STUB_EXIT = 2;

const STUBS = {
  "regtest-up":
    "W0 stub: start bitcoind in regtest with `docker compose up` (see docker-compose.yml). Not run by unit tests.",
  scaffold:
    "W0 stub: workspace scaffolding lands in a later week. Use `init` for harness.json.",
  verify:
    "W0 stub: full verify pipeline is not implemented. A stub must not report success.",
} as const;

export type StubCommand = keyof typeof STUBS;

export function runStub(command: StubCommand): { exitCode: number; message: string } {
  return { exitCode: STUB_EXIT, message: STUBS[command] };
}
