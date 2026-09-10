# btc-agent-harness

TypeScript CLI that helps coding agents validate **Bitcoin regtest** work with deterministic **ASSERT** gates.

Built for **[BOSS Battle](https://boss-battle.devfolio.co/)** (Bitshala Bitcoin FOSS) — **AI / Machine Money** track. W0 scaffold.

A timed-out command is **never** a pass, even when `exitCode === 0`.

## Safety

- **Regtest / mocks only.** No mainnet keys, no fund custody, no wallet signing in CI.
- Unit tests inject a mock JSON-RPC client. They do **not** start Docker or open a network socket.
- `docker-compose.yml` is documentation for a local `bitcoind -regtest` node. Tests never launch it.

## Requirements

- Node.js 20+
- npm

## Install and run

```bash
npm i
npm test
npm run build
```

CLI (dev):

```bash
npx tsx src/cli.ts --help
npx tsx src/cli.ts init
npx tsx src/cli.ts assert --exit-code 0
npx tsx src/cli.ts assert --exit-code 0 --timed-out   # fails
```

CLI (built bin):

```bash
npm run build
node dist/cli.js --help
# or, after npm link:
btc-agent-harness --help
```

### Commands

| Command        | W0 status | Behavior |
|----------------|-----------|----------|
| `init`         | working   | Writes `harness.json` (regtest RPC defaults) |
| `assert`       | working   | Evaluates a gate from flags or `--from result.json` |
| `regtest-up`   | stub      | Exit 2 — use `docker compose up` locally |
| `scaffold`     | stub      | Exit 2 — later week |
| `verify`       | stub      | Exit 2 — a stub must not report success |

`assert` inputs:

```bash
btc-agent-harness assert --exit-code 0
btc-agent-harness assert --exit-code 0 --timed-out
btc-agent-harness assert --from ./result.json
btc-agent-harness assert --exit-code 0 --rpc-error '{"code":-32603,"message":"boom"}'
```

`result.json` shape:

```json
{
  "exitCode": 0,
  "timedOut": false,
  "rpcError": null
}
```

## ASSERT rule

`evaluateAssert()` fails when **any** of these are true:

1. `timedOut === true` (even if `exitCode === 0`)
2. `exitCode !== 0`
3. `rpcError` is present

Only a clean, non-timed-out, zero-exit outcome with no RPC error passes.

## Local regtest (optional)

```bash
docker compose up -d
```

See `docker-compose.yml`. Do not point this harness at mainnet.

## Library

```ts
import { evaluateAssert, createMockRpc, outcomeFromRpc } from "btc-agent-harness";

evaluateAssert({ exitCode: 0, timedOut: true });
// { passed: false, failures: ["ASSERT failed: timedOut===true ..."] }
```

## Non-goals (W0)

- Mainnet, signet, or testnet as a default
- Holding or sweeping funds; any custody model
- Wallet signing, PSBT finalization, or key material in CI
- Talking to a live `bitcoind` from unit tests
- Production-ready `regtest-up` / `scaffold` / `verify` pipelines (stubs only)
- Secrets, API keys, or seed phrases in the repo

## License

MIT
