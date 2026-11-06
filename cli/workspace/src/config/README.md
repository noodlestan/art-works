# Config

**Purpose:** Describe the workspace configuration this package loads: the manifest format, how the CLI locates it, the shipped bundle-cache behaviour, and the default values.

## Manifest File

The configuration is a TypeScript ES-module named `.art-workspace.mts` living at the workspace root. It default-exports a partial `WorkspaceConfig`, optionally wrapped in `defineConfig` for type checking:

```typescript
import { defineConfig } from '@art-works/workspace-cli/config';

export default defineConfig({
  checkouts: { path: 'checkouts' },
  data: { store: { basePath: '_records/' } },
  discover: { records: { defaults: { pattern: '*.art' } } },
});
```

The manifest does not need to import the package to load: a plain `export default { ... }` object works too, which lets a freshly initialised workspace run from a globally installed CLI with no local `node_modules`.

## Discovery

1. Every command starts at `process.cwd()`.
2. `discoverConfigRoot` walks up through parent directories; the first directory containing `.art-workspace.mts` becomes the config root and is reported as `Running from config at <path>`.
3. When no directory in the chain holds a manifest, the CLI prints `running without config`, warns that the manifest was not found, and loads the defaults rooted at the current directory.

The config root anchors the relative paths: the bundle cache and a relative `data.store.basePath` resolve against it, never against the CLI's install location.

## Bundle Cache

The manifest is compiled with esbuild through `@art-lib/config` and imported as a module:

- **Cache directory:** `<config-root>/node_modules/.art-workspace/` — the single compile location; the compiled bundle and its metadata live there.
- **Cache on by default:** `findReusableBundle` reuses the compiled bundle while its recorded inputs are unchanged; on a miss `compileConfig` rebuilds and refreshes the cache.
- **`--no-config-cache` bypass:** skips reuse for one invocation, recompiles, and refreshes the cache so the next run is warm.
- **Legacy-bundle cleanup:** every load removes a stale root-level `.art-workspace-bundle.mjs` left behind by older versions (best-effort). There is no second compile location.
- **Externals:** `simple-git` is marked external at compile time; Node builtins and `esbuild` are external by package default.

## Defaults

Applied by `defineConfig` whenever the manifest omits a field:

| Field              | Default                                                      |
| ------------------ | ------------------------------------------------------------ |
| `root.path`        | Config root; `process.cwd()` when running without a manifest |
| `checkouts.path`   | `'checkouts'`                                                |
| `data.store`       | `{ basePath: '_records/', patterns: [recordsPattern] }`      |
| `data.template`    | `'.agents/domains/workspace/templates/checkout.art.njk'`     |
| `discover.records` | `{ defaults: recordsPattern }`                               |

Where `recordsPattern` is:

```typescript
{
  base: '.',
  pattern: '*.art',
  ignored: ['node_modules/', '.git/', 'dist/'],
  excluded: [],
  gitignore: true,
}
```

A relative `data.store.basePath` resolves against `root.path`; an absolute path is kept as-is.

## Record Discovery

`discover.records` holds:

- `defaults` — fallback options applied to every pattern entry.
- `paths` — explicit pattern entries. Each entry is merged as `entry ?? defaults ?? built-in`, and `excluded` concatenates the entry and default values. When `paths` is omitted, a single entry built from `defaults` is used.

Each entry (`FSRecordsPattern`) supports `base`, `pattern`, `ignored`, `excluded`, and `gitignore`.
