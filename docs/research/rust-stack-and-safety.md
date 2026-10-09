# hux: Rust building blocks and agent safety patterns

Researched 2026-10-09. Every claim cites its source inline. **[unverified]** marks statements taken from general knowledge that were not checked against a primary source during this pass.

---

## A. Rust building blocks

### A1. Inference sidecar: the OpenAI-compatible API is the common interface

Every candidate server exposes `/v1/chat/completions` and `/v1/embeddings`, so the gateway can treat the sidecar as a single **OpenAI-compatible** endpoint and swap backends behind it.

| Server | Notes |
|---|---|
| **llama.cpp `llama-server`** | Serves chat completions, responses, embeddings and an Anthropic Messages-compatible route. Tool calling requires `--jinja`. Output can be constrained with a GBNF grammar or a JSON schema (`response_format`). It accepts `--api-key`/`--api-key-file`. Multimodal input is marked experimental. It can load MCP servers over stdio. ([README](https://github.com/ggml-org/llama.cpp/blob/master/tools/server/README.md)) |
| **Ollama** | Provides `/v1/chat/completions`, `/v1/completions`, `/v1/embeddings`, `/v1/models` and a stateless `/v1/responses` (since 0.13.3). Tools work, but `tool_choice` is not supported on chat. JSON mode and `response_format` are supported. **A local server ignores API keys**, so it has no auth. ([docs](https://docs.ollama.com/api/openai-compatibility)) |
| **mistral.rs** | Native Rust. Offers an OpenAI-compatible `/v1` API, an Anthropic `/v1/messages` API, Prometheus metrics, and an **in-process Rust crate (`mistralrs`)**. It has grammar-enforced tool calling, a server-side agent loop, an MCP client, and built-in web search, Python and shell tools (disable these for hux). Backends are CUDA, Metal and CPU. Formats include GGUF, ISQ, GPTQ, AWQ and FP8. ([repo](https://github.com/EricLBuehler/mistral.rs)) |
| **LM Studio** | Provides `/v1/models`, `/v1/responses`, `/v1/chat/completions`, `/v1/embeddings` and `/v1/completions` on port 1234. ([docs](https://lmstudio.ai/docs/developer/openai-compat)) It is a desktop GUI app, and its headless mode was not checked **[unverified]**. |
| **vLLM** | Serves an OpenAI-compatible API with tool calling and structured outputs. It targets GPU servers on Linux ([docs, redirected](https://docs.vllm.ai/en/latest/serving/openai_compatible_server.html)). It suits a container node rather than a laptop **[details unverified]**. |

**Implication:** Ollama and `llama-server` built without `--api-key` are unauthenticated. The sidecar must bind to loopback or a private interface, and only the gateway should reach it. Because the built-in tool features (mistral.rs shell and Python, llama-server `--tools` and MCP) give the model execution power outside gateway policy, they must stay **off**.
### A2. LLM adapter layer: rig (preferred) and alternatives

**Brief comparison**

| Crate | Local models | Stream / tools / structured | Maturity, licence |
|---|---|---|---|
| **`rig`** | Native `ollama` provider. `openai` covers "OpenAI-shaped dialects" | Yes / yes / yes (extractor) | 0.44 (Oct 2026), active, breaking changes promised. MIT |
| `genai` ([repo](https://github.com/jeremychone/rust-genai)) | Native Ollama, plus custom OpenAI endpoints (`GENAI_n_ENDPOINT`) | Yes / yes / partial | 0.6, active. MIT/Apache-2.0 |
| `aisdk` ([repo](https://github.com/lazy-hq/aisdk)) | Not documented **[unverified]** | Yes / `#[tool]` / JSON Schema | 0.5.x, young. Claims Vercel AI SDK UI stream compatibility **[unverified]**. MIT |
| `llm` (graniet) ([repo](https://github.com/graniet/llm)) | Ollama | Yes / yes / some providers | 1.3.x. MIT |
| `async-openai` ([repo](https://github.com/64bit/async-openai)) | Any OpenAI-compatible base URL | SSE / types only / not stated | Spec-exact client. MIT |

**rig in depth**

- **Layout and versions.** rig is three layers:
  - `rig-core` holds the provider-neutral messages, completion, embedding, tool and vector-store contracts, plus the provider mappings.
  - `rig-agent` holds the agent runtime: builder, hooks, tool registry, extraction and the `AgentRun` state machine.
  - The `rig` facade re-exports both.

  Integrations sit behind feature flags: `lancedb`, `sqlite`, `qdrant`, `postgres`, `fastembed`, `bedrock` and others. ([README](https://raw.githubusercontent.com/0xPlaygrounds/rig/main/README.md))

  The README still shows `0.36.0`, while docs.rs has **0.44.0, published 2026-10-07** ([rig-core](https://docs.rs/rig-core/latest/rig_core/), [rig-agent](https://docs.rs/rig-agent/latest/rig_agent/)). The API was restructured in between, so tutorials and blog posts are likely stale. Older names like `CompletionModel` and `ToolDyn` do not appear on the 0.44 index page **[old trait names unverified in 0.44]**.

- **Completion model (0.44).** A provider-agnostic `CompletionRequest` goes to a `driver::Model` (`model.call(request)`), which pairs a provider **wire** with a transport. The wire translates the request into the provider's format and normalises the reply into a `CompletionResponse`. ([completion](https://docs.rs/rig-core/latest/rig_core/completion/index.html)) Provider-specific options go through a `ProviderExtension` trait. Every reply arrives as a `Streamed` stream ([rig-core](https://docs.rs/rig-core/latest/rig_core/)).

- **Embeddings and RAG.** rig provides provider-agnostic embedding abstractions. `VectorStoreIndex` handles insert and similarity search, and a vector index can itself be a `PortableTool` ([rig-core](https://docs.rs/rig-core/latest/rig_core/)). Older rig versions had `dynamic_context` and `dynamic_tools` (RAG-selected tools) on the agent builder. These are not mentioned on the 0.44 rig-agent index **[unverified in 0.44]**.

- **Tools.** There are two tool contracts:
  - `PortableTool` is context-free.
  - `Tool` receives a `ToolContext`.

  `ErasedTool` handles dynamic dispatch, and the `#[rig_tool]` macro generates tools from functions ([rig-core](https://docs.rs/rig-core/latest/rig_core/)).

- **Structured extraction.** The `extractor` module returns typed output through a `submit` output tool, with retries. `run::output` adds structured-output enforcement modes ([rig-agent](https://docs.rs/rig-agent/latest/rig_agent/)).

- **Agent runtime: the key finding for hux.** `AgentRun` is a **sans-I/O, serialisable state machine** ([run module](https://docs.rs/rig-agent/latest/rig_agent/run/index.html)):
  - The driver calls `next_step()` and receives an `AgentRunStep`, for example `CallModel`.
  - The run surfaces tool calls as `PendingToolCall`s, and **the driver executes them, not rig**.
  - State serialises in a versioned envelope (`RUN_FORMAT`) that rejects unknown keys.
  - Host-only `RunEntry` records are persisted but never sent to the provider.

  This is what hux needs. The gateway is the driver, so every tool call passes through hux policy (taint check, tier, approval), and a run can be **persisted while waiting for human approval and resumed later**. The exact pause/resume API is not documented on the index **[unverified]**. `AgentHook`/`HookContext` exist, but whether a hook can veto a tool call was not confirmed **[unverified]**. Prefer driving `AgentRun` directly over hooks.

- **Local models.**
  - Ollama has a first-class `ollama` provider with chat, embedding and model-listing wires.
  - `llamacpp` currently provides only model identifiers.
  - There is no mistral.rs provider. `mistral` refers to Mistral AI.

  ([providers](https://docs.rs/rig-core/latest/rig_core/providers/index.html)) The `openai` module covers both the Chat Completions and Responses wires, and `OpenAIConfig` holds "credentials and overrides" ([openai](https://docs.rs/rig-core/latest/rig_core/providers/openai/index.html)). The base-URL setter for llama-server, vLLM or LM Studio was **not confirmed** and needs a spike.

- **Custom provider (our sidecar).** If the sidecar speaks OpenAI Chat Completions, reuse the `openai` wire with a base-URL override. Otherwise, implement a wire: a request encoder plus a `rig_core::wire::Decoder`, with helpers in `providers::internal`. A `providers::registry` module also exists. Documentation of the full required trait set is thin **[unverified; read `wire` source]**.

- **MCP.** `rig-rmcp` bridges rmcp tools into rig. It is native-only, with no WASM support ([README](https://raw.githubusercontent.com/0xPlaygrounds/rig/main/README.md)).

- **Gaps and risks.**
  - The README promises breaking changes, and there was a large API reshape between 0.36 and 0.44.
  - rig has no notion of taint, capabilities or approval.
  - The bundled tools and agents assume the model's tool calls execute directly.
  - The docs lag behind the code.

**Where hux wraps rig (adapter seams):**

1. **Model seam:** `hux::ModelPort` over `driver::Model`/the provider wires. Routing by sensitivity label (local vs remote) lives *here*, not in rig.
2. **Tool seam:** hux tools are hux types carrying capability metadata. An adapter exposes only their *schemas* to rig, and execution stays in the gateway when it resolves a `PendingToolCall`.
3. **Run/persistence seam:** store the serialised `AgentRun` blob in gateway SQLite, keyed by a hux run id with a hux schema version, so a rig `RUN_FORMAT` bump means a migration, not data loss.
4. **Retrieval seam:** use hux's own SQLite/sqlite-vec store and expose it to rig as a `VectorStoreIndex` implementation, rather than adopting rig's `sqlite` or `lancedb` crates as the system of record.
5. **MCP seam:** node MCP servers connect to the gateway via `rmcp` directly. `rig-rmcp` is used only for schema advertisement, never for execution.

Pin rig to an exact version and keep all `rig::*` imports inside a single `hux-llm` crate.
**MCP:** **`rmcp`** is the official Rust SDK ([repo](https://github.com/modelcontextprotocol/rust-sdk)). It supports client and server, with stdio, child-process, Streamable HTTP (a Tower service) and in-process transports. The legacy HTTP+SSE transport is deliberately absent. Use it so that nodes expose capabilities to the gateway as MCP servers.

### A3. Node to gateway networking

- **iroh:** You dial peers by **public key**, and it finds the fastest path. It tries hole-punching first and falls back to relays (`iroh-relay` is self-hostable). It runs on QUIC with streams and datagrams, and adds iroh-gossip, iroh-blobs and iroh-docs. ([repo](https://github.com/n0-computer/iroh)) **1.0 shipped in June 2026** with a wire-stability commitment and Swift and Kotlin bindings ([TechTimes](https://www.techtimes.com/articles/318490/20260616/peer-peer-library-iroh-10-ships-dial-devices-key-not-ip-address.htm), [rc.1 post](https://iroh.computer/blog/iroh-1-0-0-rc-1)). The primary release post was not read **[date per secondary source]**. It is the best fit: node identity equals an Ed25519 key, so **pairing means exchanging and pinning keys**, for example with a QR code shown by the gateway that holds the gateway's NodeId plus a one-time token. Reachability across the internet comes without port-forwarding.
- **Tailscale-style mesh:** This offers excellent NAT traversal, but it is an external dependency or control plane, and embedding it in Rust is not native (tsnet is Go) **[unverified]**. It is worth supporting as an *optional* transport, not as the identity layer.
- **WebSocket/gRPC (tonic) over mTLS:** This is simple and well-trodden, but it has no NAT traversal and needs a PKI or certificate pinning **[general knowledge]**.
- **NATS:** NATS is a broker, which adds a server and is overkill for a star topology centred on the gateway **[general knowledge]**.

### A4. Cross-platform UI

- **Tauri 2:** Stable since October 2024, with iOS and Android support. The team says it is "not completely happy" with the mobile developer experience. Not all official plugins support mobile, and CI mobile builds are missing in `tauri-action`. Its **capability/permission/scope system** for webview-to-Rust commands fits hux's least-privilege model. ([Tauri 2.0](https://v2.tauri.app/blog/tauri-20/))
- **Dioxus 0.7** (September 2025): Supports iOS and Android with hot-patching. However, **native device APIs (camera, location, filesystem, push) are deferred to 0.8**, and the Blitz native renderer is labelled work in progress. ([release](https://dioxuslabs.com/blog/release-070/))
- **Slint:** Supports Android (Rust only). **iOS is in progress** per the most recent docs found, which date from 2024–25 **[2026 status unverified]**. ([mobile docs](https://snapshots.slint.dev/master/docs/slint/guide/platforms/mobile))
- **egui:** Good for desktop tools and debug UIs. Its mobile story is weak **[unverified]**.

**Pick:** Tauri 2 for desktop, tablet and phone. It embeds the gateway in the desktop app and is the most mature on mobile.

### A5. Storage and vector search

- **SQLite** via `rusqlite` (sync) or `sqlx` (async) is the system of record **[general knowledge]**.
- **sqlite-vec:** Written in C with no dependencies and runs wherever SQLite runs. It has a Rust crate but is **pre-v1** ("expect breaking changes"). ANN index work (DiskANN/IVF) appears in the repo, but its status was not confirmed, so assume brute-force KNN. ([repo](https://github.com/asg017/sqlite-vec)) This is fine for a personal corpus of under about 10^6 vectors.
- **LanceDB:** Has a Rust SDK ([docs](https://lancedb.github.io/lancedb/)). It is embedded and columnar with ANN and hybrid search **[unverified this pass]**. Switch to it if the corpus outgrows sqlite-vec.

### A6. Scheduling and durable workflows

- **Restate:** A durable-execution server (a single Rust binary) with a Rust SDK. It provides journaled steps, **durable timers** and awakeables for waiting on external events, such as human approval. ([docs.rs](https://docs.rs/restate-sdk), [search summary](https://docs.restate.dev/use-cases/workflows.md)) It adds a second process.
- **apalis + apalis-cron:** Tower-based background jobs with persisted cron. It has a SQLite backend. Its cron syntax is 7-field with seconds first, and it is approaching 1.0-rc. ([lib.rs](https://lib.rs/crates/apalis))
- **durare:** A DBOS-style durable execution library that runs in-process on SQLite or Postgres and supports cron ([docs.rs](https://docs.rs/crate/durare/0.3.2)). It is young **[maturity unverified]**.

**Pick:** For "send Monday morning" plus pending approvals, a small hand-rolled `scheduled_actions` table in the gateway's SQLite may suffice. The table records due time, state, plan hash and approval state, and is polled by a tokio task. Evaluate apalis or durare before building more.

---

## B. Agent safety and privacy patterns

### B1. Threat model: the lethal trifecta
An agent that combines (1) **private data**, (2) **untrusted content** and (3) **external communication** can be made to exfiltrate data. The only reliable defence is to avoid the combination, not to rely on prompts or guardrail products. Once untrusted content has been processed, it must not be able to trigger consequential actions. ([Willison](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)) hux has all three by design (email, banking, browsing), so containment must be **architectural**.

### B2. Dual-LLM pattern
A **Privileged LLM** sees only trusted input (the user) and calls tools. A **Quarantined LLM** processes untrusted text and has no tools. A non-LLM **Controller** holds untrusted results as opaque variables (`$VAR1`). The privileged LLM manipulates the references only, and the controller renders their contents to the user. Willison calls the UX "pretty bad", and a later paper found a flaw in the design. ([Willison 2023](https://simonwillison.net/2023/Apr/25/dual-llm-pattern/))

### B3. CaMeL (Google DeepMind, arXiv 2503.18813)
([abstract](https://arxiv.org/abs/2503.18813), [full text](https://arxiv.org/html/2503.18813))

How it works:
- **Plan from trusted input only:** A P-LLM turns *only the user query* into code in a restricted Python subset.
- **Parse untrusted data:** A tool-less Q-LLM parses untrusted data into P-LLM-specified schemas. It can only return a boolean "insufficient info" signal, never free text.
- **Track data flow:** A custom interpreter records a dependency graph for every value.
- **Label values:** Each value carries **capabilities**: provenance (user, tool X) and allowed readers.
- **Check before acting:** **Security policies**, plain functions over a tool call and its argument capabilities, return Allow or Deny before each tool runs. A Deny escalates to user confirmation.

Results:
- **Security vs. utility:** 77% of AgentDojo tasks solved with provable security, against 84% undefended.
- **Cost:** About 2.7–2.8x tokens.

Limitations:
- Approval fatigue.
- Side channels (exceptions, timing, tool-call patterns). STRICT mode helps.
- It cannot handle tasks where *data dictates the action*, such as "do what this email says".
- Text-only phishing is out of scope.

**Relevance:** hux's gateway is the natural "interpreter". This is the strongest primary-source design to copy, and it can be simplified: typed plans instead of Python.

### B4. Patterns to adopt (synthesis; hux-specific design proposals, not from a single source)
1. **Taint and capability labels on every value in the gateway.** Labels cover source (user, email, web, bank, node) and sensitivity (public, personal, financial, secret). Tool policies check labels on arguments, following CaMeL.
2. **Tiered actions.** Tier 0 is read-only local, Tier 1 is reversible, Tier 2 is external communication or money, Tier 3 is never automated. Any Tier ≥2 call whose arguments are tainted by untrusted input requires **human approval on a paired device**. The approval shows the *rendered, final* payload (recipient, body, amount) and binds to its hash. This is the CaMeL "deny, then confirm" flow.
3. **Secrets never enter model context.** Tools reference secrets by handle (`secret://bank/api`). The gateway resolves and injects them at egress, for example as HTTP auth headers, and scrubs responses before they are fed back. This is consistent with CaMeL's "readers" capability, applied to secrets with readers set to {gateway}.
4. **Egress control.** Only the gateway talks to the internet, via a per-tool domain allowlist. Nodes and the sidecar have no egress, and the sidecar binds to loopback (see A1). This removes the trifecta's third leg for everything but explicitly approved tools.
5. **Sensitivity-based model routing.** Values labelled financial, personal or secret may only flow to the **local** model. Remote models get public or redacted data, and the router refuses rather than downgrading silently.
6. **No tool features inside the inference server.** Disable mistral.rs and llama-server built-in tools and MCP so that all tool calls go through gateway policy.

**Open questions [unverified / not researched]:** quantified prompt-injection robustness of current small local models, and whether any Rust crate implements CaMeL-style taint tracking (none found).
