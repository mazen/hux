# Phase 0 — Groundwork (plan)

Status: **proposal**. Scope: the smallest end-to-end system that later phases extend without rework.
Context: [architecture-overview.md](architecture-overview.md).

## Outcome

On a single Windows machine:

```
cargo run --bin hux-gateway   →  opens http://localhost:<port>
  first run:  "Which model should I use?"  (OpenAI-compatible URL, model picked from /v1/models, optional key)
  then:       chat with the assistant in the browser, streamed, persisted, survives restart
```

The same gateway also builds and runs as a Linux container (CPU-only, LLM elsewhere).

**In scope:** UI exploration (look and feel of the final product), workspace and tooling, protocol and transport seams, the LLM seam, minimal storage, the web UI shell, first-run setup, one role (Chief) chatting, a container build.

**Explicitly not in Phase 0:** nodes and pairing, iroh, desktop/tray app, terminal client, roles and delegation, policy and approvals, plugins, generative UI schema, scheduler, voice, devices, multi-member, auth beyond loopback.

## Directory structure

```
hux/
├── Cargo.toml              # workspace manifest: members, shared deps, lints
├── rust-toolchain.toml     # pinned toolchain + components
├── package.json            # pnpm workspace root (web only)
├── crates/                 # Rust libraries, one concern each
│   ├── hux-protocol/       # message shapes + codec; no I/O, no transport
│   ├── hux-transport/      # moves opaque messages; WebSocket + in-memory adapters
│   ├── hux-llm/            # model seam; the ONLY crate that imports rig
│   └── hux-gateway/        # gateway core as a library (sessions, chief, settings, store)
├── apps/                   # thin executables and UIs that compose crates
│   ├── gateway/            # package `hux-gateway-app`, binary `hux-gateway`: config, HTTP server, web assets
│   └── web/                # React + Tailwind + TypeScript (Vite) → static build
├── schemas/                # generated JSON Schema of the protocol (checked in, CI-verified)
├── deploy/
│   └── docker/             # Dockerfile, compose example (k8s/, proxmox/ later)
├── docs/
│   ├── adr/                # decisions
│   ├── design/             # overviews and phase plans
│   ├── research/           # source-cited research notes
│   └── agents/             # agent-skill config
├── xtask/                  # repo automation in Rust (gen-schemas, build-web, dist)
├── AGENTS.md
└── README.md
```

Rules:
- `crates/` are libraries; `apps/` are thin and compose them. Business logic never lives in `apps/`.
- A new crate is created only when a seam has, or will soon have, a second adapter or consumer. Until then a concern lives as a module inside an existing crate. Storage, for example, starts as a module in `hux-gateway`.
- Crate names use the `hux-` prefix. If the name changes, renaming is mechanical.

## Seams in Phase 0

Three layers, separated from day one:

| Layer | Crate | Interface (sketch) | Adapters in P0 | Later |
|---|---|---|---|---|
| **Message shape** | `hux-protocol` | typed `Frame` + per-domain message enums, protocol version, `hello` capability exchange | — | more domains (node, ui, approval…) |
| **Encoding** | `hux-protocol::codec` | `encode(Frame) -> Bytes`, `decode(Bytes) -> Result<Frame>` | JSON | CBOR/MessagePack if needed |
| **Transport** | `hux-transport` | a `Connection`: ordered, reliable, bidirectional *messages* (`send(Bytes)`, `recv() -> Option<Bytes>`), plus `Listener`/`Dialer` | **WebSocket** (axum server, tungstenite client), **in-memory** (tests) | iroh (QUIC), stdio (connectors), Unix socket |

- The transport knows nothing about frames; the protocol knows nothing about sockets. Two adapters (WebSocket and in-memory) make the transport seam real from the start.
- Frames carry `id` (request/response correlation), `seq` (per-connection ordering, enables resume later) and an optional idempotency key. Resume and replay are **not** implemented in P0, but the fields exist.
- **Protocol-first**: Rust types are the source, JSON Schema is generated into `schemas/` (schemars), and TypeScript types for the web app are generated from that schema. Any other language can do the same.

`hux-llm` (one adapter in P0, but it is the declared rig-isolation seam):
- `Complete`: streaming chat completion with tools, returning text deltas, tool calls and usage. Backed by rig's OpenAI-compatible client pointed at any base URL.
- `ModelEndpoint` (URL, key handle, discovered models) and `ModelProfile` (context, modalities, sampler presets per mode). Ships with a Qwen3.8 profile (thinking / non-thinking presets).
- `list_models(endpoint)` for the setup screen.

## Slices (tracer bullets, in order)

Each slice ends in something runnable and tested.

0. **UI exploration** (runs in parallel with slices 1–3)
   - Ten radically different visual concepts of the *final* product, as a throwaway prototype (`apps/ui-prototype`, switchable via `?variant=`).
   - Each concept covers: the assistant view (main focus), reminders/calendar/repeating jobs, settings (vast but simple), light and dark, simple and expert mode, desktop and mobile.
   - Copy follows the product principles in `AGENTS.md`.
   - Done when one direction (or a named mix) is chosen and recorded; the prototype is moved to a `prototype/ui-concepts` branch and the decision feeds the real `apps/web` in slices 1, 4 and 5.
1. **Workspace skeleton**
   - Cargo workspace, toolchain pin, shared lints, `cargo fmt`/`clippy`/`test`, dual licence `MIT OR Apache-2.0` (`LICENSE-MIT`, `LICENSE-APACHE`).
   - `apps/web` scaffold (Vite, React, TS, Tailwind), pnpm.
   - `hux-gateway` binary serving the built web assets and `/health`.
   - CI on GitHub Actions: Windows + Linux, Rust + web build.
   - Done when `cargo run --bin hux-gateway` serves a placeholder page.
2. **Protocol + transport**
   - `Frame`, `hello` handshake (client kind, protocol version, capabilities stub), ping.
   - WebSocket and in-memory adapters.
   - `xtask gen-schemas` produces JSON Schema and TS types; CI fails if they are stale.
   - Done when the web page connects, handshakes and shows "connected"; protocol round-trips are tested over the in-memory transport.
3. **LLM seam**
   - `hux-llm` with streaming `Complete` and `list_models` via rig.
   - Model profile and presets.
   - An ignored-by-default integration test against a configurable endpoint (for example the local strata server).
4. **Store + settings + first run**
   - SQLite (sqlx or rusqlite, decided in the slice) with migrations.
   - Typed settings (model endpoint and model, with the key stored separately).
   - Setup screen in the web app: enter URL → list models → pick → save.
5. **Chat tracer bullet**
   - One conversation, persisted.
   - The Chief (system prompt + minimal context envelope: time, timezone, locale) streams answers over the protocol to the web chat view.
   - Survives restart.
6. **Container**
   - Multi-stage Dockerfile (builds web + gateway, small runtime image), data volume, env/CLI config, compose example pointing at an external LLM URL.
   - Done when `docker run` gives the same first-run experience.

## Engineering defaults (proposed)

- Rust: edition 2024, stable toolchain, `tokio`, `axum`, `tracing`, `thiserror` in libraries, `anyhow` only in binaries.
- Web: Vite, React, TypeScript strict, Tailwind, pnpm. In dev, the Vite dev server proxies to the gateway; in release, assets are **embedded into the gateway binary** (single-file deploy), with a `--web-dir` override.
- Gateway binds to `127.0.0.1` by default. Binding to the LAN needs auth, which is a later phase.
- Config precedence: CLI flags > env (`HUX_*`) > defaults; persistent settings live in the store, not in files.
- Tests: TDD at the seams (protocol round-trip, transport conformance suite run against every adapter, llm with a fake endpoint).

## Related decisions

See `docs/adr/`, especially 0001 (Gateway trust boundary), 0002 (rig behind hux-llm), 0003 (shape/encoding/transport layers) and 0004 (models interpret, code validates). Vocabulary: `GLOSSARY.md`.
