# Design: Phase 0 Triage + Structured Lifecycle Manifest

Status: accepted, implemented in the same commit that adds this document.
Schema version: 1.

## 1. Problem statement

The squad methodology had three coupled weaknesses:

- **Optional proportionality.** `complexity: <lite|standard|full>` in the plan frontmatter was optional. The strongest mandatory audit passes fired only on `standard` or `full`. An author could omit the field and formally skip heavy obligations on high-risk work.
- **Free-form state machine.** `status.md` was prose. It carried defer acknowledgments, exercise waivers, drift deviations, end-to-end routing decisions, and resume anchors — all load-bearing, none machine-validatable. A lead could satisfy every rule in letter by logging decisions in ways no downstream check could verify.
- **No mechanism for scaling the protocol to task risk.** Every task paid full-tier cost regardless of actual risk. Expected failure mode: teams skip the method on small work, or fill sections with low-signal prose, training the artifact into noise.

This design closes all three in one pair of artifacts: a mandatory Phase 0 triage document, and a structured lifecycle manifest that replaces `status.md`.

## 2. Non-goals

This design does not:

- Redesign the plan, implementation, or review artifact schemas.
- Change the author/critic/lead roles.
- Introduce new specialist roles beyond what already exists. (Triage is a lead artifact. Its correctness is validated by the plan critic at the first plan round.)
- Replace the per-phase review loop.
- Ship deterministic validation tooling. Validation is a set of rules the lead agent applies during state transitions and on resume. Any future deterministic CLI wrapping those rules is a separate project outside this skill set.

## 3. High-level solution

1. **Before planning dispatches**, the lead produces `triage.md`, a boolean-flag classification of the proposed change. Obligations (required artifact sections and gates) are derived from the flags. Tier is a display label computed from flags; it is not a free choice.
2. **The lifecycle manifest** (`manifest.yaml`, replacing `status.md`) is the structured state machine. It records the triage result, every accepted artifact, every defer ack, every waiver, every amendment, and every drift deviation in machine-validatable form.
3. **The plan critic validates the triage** at the first plan round as Angle 0. Triage starts `proposed` and becomes `validated` only when Angle 0 passes. Plan work may proceed against `proposed` triage, but delivery is blocked until `validated`.
4. **Escalation is explicit.** If any downstream step reveals a flag the triage missed, the lifecycle re-triages. Re-triage that adds a risk flag or a new contract flag auto-reopens plan acceptance: the accepted plan is no longer sufficient for delivery until revalidated against the new obligations.

## 4. The triage artifact

### 4.1 Location and lifecycle

Path: `docs/journal/{task-ts}_{slug}/triage.md`.

Produced by the lead after the requirement is accepted (end of Phase 0), before Phase 1 dispatches.

Mutable only via explicit re-triage events. Each re-triage appends a `### Re-triage N: <reason>` section and updates the manifest's `triage.current_round` plus the relevant entry in `triage.rounds`.

### 4.2 Status lifecycle

- `proposed` — triage drafted by the lead; plan author may begin planning against it.
- `validated` — plan critic's Angle 0 passed on the current triage round; delivery gates may unlock against this.
- `superseded` — a later re-triage round has replaced this one.

Planning may dispatch against `proposed`, but `delivery-ready` is blocked unless triage is `validated` AND no pending re-triage is open.

### 4.3 Schema

```markdown
---
task: <task-ts>_<slug>
round: <N>
status: proposed | validated | superseded
---

# Triage: <task title>

## Change synopsis

One paragraph, outsider-readable. Describes the change at the level the flags operate on. No implementation detail. Enough for an outside reviewer to challenge the flag values.

## Flags

Every flag must be `true`, `false`, or `unknown (<reason>)`. Every `true` requires a one-line rationale grounded in the requirement text. `unknown` blocks dispatch until resolved.

### Scope flags

| flag | value | rationale |
| --- | --- | --- |
| shared-contract-change | | touches a file format, persisted schema, CLI flag set, IPC message, HTTP/RPC API, library public surface, or any contract consumed by more than one independent caller; includes normative public documentation that forms a contract |
| persisted-state-change | | modifies shape, semantics, or ordering of data persisted to disk, DB, queue, or any durable store |
| authority-shift | | moves source-of-truth responsibility between components, services, or systems |
| external-behavior-change | | alters behavior visible to a caller, user, consumer, or downstream artifact outside the modules under change |
| compatibility-promise | | must preserve backward, replay, API, or migration compatibility |

### Risk flags

| flag | value | rationale |
| --- | --- | --- |
| security-scope | | within a security boundary (auth, authz, secrets, cryptography, trust-boundary input validation) |
| safety-scope | | affects correctness under concurrency, idempotency, exactly-once semantics, or an invariant where silent corruption matters |
| compliance-scope | | governed by external regulatory or legal requirement |
| performance-scope | | the requirement or an NNG names explicit latency, throughput, resource, or timing behavior that the change must satisfy |

### Structural flags

| flag | value | rationale |
| --- | --- | --- |
| multi-boundary | | crosses two or more semantic or authority boundaries (services, processes, trust zones, persistence domains, or modules with distinct owners). Documents and teams do not count on their own |
| multi-phase | | delivery requires more than one phase |

### Change-class flags

| flag | value | rationale |
| --- | --- | --- |
| bug-fix-regression | | change is a fix that must prevent a specific regression from recurring |
| behavior-preserving-refactor | | claimed bit-identical external behavior; requires `external-behavior-change: false` and a named parity proof method in `## Parity method` below |

## Parity method

Required only when `behavior-preserving-refactor: true`. Name the concrete proof: characterization tests, golden-output comparison, replay of recorded traces, differential fuzzing, etc. Without a named method, `behavior-preserving-refactor` is `unknown`.

Use `- Not applicable.` otherwise.

## Derived obligations

Obligations are now stage-specific. This table is the canonical matrix the later skills reference.

| flag (true) | plan-stage obligations | implementation-stage obligations | review-stage obligations | Phase 4 contribution |
| --- | --- | --- | --- | --- |
| shared-contract-change | `## Current Behavior`, `## Shared Contract Producer/Consumer Audit`, `## Concept Glossary` | `- None.` | `- None.` | requires Phase 4 only when combined with `multi-phase` |
| persisted-state-change | `## Persistence and Authority Model`, `## Data-Structure and Ordering Invariants` | `- None.` | `- None.` | requires Phase 4 only when combined with `multi-phase` |
| authority-shift | `## Persistence and Authority Model` with explicit before/after authority statement | `- None.` | `- None.` | requires Phase 4 only when combined with `multi-phase` |
| external-behavior-change | `## End-State Walkthrough` on primary acceptance criterion | `## Exercise Setup` | `## Feature Exercise Evidence` in every behavior-changing review round | requires Phase 4 only when combined with `multi-phase` |
| compatibility-promise | additional `## End-State Walkthrough` on compatibility path | `## Exercise Setup` for the compatibility path | compatibility-path exercise in `## Feature Exercise Evidence` | requires Phase 4 only when combined with `multi-phase` |
| security-scope | security scenarios in Testing Strategy; security-risk entries in Risks and Mitigations | `- None.` | `- None.` | requires Phase 4 |
| safety-scope | `## Data-Structure and Ordering Invariants`; concurrency/idempotency test plan in Testing Strategy | `- None.` | `- None.` | requires Phase 4 |
| compliance-scope | compliance-risk entries in Risks and Mitigations; audit-trail note in Design | `- None.` | `- None.` | requires Phase 4 |
| performance-scope | performance-characterization scenario in Testing Strategy; NNG signal names a measurable target | `- None.` | `- None.` | requires Phase 4 |
| multi-boundary | `## Concept Glossary` with one row per boundary for each load-bearing concept, or compact `- None.` justification when the plan crosses boundaries but no load-bearing concept changes meaning | `- None.` | `- None.` | `- None.` |
| multi-phase | `## Phase Integrity`, stable `PHASE-XX` IDs | `- None.` | `- None.` | contributes only when paired with `shared-contract-change`, `persisted-state-change`, `authority-shift`, `external-behavior-change`, or `compatibility-promise` |
| bug-fix-regression | regression scenario + regression test commitment | `## Regression Baseline` | `## Regression Evidence` in review | `- None.` |
| behavior-preserving-refactor | parity evidence commitment, using the method named in `## Parity method` | `## Exercise Setup`, `## Parity Evidence` | `## Parity Evidence` | `- None.` |

When zero flags fire, no heavy conditional sections are required. The Lite baseline still applies, and the unconditional plan schema now includes `## Verification Inputs`.

## Tier label (display only)

`<Lite | Standard | Full>`, auto-derived from flags:

- **Lite** = zero flags fire
- **Standard** = one or two scope or structural flags fire; no risk flag fires
- **Full** = three or more flags fire, or any risk flag fires, or (multi-phase AND multi-boundary)

The tier label is shorthand. The real contract is the obligation list above. Validation never keys off the label.

## Lite baseline

Required even when zero flags fire, because Angle 0 alone is insufficient backstop:

- **Changed-surface inventory**: the concrete files, modules, or components the change touches.
- **External behavior yes/no**: explicit statement and rationale, even if restating the flag.
- **Regression proof commitment** (if `bug-fix-regression: true`): the specific regression test or evidence the implementation will produce.
- **Focused verification method**: how the change will be proven correct (test suite, manual check, inspection).
- **Verification Inputs seed row**: at least one concrete command or action, fixture or setup, expected signal, and evidence location for downstream execution.
- **Skip justification**: one sentence explaining why no glossary, walkthrough, or audit applies.

## Escalation triggers

Conditions that require re-triage:

- Plan discovers a producer or consumer not enumerated at triage time
- Plan touches a persistence surface the triage did not anticipate
- Implementer pre-flight reality check reveals a boundary the triage missed
- Any review finds an NNG or acceptance criterion that demands an untriggered gate
- User introduces scope via a `### Revision N: Breaking` requirement revision
- Discovery of a concept collision between components the plan distinguishes (concept collisions are plan-time concerns, not triage-time; they trigger re-triage only if they reveal an unflagged boundary)

Any of the above: re-triage before continuing work in the current phase.

## Open questions

Use `- None.` when empty.
```

### 4.4 Flag invariants

The validator enforces:

- `external-behavior-change: true` AND `behavior-preserving-refactor: true` is contradictory → invalid triage.
- `behavior-preserving-refactor: true` requires `## Parity method` to be non-empty → otherwise the flag is forced to `unknown`.
- `compatibility-promise: true` without `external-behavior-change: true` or `shared-contract-change: true` is suspicious → validator warns; critic must explicitly justify.
- `bug-fix-regression: true` requires the Lite baseline's regression proof commitment.
- Any `unknown` blocks dispatch to Phase 1.

### 4.5 Validation (Angle 0)

The plan critic's first round adds Angle 0:

> **Angle 0: Triage correctness.** Produce a flag-by-flag validation table. For each flag: confirm the value against the requirement and proposed change, cite the evidence, and flag corrections needed. If any producer, consumer, persistence surface, boundary, risk, or performance characteristic is visible in the plan but absent from the triage flag set, mark the triage as blocking and require re-triage before continuing.

Angle 0 is load-bearing. Without it, the triage is author-declared and gameable.

When Angle 0 passes, the current triage round transitions from `proposed` to `validated`, `triage.md` frontmatter is updated to match, and the manifest records the transition.

### 4.6 Re-triage

When escalation triggers fire mid-lifecycle:

1. Lead appends `### Re-triage N: <reason>` to `triage.md`, listing the changed flags and their new values plus a rationale per change.
2. The prior triage round's manifest entry becomes `superseded`; the new round starts as `proposed`.
3. Manifest fields `triage.current_round`, `triage.rounds[*].flags`, `triage.rounds[*].tier`, and the new round's timestamps update.
4. **If the re-triage adds or flips to `true` any scope flag, risk flag, or structural flag** (any flag other than change-class flags), plan acceptance auto-reopens: the manifest marks the accepted plan as `requires-revalidation`, the current phase's review and implementation pause, and a fresh plan round is required to address the new obligations before they can resume.
5. **If the re-triage only changes change-class flags** (`bug-fix-regression`, `behavior-preserving-refactor`), the lead decides whether to reopen the plan based on what obligations newly apply.

Re-triage never voids prior artifacts. Superseded plan, implementation, and review rounds remain on disk as evidence. They are simply no longer sufficient for delivery until the lifecycle revalidates against the new obligations.

## 5. The lifecycle manifest

### 5.1 Location and format

Path: `docs/journal/{task-ts}_{slug}/manifest.yaml`.

Format: strict YAML. Anchors, aliases, implicit dates, and tags are forbidden; all strings quoted; all timestamps ISO-8601 UTC as quoted strings. Narrative commentary belongs in a separate `notes.md`. The manifest is structured state only.

### 5.2 Schema (v1)

The manifest models the lifecycle as: one requirement, one triage artifact with append-only round history, one plan (shared across phases), per-phase implementation and review, and one optional end-to-end sweep.

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
      tier: lite | standard | full     # auto-derived, display only
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
  requires_revalidation: true | false    # true after a re-triage that added a scope/risk/structural flag

plan:
  rounds:
    - round: <integer>
      path: "<relative path>"
      accepted: true | false
      accepted_at: "<ISO-8601>" | null
      superseded_at: "<ISO-8601>" | null
      status: active | superseded | requires-revalidation
  final_round: <integer> | null       # highest round with status == active and accepted == true

phases:
  - id: "PHASE-XX" | "PHASE-ALL"
    implementation:
      rounds:
        - round: <integer>
          path: "<relative path>"
          accepted: true | false
          accepted_at: "<ISO-8601>" | null
          action: implement | submit | deferred
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
  final_round: <integer> | null

waivers:
  - id: "<string>"
    gate: triage | plan | implementation | review | exercise | e2e-sweep
    scope: "<string>"
    approver: user | lead | migration
    ratified_by_user: true | false     # always true for approver=user; must flip to true before delivery-ready for migration
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

### 5.3 Update protocol

- **Write-only-forward.** No field is deleted. Superseded entries carry `status: superseded` plus `superseded_at`.
- **Atomic transitions.** The manifest updates at every phase transition, every round acceptance, every defer ack, every waiver grant, every amendment acceptance, every drift check. One write per event.
- **Single writer.** Only the lead writes the manifest. Specialists produce artifacts; the lead records acceptance and state changes. This avoids concurrent write conflicts and keeps truth centralized.

### 5.4 Validation rules

The lead applies these rules before every phase transition and on every resume. The rules are normative; a team may wrap them in deterministic tooling, but that tooling is out of scope for this skill set. The skills describe the rules the lead must run as an agent.

**Structural checks the lead runs:**

1. The YAML parses. Reject anchors, aliases, implicit dates, and explicit tags; require quoted strings and ISO-8601 quoted timestamps.
2. Every `path` field references an existing, readable file in the repo.
3. `triage.current_round` points to the highest-numbered triage round present.
4. The current triage round's `tier` is recomputed from the current round's `flags` using the §4.3 heuristic; any mismatch with the stored label is corrected in place.
5. The current triage round's `flags` satisfy every flag invariant listed in §4.4.
6. The accepted plan artifact satisfies the unconditional plan schema. This now includes `## Verification Inputs`.
7. For every `true` flag in the current triage round's `flags`, the corresponding **plan-stage** obligation from §4.3's "Derived obligations" is present in the accepted plan artifact.
8. Before accepting an implementation round or any later phase, the latest accepted implementation artifact contains every required **implementation-stage** obligation. Today that includes `## Exercise Setup` when direct review proof will be required, `## Regression Baseline` when `bug-fix-regression` is `true`, and parity evidence when `behavior-preserving-refactor` is `true`.
9. Before accepting a review round, end-to-end sweep round, or delivery handoff, the latest accepted review artifact contains every required **review-stage** obligation. Today that includes feature exercise evidence when `external-behavior-change` or `compatibility-promise` is `true`, `## Regression Evidence` when `bug-fix-regression` is `true`, and parity evidence when `behavior-preserving-refactor` is `true`.
10. `plan.final_round` equals the highest accepted plan round with `status: active`.
11. Each phase's `implementation.final_round` equals the highest accepted implementation round in that phase.
12. Each phase's `review.final_round` equals the highest accepted review round in that phase.
13. `end_to_end_sweep.final_round` equals the highest accepted sweep round when any sweep rounds exist.
14. Every `deferred_items` entry has an `ack` with a valid `mode` and `acked_at`.
15. Every waiver has `scope`, `approver`, `reason`, and `granted_at`. If `approver: migration`, then `ratified_by_user` must be `true` before the lifecycle can reach `delivery-ready`.
16. `current.phase` is consistent with the latest accepted round across phases, the plan's status, and the end-to-end sweep when present.
17. When `current.heartbeat_path` is not null, it points to an existing readable heartbeat file under the task journal.
18. `end_to_end_sweep.required` is `true` if any Risk flag is `true`, or if `multi-phase` is `true` and any of `shared-contract-change`, `persisted-state-change`, `authority-shift`, `external-behavior-change`, or `compatibility-promise` is `true`.
19. `triage.requires_revalidation: true` blocks delivery; the plan must reach a new accepted round after the current triage round's `proposed_at` timestamp.

**Semantic checks** remain the critic's responsibility and cannot be covered by these rules:

- Whether flag values match the actual change.
- Whether plan sections substantively cover the obligations, not just exist by name.
- Whether exercise evidence is substantive.

On any failed rule the lead stops, records the failure in the manifest's `drift_checks` (or a dedicated validation failure entry) and asks the user.

### 5.5 Resume reconciliation

On resume:

1. Parse the manifest.
2. Apply the §5.4 validation rules.
3. For every `path` in the manifest, confirm the file exists and parses against its own artifact schema.
4. Confirm the highest numbered artifact on disk matches `plan.final_round`, each phase's `implementation.final_round`, each phase's `review.final_round`, and `end_to_end_sweep.final_round` when present.
5. Any rule failure or disk/manifest mismatch → stop and ask the user. Do not resume.

This replaces the prose-based reconciliation in the previous `squad-lead.md`.

## 6. Integration with existing phases

- **Phase 0 (Requirement).** Unchanged, plus the lead produces `triage.md` after the requirement is accepted and creates `manifest.yaml` at that moment.
- **Phase 1 (Plan).** Plan author reads `triage.md` and produces only the obligations the triage requires. The plan critic's round 1 runs Angle 0 (triage validation) before any other angle. On Angle 0 pass, the manifest transitions triage status to `validated`.
- **Phase 2 (Implement).** Implementer reads the triage. The pre-flight reality check bounces to re-triage if it discovers a boundary the triage missed. Defer entries flow through the manifest's defer-ack protocol. Where review will later need direct proof, implementation now records reusable setup facts such as `## Exercise Setup` and `## Regression Baseline`.
- **Phase 3 (Review).** Review author consults the triage: if `external-behavior-change: true` or `compatibility-promise: true`, `## Feature Exercise Evidence` is required unless there is a matching user-approved or user-ratified manifest waiver. If `bug-fix-regression: true`, `## Regression Evidence` is required. If `behavior-preserving-refactor: true`, `## Parity Evidence` is required. Inventory-class facts from plan and implementation may be reused, but verification-class evidence remains reviewer-produced. Action defaults to `implement` on missing required evidence.
- **Critical-path monitoring.** Implementers and reviewers own append-only heartbeat files under the task journal. The lead reads those heartbeat files before sending any status interrupt. The manifest carries only `current.heartbeat_path`, a single resume-visible pointer to the active critical-path specialist's heartbeat file.
- **Phase 4 (End-to-end sweep).** Triggers when `end_to_end_sweep.required == true`. `required_reason` records the triggering flags.
- **Delivery handoff.** Lead runs the validator, confirms no pending `requires_revalidation`, all waivers either resolved or (if `approver: migration`) user-ratified, all defers acked, end-to-end sweep submitted when required.

## 7. Migration path from `status.md` prose

- **New tasks.** Manifest and triage mandatory from day one.
- **In-flight tasks past plan acceptance.** Lead writes a manifest retroactively and derives a triage from the accepted plan's section list. Any missing obligation surfaces as a waiver with `approver: migration` and `ratified_by_user: false`. Before delivery-ready, the user must either ratify the migration waivers (flipping `ratified_by_user` to `true`) or trigger a plan amendment.
- **In-flight tasks mid-plan.** Lead pauses, produces a triage, reclassifies the in-progress plan against the obligations, and continues. Any flag change that demands new obligations reopens planning per §4.6.
- **Migration tooling.** A script (separate tooling, not in this design) can parse existing `status.md` prose and bootstrap a manifest skeleton for human review. Until the tooling exists, migration is manual.

`approver: migration` waivers never count as approved without explicit user ratification. Synthesizing `approver: user` waivers during migration is forbidden.

## 8. Open questions

1. **Is Angle 0 enough, or does triage deserve its own author/critic loop?** Current design: no separate loop; Angle 0 carries triage validation. Strengthen later if the Angle 0 flag-by-flag table proves too shallow in practice.
2. **Is the flag list complete?** Current additions beyond the first draft: `performance-scope`. Likely gaps: observability-sensitive changes are not separately flagged (they fold into `shared-contract-change` if the telemetry contract is public, otherwise Lite-level). Documentation-only changes are covered only when they form a normative public contract. Review in practice and extend if a recurring defect class points to a missing flag.
3. **YAML strictness in practice.** Schema v1 mandates strict parsing. If teams find strict mode painful, v2 can relax — but only after evidence of false positives, not on aesthetic grounds.

## 9. What this design does not address

Separately scoped designs (each lower-leverage than item 1):

- Assigned Scope Coverage in implementation reports (closes the silent-omission loophole).
- NNG falsifiability laundering — remove the "or in Design" path from plan-author and plan-verification.
- Formal plan-amendment artifact schema (the manifest has `amendments:` fields but the artifact itself needs a skill).
- Plan-critic consolidation (angles vs audit passes).
- Project-adapter split (paths, changelog, MR handoff out of core lead).
- Evidence rubric (what counts as "fresh," "thin," "credible").
- Critic-independence rule in convergence.

Each is separable and smaller than this one. They should be designed and landed in follow-up passes.

## 10. Changelog

- v1.1 (this document): Structural fixes from independent review.
  - Plan is top-level, not per-phase (matches existing methodology).
  - Triage status: `proposed | validated | superseded` with manifest-backed round history.
  - Removed undefined "Security review gate" / "Compliance review gate" / "Parity evidence" as separate gates; parity evidence is now concretized under `behavior-preserving-refactor` with a required `## Parity method` section.
  - Tier label is auto-computed from flags and display-only; validator does not accept author-set tier.
  - Manifest now carries `PHASE-0`, triage round history, stage-specific validation, and explicit `end_to_end_sweep.final_round`.
  - Flag semantics tightened:
    - Removed `concept-collision` from triage (it is a plan-time concern and an escalation trigger, not a pre-plan flag).
    - `multi-boundary` narrowed to semantic or authority boundaries (services, processes, trust zones, persistence domains, owned modules). Documents and teams no longer count on their own.
    - `external-behavior-change` and `behavior-preserving-refactor` are mutually exclusive.
    - `behavior-preserving-refactor: true` requires a named parity method.
  - Added `performance-scope` flag.
  - Migration waivers use `approver: migration` with `ratified_by_user` gate; synthesizing `approver: user` is forbidden.
  - Re-triage that adds any scope, risk, or structural flag auto-reopens plan acceptance.
  - Lite baseline defined: changed-surface inventory, external-behavior statement, regression commitment (if applicable), focused verification method, skip justification.
  - YAML strict mode mandated; anchors, aliases, implicit dates forbidden.
  - Validation reframed as rules the lead agent applies during state transitions and on resume. Deterministic tooling is out of scope for this skill set.
- v1.2: Follow-up proportionality and evidence-flow clarifications.
  - Derived obligations are now documented as a stage-specific canonical matrix, matching `squad-triage`.
  - Lite baseline now includes a `Verification Inputs` seed row.
  - Implementation-stage obligations now include `## Exercise Setup` and `## Regression Baseline` where applicable.
  - Review evidence reuse is scoped: setup and inventory facts may be reused, but proof remains reviewer-produced.
  - Phase 4 trigger is narrowed: risk flags always require it; `multi-phase` requires it only when paired with a load-bearing cross-phase surface.
- v1.3: Critical-path heartbeat integration.
  - Critical-path implementers and reviewers now write append-only heartbeat files at workflow breakpoints and on approximate tool-call cadence.
  - Lead monitoring is heartbeat-first: read passive progress evidence before any status interrupt.
  - The manifest carries a single `current.heartbeat_path` field for resume visibility without turning heartbeat into lifecycle state.
