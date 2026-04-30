---
name: squad-review-verification
description: "Defines the required structure of a squad lifecycle review artifact, including findings, evidence tables, and routing rules. Use when loaded by squad review author, review critic, or squad lead, not for ordinary code review."
metadata:
  skillcatalog/display_name: "Squad Review Verification"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Review Verification

This skill defines what a usable review artifact looks like for the internal squad lifecycle.

## Build order

1. Fill frontmatter with round, phase, mode, findings, and action.
2. Write the required review sections.
3. Add scenario, feature exercise, regression, or parity evidence when triage requires them.
4. Apply the action-derivation rules and quality checks before the artifact is accepted.

## Frontmatter

```yaml
---
round: <N>
phase: <PHASE-ALL|PHASE-01|PHASE-02>
mode: phase | end_to_end       # "phase" for per-phase reviews, "end_to_end" for the Phase 4 sweep
findings: <count>
action: implement|submit
---
```

When `mode: end_to_end`, `phase` is still populated (typically with the last phase's ID) but the review's scope is the integrated diff across all phases, not any single phase.

## Action derivation

The lead derives `action` from the final review report:

- If any non-negotiable is `failed`, `deferred`, or `unknown`, action is `implement`
- If any in-scope `## Claim Verification` row for an NNG or high-risk REQ is `partial`, `failed`, or `not_applicable`, action is `implement`
- If required `## Fixture Exercise Evidence` or `## Negative Surface Evidence` is absent or thin, action is `implement`
- If any non-trivial finding exists, action is `implement`
- If `triage.flags.external-behavior-change: true` OR `triage.flags.compatibility-promise: true`, and `## Feature Exercise Evidence` is absent or thin, and the lead has not recorded a matching `gate: exercise` waiver in the manifest with `approver: user` or `ratified_by_user: true`, action is `implement`
- If `triage.flags.bug-fix-regression: true` and `## Regression Evidence` is absent or thin, action is `implement`
- If `triage.flags.behavior-preserving-refactor: true` and `## Parity Evidence` is absent or thin, action is `implement`
- If findings are zero, all non-negotiables are `satisfied`, all in-scope NNG and high-risk REQ claims are `satisfied`, and all required claim, exercise, regression, and parity evidence (or a valid manifest-recorded exercise waiver) is present, action is `submit`

`Trivial` observations do not count toward the findings total.

## Reusable inputs vs fresh evidence

Review may cite inventory-class inputs from the plan's `## Verification Inputs` and the implementation report's `## Exercise Setup` or `## Regression Baseline`: commands, fixture paths, harness names, endpoints, environment toggles, expected signals, and preserved before-state artifacts.

Those inputs do not count as review proof. `## Claim Verification`, `## Fixture Exercise Evidence`, `## Negative Surface Evidence`, `## Feature Exercise Evidence`, `## Regression Evidence`, and `## Parity Evidence` must record the current reviewer's direct action, inspection, or observed result.

## Required sections

### Requirement Coverage

Mention every reviewed in-scope `REQ-XXX` with a status.

### Requirement Drift

Describe any drift from the plan. Use `- None.` when empty.

### Non-Negotiable Status

Mention every in-scope `NNG-XX` with one of: `satisfied`, `failed`, `deferred`, `unknown`.

### Claim Verification

Required when the plan contains `## Claim/Mechanism/Proof Matrix`.
Use the high-risk REQ definition from `references/squad-claim-proof-matrix.md`.
For `mode: phase`, verify rows whose `proof_stage` matches the reviewed `PHASE-XX` or `PHASE-ALL`. For `mode: end_to_end`, verify rows with `proof_stage: e2e` and any integrated interaction the phase reviews could not see.

| claim_id | requirement | status | mechanism checked | positive proof | negative proof | execution_mode | evidence | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CLAIM-001 | NNG-01 | satisfied | parser and help generation inspected | reviewer ran `tool --help` | `--removed-flag` absent from help and docs | sequential | `src/cli.rs:42`, captured help output | none |

Status values:

- `satisfied`
- `partial`
- `failed`
- `not_applicable (<reason>)`

Rules:

- any in-scope `partial`, `failed`, or `not_applicable` row for an NNG or high-risk REQ forces `action: implement`
- use `not_applicable` only for a row outside the current lifecycle stage or reviewed scope. Do not use it to pass an in-scope NNG or high-risk REQ claim.
- a broad suite can support a row, but cannot be the only proof for an NNG or high-risk REQ claim
- runtime claims require source semantics, not just test names
- removed-surface claims require negative proof over the named surfaces
- fixture-backed claims require fixture exercise evidence
- command-backed rows populate `execution_mode` with `sequential` or `parallel (<isolation evidence>)`; source-only rows use `N/A (source inspection only)`
- every load-bearing row requires an `evidence` anchor: file and line, command output summary, or artifact path. `N/A` is allowed only for `not_applicable` rows.

### Findings

Use severity headings consistently:

- `### Critical: <title>`
- `### Major: <title>`
- `### Minor: <title>`
- `### Trivial: <title>` for non-blocking notes

### Verdict

State the overall outcome and why.

### Open Questions

Use `- None.` when empty.

### Unresolved Disagreements

Use `- None.` when empty.

### Deviations

Use `- None.` when empty. Record tool failures, missing context, or scope limits that affected the review.

## Proof isolation

Every evidence table in this artifact that records a proof command must carry a per-row `execution_mode` column populated per @skill:test-harness-isolation. This includes command-backed rows in `Claim Verification`, plus `Fixture Exercise Evidence`, `Negative Surface Evidence`, `Feature Exercise Evidence`, `Regression Evidence`, and `Parity Evidence`.

Values:

- `sequential`: the proof command was run sequentially; no other proof command shared the harness during the run.
- `parallel (<one-sentence source-backed isolation evidence>)`: the proof ran concurrently with another; the row's evidence string names unique ports, unique temp paths, absence of shared global setup, and the scope of teardown.

A row missing `execution_mode` is incomplete. A `parallel` row without concrete isolation evidence is contaminated: the lead and reviewer-critic must treat it as unverifiable and require a sequential rerun before any phase transition.

## Claim evidence sections

### Fixture Exercise Evidence

Required when any claim uses a fixture as proof, or when the implementation report's `## Fixture Use` lists an added, modified, or relied-on fixture.

| fixture | action taken | consuming test or exercise | observed assertion or signal | execution_mode | evidence |
| --- | --- | --- | --- | --- | --- |
| `tests/fixtures/example.json` | read test body and ran targeted test | `example_round_trips` | test parses the fixture and fails on malformed input | sequential | captured test output |

Rules:

- fixture existence alone is not evidence
- if the fixture is checked in but no test or exercise consumes it, the corresponding claim is `partial` or `failed`
- if the implementation report has a `Fixture Use` row, review must inspect or execute the consuming test or exercise even when the plan did not mark the fixture as claim-backed

### Negative Surface Evidence

Required when any claim removes a field, option, UI control, command, docs phrase, schema property, generated artifact property, or embedded catalog concept.

| claim_ids | surface | action taken | expected absence | observed result | execution_mode | evidence |
| --- | --- | --- | --- | --- | --- | --- |
| CLAIM-002 | CLI help and docs | ran help command and literal scan | no primary-surface `--provider` | no matches | sequential | command output |

Rules:

- cover every surface named by the plan's fixture and surface inventory
- include generated artifacts when they are committed or operator-visible
- if stale wording remains intentionally, state the fence that keeps it out of the public contract

## Authority and history

Review artifacts on disk are immutable historical evidence. They should never be rewritten to reflect a later authority transition. When newer evidence disproves an earlier review blocker, or when a review's proof is later proven contaminated:

- the review file stays on disk unchanged
- the lead transitions the round's manifest `status` to `superseded` or `contaminated` per @skill:squad-manifest, with the atomicity rules that apply
- the lead appends a matching `drift_checks` entry per @skill:squad-lead §Authority-transition rules
- routing authority moves to the replacing round (for supersession) or to a sequential rerun (for contamination); the superseded or contaminated round no longer contributes to `final_round`

A review that returns `action: submit` and is accepted by the lead is **locally authoritative for the phase** but not automatically globally authoritative. End-to-end sweep may later reopen the phase per @skill:squad-lead §Authority-transition rules Case 3; that reopen updates `phases[].closure.local_status` to `reopened_by_e2e` without marking the prior local submit round `superseded` or `contaminated`. The local submit remains historically valid; it simply is no longer sufficient for global routing until the phase reaches a new local submit after the reopen.

## Conditional sections

### Scenario Verification

Required when the source plan includes scenarios.

| scenario_id | status | evidence | notes |
| --- | --- | --- | --- |
| SCN-REQ-006-01 | satisfied | targeted test output | verified in review |

Status values: `satisfied`, `partial`, `unsatisfied`, `not_applicable (<reason>)`.

### Feature Exercise Evidence

Required when `triage.flags.external-behavior-change: true` in the current triage (@skill:squad-triage). Also required when `triage.flags.compatibility-promise: true` (exercise the compatibility path explicitly). Record the reviewer's direct exercise of the surface, not test-suite results.

| acceptance_criterion | surface | action taken | observed outcome | execution_mode | evidence |
| --- | --- | --- | --- | --- | --- |
| AC-1 | CLI | ran the documented command with the documented arguments | exit code and stdout match the plan's expected outcome | sequential | captured command output |
| AC-2 | HTTP API | issued the documented request | response status, body, and any side-effect (file written, row inserted, message emitted) match | sequential | captured request/response trace |
| AC-3 | UI | walked the user flow named in the acceptance criterion | each expected visual state appeared and any documented side-effect was observable externally | sequential | screenshot, DOM snapshot, or session recording |
| AC-4 | Library | called the public function with the documented inputs | return value and any observable side-effect match | sequential | captured REPL session or harness output |
| AC-5 | Emitted message | triggered the operation that produces the message | subscriber received payload matching the documented contract | sequential | captured message payload |

Adapt the table to the surfaces actually changed. You do not need one row per surface type, only one per primary acceptance criterion.

Rules:

- Pass/fail on this evidence is the dominant signal for behavior-changing reviews; passing tests do not substitute.
- If `compatibility-promise: true`, at least one row must exercise the compatibility path explicitly.
- For compatibility-path rows, reuse the preserved acceptance criterion and say `compatibility path` explicitly in `action taken`.
- You may reuse command, setup, and fixture details from `## Verification Inputs` or `## Exercise Setup`, but `action taken` and `observed outcome` must be your own.
- Every row populates `execution_mode` with `sequential` or `parallel (<isolation evidence>)` per @skill:test-harness-isolation. Default to `sequential`.
- Make one bounded direct attempt to exercise the required surface, plus at most one immediate follow-up needed to capture the blocker clearly. Do not keep searching for alternate environments or harnesses in the same round unless the prompt explicitly provides them.
- If the surface still cannot be exercised after that bounded attempt, record any partial evidence you obtained, explain the remaining gap in `## Deviations`, and set `action` to `implement` unless the lead has recorded a matching exercise waiver in the manifest's `waivers` list with `gate: exercise` and either `approver: user` or `ratified_by_user: true` (see @skill:squad-manifest).
- Missing exercise evidence is enough to force `action: implement`; it does not make the review artifact invalid by itself.

### Regression Evidence

Required when `triage.flags.bug-fix-regression: true` in the current triage (@skill:squad-triage). Record the specific regression scenario or reproducer, the proof that it failed before the fix, and the reviewer's proof that it now passes.

| scenario_id_or_reproducer | before evidence | after action taken | after observed result | execution_mode | evidence |
| --- | --- | --- | --- | --- | --- |
| SCN-REQ-006-01 | failing test output from the base commit | reran the targeted regression test on current tip | passed | sequential | captured test output |

Rules:

- The row must map to the regression scenario or regression proof commitment named in the plan.
- `before evidence` may come from a base-branch rerun, preserved failing logs, or an accepted artifact that captured the pre-fix failure. It must show a concrete failure, not a hypothetical risk.
- `before evidence` may reuse the implementation report's `## Regression Baseline` when it is concrete and attributable, but `after action taken` and `after observed result` must be the reviewer's own.
- Every row populates `execution_mode` with `sequential` or `parallel (<isolation evidence>)` per @skill:test-harness-isolation. Default to `sequential`.
- Use the same bounded-attempt rule as `## Feature Exercise Evidence`: one direct proof attempt plus at most one immediate follow-up to capture the blocker clearly.
- If the reviewer cannot establish either the before state or the after proof after that bounded attempt, record the reason in `## Deviations` and set `action` to `implement`.

### Parity Evidence

Required when `triage.flags.behavior-preserving-refactor: true` in the current triage (@skill:squad-triage). Record the reviewer's direct application of the parity method named in triage, not the implementation report's claim.

| method | scope | action taken | observed result | execution_mode | evidence |
| --- | --- | --- | --- | --- | --- |
| golden-output comparison | CLI stdout for `foo --bar` before/after refactor | compared saved golden outputs to current output | matched | sequential | captured diff output |

Rules:

- The method must match the one named in triage's `## Parity method`.
- Do not quote or copy the implementation report's result. Re-run the method and record your own evidence.
- Every row populates `execution_mode` with `sequential` or `parallel (<isolation evidence>)` per @skill:test-harness-isolation. Default to `sequential`.
- You may reuse setup details from `## Verification Inputs` or `## Exercise Setup`, but the parity result must come from the current review round's direct run.
- Use the same bounded-attempt rule as `## Feature Exercise Evidence`: one direct proof attempt plus at most one immediate follow-up to capture the blocker clearly.
- If parity cannot be checked after that bounded attempt, record the reason in `## Deviations` and set `action` to `implement`.

## Quality checks

Before a review is accepted:

- `phase` matches the reviewed phase or `PHASE-ALL`
- every in-scope REQ and NNG is covered
- `Claim Verification` exists when the plan has a claim matrix; any in-scope `partial`, `failed`, or `not_applicable` NNG or high-risk REQ row routes to `implement`
- command-backed `Claim Verification` rows populate `execution_mode`
- every `Claim Verification` load-bearing row includes an evidence anchor
- `Fixture Exercise Evidence` exists when a claim relies on a fixture or the implementation report's `Fixture Use` section lists an added, modified, or relied-on fixture
- `Negative Surface Evidence` exists when a removed-surface claim exists
- `Scenario Verification` exists when the plan had scenarios
- when `triage.flags.external-behavior-change: true` or `triage.flags.compatibility-promise: true`, either `Feature Exercise Evidence` exists with substantive evidence, or `## Deviations` explains the bounded attempt and the remaining exercise gap; `action` must then be `implement` unless the manifest records a matching `gate: exercise` waiver with `approver: user` or `ratified_by_user: true`
- `Regression Evidence` exists when `triage.flags.bug-fix-regression: true`, or `## Deviations` explains why the regression could not be proven and `action` is `implement`
- `Parity Evidence` exists when `triage.flags.behavior-preserving-refactor: true`, or `## Deviations` explains why parity could not be checked and `action` is `implement`
- verification-class evidence is reviewer-produced, not copied from implementation artifacts
- `Deviations` exists
- every command-backed row in `Claim Verification`, `Fixture Exercise Evidence`, `Negative Surface Evidence`, `Feature Exercise Evidence`, `Regression Evidence`, and `Parity Evidence` populates `execution_mode`; `parallel` entries include concrete isolation evidence per @skill:test-harness-isolation
- `action` matches the findings, non-negotiable statuses, and all required exercise, regression, and parity evidence

## Output location

Review reports live in the active task journal, typically `docs/journal/{task-ts}_{slug}/{artifact-ts}.review.phase-PHASE-01.round-01.md`.
