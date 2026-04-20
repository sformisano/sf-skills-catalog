---
name: Squad Triage
description: Phase 0 triage for the squad lifecycle. Produces triage.md, a mechanical flag classification of the proposed change that derives the plan's required obligations. Replaces the optional `complexity` plan field with a binding, flag-driven obligation set.
author: Salvatore Formisano
created_at: "2026-04-18T11:22:39Z"
updated_at: "2026-04-18T15:02:16Z"
---

# Squad Triage

Triage classifies the task by mechanical flags before planning begins. The flag values drive which plan sections, gates, and evidence are required. Tier is a label computed from the flags, not a free choice.

## Purpose

Before Phase 1 dispatches, the lead reads the accepted requirement and produces `triage.md`. The plan author then knows exactly which obligations apply; the plan critic validates the flags at round 1 (Angle 0). This removes the proportionality hole that came from the optional `complexity` field and makes the obligation set auditable.

## When to run

Phase 0, after the requirement is accepted, before any Phase 1 dispatch.

The lead produces the artifact. Triage is not an author/critic loop; the plan critic validates it inline as Angle 0 of the first plan round.

## Output path

`docs/journal/{task-ts}_{slug}/triage.md`

Also update `manifest.yaml` with the initial `triage.rounds` entry and `triage.current_round`. See @skill:squad-manifest.

## Schema

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

### Scope flags

| flag | value | rationale |
| --- | --- | --- |
| shared-contract-change | | touches a file format, persisted schema, CLI flag set, IPC message, HTTP/RPC API, library public surface, or normative public documentation consumed by more than one independent caller |
| persisted-state-change | | modifies shape, semantics, or ordering of data persisted to disk, DB, queue, or any durable store |
| authority-shift | | moves source-of-truth responsibility between components, services, or systems |
| external-behavior-change | | alters behavior visible to a caller, user, consumer, or downstream artifact outside the modules under change |
| compatibility-promise | | must preserve backward, replay, API, or migration compatibility |

### Risk flags

| flag | value | rationale |
| --- | --- | --- |
| security-scope | | within a security boundary (auth, authz, secrets, cryptography, trust-boundary input validation) |
| safety-scope | | affects correctness under concurrency, idempotency, exactly-once semantics, or an invariant where silent corruption matters |
| compliance-scope | | governed by an external regulatory or legal requirement |
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
| behavior-preserving-refactor | | claimed bit-identical external behavior; requires `external-behavior-change: false` and a named parity proof method below |

## Parity method

Required only when `behavior-preserving-refactor: true`. Name the concrete proof: characterization tests, golden-output comparison, replay of recorded traces, differential fuzzing, etc.

Use `- Not applicable.` otherwise.

## Derived obligations

Enumerate required artifact sections and gates, each citing the flag that triggered it. This is the contract the plan author must satisfy and the plan critic blocks on.

## Tier label (display only)

`<Lite | Standard | Full>`, auto-derived from flags. See @skill:squad-manifest for the heuristic and validation.

## Lite baseline

Required even when zero flags fire:

- **Changed-surface inventory**: concrete files, modules, or components the change touches
- **External behavior yes/no**: explicit statement and rationale
- **Regression proof commitment** (if `bug-fix-regression: true`): specific regression test or evidence
- **Focused verification method**: how the change will be proven correct
- **Verification Inputs seed row**: at least one concrete command or action, fixture or setup, expected signal, and evidence location for downstream execution
- **Skip justification**: one sentence explaining why no glossary, walkthrough, or audit applies

## Escalation triggers

Conditions that require re-triage:

- Plan discovers a producer or consumer not enumerated at triage time
- Plan touches a persistence surface the triage did not anticipate
- Implementer pre-flight reality check reveals a boundary the triage missed
- Any review finds an NNG or acceptance criterion that demands an untriggered gate
- User introduces scope via a `### Revision N: Breaking` requirement revision
- Discovery of a concept collision between components the plan distinguishes (concept collisions are plan-time concerns; they trigger re-triage only if they reveal an unflagged boundary)

Any of the above: re-triage before continuing work in the current phase.

## Open questions

Use `- None.` when empty.
```

## Flag semantics

Three principles bind every flag:

- **Mechanical, not magnitudinal.** "Is there a compatibility promise in play?" is acceptable. "Is this a big change?" is not.
- **Triggered by the change, not the task category.** "Does this change touch persisted state?" — not "Is this a data task?"
- **False is explicit.** Empty or missing flag values count as `unknown`, which blocks dispatch. Authors cannot dodge a flag by leaving it out.

## Flag invariants

The lead enforces these before marking triage `proposed`. Angle 0 re-validates them.

- `external-behavior-change: true` AND `behavior-preserving-refactor: true` is contradictory. Reject.
- `behavior-preserving-refactor: true` requires a non-empty `## Parity method` section. Without a named method, the flag is `unknown`.
- `compatibility-promise: true` without `external-behavior-change: true` or `shared-contract-change: true` is suspicious. Allowed, but requires an explicit justification in the rationale.
- `bug-fix-regression: true` requires the Lite baseline's regression proof commitment, even if other flags also fire.
- Any `unknown` flag blocks dispatch to Phase 1.

## Deriving obligations

Map `true` flags to stage-specific obligations. This table is the canonical obligation matrix. Other skills reference it rather than maintaining independent copies. The plan critic blocks when a required obligation for the current stage is missing.

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

When zero flags fire, no heavy conditional sections are required; the Lite baseline above and the unconditional plan schema from @skill:squad-plan-verification, especially `## Verification Inputs`, still apply.

## Phase 4 trigger

Phase 4 is required when either of the following is true:

- any Risk flag is `true`
- `multi-phase: true` and any of `shared-contract-change`, `persisted-state-change`, `authority-shift`, `external-behavior-change`, or `compatibility-promise` is `true`

`multi-phase` alone does not trigger Phase 4.

## Tier heuristic

The label is recomputed from flags, not author-chosen:

- **Lite** = zero flags fire.
- **Standard** = one or two flags from Scope or Structural groups fire; no Risk flag fires.
- **Full** = three or more flags fire, OR any Risk flag fires, OR (`multi-phase` AND `multi-boundary`).

Author-set tier values are ignored. The manifest stores the recomputed value as a display convenience.

## Status lifecycle

- `proposed` — the lead has drafted the triage; plan author may begin planning against it.
- `validated` — the plan critic's Angle 0 passed on the current triage round.
- `superseded` — a later re-triage round has replaced this one.

Planning may dispatch against `proposed`, but the lifecycle cannot reach `delivery-ready` unless triage is `validated` AND no re-triage is pending.

## Re-triage

When an escalation trigger fires:

1. Append `### Re-triage N: <reason>` to `triage.md`, listing changed flags and their new values with rationale for each change.
2. Update `triage.md` frontmatter so `round` points at the new current round and `status` resets to `proposed`.
3. Mark the prior round's manifest entry as `superseded` with `superseded_at`, append a new triage round entry with `status: proposed`, and advance `triage.current_round`.
4. Update the new current round's `flags`, `tier`, and `proposed_at` in the manifest.
5. **If the re-triage adds or flips any Scope, Risk, or Structural flag to `true`**, mark the accepted plan as `requires-revalidation` in the manifest. Current-phase implementation and review pause; a fresh plan round is required to address the new obligations before they can resume.
6. **If the re-triage only changes Change-class flags** (`bug-fix-regression`, `behavior-preserving-refactor`), the lead decides whether to reopen planning based on which obligations newly apply.

Re-triage does not void prior artifacts. Superseded rounds remain on disk as evidence; they are simply not sufficient for delivery until the lifecycle revalidates against the new obligations.

## Integration points

- @skill:squad-lead — dispatches the triage step at Phase 0 and records the result in the manifest.
- @skill:squad-plan-critic — validates triage correctness as Angle 0 of the first plan round.
- @skill:squad-plan-author — consumes `triage.flags` to know which obligations the plan must satisfy.
- @skill:squad-plan-verification — marks sections as conditional on specific triage flags.
- @skill:squad-implementer — pre-flight reality check bounces to re-triage if a boundary is missed.
- @skill:squad-review-author and @skill:squad-review-verification — consult triage to determine whether `## Feature Exercise Evidence` is required.
- @skill:squad-manifest — stores triage round history and the current flag set; validation rules enforce flag invariants and stage-appropriate obligation coverage.

## Anti-patterns

- Leaving flags empty to avoid classification. Blocks dispatch.
- Setting `behavior-preserving-refactor: true` without a named parity method. Flag resets to `unknown`.
- Author-choosing the tier label. Validation recomputes and overwrites.
- Treating re-triage as optional. An escalation trigger fires → re-triage is mandatory.
- Using path-only Lite baselines ("inventory: `src/`"). The inventory must name concrete files or components.
