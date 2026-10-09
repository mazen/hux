# hux — Architecture Overview (draft v0)

Status: **proposal for discussion**. High level only. Sources: `docs/research/*.md`.

## 1. Goals and non-goals

**Goals**
- One assistant, many devices. Every device is a window onto the same assistant, memory and conversation.
- Privacy first: local models by default, remote only by policy, and the gateway is the only internet egress.
- Good UX for laypeople: no terminal, QR pairing, visible and editable memory, plain-language permissions.
- Extensible from day one, with each extension point getting the mechanism that fits its trust level.
- Rust throughout; `rig` behind a hux-owned LLM seam.

**Non-goals (for now)**
- Multi-tenant hosting. One gateway is one **household** (several people) and one trust boundary.
- Requiring the user to run other platforms first. hux must work on its own; Home Assistant, zigbee2mqtt and similar are optional integrations, never prerequisites.
- Building every use case. We build the *system*; use cases come as roles, plugins and skills.

## 1a. Setup and self-configuration (UX north star)

**The user starts the gateway, enters LLM details, and does everything else by talking to it.**

1. Start the gateway (installer, container, or the desktop app). It opens the **web interface**.
2. First-run screen, one step: pick or enter an LLM. The gateway auto-detects local Ollama, LM Studio or llama.cpp on the machine and LAN; otherwise the user enters an endpoint and key. Nothing else is asked up front.
3. From then on, configuration is conversational: "add my desktop" shows a pairing QR or code; "set up my lights" discovers devices on the network and walks through pairing; "remind me about recipes when I'm at the store" creates a schedule and asks for the permission it needs.

What makes this work:
- **Settings are typed and schema-described.** Each subsystem and plugin registers a settings schema. The agent changes settings only through a `config` tool against those schemas, never by editing files.
- **Config changes go through policy** like any other action. They are low-risk ones applied directly and shown as an undoable change, while security-relevant ones (new device, new plugin, egress or permission grants, model changes) need an approval that shows a diff.
- **Settings are versioned**: history, diff, one-click undo.
- **The web interface is a Surface like any other** (§6): mostly empty space plus an input, where hux places what the Member asks for, including pending approvals. Only two screens are predesigned: **Schedule** (reminders, calendar, routines) and **Settings** (every setting, roles, memory, devices, plugins, the activity log). Both open by asking or from one small control.
- The agent explains itself: every automatic change carries a "why" and a link to it in the activity log.

## 1b. Desktop experience

- The desktop app is a **tray-resident node**, not a big window. A global shortcut opens a quick-input bar (Spotlight-style); push-to-talk or a wake word starts voice.
- **Each monitor is its own Surface.** Answers appear as widgets on it: a weather card, a recipe on the second monitor, a draft email to edit. hux places them where the Member asks (§6), and the Member can also move, resize, keep or close them by hand.
- Voice and visuals work together: you speak, the agent answers by voice **and** shows things ("What's the weather?" gives a spoken summary plus a card).
- Built with Tauri 2 (tray, global shortcuts, multi-window) and the same web renderer as the gateway's web interface.
- **First launch is discovery-first.** The desktop app (like any node) looks for gateways on the LAN via mDNS/DNS-SD (`_hux._udp`, advertising the gateway name, key fingerprint and protocol version):
  - **Found one** → "Join *Smith Household*?" leads to a pairing request. The user approves it in the gateway's web interface or on an already-paired device. Both sides show the same short code (derived from both keys) to rule out a spoofed gateway. mDNS is unauthenticated; trust comes from the keys, never from discovery.
  - **Found several** → pick one from a list.
  - **Found none** → "Start a new assistant on this computer" (the bundled gateway, below), or enter an address or scan a code manually for gateways outside the LAN.
  - The very first node of a fresh gateway pairs without approval, since it is the owner bootstrap. That only works on loopback or via the one-time setup code shown at gateway start.
- **All-in-one bundle**: for single-machine use the desktop installer ships the gateway too. It is the same gateway binary, launched and supervised by the tray app as a separate background process (or OS service), and the desktop node pairs with it automatically over loopback. Keeping it a separate process preserves the trust boundary (secrets and policy are not in the UI process) and lets the gateway keep running when windows close.
- **Upgrade path**: "move my assistant to the NAS" exports the gateway state (database, vault, settings) to a headless gateway. The desktop then switches to being a plain node, and other devices re-pair automatically.

## 1c. Portability principles (long horizon)

hux may one day be built into an OS, be its own OS, or run in a car. Nothing in the core may assume "a PC with a desktop".

- **Library first, binaries second.** The gateway and the node runtime are crates with thin binaries on top. Another host (an OS shell, an in-car system, an appliance) embeds them. Bindings via UniFFI (Kotlin/Swift) and a C ABI for anything else.
- **Protocol first.** Every boundary (node ↔ gateway, gateway ↔ sidecar, gateway ↔ driver, UI schema) is a published, versioned protocol, so any component can be reimplemented on any platform without our code.
- **Platform services behind traits**: storage, key storage (OS keychain, TPM, Secure Enclave, automotive HSM), clock and timers, networking and discovery, audio I/O, display surfaces, power state. Desktop OS implementations are only the first.
- **Resource profiles.** Components declare what they need (a GPU model vs a tiny CPU classifier, persistent disk vs RAM-only), and the system degrades gracefully on constrained hardware.
- **Offline-first and federation-ready.** A device such as a car may be its own small gateway that works disconnected and syncs with the home gateway when it can reach it. Not built in v1, but the data model must allow it: stable IDs, a change log, no assumption that exactly one gateway exists.
- **Portable targets** from day one in CI: Linux x86_64/aarch64 (incl. musl), Windows, macOS; Android/iOS for the node runtime later.

## 1d. Language-handling principle: models interpret, code validates

- **User input is never parsed by our code.** No regexes, keyword lists, command prefixes or heuristics on what people type or say. Every interpretation (intent, entities, times, "this app", injection suspicion) is done by a model: System 1 / `Decide` / `Guard` for fast cases, roles for the rest.
- **Model output is never repaired by our code.** We don't strip, re-format or guess at malformed output. LLM quirks (tool-call formats, streaming, reasoning blocks, provider differences) are the SDK's job (`rig` behind `hux-llm`).
- **Code only validates typed boundaries.** Tool arguments and structured outputs are checked against schemas and policy. Failures go back to the model as errors to fix, or to the user, and are never silently patched.
- This keeps behaviour language-agnostic (any language, voice transcripts, typos) and keeps all "understanding" swappable by changing models.

## 2. Topology

```
                         ┌──────────────── Gateway (headless or in desktop app) ────────────────┐
  Nodes                  │                                                                      │   Internet
  ─────                  │  Node hub ── Session/Conversation ── Orchestrator (Chief + Roles)    │   ────────
  Desktop (3 screens) ◄──┤      │              │                      │                         │
  Wall tablet        ◄──┤  Presence &      Memory store          Policy engine ── Approvals      ├─► Egress proxy
  Phone              ◄──┤  Output router   (SQLite+vec)          (labels, tiers, budgets)        │   (allowlists,
  Voice puck         ◄──┤      │              │                      │                         │    secret injection)
  Container/CLI      ◄──┤  UI compiler     Scheduler             Plugin host (Wasm) / MCP client │
  Connector (Signal) ◄──┤  (tree→surface)  (durable jobs)        Secrets vault · Audit log       │
                         └───────┬───────────────────────────────────────────┬──────────────────┘
                                 │ OpenAI-compatible / hux model API         │ MCP
                          Model sidecar(s): LLM, embed, STT/TTS, decide       Device drivers (Matter, Zigbee, MQTT, HA…), MCP servers
                          (local machine, GPU box, or remote provider)
```

- **Gateway**: the single brain and trust boundary. It owns storage, settings, secrets, the scheduler, policy and audit, and is the only process that talks to the internet. Where it runs is the user's choice, and both options are first-class: headless (NAS, mini PC, container) or embedded in the desktop app, which onboarding asks about. It also serves the **web surface**. The desktop app is always a client of a gateway, never the agent itself (the pattern Hermes uses).
- **Node**: any device running the hux node runtime. On connect it declares a **capability profile**. Nodes hold no long-term state and no secrets beyond their device key.
- **Connector**: a node without hardware that bridges an external channel (Signal, Telegram, email-in, Alexa skill). It uses the same protocol and the same isolation as a node.
- **Nodes can host model endpoints.** A model server bound to a node's loopback interface (for example llama.cpp on `127.0.0.1:8080`) is advertised in the node's capability profile, and the gateway reaches it **through the node's existing authenticated tunnel**. The model server never has to listen on the LAN, and its lack of auth stays harmless. The node forwards only to endpoints it has explicitly registered; it is not a general proxy. Endpoints report their limits (context size, modalities, parallel slots), and the gateway queues calls per endpoint, so a one-slot local server isn't overrun. When the hosting node goes to sleep, the endpoint goes offline and roles fall back to their next model.
- **Sidecar**: a model server (LLM, embeddings, STT/TTS, decision model), reached over OpenAI-compatible HTTP plus small hux-specific endpoints. It can run anywhere. Built-in sidecar tools are disabled, so every tool goes through the gateway.

## 3. Core concepts (seed for GLOSSARY.md)

| Term | Meaning |
|---|---|
| Capability profile | What a node can take in and put out: modalities (text/voice/visual), surfaces (count, size class, touch), audio in/out, sensors, location, notification channel. |
| Member | A person in the household, with their own identity, profile memory, private items, roles and approvals. Some items and roles are shared, others private. |
| Surface | One renderable output target on a node (a monitor, browser tab, phone screen, speaker). A node has 0..n. |
| Widget | A generated UI tree placed on a surface. **Kept** widgets stay until removed; **passing** ones go away. |
| Scene | A named arrangement of a whole surface ("Cooking"), switched by asking, by hand, or by time or place. |
| Presence | Gateway's belief of where the user is and which surfaces they can perceive, with confidence. |
| Conversation | The single, cross-device dialogue with the assistant. It can be continued from any node. |
| Role | An isolated agent: its own **SOUL** (identity, values, working style), its own memory, model policy, tool grants, data clearance and context policy, all enforced by the gateway. |
| Chief | The front role the user talks to. It plans and delegates to roles. |
| Team | A delegation tree under a lead role (for example PO → engineers, designer, QA). Leads may delegate to their own reports. |
| Task | A unit of delegated or scheduled work, with state, owner role and result. |
| Origin node / execution node | Where a request came from vs where the work actually runs. They are often different: you ask on the desktop, the code is fixed on a build box. |
| Workspace | A registered environment on a node (a project checkout with its toolchain, a home-office printer, a media library) that tools can target by name. |
| Context envelope | The ambient facts the gateway attaches to every turn (§4a). |
| Artifact | A durable work product (draft email, recipe, shopping list) that can be shown on any surface and edited. |
| Label | Provenance and sensitivity metadata carried on every value (CaMeL-style). |
| Approval | A user decision bound to the hash of an exact payload, collected on a paired device. |
| Plugin / Skill / Connector | The three extension kinds (see §9). |

## 4. Request flow

1. **Input**: a node captures text, voice or a UI action. Voice nodes do wake word and VAD locally, and STT runs on the node or in a sidecar.
2. **Decide (System 1)**: one fast call to a local decision model, with a Jev-compatible request shape behind a `Decide` trait. It returns intent, urgency, **sensitivity class**, suggested role, and an injection-suspicion flag.
3. **Chief** plans. Simple requests are answered directly; others are delegated to roles as Tasks.
4. **Roles** run in fresh contexts. The gateway drives the `rig` agent loop, and every tool call returns to the gateway for policy checks: labels, tier, budget, approval.
5. **Results** come back as labelled, structured summaries. Untrusted content never enters the Chief's instructions.
6. **Output planning**: the output router picks target surfaces from presence plus capability profiles plus an explicit user request ("on my phone"). The UI compiler turns the response into a per-surface tree, `speak` or `text`.

### Roles and teams

- Each role is its own agent: a `SOUL.md`, a role manifest (model policy, tools, data clearance, budget, who it may delegate to), and its own memory scope. It is never just a prompt variant inside the Chief.
- Delegation forms a **tree**, not a free mesh. The user talks to the Chief; the Chief delegates to roles; a lead role (for example a PO) may delegate to its own team (engineers, designer, QA). Roles never message each other sideways, and every hop goes through the gateway, so there is one audit trail.
- **Grants only narrow down the tree**: a child's tools, data and budget are a subset of its parent's. Results flow up as labelled, structured summaries.
- Roles and teams are user-definable and shareable (an extension point, §9). Templates such as "Software team" or "Household admin" ship as bundles.

## 4a. Context envelope and grounding

Models know nothing about "now" or "here", so the gateway attaches a **context envelope** to every turn and every role run:

- **Time**: current date/time, timezone, locale, the user's working hours and calendar context.
- **Who**: the member (if identified), their preferences and permissions.
- **Where**: the origin node, its room/place, its capability profile, and the presence summary.
- **Focus** (only if the node has the focus capability and the member allows it): foreground app and window, open document or project, selected text, current URL. This is what "this", "here" and "that" refer to.
- **Reachable world**: the nodes, workspaces and devices this role may target right now, with their status.

Grounding rules:
- **Time is grounded, not parsed.** The model gets the current time and timezone from the envelope and fills typed tool arguments (for example an ISO 8601 datetime *with offset*). The gateway validates them against the schema and rejects impossible values (in the past, wrong year) back to the model, which corrects itself. Our code never interprets phrases like "tomorrow at 9".
- **Deixis is resolved against focus, then history, then by asking.** "Fix a bug in this app" uses the origin node's focus to identify the app. If that app's workspace lives on another node (a remote dev box, a container), the task runs there.
- **Tools are node-scoped.** Every tool call names its execution node; node-hosted tools (shell, files, editor, browser, local devices) run on that node under that node's grants. The same "run tests" tool means different things on different nodes, and the role sees only the nodes and workspaces it is allowed to target.
- The envelope is labelled like any other data (focus content can be sensitive) and is trimmed to what the role needs.

## 5. Presence and output routing

- **Presence is a fused estimate, not one signal.** Any driver or node can emit *presence observations* (member?, place, confidence, timestamp, decay). A presence engine fuses them into "who is where, and which surfaces can they perceive", per member and per room, with confidence.
- Signal sources, all pluggable:
  - **Interaction**: typing or clicking on a node, which node heard the wake word, voice level and quality, desktop idle/lock.
  - **Network**: the router's Wi-Fi client list (FRITZ!Box), later Bluetooth LE beacons.
  - **Home sensors** from the device layer: motion, mmWave occupancy, door contacts, lights switched by hand.
  - **Bridged hubs**: Home Assistant `person`/`device_tracker` and zone states.
  - **Vehicle and energy**: evcc reporting the car connected or disconnected, arriving or leaving, charging state ("left home", "just got back"). Connected-car clouds (for example Stellantis for Opel/Peugeot/Citroën) give GPS position, charge level and range. The vehicle is a device in the device model (cloud driver), and geofences are evaluated at the gateway. By default only zone transitions are kept, not GPS tracks.
  - **Phone**: geofences and location, once there is a phone client.
  - **Context**: calendar ("at work 9–17").
  - Later: voice ID to tell members apart.
- Granularity is layered: home/away, then room, then specific surface. Triggers can fire on any layer ("everyone left", "someone entered the kitchen", "Alex arrived").
- Presence data is sensitive. It is stored briefly with a short history, scoped per member, and roles must be granted access to it.
- The router's policy: an explicit target wins, then the device you just spoke to, then the best surface in the current room; otherwise a notification to the phone.
- Proactive output (reminders, alerts) carries an **urgency** and an **escalation policy**, for example: badge, then phone push, then voice announcement in the occupied room, then repeat until acknowledged. This covers the lottery-win case.

## 6. Generative UI

There is no app with pages (ADR 0010). Every screen is a Surface that starts as empty space plus an input; the Member says what to show and where, and hux places widgets there.

- **Surfaces, not pages.** A browser tab, each desktop monitor, the kitchen tablet and a phone are all Surfaces. Only **Schedule** and **Settings** are predesigned: full views with generous space. Everything else is generated.
- **Three layers on every Surface** (ADR 0011):
  - **Background**: kept widgets arranged in **regions**. Adding a widget splits a region; regions nest; removing one lets its neighbours close up. A dashboard is simply a Background the Member asked for.
  - **Windows**: in front, for what the Member is working with now. A passing answer appears here; keeping a window settles it into the Background. Windows can be moved and resized by hand.
  - **Alerts**: above everything, for what can't wait (an Approval, an alarm, a lottery win), until dealt with.
- **Scenes.** A Surface's arrangement can be saved as a named **scene** ("Cooking") and switched by asking, by hand, or automatically at a time or in a Place.
- **Placement is asked for in words and done by the model.** "Show the recipe on the right and keep it there" goes to the model, which calls typed placement tools (place, move, resize, keep, remove, send to another Surface, save or switch a scene) against the Surface's current state. The gateway validates the calls; code never parses the request (ADR 0004). Moving, resizing or closing a window by hand is a UI action on the same state.
- **Widgets move between Surfaces: push and pull (requirement).** *Push* sends, moves or copies a widget from the Surface you're on to another one ("Move this recipe to my tablet" while at the desk). *Pull* brings a widget from elsewhere to where you are ("Show me the recipe from the desk" while standing in the kitchen). The widget keeps its identity and live state (a running timer keeps running, an edited draft keeps its edits), the target gets the version down-converted for its profile (a speaker reads the recipe aloud), and the origin confirms where it went. "This", "that" and "my tablet" are resolved from Focus and the Member's devices, by the model.
- **Private widgets follow their owner.** Every widget carries a visibility (only me, the household, or named Members). A private widget can only be pulled or shown by its owner, proven by how sure hux is that it's them: a personal Node bound to that Member (their phone) counts; a recognised voice counts if the Member allows it; a shared Surface with nobody identified (the kitchen tablet) does not. Pushing a private widget onto a shared Surface asks first. When in doubt, hux asks for a confirmation on the owner's personal device instead of showing it.
- **The gateway owns Surface state.** Per Surface it stores the widgets, their placement and whether they are kept, plus its scenes, so a Surface comes back as it was after a restart or a reconnect.
- **Dialogue is secondary.** Replies are short and sit near the input; history never fills the Surface unasked.
- **Conversation and Threads can be pulled up (requirement).** A Member can open the full Conversation history, and for any Task open its Thread: which Role did what, delegated to whom, with what data and which model. Simple mode tells this in plain words ("Your writing helper drafted the email from your notes"); expert mode shows every step, Label, Model endpoint and timestamp.
- **Widgets are UI trees** in a hux-owned declarative schema **shaped like A2UI** (ADR 0008): a flat component list, data-model bindings, and `createSurface` / `updateComponents` / `updateDataModel` / `deleteSurface` plus `action` events, kept close enough that adopting A2UI 1.0 later is a straightforward adapter. In A2UI terms each widget is one "surface"; a hux Surface is the screen that holds them.
- Every widget and every actionable component **must** carry `speak` and `text` fallbacks (the Adaptive Cards lesson).
- The **gateway down-converts** each widget to a node's profile; nodes never improvise fallbacks. A linearizer produces voice and text output.
- Components come from a trusted native catalog (cards, lists, checklists, forms, media, maps, charts). A sandboxed `embed` (HTML) component is optional, only on nodes that have a webview.
- Event stream semantics are borrowed from AG-UI: run lifecycle, text deltas, tool status, state patches, interrupts for approval.
- **Theming (requirement).** All visual styling is expressed as semantic design tokens (surface, text, accent, danger, spacing, radius, type scale), never as literal values in components, so Members can pick or install Themes. Every Theme defines both a light and a dark variant. The visual direction starts from the free-space prototype (round 2).

## 7. Model layer (`hux-llm`)

- One trait per capability: `Complete`, `Embed`, `Rerank`, `Transcribe`, `Synthesize`, `Decide`, `Guard`, later `See`/OCR.
- `Decide` speaks the de-facto `/v1/systemone` request shape (Jev). The default backend is an open-weight compatible model run locally in a sidecar: Cloudflare Clef / Clef-flash (Apache-2.0), or a small CPU model such as JevOS once its licence is clear. Hosted Jev is just another backend a role may choose.
- **rig** backs Complete/Embed/Rerank/Transcribe/Synthesize. `Decide`/`Guard`/wake word/VAD use `ort`, whisper.cpp or plain HTTP. All `rig::*` imports stay inside this crate, pinned to an exact version.
- **Any model, anywhere.** A *model endpoint* is just a registered backend: a local sidecar, a GPU box on the LAN, a self-hosted cloud VM, or a provider API (Anthropic, OpenAI, OpenRouter, Google, Mistral, …). hux restricts none of them.
- **The user assigns each endpoint a trust level**, a personal judgement and not something hux hard-codes. For example: *Full* (may see anything), *Personal* (everyday personal data, but not finance or health), *Public* (only non-personal content). Onboarding suggests defaults, for instance local starting at Full and cloud starting at Public, and the user can change any of them ("I trust Anthropic with everything").
- At every model call the policy engine compares **data labels against endpoint trust**. If a role's prompt would carry data above its model's trust level, the gateway falls back to another of the role's models, redacts, or asks the user. It never sends silently.
- **Model profiles.** Each endpoint/model carries a profile: context size, modalities, tool-call format, and **sampler presets per mode**. For example Qwen3.8 uses different settings for thinking and non-thinking, toggled by template kwargs and reasoning effort. Roles pick a mode ("fast/no-think" for System 1-ish work, "deep/think" for planning) and the adapter applies the right preset. Profiles for known models ship with hux and can be overridden by the user.
- **Model choice belongs to the role** (its manifest), not to hard-coded data-class rules. Which data may leave the house falls out of which roles may see it and which models those roles use. The System 1 sensitivity tag is an input that role policies *may* use; it is not a built-in rule. Shipped role templates come with sensible defaults (for example, Finance runs on a local model).
- Design for small context windows (8–32k): fresh role contexts, summaries over transcripts, retrieval over stuffing. This is the lesson from Hermes needing at least 64k.

## 8. Safety and privacy

- **The gateway runs the agent loop.** The LLM proposes and the gateway disposes; the `rig` `AgentRun` design supports this.
- **Labels**: every value carries provenance (user / own data / web / third party) and sensitivity. Policies check labels before tool execution, CaMeL-style.
- **Roles split the lethal trifecta**: no single role combines private data, untrusted content and outbound communication without an approval in between.
- **Action tiers** (the dots model): autonomous → ask each time → pre-approvable narrowly (for example "this recurring email to Todd") → user-only (moving money, passwords). Presets per integration; custom rules can tighten but never loosen built-ins.
- **Approvals** show the final payload and are hash-bound. They are collected on a paired device and fail closed on timeout. Scheduled sends get approved *at scheduling time*, with the exact payload.
- **Secrets**: plugins and models see handles only. The egress proxy injects credentials and enforces per-plugin host allowlists.
- **Audit**: an append-only log of tool calls, approvals and egress, visible in the UI ("Recent activity").
- Device pairing: a QR code carrying the gateway key plus a one-time token, a per-device key, permissions per node (for example the wall tablet cannot approve payments), and re-pairing on metadata change.

## 9. Extensibility

| Extension point | Mechanism | Trust |
|---|---|---|
| Tools (email, lottery, bank, recipes) | Wasm components (WASI 0.3, `hux:*` WIT interfaces) on the gateway | Sandboxed, capability-granted |
| Third-party tool servers | MCP client (`rmcp`), descriptions pinned by hash, outputs untrusted | External, untrusted |
| Skills (know-how only) | `SKILL.md` (agentskills.io format) | No authority of their own |
| Roles and teams | `SOUL.md` plus role manifest; team bundles | Can only narrow the parent's grants |
| Channels and renderers | Connector nodes over the node protocol | Process-isolated |
| Device drivers (Matter, Zigbee, MQTT, HA bridge…) | Connector processes (hardware/LAN) or Wasm (pure network APIs), mapping onto the hux device model | Process-isolated or sandboxed |
| Model providers, storage, memory backends | Native Rust traits | Compiled in |
| New device types | A published node protocol | — |
| Policy, secrets, egress, audit | **Core only** | — |

Manifest `hux-plugin.toml`: declared capabilities, deny by default, user consent at install and on any capability change, signed and hash-pinned, with a registry that has trust tiers.

## 10. Memory

- **Profile**: small, curated facts about you, always in context, and visible and editable item by item. This avoids dots' anti-pattern.
- **World state**: structured, typed facts that skills update, such as pantry contents, shopping list, tracked lottery tickets and accounts. These are queryable rather than prose.
- **Episodic**: all transcripts and artifacts in SQLite with full-text search (FTS) and `sqlite-vec`, searched on demand.
- Memory writes can be **staged for review**. Each memory item carries its own sensitivity label.

## 11. Scheduling and proactivity

- A durable job table in the gateway's SQLite. Triggers are time (cron/once), event (presence change, geofence enter, device event, plugin event) and condition polls.
- Each job is a fresh role run with a pre-approved scope, and it delivers through the output router.
- The UI has one "Scheduled" list and one "Activity" log.

## 11a. Home and device layer

hux has its **own device model**, so home control works out of the box without another platform. Protocols plug in as drivers.

- **Device model**: devices, their capabilities (on/off, level, color, temperature, lock, cover, sensor readings, media…) and areas/rooms. It is a typed, protocol-neutral vocabulary, in the spirit of Matter's clusters.
- **Two primitives**: *events* (state changed, motion, button pressed) go onto the gateway event bus and feed triggers and presence; *commands* (turn off, set level) are tools that go through policy like any other action.
- **Drivers are an extension point.** Each driver owns one protocol or ecosystem and maps it onto the device model, with discovery and pairing. Candidates: Matter (the strategic default for new devices), Zigbee (native coordinator via a USB stick, or via zigbee2mqtt), MQTT, Hue/Shelly/Tasmota-style LAN APIs, and a **Home Assistant bridge** so existing HA users get all their entities at once.
- Drivers come in three shapes, all mapping onto the same device model:
  - **local**: talks to devices on the LAN (Matter, Zigbee, MQTT, Shelly, Govee LAN API, …)
  - **cloud**: talks to a vendor cloud with the user's account (Meross, Tuya, Govee cloud, …), with credentials in the vault and egress allowlisted to the vendor's hosts
  - **bridge**: imports another hub wholesale (Home Assistant, evcc, …)

  A driver may combine shapes, for example a cloud login to fetch device keys followed by local control. Drivers declare which **discovery methods** they use (mDNS, SSDP, vendor UDP broadcast, cloud account listing), so the gateway can run discovery for all installed drivers at once.
- Router-based presence (for example a FRITZ!Box's list of connected Wi-Fi clients) is also a driver feeding presence events, so presence works without a phone app.
- Drivers run as connector processes (they need USB, mDNS and long-lived sockets) or as Wasm plugins for pure-network APIs.
- **Exposure and permissions**: devices are scoped per role and per member (the Home role may control lights but not door locks without approval). Risky capabilities (locks, alarms, garage doors) default to "ask each time".
- **UX**: "set up my lights" leads to auto-discovery (mDNS, Matter commissioning, Zigbee permit-join), then the agent proposes names and rooms and asks you to confirm.

## 12. Networking

- Gateways advertise themselves via **mDNS/DNS-SD** on the LAN for zero-config discovery, used by every node type: desktop, tablet, voice puck, and the web interface's own "open on this network" link.
- Node ↔ gateway over **iroh** (QUIC, connect by public key, NAT traversal, a self-hostable relay), so the phone works away from home without port forwarding.
- The protocol is typed messages with a schema-generated client; sequence numbers allow resume and replay; side effects take idempotency keys. Nodes expose device actions as MCP tools over that channel.

## 13. Use cases → subsystems

| Use case | What carries it |
|---|---|
| Recipe → fridge → shopping list → reminder at store → show on tablet | Conversation continuity, world state (pantry, list), artifact + output router, geofence trigger, surface targeting |
| Research → draft to Todd → edit at home → send Monday, remind Friday | Researcher role (web, no data) + Comms role (draft), artifact editing on desktop, scheduled send with hash-bound approval, reminder job |
| Lottery tracking with escalating alerts | Wasm plugin + scheduled job + escalation policy |
| Daily portfolio briefing | Finance role (local-only model, read-only bank access), scheduled briefing artifact |
| Lights off when leaving | Presence/geofence trigger → Home role → device layer → driver (Matter/Zigbee/HA/…), pre-approved rule |

## 14. Suggested phasing (walking skeleton first)

0. **Groundwork**: see [phase-0-plan.md](phase-0-plan.md). Gateway with the web interface (first-run LLM setup and chat), protocol/transport seams, `hux-llm` on rig, the Chief only, SQLite, a container build.
1. **Nodes**: node protocol, pairing, capability profiles, and three clients: the **web surface served by the gateway**, a **terminal** client (CLI/TUI), and **desktop** (Tauri, reusing the web UI). The UI schema v0 with a web renderer and the text linearizer. The phone comes later, starting with the web surface.
2. **Proactive**: scheduler, notifications, presence v0 (active node, geofence), output router.
3. **Roles and safety**: role files, delegation, labels, policy tiers, approvals, audit, egress proxy, secrets vault.
4. **Extensions**: Wasm plugin host, MCP client, skills.
5. **Voice**: wake word and VAD on the node, STT/TTS sidecars, a voice-only node.
6. **Home**: the device layer, the first drivers (Matter and MQTT/zigbee2mqtt, then a Home Assistant bridge for existing users), discovery, and presence from sensors.

## 15. Open questions

Decided (2026-10-09): household; the gateway is headless or embedded at the user's choice; the remote/local split is governed by role model policy, not hard-coded; first clients are web, terminal and desktop, with the phone later.

Still open:
- Member identity: how people authenticate on shared surfaces (wall tablet, voice). Options are passkeys on personal devices, voice ID later, and a household-shared mode for low-risk actions.
- Does the web surface reach outside the LAN in v1, or is it LAN-only with remote access later (iroh relay, Tailscale)?
- Messenger connectors (Signal, Telegram) as an early input path, or later?
- First integration to prove the plugin model end to end (lottery checker? recipes and shopping list?).
