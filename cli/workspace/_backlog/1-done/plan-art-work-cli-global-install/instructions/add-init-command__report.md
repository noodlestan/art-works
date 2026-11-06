# Sub-Agent REPORT (#producer)

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `add-init-command`

**Outcome:** `COMPLETED`

## Evidence

### Changes

| Change (from Goals)                                                                                                            | Result                                                                                                                                                                                                                                                                                                                                |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Add a new `init` command that creates a configuration file with default values for `root.path` and `checkouts.path` redeclared | Done — `runInit(ctx, { root })` writes `.art-workspace.mts` in the cwd with `root: { path: process.cwd() }` and `checkouts: { path: 'checkouts' }` redeclared, plus the default `data.store` and `discover.records`; registered first in the command list, following the same commander registration pattern as the other commands.   |
| The generated manifest name must be exactly what discovery scans for                                                           | Done — the file is written as `.art-workspace.mts`, matching the `MANIFEST_FILE` constant used by both `loadWorkspaceConfig.ts` and the `discoverConfigRoot()` walk-up in `createConfig.ts`; verified by a subsequent run printing `Running from config at <cwd>/.art-workspace.mts`.                                                 |
| Use only the new config names (`checkouts`, `data.store`, `discover.records`) — never `clone` or `records`                     | Done — the generated content uses `root`, `checkouts`, `data.store`, `discover.records` only; no `clone` key and no legacy top-level `records`. Unit and integration tests assert `store:`/`discover:`/`records:` present and `clone` absent.                                                                                         |
| Set up a fresh workspace when the CLI is installed globally                                                                    | Done — the generated manifest is a plain default export with no package import, so it compiles and loads in a workspace without `node_modules` (an `@art-works/workspace-cli/config` import was verified experimentally to fail with `Could not resolve` in a fresh directory); confirmed end-to-end from an isolated global install. |
| Three steps executed in order, one AUTONOMOUS commit on `main`                                                                 | Done — `add-init-command` committed as `6f1d568` and pushed `ad5af67..6f1d568` on `main`; repo-wide hook CI green on the first attempt, no flake, no retry, no `--no-verify`.                                                                                                                                                         |

#### Files changed

- `$PACKAGE/src/commands/init/runInit.ts` — new: `runInit()` logs the `command`/`init` operation, refuses (warn + `false`) when `.art-workspace.mts` already exists in the workspace root, otherwise writes `INIT_MANIFEST_SOURCE` (defaults for `root.path` and `checkouts.path` redeclared plus `data.store` and `discover.records`) and reports `Created .art-workspace.mts at {root}`; returns whether the file was created.
- `$PACKAGE/src/commands/init/runInit.test.ts` — new: 2 tests — fresh dir creates the manifest with the default values/new shape (and no `clone`), existing manifest is kept untouched and the refusal is reported.
- `$PACKAGE/src/index.ts` — registered `init` (`Create a configuration file with default values`, `-o, --output`) with the standard `process.cwd()` → `createCommandContext` → `runInit` action pattern; sets `process.exitCode = 1` when the manifest already existed.
- `$PACKAGE/test/integration.test.ts` — new `init` describe: creates the manifest in an empty dir (exit 0, content assertions), refuses to overwrite with non-zero exit, and the generated config is discovered and loaded by a subsequent `sanity` run; `init` added to the help command list.

Not part of this commit (by design): `$PACKAGE/_backlog/4-next/plan-art-work-cli-global-install/plan.md` — the delegator committed its own status record as `ad5af67` during execution; the worker commit contains only the four files above.

#### Commits

| ID                 | Message                                       | Hash      | Policy       | Push                                |
| ------------------ | --------------------------------------------- | --------- | ------------ | ----------------------------------- |
| `add-init-command` | `build(art-workspace-cli): Add Init Command.` | `6f1d568` | `AUTONOMOUS` | pushed `ad5af67..6f1d568` on `main` |

#### Verification evidence

- Setting up — `npm ci` and `npm run ci` from the `$WORKSPACE` root — green before starting.
- `npm run lint:fix` / `npm run lint` (prettier, eslint, `tsc --noEmit`) — pass from `$PACKAGE`.
- `npm run build` — pass.
- `npm run test` — pass: 91 test files, 381 tests; `test:unit` coverage 96.48% statements, 84.14% branches, 97.52% functions, 96.84% lines (thresholds 90/75/90/90), `src/commands/init/runInit.ts` at 100% on every metric; no `it.todo()`.
- Repo-wide `npm run ci` (root prettier + `turbo run ci`) — green before committing.
- Pre-commit hook (repo-wide CI: `0-clean`, `1-extract`, `2-ci`) — green on `6f1d568` in 36s — no flake, no retry, no `--no-verify`.
- Step 2 — local development environment (`node dist/index.mjs` from `$PACKAGE`): in a fresh temp directory `init` exits 0 and writes the manifest with `root: { path: process.cwd() }`, `checkouts: { path: 'checkouts' }`, `data.store`, `discover.records`; a second `init` refuses with `.art-workspace.mts already exists at …` and exit 1 leaving the file unchanged; a subsequent `sanity` prints `Running from config at <dir>/.art-workspace.mts` and exits 0 (config discovered, compiled to `node_modules/.art-workspace`, and loaded). `--help` lists `init` first with its description.
- Step 2 — global installation: `npm pack` into an isolated prefix + `npm install -g … --prefix` (the real global install was not touched); `art-workspace-cli --version` → `0.3.1`; `init` in a brand-new workspace (no `node_modules`) creates the manifest, and the following `sanity` discovers and loads it (`Running from config at …`), exit 0.
- Note — `root.path` from the manifest is redeclared for discoverability but the loader always anchors it to the discovered config root (`defineConfig({ …config, root: { path: rootPath } })`), so `process.cwd()` reproduces the documented default without changing load semantics.
