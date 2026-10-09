# Generative / agent-driven UI: survey for hux

Status: research for planning. Sources were fetched 2026-10-09. **[unverified]** marks claims I could not confirm from a primary source.

## 1. Approaches

### Google A2UI (Agent-to-User Interface)
- **Model:** The agent emits a declarative component tree as JSON *data*, and the client renders it with its own native widgets. The project calls this "safe like data, but expressive like code" ([repo](https://github.com/google/A2UI)). Components arrive as a **flat list with IDs**, and parents reference children by ID. A component with id `root` is required, and forward references to IDs that have not arrived yet are allowed. Bindings use **JSON Pointer** paths into a per-surface data model ([v0.9 spec](https://a2ui.org/specification/v0.9-a2ui/)).
- **Streaming:** A one-way, ordered stream of JSON messages (e.g. JSONL). Each message is one of `createSurface`, `updateComponents`, `updateDataModel` (upsert at a path) or `deleteSurface`. Transport is agnostic: A2A, AG-UI, MCP, SSE, WebSockets or REST ([v0.9 spec](https://a2ui.org/specification/v0.9-a2ui/)).
- **Events back:** The client sends an `action` message with `name`, `surfaceId`, `sourceComponentId` and `context`. It can optionally attach the surface data model. Input edits stay local until an action fires. There is also a structured `VALIDATION_FAILED` error, which supports a generate, validate, repair loop with the LLM ([v0.9 spec](https://a2ui.org/specification/v0.9-a2ui/)). v1.0 adds client-to-server RPC (`actionResponse`) and action IDs ([a2ui.org](https://a2ui.org/)).
- **Security:** Agents can only reference components from a client-side **trusted catalog**. Custom "smart wrappers", including sandboxed iframes, are opt-in and governed by the host's policy ([repo](https://github.com/google/A2UI)).
- **Capability negotiation:** The client declares `a2uiClientCapabilities.supportedCatalogIds`, plus optional `inlineCatalogs`. Each surface pins one `catalogId`. Multiple surfaces with distinct `surfaceId`s are first-class ([v0.9 spec](https://a2ui.org/specification/v0.9-a2ui/)). In v1.0, components from several listed catalogs can be mixed in one tree. The basic catalog contains Text, Image, Icon, Video, AudioPlayer, Row, Column, List, Card, Tabs, Divider, Modal, Button, CheckBox, TextField, DateTimeInput, ChoicePicker and Slider. v1.0 also adds required accessibility semantics (`label`, `description`, `live`, `hidden`) ([v1.0 spec](https://a2ui.org/specification/v1.0-a2ui/)).
- **Maturity and ecosystem:** Apache-2.0. v0.9.1 is the current stable release and v1.0 is a release candidate. The project describes itself as an "early stage public preview" ([repo](https://github.com/google/A2UI)). Renderers exist for Lit, Angular, React, Flutter (GenUI SDK) and Markdown ([a2ui.org](https://a2ui.org/)). The site does not mention voice rendering.
- **Rust:** There is a community crate `a2ui`, MIT-licensed, by an individual maintainer (github.com/Liangdi/a2ui). It claims to implement A2UI v1.0 and has a ratatui backend by default, with Slint and egui behind features. docs.rs also lists Bevy, Iced and Dioxus, but the README does not. v0.3.1 was released 2026-06-18 ([docs.rs](https://docs.rs/crate/a2ui/latest)). **[unverified: quality and spec conformance]**

### AG-UI (CopilotKit)
- **Model:** AG-UI is not a UI description format. It is an **event-stream protocol between agent and frontend**: "open, lightweight, event-based" ([docs](https://docs.ag-ui.com/introduction)). Its event families are:
  - lifecycle: `RunStarted`, `RunFinished`, `RunError`, `Step*`
  - text: `TextMessageStart`, `TextMessageContent`, `TextMessageEnd`
  - tool calls: `ToolCallStart`, `ToolCallArgs`, `ToolCallEnd`, `ToolCallResult`
  - state: `StateSnapshot`, `StateDelta` (RFC 6902 JSON Patch), `MessagesSnapshot`
  - `Activity*`, reasoning, subagent, `Custom` and `Raw` events

  Source: [events](https://docs.ag-ui.com/concepts/events).
- **Interaction:** It supports frontend-executed tools, human-in-the-loop interrupts (approve, edit, retry) and mid-run steering ([docs](https://docs.ag-ui.com/introduction)).
- **Generative UI:** The docs position A2UI and MCP Apps as *payloads* that AG-UI carries, and describe them as complementary ([docs](https://docs.ag-ui.com/introduction)).
- **Maturity:** MIT, about 16k stars. Transport-agnostic (SSE, WebSockets, webhooks). The Rust SDK is **community**-maintained ([repo](https://github.com/ag-ui-protocol/ag-ui)).

### MCP Apps (SEP-1865) and MCP-UI
- **Model:** **HTML in a sandboxed iframe.** A tool points to a `ui://` resource through `_meta.ui.resourceUri`. The host fetches the resource and renders it. The view and the host exchange JSON-RPC over `postMessage` (`ui/initialize`, `tools/call`, `ui/message`) ([overview](https://apps.extensions.modelcontextprotocol.io/api/documents/Overview.html)).
- **Security:** The iframe has no access to the host's DOM, cookies or storage. The server declares CSP domains, the host enforces them, and the default is no network access ([overview](https://apps.extensions.modelcontextprotocol.io/api/documents/Overview.html)).
- **Capabilities:** The host advertises UI support when connecting. It sends the view its theme, locale, display mode (inline, fullscreen or pip), container size and platform (web, desktop or mobile). Tools can be scoped as model-visible, app-only or both. Hosts without UI support still receive the tool's text output, so the UI is a **progressive enhancement** ([overview](https://apps.extensions.modelcontextprotocol.io/api/documents/Overview.html)).
- **Maturity:** The 2026-01-26 spec is marked Stable. Apache-2.0 ([repo](https://github.com/modelcontextprotocol/ext-apps)).
- **MCP-UI:** MCP-UI pioneered the pattern. Its `@mcp-ui/*` packages now implement MCP Apps (MIME type `text/html;profile=mcp-app`). It also has `rawHtml`, `externalUrl` and an experimental `remoteDom` type. Its action types are tool, prompt, link, intent and notify. Apache-2.0 ([repo](https://github.com/MCP-UI-Org/mcp-ui)).

### OpenAI Apps SDK
- **Model:** Built on MCP Apps. Widgets are HTML in a sandboxed iframe that use the MCP Apps bridge. `window.openai.*` (`toolOutput`, `callTool`, `sendFollowUpMessage`, `setWidgetState`) is now a set of compatibility aliases and ChatGPT-specific extensions ([docs](https://developers.openai.com/apps-sdk/build/chatgpt-ui)).
- **Tool results:** Results are split into `structuredContent` (data for the UI), `content` (text for the model) and `_meta` (UI linkage and hints).
- **Display modes and security:** Display modes are inline card, carousel, fullscreen and pip. Resources declare per-resource CSP allowlists (`connectDomains`, `resourceDomains`, `frameDomains`). The docs say to treat `structuredContent` as untrusted ([docs](https://developers.openai.com/apps-sdk/build/chatgpt-ui)).

### Vercel AI SDK generative UI
- **Model:** Code-side mapping. The model calls typed tools, and the client maps each `tool-<name>` message part to a React component. Streaming states are `input-available`, `output-available` and `output-error` ([docs](https://ai-sdk.dev/docs/ai-sdk-ui/generative-user-interfaces)).
- **RSC:** The RSC `streamUI` path is experimental and not recommended for production ([RSC docs](https://ai-sdk.dev/docs/ai-sdk-rsc/overview)).
- **Fit:** The UI is fixed in client code, and the catalog is effectively "the tools". This does not fit a heterogeneous Rust fleet. License not checked **[unverified]**.

### Adaptive Cards (Microsoft): precedent
- **Model:** A declarative JSON card that the host renders natively with its own styling. The guiding principles are "card authors own the content, host owns look and feel", "semantic instead of pixel-perfect", "purely declarative, no code" and "when in doubt, keep it out" ([overview](https://learn.microsoft.com/en-us/adaptive-cards/)). Renderers exist for Android, iOS, JS, .NET/WPF, UWP and React Native, but none for Rust ([overview](https://learn.microsoft.com/en-us/adaptive-cards/)).
- **Degradation:** Each card declares a `version`. Elements and actions carry `fallback` (an alternative element or `"drop"`) and `requires` (feature to minimum version). `Action.Execute` can return a replacement card ([universal actions](https://learn.microsoft.com/en-us/adaptive-cards/authoring-cards/universal-action-model)). The card root has `speak` (plain text or SSML for voice hosts) and `fallbackText` ([schema](https://adaptivecards.microsoft.com/schemas/adaptive-card.json)). It is the only surveyed format with an explicit voice channel.
- **Lesson:** The version-gated model fragmented across hosts, and Microsoft had to retrofit a "universal action model" ([universal actions](https://learn.microsoft.com/en-us/adaptive-cards/authoring-cards/universal-action-model)).

## 2. Comparison

| | Payload | Security | Capability negotiation | Native or Rust render | Voice/text degrade |
|---|---|---|---|---|---|
| A2UI | Flat JSON component list plus data model, streamed | Trusted catalog | `supportedCatalogIds`, per-surface catalog | Yes; community Rust crate | Not specified (Markdown renderer exists) |
| AG-UI | Event stream (carries A2UI or MCP Apps) | n/a | n/a | Community Rust SDK | Text events native |
| MCP Apps / Apps SDK | HTML iframe plus postMessage JSON-RPC | Sandbox plus CSP | Host advertises support; host context (platform, display mode) | Needs a webview on every node | Text `content` fallback |
| Vercel AI SDK | Tool parts mapped to React | Client code | None | No | No |
| Adaptive Cards | JSON card | Declarative, no code | `version`, `requires`, `fallback` | Not for Rust | `speak`, `fallbackText` |

## 3. Fit for hux and recommendation

hux needs a payload that a Rust desktop app, a web or tablet client and a mobile app can render natively, and that speakers and chat can reduce to speech or text. Two design families exist:
- HTML/iframe (MCP Apps, OpenAI): needs a webview, is weak on voice, and requires a sandbox. Keep it only as an optional "embed" component on nodes that have a webview.
- Declarative catalog (A2UI, Adaptive Cards): native, safe by construction, and able to degrade. This is the right family for hux.

**Recommendation: own a small schema that is shaped like A2UI and wire-compatible with it where cheap. Do not adopt A2UI wholesale yet.**

**Copy from A2UI:**
- surfaces with IDs
- a flat ID-referenced component list with incremental `updateComponents` and `updateDataModel`
- JSON Pointer data binding
- an `action` event with a source component and context
- catalog IDs declared by the client
- a validate-and-repair error message for the LLM

These solve streaming and multi-surface rendering cleanly, and the spec is Apache-2.0.

**Add what A2UI lacks:**
- **Per-node capability profile** in the node handshake, beyond catalog IDs: modalities (screen, audio, text), screen size and class, number of surfaces/monitors, input methods, and the display modes the node supports, similar to the host context in MCP Apps.
- **Mandatory semantic fallbacks:** each surface and each actionable component carries `speak` and `text` summaries, the way Adaptive Cards uses `speak` and `fallbackText`. Every action also needs a voice-invocable label, so voice-only and chat nodes get a deterministic degradation instead of a second LLM call. A2UI v1.0's accessibility `label` and `description` can serve as the source for these.
- **Per-node component fallback**, similar to Adaptive Cards `fallback` and `drop`. The gateway can then down-convert a tree for a node whose catalog lacks a component. Do the down-conversion **centrally in the gateway** to avoid the Adaptive Cards version fragmentation.

**Transport:** Use your own gateway-to-node protocol. Borrow AG-UI's event taxonomy (run lifecycle, streamed text, tool calls, JSON-Patch state deltas) rather than taking the dependency, because its Rust SDK is community-maintained.

**Path to compatibility:** Keep the schema close enough that an A2UI v1.0 adapter is a thin mapping. Revisit adopting A2UI directly once it reaches 1.0 GA. The community `a2ui` Rust crate (egui, Slint, Iced, Dioxus backends) is worth prototyping against, but its maturity is unverified.

**Rendering in Rust:** One schema can map to several targets:
- desktop: egui, Slint or Iced
- tablet: web (Dioxus or Leptos to WASM, or a TS renderer)
- mobile: Slint, or a native shell
- voice and text: a pure "linearizer" that walks the tree and emits `speak` and `text`
