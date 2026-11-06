# Sub-Agent REPORT (#producer)

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `discover-config-location`

**Outcome:** `COMPLETED`

## Evidence

### Changes

| Change (from Goals)                                                                         | Result                                                                                                                                                                                                                                                               |
| ------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Discover the configuration file in the current working directory and its parent directories | Done — `discoverConfigRoot()` walks up from the invocation cwd for `.art-workspace.mts` and stops at the first directory that holds it; that directory becomes the config root. `null` at the filesystem root → the cwd is used and the loader applies its defaults. |
| Compile it to a hidden `.art` temp directory                                                | Done — no second compile location: the discovery result feeds the shipped loader, so the esbuild bundle cache stays at `<config root>/node_modules/.art-workspace`; the legacy root-level `.art-workspace-bundle.mjs` cleanup still runs at the discovered root.     |
| Apply default config values when not found                                                  | Done — no manifest in the cwd or any parent → `loadWorkspaceConfig` defaults (`checkouts.path` `checkouts`, default record template, `_records/` store) plus the existing `🟨 … not found` warning and `running without config`.                                     |
| Display the active configuration on every run                                               | Done — `Running from config at {path}` when a manifest is found, `running without config` otherwise. Printed directly (not through the buffered logger), so it is visible in quiet and verbose output alike.                                                         |
| Three AUTONOMOUS commits on `main`                                                          | Done — `discover-config-location`, `compile-config-to-temp-dir`, `show-config-options` (table below); repo-wide hook CI green on each, no flake, no retry, no `--no-verify`.                                                                                         |

#### Files changed

- `$PACKAGE/src/private/cli/createConfig.ts` — replaced the `// WIP: Config discovery next.` placeholder with `discoverConfigRoot()` (cwd → parent walk for `.art-workspace.mts`, `null` when no ancestor holds one); the discovered root (or the cwd when none) is passed to `loadWorkspaceConfig`, and the run banner is printed before loading.
- `$PACKAGE/src/private/cli/createConfig.test.ts` — new: 3 tests — manifest in the cwd; manifest two levels up (walk-up, `root.path` and `data.store.basePath` anchored at the parent); no manifest anywhere → defaults, `running without config`, and the `🟨 not found` warning.
- `$PACKAGE/test/config.test.ts` — new nested-cwd test: run from `<root>/packages/app` discovers the parent manifest, writes `config.bundle.mjs` / `config.cache.json` only under `<root>/node_modules/.art-workspace`, writes no cache or legacy bundle at the cwd or root, records `cacheMeta.manifest` as the discovered manifest path, and prints the banner.
- `$PACKAGE/test/integration.test.ts` — banner assertions on both paths: manifest in the cwd → `Running from config at {path}`; no manifest in the cwd or any parent → `running without config` (exit 0).

Not staged (by design): `$PACKAGE/_backlog/4-next/plan-art-work-cli-global-install/plan.md` — delegator status edits left untouched in the tree.

#### Commits

| ID                           | Message                                                       | Hash      | Policy       | Push                                     |
| ---------------------------- | ------------------------------------------------------------- | --------- | ------------ | ---------------------------------------- |
| `discover-config-location`   | `build(art-workspace-cli): Discover configuration file.`      | `1123faa` | `AUTONOMOUS` | pushed with `e1295f7..e0fbe90` on `main` |
| `compile-config-to-temp-dir` | `build(art-workspace-cli): Compile config to .art directory.` | `ac0337a` | `AUTONOMOUS` | pushed with `e1295f7..e0fbe90` on `main` |
| `show-config-options`        | `build(art-workspace-cli): Show config options.`              | `e0fbe90` | `AUTONOMOUS` | pushed with `e1295f7..e0fbe90` on `main` |

#### Verification evidence

- Setting up — `npm ci` and `npm run ci` from the `$WORKSPACE` root — green before starting.
- `npm run lint:fix` / `npm run lint` (prettier, eslint, `tsc --noEmit`) — pass.
- `npm run build` — pass.
- `npm run test` / `npm run ci` — pass: 88 unit files, 348 tests; 28 integration tests; coverage 96.45% statements, 84.08% branches, 97.51% functions, 96.82% lines (thresholds 90/75/90/90); no `it.todo()`.
- Pre-commit hook (repo-wide CI: `0-clean`, `1-extract`, `2-ci`) green on all three commits — no flake, no retry, no `--no-verify`.
- Local development environment — `node dist/index.mjs sanity` from `$PACKAGE` prints `Running from config at $WORKSPACE/.art-workspace.mts` and exits 0, i.e. the config root is the workspace root, not the package directory.
- Global installation — `npm pack` + `npm install -g` into an isolated prefix: `art-workspace-cli --version` → `0.3.1`; run from `<temp workspace>/packages/app` with the manifest at `<temp workspace>` → banner, exit 0, workspace root reported as `<temp workspace>`, cache present only at `<temp workspace>/node_modules/.art-workspace/{config.bundle.mjs,config.cache.json}` (no cache directory under the cwd, no legacy root bundle); run from an empty directory with no ancestor manifest → `running without config`, exit 0, no cache directory created.
- Note — on macOS `process.cwd()` reports the symlink-resolved temp path, so the banner and `cacheMeta.manifest` show the resolved form; the two tests compare against `realpathSync(root)` rather than the raw temp path.
