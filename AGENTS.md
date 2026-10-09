# hux

A household personal assistant that runs across many devices. Vocabulary: `GLOSSARY.md`. Architecture: `docs/design/architecture-overview.md`. Decisions: `docs/adr/`.

## Product principles

Every feature, screen, setting and sentence passes two questions before it ships:

1. **Is this really necessary?** Prefer the smaller version: fewer screens, fewer options, fewer words. A thing earns its place by serving a real use case.
2. **Would a layperson understand it?** Picture someone who has never configured a server. Label with everyday words and name things by what they do for the person ("Who can turn on the lights"), keeping protocol names, model names and jargon for expert mode.

**Writing copy** (UI text, examples, messages, docs for users): write what a thoughtful human product writer would ship. Use concrete, plausible content drawn from real use cases (a recipe, an email to a colleague, a reminder to buy milk). Every placeholder reads like real data. Keep it short, calm and specific; let the assistant's personality show through brevity, not exclamation marks.

**Simple and expert**: everything works in simple mode. Expert mode reveals detail and control; it never hides something a layperson needs.

**Models interpret, code validates** (ADR 0004): code never parses user input or repairs model output.

## Code

**Coding standards**: follow `CODING_STANDARDS.md` (rule IDs to cite in reviews; guardrail configs in `docs/design/guardrails.md`).

## Agent skills

### Issue tracker

Issues and specs live in GitHub Issues, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default triage labels (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
