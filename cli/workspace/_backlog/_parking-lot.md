# Parking Lot: Art Workspace Cli Backlog

WIP tracker, structured like the session parking lot: **ACTIONABLE** (in progress now), **PENDING** (waiting), **BLOCKERS** (blocking work). Done items, answered questions, removed blockers, are deleted from the parking lot (tracked in plans if applicable).

## Parking Lot

### ACTIONABLE

- None.

### PENDING

- **Raise vitest timeout for git-heavy tests** — pre-commit hook CI flaks under machine load: random git-based test fails each run (5s default timeout or spawned-process capture race), always green in isolation. Consider folding into `plan-optimize-tests-update-knowledge`.
- **Fix the config sample in the package `README.md`** — still shows the old config shape (`clone`, `records`); surfaced by `update-art-work-knowledge` (plan Feedback), outside that iteration's scope — tracked here so it survives the plan's move to `done`.

### BLOCKERS

- None.
