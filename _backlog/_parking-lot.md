# Parking Lot: Art Works Backlog

WIP tracker, structured like the session parking lot: **ACTIONABLE** (in progress now), **pending** (waiting), **BLOCKER** (blocking work), **FOLLOW-UPS** (not in scope).

## Ongoing

- **Rename the project `art-work` → `art-works`** — supersedes the dead "art box" rename; new target is `art-works`. The identity records and the package identity are renamed (`@art-works/workspace-cli`, bin `art-workspace-cli`, path `cli/workspace`); the checkout name, the workspace records, and the website project list wait for the new CLI install.
- **Participate in the Art Boards Inception Whiteboard (owned by `ART_BOARDS`)** — board at `$ART_BOARDS/cli/whiteboard/_roadmap/whiteboard-art-boards-inception/whiteboard.md`.
- **Participate in the Art Records Whiteboard (owned by `ART_JS`)** — board at `$ART_JS/_backlog/whiteboard-art-records/whiteboard.md`; this project is the highest priority.
- **Implement `plan-art-work-cli-global-install`** — Steps 1–6/8 complete. Checkpoint `102e828` committed. Step 7 checkout load/modify/save is now migrated to `@art-js/records` + `@art-lib/fs-records` (source-bound `Checkout.recordHandle`, no filename threading); the remaining record kinds and the Step 7 instruction refresh are still open.

---

## ACTIONABLE

- **Finish `plan-fix-pull-checkout-test`** — plan draft at `_backlog/4-next/plan-fix-pull-checkout-test/plan.md` (`DRAFT`): confirm which hypothesis explains the `export default {{{` config error leaking into CI, draft iterations, then delegate execution.
- **Migrate the remaining record kinds to `@art-js/records`** — `repository`, `project`, `namespace`, `package` loaders still use the legacy `read*Record` regex parsers; reuse `checkoutFields` and the `upsert*Record` shape.
- **Refresh Step 7 of `plan-art-work-cli-global-install`** — the instructions still describe the stale `extractRecords` / `writeRecord` API and the 404 blocker; rewrite them against `createRecordsDocument` / `ArtRecord` and the new provenance model.
- **Report the typed-field gap to `@art-js/records`** — no way to express an `inlineCode` field value through the Records API; `checkoutFields` builds the construct locally to work around it.

## PENDING

None current.

## BLOCKERS

None current. The former registry-availability blocker is resolved; `@art-js/records@0.0.1`, `@art-md/codec@0.0.3` and `@art-lib/fs-records@0.0.3` are all published and installed.

---

## Follow-ups

None current.
