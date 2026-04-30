---
name: squad-convergence
description: "Manages author and critic convergence for formal squad lifecycle artifacts. Use when dispatched by squad-lead or explicitly asked to run squad convergence for plan, review, triage, or adversary artifacts, not for ordinary draft editing."
metadata:
  skillcatalog/display_name: "Squad Convergence"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Convergence Protocol

Use this skill for any author/critic loop in the catalog. It defines the shared rules that plan, review, and triage specialists must follow so the lead can decide convergence deterministically.

## Roles

- **Author**: owns the current draft artifact.
- **Critic**: challenges the draft and validates revisions.
- **Lead or orchestrator**: decides whether the loop converged or needs another round.

## Author turn rules

- Produce a complete artifact each turn, not a diff.
- On revision rounds, address blocking critiques first.
- Keep the artifact actionable even when disagreement remains.
- If tool or context issues changed what you could do, record them in `## Deviations`.

### Revision section

For round greater than one, include:

```markdown
## Revision Response

- addressed: <issue>
- dismissed (<rationale>): <issue>
- deferred: <issue>
```

## Critic turn rules

Every critic artifact must include these sections in this order:

```markdown
## Issues
### Critical
### Major
### Minor

## Dismissed Points Accepted
## Suggestions
## Questions
## Deviations
## Verdict

CRITIC_VERDICT: SATISFIED|NEEDS_REVISION - <blocking reason when needed>
```

Role-specific sections may appear between `## Questions` and `## Deviations`, but the shared sections above must remain present and in order.

## Dismissal acceptance

When the author dismisses a critic point:

1. Accept it if the rationale is evidence-backed.
2. Re-raise it only with new evidence or a concrete uncovered scenario.
3. Note accepted dismissals under `## Dismissed Points Accepted`.

## Severity disputes

When both sides agree on the mechanics of an issue but disagree on severity:

1. Severity disagreement alone is not new evidence.
2. The critic may contest severity once with justification.
3. If the author responds with grounded rationale, treat the difference as a documented disagreement, not a blocking issue.
4. The lead should not reopen a round only because severity labels differ.

## Fresh-pass requirement

A critic round is never limited to validating only prior findings when the current artifact changed:

- design direction
- shared contracts
- persisted state
- data structures with observable semantics
- phase boundaries
- required producers or consumers

Each such round must include at least one fresh semantic pass over the current artifact.

When returning `CRITIC_VERDICT: SATISFIED` on a materially changed artifact, the critic must state:

- which fresh passes were rerun
- which requirement sections or source artifacts were re-grounded
- which code seams or other evidence sources were re-read, or why they were not re-read

Resolving prior findings is not enough to converge if a revision introduced or exposed a new design surface.

## Evidence on SATISFIED

Every `SATISFIED` turn must include at least one of the following:

- a `## Deviations` section listing concrete artifacts, live-code seams, or worked examples the critic inspected during the current turn. Prior-round recaps do not count.
- a `## Strongest Remaining Objection` section naming the most plausible way the plan will fail in implementation, even if the critic does not treat it as blocking.

A critic artifact with empty `## Issues`, empty `## Suggestions`, no fresh investigation evidence in `## Deviations`, and no `## Strongest Remaining Objection` must be treated as `NEEDS_REVISION` by the lead. This rule applies to every author/critic loop that uses this skill, including plan, review, and triage.

## Convergence criteria

The loop converges when:

- every critic verdict is `SATISFIED`
- the latest critic round included fresh semantic re-grounding appropriate to the artifact risk
- no new blocking issue appears in the latest round
- the artifact is still coherent and usable
- remaining disagreements are documented rather than re-litigated

The loop needs revision when:

- a critic returns `NEEDS_REVISION` with a genuinely new blocking issue
- the lead identifies a missing required section or unresolved blocker the current round did not answer

## Adversary integration

Two adversary roles run inside this catalog: @skill:squad-plan-adversary at the plan boundary, and @skill:squad-review-adversary at the review boundary. Both challenge the frame the author and critic share. Both are informational, not gating. The rules below apply to both unless otherwise marked.

Plan-side cadence: the plan adversary runs once per converged plan, after the plan-critic returns `SATISFIED`, before the lead records plan acceptance.

Review-side cadence: the review adversary runs once per converged review with `action: submit`. This means once per per-phase review that converges with `submit` (Phase 3.5 in @skill:squad-lead) and once per end-to-end sweep that converges with `submit` (Phase 4.5). The review adversary does not run when the review's `action` is `implement`; the lead is already routing back to implementation.

Rules for the adversaries' interaction with this convergence protocol:

- Adversaries do not return `SATISFIED` or any equivalent verdict. The author/critic convergence rules above do not apply to them.
- Adversary output structures (defined in @skill:squad-plan-adversary and @skill:squad-review-adversary) are independent of the shared critic structure in this skill. Adversary artifacts may not be wrapped in `## Issues / ## Suggestions / ## Verdict`.
- Each adversary's `## Strongest Residual Concern` section is required even when no blocker is surfaced. This requirement does not apply to critics; it is the adversaries' distinct contract.
- Adversaries run once per convergence. They do not run inside the author/critic round loop. Per-round adversary dispatch is forbidden, since it would re-introduce convergence pressure into the inner loop.

When adversary findings drive a new author or implementation round:

- The lead records the adversary's `lead_decision: dispatch_revision` in @skill:squad-manifest before bumping the round.
- For the plan adversary, the next author turn is an ordinary revision round under this skill: the plan-author addresses each blocking finding in `## Revision Response`, dismissals carry rationale, the plan-critic loop re-runs to `SATISFIED` per the convergence rules above.
- For the per-phase review adversary, the next implementation round addresses the blocking findings, the review-author/review-critic loop re-runs to `SATISFIED` with `action: submit`, and the adversary runs again at the next convergence.
- For the end-to-end review adversary, the existing reopen-by-e2e authority transition fires for the targeted phase. The phase's per-phase review (and Phase 3.5) runs again; once the phase reaches local submit and the e2e sweep reruns to `submit`, the adversary runs again with a fresh artifact path.
- After each new convergence, the lead dispatches the relevant adversary again with a fresh artifact path. Each adversary round is independent; do not anchor on prior adversary findings as the search bound.
- The author/critic and implementation/review loops' existing max-rounds apply unchanged. Adversaries do not have a max-rounds concept; they run once per convergence as long as the inner loop has rounds left.

When the lead escalates an adversary finding to the user (`lead_decision: escalate_user`), the user's response is recorded as a `waivers` entry in @skill:squad-manifest. The waiver may direct `accept`, `dispatch_revision`, plan reopen, earlier-phase reopen, or a requirement revision; the lead acts on the user's direction.

The triage loop does not run an adversary today. Triage is a single-author artifact; the plan-critic's Angle 0 already validates triage flags during the first plan round. If empirical experience surfaces a frame-level triage gap, a triage adversary is the natural follow-up.

## Max rounds

If max rounds are reached:

- the lead still records a final artifact
- the artifact must remain usable for the next workflow step
- unresolved points must appear under `Open Questions` or `Unresolved Disagreements`
- the lead decides whether to stop, escalate, or proceed with explicit assumptions

## Artifact persistence

When the workflow keeps a task journal, store collaboration artifacts under `docs/journal/{task-ts}_{slug}/` and keep `manifest.yaml` updated with the active artifact paths and round state per @skill:squad-manifest.
