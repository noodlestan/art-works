# Instructions: `add-init-command`

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `add-init-command`

## Before you Start

::switch `agent-worker` — switch to the agent-worker agent mode to execute these instructions. Your mode must be `worker` before you start changing files.

These are your instructions.

RULE: If at any point you are instructed to **REPORT A BLOCKER** or you encounter a commit with `policy` set to `MANUAL` execute the instruction in the "## How to Report Back to the Delegator" section below and STOP processing any other instructions.

## How to Report Back to the Delegator

This section describes how to report back to the delegator after completing the instruction.

1. Summarise the current context, asking: are you reporting completion or a BLOCKER?
2. Gather the evidence of changes made and outcomes achieved, or the blocker error details.
3. Use the `render-template` skill with the `.agents/domains/plans/templates/instructions-report.tart` to render your report and write it next to this instruction file: `plan-art-work-cli-global-install/instructions/add-init-command__report.md`. No separate delegation record is created.
4. If your prompt included a `DIRECTIVE FEEDBACK:` include the feedback sections in the rendered report.
5. Generate the response and send it back to the delegator.
6. Keep the response terse per the Working Agreements: happy face + up to 3 bullet points (done `add-init-command`, created `{artefacts}`, thumbs up). The full trail lives in the report file; never repeat it in chat.

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
3. **User interaction is minimal.** The user relays this instructions file to the delegator and expects a light confirmation: a happy face and up to 3 bullet points — done `add-init-command`, created `{artefacts}`, thumbs up. If something goes horribly wrong, report the blocker instead of a summary.

## Goals

This section describes the goal(s) of this iteration.

Add a new `init` command that creates a configuration file with default values for `root.path` and `checkouts.path` redeclared for an easy to use starting point, so the Art Workspace Cli can be set up in a fresh workspace when installed globally.

## Mandatory Reading

This section lists the documentation and reference files the sub-agent needs to read before making changes.

- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

- knowledge: `$ART_WORKS/cli/workspace/knowledge/index.md`
- CLI entry: `$ART_WORKS/cli/workspace/src/index.ts` (where commands are registered)

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

- Step 1 / 3 — Add the `init` command
- Step 2 / 3 — Verify the `init` command output
- Step 3 / 3 — Commit `add-init-command`

## Steps

This section contains the detailed steps to execute, including commit steps.

### Step `1 / 3` — Add the `init` command

Add a new `init` command to the CLI in `$ART_WORKS/cli/workspace/src/index.ts`. The command must:

- Create a configuration file named `.art-workspace.mts` (the manifest constant in `loadWorkspaceConfig.ts`) in the current working directory with default values for `root.path` and `checkouts.path` redeclared for an easy to use starting point — the name must match what discovery scans for.
- Use only the new config names (`checkouts`, `data.store`, `discover.records`) — never `clone` or `records`.
- Follow the same command registration pattern as the existing commands (sanity, branch, checkouts, clone, link, publish, pull, push, repo, sync, unlink).

### Step `2 / 3` — Verify the `init` command output

Run the `init` command in a temporary directory and verify that:

- A configuration file is created with the expected default values for `root.path` and `checkouts.path`.
- The generated config uses the new config shape (`checkouts`, `data.store`, `discover.records`).
- The CLI can subsequently discover and load the generated config.

### Step `3 / 3` — Commit `add-init-command`

---

#### Commit: `add-init-command`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
build(art-workspace-cli): Add Init Command.
```

---

## Final Verification

This section describes how to confirm the iteration is completed and ready for being committed.

**Instructions:**

- Verify that commits have been executed and pushed (or not pushed) according to the commit's policy.
- Verify that the `init` command creates a config file with default `root.path` and `checkouts.path` values using the new config shape.
- Verify that the generated config is discoverable and loadable by the CLI.
- Execute the **Verifying Completion** step as defined in the "Operating Instructions" section.
- Report according to the "How to Report Back to the Delegator" instructions.
