# Guardrails (install in Phase 0, slice 1)

Status: **proposal**. The mechanical checks behind `CODING_STANDARDS.md`. Install them with the workspace skeleton (slice 1) so the first line of production code is already checked. Rule IDs in brackets refer to `CODING_STANDARDS.md`.

Verification: lint names, `clippy.toml` keys, `rustfmt.toml` keys and `.config/nextest.toml` keys were run against clippy 0.1.95, rustfmt 1.9.0 and cargo-nextest 0.9.143 on 2026-10-09 (all of them reject or warn on unknown keys, and none did). The `tsconfig` flags were accepted by TypeScript 7.0.2. The grep patterns were run against sample files. Items marked **[unverified]** were taken from docs and not executed.

Workflow assumption: one developer commits straight to `main`. There is no PR gate, so the same checks run **locally before every commit** (`scripts/check.sh`) and in CI on every push to `main`. A red `main` is fixed before anything else.

## 1. Toolchain and formatting

`rust-toolchain.toml` [R1]:

```toml
[toolchain]
channel = "1.95.0"          # bump deliberately; newest verified locally on 2026-10-09
components = ["rustfmt", "clippy"]
profile = "minimal"
```

`rustfmt.toml` [R13] (stable options only):

```toml
edition = "2024"
style_edition = "2024"
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
```

`.gitattributes` (Windows and Linux CI must agree with `newline_style`):

```
* text=auto eol=lf
*.png binary
```

## 2. Workspace lints [R1, R3, R4, R7, R8]

In the root `Cargo.toml`. Every crate adds `[lints] workspace = true`. CI runs clippy with `-D warnings`, so `warn` fails CI while staying usable during local iteration.

```toml
[workspace.package]
edition = "2024"
rust-version = "1.95"
license = "MIT OR Apache-2.0"
publish = false

[workspace.lints.rust]
unsafe_code = "forbid"
rust_2018_idioms = { level = "warn", priority = -1 }

[workspace.lints.clippy]
all = { level = "warn", priority = -1 }     # includes await_holding_lock
unwrap_used = "warn"
expect_used = "warn"
panic = "warn"
todo = "warn"
unimplemented = "warn"
dbg_macro = "warn"
print_stdout = "warn"
print_stderr = "warn"
exit = "warn"                                # return an error from main instead
mem_forget = "warn"
string_slice = "warn"                        # byte-slicing text panics on non-ASCII
wildcard_imports = "warn"                    # `use super::*` in tests stays allowed
unused_async = "warn"
let_underscore_future = "warn"
allow_attributes_without_reason = "warn"
```

`clippy.toml` at the repo root [R3, R6, A4]:

```toml
allow-unwrap-in-tests = true
allow-expect-in-tests = true
allow-panic-in-tests = true
allow-print-in-tests = true
allow-dbg-in-tests = true

disallowed-methods = [
  { path = "std::thread::sleep", reason = "blocks the tokio runtime; use tokio::time::sleep" },
  { path = "regex::Regex::new", reason = "ADR 0004: models interpret input, code never parses it", allow-invalid = true },
]
disallowed-types = [
  { path = "regex::Regex", reason = "ADR 0004: models interpret input, code never parses it", allow-invalid = true },
  { path = "regex::bytes::Regex", reason = "ADR 0004: models interpret input, code never parses it", allow-invalid = true },
  { path = "fancy_regex::Regex", reason = "ADR 0004: models interpret input, code never parses it", allow-invalid = true },
]
```

`allow-invalid = true` keeps clippy quiet while `regex` is not a dependency. If a legitimate non-input use appears (for example validating a config value), the call site carries `#[expect(clippy::disallowed_types, reason = "...")]` and the reviewer checks it is not user input.

Not chosen: `indexing_slicing` and `unreachable_pub` (too noisy for the speed we want), and banning `std::sync::Mutex` (fine for short critical sections; `await_holding_lock` already catches the real bug).

## 3. cargo-deny [R2, R12, A1]

`deny.toml` at the repo root. Key names come from the cargo-deny docs **[unverified: not run, cargo-deny is not installed locally]**. Run `cargo deny check` once after installing and fix any key the tool rejects.

```toml
[graph]
all-features = true

[advisories]
yanked = "deny"
unmaintained = "workspace"     # fail only for our direct dependencies
ignore = []                    # each entry: { id = "RUSTSEC-…", reason = "…" }

[licenses]
confidence-threshold = 0.9
# Compatible with shipping hux as MIT OR Apache-2.0. Add more only with a reason in the commit.
allow = [
  "MIT",
  "Apache-2.0",
  "Apache-2.0 WITH LLVM-exception",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "ISC",
  "Zlib",
  "Unicode-3.0",
  "CC0-1.0",
]
# MPL-2.0 is deliberately absent: allowed only per crate via [[licenses.exceptions]].
private = { ignore = true }    # our own crates are publish = false

[bans]
multiple-versions = "warn"
wildcards = "deny"
allow-wildcard-paths = true    # workspace path deps are fine
deny = [
  # ADR 0002: only hux-llm may depend on rig.
  { crate = "rig-core", wrappers = ["hux-llm"], reason = "ADR 0002: rig lives behind hux-llm" },
  # R2: anyhow only in binaries. Add third-party parents here if a dependency pulls it in.
  { crate = "anyhow", wrappers = ["<gateway-binary-package>", "xtask"], reason = "libraries use thiserror" },
  # ADR 0004: no input parsing in our code. Third-party parents get listed as wrappers when needed.
  { crate = "fancy-regex", reason = "ADR 0004" },
]

[sources]
unknown-registry = "deny"
unknown-git = "deny"
```

Notes:
- `wrappers` lists the only crates allowed to depend on the banned crate directly. Any other parent, including a third-party one, fails the check. That is right for `rig-core`. For `anyhow`, a dependency that uses it would fail too; add that dependency to `wrappers` with a comment.
- `regex` itself is not banned, because common dependencies (`tracing-subscriber` with `env-filter`) pull it in. The direct-dependency check in section 4 and `clippy.toml` cover our own code.
- Pin rig exactly in `[workspace.dependencies]`: `rig-core = "=x.y.z"` (ADR 0002).
- **Open point:** the plan names both `crates/hux-gateway` (library) and the `apps/gateway` binary `hux-gateway`. Two packages cannot share a name, so pick the binary package name in slice 1 (for example `hux-gateway-app` with `[[bin]] name = "hux-gateway"`; the plan's `cargo run -p hux-gateway` then becomes `cargo run --bin hux-gateway`) and put it in the `anyhow` wrappers.

## 4. Boundary check script [A1, A2, A3, A4]

`scripts/check-boundaries.sh` (bash; runs in CI on Linux and locally in Git Bash). It moves into `cargo xtask check` once xtask exists in slice 2. The grep pattern and the `cargo tree` format were tested.

```bash
#!/usr/bin/env bash
set -euo pipefail
fail=0

# A1: rig only inside crates/hux-llm (ADR 0002).
if git grep -nE '(^|[^A-Za-z0-9_])rig::|(^|[^A-Za-z0-9_])use[[:space:]]+rig([[:space:]]|;|$)|extern[[:space:]]+crate[[:space:]]+rig' \
     -- '*.rs' ':!crates/hux-llm/**'; then
  echo "A1: rig is used outside crates/hux-llm (ADR 0002)"; fail=1
fi

# Direct (depth 1) normal dependencies of one package, as "name" lines.
direct_deps() {
  cargo tree -p "$1" -e normal --depth 1 --prefix none --format '{p}' --locked \
    | tail -n +2 | awk '{print $1}' | sort -u
}
forbid() {  # forbid <package> <rule> <dep>...
  local pkg=$1 rule=$2; shift 2
  local deps; deps=$(direct_deps "$pkg")
  for d in "$@"; do
    if grep -qx "$d" <<<"$deps"; then echo "$rule: $pkg must not depend on $d"; fail=1; fi
  done
}

# A2: transport moves opaque bytes (ADR 0003).
forbid hux-transport A2 hux-protocol serde serde_json
# A3: protocol does no I/O (ADR 0003).
forbid hux-protocol A3 hux-transport tokio axum tokio-tungstenite tungstenite
# A4: no regex crates as direct dependencies of our crates (ADR 0004).
for pkg in $(cargo metadata --no-deps --format-version 1 --locked | jq -r '.packages[].name'); do
  forbid "$pkg" A4 regex fancy-regex
done

exit $fail
```

Packages that do not exist yet make `cargo tree -p` fail; comment those lines in as each crate lands. `jq` is preinstalled on GitHub's Ubuntu runners.

## 5. Copy check [U3]

`scripts/check-copy.sh` scans our own UI source and copy, never user input or test fixtures of user input. The pattern was tested: it matches case-insensitively on whole words, so "unlocked" or "seamlessness" are not flagged, but "Unlock", "supercharged" and "AI-Powered" are.

```bash
#!/usr/bin/env bash
set -euo pipefail
pattern='lorem ipsum|seamless(ly)?|unlock|supercharge[ds]?|effortless(ly)?|ai-powered'
hits=$(git grep -n -i -w -E "$pattern" -- \
         'apps/web/src/**' 'apps/web/index.html' \
         ':!apps/web/src/gen/**' ':!**/*.test.*' \
       | grep -v 'copy-check: allow' || true)
if [[ -n "$hits" ]]; then
  echo "$hits"
  echo "U3: filler phrase in UI copy. Rewrite it per AGENTS.md product principles."
  exit 1
fi
```

- A real use (a Device action "Unlock the front door") is allowed with a trailing comment `// copy-check: allow (device action)` on that line.
- Extend the paths as more copy sources appear (string tables, Gateway-generated spoken fallbacks). `apps/ui-prototype` is throwaway and not scanned.

## 6. Tests: offline and fast [X2, X3, X4]

- Run tests with cargo-nextest (per-test timeouts) plus `cargo test --doc` (nextest does not run doctests).
- `.config/nextest.toml` (keys verified with nextest 0.9.143):

```toml
[profile.default]
slow-timeout = { period = "2s", terminate-after = 3 }   # flag at 2 s, kill at 6 s
global-timeout = "1m"                                    # hard ceiling for the whole run
fail-fast = false

[profile.ci]
slow-timeout = { period = "2s", terminate-after = 3 }
global-timeout = "1m"
fail-fast = false
```

- The stated budget (X4) is under 30 s for the warm workspace run; the 1 min `global-timeout` is the hard stop. When the run drifts over 30 s, find the slow tests (`cargo nextest run` prints `SLOW`) before adding features.
- Offline by construction: the default suite uses the `hux-llm` fake (scripted or recorded responses) and the in-memory transport. CI sets no `HUX_TEST_*` variables, so a test that needs a real endpoint must be `#[ignore = "needs HUX_TEST_LLM_URL"]` or it fails. Run on demand with `cargo nextest run --run-ignored only`.
- Not mechanised: blocking the network inside tests. CI runners have network access for dependency downloads, so this relies on the fakes and the reviewer.

## 7. TypeScript (`apps/web`) [T1, T2, T6, T7]

`apps/web/tsconfig.json` compiler options (accepted by TypeScript 7.0.2, and `noUncheckedIndexedAccess` confirmed to fire):

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noPropertyAccessFromIndexSignature": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "useUnknownInCatchVariables": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

**Linter: Biome, not ESLint.** One fast binary does both formatting and linting, with no plugin tree to keep in sync. That fits "speed of delivery matters most". The cost is weaker type-aware linting. Floating-promise checks are still in Biome's nursery, so revisit typescript-eslint only if promise bugs show up.

`apps/web/biome.json`. Rule names and groups were checked against the Biome rules index. The file layout follows Biome 2.x **[unverified: run `biome ci` once after install and fix any key it rejects]**:

```json
{
  "$schema": "./node_modules/@biomejs/biome/configuration_schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src/**", "!src/gen/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noTsIgnore": "error",
        "noImplicitAnyLet": "error",
        "noEvolvingTypes": "error",
        "noConsole": "error"
      },
      "style": { "noNonNullAssertion": "error", "useImportType": "error" },
      "security": { "noDangerouslySetInnerHtml": "error" },
      "correctness": { "useExhaustiveDependencies": "error", "useHookAtTopLevel": "error" },
      "nursery": { "noFloatingPromises": "error" }
    }
  }
}
```

Pin `@biomejs/biome` to an exact version (`pnpm add -D -E @biomejs/biome`). A nursery rule can be renamed between minors; the pin keeps that a deliberate upgrade.

## 8. Generated protocol types are never stale [A8, T3, C4]

Activates in slice 2, when `cargo xtask gen-schemas` exists. Rust types → `schemas/*.json` (schemars) → `apps/web/src/gen/protocol.ts`. The schema-to-TS generator is chosen in slice 2; `json-schema-to-typescript` is the default candidate **[unverified]**. One command regenerates both, and CI fails if the result differs from what is committed, including new untracked files:

```bash
cargo xtask gen-schemas          # writes schemas/ and apps/web/src/gen/
if [[ -n "$(git status --porcelain -- schemas apps/web/src/gen)" ]]; then
  git status --porcelain -- schemas apps/web/src/gen
  git diff -- schemas apps/web/src/gen | head -50
  echo "A8: generated protocol files are stale. Run 'cargo xtask gen-schemas' and commit the result."
  exit 1
fi
```

The generated TS file starts with a `// GENERATED by cargo xtask gen-schemas. Do not edit.` header, and Biome ignores `src/gen/**`.

## 9. One local entry point, same as CI

`scripts/check.sh` runs before every commit to `main` and is what CI runs. It is ordered fastest first, so it fails early:

```bash
#!/usr/bin/env bash
set -euo pipefail
cargo fmt --all --check
scripts/check-boundaries.sh
scripts/check-copy.sh
cargo clippy --workspace --all-targets --locked -- -D warnings
cargo nextest run --workspace --locked
cargo test --doc --workspace --locked
cargo deny check
pnpm --dir apps/web exec biome ci .
pnpm --dir apps/web exec tsc --noEmit
# slice 2+: stale-schema check from section 8
```

Optionally wire it as a git `pre-push` hook. A pre-commit hook would slow small commits, which goes against the speed goal.

## 10. CI (GitHub Actions, on push to `main`)

`.github/workflows/ci.yml`. Action major versions are as known at writing **[unverified: bump to current majors on install]**.

```yaml
name: ci
on:
  push: { branches: [main] }
  workflow_dispatch:
concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }

jobs:
  rust:
    strategy:
      fail-fast: false
      matrix: { os: [ubuntu-latest, windows-latest] }
    runs-on: ${{ matrix.os }}
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: rustup show            # installs the toolchain from rust-toolchain.toml
      - uses: Swatinem/rust-cache@v2
      - uses: taiki-e/install-action@v2
        with: { tool: cargo-nextest }
      - run: cargo fmt --all --check
      - run: cargo clippy --workspace --all-targets --locked -- -D warnings
      - run: cargo nextest run --workspace --locked --profile ci
      - run: cargo test --doc --workspace --locked

  checks:                           # Linux only: repo-shape checks
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - run: rustup show
      - uses: EmbarkStudios/cargo-deny-action@v2
      - run: scripts/check-boundaries.sh
      - run: scripts/check-copy.sh
      # slice 2+: stale-schema step (section 8)

  web:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: lts/*, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --dir apps/web exec biome ci .
      - run: pnpm --dir apps/web exec tsc --noEmit
      - run: pnpm --dir apps/web build
```

## Left to the reviewer

These rules have no mechanical check, by design or for now. Reviewers check them every time: A5 (no repair of model output), A6 (schema-validated tool arguments), A7 (Nodes never call out), R5 (no secrets in logs), R9 and R10 (thin apps, no premature crates), R11 (glossary names), T3 to T5, U1 and U2 (copy quality beyond the filler list), and X1 and X7.
