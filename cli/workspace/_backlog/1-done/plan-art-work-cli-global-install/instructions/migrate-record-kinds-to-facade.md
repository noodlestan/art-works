# Instructions: `migrate-record-kinds-to-facade`

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `migrate-record-kinds-to-facade`

## Before you Start

::switch `agent-worker` — switch to the agent-worker agent mode to execute these instructions. Your mode must be `worker` before you start changing files.

These are your instructions.

RULE: If at any point you are instructed to **REPORT A BLOCKER** or you encounter a commit with `policy` set to `MANUAL` execute the instruction in the "## How to Report Back to the Delegator" section below and STOP processing any other instructions.

## How to Report Back to the Delegator

This section describes how to report back to the delegator after completing the instruction.

1. Summarise the current context, asking: are you reporting completion or a BLOCKER?
2. Gather the evidence of changes made and outcomes achieved, or the blocker error details.
3. Use the `render-template` skill with the `.agents/domains/plans/templates/instructions-report.tart` to render your report and write it next to this instruction file: `plan-art-work-cli-global-install/instructions/migrate-record-kinds-to-facade__report.md`. No separate delegation record is created.
4. If your prompt included a `DIRECTIVE FEEDBACK:` include the feedback sections in the rendered report.
5. Generate the response and send it back to the delegator.
6. Keep the response terse per the Working Agreements: happy face + up to 3 bullet points (done `migrate-record-kinds-to-facade`, created `{artefacts}`, thumbs up). The full trail lives in the report file; never repeat it in chat.

## Path Variables

| Variable     | Resolved Path                    | Purpose                               |
| ------------ | -------------------------------- | ------------------------------------- |
| `$WORKSPACE` | Current working directory        | Workspace root directory              |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`     | Domain resources directory            |
| `$ART_WORKS` | `$WORKSPACE/checkouts/art-works` | Art Works repository; hosts this plan |
| `$PACKAGE`   | `$ART_WORKS/cli/workspace`       | The package under change              |

## Working Agreements

The plan workflow (see the entry point guide → Planning Workflow → Working Together) runs on three working agreements:

1. **This instructions file is self-contained.** Everything you need is in this file plus its mandatory reading — never rely on session memory, chat context, or details relayed by the user.
2. **Your report is mandatory.** The rendered report file carries the full trail: evidence, changes, verification results, blockers, feedback. Your chat response is only a pointer to it.
3. **User interaction is minimal.** The user relays this instructions file to the delegator and expects a light confirmation: a happy face and up to 3 bullet points — done `migrate-record-kinds-to-facade`, created `{artefacts}`, thumbs up. If something goes horribly wrong, report the blocker instead of a summary.

## Goals

This section describes the goal(s) of this iteration.

Move the `repository`, `namespace`, `project`, and `package` record loaders off the legacy `read*Record` regex parsers and onto the `@art-js/records` facade so every record kind extracts through one path — mirroring the already-migrated checkout loader — with fixture-parity tests proving the parsed output is unchanged. Commit message: `refactor(art-workspace-cli): Migrate record kind loaders to the records facade.`

## Mandatory Reading

This section lists the documentation and reference files the sub-agent needs to read before making changes.

- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

- knowledge: `$ART_WORKS/cli/workspace/knowledge/index.md`
- canonical pattern: `$ART_WORKS/cli/workspace/src/private/resources/checkout/loadCheckoutRecords.ts` — the migrated checkout loader; mirror its call sequence exactly (`createRecordsDocument` → `read(file)` → `collection.extract()` → `Kind:` prefix split → field reads through the record handle).
- record-handle usage: `$ART_WORKS/cli/workspace/src/private/store/hydrateStoreFromRecords.ts` — how `ArtRecord` handles flow into typed records.

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

This section summarises the changes to be made in this iteration.

- Step 1 / 5 — Migrate `loadRepositoryRecords.ts` to the facade
- Step 2 / 5 — Migrate namespace, project, and package loaders
- Step 3 / 5 — Retire the legacy parsers and migrate their tests
- Step 4 / 5 — Verify facade-only extraction and package CI
- Step 5 / 5 — Commit `migrate-record-kinds-to-facade`

## Steps

This section contains the detailed steps to execute, including commit steps.

### Step `1 / 5` — Migrate `loadRepositoryRecords.ts` to the facade

Make the repository loader extract through the facade with identical output.

Read the canonical pattern first (`checkout/loadCheckoutRecords.ts`), then update `$PACKAGE/src/private/resources/repository/loadRepositoryRecords.ts`:

1. Keep the exported signature, the operation log line (`createGenericOperation('load-...')`), and the returned `RepositoryRecord[]` shape exactly as they are — downstream consumers must not notice.
2. Replace the `readRepositoryRecord(fileWithContent)` call with the pattern's sequence:
   - `const recordFiles = await ctx.fsRecords.discoverRecordFiles();` — **no `kinds` argument**: discovery filters by filename, and record filenames do not encode kind.
   - `const documentRecords = createRecordsDocument<FSRecordFile>({ codec: ctx.codec, createContentSource: (file) => ctx.fsRecords.createContentSource(file) });`
   - per file: skip when `file.error` is set (discovery tolerates, content is strict); then `const collection = await documentRecords.read(file);` and `const records = await collection.extract();`
   - select the record: `records.find((r) => String(r.name).startsWith('Repository:'))` — kind detection lives in this CLI; the facade carries no kind.
   - strip the prefix: `String(handle.name).replace(/^Repository:\s*/, '').trim()`
   - read each field through the record handle with the same normalisation the parser applied today (`String(handle.field).trim()` plus the parser's defaults and fallbacks) — **preserve the existing tolerance for backticked values on read**; this step never writes values.
3. Confirm `readRepositoryRecord` is no longer imported.

Expected outcome: `loadRepositoryRecords` behaves identically for every fixture the old parser tests cover.

### Step `2 / 5` — Migrate namespace, project, and package loaders

Apply the Step 1 sequence to:

- `$PACKAGE/src/private/resources/namespace/loadNamespaceRecords.ts` — heading `Namespace:`
- `$PACKAGE/src/private/resources/project/loadProjectRecords.ts` — heading `Project:`
- `$PACKAGE/src/private/resources/package/loadPackageRecords.ts` — headings `Package:` **and `Package Dependency:`**: `_records/package.art` holds one `## Package:` section and four `## Package Dependency:` sections in a single file — extract every record the file contains and keep the loader's current grouping behaviour; its parser tests define the contract.

Rules for all four loaders:

- No `kinds` filter anywhere; do not thread filenames beyond what the pattern file does.
- Use `FSRecordFile.basePath` when a path is needed — never `searchPath` (renamed).
- Empty-name records are skipped with the existing warning behaviour, mirroring the pattern file.

### Step `3 / 5` — Retire the legacy parsers and migrate their tests

1. Delete:
   - `$PACKAGE/src/private/resources/repository/readRepositoryRecord.ts`
   - `$PACKAGE/src/private/resources/namespace/readNamespaceRecord.ts`
   - `$PACKAGE/src/private/resources/project/readProjectRecord.ts`
   - `$PACKAGE/src/private/resources/package/readPackageRecord.ts`
2. Move their unit tests (e.g. `$PACKAGE/src/private/resources/repository/readRepositoryRecord.test.ts`) to loader-level tests asserting the **same parsed output** against the same fixtures, now through the facade. If a test pins parser-internal mechanics that no longer exist, assert the equivalent observable behaviour through the loader instead.

### Step `4 / 5` — Verify facade-only extraction and package CI

1. `grep -rn 'read[A-Z][A-Za-z]*Record' $PACKAGE/src --include='*.ts'` → no matches.
2. `grep -rn 'findRecordFiles' $PACKAGE/src` → no matches (legacy adapter API).
3. `grep -rln "from '@art-js/records'" $PACKAGE/src` → the four loaders plus the existing checkout/store consumers.
4. Execute the **Verifying Completion** operating instructions above — `npm run lint`, `npm run build`, `npm run test` all green, no `it.todo()`.

### Step `5 / 5` — Commit `migrate-record-kinds-to-facade`

---

#### Commit: `migrate-record-kinds-to-facade`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
refactor(art-workspace-cli): Migrate record kind loaders to the records facade.
```

---

## Final Verification

This section describes how to confirm the iteration is completed and ready for being committed.

**Instructions:**

- Verify that the commit has been executed and pushed (or not pushed) according to the commit's policy.
- Verify that no `read*Record` parser files remain and all four loaders extract through `createRecordsDocument`, mirroring `loadCheckoutRecords.ts`.
- Verify that loader output shapes are unchanged (parity tests green) and that `_records/package.art` still yields its `Package:` and `Package Dependency:` records.
- Verify that discovery is called without `kinds` and that `file.error` is filtered before reads.
- Execute the **Verifying Completion** step as defined in the "Operating Instructions" section.
- Report according to the "How to Report Back to the Delegator" instructions.
