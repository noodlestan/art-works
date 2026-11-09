# Art Workspace Cli - Operations Log

**Purpose:** Specify the side-effect log of a command invocation.

## OperationsLog

Append-only log of the side effects performed during a command invocation. Created per command; discarded at the end of the invocation (see `index.md` — Execution Model). Its append-only nature means it can be replayed or streamed by a future reactive layer.

| member           | semantics                    |
| ---------------- | ---------------------------- |
| `log(operation)` | append an operation          |
| `all()`          | all operations, in order     |
| `since(ts)`      | operations after a timestamp |
| `latest(n)`      | the last `n` operations      |

## Operation

A single recorded side effect. Operations are typed by kind and carry a pending, success, or failure outcome:

- **`operation`** — one of: `clone`, `push`, `pull`, `publish`, `branch`, `linked`, `unlink`, `run`.
- **`ts`** — creation time; `finishedTs` is set when the operation resolves.
- **`outcome`** — `pending`, `success`, or `failure`; failures carry an error.
- **`timing()`** — `finishedTs - ts` in ms, `NaN` while pending.
- **payload** — the kind-specific fields (location for clone, branch for push, package and version for publish), the checkout the operation targeted, and the text to report.

Success and failure are derived generically from the pending instance via `createOperationSuccess(pending, text?)` / `createOperationFailure(pending, error)` rather than per-kind factories.

Reports are presented separately — see `reports.md`.
