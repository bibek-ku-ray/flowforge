# Workflow execution

A workflow run is executed by a single durable Inngest function,
`execute-workflow`, which is triggered by the `workflows/execute.workflow`
event. Regardless of how a run is started, the engine behaves identically:

1. An `Execution` row is created (keyed by the Inngest event id).
2. The workflow's nodes and connections are loaded and topologically sorted.
3. `assertWorkflowTriggersEnabled()` verifies the workflow's trigger kinds are
   not globally disabled.
4. Each node's executor runs in order, threading a shared `context` object from
   one node to the next.
5. On success the `Execution` is marked `SUCCESS` with the final context as its
   output. The function's `onFailure` handler marks the `Execution` `FAILED`
   and records the error message and stack.

No execution logic is duplicated per trigger. Every entry point ultimately calls
**`sendWorkflowExecution()`**, which (optionally enforcing the trigger's global
kill switch) sends the `workflows/execute.workflow` event into the same engine.

## Entry points

### Manual execution

The **Execute** button in the editor (and the equivalent API call) invokes the
workflow router, which calls `sendWorkflowExecution(..., { triggerKind: MANUAL })`.
This is the path used for test runs and on-demand execution.

### Webhook execution (Google Form / Stripe)

Inbound webhooks for the Google Form and Stripe triggers parse and validate the
incoming payload, build the trigger-specific `context` (`context.googleForm` /
`context.stripe`), and call `sendWorkflowExecution()` with the matching
`triggerKind`. The engine then runs exactly as for a manual run.

### Scheduled execution

Schedule triggers (`SCHEDULE` / `SCHEDULE_TRIGGER`) are driven by a recurring
Inngest function, **`scheduler-scan`**, that runs once a minute:

```ts
{ cron: "* * * * *" }
```

Each scan performs the following:

1. **Kill-switch check.** Read the global `SCHEDULE` trigger setting. If the kind
   is disabled in the [Admin panel](./admin-panel.md), the scan exits without
   firing anything.
2. **Due detection.** Find every `ScheduleTrigger` that is due:
   `enabled === true && nextRunAt <= now`.
3. **Atomic compare-and-swap (CAS) lock.** For each due schedule, perform an
   atomic update that advances `nextRunAt` to the following occurrence and sets
   `lastRunAt = now`, conditioned on the row still matching the `nextRunAt` value
   the scan observed. This single update both *claims* the slot and *advances*
   the schedule. Because only one scan can win the conditional update for a given
   slot, this guarantees **duplicate prevention** — a schedule cannot be fired
   twice for the same occurrence even if scans overlap.
4. **Dispatch.** For each schedule the scan successfully claimed, call
   `sendWorkflowExecution(..., { triggerKind: SCHEDULE })`, injecting
   `context.schedule = { executedAt, timezone, cronExpression }`. From here the
   run is indistinguishable from any other execution — same engine, same
   `Execution` records, same node executors.

#### Missed-run self-healing

The scan keys off `nextRunAt <= now` rather than "fires exactly on the tick", so
a schedule whose `nextRunAt` is in the past (e.g. the worker was down, or a scan
was delayed) is simply picked up by the next minute's scan and fired then. There
is no separate catch-up job — overdue schedules self-heal on the following scan.

#### Failure handling and retries

A scheduled run is an ordinary execution: if it fails, `execute-workflow`'s
`onFailure` marks the `Execution` `FAILED` and records the error, and retries
follow the engine's existing execution retry behavior. Because `nextRunAt` is
advanced by the CAS *before* dispatch, a failed run does not block the schedule —
the next occurrence is already queued for a future scan.
