# Plan: Make Art Workspace Cli work from global install

**ID:** `art-work-cli-global-install`

**Status:** `WORKING`

**Template:** `.agents/domains/plans/templates/plan.tart`

**Skill:** `write-plan`

**Purpose:** Make the Art Workspace Cli work correctly when installed globally.

**Description:** Update the Art Workspace Cli so that its globally installed executable can discover and operate on an Art Work workspace without relying on the CLI being invoked from its repository or from a local monorepo installation.

## Mandatory Reading

::READ `$DOMAINS/plans/structures/plan.art` (Structure) — Describe the work-item changes through a series of iterations and commits with detailed instructions.

---

## Path Variables

| Variable     | Resolved Path                    | Purpose                                            |
| ------------ | -------------------------------- | -------------------------------------------------- |
| `$WORKSPACE` | Current working directory        | Workspace root directory                           |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`     | Domain resources directory                         |
| `$ART_WORKS` | `$WORKSPACE/checkouts/art-works` | Art Works repository; hosts this plan and backlogs |
| `$PACKAGE`   | `$ART_WORKS/cli/workspace`       | The package this plan changes                      |
| `$ART_JS`    | `$WORKSPACE/checkouts/art-js`    | Art JS checkout; owns `@art-js/records`            |

## Summary

Complete the global-install track so the globally installed `art-workspace-cli` discovers its configuration and runs independently of its source checkout: close `refactor-config-semantics` as delivered at checkpoint `102e828` (config semantics and discovery/content wiring committed), move the four legacy record-kind loaders (`repository`, `namespace`, `project`, `package`) from the `read*Record` regex parsers onto the installed `@art-js/records@0.1.0` facade in a dedicated iteration mirroring the migrated checkout loader, then deliver config discovery (cwd/parent scan, `.art` compile, defaults, run banner), the `init` command, and the knowledge updates, coordinated from the ACTIONABLE items in `$ART_WORKS/_backlog/_parking-lot.md`.

## Context

### Upstream Work

| Kind        | Path                                                                              | Role                                                                     |
| ----------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Parking Lot | `$ART_WORKS/_backlog/_parking-lot.md`                                             | Tracks short-term actionables, pending questions, and blockers.          |
| Milestone   | `$ART_WORKS/cli/workspace/_roadmap/3-now/milestone-art-work-cli-one/milestone.md` | Coordinates this plan as Phase 3 of the Art Workspace Cli One milestone. |

### Required Skills

- `write-plan` — Writes execution plans and implementation instructions. Required for Planning Work Item.
- `render-template` — Renders plan and instruction artefacts. Required for Drafting, Refining.

### Domains

| Domain / Path                           | Description                                                                        |
| --------------------------------------- | ---------------------------------------------------------------------------------- |
| Domain: Plans `$DOMAINS/plans/index.md` | Planning lifecycle for contextualising, drafting, planning, and integrating plans. |

### Knowledge

::READ `$ART_WORKS/cli/workspace/knowledge/index.md` (Model) — Package layout, publishing, and execution model. Relevant for Planning Work Item.

## Scope

Five iterations in Package: Art Workspace Cli (`$PACKAGE`): land the config-semantics refactor as delivered; extract the four record-kind loaders to the facade with fixture-parity tests and retire the legacy parsers; discover configuration from the cwd and parents with defaults and an on-run banner; add the `init` command; update the knowledge files. The registry-availability blocker is void — `@art-js/records@0.1.0` is declared (commit `b955f3c`) and installed.

## Work

### Next

- `add-init-command` is `WORKING` — delegated to a worker; integrate its report on return, then `update-art-work-knowledge`.

### Blockers

- None.

---

## Operating Instructions

### Setting Up

**Purpose:** Prepare the execution environment. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/setting-up/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

Run from the `$WORKSPACE` root:

```bash
npm ci # to install dependencies.
npm run ci # to verify build is green before starting
```

If any of these fail, resolve the issue before proceeding with implementation. Do NOT run `npm install` inside `$ART_WORKS` (the package directory) — a local `node_modules` there shadows the monorepo resolution and breaks the build.

### Writing Commit Message

**Purpose:** Write standardized message according to context conventions. Operation of Workflow: Planning Work, defined in `$DOMAINS/work/workflows/planning-work/writing-commit-message/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

1. Read commit message conventions from `$WORKSPACE/knowledge/conventions/writing-commit-message.art`.

2. Write the commit message following: the rules defined there.

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

Additionally verify the CLI from a global installation and from the local development environment. All steps MUST pass. No `it.todo()` tests may remain.

---

## Items:

| Iteration / Instructions                  | Status    |
| ----------------------------------------- | --------- |
| Iteration: Refactor Config Semantics      | `DONE`    |
| Iteration: Migrate Record Kinds to Facade | `DONE`    |
| Iteration: Discover configuration file    | `DONE`    |
| Iteration: Add Init command               | `WORKING` |
| Iteration: Update Art Work Knowledge      | `READY`   |

### Iteration: Refactor Config Semantics

**Id:** `refactor-config-semantics`

**Status:** `DONE`

**Purpose:** Make the intent behind each config option more explicit.

**Description:** Change configuration options to express `checkouts.path`, `data` (where managed records are stored), and `discovery.records` (how records are scanned for in checkouts).

**Instructions Mode:** `INSTRUCTIONS_SELF_CONTAINED_FILE`

**Instructions:** `./plan-art-work-cli-global-install/instructions/refactor-config-semantics.md`

**Changes:**

In `$ART_WORKS`

```ts
export interface WorkspaceConfig {
  root: { path: string };
  checkouts: { path: string };
  data: {
    store: FSRecordsAdapterOptions;
    template: string; // WIP: purpose to be defined (default record template path?)
  };
  discover: {
    records: { paths: FSRecordsPattern[] };
  };
}

export interface PartialWorkspaceConfig {
  root?: Partial<WorkspaceConfig['root']>;
  checkouts?: Partial<WorkspaceConfig['checkouts']>;
  data?: Partial<WorkspaceConfig['data']>;
  discover?: {
    records?: { defaults?: Partial<FSRecordsPattern>; paths?: Partial<FSRecordsPattern>[] };
  };
}
```

Extract `const DEFAULTS: FSRecordsPattern` from `cli/workspace/src/config/private/normalizeRecordPaths.ts` as `DEFAULT_RECORDS_PATTERN ` in `cli/workspace/src/config/constants.ts`.

Change `checkouts.paths` => `data.store` and update `cli/workspace/src/config/defineConfig.ts` with `data.store` default is `DEFAULT_RECORDS_STORE_OPTIONS` also declared in `cli/workspace/src/config/constants.ts`.

Extract the `WorkspaceContext` interface in `cli/workspace/src/private/context/createWorkspaceContext.ts` to `cli/workspace/src/private/context/types.ts`.

Add `fsRecords: FSRecordsAdapter` to `WorkspaceContext`.

```ts
export interface WorkspaceContext {
  store: CheckoutStore;
  fsRecords: FSRecordsAdapter;
}
```

Update `createWorkspaceContext` in `cli/workspace/src/private/context/createWorkspaceContext.ts` to receive `(config, store, fsRecords, log)`.

In `cli/workspace/src/index.ts` extract the config and workspace context factories into `cli/workspace/src/private/cli/createConfig.ts` and `cli/workspace/src/private/cli/createContext.ts`.

In `createConfig()` locate and load the config file:

```ts
async function createConfig(logger: Logger) {
  logger(createGenericOperation('locate-config'));
  // WIP: Config discovery next.
  logger(createGenericOperation('load-config'));
  return await loadWorkspaceConfig(root);
}
```

In `createContext()` create an instance of `FSRecordsAdapter` using the `config.data.store` options:

```ts
createContext(config, logger) {
  logger(createGenericOperation('create-context'));
  const store = createCheckoutStore();
  const log = createOperationsLog(logger);
  const fsRecords = createFSRecordsAdapter(config.data.store);
  return createWorkspaceContext(config, store, fsRecords, log);
}
```

Update all commands to use `createContext()`

Replace direct `findRecordFiles()` calls with `fsRecords.discoverRecordFiles()` for discovery, `fsRecords.createContentSource(file).readContent()` for content, and the `@art-js/records` facade for extraction:

- `cli/workspace/src/private/resources/checkout/loadCheckoutRecords.ts`
- `cli/workspace/src/private/resources/repository/loadRepositoryRecords.ts`

Delivered at `102e828` for discovery, content, and the checkout loader; the `repository`, `namespace`, `project`, and `package` extraction is carved out to Iteration: Migrate Record Kinds to Facade.

Change `clone` => `checkouts`:

- Update `cli/workspace/src/config/defineConfig.ts`
- Update all consumers.
- Note: `checkouts.path` replaces `clone.path`; ensure init command and docs use `checkouts.path`.

Change `records.paths` to `discovery.records.paths`.

Streamline `cli/workspace/src/config/private/normalizeRecordPaths.ts`

```ts
const maybePaths = records?.paths;
const paths = maybePaths ? maybePaths : [{}];
```

Change all discovery invokations of `findRecordFiles()` to use the discovery config: `loadProjectRecords`, `loadNamespaceRecords`, and `loadPackageRecords`.

**Dependencies:**

- `@art-lib/fs-records@0.0.3` is delivered and provides `FSRecordsAdapter`, `FSRecordsAdapterOptions`, `FSRecordsPattern`, `FSContentSource`, `createFSRecordsAdapter()`, and `discoverRecordFiles()`.
- The `@art-js/records` facade is declared and installed (`@art-js/records@0.1.0`, commit `b955f3c`); Step 7 extraction for `repository`, `namespace`, `project`, and `package` remains.

#### Commits:

| ID                        | Repository / Checkout / Branch       | Policy       | Hash      | Status      |
| ------------------------- | ------------------------------------ | ------------ | --------- | ----------- |
| `refactor-config-options` | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` | `102e828` | `COMMITTED` |

##### Commit: `refactor-config-options`

**Message:**

```text
refactor(art-workspace-cli): Refactor config options for better semantics.
```

### Iteration: Migrate Record Kinds to Facade

**Id:** `migrate-record-kinds-to-facade`

**Status:** `DONE`

**Delegation:** `DONE` — worker `agent-worker` (`ses_e5176230bffe6VOk3on24CQtsN`) since `2026-11-06T01:46:55Z`; report `./plan-art-work-cli-global-install/instructions/migrate-record-kinds-to-facade__report.md`.

**Purpose:** Finish Step 7 extraction so every record kind reads through the `@art-js/records` facade and no legacy parser remains.

**Description:** Move the `repository`, `namespace`, `project`, and `package` loaders off the `read*Record` regex parsers onto the facade, mirroring the migrated checkout loader — discovery without `kinds`, content through the adapter source, extraction through `createRecordsDocument`, `Kind: Name` splitting in the CLI, and field reads through the record handle — then retire the four parser files and migrate their unit tests to loader-level fixture parity.

**Instructions Mode:** `INSTRUCTIONS_SELF_CONTAINED_FILE`

**Instructions:** `./plan-art-work-cli-global-install/instructions/migrate-record-kinds-to-facade.md`

**Changes:**

- Rewrite `cli/workspace/src/private/resources/repository/loadRepositoryRecords.ts`, `namespace/loadNamespaceRecords.ts`, `project/loadProjectRecords.ts`, and `package/loadPackageRecords.ts` to extract via `createRecordsDocument` exactly as `checkout/loadCheckoutRecords.ts` does.
- Delete `readRepositoryRecord.ts`, `readNamespaceRecord.ts`, `readProjectRecord.ts`, and `readPackageRecord.ts`; migrate their unit tests to loader-level tests asserting identical parsed output.
- Keep discovery on `fsRecords.discoverRecordFiles()` without `kinds` (the filename filter cannot match headings), content on `createContentSource(file).readContent()`, and filter `file.error` before reading.
- Preserve field contracts: tolerate backticked values on read, always write non-backticked (`checkoutFields` untouched); use `FSRecordFile.basePath` only.

**Dependencies:**

- Iteration: Refactor Config Semantics.

#### Commits:

| ID                               | Repository / Checkout / Branch    | Policy       | Hash      | Status      |
| -------------------------------- | --------------------------------- | ------------ | --------- | ----------- |
| `migrate-record-kinds-to-facade` | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` | `cc3b7fc` | `COMMITTED` |

##### Commit: `migrate-record-kinds-to-facade`

**Repository:** Art Works

**Message:**

```text
refactor(art-workspace-cli): Migrate record kind loaders to the records facade.
```

### Iteration: Discover configuration file

**Id:** `discover-config-location`

**Status:** `DONE`

**Delegation:** `DONE` — worker `agent-worker` (`ses_e51182387ffei3iwMel3s7bpy1`) since `2026-11-06T03:29:37Z`; report `./plan-art-work-cli-global-install/instructions/discover-config-location__report.md`.

**Purpose:** Make the Art Workspace Cli execute independently of its source checkout when installed globally.

**Description:** Make the CLI discover configuration in current working directory and parent dirs. Compile config file to an `.art` temp directory. Apply default config values if not found. In this scenario: checkouts are assumed at `checkouts` and if repos are added they are stored in `_records/repositories/`. Display configuration on every run.

**Instructions Mode:** `INSTRUCTIONS_SELF_CONTAINED_FILE`

**Instructions:** `./plan-art-work-cli-global-install/instructions/discover-config-location.md`

**Changes:**

- Discover configuration by scanning parent dirs.
- Compile config to a hidden .art dir.
- Advertise "running without config" or "Running from config at {path}".

**Dependencies:**

- Iteration: Refactor Config Semantics.
- Iteration: Migrate Record Kinds to Facade.

#### Commits:

| ID                           | Repository / Checkout / Branch    | Policy       | Hash      | Status      |
| ---------------------------- | --------------------------------- | ------------ | --------- | ----------- |
| `discover-config-location`   | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` | `1123faa` | `COMMITTED` |
| `compile-config-to-temp-dir` | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` | `ac0337a` | `COMMITTED` |
| `show-config-options`        | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` | `e0fbe90` | `COMMITTED` |

##### Commit: `discover-config-location`

**Message:**

```text
build(art-workspace-cli): Discover configuration file.
```

##### Commit: `compile-config-to-temp-dir`

**Message:**

```text
build(art-workspace-cli): Compile config to .art directory.
```

##### Commit: `show-config-options`

**Message:**

```text
build(art-workspace-cli): Show config options.
```

### Iteration: Add Init command

**Id:** `add-init-command`

**Status:** `WORKING`

**Delegation:** `WORKING` — worker `agent-worker` (`ses_e4f822881ffe4R2HWTqIUtiM7y`) since `2026-11-06T10:53:01Z`.

**Purpose:** Make the Art Workspace Cli executable independently of its source checkout when installed globally.

**Description:** Add a new `init` command that creates a configuration file with default values for `root.path` and `checkouts.path` redeclared for an easy to use starting point.

**Instructions Mode:** `INSTRUCTIONS_SELF_CONTAINED_FILE`

**Instructions:** `./plan-art-work-cli-global-install/instructions/add-init-command.md`

**Changes:**

- Add init command.

**Dependencies:**

- Iteration: Refactor Config Semantics.
- Iteration: Discover configuration file.

#### Commits:

| ID                 | Repository / Checkout / Branch    | Policy       | Hash | Status     |
| ------------------ | --------------------------------- | ------------ | ---- | ---------- |
| `add-init-command` | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` |      | `AUTHORED` |

##### Commit: `add-init-command`

**Message:**

```text
build(art-workspace-cli): Add Init Command.
```

### Iteration: Update Art Work Knowledge

**Id:** `update-art-work-knowledge`

**Status:** `READY`

**Purpose:** Update Art Work knowledge files to reflect the global-install capability and new configuration semantics.

**Description:** Update architecture docs, guides, and any knowledge files in `$ART_WORKS` that describe how the CLI locates configuration, operates in global vs local modes, and the shape of the workspace config.

**Instructions Mode:** `INSTRUCTIONS_SELF_CONTAINED_FILE`

**Instructions:** `./plan-art-work-cli-global-install/instructions/update-art-work-knowledge.md`

**Changes:**

- Update `$ART_WORKS/cli/workspace/knowledge/index.md` to document global-install execution model.
- Update `$ART_WORKS/_guide.md` with global install usage notes.
- Update `$ART_WORKS/cli/workspace/src/config/README.md` (or create) describing config file format and discovery.

**Dependencies:**

- Iteration: Refactor Config Semantics.
- Iteration: Discover configuration file.

#### Commits:

| ID                          | Repository / Checkout / Branch    | Policy       | Hash | Status     |
| --------------------------- | --------------------------------- | ------------ | ---- | ---------- |
| `update-art-work-knowledge` | Art Works / `$ART_WORKS` / `main` | `AUTONOMOUS` |      | `AUTHORED` |

##### Commit: `update-art-work-knowledge`

**Message:**

```text
docs(art-workspace-cli): Update knowledge for global install and config semantics.
```

---

## Coordination

### Not In Scope

- **Fields-API adoption** — the expanded read/write surface from `plan-expand-fields-api` (`$ART_JS/_backlog/4-next/plan-expand-fields-api/plan.md`) is a separate PENDING item in `$ART_WORKS/_backlog/_parking-lot.md`; this plan keeps the current rule — tolerate backticked values on read, always write non-backticked through `checkoutFields`.
- **Publishing** — no release or version bump in this plan.

### Evidence

- Implementation checkpoint `102e828` is pushed. `npm run ci` passes: lint, build, 358 unit tests, and 26 integration tests.
- Iteration `discover-config-location` landed at `1123faa`, `ac0337a`, `e0fbe90` (pushed): cwd→parent manifest discovery feeds the shipped `node_modules/.art-workspace` bundle cache with no second compile location, the run banner prints `Running from config at {path}` / `running without config`, verified from local dev and an isolated global install; suite 88 unit files / 348 tests + 28 integration green.
- `@art-lib/fs-records@0.0.3` is declared in `cli/workspace/package.json`; adapter discovery and per-file content reads are wired in all five record loaders.
- Iteration `migrate-record-kinds-to-facade` landed at `cc3b7fc` (pushed): the four record-kind loaders extract through the `@art-js/records` facade, the legacy `read*Record` parsers are deleted, facade-only greps are clean, and the package suite runs 89 files / 371 tests green with no `it.todo()`.

### Findings

- The provider boundary is **two units**: `FSRecordsAdapter{options, discoverRecordFiles(kinds?), createContentSource(file)}` — discovery only — and `FSContentSource extends ArtContentSource`, one per file (`uri`, `maybeContent`, `readContent(): Promise<string>`, `writeContent(content): Promise<void>`). All async. Serialisation belongs to the `@art-js/records` facade (`writeRecord(content, capsule, {guard?})`); the record-level `writeRecord(file, record, recordWrite)` from an earlier capture is retired.
- `@art-lib/fs-records@0.0.3` now exports the agreed adapter surface; `FSRecordFile` uses `basePath`. The instruction file still contains stale `0.0.1` and old options examples and needs re-baselining before further delegated work.
- `FSRecordFile.searchPath` is renamed to `FSRecordFile.basePath` in the provider plan; the consumer refactor must use `basePath`.
- `discoverRecordFiles(kinds?)` filters by **filename**, not by heading — `FSRecordFile{filename, path, basePath}` carries no content, so the filter cannot consult a section (producer, 2026-10-16). The CLI's record filenames do not encode kind (`_records/art-work.art` holds `## Repository: Art Work`; `_records/package.art` holds four `## Package Dependency:` sections), so **call it with no `kinds` and filter by parsed heading kind in the CLI**.
- `@art-js/records` carries no kind — `ArtRecord{name}` holds the whole heading text, `extractRecords(document)` takes no kinds filter, and any `SectionBlock` is a record (owner-authority decision, 2026-10-14). Kind detection and `Kind: Name` splitting are this CLI's responsibility; `readCheckoutRecord.ts` already reads `/## Checkout:\s*(.+)/`, so the parser moves rather than appears. Both `@art-md` contracts are `AGREED` 3/3 and `@art-md/constructs@0.0.4` is published; `@art-md/primitives` is imported for types in `src/private/context/types.ts` and `src/private/context/createWorkspaceContext.ts` but is not declared in `cli/workspace/package.json` — it resolves transitively at `0.0.6` through `@art-lib/fs-records` and must be declared.
- The target `WorkspaceConfig` shape drops the `clone` and `output` keys. `clone` is replaced by `checkouts`; `output` is removed and its consumers must be updated.

### Decisions

- `refactor-config-semantics` is `DONE` at checkpoint `102e828` — Steps 1–6, discovery/content wiring, and the checkout facade shipped; the remaining four-kind extraction is carved into Iteration: Migrate Record Kinds to Facade, whose instruction is authored against `createRecordsDocument`.
- Iterations Migrate Record Kinds to Facade, Discover configuration file, Add Init command, and Update Art Work Knowledge are `READY` and must be delegated in order; placeholder commits execute on branch `main`.
- The `output` config key is removed per the target `WorkspaceConfig` shape; consumers are updated in Iteration: Refactor Config Semantics.

### Knowledge to Update

- Included as an iteration.

### Follow Ups

- Confirm the `data.template` purpose (currently WIP) in a later iteration.
- Declare `@art-md/primitives` in `cli/workspace/package.json` — direct type imports resolve transitively at `0.0.6` today.
- Adopt the expanded fields API from `plan-expand-fields-api` once it lands (tracked in `$ART_WORKS/_backlog/_parking-lot.md` PENDING).

### Feedback

- **Missing `**Instructions Mode:**`** on iterations `refactor-config-semantics`, `discover-config-location`, `add-init-command`, and `update-art-work-knowledge` — **resolved**: all five iterations now declare `INSTRUCTIONS_SELF_CONTAINED_FILE`. Delegating-record completeness only.
- **Template sections not rendered** — no `### (Scope) Package: Art Workspace Cli`, `## Execution Context`, `## Resource Kinds in Scope`, or `## Workflows`; the header lacks `**Has Context File:**`; Upstream Work, Required Skills, and Domains are tables where the work-item templates render bullet lists. Plan rendering only; workers enter through self-contained instruction files.
- **Stale operation paths in Operating Instructions** — the Purpose lines pointed at `$DOMAINS/work/workflows/{planning-work,executing-work}/ops/*.art`, which do not exist; the real definitions live at `writing-commit-message/operation.art`, `setting-up/operation.art`, and `verifying-completion/operation.art`. **Resolved**: the plan's Purpose lines and every instruction file now use the `operation.art` layout.
