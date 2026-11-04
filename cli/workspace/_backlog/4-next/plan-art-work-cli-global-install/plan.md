# Plan: Make Art Workspace Cli work from global install

**ID:** `art-work-cli-global-install`

**Status:** `PLANNING`

**Template:** `.agents/domains/plans/templates/plan.tart`

**Skill:** `write-plan`

**Purpose:** Make the Art Workspace Cli work correctly when installed globally.

**Description:** Update the Art Workspace Cli so that its globally installed executable can discover and operate on an Art Work workspace without relying on the CLI being invoked from its repository or from a local monorepo installation.

## Mandatory Reading

::READ `$DOMAINS/plans/structures/plan.art` (Structure) — Describe the work-item changes through a series of iterations and commits with detailed instructions.

---

## Path Variables

| Variable     | Resolved Path                | Purpose                                                        |
| ------------ | ---------------------------- | -------------------------------------------------------------- |
| `$WORKSPACE` | Current working directory    | Workspace root directory                                       |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains` | Domain resources directory                                     |
| `$ART_WORKS` | Provided with prompt.        | Art Work repository. Example: `$WORKSPACE/checkouts/art-works` |

## Summary

Make the Art Workspace Cli executable and operational when installed globally, while preserving local development and monorepo usage. Update the CLI implementation and package metadata as required, and verify both invocation modes.

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

Update the Art Workspace Cli so that the globally installed executable can locate its runtime and operate against the intended Art Work workspace independently of the CLI's installation directory.

## Work

### Next

- Iteration `refactor-config-semantics` is a committed checkpoint (`102e828`): Steps 1–6 are complete, and Step 7 has adapter discovery/content wired. The availability blocker is void — `@art-js/records@0.1.0` is declared in `cli/workspace/package.json` (commit `b955f3c`) and installed. Open: extract the four remaining record kinds (`repository`, `namespace`, `project`, `package`) through the facade — they still use the legacy `read*Record` parsers — re-baseline `instructions/refactor-config-semantics.md`, and rerun `npm run ci`; only then proceed to the dependent iterations.

### Blockers

- None.

---

## Operating Instructions

### Setting Up

**Purpose:** Prepare the execution environment. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/ops/setting-up.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

Run from the `$WORKSPACE` root:

```bash
npm ci # to install dependencies.
npm run ci # to verify build is green before starting
```

If any of these fail, resolve the issue before proceeding with implementation. Do NOT run `npm install` inside `$ART_WORKS` (the package directory) — a local `node_modules` there shadows the monorepo resolution and breaks the build.

### Writing Commit Message

**Purpose:** Write standardized message according to context conventions. Operation of Workflow: Planning Work, defined in `$DOMAINS/work/workflows/planning-work/ops/writing-commit-message.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

1. Read commit message conventions from `$WORKSPACE/knowledge/conventions/writing-commit-message.art`.

2. Write the commit message following: the rules defined there.

### Verifying Completion

**Purpose:** Confirms that the work item has been completed and satisfies its intended outcome. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/ops/verifying-completion.art`.

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

| Iteration / Instructions               | Status    |
| -------------------------------------- | --------- |
| Iteration: Refactor Config Semantics   | `WORKING` |
| Iteration: Discover configuration file | `READY`   |
| Iteration: Add Init command            | `READY`   |
| Iteration: Update Art Work Knowledge   | `READY`   |

### Iteration: Refactor Config Semantics

**Id:** `refactor-config-semantics`

**Status:** `WORKING`

**Purpose:** Make the intent behind each config option more explicit.

**Description:** Change configuration options to express `checkouts.path`, `data` (where managed records are stored), and `discovery.records` (how records are scanned for in checkouts).

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

### Iteration: Discover configuration file

**Id:** `discover-config-location`

**Status:** `READY`

**Purpose:** Make the Art Workspace Cli execute independently of its source checkout when installed globally.

**Description:** Make the CLI discover configuration in current working directory and parent dirs. Compile config file to an `.art` temp directory. Apply default config values if not found. In this scenario: checkouts are assumed at `checkouts` and if repos are added they are stored in `_records/repositories/`. Display configuration on every run.

**Instructions:** `./plan-art-work-cli-global-install/instructions/discover-config-location.md`

**Changes:**

- Discover configuration by scanning parent dirs.
- Compile config to a hidden .art dir.
- Advertise "running without config" or "Running from config at {path}".

**Dependencies:**

- Iteration: Refactor Config Semantics.

#### Commits:

| ID                           | Repository / Checkout / Branch       | Policy       | Hash | Status        |
| ---------------------------- | ------------------------------------ | ------------ | ---- | ------------- |
| `discover-config-location`   | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` |      | `PLACEHOLDER` |
| `compile-config-to-temp-dir` | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` |      | `PLACEHOLDER` |
| `show-config-options`        | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` |      | `PLACEHOLDER` |

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

**Status:** `READY`

**Purpose:** Make the Art Workspace Cli executable independently of its source checkout when installed globally.

**Description:** Add a new `init` command that creates a configuration file with default values for `root.path` and `checkouts.path` redeclared for an easy to use starting point.

**Instructions:** `./plan-art-work-cli-global-install/instructions/add-init-command.md`

**Changes:**

- Add init command.

**Dependencies:**

- Iteration: Refactor Config Semantics.
- Iteration: Discover configuration file.

#### Commits:

| ID                 | Repository / Checkout / Branch       | Policy       | Hash | Status        |
| ------------------ | ------------------------------------ | ------------ | ---- | ------------- |
| `add-init-command` | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` |      | `PLACEHOLDER` |

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

**Instructions:** `./plan-art-work-cli-global-install/instructions/update-art-work-knowledge.md`

**Changes:**

- Update `$ART_WORKS/cli/workspace/knowledge/index.md` to document global-install execution model.
- Update `$ART_WORKS/_guide.md` with global install usage notes.
- Update `$ART_WORKS/cli/workspace/src/config/README.md` (or create) describing config file format and discovery.

**Dependencies:**

- Iteration: Refactor Config Semantics.
- Iteration: Discover configuration file.

#### Commits:

| ID                          | Repository / Checkout / Branch       | Policy       | Hash | Status        |
| --------------------------- | ------------------------------------ | ------------ | ---- | ------------- |
| `update-art-work-knowledge` | Art Work / `$ART_WORKS` / `building` | `AUTONOMOUS` |      | `PLACEHOLDER` |

##### Commit: `update-art-work-knowledge`

**Message:**

```text
docs(art-workspace-cli): Update knowledge for global install and config semantics.
```

---

## Coordination

### Not In Scope

- None

### Evidence

- Implementation checkpoint `102e828` is pushed. `npm run ci` passes: lint, build, 358 unit tests, and 26 integration tests.
- `@art-lib/fs-records@0.0.3` is declared in `cli/workspace/package.json`; adapter discovery and per-file content reads are wired in all five record loaders.

### Findings

- The provider boundary is **two units**: `FSRecordsAdapter{options, discoverRecordFiles(kinds?), createContentSource(file)}` — discovery only — and `FSContentSource extends ArtContentSource`, one per file (`uri`, `maybeContent`, `readContent(): Promise<string>`, `writeContent(content): Promise<void>`). All async. Serialisation belongs to the `@art-js/records` facade (`writeRecord(content, capsule, {guard?})`); the record-level `writeRecord(file, record, recordWrite)` from an earlier capture is retired.
- `@art-lib/fs-records@0.0.3` now exports the agreed adapter surface; `FSRecordFile` uses `basePath`. The instruction file still contains stale `0.0.1` and old options examples and needs re-baselining before further delegated work.
- `FSRecordFile.searchPath` is renamed to `FSRecordFile.basePath` in the provider plan; the consumer refactor must use `basePath`.
- `discoverRecordFiles(kinds?)` filters by **filename**, not by heading — `FSRecordFile{filename, path, basePath}` carries no content, so the filter cannot consult a section (producer, 2026-10-16). The CLI's record filenames do not encode kind (`_records/art-work.art` holds `## Repository: Art Work`; `_records/package.art` holds four `## Package Dependency:` sections), so **call it with no `kinds` and filter by parsed heading kind in the CLI**.
- `@art-js/records` carries no kind — `ArtRecord{name}` holds the whole heading text, `extractRecords(document)` takes no kinds filter, and any `SectionBlock` is a record (owner-authority decision, 2026-10-14). Kind detection and `Kind: Name` splitting are this CLI's responsibility; `readCheckoutRecord.ts` already reads `/## Checkout:\s*(.+)/`, so the parser moves rather than appears. Both `@art-md` contracts are `AGREED` 3/3 and `@art-md/constructs@0.0.4` is published; `@art-md/primitives` is imported for types in `src/private/context/types.ts` and `src/private/context/createWorkspaceContext.ts` but is not declared in `cli/workspace/package.json` — it resolves transitively at `0.0.6` through `@art-lib/fs-records` and must be declared.
- The target `WorkspaceConfig` shape drops the `clone` and `output` keys. `clone` is replaced by `checkouts`; `output` is removed and its consumers must be updated.

### Decisions

- `refactor-config-semantics` is `WORKING` — the registry blocker is void (`@art-js/records@0.1.0` installed): Steps 1–6 complete; Step 7 discovery/content migration complete, facade extraction for the four remaining record kinds pending; checkpoint commit `102e828` is `COMMITTED`.
- Iterations: Discover configuration file, Add Init command, and Update Art Work Knowledge are marked `READY`; they depend on Iteration: Refactor Config Semantics and must be delegated in order.
- The `output` config key is removed per the target `WorkspaceConfig` shape; consumers are updated in Iteration: Refactor Config Semantics.

### Knowledge to Update

- Included as an iteration.

### Follow Ups

- Complete Step 7 facade extraction for `repository`, `namespace`, `project`, and `package`, and rerun `npm run ci`; only then sequence the dependent iterations.
- Re-baseline `instructions/refactor-config-semantics.md` against `@art-lib/fs-records@0.0.3` (Step 1 exports and Step 2 adapter options) and drop its stale `extractRecords`/`writeRecord` API and 404 text.
- Confirm the `data.template` purpose (currently WIP) in a later iteration.

### Feedback

- None.
