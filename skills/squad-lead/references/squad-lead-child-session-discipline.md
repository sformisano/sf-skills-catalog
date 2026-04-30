# Squad Lead Child Session Discipline

Use this reference when the lead is monitoring a plan-author, implementer, or reviewer session.

## Default stance

- Treat child sessions as healthy by default.
- Do not infer failure from elapsed time alone.
- Before declaring a session stuck, require either:
  - an explicit blocker
  - repeated no-progress evidence
  - failure to append a heartbeat or artifact after an explicit escalation interrupt

## Critical-path monitoring

This protocol applies to implementer and reviewer sessions.

1. Create a heartbeat file such as `heartbeats/{phase}.{loop}.round-{N}.{role}.md`.
2. Pass `heartbeat_path` in the dispatch prompt.
3. Record that path in `manifest.yaml` as `current.heartbeat_path` and add or update the matching `child_sessions` entry with role, phase, loop, round, output path, heartbeat path, dispatch timestamp, and `status: active`.
4. On timeout, read the heartbeat file and target artifact before interrupting.
5. Treat the session as healthy when heartbeat or artifact updates continue and no blocker is reported.
6. Escalate only when repeated checks show no factual delta, the heartbeat reports a blocker, or routing requires immediate artifact write-out.

Use these thresholds:

- one bounded wait: 10 minutes
- first stale classification: at least 30 minutes since the last factual delta and 3 consecutive monitor checks with no delta
- if the heartbeat says a long proof or long-running command is in flight and `can_write_now: no`, extend the first stale floor to 40 minutes

`Factual delta` means any of:

- a new heartbeat entry
- a change in `step`, `last_completed`, `current_gate`, or `blocker`
- a target artifact file update

Escalation ladder:

1. `append heartbeat now or write artifact now`
2. if needed: `after this, the next message will request artifact write regardless`

Shutdown is allowed only after:

- at least one heartbeat entry or blocker report exists
- you have no-progress evidence, not just no-finish
- you sent the final explicit interrupt
- the specialist still failed to append a heartbeat or write the artifact, or reported a blocker that makes further waiting non-productive

## Plan-author artifact liveness

Plan-author does not use heartbeat files. Use the target plan artifact plus explicit blocker signals.

Positive liveness signal means any of:

- target artifact file created
- target artifact file mtime changed
- explicit child message that drafting or writing is in progress
- explicit blocker report

Use these thresholds:

- one bounded wait: 10 minutes
- first stale classification: at least 30 minutes since the last positive liveness signal and 3 consecutive monitor checks with no delta

Escalation ladder:

1. request plan artifact write-out or blocker report
2. repeat once if no artifact progress or blocker report arrives by the next bounded wait

Plan-author shutdown is allowed only when:

- there is no artifact creation or update across the stale window
- there is no positive liveness signal across the same window
- both escalation interrupts produced no artifact progress and no blocker report

## Chat heartbeat

While a critical-path child is active:

- send one short chat heartbeat immediately after dispatch
- send another after every two bounded waits with no visible lifecycle transition
- send an immediate heartbeat when the child escalates, reports a blocker, or completes

Each update should include:

- specialist role
- phase and round
- latest heartbeat signal or `no new heartbeat yet`
- whether the child appears healthy, blocked, or suspect
- the next lead action

## Monitor loop

For each critical-path child:

1. Record dispatch notes in `manifest.yaml` under `child_sessions` with role, purpose, output path, heartbeat path when used, phase, round, critical-path status, dispatch timestamp, and `status: active`.
2. Enter monitoring mode immediately and send the initial chat heartbeat.
3. Wait in 10-minute intervals.
4. On timeout, inspect heartbeat or artifact evidence first, then decide whether to keep waiting or escalate.
5. On child completion, inspect the returned artifact or blocker immediately, update the matching `child_sessions` entry to `completed`, update the manifest, clear `current.heartbeat_path` when applicable, send the completion heartbeat, and trigger the next lifecycle step.
6. Exit monitoring mode only when no plan-author or critical-path child sessions remain and the lifecycle is either waiting on the user or complete for the turn.
