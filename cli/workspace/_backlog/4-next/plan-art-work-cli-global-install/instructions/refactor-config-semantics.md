# Instructions: `refactor-config-semantics`

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `refactor-config-semantics`

> **Re-baselined 2026-11-04.** All eight steps shipped in commit `refactor-config-options` (`102e828`, `COMMITTED`, pushed). The four-kind facade extraction was carved out to `migrate-record-kinds-to-facade.md`. The stale `0.0.1`/`0.0.2` verification notes, the `extractRecords`/`writeRecord` API names, and the registry-availability (404) text are gone: `@art-lib/fs-records@0.0.3` and `@art-js/records@0.1.0` are installed, and extraction reads through `createRecordsDocument`.

## Before you Start

::switch `agent-worker` — switch to the agent-worker agent mode to execute these instructions. Your mode must be `worker` before you start changing files.

These are your instructions.

RULE: If at any point you are instructed to **REPORT A BLOCKER** or you encounter a commit with `policy` set to `MANUAL` execute the instruction in the "## How to Report Back to the Delegator" section below and STOP processing any other instructions.

## How to Report Back to the Delegator

This section describes how to report back to the delegator after completing the instruction.

1. Summarise the current context, asking: are you reporting completion or a BLOCKER?
2. Gather the evidence of changes made and outcomes achieved, or the blocker error details.
3. Use the `render-template` skill with the `.agents/domains/plans/templates/instructions-report.tart` to render your report and write it next to this instruction file: `plan-art-work-cli-global-install/instructions/refactor-config-semantics__report.md`. No separate delegation record is created.
4. If your prompt included a `DIRECTIVE FEEDBACK:` include the feedback sections in the rendered report.
5. Generate the response and send it back to the delegator.
6. Keep the response terse per the Working Agreements: happy face + up to 3 bullet points (done `refactor-config-semantics`, created `{artefacts}`, thumbs up). The full trail lives in the report file; never repeat it in chat.

## Path Variables

| Variable     | Resolved Path                    | Purpose                                           |
| ------------ | -------------------------------- | ------------------------------------------------- |
| `$WORKSPACE` | Current working directory        | Workspace root directory                          |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`     | Domain resources directory                        |
| `$ART_WORKS` | `$WORKSPACE/checkouts/art-works` | Art Works repository; hosts this plan and package |
| `$PACKAGE`   | `$ART_WORKS/cli/workspace`       | The package this iteration changed                |

## Working Agreements

The plan workflow (see the entry point guide → Planning Workflow → Working Together) runs on three working agreements:

1. **This instructions file is self-contained.** Everything you need is in this file plus its mandatory reading — never rely on session memory, chat context, or details relayed by the user.
2. **Your report is mandatory.** The rendered report file carries the full trail: evidence, changes, verification results, blockers, feedback. Your chat response is only a pointer to it.
3. **User interaction is minimal.** The user relays this instructions file to the delegator and expects a light confirmation: a happy face and up to 3 bullet points — done `refactor-config-semantics`, created `{artefacts}`, thumbs up. If something goes horribly wrong, report the blocker instead of a summary.

## Goals

This section describes the goal(s) of this iteration.

Make the intent behind each config option explicit by reshaping `WorkspaceConfig` to express `checkouts.path`, `data` (where managed records are stored), and `discover.records` (how records are scanned for in checkouts), and wire the records adapter into the workspace context. **Status: delivered at `102e828`; this file now records what shipped and what remains.**

## Mandatory Reading

This section lists the documentation and reference files the sub-agent needs to read before making changes.

- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

- knowledge: `$ART_WORKS/cli/workspace/knowledge/index.md`
- canonical pattern: `$ART_WORKS/cli/workspace/src/private/resources/checkout/loadCheckoutRecords.ts` — the delivered facade extraction; the remaining four kinds are covered by `migrate-record-kinds-to-facade.md`.

---

## Operating Instructions

### Setting Up

**Purpose:** Prepare the execution environment. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/setting-up/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

Run from the `$WORKSPACE` root:

```bash
npm ci # to install dependencies.
```

Do NOT run `npm install` inside `$ART_WORKS` (the package directory) — a local `node_modules` there shadows the monorepo resolution and breaks the build.

### Writing Commit Message

**Purpose:** Write standardized message according to context conventions. Operation of Workflow: Planning Work, defined in `$DOMAINS/work/workflows/planning-work/writing-commit-message/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

1. Read commit message conventions from `$WORKSPACE/knowledge/conventions/writing-commit-message.art`.
2. Write a message following: `{Type}({Scope}): {Description}.` max 120 chars, optionally followed by up 3 bullet points, max 100 chars each.

### Verifying Completion

**Purpose:** Confirms that the work item has been completed and satisfies its intended outcome. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/verifying-completion/operation.art`.

**Instructions:** (From `$ART_WORKS/_guide.md`)

Run from the package directory:

```bash
npm run lint:fix # to fix formatting issues automatically
npm run lint # to report other issues (prettier, eslint, tsc --noEmit)
npm run build
npm run test
```

All steps MUST pass. No `it.todo()` tests may remain.

---

## Changes

This section summarises the changes made in this iteration.

- Step 1 / 8 — Verify provider contract availability — **shipped**
- Step 2 / 8 — Add config constants — **shipped**
- Step 3 / 8 — Reshape config types and defaults — **shipped**
- Step 4 / 8 — Extract WorkspaceContext and add fsRecords — **shipped**
- Step 5 / 8 — Extract createConfig and createContext factories — **shipped**
- Step 6 / 8 — Update CLI entry and commands — **shipped**
- Step 7 / 8 — Replace findRecordFiles with fsRecords — **shipped** for discovery, content, and the checkout loader; the `repository`, `namespace`, `project`, and `package` extraction moved to `migrate-record-kinds-to-facade.md`
- Step 8 / 8 — Commit `refactor-config-options` — **shipped** as `102e828`

## Steps

This section records the executed steps. All steps shipped in commit `refactor-config-options` (`102e828`, `COMMITTED`, pushed).

- Step `1 / 8` — Provider contract verified against `@art-lib/fs-records` (adapter surface, `FSRecordFile.basePath`, discovery-tolerates/content-strict). The old `0.0.1` verification warning and the `extractRecords`/`writeRecord` naming note are retired: extraction reads through `createRecordsDocument` as shown in `checkout/loadCheckoutRecords.ts`.
- Step `2 / 8` — `$PACKAGE/src/config/constants.ts` added with `DEFAULT_RECORDS_PATTERN` and `DEFAULT_RECORDS_STORE_OPTIONS`.
- Step `3 / 8` — `WorkspaceConfig` reshaped to `root`, `checkouts`, `data.store`, `discover.records.paths`; `clone` and `output` removed; `normalizeRecordPaths.ts`, `defineConfig.ts`, and `loadWorkspaceConfig.ts` updated.
- Step `4 / 8` — `WorkspaceContext` extracted to `$PACKAGE/src/private/context/types.ts` with `fsRecords: FSRecordsAdapter`; `createWorkspaceContext` receives `(config, store, fsRecords, log)`.
- Step `5 / 8` — `createConfig` and `createContext` extracted to `$PACKAGE/src/private/cli/`.
- Step `6 / 8` — `$PACKAGE/src/index.ts` and all commands consume `createContext()`.
- Step `7 / 8` — Discovery via `fsRecords.discoverRecordFiles()` and content via `createContentSource(file).readContent()` across all five loaders; checkout extraction via the facade (`loadCheckoutRecords.ts`, `upsertCheckoutRecord.ts`). Remaining: the four-kind extraction → `migrate-record-kinds-to-facade.md`.
- Step `8 / 8` — Committed and pushed as `refactor-config-options` (`102e828`).

---

#### Commit: `refactor-config-options`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
refactor(art-workspace-cli): Refactor config options for better semantics.
```

---

## Final Verification

This section describes how to confirm the iteration is completed and ready for being committed.

**Instructions:**

- Verify that the commit has been executed and pushed (or not pushed) according to the commit's policy.
- Verify that `WorkspaceConfig` uses the new shape (`root`, `checkouts`, `data.store`, `discover.records.paths`) and that no references to `clone`, `records.paths`, or `output` remain in the config layer.
- Verify that `WorkspaceContext` exposes `fsRecords: FSRecordsAdapter` and that all commands consume the context from `createContext()`.
- Verify that no direct `findRecordFiles()` calls remain; discovery goes through `fsRecords.discoverRecordFiles()`, content through `fsRecords.createContentSource(file).readContent()`, and checkout extraction through `createRecordsDocument`. The four-kind extraction is tracked by `migrate-record-kinds-to-facade.md`, not here.
- Execute the **Verifying Completion** step as defined in the "Operating Instructions" section.
- Report according to the "How to Report Back to the Delegator" instructions.
