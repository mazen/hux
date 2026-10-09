# Standard agent and skill formats: research notes for hux

Researched on 2026-10-09. Scope: the file formats the ecosystem uses to share agents and skills, field by field, so hux Roles and Skills can import them. Primary sources only, linked inline. **[unverified]** marks claims I could not confirm in a primary source.

## 1. Agent Skills (`SKILL.md`, agentskills.io)

The open standard for skills. Originally developed by Anthropic and released as an open standard (https://agentskills.io/home). The showcase lists 40+ clients, among them Claude Code, ChatGPT and Codex, GitHub Copilot, VS Code, Cursor, Gemini CLI, OpenCode, Goose, Junie, Kiro, Hermes Agent and OpenClaw (https://agentskills.io/home).

**Layout** (https://agentskills.io/specification): a skill is a directory with a required `SKILL.md`, plus optional `scripts/` (executable code), `references/` (documentation loaded on demand) and `assets/` (templates, images, data). Any other files are allowed. File references are relative to the skill root and should stay one level deep.

**Frontmatter** (YAML, then a Markdown body with no format rules):

| Field | Required | Constraints |
|---|---|---|
| `name` | yes | 1–64 chars, `a-z`, `0-9` and `-`; no leading, trailing or double hyphen; must match the directory name |
| `description` | yes | 1–1024 chars; what the skill does and when to use it |
| `license` | no | licence name or a bundled licence file |
| `compatibility` | no | 1–500 chars; environment needs (product, packages, network) |
| `metadata` | no | map of string to string, for client-specific properties |
| `allowed-tools` | no | space-separated list of pre-approved tools, e.g. `Bash(git:*) Read`; **experimental**, support varies |

**Progressive disclosure** (https://agentskills.io/specification): (1) `name` and `description` (~100 tokens) load at startup for all skills; (2) the full body (< 5000 tokens recommended, < 500 lines) loads when the skill is activated; (3) files in `scripts/`, `references/`, `assets/` load only when needed. Script languages "depend on the agent implementation"; Python, Bash and JavaScript are named as common. A validator exists: `skills-ref validate` (https://github.com/agentskills/agentskills/tree/main/skills-ref).

### Vendor extensions seen in the wild

- **Claude Code** adds `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `disallowed-tools`, `model`, `effort`, `context: fork`, `agent`, `background`, `hooks`, `paths` and `shell`, and ignores unknown fields (https://code.claude.com/docs/en/skills). There, `allowed-tools` **grants**: listed tools run without a permission prompt for the invoking turn; it does not restrict. Skill bodies can also embed `` !`command` `` shell injection, run before the model sees the text (same page).
- **Codex** reads skills from `.agents/skills` (cwd up to repo root), `$HOME/.agents/skills`, `/etc/codex/skills` and bundled system skills. An optional `agents/openai.yaml` inside the skill holds `interface` (`display_name`, `short_description`, `icon_small`, `icon_large`, `brand_color`, `default_prompt`), `policy.allow_implicit_invocation` (default `true`; `false` means only explicit `$skill` use) and `dependencies.tools` (entries with `type: mcp`, `value`, `description`, `transport`, `url`) (https://learn.chatgpt.com/docs/build-skills, redirected from https://developers.openai.com/codex/skills). **Despite its path, `agents/openai.yaml` is skill metadata, not an agent definition.**
- **This repo** carries 38 skills in `.claude/skills/` mirrored in `.agents/skills/`. Their frontmatter uses `name`, `description`, `disable-model-invocation` (23 of 38), `argument-hint` and `metadata`; each has an `agents/openai.yaml` with `interface` and, for manual-only skills, `policy.allow_implicit_invocation: false`. Some bundle reference files (`DEEPENING.md`) and shell scripts (`scripts/block-dangerous-git.sh`). `disable-model-invocation: true` and `allow_implicit_invocation: false` express the same thing.

## 2. Agent definitions

There is **no single open standard** for agent definitions. Three file formats are widely used, all "Markdown or TOML with a name, a description, instructions, tools and a model".

### Claude Code subagents (`.claude/agents/*.md`)

Markdown with YAML frontmatter; **the body becomes the subagent's whole system prompt** (https://code.claude.com/docs/en/sub-agents). Required: `name` (≤ 256 chars, no `:`; identity comes from it, not the filename) and `description` (when to delegate). Optional: `tools` (allowlist; omitted means inherit all), `disallowedTools` (denylist, applied first), `model` (`sonnet`, `opus`, `haiku`, `fable`, a full ID, or `inherit`), `permissionMode`, `maxTurns`, `skills` (preloaded, ≤ 32), `mcpServers`, `hooks`, `memory` (`user`/`project`/`local`), `color`, `effort`, `background`, `isolation: worktree`, `omitClaudeMd`, `initialPrompt`, `experimental`. Unknown fields are ignored. Locations by precedence: managed settings, `--agents` flag, `.claude/agents/`, `~/.claude/agents/`, plugin `agents/`.

### Codex custom agents (`.codex/agents/*.toml`)

One TOML file per agent in `~/.codex/agents/` or `.codex/agents/` (https://learn.chatgpt.com/docs/agent-configuration/subagents, redirected from https://developers.openai.com/codex/subagents). Required: `name`, `description`, `developer_instructions`. Optional: any `config.toml` key, named examples being `model`, `model_reasoning_effort`, `sandbox_mode` (e.g. `read-only`), `mcp_servers` and `[[skills.config]]` (`path`, `enabled`); omitted keys inherit from the parent.

### GitHub Copilot custom agents (`*.agent.md`)

Markdown with YAML frontmatter, body ≤ 30,000 chars (https://docs.github.com/en/copilot/reference/custom-agents-configuration). Required: `description`. Optional: `name`, `target` (`vscode` or `github-copilot`), `tools` (list; omitted or `["*"]` means all, `[]` none, `server/tool` for MCP), `model`, `disable-model-invocation`, `user-invocable`, `mcp-servers`, `metadata`; `infer` is retired. Tool aliases map across vendors: `execute` = `shell`/`Bash`, `read` = `Read`, `edit` = `Edit`/`Write`, `search` = `Grep`/`Glob`, `agent` = `Task`, `web` = `WebSearch`/`WebFetch`. VS Code also reads `argument-hint` and `handoffs`, which GitHub.com ignores. The usual directory is `.github/agents/` **[unverified: the reference page does not name the path]**.

### Formats that are not portable agent definitions

- **OpenAI Agents SDK**: agents are Python objects (`name`, `instructions`, `model`, `model_settings`, `tools`, `handoffs`, `handoff_description`, `mcp_servers`, guardrails, `output_type`, `hooks`); the docs describe no file format (https://openai.github.io/openai-agents-python/agents/). Nothing to import.
- **A2A Agent Card** (A2A 1.0.0): a JSON discovery document at `/.well-known/agent-card.json` with `name`, `description`, `supportedInterfaces`, `version`, `capabilities`, `defaultInputModes`, `defaultOutputModes`, `skills` (`id`, `name`, `description`, `tags`, optional `examples`, modes), optional `provider`, `securitySchemes`, `signatures`, `iconUrl` (https://a2a-protocol.org/latest/specification/). It advertises a remote agent and how to reach it; it carries no instructions. Relevant only if hux ever calls remote agents, which would then be external and untrusted, like MCP servers.
- **OpenClaw workspace files**: `AGENTS.md` (operating instructions), `SOUL.md` (persona, tone, boundaries), `IDENTITY.md` (name, vibe, emoji), `USER.md`, `MEMORY.md` and `skills/`, all plain Markdown without frontmatter (https://docs.openclaw.ai/concepts/agent-workspace). Closest in spirit to hux's SOUL; Hermes also reads `SOUL.md` and `AGENTS.md` as context files (see `hermes-agent.md` §5).

## 3. `AGENTS.md`

Plain Markdown at a repository root, "a README for agents": build and test commands, conventions, security notes. No required fields or headings. In monorepos the nearest file to the edited file wins, and chat instructions override it. Supported by Codex, Copilot's coding agent, Cursor, Gemini CLI, Jules, Zed, VS Code, Devin, Junie, Amp, Windsurf and others; stewarded by the Agentic AI Foundation under the Linux Foundation (https://agents.md/). It is project context, not an agent definition.

## 4. What the formats share, and what they lack

All agent formats reduce to: **name, description (when to delegate), instructions, tool list, model, MCP servers, skills**. Tool names are vendor-specific (`Read`, `Bash(git:*)`, `execute`), and the Copilot alias table is the only published cross-vendor mapping.

None of them express:
- which **data** an agent may see, or how sensitive it is;
- which **model endpoints** may see that data (a `model` field names a model, not a trust judgement);
- how much **human involvement** an action needs; the closest are Claude's `permissionMode` and Codex's `sandbox_mode`, both whole-agent switches;
- **who may delegate to whom**, or that permissions narrow along a chain;
- **provenance or signing** of the definition itself (Copilot tracks the Git SHA; A2A cards can be signed).

Two fields are **grants, not limits**, and must not be honoured as written by a policy-first system: `allowed-tools` in Claude Code skills (pre-approves tools) and `permissionMode: bypassPermissions`. Two features **run code on load**: Claude Code skill `hooks` and `` !`command` `` injection. Bundled `scripts/` assume a shell with the user's privileges. The ClawHub incident (see `openclaw.md`) shows that skill instructions alone can talk users into running malware.
