---
name: squad-manifest
description: "Defines the manifest.yaml state file for formal squad lifecycle runs. Use when acting as squad lead to create, resume, validate, or update structured task state, not for ordinary project manifests."
metadata:
  skillcatalog/display_name: "Squad Manifest"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-18T11:22:39Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Squad Manifest

The manifest is the single source of truth for lifecycle state. Prose belongs in `notes.md`; structured state belongs here. The lead writes; specialists only produce artifacts.

## Purpose

`status.md` was prose. Defer acks, waivers, drift decisions, routing decisions, and resume anchors all lived as free-form text, which meant they could not be validated and could silently diverge from on-disk artifacts. `manifest.yaml` replaces that with a strict, machine-checkable YAML document. The lead reads and writes it; every phase transition consults it; resume reconciles against it.

## Location and format

Path: `docs/journal/{task-ts}_{slug}/manifest.yaml`.

Strict YAML only:

- All strings quoted.
- All timestamps quoted ISO-8601 UTC strings.
- No YAML anchors, aliases, implicit dates, or explicit tags.
- Unknown keys reject the document.
- Omitted required keys reject the document.

## Schema v1

```yaml
schema_version: 1
task_id: "<task-ts>_<slug>"
created: "<ISO-8601 UTC>"

requirement:
  path: "<relative path>"
  revision: <integer>
  frozen_since: "<ISO-8601 UTC>"

triage:
  path: "<relative path>"
  current_round: <integer>
  rounds:
    - round: <integer>
      status: proposed | validated | superseded
      tier: lite | standard | full
      flags:
        shared-contract-change: true | false
        persisted-state-change: true | false
        authority-shift: true | false
        external-behavior-change: true | false
        compatibility-promise: true | false
        security-scope: true | false
        safety-scope: true | false
        compliance-scope: true | false
        performance-scope: true | false
        multi-boundary: true | false
        multi-phase: true | false
        bug-fix-regression: true | false
        behavior-preserving-refactor: true | false
      proposed_at: "<ISO-8601>"
      validated_at: "<ISO-8601>" | null
      superseded_at: "<ISO-8601>" | null
  requires_revalidation: true | false

plan:
  rounds:
    - round: <integer>
      path: "<relative path>"
      accepted: true | false
      accepted_at: "<ISO-8601>" | null
      superseded_at: "<ISO-8601>" | null
      status: active | superseded | requires-revalidation
      adversary:
        path: "<relative path>" | null
        dispatched_at: "<ISO-8601>" | null
        findings_count_blocking: <integer> | null
        findings_count_advisory: <integer> | null
        findings_count_strategic: <integer> | null
        lead_decision: accept | dispatch_revision | escalate_user | skipped | null
        decision_reason: "<string>" | null
        decision_at: "<ISO-8601>" | null
  final_round: <integer> | null

phases:
  - id: "PHASE-XX" | "PHASE-ALL"
    closure:
      local_status: open | locally_accepted | reopened_by_pre_e2e_smoke | reopened_by_e2e
      local_submit_round: <integer> | null
      local_submitted_at: "<ISO-8601>" | null
      reopened_by_e2e_round: <integer> | null
      reopened_by_smoke_path: "<relative path>" | null
      reopened_at: "<ISO-8601>" | null
      reopen_reason: "<string>" | null
    implementation:
      rounds:
        - round: <integer>
          path: "<relative path>"
          accepted: true | false
          accepted_at: "<ISO-8601>" | null
          action: implement | submit | deferred
          status: active | superseded | contaminated
          status_changed_at: "<ISO-8601>" | null
          status_reason: "<string>" | null
          status_record_path: "<relative path>" | null
          superseded_by_round: <integer> | null
          deferred_items:
            - item: "<string>"
              rationale: "<string>"
              impact: "<string>"
              owner_phase: "PHASE-XX" | "PHASE-ALL"
              delivery_blocking: true | false
              resolved_at: "<ISO-8601>" | null
              ack:
                mode: acknowledged-carry-forward |
                      acknowledged-promoted-to-requirement |
                      acknowledged-escalated-to-user
                target: "<string>"
                acked_at: "<ISO-8601>"
      final_round: <integer> | null
    review:
      rounds:
        - round: <integer>
          path: "<relative path>"
          accepted: true | false
          accepted_at: "<ISO-8601>" | null
          action: implement | submit
          status: active | superseded | contaminated
          status_changed_at: "<ISO-8601>" | null
          status_reason: "<string>" | null
          status_record_path: "<relative path>" | null
          superseded_by_round: <integer> | null
          exercise:
            required: true | false
            evidence_path: "<relative path>" | null
            waiver_id: "<waiver-id>" | null
          adversary:
            path: "<relative path>" | null
            dispatched_at: "<ISO-8601>" | null
            findings_count_blocking: <integer> | null
            findings_count_advisory: <integer> | null
            findings_count_strategic: <integer> | null
            # not_applicable is only valid when action == implement; see rule 12a.
            lead_decision: accept | dispatch_revision | escalate_user | skipped | not_applicable | null
            decision_reason: "<string>" | null
            decision_at: "<ISO-8601>" | null
      final_round: <integer> | null

end_to_end_sweep:
  required: true | false
  required_reason: "<string>"
  waived: true | false
  waiver_id: "<waiver-id>" | null
  rounds:
    - round: <integer>
      path: "<relative path>"
      accepted: true | false
      accepted_at: "<ISO-8601>" | null
      action: implement | submit
      status: active | superseded | contaminated
      status_changed_at: "<ISO-8601>" | null
      status_reason: "<string>" | null
      status_record_path: "<relative path>" | null
      superseded_by_round: <integer> | null
      adversary:
        path: "<relative path>" | null
        dispatched_at: "<ISO-8601>" | null
        findings_count_blocking: <integer> | null
        findings_count_advisory: <integer> | null
        findings_count_strategic: <integer> | null
        # not_applicable is only valid when action == implement; see rule 13d.
        lead_decision: accept | dispatch_revision | escalate_user | skipped | not_applicable | null
        decision_reason: "<string>" | null
        decision_at: "<ISO-8601>" | null
  final_round: <integer> | null

pre_e2e_smoke:
  required: true | false
  artifact_path: "<relative path>" | null
  status: not_run | passed | failed | skipped
  recorded_at: "<ISO-8601>" | null
  waiver_id: "<waiver-id>" | null

delivery_claims:
  - claim_id: "<claim-id>"
    requirement: "NNG-XX" | "REQ-XXX"
    status: satisfied | partial | failed | not_applicable
    positive_proof: "<string>"
    negative_proof: "<string>" | "none"
    execution_mode: sequential | "parallel (<isolation evidence>)" | "N/A (source inspection only)"
    evidence: "<string>"
    artifact_path: "<relative path>" | null
    recorded_at: "<ISO-8601>"

waivers:
  - id: "<string>"
    gate: triage | plan | implementation | review | exercise | pre-e2e-smoke | e2e-sweep | delivery
    scope: "<string>"
    approver: user | lead | migration
    ratified_by_user: true | false
    reason: "<string>"
    granted_at: "<ISO-8601>"
    expires_at: "<ISO-8601>" | null
    resolved_at: "<ISO-8601>" | null

amendments:
  - id: "<string>"
    phase: "PHASE-XX" | "PHASE-ALL"
    trigger: implementer-reality-check | review-finding | re-triage
    path: "<relative path>"
    accepted: true | false
    accepted_at: "<ISO-8601>" | null

drift_checks:
  - loop: plan | review | pre-e2e-smoke | e2e-sweep | delivery
    phase: "PHASE-XX" | "PHASE-ALL" | null
    round: <integer>
    dominant_issue: "<string>"
    resolution: continue | narrow | escalate-user | restart
    artifact_path: "<relative path>" | null
    at: "<ISO-8601>"

checklist_candidates:
  - source_artifact: "<relative path>"
    candidate: "<string>"
    decision: accepted | rejected
    target_skill: "<skill-slug>" | null
    owner: "<string>"
    due: "<ISO-8601>" | null
    closed_at: "<ISO-8601>" | null

child_sessions:
  - role: plan-author | plan-critic | plan-adversary | implementer | review-author | review-critic | review-adversary
    purpose: "<string>"
    phase: "PHASE-XX" | "PHASE-ALL" | null
    loop: plan | implementation | review | e2e-sweep
    round: <integer>
    critical_path: true | false
    output_path: "<relative path>"
    heartbeat_path: "<relative path>" | null
    dispatched_at: "<ISO-8601>"
    status: active | completed | stale | abandoned
    last_checked_at: "<ISO-8601>" | null
    escalation_count: <integer>

current:
  phase: "PHASE-0" | "PHASE-XX" | "PHASE-ALL" | pre-e2e-smoke | e2e-sweep | delivery-ready
  loop: plan | implementation | review | pre-e2e-smoke | e2e-sweep | null
  round: <integer>
  heartbeat_path: "<relative path>" | null
  status: awaiting_author_turn | awaiting_critic_turn | awaiting_lead_decision | paused | complete
```

Use `PHASE-ALL` when the lifecycle runs unphased; its single entry in `phases:` uses `id: "PHASE-ALL"`.

## Structural model

The manifest models the lifecycle as:

- **One requirement** (frozen at Phase 0).
- **One triage artifact** with append-only round history.
- **One plan** (shared across phases; plans are not per-phase).
- **Per-phase implementation** and **per-phase review**, where `PHASE-ALL` is a single implicit phase.
- **Optional end-to-end sweep** (Phase 4), required when triage flags demand it.
- **Waivers, amendments, drift checks** tracked as append-only lists.

Plan is top-level, not nested under phases. This matches the existing squad methodology's one-plan-per-task rule.

Artifacts on disk are immutable historical records. Routing authority is a mutable property of the manifest. The artifact schema is governed by `squad-plan-verification`, `squad-implementation-verification`, and `squad-review-verification`; routing authority is governed by this skill and `squad-lead`. Never rewrite an on-disk artifact to reflect a later authority transition; instead, update the matching manifest fields (`status`, `status_changed_at`, `status_reason`, `status_record_path`, `superseded_by_round`, or the phase `closure` block) and append a `drift_checks` entry.

## Round authority status

Every implementation round, review round, and end-to-end sweep round carries a `status` that is independent of its `accepted` flag. `accepted` records whether the lead accepted the artifact at the time of the round; `status` records whether the round is currently authoritative for routing.

Values:

- `active`: valid and not superseded or contaminated. `accepted: true` plus `status: active` is necessary but not always sufficient for routing; adversary decisions, waived gates, and final-round eligibility rules still apply. Every round starts life as `active` when it is first accepted (or `active` with `accepted: false` when it was rejected but kept for history).
- `superseded`: valid for its run, but a later round in the same loop and scope replaced it as current authority. The artifact file stays on disk as historical evidence. Use for cases like "end-to-end round 03 said red; later end-to-end round 04 reran cleanly and is now authoritative." `superseded_by_round` names the replacing round.
- `contaminated`: the round's proof or routing basis is no longer trustworthy because the method or environment invalidated the run. Examples: parallel proof against a single-instance harness per @skill:test-harness-isolation, wrong binary, wrong artifact scope, prompt contamination. `contaminated` is a stronger signal than `superseded`: the evidence was never trustworthy, not merely later replaced. `superseded_by_round` may be null for a contaminated round until a clean sequential rerun explicitly replaces it.

Atomicity rules for status transitions:

- An `active` to `superseded` transition requires populating `status`, `status_changed_at`, `status_reason`, `status_record_path`, and `superseded_by_round` in the same manifest write. A `superseded` round without `superseded_by_round` is rejected by the validator.
- An `active` to `contaminated` transition requires populating `status`, `status_changed_at`, `status_reason`, and `status_record_path` in the same manifest write. `superseded_by_round` is null until a clean rerun replaces the round.
- Every `active` to `superseded` or `active` to `contaminated` transition requires a matching `drift_checks` entry appended in the same write window. The `drift_checks` entry carries the narrative audit context; the round-level `status` is the machine-checkable routing signal. Both are required; neither substitutes for the other.
- When a round's status changes, `final_round` for that round's array must be recomputed in the same write (see Validation rule 10–13 below).

## Per-phase closure

Each phase carries a `closure` block that tracks local phase acceptance independently from global lifecycle finality.

Values for `local_status`:

- `open`: the phase has not yet reached an `accepted: true`, `action: submit`, `status: active` review round.
- `locally_accepted`: the phase review reached `submit` (with `status: active`). This is phase-local truth. If Phase 4 is required, the phase is still subject to reopen; local acceptance does not mean the lifecycle is globally final.
- `reopened_by_pre_e2e_smoke`: the phase previously reached `locally_accepted`, and Phase 3.75 smoke evidence reopened ownership before the end-to-end sweep began.
- `reopened_by_e2e`: the phase previously reached `locally_accepted`, and end-to-end evidence later reopened ownership back to this phase. The prior local submit artifact stays valid as a historical phase-local result; it is not "wrong," it is no longer sufficient for global routing.

Return transition:

- If a phase currently in `reopened_by_pre_e2e_smoke` or `reopened_by_e2e` later reaches a new local `submit` (a new review round `accepted: true`, `action: submit`, `status: active`), `closure.local_status` returns to `locally_accepted`. The phase does not remain permanently labeled reopened once a later local review has re-established phase-local submit.
- The reopen fields remain populated as historical metadata of the most recent reopen. The manifest carries one reopen record at a time; multiple reopens rely on `drift_checks` for the full history.

Atomicity rules for closure transitions:

- An `open` to `locally_accepted` transition requires populating `local_submit_round` and `local_submitted_at` in the same write.
- A `locally_accepted` to `reopened_by_pre_e2e_smoke` transition requires populating `reopened_by_smoke_path`, `reopened_at`, and `reopen_reason` in the same write. It does not populate `reopened_by_e2e_round` because no end-to-end round exists yet.
- A `locally_accepted` to `reopened_by_e2e` transition requires populating `reopened_by_e2e_round`, `reopened_at`, and `reopen_reason` in the same write. A `local_status: reopened_by_e2e` state without those three fields is rejected by the validator.
- A reopened-state return transition updates `local_submit_round` and `local_submitted_at` to the new submit round. The prior reopen fields remain as historical record unless a later reopen overwrites them.
- Every closure transition requires a matching `drift_checks` entry appended in the same write window.

## Plan adversary block

Each plan round carries an `adversary` block that records the @skill:squad-plan-adversary dispatch and the lead's reconciliation. The block is scoped to the plan round; cross-round adversary aggregates do not exist in the schema.

Field semantics:

- `path`: the adversary artifact for this plan round (`{round-ts}.plan-adversary.md`). Null only when the adversary was skipped.
- `dispatched_at`: when the lead dispatched the adversary. Null only when skipped.
- `findings_count_blocking` / `findings_count_advisory` / `findings_count_strategic`: counts derived directly from the adversary artifact's `## Findings` subsections. Null when the adversary was skipped.
- `lead_decision`: `accept`, `dispatch_revision`, `escalate_user`, or `skipped`.
- `decision_reason`: short rationale grounded in the artifact's findings, the residual concern, or the user's escalation response.
- `decision_at`: when the lead recorded the decision in the manifest.

Atomicity rules:

- A `lead_decision: accept` write must populate `path`, `dispatched_at`, all three `findings_count_*` fields, `decision_reason`, and `decision_at` in the same manifest write that records `accepted: true`, `accepted_at`, and `status: active` for the plan round.
- A `lead_decision: dispatch_revision` write must populate the same fields, append a matching `drift_checks` entry naming the dominant blocking-finding class, and not record `accepted: true` for the plan round. The next plan round is then authored as an ordinary revision round.
- A `lead_decision: escalate_user` write must populate the same fields, append a `drift_checks` entry, and pair with a `waivers` entry of `gate: plan`, `approver: user`. The waiver's `ratified_by_user: true` records the user's eventual decision. Plan acceptance does not occur until the user-directed action completes.
- A `lead_decision: skipped` write applies only to Tier Lite plans and pairs with a matching `drift_checks` entry of `loop: plan`, `resolution: continue` and a one-line reason. `path`, `dispatched_at`, and `findings_count_*` may all be null.

Cadence rule:

Each plan round has at most one adversary block. When `lead_decision: dispatch_revision` triggers a new plan round, the new round carries its own adversary block populated after its own convergence. The prior round's adversary block remains in place as historical record.

## Review adversary block

Each per-phase review round and each end-to-end sweep round carries an `adversary` block that records the @skill:squad-review-adversary dispatch and the lead's reconciliation. The block has the same shape as the plan adversary block. Field semantics:

- `path`: the adversary artifact for this review round (`{round-ts}.review-adversary.phase-{phase}.round-{N}.md` or `{round-ts}.review-adversary.e2e.round-{N}.md`). Null when the adversary did not dispatch (skipped or not_applicable).
- `dispatched_at`: when the lead dispatched the adversary. Null when the adversary did not dispatch.
- `findings_count_blocking` / `findings_count_advisory` / `findings_count_strategic`: counts derived from the adversary artifact's `## Findings` subsections. Null when the adversary did not dispatch.
- `lead_decision`: `accept`, `dispatch_revision`, `escalate_user`, `skipped`, or `not_applicable`.
- `decision_reason`: short rationale grounded in the artifact's findings, the residual concern, or the user's escalation response.
- `decision_at`: when the lead recorded the decision in the manifest.

Lead-decision values:

- `accept`: the review round's `submit` action stands. The lead applies the original Phase 3 or Phase 4 branching.
- `dispatch_revision`: the lead loops back to implementation (Phase 2 for the same phase, or Phase 2 for the e2e-targeted phase via the existing reopen-by-e2e mechanism). The review round retains `accepted: true` but is not eligible to be `final_round`.
- `escalate_user`: strategic findings, plan-reopen requests, earlier-phase reopen attribution, or out-of-scope adversary findings. Pairs with a `waivers` entry recording the user's direction.
- `skipped`: Tier Lite skip with a matching `drift_checks` entry. Forbidden on Tier Standard / Tier Full when `action: submit`.
- `not_applicable`: the review's `action` is `implement`. The adversary does not run on implement actions; the lead is already routing back.

Atomicity rules mirror the plan adversary block: the `adversary` block fields, the corresponding `drift_checks` entry (when applicable), the matching `waivers` entry (when applicable), and the round's `accepted` / `status` fields are all written in the same atomic manifest write.

Cadence rule: each review round has at most one adversary block. When `lead_decision: dispatch_revision` triggers a new implementation round (or a new e2e-targeted phase reopen), the next review round at the same boundary carries its own adversary block. Prior rounds' adversary blocks remain in place as historical record.

## Deferred item semantics

Deferred items are not a way to ship unfinished in-scope work silently.

- `acknowledged-carry-forward` means the item remains in scope for this lifecycle. It must name `owner_phase`, set `delivery_blocking: true`, and populate `resolved_at` before delivery-ready.
- `acknowledged-promoted-to-requirement` means the item is no longer part of this lifecycle only when `target` names the new requirement or follow-up task and the final changelog repeats that transfer.
- `acknowledged-escalated-to-user` means delivery is blocked until the user decision is recorded in a matching waiver or amendment.

Any deferred item with `delivery_blocking: true` and `resolved_at: null` blocks delivery-ready.

## Pre-E2E smoke and delivery claim proof

`pre_e2e_smoke` is the machine-checkable anchor for Phase 3.75. When `end_to_end_sweep.required: true`, `pre_e2e_smoke.required` is true unless the task is Tier Lite and the lead records an explicit skipped smoke artifact plus waiver or drift record. A passed smoke requires:

- `artifact_path` points to the smoke artifact
- `status: passed`
- `recorded_at` populated
- every `proof_stage: cross_phase_smoke` NNG or high-risk REQ claim row in that artifact is `satisfied`

`delivery_claims` is the machine-checkable anchor for matrix rows whose `proof_stage` is `delivery`. Before delivery-ready, every delivery-stage NNG or high-risk REQ row from the accepted plan must have a `delivery_claims` entry with `status: satisfied` and concrete evidence. `partial`, `failed`, or `not_applicable` blocks delivery-ready.

## Checklist candidates and child sessions

Checklist candidates from adversary artifacts are recorded in `checklist_candidates` so systemic process improvements do not disappear into generic drift text. Every non-empty candidate is recorded as `accepted` or `rejected`. Accepted candidates require an `owner` and either a `target_skill` or a follow-up target in `candidate`.

Child sessions are recorded in `child_sessions` so resume can distinguish active, completed, stale, and abandoned work. A critical-path child with `status: active` must have either a `heartbeat_path` or an output artifact path that exists.

## Update protocol

- **Write-only-forward.** No field is deleted. Superseded entries carry timestamps instead of disappearing.
- **Atomic transitions.** One manifest write per event: phase transition, round acceptance, defer ack, waiver grant, amendment acceptance, drift check recorded, re-triage, round authority transition (active to superseded or active to contaminated), phase closure transition, plan adversary decision recorded, or review adversary decision recorded. Authority, closure, and adversary transitions are atomic per the "Round authority status", "Per-phase closure", "Plan adversary block", and "Review adversary block" sections above; any partial state is rejected by the validator.
- **Single writer.** Only the lead writes. Specialists produce artifacts in the journal; the lead records their acceptance and state changes in the manifest.
- **Historical artifacts are immutable.** Never rewrite a round's artifact file to reflect a later authority transition. The manifest fields (`status`, `status_changed_at`, `status_reason`, `status_record_path`, `superseded_by_round`, and the phase `closure` block) carry that state; the artifact stays as historical evidence of what that reviewer or implementer concluded at the time.

## Validation rules

The lead applies these rules before every phase transition and on every resume. The rules are normative. A team may wrap them in deterministic tooling later, but the rules themselves live here.

**Structural checks:**

1. The YAML parses under strict rules (no anchors, aliases, implicit dates, or tags; all strings quoted).
2. Every `path` field points to an existing, readable file in the repo.
3. `triage.current_round` points to an existing triage round, and that round is the highest numbered triage round present.
4. The current triage round's `tier` matches the heuristic in @skill:squad-triage when recomputed from the current round's `flags`. If the stored label differs, the lead corrects it in place.
5. The current triage round's `flags` satisfy every flag invariant in @skill:squad-triage.
6. The accepted plan artifact satisfies the unconditional schema from @skill:squad-plan-verification. This includes `## Verification Inputs`.
7. For every `flag == true` in the current triage round's `flags`, the corresponding **plan-stage** obligations from the canonical matrix in @skill:squad-triage §Deriving obligations are present in the accepted plan artifact. This includes `## Current Behavior`, `## Shared Contract Producer/Consumer Audit`, `## Concept Glossary` or its compact justified `- None.` form, `## End-State Walkthrough`, `## Persistence and Authority Model`, `## Data-Structure and Ordering Invariants`, `## Phase Integrity`, risk-specific Testing Strategy coverage, regression scenario + regression test commitment, and parity evidence commitment.
8. Before accepting an implementation round or any later phase, the latest accepted implementation artifact contains every **implementation-stage** obligation required by the current triage round per @skill:squad-triage §Deriving obligations. Today this includes `## Exercise Setup` when direct review proof will be required, `## Regression Baseline` when `bug-fix-regression` is `true`, `## Scenario Coverage` when the plan had scenarios, and `## Parity Evidence` when `behavior-preserving-refactor` is `true`.
9. Before accepting a review round, end-to-end sweep round, or delivery handoff, the latest accepted review artifact contains every **review-stage** obligation required by the current triage round per @skill:squad-triage §Deriving obligations. Today this includes `## Feature Exercise Evidence` when `external-behavior-change` or `compatibility-promise` is `true`, `## Regression Evidence` when `bug-fix-regression` is `true`, and `## Parity Evidence` when `behavior-preserving-refactor` is `true`.
10. `plan.final_round` matches the highest routing-eligible plan round. Routing-eligible means `accepted: true`, `status: active`, and an adversary state that is eligible for the current tier: `accept`, `skipped` for Tier Lite with a matching drift check, or `escalate_user` paired with a matching user-ratified waiver. A round whose adversary `lead_decision` is `dispatch_revision` is not eligible.
10a. When `plan.final_round` is non-null and the current triage round's `tier` is `standard` or `full`, the matching plan round's `adversary` block has `path`, `dispatched_at`, `decision_at`, and `lead_decision` populated. `lead_decision` must be `accept`, or `escalate_user` paired with a matching `waivers` entry of `gate: plan`, `approver: user`, `ratified_by_user: true`, scoped to the plan round. A plan round whose adversary `lead_decision` is `dispatch_revision` is not eligible to be `plan.final_round`; a later plan round must be authored. When the current triage round's `tier` is `lite`, a skipped adversary must carry `lead_decision: skipped` paired with a matching `drift_checks` entry of `loop: plan`, `resolution: continue`. `lead_decision: skipped` is forbidden on Tier Standard and Tier Full plan rounds.
11. For each phase, `implementation.final_round` matches the highest round in that phase's `implementation.rounds` with `accepted: true` and `status: active`. A contaminated or superseded round never counts as final; `final_round` falls back to the previous active accepted round, or to null if none exists.
12. For each phase, `review.final_round` matches the highest routing-eligible review round. Routing-eligible means `accepted: true`, `status: active`, `action: submit`, and an adversary decision that is eligible under rule 12a.
12a. When a per-phase review round has `accepted: true`, `status: active`, and `action: submit`, and the current triage round's `tier` is `standard` or `full`, the round's `adversary` block must have `path`, `dispatched_at`, `decision_at`, and `lead_decision` populated. `lead_decision` must be `accept`, or `escalate_user` paired with a matching `waivers` entry of `gate: review`, `approver: user`, `ratified_by_user: true`, scoped to the review round. A round whose adversary `lead_decision` is `dispatch_revision` is not eligible to be `phases[].review.final_round`; a later review round must be authored. When the round's `action` is `implement`, the adversary block carries `lead_decision: not_applicable` (no adversary dispatch fires on implement actions). When the current triage round's `tier` is `lite`, a skipped adversary must carry `lead_decision: skipped` paired with a matching `drift_checks` entry of `loop: review`, `phase: <phase id>`, `resolution: continue`. `lead_decision: skipped` is forbidden on Tier Standard and Tier Full review rounds with `action: submit`.
13. When `end_to_end_sweep.rounds` is non-empty, `end_to_end_sweep.final_round` matches the highest routing-eligible end-to-end sweep round. The same fallback rule as rule 12 applies.
13d. When an end-to-end sweep round has `accepted: true`, `status: active`, and `action: submit`, and the current triage round's `tier` is `standard` or `full`, the round's `adversary` block must have `path`, `dispatched_at`, `decision_at`, and `lead_decision` populated. `lead_decision` must be `accept`, or `escalate_user` paired with a matching `waivers` entry of `gate: e2e-sweep`, `approver: user`, `ratified_by_user: true`, scoped to the sweep round. A round whose adversary `lead_decision` is `dispatch_revision` is not eligible to be `end_to_end_sweep.final_round`; a later sweep round must be authored after the targeted phase reopens and re-passes per-phase review. When the round's `action` is `implement`, the adversary block carries `lead_decision: not_applicable`. When the current triage round's `tier` is `lite`, a skipped adversary must carry `lead_decision: skipped` paired with a matching `drift_checks` entry of `loop: e2e-sweep`, `resolution: continue`.
13a. Every `superseded` round has `superseded_by_round` populated pointing to an existing round in the same array; every `contaminated` round has `status_reason` and `status_record_path` populated. Missing atomicity fields reject the manifest.
13b. Every phase's `closure.local_status` is consistent with its routing-eligible review final round: `open` iff `review.final_round` is null or points to a non-submit round; `locally_accepted` when `review.final_round` points to a routing-eligible submit round and no later reopen is recorded; `reopened_by_pre_e2e_smoke` or `reopened_by_e2e` when the most recent closure transition records a reopen that has not yet been answered by a new routing-eligible local submit.
13c. `closure.reopened_by_e2e_round`, `closure.reopened_at`, and `closure.reopen_reason` are all non-null when `closure.local_status == reopened_by_e2e`. `closure.reopened_by_smoke_path`, `closure.reopened_at`, and `closure.reopen_reason` are all non-null when `closure.local_status == reopened_by_pre_e2e_smoke`.
13e. If `end_to_end_sweep.required: true`, `end_to_end_sweep.waived: false`, and the current triage tier is `standard` or `full`, `pre_e2e_smoke.required` is true and `pre_e2e_smoke.status` must be `passed` before any end-to-end sweep round is accepted. If the smoke is skipped for Tier Lite, `pre_e2e_smoke.status` is `skipped`, `artifact_path` points to the skipped smoke artifact, and a matching drift check exists.
13f. If `end_to_end_sweep.required: true` and `end_to_end_sweep.waived: true`, `end_to_end_sweep.waiver_id` points to a user-approved, ratified, unexpired `gate: e2e-sweep` waiver. The delivery gate must report the skipped end-to-end sweep explicitly.
13g. Every `proof_stage: delivery` NNG or high-risk REQ row from the accepted plan has a `delivery_claims` entry with `status: satisfied`, concrete evidence, positive and negative proof fields, and `execution_mode` for command-backed proof before delivery-ready.
14. Every `deferred_items` entry has an `ack` with a valid `mode` and `acked_at`. Carry-forward defers block delivery-ready until `resolved_at` is populated. Promoted or escalated defers require a concrete `target`.
15. Every `waivers` entry has `scope`, `approver`, `reason`, and `granted_at`. A waiver that lifts any delivery gate must be user-ratified, unexpired, and scoped to the exact phase, round, or proof obligation it waives. If `approver: migration`, then `ratified_by_user` must be `true` before the lifecycle can reach `delivery-ready`.
16. `current.phase` is consistent with the latest accepted round across phases, `plan.final_round`, and `end_to_end_sweep.final_round` when present.
17. When `current.heartbeat_path` is not null, it points to an existing readable heartbeat file under the current task journal.
18. `end_to_end_sweep.required` is `true` whenever any Risk flag is `true`, or when `flags.multi-phase` is `true` and any of `flags.shared-contract-change`, `flags.persisted-state-change`, `flags.authority-shift`, `flags.external-behavior-change`, or `flags.compatibility-promise` is `true`.
19. `triage.requires_revalidation: true` blocks every phase transition, review dispatch, end-to-end dispatch, and delivery. A new plan round must reach `accepted: true`, `status: active`, and `accepted_at` later than the current triage round's `proposed_at` before work can continue. If the current triage round has `status: proposed` or the accepted plan's `accepted_at` is older than the current triage round's `proposed_at`, the manifest is treated as requiring revalidation even if the boolean was not set.
20. Every accepted checklist candidate has an owner and either `target_skill` or a follow-up target in `candidate`. Accepted candidates with `closed_at: null` do not block delivery by themselves, but they must appear in final handoff or changelog residuals.
21. Every active child session has a readable `output_path`; active critical-path implementer and review-author sessions also have a readable `heartbeat_path`.

**Semantic checks** remain the critic's responsibility and are not covered by these rules. They include whether flag values match the actual change, whether plan sections substantively cover the obligations, and whether exercise or parity evidence is substantive.

On any failed rule the lead stops, records the failure in `drift_checks`, and asks the user.

## Resume reconciliation

On resume:

1. Parse the manifest.
2. Apply the validation rules above.
3. For every `path` in the manifest, confirm the file exists and parses against its own artifact schema (frontmatter, required sections).
4. Confirm each `final_round` points to the highest routing-eligible manifest round. Later historical artifacts may exist on disk only when they are represented in the manifest with non-authoritative status or adversary decision.
5. For active child sessions, inspect the heartbeat or output artifact before deciding whether to wait, mark stale, or abandon.
6. Any rule failure or disk/manifest mismatch blocks resume. Stop and ask the user. Do not delete artifacts to make resume pass.

## Waiver semantics

Waivers lift a specific gate under a specific scope. Every waiver must carry:

- **`gate`**: which lifecycle gate it lifts (triage, plan, implementation, review, exercise, pre-e2e-smoke, e2e-sweep, delivery).
- **`scope`**: the minimum scope the waiver applies to. "All exercise evidence for all phases" is too broad; "exercise evidence for PHASE-02 review round 1 because the CI sandbox blocks the deployed UI" is acceptable.
- **`approver`**: `user` (explicit user grant), `lead` (lead grant within lead's authority), or `migration` (granted during manifest backfill for in-flight tasks).
- **`ratified_by_user`**: `true` for `approver: user`. For `approver: lead`, `true` only after user sees it; `false` until then if lead waivers require user ratification by policy. For `approver: migration`, `false` at creation; must flip to `true` before `delivery-ready`.
- **`reason`**: plain-text justification.
- **`granted_at`**: ISO-8601 timestamp.
- **`expires_at`**: optional expiry (nullable).
- **`resolved_at`**: set when the underlying condition is no longer relevant.

Synthesizing `approver: user` waivers without actual user grant is forbidden.

## Migration from status.md

For in-flight tasks that predate the manifest:

1. Lead creates `manifest.yaml` at the current journal path.
2. Fills in requirement, triage (derived from the accepted plan's section list), plan rounds, and phase state from on-disk artifacts.
3. For every plan, implementation, or review obligation already present in existing artifacts but not backed by a flag in the derived triage, creates a waiver with `approver: migration` and `ratified_by_user: false`.
4. Before reaching `delivery-ready`, user must ratify each migration waiver, at which point `ratified_by_user` flips to `true`.

Migration does not retroactively rename prior artifacts. Existing round files keep their paths; the manifest records them as-is.

## Integration points

- @skill:squad-lead : creates the manifest at Phase 0 and updates it at every event.
- @skill:squad-triage : produces the `triage.md` artifact that the manifest's `triage.path` references and whose re-triage sections map to `triage.rounds`.
- @skill:squad-plan-critic : Angle 0 validates triage correctness; on pass, lead transitions the current triage round to `validated`.
- @skill:squad-plan-adversary : runs once per converged plan, after the critic returns `SATISFIED`; the lead records the dispatch and reconciliation in the plan round's `adversary` block.
- @skill:squad-review-adversary : runs once per per-phase review converged with `action: submit` and once per end-to-end sweep converged with `action: submit`; the lead records the dispatch and reconciliation in the review round's `adversary` block.
- @skill:squad-convergence : the lead records round acceptance in the manifest after each author/critic turn converges.
- @skill:squad-review-author and @skill:squad-implementer : own the heartbeat files that `current.heartbeat_path` points at while they are the active critical-path specialist.

## Anti-patterns

- Writing prose state into the manifest. Use `notes.md`.
- Multiple writers. The lead is the only writer.
- Author-set tier values. The tier is recomputed from flags.
- Deleting or editing historical triage rounds instead of superseding them.
- Synthesizing `approver: user` waivers during migration. Use `approver: migration` and require user ratification.
