---
name: Test Harness Isolation
description: Use when running or reviewing Playwright, E2E, integration, WebDriver, browser, server, or desktop-app proof commands that may spawn external processes, bind ports, or use shared temp or state. Defaults to sequential execution unless concurrency safety is explicitly proven from source.
author: Salvatore Formisano
created_at: "2026-04-19T08:45:00Z"
updated_at: "2026-04-19T10:00:00Z"
---

# Test Harness Isolation

Use this skill before running more than one proof command against the same test harness, app, or environment.

## Default rule

Assume the harness is single-instance until proven otherwise.

Do not run proof commands in parallel unless source inspection or explicit harness docs prove concurrency safety.

Lack of evidence of conflict is not evidence of safety.

## Canonical failure mode

The most common way this rule gets violated is **running an isolated slice and an integrated slice of the same test harness at the same time**. Treat "isolated + integrated of the same test surface" as a single resource unless proven otherwise. Overlapping those two commands against a single-instance harness will corrupt both runs, and the resulting output will look like a real blocker even though the evidence is contaminated.

## When this skill applies

Use it when the work involves any of:

- Playwright or other E2E runners
- WebDriver, browser automation, or desktop-app automation
- spawned app binaries
- global setup or teardown scripts
- temp files or temp directories shared across workers
- fixed ports, sockets, lockfiles, or well-known paths
- review rounds that rerun proof commands
- lead or orchestrator spot-checks of test evidence

## Preflight isolation check

Before parallelizing any proof command, inspect the harness for:

- fixed ports
- fixed temp file paths
- shared HOME or config files
- global setup that writes shared state
- global teardown that deletes shared state
- singleton background processes
- fixed remote repo paths, caches, or artifact directories

If any shared resource exists, classify the harness as `single-instance` and run the proof command sequentially.

## Allowed concurrency

You may run proof commands in parallel only if **all** of the following are true:

- each run uses a unique port or no port at all
- each run uses a unique temp directory and unique temp files
- teardown only cleans its own run-scoped resources
- no shared global file is used for worker coordination
- no singleton process or service is reused across runs
- the isolation proof is recorded in the artifact or notes

If you cannot prove all of these, run sequentially.

## Sequential execution rule

For a single-instance harness:

- run one proof command at a time
- wait for full process exit
- wait for teardown completion
- only then start the next proof command

Do not overlap isolated and integrated slices.

## Artifact rule

Proof-execution-mode enforcement is **schema-backed**, not a standalone heading. Do not invent a `## Proof Execution Mode` section.

Every proof row in review and implementation artifacts must populate a structured `execution_mode` field:

- in review artifacts (@skill:squad-review-verification): per-row `execution_mode` column on `## Feature Exercise Evidence`, `## Regression Evidence`, and `## Parity Evidence`.
- in implementation reports (@skill:squad-implementation-verification): per-command execution-mode annotation in the `## Verification` section, and per-row `execution_mode` column on `## Parity Evidence`.

Values:

- `sequential` — the proof ran sequentially; no other proof command shared the harness during the run.
- `parallel (<one-sentence source-backed isolation evidence>)` — the proof ran concurrently with another; the evidence string names unique ports, unique temp paths, absence of shared global setup, and the scope of teardown.

An artifact row missing `execution_mode` is incomplete. A `parallel` row without concrete isolation evidence is contaminated: treat it as unverifiable until a sequential rerun replaces it. A non-normative prose summary of execution mode is allowed for human readers, but the schema fields are authoritative for validation and routing.

## Review evidence rule

If a review or implementation artifact used overlapping proof runs against a single-instance harness:

- treat that evidence as contaminated
- do not infer product regressions from it
- write down the contamination mechanism: the exact shared resource that collided, the error signal that gave it away, and the contaminated runs' artifact paths
- restart the proof round sequentially before any phase transition

## Verification-of-verification rule

Reviewer-critic and orchestrator roles must check per-row `execution_mode` before routing on any proof-command result.

- If any proof row is labeled `parallel` without concrete isolation evidence, treat that row as contaminated and require a sequential rerun before any phase transition.
- If any proof row is missing `execution_mode`, treat the row as unverifiable and require the artifact to be revised.
- When a round's proof is later proven contaminated, the lead transitions the round's manifest `status` to `contaminated` per @skill:squad-manifest and records a matching `drift_checks` entry per @skill:squad-lead. The original artifact stays on disk; only the manifest's routing authority changes.
- A critic that accepts `SATISFIED` on a proof-bearing artifact without confirming every row's `execution_mode` has not done its job for this angle.

## Orchestrator rule

Only one child agent may own a single-instance harness at a time.

Do not dispatch multiple children that will:

- run the same E2E harness
- launch the same desktop app
- bind the same WebDriver or server port
- share the same temp-state bridge

When two candidate dispatches would both touch the same harness, serialize them explicitly.

## Red flags

Treat these as immediate stop signs for parallel proof:

- fixed port like `4445`
- fixed temp file like `/tmp/...`
- teardown deleting a shared file
- worker helpers reading one global path file
- one app binary launched for all tests
- `AddrInUse` or equivalent port-conflict errors in logs
- one run touching another run's temp path or remote path
- error logs showing cross-run file deletion

## Recovery

If contamination already happened:

1. Stop trusting the result.
2. Identify the shared resource that collided (port, temp file, singleton process).
3. Document the contamination: which runs overlapped, what shared resource, what error signal, which artifacts are now suspect.
4. Rerun sequentially.
5. Only then decide whether the blocker is real.

Do not route a phase or dispatch a follow-up implementer on contaminated evidence. A contaminated review is not a valid signal for the lifecycle state machine.

## Related skills

- `parallel-dispatch`: proof commands that touch shared resources are not independent work for parallel-dispatch purposes.
- `execution-discipline`: the preflight isolation check is part of the broader execution-discipline preflight.
- `squad-review-author`, `squad-review-critic`, `squad-review-verification`: enforce the schema-backed `execution_mode` columns in review evidence tables and the verification-of-verification rule in review and review-critic artifacts.
- `squad-implementation-verification`, `squad-implementer`: enforce per-command execution-mode annotation in the implementation report's `## Verification` section and the `execution_mode` column in `## Parity Evidence`.
- `squad-manifest`, `squad-lead`: carry the round-level authority status (`active`, `superseded`, `contaminated`) that records the routing consequence of contaminated or superseded proof.
