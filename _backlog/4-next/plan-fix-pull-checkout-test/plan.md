# Plan: Fix Pull Checkout Test

**ID:** `fix-pull-checkout-test`

**Status:** `DRAFT`

**Template:** `$DOMAINS/plans/templates/plan.tart`

**Has Context File:** `FALSE`

**Skill:** `write-plan`

**Purpose:** Make the `pullCheckout` failure-path test assert a real git-pull error, and stop the workspace-config fixture from writing `export default {{{` into `.art-workspace.mts`, so CI stops emitting the config-parse error while the suite stays green.

**Description:** Draft plan capturing the investigation of a `npm run test` anomaly in `@art-works/workspace-cli`: both `pullCheckout` tests pass while the CLI's config compiler reports `Expected identifier but found "{"` against a temp `art-repo-record-test-*/.art-workspace.mts` whose first line is `export default {{{`. Records the CI evidence, five ranked hypotheses — bad-config-as-exception-simulation, stale unmigrated fixture whose assertion accepts any throw, broken interpolation, benign noise from a neighbouring test, cross-test temp-dir leak — and the agreed fix direction: an explicit pull-error assertion plus a legitimate git-level failure simulation. Status `DRAFT`: the active hypothesis is confirmed first, then iterations and delegatable instructions are drafted.

## Mandatory Reading

::READ `$DOMAINS/plans/structures/plan.art` (Structure) — Describe the work-item changes through a series of iterations and commits with detailed instructions.

---

## Path Variables

| Variable     | Resolved Path                                  | Purpose                                                           |
| ------------ | ---------------------------------------------- | ----------------------------------------------------------------- |
| `$WORKSPACE` | Current working directory                      | Workspace root directory; hosts the domain source.                |
| `$PROJECT`   | `$WORKSPACE/checkouts/art-works`               | Where this plan and its backlogs live.                            |
| `$PACKAGE`   | `$WORKSPACE/checkouts/art-works/cli/workspace` | Package under test; hosts `src/private/git/pullCheckout.test.ts`. |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`                   | Planning domain resources.                                        |

## Summary

Draft plan investigating why `npm run test` in `$PACKAGE` emits a config-parse error (`export default {{{`) from a temp `.art-workspace.mts` while the `pullCheckout` failure-path test stays green; scoped to the pull failure-path assertion and its config fixture in Package: Art Workspace Cli; sourced from the Art Works backlog parking lot.

## Scope

One package: make the failure-path test in `src/private/git/pullCheckout.test.ts` assert the pull error explicitly, and fix or remove the fixture that writes an invalid `.art-workspace.mts` instead of simulating a failed pull through a broken config.

### (Scope) Package: Art Workspace Cli

**Record:** `$PACKAGE/_records/package.art`

**Role:** — Changes required.

**Partial:**

- `owner` — Project: Art Works
- `path` — `cli/workspace`
- `canonicalName` — `@art-works/workspace-cli`
- `bin` — `art-workspace-cli`
- `deployment` — NPM Package Deployment: Art Workspace Cli

**Changes:**

— Rewrite the `WHEN the pull fails it throws` assertion so it matches the git-pull error (type and/or message) instead of accepting any throw.
— Fix the config-fixture writer that emits `export default {{{` into `.art-workspace.mts`, or stop writing a config when simulating a pull failure.

**Operations:**

— Run `npm run test` in `$PACKAGE` and confirm the suite passes with no `[ERROR]` emission.
— Run `npm run ci` from `$WORKSPACE` on completion.

**Dependencies:**

- None.

## Execution Context

Execution occurs from `$WORKSPACE/`; project work happens in `$WORKSPACE/checkouts/art-works/`, with package work, the test suite, and the fixture under `$WORKSPACE/checkouts/art-works/cli/workspace/`.

## Upstream Work

- Parking Lot: Art Works Backlog – `$PROJECT/_backlog/_parking-lot.md`

## Required Skills

- `write-plan` – `$WORKSPACE/.agents/skills/write-plan/SKILL.md`
- `render-template` – `$WORKSPACE/.agents/skills/render-template/SKILL.md`

## Domains

- Plans – `$DOMAINS/plans/index.md`
- Work – `$DOMAINS/work/index.md`

## Resource Kinds in Scope

- Package – `$DOMAINS/packages/structures/package.art`

## Workflows

- Planning Work – `$DOMAINS/work/workflows/planning-work/workflow.art`
- Executing Work – `$DOMAINS/work/workflows/executing-work/workflow.art`

## Knowledge

- Guide: Noodlestan Workspace – `$WORKSPACE/_guide.md`
- Conventions: Writing Commit Message – `$WORKSPACE/knowledge/conventions/writing-commit-message.art`

---

## Items:

No iterations yet — this `DRAFT` records the investigation and hypotheses; iterations are drafted once the active hypothesis is confirmed.

## Work

### Next

Confirm the active hypothesis — run the package suite and inspect the config-fixture writer behind `src/private/git/pullCheckout.test.ts` — then draft iterations and write delegatable instructions.

### Blockers

- None.

---

## Operating Instructions

| Operation              | Source                 | Origin | Overrides | Workflow       | Purpose                                                                            |
| ---------------------- | ---------------------- | ------ | --------- | -------------- | ---------------------------------------------------------------------------------- |
| Setting Up             | `$WORKSPACE/_guide.md` |        |           | Executing Work | Prepare the execution environment.                                                 |
| Writing Commit Message | `$WORKSPACE/_guide.md` |        |           | Planning Work  | Write standardized message according to context conventions.                       |
| Verifying Completion   | `$WORKSPACE/_guide.md` |        |           | Executing Work | Confirms that the work item has been completed and satisfies its intended outcome. |

::READ `$WORKSPACE/knowledge/conventions/writing-commit-message.art` — Commit message conventions.

---

## Coordination

### Not In Scope

- **Records-migration backlog** — `Migrate the remaining record kinds to @art-js/records` lives in the same parking lot and may share the unmigrated-fixture root cause, but stays tracked as its own item.
- **Other test suites** — only `src/private/git/pullCheckout.test.ts` and the config fixture that emits the parse error are in scope; unrelated package tests keep their current behaviour.
- **Test-runner or CI rework** — no changes to the test framework, runner configuration, or CI pipeline structure.

### Evidence

- **Green failure-path test** — `WHEN the pull fails it throws` passes (500ms) in the same run where the config error appears.
- **Malformed config** — the compiler reports `Expected identifier but found "{"` at `art-repo-record-test-rzyHH1/.art-workspace.mts:1:16` (under `/private/tmp/`), first line `export default {{{`.
- **Config compilation** — `Package Dependency: ESBuild` — "Workspace configs are expressed in `.mts` modules and need to be compiled by CLI", so a broken fixture surfaces as exactly this diagnostic.

### Findings

- **H1 — Bad config as exception simulation** _(user-flagged)_ — the test may write a malformed `.art-workspace.mts` on purpose to force an exception; a bad way to simulate a failed pull.
- **H2 — Stale fixture, silent wrong-throw** _(user-flagged, most likely)_ — the fixture was never migrated with the previous config/records work; the caught exception is the config-parse error, not the pull error; the assertion passes on any throw, so nobody notices.
- **H3 — Broken interpolation** — the writer composes `export default {` plus a stringified object, or leaves `{{{placeholder}}}` unrendered, producing the literal `{{{`.
- **H4 — Benign neighbouring noise** — the emission comes from another test's negative-path fixture; the exit code stays green and `pullCheckout` is uninvolved.
- **H5 — Cross-test isolation leak** — the `art-repo-record-test-*` temp dir is created or reused across tests, so `pullCheckout` observes a config written by the records test.

### Decisions

- **Make the assertion explicit** — the failure-path test must match the pull error (type and/or message); a config error must never satisfy it.
- **Simulate the pull failure through git mechanics** — break the origin/remote conditions to fail the pull; never rely on an invalid `.art-workspace.mts`.

### Knowledge to Update

- None yet — revisit after hypothesis confirmation; if the fixture writer is shared, document config-fixture creation in the package's test docs.

### Follow Ups

- **Audit sibling tests** for bare `toThrow()` assertions that could pass on unrelated errors.
- **Cross-check the records-migration item** — if the config writer was never migrated, `Migrate the remaining record kinds to @art-js/records` likely carries the same defect.

### Feedback

- None yet.
