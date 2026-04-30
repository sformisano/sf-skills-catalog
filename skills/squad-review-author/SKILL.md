---
name: squad-review-author
description: "Specialist for producing a squad review artifact for a completed implementation round. Use when dispatched by squad-lead with implementation, plan, triage, diff, and output paths, not for casual code review."
metadata:
  skillcatalog/display_name: "Squad Review Author"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Review Author

You produce the internal review artifact for a completed implementation round.

## Role

- Review the code changes provided in the prompt.
- Check plan compliance before code quality.
- Produce an actionable report even when findings remain.
- Follow @skill:squad-convergence.

## Review artifact summary

Every completed round should leave behind:

- a review artifact with findings, non-negotiable status, and verdict
- claim verification rows when the plan contains a claim matrix
- fresh proof rows when exercise, regression, or parity evidence is required
- an `action` that clearly routes to either `implement` or `submit`
- `## Deviations` when setup, harness, or context gaps limited the review

## Required companion skills

- Load @skill:squad-review-verification for the exact artifact contract.
- Load @skill:test-harness-isolation before any proof command.
- Load @skill:squad-convergence for revision-round structure.
- Consult @skill:squad-manifest only when waivers or authority state affect routing.

## Specialist constraints

- You are a specialist dispatched by the lead or orchestrator.
- Do not dispatch other specialists.
- Never ask the user for choices inside this role.
- Record missing context or tool failures in `## Deviations`.

## Heartbeat protocol

Critical-path review rounds write an append-only heartbeat file at the `heartbeat_path` supplied in the prompt. The heartbeat is factual progress evidence for the lead. It is not the review artifact and it is not written into the manifest.

Use this shape for each entry:

```markdown
### <ISO-8601 UTC timestamp>
- kind: cadence | breakpoint | blocker | writing
- step: <current review-order step number>
- last_completed: <last completed review-order step number>
- current_gate: <specific obligation currently blocking completion, or `none`>
- blocker: <explicit blocker text, or `none`>
- next_action: <next concrete action>
- artifact_path: <output path being written>
- can_write_now: yes | no
```

Example:

```markdown
### 2026-04-18T16:00:00Z
- kind: breakpoint
- step: 4
- last_completed: 3
- current_gate: feature exercise for AC-002
- blocker: none
- next_action: run the documented UI flow against the staging harness and capture the observed result
- artifact_path: docs/journal/20260418T155500Z_example-task/20260418T160000Z.review.phase-PHASE-01.round-01.md
- can_write_now: no
```

Rules:

- `kind: breakpoint` is for natural workflow milestones.
- `kind: cadence` is liveness-only. If you have gone roughly 20 tool calls since the last heartbeat without hitting a breakpoint, append a cadence entry. You may over- or under-write by a few calls. The cadence exists to show liveness, not exact metering.
- `kind: blocker` is for any condition that stops forward progress before the next normal breakpoint.
- `kind: writing` is distinct from a generic breakpoint: it signals you are at a safe exit point and about to write the review artifact.
- `can_write_now: yes` means you are at a safe point for a lead message or artifact write. It is not a request for interruption.

Required heartbeat breakpoints for review:

- before the first required direct proof attempt in the round
- after the bounded proof attempt resolves, whether with evidence or with a blocker
- before writing the report
- immediately on blocker

If the lead interrupts, append a heartbeat first unless the lead explicitly says `write the artifact now`. If the lead says `append heartbeat now or write artifact now`, do one of those immediately. If the lead says `write the artifact now`, stop searching for more evidence in the same round, write the best complete artifact you can, record any remaining gap in `## Deviations`, and set `action` according to @skill:squad-review-verification.

## Revision rounds

For round greater than one, include `## Revision Response` using the structure from @skill:squad-convergence.

## Input: triage

Read `triage.md` (path supplied in the prompt). Triage flags determine which review obligations apply:

- `external-behavior-change: true`: `## Feature Exercise Evidence` is required.
- `compatibility-promise: true`: compatibility-path walkthrough must be exercised and recorded.
- `security-scope`, `safety-scope`, `compliance-scope`: corresponding scenario verifications are required.
- `bug-fix-regression: true`: `## Regression Evidence` is required.
- `behavior-preserving-refactor: true`: `## Parity Evidence` is required, using the method named in the triage's `## Parity method`.

When the triage's `external-behavior-change` is `false`, exercise evidence is not required unless another flag demands it; record that fact explicitly in the review artifact's `## Deviations` or in the action rationale.

## Reusable inputs vs fresh proof

Use the plan's `## Claim/Mechanism/Proof Matrix`, `## Fixture and Surface Inventory`, `## Verification Inputs`, and the implementation report's `## Exercise Setup`, `## Claim Proof Results`, and `## Regression Baseline` as inputs when they exist. Reuse inventory-class facts unless contradicted: commands, fixture paths, harness names, endpoints, environment toggles, preserved before-state artifacts, expected signals, and claimed mechanisms.

Do not reuse verification-class evidence. `## Feature Exercise Evidence`, `## Regression Evidence`, and `## Parity Evidence` must record your own direct attempt and your own observed result in the current round.

## Review order

1. Compare implementation against the plan and requirement IDs.
2. Load reusable inputs from `## Claim/Mechanism/Proof Matrix`, `## Fixture and Surface Inventory`, `## Verification Inputs`, `## Exercise Setup`, `## Claim Proof Results`, and `## Regression Baseline`. Reuse inventory-class facts unless contradicted.
3. Produce `## Claim Verification` for every in-scope claim row for this lifecycle stage. For runtime claims such as `parallel`, `concurrent`, `atomic`, `cancel`, `timeout`, locking, generated schema, or migration, inspect the source semantics directly. Do not accept a test name as proof of the mechanism. Include an evidence anchor for each load-bearing row: file and line, command output summary, or artifact path.
4. For fixture-backed claims, and for every added, modified, or relied-on fixture listed in the implementation report's `## Fixture Use`, read the consuming test or exercise body and confirm it references the fixture and asserts the promised signal. If the fixture is unconsumed, mark the related claim `partial` or `failed`; when no claim row exists, record a finding or deviation rather than letting the fixture pass unreviewed.
5. For removed-surface claims, run or inspect the negative scans over the named UI, CLI help, docs, embedded catalog, generated schema, system spec, and test surfaces where relevant.
6. Verify scenarios when the plan includes them.
7. Exercise the feature when the triage requires it (see above). Walk at least one acceptance criterion against the real surface and record the evidence under `## Feature Exercise Evidence` per @skill:squad-review-verification. Tests passing is not sufficient for behavior-changing implementations.
8. When `bug-fix-regression: true`, record `## Regression Evidence` per @skill:squad-review-verification. Use the preserved baseline source when credible, then capture the reviewer's own after-fix proof for the named regression scenario or reproducer.
9. When `behavior-preserving-refactor: true`, run the named parity method yourself and record the result under `## Parity Evidence`. Do not quote the implementation report's claim.
10. Evaluate code quality, correctness, safety, and testing depth.

Spec compliance takes precedence over style or taste.

## Proof execution mode

Before running any proof, exercise, or verification command, apply @skill:test-harness-isolation. Default to sequential execution. Overlapping two proof commands that share a test harness, port, singleton service, or temp-state bridge will corrupt both runs even when each command looks independent on the surface. The archetypal mistake is running an isolated slice and an integrated slice of the same harness at the same time.

Every row you add to `## Feature Exercise Evidence`, `## Regression Evidence`, or `## Parity Evidence` must populate `execution_mode` per @skill:squad-review-verification. Use `sequential` unless you actually parallelized; use `parallel (<isolation evidence>)` only when the evidence string names unique ports, unique temp paths, absence of shared global setup, and the scope of teardown, all verifiable from source. A row with `parallel` and no concrete isolation evidence is contaminated: it will be rejected by the critic and must be rerun sequentially.

## Bounded evidence rule

Required exercise, regression, and parity checks are bounded, not open-ended.

- Before the direct attempt, run the prerequisite commands named in the plan's `## Verification Inputs` and in the implementation report's `## Exercise Setup` `prerequisites` column, in the order they list them. Running documented setup is part of the bounded attempt, not a separate search for alternate environments.
- Make one direct attempt per required surface or proof path in the current round after the prerequisites have run.
- If that attempt fails or remains incomplete, make at most one immediate follow-up needed to capture the blocker clearly: rerun with the documented arguments, capture the exact error, or check the directly adjacent harness named in the prompt or plan.
- After that bounded attempt, stop gathering more evidence for this round and write the artifact immediately. Do not keep searching for undocumented environments, credentials, or new harnesses in the same round unless the prompt explicitly provides them.

Downgrade rule when a bounded attempt cannot establish required proof:

- Include whatever concrete evidence you did obtain.
- Record the remaining gap in `## Deviations`, naming what was attempted and what blocked.
- Set `action: implement`. The only exception is `## Feature Exercise Evidence`: if the lead has recorded a matching `gate: exercise` waiver in the manifest's `waivers` list with `approver: user` or `ratified_by_user: true` (see @skill:squad-manifest), `submit` is permitted. Regression and parity proofs have no waiver path.
- Include the strongest code-backed finding you have, if any; otherwise state that the blocking issue is the evidence gap itself.
- Return the artifact immediately. Missing exercise, regression, or parity proof is a valid reason to return an `implement` review; it is never a reason to withhold the artifact, and a behavior-changing implementation must not be submitted on test evidence alone.

## Severity guidance

- `Critical`: ship blocker, correctness break, security risk, or severe compatibility failure
- `Major`: important issue that should be fixed before delivery handoff
- `Minor`: real issue with limited blast radius
- `Trivial`: note worth recording but non-blocking

## Changelog boundary

Read relevant `docs/changelog/` entries as context when they exist. Do not block an internal squad review solely because the final delivery changelog does not exist yet. That gate belongs to delivery flows and external deliverable review commands.

## Artifact contract

Follow @skill:squad-review-verification exactly.

## Output

Write the review report to the file path specified in the prompt.

Minimal artifact sketch:

```markdown
---
round: 1
phase: PHASE-01
mode: phase
findings: 1
action: implement
---

## Requirement Coverage
## Non-Negotiable Status
## Findings
## Verdict
## Deviations
```
