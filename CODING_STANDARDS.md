# Coding standards

Rules for code in this repo, written so a reviewer (human or agent) can check each one. Cite rules by ID in review comments. "Checked by" names the mechanism; the configs live in `docs/design/guardrails.md`. When a rule and a passing CI disagree, the rule wins and the guardrail gets fixed.

Vocabulary: `GLOSSARY.md`. Decisions: `docs/adr/`. Layout: `docs/design/phase-0-plan.md`.

## Architecture (from the ADRs)

- **A1** No `rig` import (`rig::`, `use rig`) outside `crates/hux-llm`, and `hux-llm` never re-exports rig types in its public API (ADR 0002). *Checked by:* CI script `check-boundaries`, cargo-deny `wrappers`, reviewer for re-exports.
- **A2** `hux-transport` moves opaque bytes: it does not depend on `hux-protocol`, `serde` or `serde_json`, and never inspects message contents (ADR 0003). *Checked by:* CI script `check-boundaries` (direct deps), reviewer.
- **A3** `hux-protocol` does no I/O: no `tokio` networking, `axum`, `tungstenite` or `hux-transport` dependency (ADR 0003). *Checked by:* CI script `check-boundaries`.
- **A4** Code never parses what people type or say: no regexes, keyword lists, command prefixes or string heuristics on user input (ADR 0004). *Checked by:* clippy `disallowed-types`/`disallowed-methods` (`regex`), CI direct-dep check, reviewer.
- **A5** Code never repairs model output: no stripping code fences, fixing JSON, or retrying with patched text; a failed validation goes back to the model or the Member (ADR 0004). *Checked by:* reviewer.
- **A6** Tool arguments and structured model output are deserialised into typed structs with a JSON Schema and validated against it and policy before use (ADR 0004). *Checked by:* reviewer, seam tests.
- **A7** Only the Gateway talks to the internet; Node code never opens outbound connections other than to its Gateway (ADR 0001). *Checked by:* reviewer.
- **A8** Protocol types are defined once in Rust; `schemas/` and the web app's TypeScript types are generated and checked in, never hand-edited (ADR 0003). *Checked by:* CI stale-schema step.

## Rust

- **R1** Edition 2024, the toolchain pinned in `rust-toolchain.toml`, every crate opts into `[lints] workspace = true`. *Checked by:* CI (`cargo clippy -- -D warnings`), reviewer for the opt-in.
- **R2** Libraries return typed errors built with `thiserror`; `anyhow` is used only in `apps/` binaries and `xtask`. *Checked by:* cargo-deny `wrappers` on `anyhow`, reviewer.
- **R3** No `unwrap`, `expect`, `panic!`, `todo!`, `unimplemented!` or `dbg!` outside tests. *Checked by:* clippy `unwrap_used`, `expect_used`, `panic`, `todo`, `unimplemented`, `dbg_macro`.
- **R4** No `println!`/`eprintln!`; log with `tracing` (structured fields, not formatted strings). *Checked by:* clippy `print_stdout`, `print_stderr`.
- **R5** Never log secrets, keys or message bodies at `info` or above. *Checked by:* reviewer.
- **R6** Async uses `tokio`; never block inside async code (`std::thread::sleep`, blocking I/O, `std::sync::Mutex` held across `.await`). *Checked by:* clippy `disallowed-methods` (`std::thread::sleep`), `await_holding_lock`, reviewer for blocking I/O.
- **R7** No `unsafe` code. *Checked by:* rustc `unsafe_code = "forbid"`.
- **R8** Every `#[allow]` carries `reason = "..."`; prefer `#[expect]`. *Checked by:* clippy `allow_attributes_without_reason`.
- **R9** Logic lives in `crates/`; `apps/` only parse config, wire crates together and start them. *Checked by:* reviewer.
- **R10** A new crate is created only when a seam has, or will soon have, a second adapter or consumer; until then it is a module. *Checked by:* reviewer (the commit body names the second adapter or consumer).
- **R11** Type, module and function names use `GLOSSARY.md` terms and never the listed "Avoid" words (`Member`, not `User`; `Node`, not `Client`; `Conversation`, not `Chat`). *Checked by:* reviewer.
- **R12** New dependencies are added to `[workspace.dependencies]` and must pass licence, advisory and source checks. *Checked by:* cargo-deny.
- **R13** Code is formatted with `rustfmt` using the checked-in `rustfmt.toml`. *Checked by:* CI `cargo fmt --check`.

## TypeScript and React (`apps/web`)

- **T1** TypeScript in strict mode with the flags in `guardrails.md`; `tsc --noEmit` passes. *Checked by:* CI typecheck.
- **T2** No `any`, no `@ts-ignore`, no non-null assertions (`!`); narrow `unknown` instead. *Checked by:* Biome `noExplicitAny`, `noTsIgnore`, `noNonNullAssertion`.
- **T3** Protocol types are imported from the generated module only; never write a TypeScript type that mirrors a Rust type. *Checked by:* CI stale-schema step, reviewer.
- **T4** Data from the Gateway is validated at the boundary before use, not cast. *Checked by:* reviewer.
- **T5** Style with Tailwind utility classes; no CSS-in-JS and no inline `style` except for computed values. *Checked by:* reviewer.
- **T6** No `dangerouslySetInnerHTML`; render text as text. *Checked by:* Biome `noDangerouslySetInnerHtml`.
- **T7** Code is formatted and linted by Biome with the checked-in config. *Checked by:* CI `biome ci`.

## UI copy

- **U1** Every label, message, placeholder and empty state follows the product principles in `AGENTS.md`: necessary, understandable by a layperson, plausible real content, calm and short. *Checked by:* reviewer.
- **U2** Simple mode shows no protocol names, model names or jargon; those appear only in expert mode. *Checked by:* reviewer.
- **U3** No filler or marketing phrases in our UI copy (lorem ipsum, "seamless", "unlock", "supercharge", "effortless", "AI-powered"); a genuine use such as a door Device's "Unlock" is marked `copy-check: allow`. *Checked by:* CI script `check-copy`.

## Testing

- **X1** Seams are built test-first: write the failing test against the interface, then the adapter. *Checked by:* reviewer (tests land in the same commit as the code).
- **X2** The default suite is fully offline: no real model endpoint, no network, no external services. Use the scripted/recorded fake at the `hux-llm` seam and the in-memory transport. *Checked by:* CI runs the suite with no `HUX_TEST_*` endpoint configured, reviewer.
- **X3** Any test that touches a real model endpoint or the network is `#[ignore]` with a reason and runs only on demand (`cargo nextest run --run-ignored only`), configured by `HUX_TEST_*` env vars. *Checked by:* reviewer.
- **X4** The whole workspace test run (warm build) finishes in under 30 seconds and no single test takes more than 2 seconds; a slow test is fixed or moved behind `#[ignore]`. *Checked by:* nextest `slow-timeout` and `global-timeout` (hard stop at 1 min), reviewer.
- **X5** Every transport adapter passes the shared transport conformance suite; a new adapter is not done until it does. *Checked by:* CI, reviewer that the suite is invoked for the adapter.
- **X6** Protocol messages round-trip through the codec in tests. *Checked by:* CI.
- **X7** Tests assert behaviour through public interfaces, not private internals; no sleeps for timing, use `tokio::time::pause`. *Checked by:* reviewer.

## Commits

Single developer: commit directly to `main`. Branches are only for throwaway prototypes; no PRs for routine changes.

- **C1** Small, focused commits: one logical change each, and `main` builds and passes the local checks after every commit. *Checked by:* CI on push to `main`, reviewer.
- **C2** Commit subjects use Conventional Commits with the crate or app as scope, imperative mood, under 72 characters (`feat(hux-transport): add in-memory adapter`). *Checked by:* reviewer.
- **C3** The commit body names the issue (`Refs #12`) when there is one; a change to an ADR-governed boundary cites the ADR, and overturning one needs a new ADR first. *Checked by:* reviewer.
- **C4** Generated files (`schemas/`, generated TS) change only in the same commit as the Rust change that caused them. *Checked by:* CI stale-schema step.
- **C5** No commented-out code, no new `TODO` without an issue number. *Checked by:* reviewer.
- **C6** Speed matters most: ship the smallest working version, then iterate; do not add abstractions, options or crates for hypothetical needs (see R10). *Checked by:* reviewer.
