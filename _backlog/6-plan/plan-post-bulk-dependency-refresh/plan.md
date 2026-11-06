# Plan: Post-Bulk Dependency Refresh

**ID:** `post-bulk-dependency-refresh`

**Status:** `READY`

**Template:** `$DOMAINS/plans/templates/plan.tart`

**Has Context File:** `FALSE`

**Skill:** `write-plan`

**Purpose:** Declare the undeclared `@art-md/primitives` type dependency and refresh the `@art-md/codec` pin in one controlled pass after the global-install bulk lands, so dependency changes never mix into migration commits.

**Description:** Small two-iteration plan extracted from the parking-lot PENDING item "Post-bulk dependency refresh" (commit `a12f5f5`): add `@art-md/primitives` to `cli/workspace/package.json` — direct type imports in `src/private/context/types.ts` and `createWorkspaceContext.ts` currently resolve it only transitively at `0.0.6` — then evaluate and apply the `@art-md/codec` bump from pinned `0.0.3` to `0.0.5`, each with its own green-CI commit and a revert path, executed strictly after all five `plan-art-work-cli-global-install` iterations are delivered.

## Mandatory Reading

::READ `$DOMAINS/plans/structures/plan.art` (Structure) — Describe the work-item changes through a series of iterations and commits with detailed instructions.

---

## Path Variables

| Variable     | Resolved Path                    | Purpose                                            |
| ------------ | -------------------------------- | -------------------------------------------------- |
| `$WORKSPACE` | Current working directory        | Workspace root directory                           |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`     | Domain resources directory                         |
| `$PROJECT`   | `$WORKSPACE/checkouts/art-works` | Art Works repository; hosts this plan and backlogs |
| `$PACKAGE`   | `$PROJECT/cli/workspace`         | The package whose manifest changes                 |

## Summary

Add `@art-md/primitives` as a declared runtime dependency and move `@art-md/codec` from `0.0.3` to `0.0.5` in Package: Art Workspace Cli — two isolated, individually revertable manifest commits with full CI after each, sequenced strictly after the `plan-art-work-cli-global-install` bulk so migration history stays dependency-clean; sourced from the PENDING item in `$PROJECT/_backlog/_parking-lot.md` (commit `a12f5f5`).

## Scope

Two manifest changes in `$PACKAGE/package.json` and its lockfile: declare `@art-md/primitives` at the version currently resolving (`0.0.6` — this iteration only makes the existing resolution explicit), and bump `@art-md/codec` to `0.0.5` after checking what changed, reverting with a recorded reason if CI or compatibility objects. No other dependency moves; execution is gated on the bulk landing.

### (Scope) Package: Art Workspace Cli

**Record:** `$PACKAGE/_records/package.art`

**Role:** — Changes required.

**Partial:**

- `owner` — Project: Art Works
- `path` — `cli/workspace`
- `canonicalName` — `@art-works/workspace-cli`

**Changes:**

— Add `@art-md/primitives` to runtime dependencies at `0.0.6`; update the `package.art` dependency records.
— Evaluate and apply `@art-md/codec` `0.0.3` → `0.0.5`, or revert with the decision recorded; sync the record if applied.

**Operations:**

— Run `npm run ci` from `$PROJECT` after each change; workspace-aware `npm install -w` only.

**Dependencies:**

- Gate: all five iterations of `plan-art-work-cli-global-install` delivered — the parking-lot sequencing (`a12f5f5`), not a blocker.

## Execution Context

Execution occurs from `$WORKSPACE/`; manifest work happens in `$PROJECT` on branch `main`, installing with workspace-aware commands from the `$PROJECT` root (`npm install {pkg}@{version} -w @art-works/workspace-cli`) — never a bare `npm install` inside `$PACKAGE`, which shadows the monorepo resolution and breaks the build.

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
- Guide: Art Works – `$PROJECT/_guide.md`
- Conventions: Writing Commit Message – `$WORKSPACE/knowledge/conventions/writing-commit-message.art`

---

## Items:

| Iteration / Instructions                 | Status  |
| ---------------------------------------- | ------- |
| Iteration: Declare Primitives Dependency | `READY` |
| Iteration: Bump Art MD Codec             | `READY` |

### Iteration: Declare Primitives Dependency

**Id:** `declare-primitives-dependency`

**Status:** `READY`

**Purpose:** Make the direct type dependency explicit so the manifest matches the imports.

**Description:** Add `@art-md/primitives` to the package's runtime dependencies at the version resolving today, replacing the accidental transitive resolution through `@art-lib/fs-records`, and prove the two type imports resolve from the declared dependency.

**Instructions Mode:** `INSTRUCTIONS_INLINED_IN_ITERATION`

**Changes:**

- Confirm the current resolution: `npm ls @art-md/primitives` from `$WORKSPACE` (expected `0.0.6`, transitive via `@art-lib/fs-records`); target that same version — newer releases are out of scope for this iteration.
- Add it to `dependencies` in `$PACKAGE/package.json` with `npm install @art-md/primitives@0.0.6 -w @art-works/workspace-cli` from the `$PROJECT` root.
- Verify `npm ls @art-md/primitives` now lists it directly under `@art-works/workspace-cli`.
- Update the dependency records in `$PACKAGE/_records/package.art` to match the manifest.

**Instructions:**

Execute the Changes listed above.

Before starting:

- Run `npm ci` from `$WORKSPACE` if the tree is not freshly installed; capture `npm ls @art-md/primitives` output for the report.

Validate that:

- `npm ls @art-md/primitives` shows a direct dependency of `@art-works/workspace-cli`, not transitive-only.
- `npm run lint && npm run build` pass in `$PACKAGE` — the `ArtCodec` imports in `src/private/context/types.ts` and `src/private/context/createWorkspaceContext.ts` resolve from the declared dependency.

After executing:

- Run `npm run ci` from `$PROJECT`; commit with the blueprint below.

**Dependencies:**

- None — the bulk gate is recorded at plan level.

#### Commits:

| ID                              | Repository / Checkout / Branch  | Policy       | Hash  | Status        |
| ------------------------------- | ------------------------------- | ------------ | ----- | ------------- |
| `declare-primitives-dependency` | Art Works / `$PROJECT` / `main` | `AUTONOMOUS` | (TBD) | `PLACEHOLDER` |

##### Commit: `declare-primitives-dependency`

**Repository:** Art Works

**Message:**

```text
refactor(workspace-cli): Declare @art-md/primitives dependency.
```

### Iteration: Bump Art MD Codec

**Id:** `bump-art-md-codec`

**Status:** `READY`

**Purpose:** Take the newer codec deliberately — with CI proving compatibility — or record why the pin stays.

**Description:** Evaluate `@art-md/codec@0.0.5` against the current `0.0.3` pin: check what changed between the versions, bump the pin, run the full package verification, and either land the bump or revert with the reason captured in the worker report.

**Instructions Mode:** `INSTRUCTIONS_INLINED_IN_ITERATION`

**Changes:**

- Read what changed between `0.0.3` and `0.0.5` (`npm info @art-md/codec`, the package changelog or release notes) and list any breaking changes.
- Bump with `npm install @art-md/codec@0.0.5 -w @art-works/workspace-cli` from the `$PROJECT` root.
- Run the full package verification in `$PACKAGE`: `npm run lint`, `npm run build`, `npm run test`, `npm run test:integration`.
- If CI fails or a breaking change is identified: revert to `0.0.3`, restore the `package.art` record, and report the decision with evidence instead of landing the bump.
- If green: update the codec dependency record in `$PACKAGE/_records/package.art`.

**Instructions:**

Execute the Changes listed above.

Before starting:

- Capture `npm ls @art-md/codec` and the current `package.json` diff baseline for the report.

Validate that:

- Either the suite is green with `0.0.5` and the record matches, or the tree is back on `0.0.3` with the reason recorded.
- `git diff -- package.json` shows no dependency changing except `@art-md/codec` (or nothing, on revert).

After executing:

- Run `npm run ci` from `$PROJECT`; commit with the blueprint below — on revert, stop at the report with no commit.

**Dependencies:**

- Iteration `declare-primitives-dependency`.

#### Commits:

| ID                  | Repository / Checkout / Branch  | Policy       | Hash  | Status        |
| ------------------- | ------------------------------- | ------------ | ----- | ------------- |
| `bump-art-md-codec` | Art Works / `$PROJECT` / `main` | `AUTONOMOUS` | (TBD) | `PLACEHOLDER` |

##### Commit: `bump-art-md-codec`

**Repository:** Art Works

**Message:**

```text
refactor(workspace-cli): Bump @art-md/codec to 0.0.5.
```

---

## Work

### Next

Sequenced, not blocked: execute only after all five `plan-art-work-cli-global-install` iterations are delivered — the parking-lot gate (`a12f5f5`) — then delegate `declare-primitives-dependency`.

### Blockers

- None.

---

## Operating Instructions

| Operation              | Source                                                        | Origin | Overrides | Workflow       | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------- | ------ | --------- | -------------- | ------------------------------------------------------------ |
| Setting Up             | `$WORKSPACE/_guide.md`                                        |        |           | Executing Work | Prepare the execution environment.                           |
| Writing Commit Message | `$WORKSPACE/knowledge/conventions/writing-commit-message.art` |        |           | Planning Work  | Write standardized message according to context conventions. |
| Verifying Completion   | `$PROJECT/_guide.md`                                          |        |           | Executing Work | Confirm the work item satisfies its intended outcome.        |

::READ `$WORKSPACE/knowledge/conventions/writing-commit-message.art` — Commit message conventions.

---

## Coordination

### Not In Scope

- **Fields-API adoption** — the expanded read/write surface from `plan-expand-fields-api` stays its own PENDING item in `$PROJECT/_backlog/_parking-lot.md`, gated on art-js delivery; it chains to this pass but is not part of this plan.
- **Other dependencies** — `@art-js/records`, `@art-lib/fs-records`, `@art-lib/config`, `@art-lib/logger`, `commander`, `esbuild`, `simple-git` keep their current pins.
- **Publishing** — no release or version bump of `@art-works/workspace-cli` here.

### Evidence

- `npm ls @art-md/primitives` resolves `0.0.6` transitively via `@art-lib/fs-records` while `src/private/context/types.ts` and `src/private/context/createWorkspaceContext.ts` import it directly.
- `cli/workspace/package.json` pins `@art-md/codec` at `0.0.3` while npm reports `0.0.5` as latest.
- `git diff` after each iteration touches exactly one dependency line (or none, on codec revert).

### Findings

- The undeclared import survives only because npm hoisting places `@art-md/primitives` in reach — dropping it from `@art-lib/fs-records` would break the build with no manifest change to point at.
- The codec jump spans two published versions (`0.0.3` → `0.0.5`) with compatibility unverified — hence an iteration shaped as evaluate-or-revert.

### Decisions

- **Sequenced after the bulk** (`a12f5f5`) — dependency commits never mix into the facade-migration history.
- **One dependency per commit, revertible** — each iteration carries its own blueprint and CI gate.
- **Primitives pins what resolves today** — `0.0.6`, making the existing resolution explicit; newer versions are a separate decision.

### Knowledge to Update

- `$PACKAGE/_records/package.art` — dependency records for `@art-md/primitives` and `@art-md/codec`, kept in lockstep with each manifest change.

### Follow Ups

- Chain to the fields-API adoption when `plan-expand-fields-api` lands and publishes (PENDING item).
- Retire the "Post-bulk dependency refresh" PENDING item in `$PROJECT/_backlog/_parking-lot.md` once both iterations are `DONE`; its spec lives here.

### Feedback

- None yet.
