# Milestone: Optimizations

**ID:** `optimizations`

**Status:** `DRAFT`

**Template:** `$DOMAINS/milestones/templates/milestone.tart`

**Skill:** `write-milestone`

**Purpose:** Make repeated runs fast through hashing and caching.

**Description:** Introduce content hashing and result caching across the expensive paths — scans, fetches, and record discovery — so a second run over an unchanged workspace does the minimum work necessary.

## Mandatory Reading

::READ `$DOMAINS/milestones/structures/milestone.art` (Structure) — Defines the milestone structure and nested types.

---

## Path Variables

| Variable         | Resolved Path                | Purpose                                                        |
| ---------------- | ---------------------------- | -------------------------------------------------------------- |
| `$WORKSPACE`     | Current working directory    | Workspace root directory                                       |
| `$DOMAINS`       | `$WORKSPACE/.agents/domains` | Domain resources directory                                     |
| `$ART_WORKS`     | Provided with prompt.        | Art Work repository. Example: `$WORKSPACE/checkouts/art-works` |
| `$ART_WORKS_CLI` | `$ART_WORKS/cli/workspace`   | The Art Workspace Cli package, and its roadmap and backlog.    |

## Summary

Add hashing and caching to the CLI's expensive paths so repeated runs over an unchanged workspace skip redundant scans, fetches, and record discovery — following the pattern already established for the config cache.

## Context

### Upstream Work

| Kind        | Path                                                                         | Role                                                                 |
| ----------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Parking Lot | `$ART_WORKS_CLI/_backlog/_parking-lot.md`                                    | Tracks short-term actionables, pending questions, and blockers.      |
| Plan        | `$ART_WORKS_CLI/_backlog/0-archive/2026-10-13-plan-add-config-cache/plan.md` | The config cache establishes the hashing and cache-location pattern. |

### Required Skills

- `write-plan` — Writes execution plans and implementation instructions. Required for Planning Work Item.
- `render-template` — Renders milestone and downstream work-item artefacts. Required at all times.

### Domains

| Domain / Path                                 | Description                                                                        |
| --------------------------------------------- | ---------------------------------------------------------------------------------- |
| Domain: Roadmaps `$DOMAINS/roadmaps/index.md` | Roadmapping lifecycle for discovering, strategising, and coordinating work.        |
| Domain: Plans `$DOMAINS/plans/index.md`       | Planning lifecycle for contextualising, drafting, planning, and integrating plans. |

### Knowledge

::READ `$ART_WORKS_CLI/knowledge/index.md` (Model) — Scan layer, operations, and the report model that exposes cache decisions. Relevant for Planning Work Item.

::READ `$ART_WORKS/_guide.md` (Guide) — Repository setup and verification. Relevant for Setting Up, Verifying Completion.

## Scope

Hashing and caching inside `cli/workspace`: scan results, remote fetches, and record discovery. Config caching is already covered by Plan: Add Config Cache and is the pattern, not the scope.

## Phases

| Index | Name                         | Status  |
| ----- | ---------------------------- | ------- |
| 1     | Inventory expensive paths    | `DRAFT` |
| 2     | Hashing and cache primitives | `DRAFT` |
| 3     | Cache scans and fetches      | `DRAFT` |

### Phase: 1 — Inventory expensive paths

**Goal:** A measured list of what actually costs time.

**Description:** Profile the scan and sync paths, record the redundant work, and name the cache candidates with expected wins.

**Status:** `DRAFT`

**Dependencies:**

- None.

### Phase: 2 — Hashing and cache primitives

**Goal:** One shared hashing and cache module, modelled on the config cache.

**Description:** Extract reusable helpers for content hashing, cache metadata, and graceful degradation, so each cached path does not invent its own.

**Status:** `DRAFT`

**Dependencies:**

- None.

### Phase: 3 — Cache scans and fetches

**Goal:** Second runs skip redundant work and say so.

**Description:** Apply the primitives to checkout scans and remote fetches, with an explicit bypass and a visible reuse-or-rebuild decision in the report.

**Status:** `DRAFT`

**Dependencies:**

- None.

## Items:

| Phase | Resource / Record | Status |
| ----- | ----------------- | ------ |
| -     |                   |        |

No downstream work items are captured yet.

## Work

### Next

- Draft the Phase 1 plan — the inventory decides what is worth caching.

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

- **Config caching** — already delivered by Plan: Add Config Cache; this milestone generalises the pattern.
- **Remote batching** — fetch batching is already handled; repeated re-scans are the remaining target.

### Evidence

- None yet.

### Findings

- **Known redundancy** — `runSync` re-scans each pulled and pushed checkout several times plus a workspace re-scan; fetch batching was already handled, the repeated scan was not.
- **A pattern exists** — the config cache already settles cache location, content-hash invalidation, graceful degradation, and an explicit bypass.

### Decisions

- **Reuse the config cache pattern** — same hashing, same metadata shape, same graceful degradation, same bypass idiom.

### Knowledge to Update

- `$ART_WORKS_CLI/knowledge/index.md` — document the caching model once Phase 2 lands.

### Follow Ups

- Consider whether the config cache should migrate onto the shared primitives from Phase 2.

### Feedback

- None.
