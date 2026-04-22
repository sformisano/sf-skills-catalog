---
name: Squad Implementation Verification
description: "Defines the implementation report format, required sections, and proof fields for squad work. Use when writing or checking a post-change report, change record, or implementation handoff before review."
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-19T10:00:00Z"
---

# Implementation Verification

This skill defines the report contract for an implementation round.

## Build order

1. Fill frontmatter and the required sections.
2. Add verification commands and annotate proof execution mode.
3. Add conditional sections required by the current triage flags.
4. Record any blockers or defers in `## Deviations` and `### Deferred`.
5. Run the quality checks before handing the report to review.

## Frontmatter

```yaml
---
round: <N>
phase: <PHASE-ALL|PHASE-01|PHASE-02>
addresses: [F-001, F-002]  # optional, when fixing review findings
---
```

## Required sections

### Summary

What changed in this round.

### Files Changed

List the changed files or state that the round was analysis-only.

### Requirement-to-Change

Map each implemented `NNG-XX` or `REQ-XXX` to the concrete change that addressed it.

### Verification

List commands run, manual checks performed, and fresh evidence gathered.

For each proof command listed here, record whether it was run sequentially or in parallel per @skill:test-harness-isolation. Use this per-command shape:

- `<command>` — sequential
- `<command>` — parallel (isolation evidence: <unique ports, unique temp paths, absence of shared global setup, scope of teardown>)

Default to sequential. Use `parallel` only when the isolation evidence is concrete and source-backed. A `parallel` annotation without isolation evidence is contaminated; the lead and review stages will treat it as unverifiable and require a sequential rerun.

### Exercise Setup

Required when the current triage sets any of `external-behavior-change`, `compatibility-promise`, or `behavior-preserving-refactor` to `true`.

Record reusable execution inputs for later review. This section is setup inventory, not proof.

| proof obligation | prerequisites | command or action | fixture or setup | expected signal | notes |
| --- | --- | --- | --- | --- | --- |
| feature exercise | ordered list of commands that must run before `command or action` can succeed cold (build steps, asset generation, service bring-up, seed commands); use `none` if the command can run cold | run the documented command or user flow | named fixture, seed data, or environment knob | the externally observable result named in the plan | no secrets; point to source names only |

Rules:

- record inventory-class facts only: commands, harness paths, fixture files, seeded data, endpoints, environment toggles, or preserved artifact paths
- do not paste proof outcomes here; actual proof belongs in review evidence sections
- `prerequisites` is an ordered list of everything a reviewer running cold must execute before `command or action` works. If you ran your own proof against a warm workspace, your warm state does not excuse you from listing the prerequisites a cold reviewer needs (build steps, asset compilation, service spin-up, seed commands). Use `none` only when the primary command truly has no external prerequisites.
- a reviewer must be able to take the listed prerequisites in order, then run `command or action`, and get the documented `expected signal`. If they cannot, the Exercise Setup row is incomplete and the implementation report must be revised.
- when `compatibility-promise: true`, include the compatibility-path row explicitly
- when `behavior-preserving-refactor: true`, include the parity-method setup row explicitly

### Regression Baseline

Required when the current triage sets `bug-fix-regression: true`.

Record the concrete before-state source so review can validate the fix without reconstructing the failure path from scratch.

| scenario_id_or_reproducer | before-state source | reproducer | failure signal | preserved evidence |
| --- | --- | --- | --- | --- |
| SCN-REQ-006-01 | base-branch rerun | targeted regression test | failing assertion shows the original defect | saved failing test output |

Rules:

- `before-state source` may point to a base-branch rerun, preserved failing logs, or another accepted artifact that captured the failure
- `preserved evidence` must point to the exact failing output or artifact, not a summary claim
- this section does not satisfy review `## Regression Evidence`; the reviewer still produces the after-fix proof independently

### Deviations

Use `- None.` when empty. Record missing prerequisites, blocked tools, partial workarounds, or explicit deferrals.

## Conditional sections

### Scenario Coverage

Required when the plan includes scenarios.

| scenario_id | requirement_id | verification_method | evidence | status |
| --- | --- | --- | --- | --- |
| SCN-REQ-006-01 | REQ-006 | test | targeted test output | covered |

Status values: `covered`, `partial`, `missing`, `deferred (<rationale>)`.

### Parity Evidence

Required when the current triage sets `behavior-preserving-refactor: true`.

Record the parity method named in `triage.md`, what was compared, and the result.

| method | scope | observed result | execution_mode | evidence |
| --- | --- | --- | --- | --- |
| golden-output comparison | CLI stdout for `foo --bar` before/after refactor | matched | sequential | captured diff output |

Every row populates `execution_mode` with `sequential` or `parallel (<isolation evidence>)` per @skill:test-harness-isolation. Default to `sequential`.

If the parity method could not be executed, record that in `observed result`, explain the blocker in `## Deviations`, and do not treat the refactor as proven behavior-preserving.

### Finding-to-Fix

Required when addressing review findings from a prior round.

### Deferred

Required when work was intentionally left for a later round. Every entry needs same-line rationale and must state the implication for remaining phases (none, blocks `PHASE-XX`, requires a new requirement).

The lead must acknowledge each `### Deferred` entry in the manifest's `deferred_items.ack` field before the next phase dispatches. An unacked defer blocks the next phase. See @skill:squad-lead for the ack protocol and @skill:squad-manifest for the manifest schema.

## Authority and history

Implementation reports on disk are immutable historical evidence. The report's frontmatter does not carry authority or supersession state; that lives in `manifest.yaml` per @skill:squad-manifest. When a later round supersedes this one, or when this round's proof is later proven contaminated, the lead transitions the manifest's round `status` (`superseded` or `contaminated`) and appends a matching `drift_checks` entry per @skill:squad-lead §Authority-transition rules. The report file itself stays on disk unchanged.

## Quality checks

Before the lead accepts the report:

- `phase` matches the assigned phase or `PHASE-ALL`
- `Requirement-to-Change` covers every item this round claimed to implement
- `Scenario Coverage` exists when the source plan had scenarios
- `Exercise Setup` exists when direct review proof will later be required, and every row lists `prerequisites` (use `none` only when the command truly has no cold-start prerequisites)
- `Verification` records the execution mode (sequential or parallel with isolation evidence) for every proof command listed, per @skill:test-harness-isolation
- `Regression Baseline` exists when `bug-fix-regression: true`
- `Parity Evidence` exists and names the triage's parity method when `behavior-preserving-refactor: true`; every row populates `execution_mode` per @skill:test-harness-isolation
- `Finding-to-Fix` exists when `addresses` is present
- `Deviations` exists
- `Deferred` entries (if any) carry same-line rationale and phase impact
- verification evidence is fresh and specific

## Output location

Implementation reports live in the active task journal, typically `docs/journal/{task-ts}_{slug}/{artifact-ts}.implementation.phase-PHASE-01.round-01.md`.

Minimal example:

```markdown
---
round: 1
phase: PHASE-01
---

## Summary
Updated the CLI parser and added the new migration writer.

## Files Changed
- src/cli.ts
- src/migrate.ts

## Requirement-to-Change
- REQ-001 -> `src/migrate.ts` now writes journals under `docs/journal/`

## Verification
- `npm test -- migrate` — sequential

## Deviations
- None.
```
