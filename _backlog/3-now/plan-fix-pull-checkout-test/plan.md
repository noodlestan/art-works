# Plan: Fix Pull Checkout Test

**ID:** `fix-pull-checkout-test`

**Status:** `READY`

**Template:** `$DOMAINS/plans/templates/plan.tart`

**Has Context File:** `FALSE`

**Skill:** `write-plan`

**Purpose:** Make the `pullCheckout` failure-path test assert a real git-pull error, and stop the config suite's bundle-failure fixture from streaming esbuild's parse error into CI output (mocking `compileConfig`'s rejection in-scope; the `logLevel` root fix is tracked upstream in Art Lib), so CI stays quiet while the suite stays green.

**Description:** Draft plan capturing the investigation of a `npm run test` anomaly in `@art-works/workspace-cli`: both `pullCheckout` tests pass while the CLI's config compiler reports `Expected identifier but found "{"` against a temp `art-repo-record-test-*/.art-workspace.mts` whose first line is `export default {{{`. Records the CI evidence, five ranked hypotheses — bad-config-as-exception-simulation, stale unmigrated fixture whose assertion accepts any throw, broken interpolation, benign noise from a neighbouring test, cross-test temp-dir leak — and the agreed fix direction: an explicit pull-error assertion plus a legitimate git-level failure simulation. Status `READY`: hypothesis confirmed (H4 — the emission comes from `loadWorkspaceConfig.test.ts`'s deliberate malformed fixture; `pullCheckout.test.ts` writes no config at all), and two iterations with inlined instructions are drafted for delegation.

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

Plan investigating why `npm run test` in `$PACKAGE` emits a config-parse error (`export default {{{`) from a temp `.art-workspace.mts` while the `pullCheckout` failure-path test stays green; scoped to the pull failure-path assertion and the config suite's bundle-failure fixture in Package: Art Workspace Cli; sourced from the Art Works backlog parking lot.

## Scope

One package: make the failure-path test in `src/private/git/pullCheckout.test.ts` assert the pull error explicitly, and stop the config suite's deliberate malformed-manifest fixture in `src/config/loadWorkspaceConfig.test.ts` from streaming esbuild's parse error to stderr, without weakening either test's assertion.

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
— Stop the `WHEN the manifest fails to bundle it reports the manifest path` fixture in `src/config/loadWorkspaceConfig.test.ts` from emitting esbuild's parse error to stderr, without changing its manifest-path assertion; track the `logLevel` root fix upstream in Art Lib.

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

| Iteration / Instructions                            | Status  |
| --------------------------------------------------- | ------- |
| Iteration: Assert Git Pull Error `inlined`          | `READY` |
| Iteration: Silence Bundle Failure Fixture `inlined` | `READY` |

### Iteration: Assert Git Pull Error

**Id:** `assert-pull-error`

**Status:** `READY`

**Purpose:** Make the `WHEN the pull fails it throws` test prove the failure comes from git mechanics, so an unrelated throw (e.g. a config-parse error) can never satisfy it.

**Description:** Rewrites the catch-all `rejects.toBeTruthy()` assertion in `src/private/git/pullCheckout.test.ts` to match the git-pull error message; the origin-less `makeGitRepo` fixture already fails the pull at git level and is left untouched.

**Instructions Mode:** `INSTRUCTIONS_INLINED_IN_ITERATION`

**Changes:**

- Replace `await expect(pullCheckout(dir, 'main')).rejects.toBeTruthy();` in `$PACKAGE/src/private/git/pullCheckout.test.ts` with an assertion matching the git-pull error (type and/or message).
- Keep the failure simulation as-is: `makeGitRepo` creates a repo with no `origin`, so `git.pull('origin', 'main')` fails with `Could not read from remote repository.` — no config fixture is involved.
- Run the test file and the package suite; commit the change.

#### Commits:

| ID                  | Repository / Checkout / Branch  | Policy       | Hash  | Status     |
| ------------------- | ------------------------------- | ------------ | ----- | ---------- |
| `assert-pull-error` | Art Works / `$PROJECT` / `main` | `AUTONOMOUS` | (TBD) | `AUTHORED` |

**Instructions:**

Execute the Changes listed above.

Before starting:

- Execute `npm ci` in `$WORKSPACE` if `node_modules` may be missing (Operating Instructions: Setting Up).
- Stage only the files you changed; the checkout carries a pre-existing unrelated modification to `_backlog/_parking-lot.md` — do not stage it.

How to report back (instructions are inlined in the plan):

- Report in chat instead of writing a report file; no separate delegation record is created.
- Summarise whether you are reporting completion or a BLOCKER, with evidence (files changed, test output, commit hash).
- Keep it terse: happy face + up to 3 bullet points (done `assert-pull-error`, created `{artefacts}`, thumbs up).

Path variables:

| Variable     | Resolved Path                                  | Purpose                                |
| ------------ | ---------------------------------------------- | -------------------------------------- |
| `$WORKSPACE` | Current working directory                      | Workspace root; conventions live here. |
| `$PROJECT`   | `$WORKSPACE/checkouts/art-works`               | Checkout hosting this plan.            |
| `$PACKAGE`   | `$WORKSPACE/checkouts/art-works/cli/workspace` | Package under test.                    |

Goals:

- The failure-path test must reject only with the git-pull error; a config error must never satisfy it.

Mandatory Reading:

- ::READ `$WORKSPACE/knowledge/conventions/writing-commit-message.art` — commit message conventions.
- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

Steps:

- Step 1 / 2 — Tighten the failure-path assertion
- Step 2 / 2 — Commit `assert-pull-error`

#### Step `1 / 2` — Tighten the failure-path assertion

In `$PACKAGE/src/private/git/pullCheckout.test.ts`, in the test `WHEN the pull fails it throws`, replace:

```ts
await expect(pullCheckout(dir, 'main')).rejects.toBeTruthy();
```

with:

```ts
await expect(pullCheckout(dir, 'main')).rejects.toThrow('Could not read from remote repository.');
```

- Do not change the fixture or helpers: `makeGitRepo(tempDirs, { commit: true, dir })` creates a repo with no `origin`, which is the agreed legitimate git-level failure simulation.
- If the exact message differs on the platform, match the stable git-level substring with a regex instead (e.g. `rejects.toThrow(/Could not read from remote repository/)`); never fall back to `toBeTruthy()` or any catch-all.
- Verify: run `npx vitest run src/private/git/pullCheckout.test.ts` in `$PACKAGE` — both tests pass. The `✘ [ERROR]` config emission may still appear in the suite output; it is expected until iteration `silence-bundle-fixture-noise`.

#### Step `2 / 2` — Commit `assert-pull-error`

**Policy:** AUTONOMOUS — commit and push, then proceed.

**Message:**

```
test(workspace-cli): Assert git-pull error in pullCheckout failure path.
```

**Dependencies:**

- None.

**Final Verification:**

- Verify the assertion no longer accepts arbitrary throws (no `toBeTruthy()` in the failure path).
- Verify `npx vitest run src/private/git/pullCheckout.test.ts` passes in `$PACKAGE`.
- Verify the commit was executed and pushed according to the commit's policy.
- Report according to the "How to report back" instructions above.

### Iteration: Silence Bundle Failure Fixture

**Id:** `silence-bundle-fixture-noise`

**Status:** `READY`

**Purpose:** Stop the deliberate malformed-manifest fixture from streaming esbuild's parse error into CI output while keeping its manifest-path assertion green.

**Description:** Mocks `compileConfig`'s rejection for the single `WHEN the manifest fails to bundle it reports the manifest path` test in `src/config/loadWorkspaceConfig.test.ts` — esbuild's service child writes to inherited stderr (uninterceptable by console/stderr spies) before throwing, so the rejection is simulated instead; real bundling stays covered by `@art-lib/config`'s own tests, and the `logLevel: 'silent'` root fix is tracked upstream in Art Lib.

**Instructions Mode:** `INSTRUCTIONS_INLINED_IN_ITERATION`

**Changes:**

- In `$PACKAGE/src/config/loadWorkspaceConfig.test.ts`, for the test `WHEN the manifest fails to bundle it reports the manifest path`, add a one-shot `compileMock.mockRejectedValueOnce(...)` carrying an esbuild-style error, with a comment explaining why the real esbuild call is bypassed.
- Keep the `'export default {{{'` fixture write and the `rejects.toThrow(/\.art-workspace\.mts/)` assertion unchanged — `loadWorkspaceConfig` wraps the mocked rejection with the manifest path.
- Run the package suite and confirm the output contains no `✘ [ERROR]` block; run the workspace verification; commit the change.

#### Commits:

| ID                             | Repository / Checkout / Branch  | Policy       | Hash  | Status     |
| ------------------------------ | ------------------------------- | ------------ | ----- | ---------- |
| `silence-bundle-fixture-noise` | Art Works / `$PROJECT` / `main` | `AUTONOMOUS` | (TBD) | `AUTHORED` |

**Instructions:**

Execute the Changes listed above.

Before starting:

- Execute `npm ci` in `$WORKSPACE` if `node_modules` may be missing (Operating Instructions: Setting Up).
- Stage only the files you changed; the checkout carries a pre-existing unrelated modification to `_backlog/_parking-lot.md` — do not stage it.

How to report back (instructions are inlined in the plan):

- Report in chat instead of writing a report file; no separate delegation record is created.
- Summarise whether you are reporting completion or a BLOCKER, with evidence (files changed, suite output showing no `[ERROR]`, commit hash).
- Keep it terse: happy face + up to 3 bullet points (done `silence-bundle-fixture-noise`, created `{artefacts}`, thumbs up).

Path variables:

| Variable     | Resolved Path                                  | Purpose                                 |
| ------------ | ---------------------------------------------- | --------------------------------------- |
| `$WORKSPACE` | Current working directory                      | Workspace root; verification runs here. |
| `$PROJECT`   | `$WORKSPACE/checkouts/art-works`               | Checkout hosting this plan.             |
| `$PACKAGE`   | `$WORKSPACE/checkouts/art-works/cli/workspace` | Package under test.                     |

Goals:

- The suite must pass with zero `✘ [ERROR]` emissions, without weakening the manifest-path assertion.

Mandatory Reading:

- ::READ `$WORKSPACE/knowledge/conventions/writing-commit-message.art` — commit message conventions.
- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

Steps:

- Step 1 / 3 — Mock `compileConfig` rejection in the bundle-failure test
- Step 2 / 3 — Verify the suite is emission-free
- Step 3 / 3 — Commit `silence-bundle-fixture-noise`

#### Step `1 / 3` — Mock `compileConfig` rejection in the bundle-failure test

In `$PACKAGE/src/config/loadWorkspaceConfig.test.ts`, in the test `WHEN the manifest fails to bundle it reports the manifest path`, keep the fixture write and add a one-shot rejection before the call:

```ts
it('WHEN the manifest fails to bundle it reports the manifest path', async () => {
  const tempDir = makeTempDir(tempDirs);
  writeFileSync(join(tempDir, '.art-workspace.mts'), 'export default {{{');
  // esbuild's service child writes the formatted parse error to inherited stderr
  // before throwing; console/stderr spies cannot intercept it. Simulate the
  // rejection instead — real bundling is covered by @art-lib/config's tests,
  // and the `logLevel: 'silent'` root fix is tracked in Art Lib's parking lot.
  compileMock.mockRejectedValueOnce(
    new Error('Build failed with 1 error: Expected identifier but found "{"'),
  );

  await expect(loadWorkspaceConfig(tempDir)).rejects.toThrow(/\.art-workspace\.mts/);
});
```

- `compileMock` already wraps the real `compileConfig` (`vi.fn(actual.compileConfig)`) declared at the top of the file; `mockRejectedValueOnce` is consumed by this test only.
- Do not remove the `'export default {{{'` write: it documents the failing input the test is named after, and `loadWorkspaceConfig` requires the manifest to exist to reach the compile path.
- Keep the assertion exactly as-is: `loadWorkspaceConfig` wraps the rejection with `Failed to bundle workspace manifest at ${manifestPath}`, so the manifest path still matches.
- Verify: run `npx vitest run src/config/loadWorkspaceConfig.test.ts` in `$PACKAGE` — all tests pass.

#### Step `2 / 3` — Verify the suite is emission-free

- Run `npm run test` in `$PACKAGE` and confirm: all test files pass **and** the output contains no `✘ [ERROR]` block (previously emitted by this test).
- Run `npm run ci` from `$WORKSPACE` (Operating Instructions: Verifying Completion) and confirm it passes.

#### Step `3 / 3` — Commit `silence-bundle-fixture-noise`

**Policy:** AUTONOMOUS — commit and push, then proceed.

**Message:**

```
test(workspace-cli): Silence bundle-failure fixture stderr noise.
```

**Dependencies:**

- None.

**Final Verification:**

- Verify `npm run test` in `$PACKAGE` passes with no `✘ [ERROR]` in the output.
- Verify `npm run ci` from `$WORKSPACE` passes.
- Verify the commit was executed and pushed according to the commit's policy.
- Report according to the "How to report back" instructions above.

## Work

### Next

Delegate iteration `assert-pull-error` to a worker, then integrate; after it lands, delegate `silence-bundle-fixture-noise`.

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
- **H4 — Benign neighbouring noise** — the emission comes from another test's negative-path fixture; the exit code stays green and `pullCheckout` is uninvolved. **CONFIRMED** — the emission is `loadWorkspaceConfig.test.ts:147` (`WHEN the manifest fails to bundle it reports the manifest path`), a deliberate malformed fixture; esbuild's service child writes to inherited `stdio: 'inherit'` stderr (probe-verified: `process.stderr.write`/console spies cannot intercept it); suite run shows exactly one `[ERROR]` block with 373/373 green. Its manifest-path assertion (`rejects.toThrow(/\.art-workspace\.mts/)`) is legitimate and must keep passing.
- **H5 — Cross-test isolation leak** — the `art-repo-record-test-*` temp dir is created or reused across tests, so `pullCheckout` observes a config written by the records test. **REFUTED** — `art-repo-record-test-` is just `makeTempDir`'s shared prefix for every test; `pullCheckout.test.ts` writes no config at all.
- **Pull failure simulation is already legitimate** — `makeGitRepo` creates a repo with no `origin`, so `git.pull('origin', 'main')` fails at pure git level; simple-git throws `Could not read from remote repository.` (probe-verified). The only defect in `pullCheckout.test.ts:37` is the `rejects.toBeTruthy()` catch-all.

### Decisions

- **Make the assertion explicit** — the failure-path test must match the pull error (type and/or message); a config error must never satisfy it.
- **Simulate the pull failure through git mechanics** — break the origin/remote conditions to fail the pull; never rely on an invalid `.art-workspace.mts`.
- **Silence the fixture in-scope by mocking the rejection** — esbuild's service child writes to inherited stderr before throwing (uninterceptable in-test), so the bundle-failure test gets a one-shot `compileMock.mockRejectedValueOnce(...)`; the real esbuild call is covered by `@art-lib/config`'s own tests, and the `logLevel: 'silent'` root fix is parked in Art Lib's backlog.

### Knowledge to Update

- None — the confirmed findings and decisions are recorded in this plan; revisit only if the fixture writer turns out to be shared beyond `loadWorkspaceConfig.test.ts`.

### Follow Ups

- **Audit sibling tests** for bare `toThrow()` assertions that could pass on unrelated errors.
- **Cross-check the records-migration item** — if the config writer was never migrated, `Migrate the remaining record kinds to @art-js/records` likely carries the same defect.
- **Upstream: `compileConfig` silences esbuild output** — actionable item recorded in `$PROJECT`'s sibling Art Lib parking lot (`$WORKSPACE/checkouts/art-lib/_backlog/_parking-lot.md`): add `logLevel: 'silent'` to esbuild `build()` in `@art-lib/config` plus a test asserting no console/stderr output when esbuild fails or succeeds. Once released, iteration `silence-bundle-fixture-noise`'s mock can be dropped.

### Feedback

- None yet.
