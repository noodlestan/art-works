# Sub-Agent REPORT (#producer)

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `update-art-work-knowledge`

**Outcome:** `COMPLETED`

## Evidence

### Changes

| Goal                                                                          | Change                                                                                                                                                                                                                                                              |
| ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Document the global-install execution model and new config shape in knowledge | Added a `Global Install Execution Model` section to `cli/workspace/knowledge/index.md`: configuration location (current directory → parents), global vs local modes, `init` bootstrap, and the config shape (`root`, `checkouts`, `data.store`, `discover.records`) |
| Add global-install usage notes to the repository guide                        | Added a `Global Install Usage` section to `$ART_WORKS/_guide.md`: running from a global installation, setting up a fresh workspace with `init`, and running from a local checkout                                                                                   |
| Describe the config file format and discovery                                 | Created `cli/workspace/src/config/README.md`: `.art-workspace.mts` format, current-directory/parent discovery, bundle-cache behaviour (`node_modules/.art-workspace`, `--no-config-cache`, legacy-bundle cleanup, no second compile location), and default values   |

#### Files changed

- `_guide.md` — new `Global Install Usage` section (global run, `init` for a fresh workspace, local-checkout run).
- `cli/workspace/knowledge/index.md` — new `Global Install Execution Model` section (config location walk-up, global vs local modes, `root` / `checkouts` / `data.store` / `discover.records` shape).
- `cli/workspace/src/config/README.md` — created: manifest format and authoring, discovery process, shipped bundle-cache behaviour, record discovery merge rules, and the default config values table.

### Commit

- `7eb9033` `docs(art-workspace-cli): Update knowledge for global install and config semantics.` — AUTONOMOUS policy; 3 files changed, 131 insertions; pushed to `origin/main` (`645145f..7eb9033`).
- The plan file `plan-art-work-cli-global-install/plan.md` was not edited and not staged.

### Verification

- Setup (workspace root): `npm ci` and `npm run ci` green before starting.
- Package: `npm run lint:fix`, `npm run lint` (prettier, eslint, `tsc --noEmit`), `npm run build`, `npm run test` — 91 test files, 381 tests passed; no `it.todo()` remains.
- Global installation (isolated prefix in temp): `art-workspace-cli --version` → `0.3.1`; `init` created `.art-workspace.mts` with defaults in a fresh workspace; from `packages/app` the CLI walked up and reported `Running from config at <workspace>/.art-workspace.mts`; `--no-config-cache` rebuilt the bundle; cache landed in `<workspace>/node_modules/.art-workspace/` (`config.bundle.mjs`, `config.cache.json`); no legacy `.art-workspace-bundle.mjs` present.
- Local development environment: `node dist/index.mjs init` + `sanity` from a child directory — same discovery and config semantics as global.
- Old config names: the updated files contain no `clone` key and no standalone `records` key; the only `records` config reference is the new `discover.records`.
- Pre-commit hook ran repo-wide CI green on the first attempt.

## Blockers (if any)

None — execution completed without blockers.

## Feedback

### For the technical writers

- The package `README.md` config sample still shows the old shape (`clone`, `checkouts`, `records`); it is outside this iteration's declared scope and is already tracked as documentation drift in the backlog.
