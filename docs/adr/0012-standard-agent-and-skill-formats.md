# Roles and Skills import the standard agent and skill formats, with permissions granted only by Members

hux reads the formats the ecosystem already shares, so proven agents and skills can be dropped in: Agent Skills (`SKILL.md`, agentskills.io, including the Claude Code and Codex extensions and `agents/openai.yaml`) become Skills, and Claude Code subagents (`.claude/agents/*.md`), Codex custom agents (`.codex/agents/*.toml`) and GitHub Copilot custom agents (`*.agent.md`) become Roles, their instructions forming the SOUL. Field details are in `docs/research/agent-and-skill-formats.md`. We chose import over a hux-only format because these files already carry the know-how worth having; we chose translation over running them as written because none of the formats express data sensitivity, Trust levels, Action tiers or Delegation limits.

An imported file only ever *asks*. Its tool list, model and MCP servers are requests shown to the Member in plain words; the Role gets nothing the Member does not grant, and nothing wider than the Role it sits under (ADR 0005). Fields that grant or run code as written (`allowed-tools` as pre-approval, `permissionMode`, `sandbox_mode`, `hooks`, `` !`command` `` injection) are ignored. Bundled skill scripts run only as Wasm components inside the Plugin sandbox with capabilities the Member grants (ADR 0009), or not at all; this refines ADR 0009's "Skills are instruction-only".

## Consequences

- Import adds what the formats lack, with deny-by-default values: model policy against the Member's Model endpoints and their Trust levels, data clearance by Label and Visibility, an Action tier per granted tool, a place in the Delegation tree, and a budget.
- Imported text is third-party content: hash-pinned at install, labelled with its source, and re-approved when it changes.
- A2A Agent Cards and OpenAI Agents SDK code are not imported; `AGENTS.md` is read as Workspace context, never as a Role.
