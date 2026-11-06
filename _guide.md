# Guide: Art Works

> Host and manage the Art Works orchestration tools and applications, and their planning artefacts.

Monorepo containing the Art Works orchestration tools and applications. Hosts more than one CLI under `cli/`, and each CLI owns its own roadmap and backlog.

Uses Workflow: Planning Work with one backlog per CLI package, coordinating with Workflow: Roadmapping from one roadmap per CLI package.

## Recommended Reading

Agents SHOULD scan these files for relevant clarifications when faced with ambiguity or omissions that may result from missing definitions.

- `_guide.md` — this file: system overview, layout, setup, verification.
- `_records/namespaces/*.art` — namespaces used by packages hosted here.
- `_records/project.art` — the project record.
- `_records/repository.art` — the repository record.

## Repository Layout

```
_guide.md        — this file
_records/        — project, repository, namespace, and license records
knowledge/       — repository-level knowledge documentation
cli/             — CLI packages; each owns its _roadmap/ and _backlog/
cli/workspace         — `@art-works/workspace-cli`
cli/board        — `@art-board/cli`
```

## Records Management

Records are co-located with the resources they describe in `_records/` directories:

- **Project:** `_records/project.art`
- **Repository:** `_records/repository.art`
- **Namespace:** `_records/namespace.art`
- **License:** `_records/license.art`

## Knowledge References

This repository maintains knowledge references at:

- `knowledge/index.md` — Repository-level knowledge.
- `cli/workspace/knowledge/index.md` — Art Workspace Cli.

## Conventions

This repository follows strict conventions.

Read the convention indexes listed below and follow them when planning and executing work.

The following conventions apply to all packages in this repository:

- `./node_modules/@noodlestan/conventions-typescript/art/index.md` — TypeScript conventions.
- `./node_modules/@noodlestan/conventions-unit-tests/art/index.md` — Unit Tests conventions.

In case of ambiguity or conflict applying conventions, follow links from the convention indexes to extended convention files and read the examples there for what to follow and what to avoid.

## Workflows

Projects in this repository use the following workflows:

| Workflow / Path                                                            | Purpose                                                                                           |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Planning Work** `$DOMAINS/work/workflows/planning-work/workflow.art`     | Create and manage work item lifecycles, collecting operational instructions according to context. |
| **Delegating Work** `$DOMAINS/work/workflows/delegating-work/workflow.art` | Organize work delegation to sub-agents with validation, execution, and verification.              |
| **Executing Work** `$DOMAINS/work/workflows/executing-work/workflow.art`   | Organize work execution by sub-agents to produce completed, verified outcomes and feedback.       |
| **Deploying** `$DOMAINS/deployments/workflows/deploying/workflow.art`      | Organizes deployment of artefacts in operations.                                                  |

### Roadmapping

This repository maintains one repository level roadmap:

- The roadmap lives at `_roadmap/` with subdirectories such as `/3-now` and `/4-next/`.
- The short-term roadmapping focus is captured in `_roadmap/_parking-lot.md`.

This repository hosts also roadmaps for:

- `cli/workspace/`

### Planning Work

This repository maintains one repository level backlog:

- The backlog lives at `_backlog/` with subdirectories such as `/3-now` and `/4-next/`.
- The short-term focus is captured in `_backlog/_parking-lot.md`.

This repository hosts also backlogs for:

- `cli/workspace/`

## Global Install Usage

The Art Workspace Cli (`@art-works/workspace-cli`) behaves the same from a global installation as from a local one: configuration is discovered from the current working directory upward, never from the CLI's install location.

### Run from a global installation

```bash
npm install -g @art-works/workspace-cli

art-workspace-cli init # in the workspace root: create `.art-workspace.mts`
art-workspace-cli sanity # from any directory inside the workspace
```

Each command walks up from the current directory to the first `.art-workspace.mts` and runs against that config root. Without a manifest anywhere in the chain, the CLI falls back to the default config rooted at the current directory.

### Set up a fresh workspace

`art-workspace-cli init` writes `.art-workspace.mts` with the default values (`checkouts.path`, `data.store`, `discover.records`) into the current directory and refuses to overwrite an existing manifest. The manifest is a plain default export, so a freshly initialised workspace loads it without a local `node_modules`.

### Run from a local checkout

From this repository, build with `npm run build` in `cli/workspace` and run `node dist/index.mjs <command>`. Discovery and config semantics are identical to the global installation.

## Operating Instructions

### Operating Instructions: Setting Up

**Instructions:**

Run from the repository root (monorepo):

```bash
npm ci # to install dependencies.
```

### Operating Instructions: Verifying Completion

**Instructions:**

Runs automatically on pre-commit hook (from the repository root):

```bash
npm run ci # lint, test and build
```
