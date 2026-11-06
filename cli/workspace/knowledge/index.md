# Knowledge: Art Workspace Cli

## Documents

| Document                           | Purpose                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------- |
| [overview.md](overview.md)         | Overview of the Art Workspace Cli: benefits, definitions, use cases, and how it works |
| [dependencies.md](dependencies.md) | Dependency observations and choices behind this CLI                                   |
| [principles.md](principles.md)     | Principles guiding the design, authoring, and distribution of the Art Workspace Cli   |

## Design Documents

| Document                                             | Purpose                                                                                    |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [design/commands.md](design/commands.md)             | Command surface of the Art Workspace Cli: arguments, procedures, reports, and edge cases   |
| [design/config.md](design/config.md)                 | The `.art-workspace.mts` manifest: structure, authoring, loading, exports, and type safety |
| [design/context-model.md](design/context-model.md)   | Per-command data model: `WorkspaceContext`, `CheckoutStore`, and the records behind them   |
| [design/operations-log.md](design/operations-log.md) | Append-only side-effect log of a command invocation                                        |
| [design/reports.md](design/reports.md)               | Markdown table reports of findings and side effects                                        |
| [design/\_pseudo.md](design/_pseudo.md)              | Pseudo-code and BDD expectations for the Art Works use cases                               |

## Decision Records

| Record                                             | Purpose                                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [adr/cli.art](adr/cli.art)                         | How the CLI is structured and delivered: package layout, manifest format, records, tooling, and type safety |
| [adr/execution-model.art](adr/execution-model.art) | How Art Works commands execute: imperative one-shot now, reactive layer later                               |
| [adr/distribution.art](adr/distribution.art)       | How this CLI is shaped for its consumers: module format, compiled output, and declarations                  |

## Global Install Execution Model

The CLI behaves identically from a global installation and from a local install; only the executable's location changes. Configuration is always resolved from the working directory, never from the CLI's install location.

### Locating configuration

1. Every command starts at the current working directory.
2. It walks up through parent directories to the first directory holding `.art-workspace.mts`; that directory becomes the config root and the CLI reports `Running from config at <path>`.
3. If no directory in the chain holds a manifest, the CLI reports `running without config`, warns that the manifest was not found, and falls back to the default config rooted at the current directory.

The config root anchors everything relative: the compiled bundle cache and a relative `data.store.basePath` resolve against it.

### Global vs local modes

- **Global** — `npm install -g @art-works/workspace-cli` puts the `art-workspace-cli` binary on the `PATH`; run it from any directory inside a workspace. Discovery depends only on the working directory, so nothing resolves from the install location. The manifest is a plain `export default { ... }` (optionally wrapped in `defineConfig`), with no package import required, so a fresh workspace loads it without a local `node_modules`.
- **Local** — running from a workspace script, `npx art-workspace-cli`, or `node dist/index.mjs` follows the same current-directory/parent discovery and the same config semantics.
- **`init`** — bootstraps a fresh workspace: writes `.art-workspace.mts` with the default values into the current directory and refuses to overwrite an existing manifest.

### Workspace config shape

```typescript
interface WorkspaceConfig {
  root: { path: string }; // config root, set by discovery
  checkouts: { path: string }; // checkout directory, relative to the root
  data: { store: FSRecordsAdapterOptions; template: string };
  discover: { records: { paths: FSRecordsPattern[] } };
}
```

- `root` — the workspace root: the directory where the manifest was found, or the current directory when running without one.
- `checkouts` — where checkouts live, relative to the root. Default `checkouts`.
- `data.store` — where record files are written: `basePath` (relative to `root`) plus scan `patterns`. Default `basePath: '_records/'`.
- `discover.records` — how record files are found: `defaults` merged into each `paths` entry (`base`, `pattern`, `ignored`, `excluded`, `gitignore`). Default `pattern: '*.art'`.

The manifest exports a partial config; `defineConfig` fills the defaults and normalises the record paths. Defaults, discovery details, and the bundle cache are documented in [design/config.md](design/config.md) and in `src/config/README.md`.
