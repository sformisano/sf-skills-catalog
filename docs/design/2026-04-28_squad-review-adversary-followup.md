# Design Record: Review Adversary

**Status:** implemented in the same change set that adds this document.

**Date:** 2026-04-28.

## Context

The 2026-04-28 squad-adversary rewrite introduced `squad-plan-adversary` to challenge the frame the plan-author and plan-critic share. The same structural argument applies one tier later in the lifecycle: `squad-review-author` and `squad-review-critic` share a frame (the diff, the plan, the triage, the implementation report). Frame-level mistakes in the review (regressions outside the named scenarios, claims the implementation made about external systems that the review accepted at face value, missing workspace deps that the local build masked) are invisible from inside the loop.

The first cut of this rewrite flagged review-adversary as a follow-up. The user requested that the same learnings be applied immediately. This document records the decisions made.

## Decisions

### Cadence: per-phase + e2e

The review adversary runs once per converged review with `action: submit`. That fires:

- after every per-phase review that converges with `submit` (Phase 3.5 in @skill:squad-lead)
- after the end-to-end sweep that converges with `submit` (Phase 4.5)

The adversary does not run when the review's `action` is `implement`. The lead is already looping back; the implementation will rewrite the surface the adversary would otherwise audit.

This mirrors the plan-adversary's "once per convergence" rule. Per-phase + e2e is more expensive than e2e-only, but the leverage is real: per-phase frame mistakes compound into the integrated diff, and the e2e adversary cannot un-make decisions the per-phase reviews already let through.

The cost ceiling per task: N per-phase adversaries (one per `submit` convergence) plus 1 e2e adversary when Phase 4 is required. Tier Lite tasks usually have one phase and no e2e, so they pay 1 adversary at most. Tier Lite skip is allowed by lead discretion.

### Lead reconciliation surface

Three decisions, mirroring the plan adversary:

- `accept` — review's `submit` action stands; lead applies the original Phase 3 or Phase 4 branch.
- `dispatch_revision` — implementation needs to fix something this phase or this sweep round handled. For per-phase: loop to Phase 2 same phase. For e2e: existing reopen-by-e2e authority transition for the targeted phase.
- `escalate_user` — strategic findings, plan-reopen requests, earlier-phase blame, out-of-scope findings.

The adversary does not unilaterally trigger plan reopen or earlier-phase reopen. Findings that attribute blame outside this phase are classified as `Strategic` and escalate to the user.

### Manifest schema

Each per-phase review round and each e2e sweep round carries an `adversary` block with the same shape as the plan adversary block. New `lead_decision` value: `not_applicable`, used when the review's `action` is `implement` and no adversary fires. New validation rules 12a (per-phase) and 13d (e2e) parallel rule 10a (plan).

### Tier gating

- Tier Standard / Tier Full: adversary always runs at every `submit` convergence (per-phase and e2e).
- Tier Lite: adversary may be skipped by lead discretion with a matching `drift_checks` entry.

## Decisions deliberately deferred

### Triage adversary

Not implemented today. Triage is a single-author artifact with no critic round. The plan-critic's Angle 0 already validates triage flags against the requirement and the plan during the first plan round; that pass is structurally similar to an adversary check on triage. If empirical experience surfaces frame-level triage gaps that Angle 0 misses, a triage adversary becomes the natural follow-up.

### Cross-task observability of adversary effectiveness

Not implemented. The number-of-adversary-runs-that-found-blockers metric is a real signal but it is observability, not protocol. Tracked outside this design.

### Model routing

The skills recommend running adversaries on a different model than authors and critics. Routing is an orchestration-layer concern; the skills do not require it.

## Open questions for empirical follow-up

After three or more tasks have run with both adversaries, the following questions can be answered with data rather than guess:

- Does per-phase review adversary catch enough that warrants the cost, or do per-phase frame mistakes mostly get caught at e2e? If the latter, downgrade per-phase to "optional, lead discretion."
- Does the three-bucket findings classification (`blocking` / `advisory` / `strategic`) map cleanly to lead decisions, or do some boundary cases need a fourth bucket?
- Does the `escalate_user` decision get used proportionally, or does the lead avoid it because of friction? If avoided, advisory findings might be silently downgrading from blockers.
- Are there frame mistakes the adversaries are still missing that an external (out-of-loop) reviewer would catch? If so, the depth-budget rules need sharpening again.
