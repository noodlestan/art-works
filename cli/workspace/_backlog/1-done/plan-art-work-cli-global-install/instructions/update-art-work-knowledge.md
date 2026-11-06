# Instructions: `update-art-work-knowledge`

**Plan:** `art-work-cli-global-install`

**Iteration Id:** `update-art-work-knowledge`

## Before you Start

::switch `agent-worker` — switch to the agent-worker agent mode to execute these instructions. Your mode must be `worker` before you start changing files.

These are your instructions.

RULE: If at any point you are instructed to **REPORT A BLOCKER** or you encounter a commit with `policy` set to `MANUAL` execute the instruction in the "## How to Report Back to the Delegator" section below and STOP processing any other instructions.

## How to Report Back to the Delegator

This section describes how to report back to the delegator after completing the instruction.

1. Summarise the current context, asking: are you reporting completion or a BLOCKER?
2. Gather the evidence of changes made and outcomes achieved, or the blocker error details.
3. Use the `render-template` skill with the `.agents/domains/plans/templates/instructions-report.tart` to render your report and write it next to this instruction file: `plan-art-work-cli-global-install/instructions/update-art-work-knowledge__report.md`. No separate delegation record is created.
4. If your prompt included a `DIRECTIVE FEEDBACK:` include the feedback sections in the rendered report.
5. Generate the response and send it back to the delegator.
6. Keep the response terse per the Working Agreements: happy face + up to 3 bullet points (done `update-art-work-knowledge`, created `{artefacts}`, thumbs up). The full trail lives in the report file; never repeat it in chat.

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
3. **User interaction is minimal.** The user relays this instructions file to the delegator and expects a light confirmation: a happy face and up to 3 bullet points — done `update-art-work-knowledge`, created `{artefacts}`, thumbs up. If something goes horribly wrong, report the blocker instead of a summary.

## Goals

This section describes the goal(s) of this iteration.

Update the Art Works knowledge files to reflect the global-install capability and the new configuration semantics, documenting how the CLI locates configuration, operates in global vs local modes, and the shape of the workspace config.

## Mandatory Reading

This section lists the documentation and reference files the sub-agent needs to read before making changes.

- RULE: You MUST follow any links under `## Mandatory Reading` sections found in the listed files.
- RULE: If you are unable to read a file linked under `## Mandatory Reading` you must stop and REPORT A BLOCKER.

- knowledge: `$ART_WORKS/cli/workspace/knowledge/index.md`
- guide: `$ART_WORKS/_guide.md`

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

- Step 1 / 3 — Update knowledge and guide
- Step 2 / 3 — Update config README
- Step 3 / 3 — Commit `update-art-work-knowledge`

## Steps

This section contains the detailed steps to execute, including commit steps.

### Step `1 / 3` — Update knowledge and guide

Update `$ART_WORKS/cli/workspace/knowledge/index.md` to document the global-install execution model: how the CLI locates configuration (current working directory and parent dirs), how it operates in global vs local modes, and the new workspace config shape (`root`, `checkouts`, `data.store`, `discover.records`).

Update `$ART_WORKS/_guide.md` with global install usage notes, including how to run the CLI from a global installation and how to use the `init` command to set up a fresh workspace.

Use only the new config names (`checkouts`, `data.store`, `discover.records`) — never `clone` or `records`.

### Step `2 / 3` — Update config README

Update `$ART_WORKS/cli/workspace/src/config/README.md` (or create it if it does not exist) describing the config file format and discovery: the manifest file name (`.art-workspace.mts`), the discovery process (current dir and parents), the shipped bundle-cache behaviour (`node_modules/.art-workspace`, `--no-config-cache` bypass, legacy-bundle cleanup — no second compile location), and the default config values.

### Step `3 / 3` — Commit `update-art-work-knowledge`

---

#### Commit: `update-art-work-knowledge`

**Policy:** AUTONOMOUS — Agent should commit autonomously, push, and proceed to the next step.

**Message:**

```text
docs(art-workspace-cli): Update knowledge for global install and config semantics.
```

---

## Final Verification

This section describes how to confirm the iteration is completed and ready for being committed.

**Instructions:**

- Verify that commits have been executed and pushed (or not pushed) according to the commit's policy.
- Verify that `$ART_WORKS/cli/workspace/knowledge/index.md` documents the global-install execution model and the new config shape.
- Verify that `$ART_WORKS/_guide.md` includes global install usage notes.
- Verify that `$ART_WORKS/cli/workspace/src/config/README.md` describes the config file format and discovery.
- Verify that no references to the old config names (`clone`, `records`) remain in the updated knowledge files.
- Execute the **Verifying Completion** step as defined in the "Operating Instructions" section.
- Report according to the "How to Report Back to the Delegator" instructions.
