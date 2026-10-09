# ACP and external agents: research notes for hux

Researched on 2026-10-09. Scope: the Agent Client Protocol (ACP), which coding agents speak it, the other ways to drive Claude Code headlessly, the terms that apply, and the Rust crates. Primary sources only, linked inline. **[unverified]** marks claims I could not confirm in a primary source.

Why it matters: the owner wants a "Coder" Role whose work is done by an outside agent such as Claude Code, running headlessly on a Node in a registered Workspace. The first use is dogfooding: hux's own coder working on the hux repo.

## 1. What ACP is

- ACP standardises how an editor (the **client**) talks to a coding agent (the **agent**), the way LSP did for language servers (https://agentclientprotocol.com/overview/introduction). It reuses MCP's JSON shapes where it can and adds types for coding, such as diffs. User-readable text is Markdown.
- **Governance**: jointly run by Zed and JetBrains; lead maintainers Ben Brandt (Zed) and Sergey Ignatov (JetBrains); no foundation yet, a move to an independent foundation is planned (https://agentclientprotocol.com/community/governance.md).
- **Versioning**: `protocolVersion` is a single integer for the major version, currently `1`. The client sends the newest it supports; the agent echoes it or answers with its own newest; on mismatch the client disconnects (https://agentclientprotocol.com/protocol/initialization). A v2 draft exists in the docs (https://agentclientprotocol.com/llms.txt).
- **Conventions**: JSON-RPC 2.0; camelCase keys, snake_case discriminators; file paths must be absolute; lines are 1-based. Extensions go in `_meta` fields, custom methods start with `_` (https://agentclientprotocol.com/protocol/overview).

## 2. Transport

- **stdio is the only finished transport.** The client starts the agent as a subprocess; messages are newline-delimited UTF-8 JSON-RPC with no embedded newlines. The agent must write nothing but ACP messages to stdout and may log to stderr; the client must write nothing else to stdin. Custom transports are allowed if they keep the message format and lifecycle (https://agentclientprotocol.com/protocol/v1/transports.md).
- **Remote is in progress.** The "Streamable HTTP & WebSocket Transport" RFD is Active (moved there 2026-07-02, Phase 1, reference implementation in Goose): one `/acp` endpoint, POST for client messages, SSE streams back (one per connection, one per session), HTTP/2 required, WebSocket upgrade on the same endpoint, `Acp-Connection-Id` and `Acp-Session-Id` headers that are explicitly not auth tokens. Auth is left to the layer above; durable resume is deferred to v2 (https://agentclientprotocol.com/rfds/streamable-http-websocket-transport.md).
- **Consequence for hux**: run the agent as a stdio subprocess *on the Execution Node* and carry its stdio over the Node's existing authenticated tunnel. This is a custom transport in ACP's sense and needs nothing from the unfinished remote RFD.

## 3. Lifecycle and prompts

Typical flow (https://agentclientprotocol.com/protocol/overview):

1. `initialize`: version and capability exchange; `authenticate` if the agent lists `authMethods`. `clientInfo` and `agentInfo` (`name`, `title`, `version`) are recommended now and will become required (https://agentclientprotocol.com/protocol/initialization).
2. `session/new` with `cwd` (absolute; the root for relative paths), `mcpServers`, and optional `additionalDirectories`. Returns a unique `sessionId` (https://agentclientprotocol.com/protocol/session-setup).
3. `session/prompt` starts a turn. The agent streams `session/update` notifications and may call client methods (permission, files, terminals). The client may send `session/cancel`. The turn ends when the `session/prompt` response arrives with a stop reason.

Other session methods (https://agentclientprotocol.com/protocol/session-setup):
- `session/load` (capability `loadSession`) replays the whole history as `session/update` notifications, then answers `{}`.
- `session/resume` (capability `sessionCapabilities.resume`) reattaches without replay.
- `session/close` cancels work and frees resources. RFDs exist for session list, fork and delete (https://agentclientprotocol.com/llms.txt).
- `session/set_mode` switches the agent's modes (for example ask or plan); `logout` is optional.

Prompt content: every agent must accept text and resource links; images, audio and embedded resources are opt-in through `promptCapabilities` (https://agentclientprotocol.com/protocol/initialization).

## 4. Streaming updates and tool-call reporting

`session/update` carries message chunks (agent, user, thought), tool calls and their updates, plans, available slash commands, mode changes, notices and context compactions (https://agentclientprotocol.com/protocol/overview).

Tool calls (https://agentclientprotocol.com/protocol/tool-calls):
- `tool_call` with required `toolCallId` and `title`; optional `name` (informational only, never an authorisation), `kind`, `status`, `content`, `locations`, `rawInput`, `rawOutput`.
- `tool_call_update` sends only changed fields.
- **Kinds**: `read`, `edit`, `delete`, `move`, `search`, `execute`, `think`, `fetch`, `switch_mode`, `other` (default).
- **Statuses**: `pending` (including "awaiting approval"), `in_progress`, `completed`, `failed`.
- **Content**: ordinary content blocks, **diffs** (`path`, `oldText` or null for a new file, `newText`), and **terminals** by `terminalId`.
- **Locations**: `path` plus optional `line`, so a client can follow what the agent touches.

This is enough to rebuild a readable record of what a coder did: messages, plan, each file read or changed with its diff, each command with its output.

## 5. Permission requests

(https://agentclientprotocol.com/protocol/tool-calls)

- Before running a tool the agent **may** call `session/request_permission` with `sessionId`, the `toolCall` and `options`.
- Each option has `optionId`, `name` and `kind`: `allow_once`, `allow_always`, `reject_once`, `reject_always`.
- The client answers `selected` with an `optionId`, or `cancelled`. Clients may auto-allow or auto-reject from user settings. If the turn is cancelled the client must answer `cancelled`.
- **ACP is a reporting and asking protocol, not a sandbox.** The agent decides which calls to ask about; anything its own settings auto-approve never reaches the client (see §8 for Claude Code's evaluation order). The terminals page says nothing about sandboxing or command limits (https://agentclientprotocol.com/protocol/terminals).

## 6. What the client provides: files, terminals, MCP

Capabilities are negotiated in `initialize`; omitted means unsupported (https://agentclientprotocol.com/protocol/initialization).

- **Files**: `fs/read_text_file` and `fs/write_text_file`, gated by `fs.readTextFile` and `fs.writeTextFile`. Lets the agent see unsaved editor state and lets the client mediate writes.
- **Terminals**: `terminal/create` (`command`, `args`, `env`, `cwd` absolute, `outputByteLimit`), `terminal/output`, `terminal/wait_for_exit`, `terminal/kill`, `terminal/release`, gated by `terminal`. The **client** runs the command "within the Client's environment" (https://agentclientprotocol.com/protocol/terminals).
- **Elicitation**: `elicitation/create` for structured user input, opt-in (https://agentclientprotocol.com/protocol/overview).
- **MCP servers passed by the client**: in `session/new`. stdio is mandatory for every agent (`name`, absolute `command`, `args`, `env`); `http` and (deprecated) `sse` only if the agent advertises `mcpCapabilities.http` or `.sse`, each with `url` and `headers`. Agents "SHOULD connect to all MCP servers specified by the Client" (https://agentclientprotocol.com/protocol/session-setup). An "MCP-over-ACP" RFD would tunnel MCP through the ACP connection itself (https://agentclientprotocol.com/rfds/mcp-over-acp.md) **[unverified: status not checked]**.
- Whether an agent actually routes its own file and shell work through the client's `fs/*` and `terminal/*` when offered, instead of its built-in tools, is up to each agent **[unverified for Claude and Codex adapters]**.

## 7. Which agents speak ACP today

The official list has about 40 agents (https://agentclientprotocol.com/overview/agents). The ones that matter for a hux coder:

| Agent | How | Notes |
|---|---|---|
| **Claude Code** | Adapter `@agentclientprotocol/claude-agent-acp` (Apache-2.0, `agentclientprotocol` org, formerly Zed's `claude-code-acp`), built on the Claude Agent SDK | Tool calls with permission requests, diffs, following, edit review, TODO lists, nested subagent transcripts, interactive and background terminals, slash commands, client MCP servers (https://github.com/agentclientprotocol/claude-agent-acp). No native `claude --acp` flag found; Zed announced the adapter route (https://zed.dev/blog/claude-code-via-acp). Auth in the adapter is not documented in the README **[unverified]**. |
| **Codex CLI** | Adapter `@agentclientprotocol/codex-acp`; starts the Codex App Server and translates | Auth via ChatGPT login, `CODEX_API_KEY`/`OPENAI_API_KEY`, or a client-provided OpenAI-compatible gateway; `INITIAL_AGENT_MODE` of `read-only`, `workspace-write`, `agent`, `agent-full-access`; permission requests, client MCP servers over stdio and HTTP; `NO_BROWSER=1` hides browser login for headless hosts (https://github.com/agentclientprotocol/codex-acp). |
| **Gemini CLI** | Native: `gemini --acp` (`--experimental-acp` deprecated) | Zed's reference implementation. Source: the `acp` option in `packages/cli/src/config/config.ts` (https://github.com/google-gemini/gemini-cli/blob/main/packages/cli/src/config/config.ts); docs at https://geminicli.com/docs/cli/acp-mode/. In ACP mode it leaves permission prompts to the client (comment in the same file). |
| GitHub Copilot CLI | Listed, public preview | (https://agentclientprotocol.com/overview/agents) |
| Others | Listed | Cursor CLI, Goose, OpenCode, OpenHands, Junie, Kiro CLI, Qwen Code, Mistral Vibe, Cline, Augment, Factory Droid, Hermes Agent, OpenClaw and more (https://agentclientprotocol.com/overview/agents). |

Clients include Zed, JetBrains IDEs, VS Code extensions and Neovim plugins (https://agentclientprotocol.com/get-started/clients.md). An ACP Agent Registry lists installable agents with their launch commands (https://agentclientprotocol.com/get-started/registry.md).

**Hermes as an ACP agent** (the reverse direction): `hermes acp` serves its agent over stdio to VS Code, Zed and JetBrains. Sessions persist and can be listed, loaded, resumed or forked; file and terminal tools run relative to the editor's working directory; MCP servers the editor passes are always registered; permission options are once, for the session, always, deny; unanswered approvals are denied after 300 s. Its docs warn that a host can answer approvals programmatically, which gave every channel author shell access in one bridge setup (https://hermes-agent.nousresearch.com/docs/user-guide/features/acp).

## 8. Other ways to drive Claude Code headlessly

- **`claude -p`** (https://code.claude.com/docs/en/headless): non-interactive runs; `--output-format stream-json` (with `--verbose`, `--include-partial-messages`) gives newline-delimited events ending in a `result` message; `--input-format stream-json` for streamed input; `--resume <session_id>`/`--continue`; `--allowedTools` with rule syntax such as `Bash(git diff *)`; `--permission-mode` (`default`, `acceptEdits`, `plan`, `auto`, `dontAsk`, `bypassPermissions`); `--permission-prompt-tool` names an MCP tool that answers prompts; `--permission-prompts none` denies anything that would prompt. `--bare` skips hooks, skills, plugins, MCP servers, memory and `CLAUDE.md` and is the recommended mode for scripts. **Without `--bare`, a `-p` session runs the project's `.claude/settings.json` hooks and connects its `.mcp.json` servers even in an untrusted folder**, with no trust dialog.
- **Claude Agent SDK** (https://code.claude.com/docs/en/agent-sdk/overview): Python and TypeScript libraries that run the Claude Code binary with its tools, hooks, subagents, MCP, sessions and permissions. Other languages are told to use `claude -p` as a subprocess. Permission order: hooks → deny rules → ask rules → permission mode → allow rules → `canUseTool` callback. **Calls auto-approved at an earlier step never reach `canUseTool`**; only a `PreToolUse` hook sees every call (https://code.claude.com/docs/en/agent-sdk/permissions).

**Comparison for hux** (a Rust Gateway that must drive several agents):

| | ACP | Agent SDK | `claude -p` stream-json |
|---|---|---|---|
| Agents covered | Claude, Codex, Gemini, Copilot and ~40 more | Claude only | Claude only |
| From Rust | Official crate | Needs a Node or Python process | Subprocess, hux-owned parser of an unversioned event stream |
| Permission asks | Standard `session/request_permission` | `canUseTool` callback (in-process) | MCP tool via `--permission-prompt-tool` |
| Activity record | Standard tool calls, diffs, terminals, plans | SDK message objects | SDK message objects as JSON |
| Long-lived session | Yes, with load/resume | Yes | Per run, `--resume` between runs |

ACP wins for hux: one client for every coding agent, typed messages, and the Claude adapter is itself built on the Agent SDK, so its permission and reporting surface is what we would have built ourselves.

## 9. Terms for running Claude Code headlessly

From https://code.claude.com/docs/en/legal-and-compliance:

- Claude Code falls under the Consumer Terms for Free, Pro and Max, and the Commercial Terms for Team, Enterprise and API users.
- **OAuth (subscription) sign-in** is "intended exclusively for purchasers of" Claude plans for "ordinary use of Claude Code and other native Anthropic applications". Developers building products, including on the Agent SDK, "should use API key authentication". Anthropic does not permit third-party developers to offer Claude.ai login in their own apps or route requests through Free, Pro or Max credentials on behalf of their users, and developers "may not collect, store, or intermediate Claude.ai credentials or session tokens".
- It does not prevent "an end user from signing in to the unmodified Claude Code binary with their own Claude subscription", including on platforms that host Claude Code, provided the binary is unmodified, built-in auth methods are not removed, and usage is billed to the end user.
- Customers may configure their own API keys in a secrets manager for their own authorised users, as long as usage is billed to the key owner and not resold.
- Pro and Max limits "assume ordinary, individual usage of Claude Code and the Agent SDK".
- The Agent SDK is under the Commercial Terms; partners must not brand their product "Claude Code" (https://code.claude.com/docs/en/agent-sdk/overview).

**What this means for hux** (my reading, not legal advice):
- An **API key** in the hux vault is fine: the Member's own key, billed to them.
- A **subscription** must never pass through hux: the Member signs in on the Node themselves through Anthropic's flow, the token stays in that Node's OS credential store, and hux never reads, stores or relays it.
- Whether a Member's own subscription may power `claude-agent-acp` driven by hux (an Agent SDK product, not the plain binary) is a grey zone **[unverified]**. Default to an API key; offer the subscription only as "signed in yourself on this computer", with a note.
- Copy may say plainly that a Role "runs Claude Code"; hux must not present itself as Claude Code.

Codex: ChatGPT login and API keys are both offered by the adapter; OpenAI's terms for automated use were not checked **[unverified]**.

## 10. Rust crates

- `agent-client-protocol` 3.3.0, Apache-2.0, repo https://github.com/agentclientprotocol/rust-sdk, about 5 million downloads (crates.io API, checked 2026-10-09). Implements both sides: `Client.builder()`, `Agent.builder()`, `Proxy.builder()`. It powers Zed's external-agent integration (https://agentclientprotocol.com/libraries/rust.md).
- Companion crates in the same repo: `agent-client-protocol-http` (HTTP/SSE and WebSocket transports), `agent-client-protocol-rmcp` (bridges to `rmcp`, which hux already plans for MCP), `agent-client-protocol-conductor` (proxy chains), `-polyfill`, `-trace-viewer`, `-test` (https://github.com/agentclientprotocol/rust-sdk).
- `agent-client-protocol-schema` 1.11.0 holds the generated protocol types (https://github.com/agentclientprotocol/agent-client-protocol).
- Async runtime requirements were not stated on the pages read **[unverified]**.

## 11. Takeaways for hux

1. Speak ACP as a **client** from the Gateway, with the agent process running on the Execution Node and its stdio tunnelled over the Node connection, the same pattern as Node-hosted Model endpoints.
2. ACP permission requests map cleanly onto Action tiers and Approvals, but they are only as complete as the agent's own settings. The Workspace confinement must come from the Node (OS-level), not from ACP.
3. The `session/update` stream is a ready-made Thread record.
4. Claude Code via `claude-agent-acp`, Codex via `codex-acp` and Gemini CLI natively all work today. Prefer API keys from the vault; never touch subscription tokens.
5. The reverse direction (hux's Chief as an ACP agent for editors) is cheap with the same crate and follows Hermes' precedent, minus its "host answers approvals" hole.
