# Parking Lot: Art Works Backlog

WIP tracker, structured like the session parking lot: **ACTIONABLE** (in progress now), **pending** (waiting), **BLOCKER** (blocking work), **FOLLOW-UPS** (not in scope).

## Ongoing

- **Complete the `art-work` → `art-works` rename** — identity records, package identity (`@art-works/workspace-cli`, bin `art-workspace-cli`, path `cli/workspace`), checkout, and workspace records are renamed; residual naming decisions and follow-ups stay tracked in `milestone-rename-art-work-to-art-works`.
- **Participate in the Art Boards Inception Whiteboard (owned by `ART_BOARDS`)** — board at `$ART_BOARDS/cli/whiteboard/_roadmap/whiteboard-art-boards-inception/whiteboard.md`.
- **Participate in the Art Records Whiteboard (owned by `ART_JS`)** — board at `$ART_JS/_backlog/whiteboard-art-records/whiteboard.md`; this project is the highest priority.
- **Ship `plan-art-work-cli-global-install`** — make the CLI work from a global install; the plan is `WORKING` with 2 of 5 iterations `DONE` (config semantics at `102e828`, facade migration at `cc3b7fc`), discovery iteration prepped for delegation next.

---

## ACTIONABLE

- None current.

## PENDING

- **Adopt the expanded fields API from `@art-js/records`** — waiting on `plan-expand-fields-api` at `$ART_JS/_backlog/4-next/plan-expand-fields-api/plan.md` (art-js, `PLANNING` in `4-next`) to land and publish: bump the dependency, update our field reads to call the new text-read method (the default accessor will return markdown, backticks included), keep the rule — tolerate backticked values on read, always write non-backticked — and retire the local `checkoutFields` workaround. Sequenced with the post-bulk dependency refresh below — never mid-migration.
- **Post-bulk dependency refresh** — declare `@art-md/primitives` in `cli/workspace/package.json` (direct type imports, today transitive at `0.0.6`) and decide the `@art-md/codec` bump from pinned `0.0.3` to latest `0.0.5`. Scheduled strictly **after the bulk of the work** — all five `plan-art-work-cli-global-install` iterations delivered, including `migrate-record-kinds-to-facade` — so every migration commit stays dependency-clean. Tracked by `plan-post-bulk-dependency-refresh` at `_backlog/6-plan/plan-post-bulk-dependency-refresh/plan.md` (`READY`, instructions inlined).

## BLOCKERS

None current. The former registry-availability blocker is resolved; `@art-js/records@0.1.0`, `@art-md/codec@0.0.3` and `@art-lib/fs-records@0.0.3` are all published and installed.

---

## Follow-ups

None current.
