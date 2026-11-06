# Milestone: Mvp Art Records

**ID:** `mvp-art-records`

**Status:** `DRAFT`

**Template:** `$DOMAINS/milestones/templates/milestone.tart`

**Skill:** `write-milestone`

**Purpose:** Read and write `.art` files through the Art JS libraries rather than bespoke parsing.

**Description:** Adopt the Art JS codecs in the Art Workspace Cli so that record discovery, reading, and writing go through the shared libraries, replacing the ad-hoc file handling currently in `private/resources/`.

## Mandatory Reading

::READ `$DOMAINS/milestones/structures/milestone.art` (Structure) — Defines the milestone structure and nested types.

---

## Path Variables

| Variable         | Resolved Path                | Purpose                                                                                             |
| ---------------- | ---------------------------- | --------------------------------------------------------------------------------------------------- |
| `$WORKSPACE`     | Current working directory    | Workspace root directory                                                                            |
| `$DOMAINS`       | `$WORKSPACE/.agents/domains` | Domain resources directory                                                                          |
| `$ART_WORKS`     | Provided with prompt.        | Art Work repository. Example: `$WORKSPACE/checkouts/art-works`                                      |
| `$ART_WORKS_CLI` | `$ART_WORKS/cli/workspace`   | The Art Workspace Cli package, and its roadmap and backlog.                                         |
| `$ART_JS`        | Provided with prompt.        | Art JS repository (extract, validate, project art). Example: `$WORKSPACE/checkouts/art-js-planning` |
| `$ART_LIB`       | Provided with prompt.        | Art Lib repository (filesystem records adapter). Example: `$WORKSPACE/checkouts/art-lib-planning`   |
| `$ART_MD`        | Provided with prompt.        | Art MD repository (primitives and codecs). Example: `$WORKSPACE/checkouts/art-md-planning`          |

## Summary

Make the Art Workspace Cli read and write `.art` files through the Art JS libraries so record handling stops being bespoke, stays consistent with the rest of the ecosystem, and picks up codec fixes for free — scoped to the record resources in `private/resources/` and the scan layer that feeds them.

## Context

### Upstream Work

| Kind        | Path                                                                      | Role                                                                             |
| ----------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Parking Lot | `$ART_WORKS_CLI/_backlog/_parking-lot.md`                                 | Tracks short-term actionables, pending questions, and blockers.                  |
| Whiteboard  | `$ART_JS/_backlog/whiteboard-art-records/whiteboard.md`                   | Chain coordination: vocabulary, integration contracts, and review turns.         |
| Milestone   | `$ART_JS/_roadmap/3-now/milestone-art-records/milestone.md`               | Art JS side of records: the record facade this CLI will consume.                 |
| Plan        | `$ART_LIB/_backlog/4-next/plan-add-fs-records-adapter/plan.md` (`READY`)  | Supplies `@art-lib/fs-records`: discovery, content read, content write.          |
| Milestone   | `$ART_WORKS_CLI/_roadmap/3-now/milestone-art-work-cli-one/milestone.md`   | Current CLI milestone; its Phase 3 decompose work feeds into this one.           |
| Plan        | `$ART_WORKS_CLI/_backlog/1-done/plan-art-work-cli-global-install/plan.md` | Holds the gated `refactor-config-semantics` iteration that consumes the adapter. |

### Required Skills

- `write-plan` — Writes execution plans and implementation instructions. Required for Planning Work Item.
- `render-template` — Renders milestone and downstream work-item artefacts. Required at all times.

### Domains

| Domain / Path                                 | Description                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Domain: Roadmaps `$DOMAINS/roadmaps/index.md` | Roadmapping lifecycle for discovering, strategising, and coordinating work.        |
| Domain: Plans `$DOMAINS/plans/index.md`       | Planning lifecycle for contextualising, drafting, planning, and integrating plans. |

### Knowledge

::READ `$ART_WORKS_CLI/knowledge/index.md` (Model) — Command surface, data model, and record loading. Relevant for Planning Work Item.

::READ `$ART_WORKS/_guide.md` (Guide) — Repository setup and verification. Relevant for Setting Up, Verifying Completion.

## Scope

Replace the bespoke `.art` file handling under `$ART_WORKS_CLI/src/private/resources/` and the scan layer that feeds it with calls into the shared libraries: `@art-lib/fs-records` for discovery and content, `@art-js/records` for record extraction and serialisation. No command surface change, no config schema change.

## Phases

| Index | Name                         | Status  |
| ----- | ---------------------------- | ------- |
| 1     | Evaluate Art JS record libs  | `DRAFT` |
| 2     | Read records through Art JS  | `DRAFT` |
| 3     | Write records through Art JS | `DRAFT` |

### Phase: 1 — Evaluate Art JS record libs

**Goal:** Confirm the CLI's read and write surface maps onto the `AGREED` chain contracts, and record what does not.

**Description:** Inventory the current bespoke record loading and writing, map each touchpoint onto the agreed APIs (`discoverRecordFiles()`, `readContent()`, `writeContent()`, `extractRecords`, `writeRecord`), and record any residual gap as a blocker or follow-up. The API question is largely answered by the `art-records` whiteboard; this phase is an inventory and gap map, not a package survey.

**Status:** `DRAFT`

**Dependencies:**

- The `art-records` whiteboard contracts — already `AGREED`.

### Phase: 2 — Read records through Art JS

**Goal:** All record reads go through the shared libraries.

**Description:** Replace the loaders under `src/private/resources/checkout`, `src/private/resources/repository`, `src/private/resources/namespace`, `src/private/resources/package`, and `src/private/resources/project` plus the scan layer that feeds them, so discovery comes from `discoverRecordFiles()`, content from `readContent()`, and records from the `@art-js/records` facade — preserving the record shapes consumed by commands. Discovery is **unfiltered**: `discoverRecordFiles()` takes no `kinds` (that filter is filename-based and the CLI's filenames do not encode kind); each document is parsed and filtered by heading kind in the CLI.

**Status:** `DRAFT`

**Dependencies:**

- `$ART_LIB/_backlog/4-next/plan-add-fs-records-adapter/plan.md` delivered (discovery + content read).
- `@art-js/records` facade published or workspace-linked (`extractRecords`, capsule hydration).
- Phase 1 inventory.

### Phase: 3 — Write records through Art JS

**Goal:** All record writes go through the shared libraries.

**Description:** Replace the record writers so clone and any other record-producing path serialise through the `@art-js/records` facade and persist through `writeContent(content)`, keeping the CLI's templates and naming conventions intact.

**Status:** `DRAFT`

**Dependencies:**

- Phase 2 landed (reads before writes).
- The adapter's content write available.

## Items:

| Phase | Resource / Record | Status |
| ----- | ----------------- | ------ |
| -     |                   |        |

No downstream work items are captured yet.

## Work

### Next

- Refine the Phase 1 and Phase 2 descriptions against the `AGREED` chain contracts, then draft a plan for Phase 2 (read path) — Phase 1's evaluation question is already answered.
- Keep the gated `refactor-config-semantics` iteration in `$ART_WORKS_CLI/_backlog/1-done/plan-art-work-cli-global-install/plan.md` aligned with this milestone: the same adapter boundary, retitled to canonical names.

### Blockers

- None. The chain contracts are `AGREED`; gaps found in the Phase 1 inventory become blockers here.

---

## Operating Instructions

### Setting Up

**Purpose:** Prepare the execution environment. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/ops/setting-up.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

Run from the `$WORKSPACE` root:

```bash
npm ci # to install dependencies.
```

### Writing Commit Message

**Purpose:** Write standardized message according to context conventions. Operation of Workflow: Planning Work, defined in `$DOMAINS/work/workflows/planning-work/ops/writing-commit-message.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

1. Read commit message conventions from `$WORKSPACE/knowledge/conventions/writing-commit-message.art`.

2. Write the commit message following: the rules defined there.

### Verifying Completion

**Purpose:** Confirms that the work item has been completed and satisfies its intended outcome. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/ops/verifying-completion.art`.

**Instructions:** (From `$ART_WORKS/_guide.md`)

Run from the `$ART_WORKS` root:

```bash
npm run ci # lint, test and build
```

All steps MUST pass. No `it.todo()` tests may remain.

---

## Coordination

### Not In Scope

- **Command surface** — commands, flags, and reports stay as they are.
- **Art JS library development** — gaps belong to `$ART_JS`, not to this CLI.

### Evidence

- None yet.

### Findings

- **Bespoke loaders today** — `src/private/resources/*/load*.ts` hand-roll record discovery and parsing; the ecosystem already has shared codecs for exactly this.
- **Chain contracts settled** — the `art-records` whiteboard carries `AGREED` contracts for the whole chain: vocabulary (**record** = a section identified by its whole heading text; **capsule** = record + source; **facade** = per-document API; **adapter** = filesystem discovery/persistence), the adapter boundary (`FSRecordsAdapter`, `createFSRecordsAdapter(FSRecordsAdapterOptions)`, `FSRecordsPattern`, `FSRecordFile.basePath`, `discoverRecordFiles()`), and the content boundary (`readContent()` / `writeContent(content)`, all async).
- **Chain gate lifted** (2026-10-17) — both `@art-md` contracts are `AGREED` 3/3, and `@art-md/constructs@0.0.4` is published: kind-free `SectionBlock`, every construct carrying `position: {start, end}`. This CLI's upstream pin stays `@art-md/primitives@0.0.3` — imported as types only, with no dependency on constructs.
- **Kind interpretation is this CLI's job, not the libraries'** (decided 2026-10-14, owner authority) — `@art-md` deleted `SectionBlock.kind`, so a heading's text is never split: `## Checkout: Art Work` is one section named `Checkout: Art Work`. `@art-js/records` carries no kind either — `ArtRecord{name}` holds the whole heading text and `extractRecords(document)` takes no kinds filter. Any `SectionBlock` is a record; deciding that `Checkout: Art Work` is a `Checkout` record named `Art Work` belongs to this CLI. That is already how `src/private/resources/checkout/readCheckoutRecord.ts` reads (`/## Checkout:\s*(.+)/`), so the parser **moves** into the CLI's read path rather than appearing there — but the milestone's vocabulary is now **record = section**, not `kind`+`name`.
- **`discoverRecordFiles(kinds?)` cannot filter by kind for this CLI** (2026-10-18) — the adapter's filter is **filename-based**: `FSRecordFile{filename, path, searchPath}` carries no content, so it cannot consult a heading. The CLI's record filenames do **not** encode kind — `_records/art-work.art` holds `## Repository: Art Work`, `_records/package.art` holds four `## Package Dependency:` sections, `_records/npm-deployment.art` holds `## NPM Package Deployment:` — so a filename filter selects the wrong set. **Call `discoverRecordFiles()` with no `kinds`, parse every document, filter by heading kind in the CLI.** Producer confirmed the filter is filename-based 2026-10-16.
- **Round-trip is structural, not byte-identical** (2026-10-14) — the codec normalises extraneous whitespace and enforces one final newline, so byte-identity is no longer a chain contract. This milestone's write-back fidelity claim does not rest on it — see Decisions.
- **Verb families** — `discover` at the filesystem boundary (files); `extract` at the document boundary (records). Both names are already used in the CLI: `findRecordFiles()` becomes `discoverRecordFiles()`.
- **Layering** — the adapter owns discovery and persistence only: no record semantics, no template rendering. Record extraction and serialisation belong to the `@art-js/records` facade; CLI templates stay in `$ART_WORKS`.

### Decisions

- **Reads before writes** — Phase 2 lands before Phase 3 so the read path proves the library contract before the write path depends on it.
- **No behaviour change** — record shapes consumed by commands are preserved; this is a substrate swap.
- **Two libraries, one chain** — discovery and content through `@art-lib/fs-records`; record extraction and serialisation through `@art-js/records`; `ArtContentSource` / `ArtDocumentSource` imported directly from `@art-md/primitives@0.0.3`. Neither library supersedes the other.
- **Discover broadly, filter by parsed kind** — `discoverRecordFiles()` is called without `kinds`, because that filter is filename-based and the CLI's record filenames do not encode kind; each document is parsed and filtered by heading kind in the CLI. Rationale in Findings.
- **No record-level I/O** — persistence at the boundary is `writeContent(content)`; a record-level `writeRecord(file, record, recordWrite)` is retired. Serialise in the facade, persist in the adapter.
- **Fidelity is line-splice, not codec** — edits to existing records never invoke the codec: `readContent()` hands me a string, `writeRecord(content, capsule)` line-splices the anchored section, `writeContent(newContent)` persists what I produced. Byte-for-byte fidelity on existing files therefore survives the codec's move to structural round-tripping. The clone path writes a **new** file via `serialize(capsule)`, where there are no prior bytes to violate.
- **Async boundary** — the adapter is fully async; the CLI loops over files per document, so a per-document facade is sufficient (no batch API).
- **Templates stay local** — rendering remains an `$ART_WORKS` concern.

### Knowledge to Update

- `$ART_WORKS_CLI/knowledge/index.md` — document the records substrate once Phase 2 lands.
- `$ART_WORKS_CLI/knowledge/design/context-model.md` — the resource readers already reference `@art-lib/fs-records`; align the wording once the adapter boundary is final.

### Follow Ups

- **Settled** — `@art-lib/fs-records` and the Art JS codecs do not compete: the adapter supplies files and content, the codecs supply records. (Was: "confirm whether they converge or one supersedes the other.")
- Narrow Phase 1 to an inventory and gap map — the API question is now answered by the `AGREED` chain contracts.
- Retired spellings (`FSRecordsStore`, `listFiles()`, `readRecord()`, record-level `writeRecord(file, record, recordWrite)`) — swept out of the gated plan and its instruction file on 2026-10-13; sweep the remaining `$ART_WORKS` knowledge docs when Phase 2 lands.
- Repoint consumers to `plan-add-fs-records-adapter` once `$ART_LIB` lifts its hold, and re-check the gated `refactor-config-semantics` iteration.

### Feedback

- None.
