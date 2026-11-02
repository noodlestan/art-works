# CHANGELOG

## 0.3.1

### Changed

- **Adopted `@art-lib/config`:** the Workspace Cli now reads its manifest through the published package instead of its own compile/cache/import pipeline; the private config modules are deleted.
- Behaviour is unchanged: config still comes from `.art-workspace.mts` at the workspace root, is cached under `node_modules/.art-workspace/`, and `--no-config-cache` still forces a rebuild.

## 0.3.0

### Changed

- **Package renamed:** `@art-work/cli` is now `@art-works/workspace-cli`.
- **Bin renamed:** `art-work-cli` is now `art-workspace-cli`.
- **Repository:** the package points at `noodlestan/art-works`.

### Deprecated

- **Old package:** `@art-work/cli` is deprecated; `0.2.1` is its final release. It stays published for existing installs.

### Migration

- Install `@art-works/workspace-cli`; the old package is deprecated.
- Import the config API from `@art-works/workspace-cli/config`.
- Run the CLI as `art-workspace-cli`.

## 0.2.0

### Added

- **Config Cache**: Move compiled config into `node_modules/.art-work`.
- **Config Cache**: Reuse compiled config when sources are unchanged. Bypass if sources changed.
- **`--no-config-cache` flag**: Force skip config cache.

### Fixed

- **Checkout Scan** unborn HEAD resulted in `No` branch because `getCurrentBranch` was resolving branch with `symbolic-ref`.

## Refactored

- Adopt **Typescript Conventions**: extracted constants, import from barrel where available.
- Adopt **Unit-test Conventions**: test case descriptions; extracted constants, spy function naming.

## 0.1.6

### Fixed

- **Repo**: Repository "remote" was mislabelled as "name".

## 0.1.5

### Tooling

- **Build tooling:** Adopt `@noodlestan/esbuild` 0.1.0 with a local `build.config.mjs`.
- **Bin entry point:** The `bin` entry and package exports move accordingly.
- **Flat output:** Bundle to `dist/` with a single `index.mjs` instead of `dist/esm/` and `dist/cjs/`.
- **Declarations:** Emit types only for the `./config` entry point via `postBuildPlugin`. Test and CLI-internal declarations are no longer published.

### Removed

- **Root export:** Dropped the `"."` package export. The package is a binary; `@art-work/cli/config` is the only supported import.

## 0.1.4

### Added

- **`--output` option:** Add `-o, --output <mode>` to all commands with `quiet` (default) and `verbose` modes. Controls whether pending operations are streamed to the console.
- **`output.mode` configuration:** Add `output.mode` to workspace config with default `quiet`.
- **`--workspace` option:** Add `-w, --workspace` to `pull`, `push`, `sync`, and `branch` to also apply the command to the workspace root.
- **Version reporting:** `--version` reports CLI version with dynamic package version via `__BUILD_VERSION__`.

### Fixed

- **Operations report columns:** Fix off-by-one rendering where workspace operations appeared shifted. Workspace operations now display `WORKSPACE` in the repo column and `-` in the checkout column.
- **Checkout scanning:** Restrict `pull`, `push`, and `sync` to scan only the matched checkouts instead of all checkouts.
- **Git state detection:** Skip Git checks when `.git` is absent, preventing inherited state from parent directories.
- **Sanity auto-sync:** `sanity --auto` now pulls before pushing (sync behaviour) instead of only pushing.

### Changed

- **Report formatting:** Add whitespace and underlines to report headers for better readability.

## 0.1.3

### Fixed

- **Checkouts Run** command did not allow executing commands with quotes. Example: "git commit -m 'fix ...'".

## 0.1.1

### Changed

- **Package renamed** to `@art-work/cli` (was: `@art-domains/workspace-cli`).

## 0.0.19

### Added

- **Checkouts run command:** Run arbitrary commands across selected checkouts with `art-workspace checkouts run <command...> [-c <PATTERN...>] [-A, --all]`.
- **Scoped operations:** Add `--checkouts <PATTERN...>` (shorthand `-c`) to `pull`, `push`, `sync`, and `branch` with exact and wildcard matching against checkout name and location.
- **Scoped records discovery:** Add `records.paths` configuration for additive, base-anchored record scans with per-path `ignored`/`excluded`/`gitignore` options.
- **Live operation logging:** Stream pending operations as `...doing: {operation} {repo} {details}` before they complete, with ⏳/🟢/🔴 rendering.
- **Parallel scanning:** Scan and process checkouts concurrently with bounded concurrency in `sanity`, `pull`, `push`, and `sync`.
- **Opt-in refetch:** Add `--refetch` to `sanity` for fresh ahead/behind data; cheap local counts by default.

### Fixed

- **Sync decision:** Use the post-pull checkout state for the push decision in `sync` (stale-checkout bug).
- **Ahead/behind counting:** Replace per-branch network fetches with a single `remoteFetch` plus one local `rev-list` inspection; remove redundant workspace pre-scan in `sync`.

### Changed

- **Operation model:** Rename operation-kind factories to `create*Operation`; derive success/failure generically from the pending instance; add `finishedTs`/`timing()` to the operation base.
- **Operations report:** Add checkout and timing columns; middle-truncate messages to 50 chars.
- **Command arguments:** Require `-c` or `--all` in `pull`, `push`, `sync`, and `branch`; remove the implicit all-checkouts fallback.
- **Branch command:** Replace the positional `[checkouts...]` argument with the `--checkouts` option.
- **Record discovery:** Drop `included` and RegExp patterns in favour of scoped `paths` scans.
- **Operation rename:** Rename `branch created` operation to `branch`.

### Tested

- **Checkout run:** Pattern filtering, `--all`, usage guard, execution success/failure, uncloned checkout, and inner-flag `--` convention.
- **Pattern matching:** Exact and wildcard matching, deduplication, no-match warnings, and unscoped invocations.
- **Parallel scanning:** Concurrent scanning with deterministic ordering; combined ahead/behind counting and fallbacks.
- **Refetch:** Cheap-vs-refetch scan behaviour and `sanity --refetch`.
- **Operations:** Pending/success/failure log lines and live streaming.

### Documented

- **Architecture:** Update `commands.md`, `_pseudo.md`, `config.md`, `operations-log.md`, and `reports.md` for the new command surface, operation model, and record discovery options.

## 0.0.18

### Added

- **Workspace State:** Show workspace root status in `sanity` report.
- **Sync commands:** Apply pull/push/sync logic to the workspace root in `pull`, `push`, `sync`, and `sanity` commands.

### Fixed

- **Behind detection:** Fix false positives and false negatives by fetching the remote branch before computing the behind count in `getBehindCount`.

## 0.0.17

### Added

- **Record discovery:** Recursively discover `.art` records with configurable filename patterns and record-kind filtering.
- **Checkout record tracking:** Preserve discovered filenames so updates write the original records in place.

### Fixed

- **Repo command:** Resolve checkouts by location when their name does not match.
- **Repo command:** Keep package reports grouped beneath their repository reports and distinguish multiple checkouts of the same repository.

### Changed

- **Configuration:** Move checkout persistence settings to top-level `checkouts` and add configurable `records.pattern` discovery settings.

### Tested

- **Repo command:** Add regression coverage for checkout identification and grouped repository/package reporting.

### Documented

- **Architecture:** Update Art Work Cli knowledge and pseudo-code for dynamic loading and checkout-keyed reporting.

## 0.0.16

### Fixed

- **Clone command:** Scan checkouts before presenting checkout report.
- **Sanity command:** Fix false "extraneous checkout" flag for known checkouts.
- **Scan state:** Fix wrong branch warning for extraneous checkouts with empty record branch.
- **Clone command:** Detect wrong remote in checkout report.
- **Clone command:** Respect record branch when cloning (checkout correct branch after clone).
- **Clone command:** Allow second checkout of same repo at different location.
- **Clone command:** Refuse clone when target directory already exists.
- **Clone command:** Fix custom location producing wrong checkout name and path.

## 0.0.15

### Added

- **Pull command:** Pull from origin for all clean checkouts with `art-workspace pull`.
- **Push command:** Push to origin for all clean checkouts with `art-workspace push`.
- **Sync command:** Pull then push for all clean checkouts with `art-workspace sync`.
- **Workspace status:** Show workspace root status before checkout status in sanity report.
- **Is behind detection:** Detect and display behind state for checkouts.
- **Auto-pull in sanity:** `art-workspace sanity --auto` pulls if behind before pushing.

### Fixed

- **Clone command:** Scan checkouts before presenting checkout report in clone use case.
- **Repo command:** Resolve package paths correctly with fallback logic for inconsistent namespace paths.
- **Repo command:** Skip npm info when package.json is missing or has no version.
- **Repo command:** Suppress stderr in npm info calls to avoid 404 error noise.
- **Repo command:** Resolve checkout names with 4-step resolution (exact match → strip prefix → slug format → location fallback).

### Changed

- **Refactor:** Decouple checkout scan state from stored Checkout type.
- **Refactor:** Model CheckoutScan as operation guards over states.
- **Refactor:** Decouple private layer from WorkspaceContext.
- **Refactor:** Move checkout store updates to scan call sites.

## 0.0.14

### Added

- **Repo command:** List repositories, namespaces, and packages with version and publish state.
- **Sanity report:** Show workspace as first-class checkout before checkouts section.

### Fixed

- **Clone report:** Show checkout list once and only for scanned repos.
- **Repo command:** Resolve package states correctly by fixing namespace record parser for multi-line list format.

## 0.0.13

### Added

- **Branch command:** Create/switch branches across checkouts.

### Fixed

- **Clone command:** Allow multiple checkouts of same repo at different locations.

## 0.0.12

### Added

- **Sanity command:** Check git status across all repos with `--auto` push.
- **Clone command:** Idempotent clone with checkout records.
- **Config:** `defineConfig` and workspace manifest loader.
- **Checkout records:** Persistent checkout state tracking.
