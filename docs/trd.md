# FlowForge — Technical Reference

Stack: Next.js 16, Prisma + PostgreSQL, Inngest (durable execution), React Flow
(canvas), tRPC, TypeScript.

## Trigger kinds (`TriggerKind`)

| Value | Description |
| --- | --- |
| `MANUAL` | On-demand execution from the editor or API. |
| `GOOGLE_FORM` | Inbound Google Form submission webhook. |
| `STRIPE` | Inbound Stripe event webhook. |
| `SCHEDULE` | Recurring cron/interval schedule, fired by `scheduler-scan`. |

Each kind has a `TriggerSetting` row (keyed by `TriggerKind`) that acts as a
global kill switch; rows are seeded enabled by default.

## Node types (`NodeType`)

Trigger node types map 1:1 to trigger kinds:

| Node type | Trigger kind |
| --- | --- |
| `MANUAL_TRIGGER` | `MANUAL` |
| `GOOGLE_FORM_TRIGGER` | `GOOGLE_FORM` |
| `STRIPE_TRIGGER` | `STRIPE` |
| `SCHEDULE_TRIGGER` | `SCHEDULE` |

(Action node types — `HTTP_REQUEST`, `OPENAI`, `ANTHROPIC`, `GEMINI`, `DISCORD`,
`SLACK`, etc. — are unchanged.)

## Data model

### `ScheduleTrigger`

One row per Schedule trigger node, holding the schedule's configuration and
runtime cursor:

| Field | Type | Description |
| --- | --- | --- |
| `cronExpression` | `String` | 5-field cron expression the schedule fires on. |
| `timezone` | `String` | IANA timezone used to evaluate the cron. |
| `mode` | enum | `Simple` (interval preset) or `Advanced` (raw cron). |
| `enabled` | `Boolean` | Whether the schedule is active. |
| `lastRunAt` | `DateTime?` | Timestamp of the most recent fired run. |
| `nextRunAt` | `DateTime` | Timestamp of the next due run; the CAS cursor. |

## Execution

The `execute-workflow` Inngest function is the single execution engine for all
trigger kinds; entry points dispatch into it via `sendWorkflowExecution()`.

`scheduler-scan` is a recurring Inngest function (`{ cron: "* * * * *" }`) that:

1. Checks the global `SCHEDULE` kill switch and exits early if disabled.
2. Selects due schedules (`enabled && nextRunAt <= now`).
3. Performs an atomic compare-and-swap that advances `nextRunAt` and sets
   `lastRunAt`, which both claims the slot and prevents duplicate execution.
4. Calls `sendWorkflowExecution(..., { triggerKind: SCHEDULE })`, injecting
   `context.schedule = { executedAt, timezone, cronExpression }`.

Overdue schedules self-heal on the next scan; failures are recorded by the
engine's existing `onFailure` handler. See
[Workflow execution](./features/workflow-execution.md#scheduled-execution).
