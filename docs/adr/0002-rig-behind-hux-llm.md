# rig is the LLM SDK, isolated behind the hux-llm crate

We use the `rig` crate for model interaction (provider clients, streaming, tool calling, embeddings) rather than writing our own provider layer or using a thinner client such as async-openai. rig makes breaking changes often and has no concept of Labels, Trust levels or Approvals, so every `rig::*` import lives in `hux-llm` behind hux-owned interfaces, pinned to an exact version. The Gateway drives the agent loop itself: tool calls are returned to the Gateway for policy checks rather than executed inside rig.

## Consequences

- Capabilities rig does not cover (Decisions, guard models, wake word, voice activity) get their own interfaces in `hux-llm`, backed by other runtimes.
- Upgrading or replacing rig touches one crate.
