# FlowForge — Product Requirements

FlowForge is a workflow automation builder: users compose workflows on a visual
canvas (React Flow), each starting from a **trigger** node and chaining together
action nodes (HTTP requests, AI models, Slack/Discord, etc.). Runs are executed
durably by Inngest against a shared execution engine.

## Triggers

Every workflow starts from exactly one trigger. FlowForge supports four trigger
kinds:

- **Manual** — run on demand from the editor or an API call.
- **Google Form** — run on an inbound Google Form submission webhook.
- **Stripe** — run on an inbound Stripe event webhook.
- **Schedule** — run automatically on a recurring cron/interval schedule, with
  no manual execution or webhook required.

### Schedule trigger

The Schedule trigger lets a workflow run on a recurring schedule such as
*"Every day at 9:00 AM"* or *"Every 15 minutes"*.

- **Modes:** *Simple* (interval presets: every 5m / 15m / 30m / 1h / 1d) and
  *Advanced* (a raw 5-field cron expression plus an IANA timezone).
- **Execution:** a recurring `scheduler-scan` job runs every minute, checks the
  global Schedule kill switch, finds due schedules, atomically claims each one,
  and dispatches it through the existing execution engine. See
  [Workflow execution](./features/workflow-execution.md#scheduled-execution).
- **Context:** scheduled runs expose `{{schedule.executedAt}}`,
  `{{schedule.timezone}}`, and `{{schedule.cronExpression}}` to downstream nodes.
- **Constraints:** at most one Schedule trigger per workflow; a Schedule-only
  workflow is valid and does not need a Manual trigger.
- **Reliability:** duplicate runs are prevented by an atomic compare-and-swap on
  `nextRunAt`; missed runs self-heal on the next scan; failures are recorded like
  any execution.
- **Admin:** the Schedule kind can be disabled globally from the
  [Admin panel](./features/admin-panel.md).

## Feature matrix

| Capability | Manual | Google Form | Stripe | Schedule |
| --- | --- | --- | --- | --- |
| Trigger kind | `MANUAL` | `GOOGLE_FORM` | `STRIPE` | `SCHEDULE` |
| Node type | `MANUAL_TRIGGER` | `GOOGLE_FORM_TRIGGER` | `STRIPE_TRIGGER` | `SCHEDULE_TRIGGER` |
| Started by | User / API | Inbound webhook | Inbound webhook | Recurring `scheduler-scan` |
| Injects `context` | — | `context.googleForm` | `context.stripe` | `context.schedule` |
| Global kill switch | Yes | Yes | Yes | Yes |
| Reuses execution engine | Yes | Yes | Yes | Yes |
| One-per-workflow limit | — | — | — | Yes |
