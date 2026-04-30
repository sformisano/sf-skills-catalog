# Squad Lead Adversary Reconciliation

Use this reference at every adversary boundary: Phase 1.5 (plan adversary), Phase 3.5 (per-phase review adversary), and Phase 4.5 (end-to-end review adversary). The dispatch contract, decision rules, findings classification, checklist-candidate handling, manifest write pattern, and cadence rule are identical at all three boundaries. The phase-specific differences (which artifact paths, which manifest array, which routing branch fires on `accept` and `dispatch_revision`) are recorded inline in @skill:squad-lead under each phase section. Read those phase sections together with this reference; this file does not replace them.

## When the adversary fires

- After @skill:squad-plan-critic returns `SATISFIED` and convergence rules pass — Phase 1.5.
- After a per-phase review converges with `action: submit` and the proof-execution-mode check passes — Phase 3.5.
- After the end-to-end sweep converges with `action: submit` and the proof-execution-mode check passes — Phase 4.5.

The adversary never fires when the review's `action` is `implement`. The lead is already routing back; the implementation will rewrite the surface the adversary would have audited. The corresponding adversary block on the accepted `implement` round records `lead_decision: not_applicable`.

The adversary fires once per *converged artifact*, not once per author/critic round. If a revision triggers another loop that reaches `SATISFIED` (or `submit`), the adversary runs again with a fresh artifact path.

## Tier gating

- Tier Standard and Tier Full always run the adversary at every boundary above. The manifest validation rules in @skill:squad-manifest § Validation rules enforce this for the round to count toward `final_round` (plan, per-phase review, or end-to-end sweep).
- Tier Lite may skip the adversary at the lead's discretion. When the lead skips, append a `drift_checks` entry with the matching loop tag and a one-line reason:
  - Phase 1.5 skip → `loop: plan`, `resolution: continue`.
  - Phase 3.5 skip → `loop: review`, `phase: <phase id>`, `resolution: continue`.
  - Phase 4.5 skip → `loop: e2e-sweep`, `resolution: continue`.

## Dispatch contract

Pass to the adversary specialist:

- the converged artifact path (plan, per-phase review, or end-to-end review)
- the requirement path
- the triage path
- prior critic artifact paths from the same loop
- code-seam inventory (Phase 1.5) or diff context (Phase 3.5 / 4.5)
- prior accepted artifacts that the adversary needs as input
- the journal path
- an explicit output path (see the phase section in @skill:squad-lead for the file naming convention)

Inject the standard delegation context block defined in @skill:squad-lead § Delegation context.

Set `mode` in the prompt context per boundary. The review-adversary `mode` token matches the review artifact's `mode` token (see @skill:squad-review-verification): one vocabulary across review-author, review-critic, and review-adversary.

- Phase 1.5: no mode needed (plan adversary is single-mode).
- Phase 3.5: `mode: phase`.
- Phase 4.5: `mode: end_to_end`.

Where the orchestration layer can route the adversary to a different model than the author/critic, do so. Same-model adversaries still apply the countermeasures named in @skill:squad-plan-adversary § Same-model awareness or @skill:squad-review-adversary § Same-model awareness.

## Reconciliation decisions

Read the adversary artifact's `## Findings`, `## Strongest Residual Concern`, and `## Checklist Candidates`. Pick exactly one decision:

- **`accept`.** Choose this when `## Findings.Blocking` is empty (or `- None.`), `## Findings.Strategic` is empty, and the residual concern is bounded and addressable in implementation or follow-up. Apply the boundary-specific advance branch named in the phase section of @skill:squad-lead.
- **`dispatch_revision`.** Choose this when `## Findings.Blocking` is non-empty.
  - Phase 1.5: bump the plan round and re-enter Phase 1.
  - Phase 3.5: loop back to Phase 2 for the same phase with the next implementation round.
  - Phase 4.5: apply the existing reopen-by-end-to-end authority transition for the phase the adversary's blame attributes to (see `references/squad-lead-review-routing.md` Case 3).
  - The next author or implementer turn must address each blocking finding. The relevant author/critic loop runs again to convergence. The adversary then runs again with a new artifact path.
- **`escalate_user`.** Choose this when:
  - `## Findings.Strategic` is non-empty.
  - `## Frame Challenge` requires a product or architecture decision the lead cannot make alone.
  - Adversary findings would push the work outside the requirement's scope.
  - At Phase 3.5 specifically: blocking findings attribute blame to the plan or to an earlier phase (which the lead does not unilaterally reopen from a per-phase boundary).
  - Surface the question to the user, record their decision in `waivers` (with `approver: user` and the matching `gate`: `plan`, `review`, or `e2e-sweep`), and act on the answer. The user may direct `accept`, `dispatch_revision`, plan reopen, earlier-phase reopen, or a requirement revision.

## Findings classification rules

Every finding belongs in exactly one bucket. The bucket drives reconciliation.

- **Blocking.** A finding that, if true, makes the artifact's claim wrong:
  - At Phase 1.5: a property the plan claims that is not true, where the falsity makes implementation fail, ships a defect to operators, or violates an NNG.
  - At Phase 3.5 / 4.5: a property the review claims that is not true at the diff level, where the falsity makes `submit` unsafe — the implementation has a real defect, an NNG is violated, or an operator-visible failure is plausible.
  - If unsure whether a finding is blocking, treat it as blocking.
- **Advisory.** A finding that does not invalidate the artifact but improves robustness, precision, or completeness. The lead may fold advisory findings into a follow-up, into implementation as clarification, or into a non-blocking author/implementer round at lead discretion.
- **Strategic.** A finding that requires a product or architecture decision the lead cannot make alone. At Phase 3.5 / 4.5 this includes findings that attribute blame to the plan or to an earlier phase.

A finding placed in the wrong bucket is itself a critic-level defect; the lead may bounce the adversary's verdict on bucketing alone.

## Checklist candidate handling

This rule applies at Phase 1.5, Phase 3.5, and Phase 4.5. Every accepted candidate must have an owner; this is enforced by manifest validation rule 20.

- Read `## Checklist Candidates`. If the section is `- None.` or empty, do nothing.
- For every non-empty candidate, decide whether it is **accepted** or **rejected**.
- Record every non-empty candidate in `manifest.yaml` under `checklist_candidates` with `decision`, `owner`, and either `target_skill` or a follow-up target named in the candidate text.
- Append a concise `drift_checks` entry for each accepted candidate.
- Checklist candidates do not change routing by themselves. If a candidate exposes a current blocking defect, route by the corresponding `Blocking` or `Strategic` finding instead.
- Recording is required even on `accept`. A converged-and-accepted artifact whose checklist candidates were never recorded is a manifest defect that will be caught by validation rule 20.

## Manifest write pattern

Use atomic writes that combine the round's acceptance and the adversary block. The exact field set lives in @skill:squad-manifest, but the structural pattern is:

- **On `accept`.** Write the round's acceptance fields (`accepted: true`, `accepted_at`, `status: active`, plus the round-specific evidence block such as `exercise`) together with the `adversary` block carrying `lead_decision: accept` in the same atomic write. Then advance `final_round` (plan, review, or end-to-end sweep) per the validation rule for that array. Then apply the boundary-specific advance branch in @skill:squad-lead.
- **On `dispatch_revision`.** Write the adversary block with `lead_decision: dispatch_revision`. The round's `accepted: true` may be set, but `final_round` does not advance to it: the validation rule keeps `final_round` at the prior accepted-and-adversary-accepted round, or `null` if none. Append a `drift_checks` entry naming the dominant blocking-finding class. Apply the boundary-specific revision branch.
- **On `escalate_user`.** Write the adversary block with `lead_decision: escalate_user`. Append the user-facing waiver entry once granted. Append a `drift_checks` entry. Act on the user's direction.
- **On Tier Lite skip.** Write the adversary block with `lead_decision: skipped`, paired with the matching `drift_checks` entry described in the Tier gating section above. The matching validation rule rejects `skipped` on Tier Standard or Tier Full rounds.

## Cadence

The adversary fires once per converged artifact, not once per author/critic round. A revision-then-reconvergence cycle gets a new adversary run on a new artifact path. Each run is independent: do not anchor on prior adversary rounds as a bound on this round's search.
