# Parking Lot: Art Works Backlog

WIP tracker, structured like the session parking lot: **ACTIONABLE** (in progress now), **pending** (waiting), **BLOCKER** (blocking work), **FOLLOW-UPS** (not in scope).

## Ongoing

- **Complete the `art-work` → `art-works` rename** — identity records, package identity (`@art-works/workspace-cli`, bin `art-workspace-cli`, path `cli/workspace`), checkout, and workspace records are renamed; residual naming decisions and follow-ups stay tracked in `milestone-rename-art-work-to-art-works`.
- **Participate in the Art Boards Inception Whiteboard (owned by `ART_BOARDS`)** — board at `$ART_BOARDS/cli/whiteboard/_roadmap/whiteboard-art-boards-inception/whiteboard.md`.
- **Participate in the Art Records Whiteboard (owned by `ART_JS`)** — board at `$ART_JS/_backlog/whiteboard-art-records/whiteboard.md`; this project is the highest priority.
- **Ship `plan-art-work-cli-global-install`** — make the CLI work from a global install; today that is driven by the top ACTIONABLE items: migrate the remaining record kinds to `@art-js/records`, refresh the Step 7 instructions, then delegate the plan (checkpoint `102e828`, Steps 1–6/8 complete).

---

## ACTIONABLE

- **Finish `plan-fix-pull-checkout-test`** — plan draft at `_backlog/4-next/plan-fix-pull-checkout-test/plan.md` (`DRAFT`): confirm which hypothesis explains the `export default {{{` config error leaking into CI, draft iterations, then delegate execution.
- **Migrate the remaining record kinds to `@art-js/records`** — `repository`, `project`, `namespace`, `package` loaders still use the legacy `read*Record` regex parsers; reuse `checkoutFields` and the `upsert*Record` shape.
- **Refresh Step 7 of `plan-art-work-cli-global-install`** — the instructions still describe the stale `extractRecords` / `writeRecord` API and the 404 blocker; rewrite them against `createRecordsDocument` / `ArtRecord` and the new provenance model.
- **Report the typed-field gap to `@art-js/records`** — no way to express an `inlineCode` field value through the Records API; `checkoutFields` builds the construct locally to work around it.

## PENDING

None current.

## BLOCKERS

None current. The former registry-availability blocker is resolved; `@art-js/records@0.1.0`, `@art-md/codec@0.0.3` and `@art-lib/fs-records@0.0.3` are all published and installed.

---

## Follow-ups

None current.
