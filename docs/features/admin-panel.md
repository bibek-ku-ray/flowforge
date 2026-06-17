# Admin panel

The admin panel (`/admin`) exposes platform-wide controls for users with the
`ADMIN` role.

## Trigger settings

The **Triggers** page lets an admin enable or disable each trigger kind
globally. Each kind is backed by a `TriggerSetting` row keyed by `TriggerKind`;
rows are seeded automatically (defaulting to **enabled**). Disabling a kind is a
hard kill switch — no workflow that uses that trigger will execute while it is
off, regardless of individual workflow configuration.

The page shows one toggle per trigger kind:

| Toggle | `TriggerKind` | Effect when disabled |
| --- | --- | --- |
| Manual trigger | `MANUAL` | Editor test runs and explicit executions are blocked. |
| Google Form trigger | `GOOGLE_FORM` | Inbound Google Form submissions are ignored. |
| Stripe trigger | `STRIPE` | Inbound Stripe events are ignored. |
| **Schedule** | `SCHEDULE` | The `scheduler-scan` job skips all due schedules — every scheduled workflow pauses until re-enabled. |

The **Schedule** toggle is the fourth control on the page, alongside Manual,
Google Form, and Stripe. The scheduler reads this setting at the start of every
scan (see
[Workflow execution → Scheduled execution](./workflow-execution.md#scheduled-execution)),
so disabling it stops all scheduled executions immediately on the next minute's
scan without touching any individual schedule's `enabled` flag.
