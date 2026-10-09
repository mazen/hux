# Extensibility and plugin architecture for hux

Research date: 2026-10-09. Scope: how a Rust gateway-and-nodes assistant can be open to third-party extension. Claims carry their source inline. **[unverified]** marks claims I could not confirm from a primary source.

## 1. Mechanisms

### WebAssembly Component Model (WIT + Wasmtime + WASI)
- **Status.** WASI 0.3.0 was released on 2026-06-11. It moves async into the Component Model as `async func`, `stream<T>` and `future<T>`, and removes `wasi:io` pollables. The HTTP interfaces are unified and a `service` world is added. Wasmtime 46+ enables 0.3 by default, and 43–45 need flags (https://wasi.dev/releases/wasi-p3). Wasmtime is at v49.0.2 (2026-10-02), and in 49.0.0 the `wasmtime-wasi-http` `p3` feature is on by default (https://github.com/bytecodealliance/wasmtime/releases). Native async matters to hux because tools are I/O-bound: HTTP calls to banks, mail and lottery APIs.
- **Sandbox.** Memory accesses are bounds-checked, control flow only reaches type-checked targets, and all outside interaction goes through explicit imports and exports. Wasmtime adds guard regions and zeroes memory. WASI filesystem access is capability-based: a guest only sees directories it was given (https://docs.wasmtime.dev/security.html). Embedders can also cap CPU with fuel or epoch interruption **[unverified here; not on the page above]**.
- **Granting capabilities per plugin.** The host chooses which WIT imports to link. Any interface it does not link, such as sockets or the filesystem, does not exist for that plugin. For hux, the gateway should **not** link raw `wasi:sockets`. It should provide its own `hux:http/outgoing` (or wrap `wasi:http`) that checks a per-plugin host allowlist, and a `hux:secrets` interface that returns handles or injects credentials on the host side. Plugins would then never hold raw secrets. This is a design proposal, but it matches how Spin and Extism work (below).
- **Plugin author languages.** The documented toolchains cover Rust, C/C++ (wit-bindgen), JavaScript (jco), Python (componentize-py), Go, C# and MoonBit (https://component-model.bytecodealliance.org/language-support.html). Rust and JS are the most mature. Python and Go output is large and slower to start **[unverified, general community knowledge]**.

### Frameworks on top of Wasm
- **Extism** works with plain Wasm modules rather than components and has its own PDKs. Host functions let the plugin call back into the host (https://extism.org/docs/concepts/host-functions). Its manifest includes `allowed_hosts` (an empty list blocks all, `null` allows all), `allowed_paths`, memory caps (`max_pages`, `max_http_response_bytes`) and a SHA-256 `hash` per module (https://extism.org/docs/concepts/manifest). It is simple, but it is a parallel ecosystem to WIT, and its interfaces are untyped byte-in/byte-out unless you add your own layer.
- **Spin** denies capabilities by default for each component: `allowed_outbound_hosts`, a `files` list, and named `key_value_stores`. Dependencies only inherit access if `dependencies_inherit_configuration = true`, which the docs warn against (https://spinframework.dev/v3/writing-apps). It is a good reference model for the hux manifest. As an app server it is the wrong shape to embed.
- **wasmCloud** has components, plus "providers" (long-running host plugins) linked through WIT interfaces over a NATS lattice (https://wasmcloud.com/docs/concepts/, a v1 page). v2 reportedly moved orchestration to Kubernetes APIs **[secondary source only]** (https://www.efficientlyconnected.com/?p=5196). Its idea of separating stateless components from capability providers is worth copying. The platform itself is too heavy for hux.
- **Zed** is the closest analogue. Extensions are Rust compiled to `wasm32-wasip2` against `zed_extension_api`, with an `extension.toml` manifest (https://zed.dev/docs/extensions/developing-extensions). Users scope host capabilities (`process:exec`, `download_file`, `npm:install`) per command, host or package through `granted_extension_capabilities` (https://zed.dev/docs/extensions/capabilities). Publishing goes through a PR to the `zed-industries/extensions` registry repo **[unverified]**.

### MCP (Model Context Protocol)
- **Current spec 2026-07-28.** MCP is now **stateless**. The `initialize` handshake and `Mcp-Session-Id` are gone, there is a new `server/discover`, and the multi-round-trip `input_required` pattern replaces server-initiated sampling and elicitation. Tasks moved to an official extension. Roots, Sampling and Logging are deprecated, and Dynamic Client Registration is deprecated in favour of Client ID Metadata Documents (https://modelcontextprotocol.io/specification/2026-07-28/changelog).
- **rmcp**, the official Rust SDK, implements 2026-07-28 and stays compatible with 2025-11-25. It supports client and server, stdio, child-process and Streamable HTTP transports, OAuth, and the `#[tool]` / `#[tool_router]` macros (https://github.com/modelcontextprotocol/rust-sdk).
- **Security.** The spec's best-practices page covers confused deputy, token passthrough ("MUST NOT accept any tokens that were not explicitly issued for the MCP server"), SSRF during OAuth discovery, state-handle hijacking and local server compromise. For local servers, clients MUST show the exact command and get consent, and SHOULD sandbox the server with minimal filesystem and network access. The page also covers authorization URL scheme validation and scope minimization with step-up (https://modelcontextprotocol.io/specification/draft/basic/security_best_practices). On top of that, **tool poisoning** (hidden instructions in tool descriptions), **rug pulls** (descriptions that change after approval) and **shadowing** (one server's description hijacking another server's tool) are possible. The proposed mitigations are showing full descriptions, hash-pinning tool definitions, and cross-server data-flow boundaries (https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks).
- **Implication.** MCP is an interop protocol, not a sandbox. A stdio MCP server is an arbitrary native process with the user's privileges.

### Out-of-process RPC plugins (go-plugin style)
HashiCorp go-plugin runs each plugin as a subprocess over net/rpc or gRPC. A plugin crash does not take down the host. A protocol version gives readable incompatibility errors, and the transport supports TLS and checksum verification. Any gRPC language can write plugins. HashiCorp rejected in-process loading on security grounds (https://github.com/hashicorp/go-plugin). For hux, the **node protocol already is this pattern**: a node is an out-of-process peer of the gateway, and a "plugin node" or sidecar can use the same transport.

### In-process native (trait objects, `libloading`, `abi_stable`)
Rust has no stable ABI. `abi_stable` works around this with `StableAbi` layout checks done at load time and FFI-safe trait objects, but it has **no unloading** and opaque types can only be unwrapped in the crate that created them (https://docs.rs/abi_stable/latest/abi_stable/). Native code also gets full process privileges. OpenClaw's own docs say "a malicious native plugin is equivalent to arbitrary code execution inside the OpenClaw process" (https://docs.openclaw.ai/plugins/architecture.md). Use it only for first-party code compiled into the binary (Cargo features or crates), not for third-party distribution.

## 2. How comparable projects do it
| Project | Mechanism | Isolation | Notes |
|---|---|---|---|
| OpenClaw | In-process TS plugins registering *capabilities* (providers, channels, speech, web search, memory in an exclusive slot), `openclaw.plugin.json` | None; `plugins.allow` does not verify provenance | Manifest is validated without running code (https://docs.openclaw.ai/plugins/architecture.md) |
| Hermes Agent | In-process Python `register(ctx)` plugins (tools, 27 hooks, providers, platforms, memory providers with one active), `plugin.yaml` with `requires_env` and capabilities | Optional `plugins.isolation: host` process; static scan blocks "dangerous" installs; MCP access and message injection off by default per plugin; commit-SHA pinning (https://hermes-agent.nousresearch.com/docs/user-guide/features/plugins) | Skills follow the SKILL.md / agentskills.io format with progressive disclosure, and the hub has trust tiers (https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) |
| Zed | Wasm components (wasip2) | Wasm sandbox plus user-scoped capabilities | See above |
| VS Code | Separate extension-host processes (local Node, web worker, remote), lazy activation events (https://code.visualstudio.com/api/advanced-topics/extension-host) | Separate process protects UI responsiveness, but there is no permission sandbox **[page does not claim one]** | `extensionKind` decides placement (UI or workspace). This is analogous to deciding whether a hux plugin runs on the gateway or on a node |
| Home Assistant | In-process Python integrations, `manifest.json` (domain, requirements, dependencies, `iot_class`, `config_flow`, `quality_scale`) (https://developers.home-assistant.io/docs/creating_integration_manifest) | None **[custom integrations or HACS run in-process; not stated on that page]** | `config_flow` UI-driven setup and the quality scale are good ideas to borrow |

The pattern is that the assistant projects (OpenClaw, Hermes, HA) chose in-process dynamic-language plugins for velocity and are now adding scanning and allowlists after the fact. Zed is the only one with a real sandbox, and it got there by choosing Wasm from day one.

## 3. Manifest, permissions, distribution (recommended model)
- **Declarative manifest** (`hux-plugin.toml`): id, version, the extension points it implements (WIT world), and the capabilities it requests. Examples: `net = ["api.lotto.de:443"]`, `secrets = ["imap.password"]`, `kv = ["own"]`, `memory.read = ["contacts"]`, `ui = ["card"]`, `nodes = ["wall-tablet"]`. Validate it without running code, as OpenClaw does.
- **Deny by default.** Grants are scoped like Spin's and Zed's, and the user can narrow them after install (Zed's `granted_extension_capabilities`).
- **Consent at install and on capability change.** This is the defence against rug pulls. Hash-pin the artifact (Extism `hash`, Hermes commit SHA) and, for MCP, hash-pin tool descriptions and require re-approval when they change.
- **Risk tiers per tool** (read-only vs side-effecting vs money-moving). Human confirmation for side-effecting tools is enforced by the gateway, not by the plugin.
- **Signing and registry.** Sign artifacts (Sigstore/cosign or minisign, **[not researched in depth]**), use an OCI registry or git-index registry like Zed's, add trust tiers like Hermes (builtin, official, trusted, community), and run a static or LLM scan at install as advisory defence in depth.

## 4. Recommendation for hux

| Extension point | Who extends | Mechanism |
|---|---|---|
| **Tools / skills** (lottery, banking, mail, HA) | Third parties | **Wasm components (WIT world `hux:tool`) in Wasmtime on the gateway**, with egress, secrets and KV only through gateway-mediated host interfaces. This is the default and recommended path |
| **Third-party tool servers** | Anyone, any language | **MCP client via rmcp**, with the server treated as untrusted. Remote servers use Streamable HTTP plus OAuth. Local stdio servers run only in a sandbox or container with explicit consent showing the full command. Tool descriptions are pinned and sanitised, and tool outputs are tagged as untrusted data. Optionally the gateway also exposes hux as an MCP server |
| **Skills as instructions** | Users, community | SKILL.md / agentskills.io-compatible documents (no code), loaded with progressive disclosure, as in Hermes |
| **Channels / inputs** (Telegram, Signal, voice) and **outputs / renderers** | Third parties | **Out-of-process "connector nodes"** that speak the normal hux node protocol (gRPC or similar) with an identity and grants. Channels are long-running, stateful and network-heavy, which fits a process or container better than a tool-call Wasm guest. Simple, stateless transforms can still be Wasm. Note that WASI 0.3 async narrows this gap |
| **Model providers** | Mostly first party | **Native Rust trait (adapter over `rig`)**, compiled in. Third-party providers come in through OpenAI-compatible HTTP endpoints or the local sidecar, not through loading code |
| **Memory / storage backends** | First party | **Native traits** behind Cargo features, with one exclusive slot (as OpenClaw and Hermes do) |
| **Node types** | Third parties | **Protocol, not plugin.** Publish the node protocol and capability descriptors (modalities, I/O) so anyone can write a node in any language |
| **Policy, secrets, egress, audit** | Core only | Never pluggable. This is the trusted computing base every other extension point is mediated by |

Day-one priorities:
1. Define the WIT packages (`hux:tool`, `hux:http`, `hux:secrets`, `hux:kv`, `hux:ui-card`) and the manifest and capability schema.
2. Build the MCP client with pinning and consent.
3. Publish the node protocol.

Leave out native dynamic loading (`abi_stable`, `libloading`) entirely.
