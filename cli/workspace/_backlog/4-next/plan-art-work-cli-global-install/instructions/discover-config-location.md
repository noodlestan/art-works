# Instructions: `discover-config-location`

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `discover-config-location`

## Before you Start

::switch `agent-worker` — switch to the agent-worker agent mode to execute these instructions. Your mode must be `worker` before you start changing files.

These are your instructions.

RULE: If at any point you are instructed to **REPORT A BLOCKER** or you encounter a commit with `policy` set to `MANUAL` execute the instruction in the "## How to Report Back to the Delegator" section below and STOP processing any other instructions.

## How to Report Back to the Delegator

This section describes how to report back to the delegator after completing the instruction.

1. Summarise the current context, asking: are you reporting completion or a BLOCKER?
2. Gather the evidence of changes made and outcomes achieved, or the blocker error details.
3. Use the `render-template` skill with the `.agents/domains/plans/templates/instructions-report.tart` to render your report and write it next to this instruction file: `plan-art-work-cli-global-install/instructions/discover-config-location__report.md`. No separate delegation record is created.
4. If your prompt included a `DIRECTIVE FEEDBACK:` include the feedback sections in the rendered report.
5. Generate the response and send it back to the delegator.
6. Keep the response terse per the Working Agreements: happy face + up to 3 bullet points (done `discover-config-location`, created `{artefacts}`, thumbs up). The full trail lives in the report file; never repeat it in chat.

## Path Variables

| Variable     | Resolved Path                    | Purpose                                           |
| ------------ | -------------------------------- | ------------------------------------------------- |
| `$WORKSPACE` | Current working directory        | Workspace root directory                          |
| `$DOMAINS`   | `$WORKSPACE/.agents/domains`     | Domain resources directory                        |
| `$ART_WORKS` | `$WORKSPACE/checkouts/art-works` | Art Works repository; hosts this plan and package |

## Working Agreements

The plan workflow (see the entry point guide → Planning Workflow → Working Together) runs on three working agreements:

1. **This instructions file is self-contained.** Everything you need is in this file plus its mandatory reading — never rely on session memory, chat context, or details relayed by the user.
2. **Your report is mandatory.** The rendered report file carries the full trail: evidence, changes, verification results, blockers, feedback. Your chat response is only a pointer to it.
3. **User interaction is minimal.** The user relays this instructions file to the delegator and expects a light confirmation: a happy face and up to 3 bullet points — done `discover-config-location`, created `{artefacts}`, thumbs up. If something goes horribly wrong, report the blocker instead of a summary.

## Goals

This section describes the goal(s) of this iteration.

Make the Art Workspace Cli execute independently of its source checkout when installed globally by discovering the configuration file in the current working directory and its parent directories, compiling it to a hidden `.art` temp directory, applying default config values when not found, and displaying the active configuration on every run.

## Mandatory Reading

This section lists the documentation and reference files the sub-agent needs to read before making changes.

- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

- knowledge: `$ART_WORKS/cli/workspace/knowledge/index.md`
- config loader: `$ART_WORKS/cli/workspace/src/config/loadWorkspaceConfig.ts` (current manifest/temp file handling)

---

## Operating Instructions

### Setting Up

**Purpose:** Prepare the execution environment. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/setting-up/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

Run from the `$WORKSPACE` root:

```bash
npm ci # to install dependencies.
npm run ci # to verify build is green before starting
```

If any of these fail, resolve the issue before proceeding with implementation. Do NOT run `npm install` inside `$ART_WORKS` (the package directory) — a local `node_modules` there shadows the monorepo resolution and breaks the build.

### Writing Commit Message

**Purpose:** Write standardized message according to context conventions. Operation of Workflow: Planning Work, defined in `$DOMAINS/work/workflows/planning-work/writing-commit-message/operation.art`.

**Instructions:** (From `$WORKSPACE/_guide.md`)

1. Read commit message conventions from `$WORKSPACE/knowledge/conventions/writing-commit-message.art`.
2. Write the commit message following: the rules defined there.

### Verifying Completion

**Purpose:** Confirms that the work item has been completed and satisfies its intended outcome. Operation of Workflow: Executing Work, defined in `$DOMAINS/work/workflows/executing-work/verifying-completion/operation.art`.

**Instructions:** (From `$ART_WORKS/_guide.md`)

Run from the package directory:

```bash
npm run lint:fix # to fix formatting issues automatically
npm run lint # to report other issues (prettier, eslint, tsc --noEmit)
npm run build
npm run test
```

Additionally verify the CLI from a global installation and from the local development environment. All steps MUST pass. No `it.todo()` tests may remain.

---

## Changes

This section summarises the changes to be made in this iteration.

- Step 1 / 4 — Discover configuration by scanning parent dirs
- Step 2 / 4 — Commit `discover-config-location`
- Step 3 / 4 — Feed the shipped bundle cache and show config options
- Step 4 / 4 — Commit `compile-config-to-temp-dir` and `show-config-options`

## Steps

This section contains the detailed steps to execute, including commit steps.

### Step `1 / 4` — Discover configuration by scanning parent dirs

Implement configuration discovery in `$ART_WORKS/cli/workspace/src/private/cli/createConfig.ts` (created in the `refactor-config-semantics` iteration). Replace the `// WIP: Config discovery next.` placeholder with logic that:

- Starts from the current working directory and walks up through parent directories.
- Looks for the workspace config manifest file (`.art-workspace.mts`) at each level.
- Stops at the first directory containing the manifest and uses it as the config root.
- If no manifest is found in the current directory or any parent, falls back to default config values.

In this scenario, checkouts are assumed at `checkouts` and, if repos are added, they are stored in `_records/repositories/`.

### Step `2 / 4` — Commit `discover-config-location`

---

#### Commit: `discover-config-location`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
build(art-workspace-cli): Discover configuration file.
```

---

### Step `3 / 4` — Feed the shipped bundle cache and show config options

Compilation already ships: `loadWorkspaceConfig.ts` bundles the manifest with esbuild into the `node_modules/.art-workspace` cache (reuse/rebuild logging, `--no-config-cache` bypass, legacy `.art-workspace-bundle.mjs` cleanup). **Do not introduce a second temp/compile location.** The remaining work here is to feed that loader with the Step 1 discovery result — the discovered manifest path becomes the config root — and to keep the existing config-cache tests green.

Advertise the active configuration on every run:

- When no config file is found, print `running without config`.
- When a config file is found, print `Running from config at {path}`.

### Step `4 / 4` — Commit `compile-config-to-temp-dir` and `show-config-options`

---

#### Commit: `compile-config-to-temp-dir`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
build(art-workspace-cli): Compile config to .art directory.
```

---

#### Commit: `show-config-options`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
build(art-workspace-cli): Show config options.
```

---

## Final Verification

This section describes how to confirm the iteration is completed and ready for being committed.

**Instructions:**

- Verify that commits have been executed and pushed (or not pushed) according to the commit's policy.
- Verify that the CLI discovers the config file by scanning the current working directory and parent directories, and falls back to defaults when none is found.
- Verify that the discovered config flows through the shipped esbuild bundle cache (`node_modules/.art-workspace`) with no second compile location introduced.
- Verify that the CLI advertises `running without config` or `Running from config at {path}` on every run.
- Execute the **Verifying Completion** step as defined in the "Operating Instructions" section.
- Report according to the "How to Report Back to the Delegator" instructions.
