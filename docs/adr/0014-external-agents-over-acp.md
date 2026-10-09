# External agents are Roles reached over ACP, run on a Node and confined to a Workspace

A Role's work can be done by an outside coding agent, such as Claude Code, Codex or Gemini CLI, that the Gateway drives over the Agent Client Protocol (ACP). The agent process runs on the Execution Node inside one registered Workspace; the Gateway is the ACP client and reaches it through the Node's authenticated connection, the same way it reaches a Node-hosted Model endpoint (ADR 0001). We chose ACP over the Claude Agent SDK and `claude -p` because one Rust client covers every agent that speaks it, and its typed tool-call reports and permission requests map onto hux's Thread, Action tiers and Approvals. Details and sources: `docs/research/acp-and-external-agents.md`.

The external Role is still a Role (ADR 0005): it sits in the Delegation tree, gets only what the Member grants, and its results come back labelled as Workspace content. ACP asks and reports but does not confine, so the Node confines: the agent runs as its own OS user or in a container that sees only the Workspace, and its network goes through the Gateway's egress proxy.

## Consequences

- Every ACP permission request is decided by the Gateway against the Role's Action tiers. hux answers only `allow_once`, `reject_once` or `cancelled`; a Member's "always" becomes a narrow hux pre-approval, never the agent's own allowlist. No answer means no.
- The whole ACP session is stored in the Task's Thread, so Members can see what the agent changed and ran.
- An API key for the agent lives in the vault and is injected by the egress proxy or handed over per session. A subscription sign-in is done by the Member on the Node through the vendor's own flow; hux never reads, stores or relays it. This is the one credential a Node may hold beyond its device key.
- The outside agent's model provider is treated as a Model endpoint with a Trust level; a Workspace whose content is more sensitive than that may not be given to it.
- The reverse direction, hux's Chief served over ACP to editors, uses the same crate and runs as a paired Node.
