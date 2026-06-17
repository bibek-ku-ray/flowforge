# Triggers

A **trigger** is the entry node that starts a workflow execution. Every workflow
has exactly one trigger node. The trigger determines *how* a run is started and
what data is injected into the execution `context` for downstream nodes
(AI prompts, HTTP requests, Slack/Discord messages, etc.).

FlowForge ships four trigger kinds:

| Trigger | `TriggerKind` | Node type | Started by |
| --- | --- | --- | --- |
| Manual | `MANUAL` | `MANUAL_TRIGGER` | A user pressing **Execute** in the editor, or an explicit API call. |
| Google Form | `GOOGLE_FORM` | `GOOGLE_FORM_TRIGGER` | An inbound Google Form submission webhook. |
| Stripe | `STRIPE` | `STRIPE_TRIGGER` | An inbound Stripe event webhook. |
| Schedule | `SCHEDULE` | `SCHEDULE_TRIGGER` | A recurring scan that fires due schedules on a cron/interval. |

Each kind can be turned off globally from the [Admin panel](./admin-panel.md);
when a kind is disabled, no workflow that uses that trigger will execute.

---

## Manual trigger

The Manual trigger (`MANUAL` / `MANUAL_TRIGGER`) runs a workflow on demand —
either from the **Execute** button in the editor or an explicit execution call.
It injects no trigger-specific context.

Every freshly created workflow starts with a Manual trigger so it can be tested
immediately. A workflow that uses any other trigger kind does not additionally
require a Manual trigger.

---

## Google Form trigger

The Google Form trigger (`GOOGLE_FORM` / `GOOGLE_FORM_TRIGGER`) starts a workflow
when a linked Google Form receives a submission via webhook. The submission is
injected under `context.googleForm`.

### Template variables

| Variable | Description |
| --- | --- |
| `{{googleForm.respondentEmail}}` | Email of the respondent (when collected). |
| `{{googleForm.responses['Question Name']}}` | Answer to a specific question. |
| `{{json googleForm.responses}}` | Full set of responses as JSON. |

```handlebars
A new response came in from {{googleForm.respondentEmail}}.
Summary of answers: {{json googleForm.responses}}
```

---

## Stripe trigger

The Stripe trigger (`STRIPE` / `STRIPE_TRIGGER`) starts a workflow when a Stripe
event arrives via webhook. The event is injected under `context.stripe`.

### Template variables

| Variable | Description |
| --- | --- |
| `{{stripe.eventType}}` | Event type (e.g. `payment_intent.succeeded`). |
| `{{stripe.amount}}` | Payment amount. |
| `{{stripe.currency}}` | Currency code. |
| `{{stripe.customerId}}` | Customer ID. |
| `{{json stripe}}` | Full event data as JSON. |

```handlebars
Payment of {{stripe.amount}} {{stripe.currency}} received
from customer {{stripe.customerId}} ({{stripe.eventType}}).
```

---

## Schedule trigger

The Schedule trigger (`SCHEDULE` / `SCHEDULE_TRIGGER`) runs a workflow
automatically on a recurring cron/interval schedule — no manual execution and no
inbound webhook required. Use it for jobs like *"Every day at 9:00 AM"* or
*"Every 15 minutes"*.

A schedule is stored as a single [`ScheduleTrigger`](./workflow-execution.md#scheduled-execution)
row (one per schedule node). A recurring background job scans for due schedules
every minute and reuses the same execution engine as the other trigger kinds —
see [Workflow execution → Scheduled execution](./workflow-execution.md#scheduled-execution)
for the runtime details.

### Modes

A Schedule trigger is configured in one of two modes:

| Mode | Configuration | Example |
| --- | --- | --- |
| **Simple** | Pick an interval preset. | every 5m / 15m / 30m / 1h / 1d |
| **Advanced** | Provide a raw 5-field cron expression and an IANA timezone. | `0 9 * * *` in `Asia/Kathmandu` |

In Simple mode the preset is translated into the equivalent cron expression and
stored alongside the timezone, so both modes resolve to the same underlying
`cronExpression` + `timezone` fields.

### Stored configuration (`ScheduleTrigger`)

| Field | Description |
| --- | --- |
| `cronExpression` | 5-field cron string the schedule fires on (e.g. `0 9 * * *`). |
| `timezone` | IANA timezone used to evaluate the cron (e.g. `Asia/Kathmandu`). |
| `mode` | `Simple` or `Advanced`. |
| `enabled` | Whether this schedule is active. |
| `lastRunAt` | Timestamp of the most recent fired run. |
| `nextRunAt` | Timestamp of the next due run. |

### Template variables

Scheduled runs inject `context.schedule`, so AI prompts and other nodes can
reference when and how the run was triggered:

| Variable | Description |
| --- | --- |
| `{{schedule.executedAt}}` | Timestamp the run fired at. |
| `{{schedule.timezone}}` | IANA timezone the schedule is evaluated in. |
| `{{schedule.cronExpression}}` | The cron expression that fired. |

```handlebars
Today is {{schedule.executedAt}} ({{schedule.timezone}}).
Generate the daily summary.
```

### Rules

- **One per workflow.** A workflow may contain at most one Schedule trigger.
- **No Manual trigger required.** A workflow whose only trigger is a Schedule
  trigger is valid and runs entirely on its schedule.
- **Global kill switch.** When the **Schedule** trigger is disabled in the
  [Admin panel](./admin-panel.md), the scanner skips all scheduled executions —
  every schedule effectively pauses until it is re-enabled. Individual schedules
  can also be paused via their `enabled` flag.
