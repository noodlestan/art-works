# Art Workspace Cli - Config

**Purpose:** Describe the workspace configuration this CLI reads: its shape, its defaults, and how it is loaded.

## Overview

The workspace configuration is a TypeScript module at `<cwd>/.art-workspace.mts`. The CLI loads it through the published `@art-lib/config` package, using its decomposed API — `findReusableBundle`, `compileConfig`, `importConfigModule` — rather than a private loading pipeline.

The compiled bundle and its metadata are stored under `<cwd>/node_modules/.art-workspace/`. Caching is on by default; `--no-config-cache` forces a rebuild for a single invocation.

The package owns none of this: the manifest name, the cache directory, the config shape, and the defaults all stay in this CLI.

## Configuration Shape

The manifest exports a partial config through `defineConfig`, which fills the defaults below and normalises the record paths.

```typescript
interface WorkspaceConfig {
  root: { path: string };
  checkouts: { path: string };
  data: { store: FSRecordsAdapterOptions; template: string };
  discover: { records: { paths: FSRecordsPattern[] } };
}
```

## Defaults

Applied by `defineConfig` whenever the manifest omits a field:

| Field            | Default                                                 |
| ---------------- | ------------------------------------------------------- |
| `root.path`      | `process.cwd()`                                         |
| `checkouts.path` | `'checkouts'`                                           |
| `data.template`  | `.agents/domains/workspace/templates/checkout.art.njk`  |
| `data.store`     | `{ basePath: '_records/', patterns: [recordsPattern] }` |

A relative `data.store.basePath` resolves against `root.path`.

Record discovery, applied to each entry under `discover.records`:

| Option      | Default                               |
| ----------- | ------------------------------------- |
| `base`      | `'.'`                                 |
| `pattern`   | `'*.art'`                             |
| `ignored`   | `['node_modules/', '.git/', 'dist/']` |
| `excluded`  | `[]`                                  |
| `gitignore` | `true`                                |

## How It Is Used

1. Resolve `<cwd>/.art-workspace.mts`. If it is missing, the CLI warns and falls back to the defaults above.
2. `findReusableBundle(cacheDir, baseDir)` — reuse the compiled bundle while its recorded inputs are unchanged.
3. On a miss, `compileConfig(manifestPath, { cacheDir, baseDir, externals: ['simple-git'] })`. Node builtins and `esbuild` are external by package default.
4. `importConfigModule<PartialWorkspaceConfig>(bundlePath)` — take the default export and pass it through `defineConfig`.

`--no-config-cache` sets `cache: false`, which skips step 2, rebuilds, and refreshes the cache so the next run is warm.

Authoring a manifest:

```typescript
import { defineConfig } from '@art-works/workspace-cli/config';

export default defineConfig({
  checkouts: { path: '_records/checkouts/' },
  discover: { records: { defaults: { pattern: '*.art' } } },
});
```
