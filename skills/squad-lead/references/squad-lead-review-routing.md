# Squad Lead Review Routing

Use this reference during Phase 3 and Phase 4 when accepted review evidence affects routing authority.

## Proof execution mode check

Before accepting any implementation or review artifact that carries proof-command output:

- every row of `## Fixture Exercise Evidence`, `## Negative Surface Evidence`, `## Feature Exercise Evidence`, `## Regression Evidence`, and `## Parity Evidence` must populate `execution_mode`
- every command-backed row in `## Claim Proof Results` and `## Claim Verification` must populate `execution_mode`
- every proof command in an implementation report's `## Verification` must also annotate its execution mode

If any required row or command lacks `execution_mode`, reject the artifact as incomplete.

If any row or command is marked `parallel` without concrete, source-backed isolation evidence, treat it as contaminated:

- do not route on the findings it produced
- mark the round `status: contaminated` in the manifest with the required status fields populated atomically
- append a matching `drift_checks` entry with resolution `restart`
- recompute the array's `final_round`
- require a sequential rerun before any phase transition

## Authority transitions

Never rewrite historical artifacts. Update routing authority in the manifest instead.

Case 1, same-scope supersession:

- newer accepted evidence replaces older accepted evidence
- keep both artifacts on disk
- mark the older round `status: superseded`
- mark the newer round `status: active`
- recompute `final_round`
- append a `drift_checks` entry
- perform the manifest update atomically

Case 2, contamination discovered later:

- keep the artifact on disk
- mark the affected round `status: contaminated`
- populate `status_changed_at`, `status_reason`, and `status_record_path`
- recompute `final_round`
- append a `drift_checks` entry with resolution `restart`
- rerun the proof sequentially before routing

Case 3, end-to-end evidence reopens a locally accepted phase:

- do not mark the earlier local submit round `superseded` or `contaminated`
- update `phases[].closure.local_status` to `reopened_by_e2e`
- populate `reopened_by_e2e_round`, `reopened_at`, and `reopen_reason` atomically
- append a `drift_checks` entry
- route back to the reopened phase

Return transition after reopen:

- when a reopened phase later reaches a new local `submit`, set `closure.local_status` back to `locally_accepted`
- update `local_submit_round` and `local_submitted_at` to the new round
- keep the reopen fields as historical record

## User-facing wording

Use these exact phrases:

- `PHASE-XX is locally accepted and may still be reopened by end-to-end sweep.`
- `PHASE-XX was previously locally accepted; it is now reopened by end-to-end evidence.`
- `PHASE-XX is locally re-accepted after reopen; it may still be reopened again by further end-to-end evidence.`
- `The lifecycle is globally final and delivery-ready.`

Avoid saying `PHASE-XX finished` without qualification.

## Environment-blocker rerun rule

Before dispatching a new implementer because review returned `action: implement`, check whether the blocker is environment-class:

- the review names a setup, build, fixture, credential, service bring-up, or harness-availability failure
- the failure path is part of the documented prerequisite chain
- the reviewer's bounded attempt stopped at or before the prerequisite step

When all three conditions hold:

1. Rerun the named prerequisite chain once.
2. Rerun the review's documented command or action once.
3. Record the rerun in `drift_checks`.

Then branch:

- if the rerun reproduces the environment failure, treat it as a real harness defect and dispatch implementation or escalate to the user
- if the rerun succeeds, re-dispatch the same review round instead of opening a new implementation round
- if the rerun reveals a different product defect, dispatch implementation against that new blocker and record the classification shift

This rerun is bounded to one attempt per review round.

## Pre-E2E smoke execution mode

Phase 3.75 smoke rows follow the same isolation discipline:

- every command-backed `## Claim Smoke Results` row must populate `execution_mode`
- a smoke row missing `execution_mode` fails the smoke
- a smoke row marked `parallel` without concrete isolation evidence is contaminated and must be rerun sequentially before Phase 4 dispatch

Smoke contamination does not create an end-to-end round. Record the smoke artifact in `pre_e2e_smoke`, append a `drift_checks` entry, and rerun the smoke proof sequentially.
