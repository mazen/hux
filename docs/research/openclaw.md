# OpenClaw (formerly Clawdbot / Moltbot): research notes for hux

Researched 2026-10-09, mostly from official docs (docs.openclaw.ai) and the repo README. **[unverified]** marks claims that rest on secondary sources or that I could not confirm.

## Identity and stack
- An open-source personal assistant that you run yourself. It began as "Warelay", a WhatsApp gateway, and was then named Clawdbot. In January 2026 it was renamed Moltbot after Anthropic raised a trademark concern, and on about Jan 27–30, 2026 it became OpenClaw. The docs give both dates. (https://docs.openclaw.ai/start/lore)
- Written in TypeScript as a pnpm monorepo with vitest, running on Node 24+/26. It has native companion apps for macOS, iOS, Android, Windows and Linux, plus Docker, Fly and Render deploy files. A Rust crates directory also exists, but I did not check what it contains. (https://github.com/openclaw/openclaw)
- Installed with a curl or PowerShell script or through npm, then `openclaw onboard --install-daemon`. The onboarding wizard checks model access, creates the workspace and installs the Gateway daemon. (https://github.com/openclaw/openclaw)

## Architecture
- **One long-lived Gateway per host.** It owns every channel connection (WhatsApp, Telegram, Slack, Discord, Signal, iMessage, Teams and 20+ more), the sessions, tools, the scheduler and the canvas host. (https://docs.openclaw.ai/concepts/architecture, README)
- **Transport:** a typed WebSocket API using JSON text frames, on `127.0.0.1:18789` by default. The first frame must be `connect`. Frames are `req`/`res`/`event`. Side-effecting methods (`send`, `agent`) require idempotency keys, and the server keeps a dedupe cache. Events are **not replayed**, so a client must refresh after a gap. The schema is defined in TypeBox, JSON Schema is generated from it, and Swift models are generated from that. The same HTTP port serves the canvas and A2UI assets. (https://docs.openclaw.ai/concepts/architecture)
- **Roles:** *operators* (CLI, macOS app, web Control UI, automations) and *nodes* (`role: "node"`) share the same socket. When a node connects it declares its caps, commands and permissions. (https://docs.openclaw.ai/concepts/architecture)
- **Pairing:** each client has a device identity and signs a `connect.challenge` nonce. The v3 signature payload also binds platform and deviceFamily. A new device needs approval, after which it gets a device token. Paired metadata is pinned, so a change forces a re-pair. Loopback connections can be auto-approved, while LAN, tailnet and remote connections always need explicit approval. For remote access the docs recommend Tailscale, a VPN or an SSH tunnel, with optional TLS and pinning. (https://docs.openclaw.ai/concepts/architecture)
- **Nodes are peripherals, not gateways.** Channel messages arrive only at the Gateway. A node exposes commands through `node.invoke`: `camera.*`, `screen.record`, `location.get`, notifications, `system.run`, computer use (gated), talk/voice wake and media. Nodes can also host MCP servers, skills and **local model inference**, and can run worker sessions in containers. Each platform has a default command allowlist, and dangerous commands need opt-in in `gateway.nodes`. The Apple Watch uses signed HTTPS polling because watchOS restricts sockets. (https://docs.openclaw.ai/nodes)
- **Presence** decides which Mac counts as "active" and where node alerts go. (https://docs.openclaw.ai/nodes) I found no documentation of a general routing policy for picking a node by capability or proximity. **[unverified]**
- **Canvas / generative UI:** the agent calls `show_widget` with HTML `widget_code` and a target of `node_panel`. The Gateway hosts the document, picks a connected macOS node that declares `canvas.present` and navigates its panel to it. **If no eligible node exists, the widget falls back to inline chat.** Panel widgets are render-only, and interactive A2UI widgets render on web session dashboards. (https://docs.openclaw.ai/platforms/mac/canvas)
- **Voice:** speech-to-text uses the platform engine (Apple Speech "may use network services") or a realtime cloud provider. Text-to-speech uses ElevenLabs (cloud), MLX (local on macOS) or the system voice. Barge-in is on by default, with a 700–900 ms silence timeout. (https://docs.openclaw.ai/nodes/talk)

## Sessions, memory, scheduling
- **Sessions:** by default every DM shares one "main" session (`dmScope: main`). Optional scopes are `per-peer`, `per-channel-peer` and `per-account-channel-peer`. Groups are isolated per group. Cron and webhook runs get fresh sessions. `identityLinks` merges one person's identities across channels. Several UIs can attach to the same Gateway-owned session. Sessions are stored in per-agent SQLite, and reset policies are none, daily, idle or manual. (https://docs.openclaw.ai/concepts/session)
- **Memory** is plain Markdown in the workspace: `MEMORY.md` holds curated facts loaded every session, `memory/YYYY-MM-DD.md` holds daily notes that are searched but not loaded, plus `USER.md` and `DREAMS.md`. Search is hybrid (vector plus keyword) on SQLite. Embeddings **default to OpenAI** but can use local GGUF, Ollama or LM Studio. Before compaction, a hidden "memory flush" turn runs, and that turn can use a local model. A background "dreaming" job promotes recall items into `MEMORY.md`. (https://docs.openclaw.ai/concepts/memory)
- **Scheduling:** a single GatewayScheduler handles automations and cron (`openclaw automations create`, `openclaw cron`), a periodic "heartbeat" turn in the main session, and `POST /hooks/wake`. Results can be delivered to a channel, to a webhook or nowhere. (https://docs.openclaw.ai/automation/cron-jobs, https://docs.openclaw.ai/concepts/architecture)

## Models and extensibility
- Models are referenced as `provider/model` and set up in the Control UI or under `models.providers`. Failover chains are supported. Local runtimes include llama.cpp, Ollama, LM Studio, vLLM and SGLang, plus LiteLLM. The docs do not state a local-first preference. (https://docs.openclaw.ai/concepts/model-providers) Model backends and agent harnesses (Claude, Codex, local) are plugins. (README)
- **Skills** are `SKILL.md` files (YAML frontmatter plus a Markdown body) loaded from seven precedence tiers. They are gated at load time on binaries, env vars, config and OS. They are distributed through the **ClawHub** registry (`openclaw skills install/verify`). A skill does *not* grant tool access: **plugins** (`openclaw.plugin.json`) own tools, credentials and authorization. (https://docs.openclaw.ai/tools/skills)

## Security and privacy
- **Stated model:** one trust boundary per gateway, explicitly "not a hostile multi-tenant security boundary". Inbound messages are untrusted. Unknown DM senders get a pairing code, and groups are allowlisted and only respond when mentioned. Tools run **on the host unless you configure sandboxing**, and running without a sandbox counts as full access. Message-tool access lets an agent send across providers unless that is restricted. Prompt-injection handling relies on model choice and wrapping external content, with no claim that injection is prevented. `openclaw security audit` checks for config drift. (https://docs.openclaw.ai/gateway/security, README)
- **Exec approvals:** `security` is deny, allowlist or full. `ask` is off, on-miss or always. `askFallback` defaults to **deny** when no UI is reachable. Approval prompts appear on the macOS app, the Control UI and approval-capable clients, and **never in chat channels for automations**. Allowlists are per-agent globs on the resolved binary, and an optional argPattern constrains arguments. Every segment of a chained command must match. The approvals file can only tighten config, never loosen it. (https://docs.openclaw.ai/tools/exec-approvals)
- **Secrets** are covered by a credential storage map and secret scanning. Skill secrets reach only the host process and never the sandbox. (https://docs.openclaw.ai/gateway/security, /tools/skills) I did not check whether secrets are encrypted at rest. **[unverified]**
- **Incidents:**
  - **CVE-2026-25253 / GHSA-g8p2-7wf7-98mq:** "1-Click RCE via Authentication Token Exfiltration From gatewayUrl", rated High, published Feb 2, 2026. Because the victim's browser opens the connection, even a gateway bound to localhost could be hijacked. (https://github.com/advisories/GHSA-g8p2-7wf7-98mq) Secondary sources give different CVSS scores and fix versions. **[unverified]**
  - **"ClawHavoc" malicious-skill campaign on ClawHub, Jan–Feb 2026:** about 341 of 2,857 skills used ClickFix-style instructions to install the AMOS stealer. A registry RPC endpoint without authentication allowed download counts to be gamed. VirusTotal scanning was added in response. (https://www.bitdoze.com/openclaw-security-guide/, https://blog.rankiteo.com/ope1774434339-openclaw-vulnerability-march-2026/) **[secondary sources]**
  - Early versions bound to `0.0.0.0` with optional no-auth, and Shodan reportedly found 40k–135k exposed instances. (https://blog.barrack.ai/openclaw-security-vulnerabilities-2026/) **[secondary sources, numbers inconsistent]**
  - One blog reports "60+ CVEs/GHSAs" by April 2026. (bitdoze) **[unverified]**

## UX
- Lay users struggle with the terminal, Node, Docker, firewalls, API keys, connecting channels (QR codes, bot tokens), updates that break overnight, and **runaway token cost**. Agentic turns resend the whole transcript, and individual reports describe 400–500k tokens for a single task and a $400 loop. (https://uzyn.com/2026/who-is-openclaw-for/, https://www.socallinuxexpo.org/scale/23x/presentations/openclaw-non-engineers-survival-guide) **[anecdotal]** A cottage industry of managed hosting has grown up around this. (https://clawdhost.net/blog/is-openclaw-free-pricing-explained/)

## Takeaways for hux

**Copy:**
- The single-gateway, nodes-as-peripherals topology, in which nodes declare caps, commands and permissions at connect time.
- A typed WS protocol generated from one schema, with idempotency keys on side effects.
- Device-key challenge pairing, where only loopback is auto-approved and metadata is pinned.
- A canvas fallback to inline chat when no capable surface exists.
- Approval policy that can only be tightened, with fail-closed `askFallback` and approvals never routed through untrusted channels.
- Markdown memory the user can inspect, plus a pre-compaction memory flush on a local model.
- Separating skills (instructions) from plugins (authority).
- A built-in `security audit` command.

**Avoid or improve:**
- **Events are not replayed.** Add sequence numbers with resume, because tablets and phones will drop connections.
- **Host execution is the default.** Make the sandbox the default.
- **Cloud defaults for embeddings and STT/TTS.** Make local the default to match the privacy-first goal.
- **Open skill marketplace without vetting.** Require signing, review and least-privilege capability manifests.
- **Browser-reachable localhost WebSocket.** Do strict Origin checks and never take the gateway URL from untrusted input.
- **No node routing policy beyond presence.** hux needs explicit capability- and presence-based output routing across 3 monitors, tablet and voice.
- **Cross-provider send enabled by default.**
- **Opaque token spend.** Add budgets, loop guards and cost display.
- **Terminal-first onboarding.**
