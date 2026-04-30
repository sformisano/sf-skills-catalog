---
name: squad-implementation-verification
description: "Defines the report format for a squad lifecycle implementation round. Use when loaded by squad implementer, squad review author, or squad lead to write or check a squad implementation artifact."
metadata:
  skillcatalog/display_name: "Squad Implementation Verification"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Implementation Verification

This skill defines the report contract for an implementation round.

## Build order

1. Fill frontmatter and the required sections.
2. Add claim proof results from the plan's claim matrix.
3. Add verification commands and annotate proof execution mode.
4. Add conditional sections required by the current triage flags.
5. Record any blockers or defers in `## Deviations` and `### Deferred`.
6. Run the quality checks before handing the report to review.

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

### Claim Proof Results

Required when the plan contains `## Claim/Mechanism/Proof Matrix`.

Use one row per plan claim row whose `proof_stage` is the current phase. Rows with `proof_stage: cross_phase_smoke`, `e2e`, or `delivery` may be mentioned as setup evidence when this phase prepares them, but they are not final proof rows for the phase.
Use the high-risk REQ definition from `references/squad-claim-proof-matrix.md`.

| claim_id | status | mechanism implemented | positive proof | negative proof | execution_mode | evidence | deviation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CLAIM-001 | proven | parser removed the option and help generation reads the parser | `tool --help` plus source inspection | `rg -- "--provider" README.md docs src` returned no public matches | sequential | help output omits the option | none |

Status values:

- `proven`
- `partial`
- `not_proven`
- `not_applicable (<reason>)`

Rules:

- every NNG or high-risk REQ claim whose `proof_stage` is this phase must be `proven` before the report can recommend review handoff
- broad suite success can support a row, but cannot be the only evidence for an NNG or high-risk REQ claim
- runtime claims record the source mechanism in `mechanism implemented` and the source inspection in `positive proof`
- removed-surface claims record executed negative scans in `negative proof`; a scan that is only defined is `not_proven` and blocks review handoff
- command-backed proof rows populate `execution_mode` with `sequential` or `parallel (<isolation evidence>)`; source-only rows use `N/A (source inspection only)`
- if a claim cannot be proven, record the reason here and in `## Deviations`; that blocks review handoff
- later-stage rows must not be claimed as `proven` by the implementation report unless the report is written for that named lifecycle stage

### Fixture Use

Required when the implementation added, modified, or relied on a fixture.

| fixture | consuming test or exercise | assertion or signal | status |
| --- | --- | --- | --- |
| `tests/fixtures/example.json` | `example_round_trips` | fails if the fixture is not parsed | consumed |

Status values: `consumed`, `partial`, `unconsumed`, `not_applicable (<reason>)`.

A fixture that exists but is not consumed by an executed or inspected test is not coverage. Record it as `unconsumed` and explain the implication in `## Deviations`.

### Verification

List commands run, manual checks performed, and fresh evidence gathered.

For each proof command listed here, record whether it was run sequentially or in parallel per @skill:test-harness-isolation. Use this per-command shape:

- `<command>`: sequential
- `<command>`: parallel (isolation evidence: <unique ports, unique temp paths, absence of shared global setup, scope of teardown>)

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
- `Claim Proof Results` exists when the plan has a claim matrix, and every current-phase NNG or high-risk REQ row is `proven`; blocking deviations stop review handoff rather than satisfying the gate
- command-backed `Claim Proof Results` rows populate `execution_mode`
- `Fixture Use` exists when fixtures are added, modified, or used, and no fixture-backed claim is reported covered by an unconsumed fixture
- removed-surface scans and runtime mechanism inspections are recorded in `Claim Proof Results`
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
- `npm test -- migrate`: sequential

## Deviations
- None.
```
