---
name: Squad Convergence
description: Convergence protocol for author and critic collaboration loops across planning, review, and triage. Defines turn structure, verdict rules, dismissal acceptance, severity disputes, deviations, and max-rounds behavior.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-17T11:18:05Z"
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

## Max rounds

If max rounds are reached:

- the lead still records a final artifact
- the artifact must remain usable for the next workflow step
- unresolved points must appear under `Open Questions` or `Unresolved Disagreements`
- the lead decides whether to stop, escalate, or proceed with explicit assumptions

## Artifact persistence

When the workflow keeps a task journal, store collaboration artifacts under `docs/journal/{task-ts}_{slug}/` and keep `manifest.yaml` updated with the active artifact paths and round state per @skill:squad-manifest.
