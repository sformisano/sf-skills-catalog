# Squad Plan Critic Angles

Use this reference after the main plan-critic workflow reaches the audit and angle sweep stages.

## Mandatory audit passes

Run all applicable passes before returning `SATISFIED`. For plans with any of `shared-contract-change`, `persisted-state-change`, `authority-shift`, or any Risk flag set to `true`, every pass below is mandatory.

1. Shared-contract audit:
   - enumerate every producer and consumer of each changed file format, persisted schema, CLI, IPC, API contract, or cross-boundary data contract
2. Persistence and authority audit:
   - state where the source of truth lives after the change
   - block plans that create two writable authorities for the same state without explicit reconciliation
3. Data-structure semantics audit:
   - confirm chosen data structures preserve the ordering, uniqueness, lookup, and determinism semantics the plan claims
4. Phase-integrity audit:
   - confirm each phase leaves the tree buildable and the touched contract surfaces coherent enough for the next phase
5. Contradiction sweep:
   - search the artifact for claims that cannot simultaneously be true
6. Evidence pass:
   - cite the requirement sections and code seams used for the audit

## Angle sweep

Apply every angle every round. If the angle's triggering surface changed, gather fresh evidence. If the triggering surface did not change, concise revalidation is enough.

### Angle 0: Triage correctness

Check that `triage.md` matches the requirement and the current plan text. Produce the `## Triage Validation` flag table. If triage is wrong, return `CRITIC_VERDICT: NEEDS_REVISION - Triage correction required`.

### Angle 1: Structural completeness

Re-run the structural checks from the main skill against the current artifact and the current triage-conditioned obligations.

### Angle 2: Scope, feasibility, and phase adequacy

Check requirement alignment, scope discipline, feasibility, and phase integrity.

### Angle 3: Verification depth, risk coverage, and scenario quality

Check verification depth, verification-input quality, risk coverage, and scenario quality.

### Angle 4: Semantic coherence across boundaries

Check producer and consumer completeness, persistence and authority model, data-structure semantics, same-page contradictions, cross-context concept tracing, and glossary completeness.

### Angle 5: NNG claim verification against Design

For each NNG in the Requirement Ledger, confirm that Design states the concrete mechanism that satisfies it and that the NNG remains falsifiable.

### Angle 6: End-state walkthrough simulation

Re-walk one primary acceptance criterion from input to observable outcome, using the plan's own Concept Glossary. Flag undefined boundaries, undefined concepts, and weak scenario discriminators.
