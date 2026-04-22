---
name: Squad Manifest
description: "Defines and updates the manifest.yaml state file that tracks rounds, waivers, reopen events, and routing decisions across squad work. Use when creating, resuming, or validating lifecycle state for a squad task."
author: Salvatore Formisano
created_at: "2026-04-18T11:22:39Z"
updated_at: "2026-04-19T10:00:00Z"
---

# Squad Manifest

The manifest is the single source of truth for lifecycle state. Prose belongs in `notes.md`; structured state belongs here. The lead writes; specialists only produce artifacts.

## Purpose

`status.md` was prose. Defer acks, waivers, drift decisions, routing decisions, and resume anchors all lived as free-form text, which meant they could not be validated and could silently diverge from on-disk artifacts. `manifest.yaml` replaces that with a strict, machine-checkable YAML document. The lead reads and writes it; every phase transition consults it; resume reconciles against it.

## Location and format

Path: `docs/journal/{task-ts}_{slug}/manifest.yaml`.

Strict YAML only:

- All strings quoted.
- All timestamps quoted ISO-8601 UTC strings, for example `"2026-04-18T14:30:00Z"`.
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
  final_round: <integer> | null

phases:
  - id: "PHASE-XX" | "PHASE-ALL"
    closure:
      local_status: open | locally_accepted | reopened_by_e2e
      local_submit_round: <integer> | null
      local_submitted_at: "<ISO-8601>" | null
      reopened_by_e2e_round: <integer> | null
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
      final_round: <integer> | null

end_to_end_sweep:
  required: true | false
  required_reason: "<string>"
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
  final_round: <integer> | null

waivers:
  - id: "<string>"
    gate: triage | plan | implementation | review | exercise | e2e-sweep
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
  - loop: plan | review | e2e-sweep
    phase: "PHASE-XX" | "PHASE-ALL" | null
    round: <integer>
    dominant_issue: "<string>"
    resolution: continue | narrow | escalate-user | restart
    at: "<ISO-8601>"

current:
  phase: "PHASE-0" | "PHASE-XX" | "PHASE-ALL" | e2e-sweep | delivery-ready
  loop: plan | implementation | review | e2e-sweep | null
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

- `active` — currently authoritative for its loop and scope. `accepted: true` plus `status: active` means "usable for routing right now." Every round starts life as `active` when it is first accepted (or `active` with `accepted: false` when it was rejected but kept for history).
- `superseded` — valid for its run, but a later round in the same loop and scope replaced it as current authority. The artifact file stays on disk as historical evidence. Use for cases like "end-to-end round 03 said red; later end-to-end round 04 reran cleanly and is now authoritative." `superseded_by_round` names the replacing round.
- `contaminated` — the round's proof or routing basis is no longer trustworthy because the method or environment invalidated the run. Examples: parallel proof against a single-instance harness per @skill:test-harness-isolation, wrong binary, wrong artifact scope, prompt contamination. `contaminated` is a stronger signal than `superseded`: the evidence was never trustworthy, not merely later replaced. `superseded_by_round` may be null for a contaminated round until a clean sequential rerun explicitly replaces it.

Atomicity rules for status transitions:

- An `active → superseded` transition requires populating `status`, `status_changed_at`, `status_reason`, `status_record_path`, and `superseded_by_round` in the same manifest write. A `superseded` round without `superseded_by_round` is rejected by the validator.
- An `active → contaminated` transition requires populating `status`, `status_changed_at`, `status_reason`, and `status_record_path` in the same manifest write. `superseded_by_round` is null until a clean rerun replaces the round.
- Every `active → superseded` or `active → contaminated` transition requires a matching `drift_checks` entry appended in the same write window. The `drift_checks` entry carries the narrative audit context; the round-level `status` is the machine-checkable routing signal. Both are required; neither substitutes for the other.
- When a round's status changes, `final_round` for that round's array must be recomputed in the same write (see Validation rule 10–13 below).

## Per-phase closure

Each phase carries a `closure` block that tracks local phase acceptance independently from global lifecycle finality.

Values for `local_status`:

- `open` — the phase has not yet reached an `accepted: true`, `action: submit`, `status: active` review round.
- `locally_accepted` — the phase review reached `submit` (with `status: active`). This is phase-local truth. If Phase 4 is required, the phase is still subject to reopen; local acceptance does not mean the lifecycle is globally final.
- `reopened_by_e2e` — the phase previously reached `locally_accepted`, and end-to-end evidence later reopened ownership back to this phase. The prior local submit artifact stays valid as a historical phase-local result; it is not "wrong," it is no longer sufficient for global routing.

Return transition:

- If a phase currently in `reopened_by_e2e` later reaches a new local `submit` (a new review round `accepted: true`, `action: submit`, `status: active`), `closure.local_status` returns to `locally_accepted`. The phase does not remain permanently labeled `reopened_by_e2e` once a later local review has re-established phase-local submit.
- The `reopened_by_e2e_round`, `reopened_at`, and `reopen_reason` fields remain populated as historical metadata of the most recent reopen. The manifest carries one reopen record at a time; multiple reopens rely on `drift_checks` for the full history.

Atomicity rules for closure transitions:

- An `open → locally_accepted` transition requires populating `local_submit_round` and `local_submitted_at` in the same write.
- A `locally_accepted → reopened_by_e2e` transition requires populating `reopened_by_e2e_round`, `reopened_at`, and `reopen_reason` in the same write. A `local_status: reopened_by_e2e` state without those three fields is rejected by the validator.
- A `reopened_by_e2e → locally_accepted` return transition updates `local_submit_round` and `local_submitted_at` to the new submit round. The prior `reopened_by_e2e_*` fields remain as historical record unless a later reopen overwrites them.
- Every closure transition requires a matching `drift_checks` entry appended in the same write window.

## Update protocol

- **Write-only-forward.** No field is deleted. Superseded entries carry timestamps instead of disappearing.
- **Atomic transitions.** One manifest write per event: phase transition, round acceptance, defer ack, waiver grant, amendment acceptance, drift check recorded, re-triage, round authority transition (active → superseded or active → contaminated), or phase closure transition. Authority and closure transitions are atomic per the "Round authority status" and "Per-phase closure" sections above; any partial state is rejected by the validator.
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
10. `plan.final_round` matches the highest round in `plan.rounds` with `accepted: true` and `status: active`.
11. For each phase, `implementation.final_round` matches the highest round in that phase's `implementation.rounds` with `accepted: true` and `status: active`. A contaminated or superseded round never counts as final; `final_round` falls back to the previous active accepted round, or to null if none exists.
12. For each phase, `review.final_round` matches the highest round in that phase's `review.rounds` with `accepted: true` and `status: active`. The same fallback rule as rule 11 applies.
13. When `end_to_end_sweep.rounds` is non-empty, `end_to_end_sweep.final_round` matches the highest round with `accepted: true` and `status: active`. The same fallback rule as rule 11 applies.
13a. Every `superseded` round has `superseded_by_round` populated pointing to an existing round in the same array; every `contaminated` round has `status_reason` and `status_record_path` populated. Missing atomicity fields reject the manifest.
13b. Every phase's `closure.local_status` is consistent with its review rounds: `open` iff no review round has `accepted: true`, `action: submit`, `status: active`; `locally_accepted` when such a round exists and no later reopen is recorded; `reopened_by_e2e` when the most recent closure transition records a reopen that has not yet been answered by a new local submit.
13c. `closure.reopened_by_e2e_round`, `closure.reopened_at`, and `closure.reopen_reason` are all non-null when `closure.local_status == reopened_by_e2e`; all may be non-null or null otherwise (they remain as historical record after a return-transition to `locally_accepted`).
14. Every `deferred_items` entry has an `ack` with a valid `mode` and `acked_at`.
15. Every `waivers` entry has `scope`, `approver`, `reason`, `granted_at`. If `approver: migration`, then `ratified_by_user` must be `true` before the lifecycle can reach `delivery-ready`.
16. `current.phase` is consistent with the latest accepted round across phases, `plan.final_round`, and `end_to_end_sweep.final_round` when present.
17. When `current.heartbeat_path` is not null, it points to an existing readable heartbeat file under the current task journal.
18. `end_to_end_sweep.required` is `true` whenever any Risk flag is `true`, or when `flags.multi-phase` is `true` and any of `flags.shared-contract-change`, `flags.persisted-state-change`, `flags.authority-shift`, `flags.external-behavior-change`, or `flags.compatibility-promise` is `true`.
19. `triage.requires_revalidation: true` blocks delivery; a new plan round must reach `accepted: true` with `status: active` and `accepted_at` later than the current triage round's `proposed_at`.

**Semantic checks** remain the critic's responsibility and are not covered by these rules. They include whether flag values match the actual change, whether plan sections substantively cover the obligations, and whether exercise or parity evidence is substantive.

On any failed rule the lead stops, records the failure in `drift_checks`, and asks the user.

## Resume reconciliation

On resume:

1. Parse the manifest.
2. Apply the validation rules above.
3. For every `path` in the manifest, confirm the file exists and parses against its own artifact schema (frontmatter, required sections).
4. Confirm the highest numbered artifact on disk matches `plan.final_round`, each phase's `implementation.final_round`, each phase's `review.final_round`, and `end_to_end_sweep.final_round` when present.
5. Any rule failure or disk/manifest mismatch → stop and ask the user. Do not resume.

## Waiver semantics

Waivers lift a specific gate under a specific scope. Every waiver must carry:

- **`gate`**: which lifecycle gate it lifts (triage, plan, implementation, review, exercise, e2e-sweep).
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

- @skill:squad-lead — creates the manifest at Phase 0 and updates it at every event.
- @skill:squad-triage — produces the `triage.md` artifact that the manifest's `triage.path` references and whose re-triage sections map to `triage.rounds`.
- @skill:squad-plan-critic — Angle 0 validates triage correctness; on pass, lead transitions the current triage round to `validated`.
- @skill:squad-convergence — the lead records round acceptance in the manifest after each author/critic turn converges.
- @skill:squad-review-author and @skill:squad-implementer — own the heartbeat files that `current.heartbeat_path` points at while they are the active critical-path specialist.

## Anti-patterns

- Writing prose state into the manifest. Use `notes.md`.
- Multiple writers. The lead is the only writer.
- Author-set tier values. The tier is recomputed from flags.
- Deleting or editing historical triage rounds instead of superseding them.
- Synthesizing `approver: user` waivers during migration. Use `approver: migration` and require user ratification.
