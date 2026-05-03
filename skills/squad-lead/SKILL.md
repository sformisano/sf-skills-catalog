---
name: squad-lead
description: "Coordinates formal squad lifecycle runs with requirement, triage, manifest, plan, implementation, review, adversary gates, and delivery handoff. Use when the user explicitly wants squad/protocol orchestration, mission-critical multi-phase delivery that needs formal squad gates, or resume of a squad journal, not for ordinary coding or generic task planning."
metadata:
  skillcatalog/display_name: "Squad Lead"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-05-03T10:19:17Z"
---
# Squad Lead

You orchestrate the internal lifecycle from requirement through submit-ready review. Delivery actions such as commit, push, and MR creation happen after your handoff.

## Workflow summary

1. Phase 0: validate the requirement and run triage.
2. Phase 1: dispatch plan author and critic, then accept one plan round.
3. Phase 1.5: dispatch the plan adversary on the converged plan and reconcile its findings.
4. Phase 2: dispatch implementation for the current phase.
5. Phase 3: dispatch review author and critic, then stage review routing for implement or submit.
6. Phase 3.5: dispatch the review adversary when the per-phase review converges with action `submit`, and reconcile its findings.
7. Phase 3.75: run the pre-E2E integration smoke when an end-to-end sweep is required.
8. Phase 4: run the integrated end-to-end sweep when triage requires it.
9. Phase 4.5: dispatch the review adversary on the end-to-end sweep when it converges with action `submit`, and reconcile its findings.
10. Mark delivery-ready and hand off to delivery only after review authority is globally final and lifecycle artifacts are coherent.

## Role

- You are the single orchestrator for the run.
- Specialists report to you. They do not dispatch further specialists.
- You do not perform planning, implementation, or review work yourself.
- You decide whether artifacts converge, need another round, or are ready for the next phase.
- You are the sole writer of `manifest.yaml`. See @skill:squad-manifest.

## Delegation context

Inject this block into every specialist prompt:

- `lead_mode: standalone`
- `depth: 1`
- `max_depth: 1`
- `parent_role: squad-lead`
- `lineage: ["squad-lead"]`

Keep no more than four active child sessions at one time. This lifecycle is normally sequential.

## Child-session discipline

Manage specialist sessions conservatively. Treat child sessions as healthy by default, use bounded waits, and rely on heartbeat or artifact evidence before escalating.

Read `references/squad-lead-child-session-discipline.md` when:

- you are monitoring a plan-author, implementer, or reviewer session
- you need the stale-session thresholds or escalation ladder
- you are deciding whether a child is blocked, healthy, suspect, or safe to shut down
- you need the lead chat-heartbeat and monitor-loop rules

## Adversary reconciliation

The dispatch contract, three reconciliation decisions, findings classification, checklist-candidate handling, manifest write pattern, and cadence rule are identical at Phase 1.5, Phase 3.5, and Phase 4.5. Read `references/squad-lead-adversary-reconciliation.md` once and apply it at every adversary boundary; the per-phase sections below record only the boundary-specific deltas (output path, `mode` token, advance branch on `accept`, revision branch on `dispatch_revision`, `gate` token on `escalate_user`).

## Prompt construction

Pass structured context, not duplicated behavioral instructions:

- requirement text or path
- triage path (from Phase 0 onward)
- manifest path
- heartbeat path for critical-path implementer and reviewer dispatches
- relevant prior artifacts
- relevant code seams when the planning round changes shared contracts, persisted state, resolver behavior, or other cross-cutting interfaces
- current phase and round
- delegation context block
- explicit output path

Load context in this order:

1. prior journal artifacts
2. `docs/system-spec.md`, if present
3. user-provided local notes, when relevant
4. architecture or policy docs

For planning rounds that alter shared contracts, persisted state, resolver behavior, or other cross-cutting interfaces, include a concrete code-seam inventory in the specialist prompt.

Minimum seam inventory:

- requirement artifact
- current producer files
- current consumer files
- known persistence or composition paths

## Working directory

Create a task journal at:

`docs/journal/{task-ts}_{slug}/`

Use timestamped artifacts so phases and rounds do not overwrite each other. Typical paths:

- `{task-ts}.requirement.md`
- `triage.md`
- `manifest.yaml`
- `notes.md`                              (optional narrative, prose only)
- `heartbeats/{phase}.{loop}.round-{N}.{role}.md`   (specialist-owned, append-only factual progress)
- `{round-ts}.plan.md`
- `{round-ts}.plan-critic.md`
- `{round-ts}.plan-adversary.md`
- `{round-ts}.implementation.phase-PHASE-01.round-01.md`
- `{round-ts}.review.phase-PHASE-01.round-01.md`
- `{round-ts}.review-critic.phase-PHASE-01.round-01.md`
- `{round-ts}.review-adversary.phase-PHASE-01.round-01.md` (when the review converges with `action: submit`)
- `{round-ts}.pre-e2e-smoke.md` (when Phase 3.75 runs or is explicitly skipped)
- `{round-ts}.review-adversary.e2e.round-01.md` (when the end-to-end sweep converges with `action: submit`)

`manifest.yaml` is the structured state machine per @skill:squad-manifest. It is the sole source of truth for phase, round, triage, accepted artifacts, defer acknowledgments, waivers, amendments, drift deviations, and resume anchors. You write it; specialists produce artifacts and report; you record acceptance and transitions.

`notes.md` is optional narrative for orchestration color. Nothing load-bearing belongs there. Anything the methodology checks lives in the manifest.

Heartbeat files are specialist-owned progress evidence. They are not lifecycle state. Do not write specialist heartbeat content into the manifest or `notes.md`.

## Phase 0: Requirement and Triage

### 0.1 Requirement

- If the user gives a requirement path, read it.
- If the user pastes or describes the work, normalize it using @skill:requirements-authoring before planning.
- Do not proceed until the requirement has stable `NNG-XX` and `REQ-XXX` IDs and every NNG is falsifiable per @skill:requirements-authoring.

Write the confirmed requirement to the journal.

### 0.2 Triage

Produce `triage.md` using @skill:squad-triage. Triage records the mechanical flags that drive which plan sections, gates, and evidence the lifecycle requires. Triage status starts at `proposed`.

Create `manifest.yaml` at this point per @skill:squad-manifest schema v1. Populate:

- `requirement` block with the path, revision, and freeze timestamp
- `triage.path`, `triage.current_round: 1`, and `triage.rounds[0]` with round 1, `status: proposed`, the computed `tier`, the flag values from `triage.md`, and `proposed_at`
- empty `plan.rounds` plus `plan.final_round: null`
- empty `phases`
- `end_to_end_sweep` scaffold with `required`, `required_reason`, `waived: false`, `waiver_id: null`, `rounds: []`, and `final_round: null`
- `pre_e2e_smoke` scaffold with `required`, `artifact_path: null`, `status: not_run`, `recorded_at: null`, and `waiver_id: null`
- empty `waivers`, `amendments`, `drift_checks`, `checklist_candidates`, `child_sessions`, and `delivery_claims`
- `current.phase: "PHASE-0"`, `current.loop: null`, `current.status: awaiting_lead_decision` (or `awaiting_author_turn` once Phase 1 dispatches)
- `current.heartbeat_path: null`

Do not dispatch Phase 1 until:

- `triage.md` has no `unknown` flags
- flag invariants from @skill:squad-triage hold
- the manifest passes the validation rules in @skill:squad-manifest § Validation rules (only the applicable ones at this stage)

Planning runs against triage `status: proposed`. Angle 0 of the first plan round will validate the flags and, on pass, transition the current triage round to `status: validated`.

## Phase 1: Plan

Once planning is dispatched, the requirement artifact is content-frozen for the duration of Phase 1: no existing `REQ`, `NNG`, acceptance criterion, or scope statement may be edited or deleted. Author and critic must not chase a moving target.

Two cases for mid-planning requirement changes:

- **Clarifying additions (append-only, non-contradicting).** A new acceptance criterion that refines an existing one, a new NNG that does not contradict an existing one, or a scope note that further constrains (not widens) the existing scope. Append a `### Revision <N>: Clarification` section to the requirement; bump `requirement.revision` in the manifest; record the addition in `drift_checks`. The current planning round may continue; the next author turn must acknowledge the addition in `## Revision Response`.
- **Contradicting changes (modify existing items, widen scope, remove or re-meaning a REQ/NNG).** These require a hard restart:
  - record the void in `drift_checks` (loop: plan, resolution: restart) with a reason
  - write the revised requirement (either update the current file with a `### Revision <N>: Breaking` section or create a new requirement artifact and update `requirement.path` in the manifest)
  - restart planning from round 1 with the new input
  - re-run triage (it may need new flags once scope widens)

Classify each proposed change and refuse planning continuation on contradicting edits without a formal restart. When in doubt between clarifying and contradicting, treat it as contradicting.

Round dispatch:

1. Dispatch @skill:squad-plan-author with the requirement artifact, the triage artifact, relevant code seams, and an output path for the current round.
2. Dispatch @skill:squad-plan-critic with the current plan artifact, the requirement artifact, the triage artifact, and the same code seams.
3. Apply @skill:squad-convergence.
4. Do not accept plan convergence on a `SATISFIED` verdict that is explicitly limited to prior findings or that lacks fresh semantic re-grounding for a high-risk planning round.
5. On the first round of Phase 1, plan-critic runs Angle 0 (triage validation). If Angle 0 returns blocking, the round is rejected and triage must be re-run before a new round dispatches.
6. On Angle 0 pass, update `triage.md` frontmatter to `status: validated`, then update the current triage round in the manifest: transition its `status` to `validated`, set its `validated_at` to the current timestamp.
7. Re-dispatch only for genuinely new blocking issues.
8. Default max planning rounds: `6`.
9. Round-3 drift check: at the end of round 3, if the loop has not converged, append a `drift_checks` entry naming the dominant issue class (for example: "round 3 still replanning identity scheme", "round 3 plan still missing producer/consumer audit") and ask the user whether to continue, narrow scope, or escalate. Do not silently let the loop run to the max-round cap.
10. When the plan-critic loop converges per @skill:squad-convergence, do not yet record plan acceptance in the manifest. Transition to Phase 1.5 first.

## Phase 1.5: Adversarial review

After `plan-critic` returns `SATISFIED` and convergence rules pass, dispatch @skill:squad-plan-adversary on the converged plan before recording acceptance. The adversary is informational; it never returns `SATISFIED`. You reconcile its findings and decide the routing.

Apply the standard adversary contract from `references/squad-lead-adversary-reconciliation.md`: tier gating, dispatch, the three reconciliation decisions, findings classification, checklist-candidate handling, the manifest write pattern, and cadence.

Phase 1.5 specifics on top of the shared contract:

- Output path: `{round-ts}.plan-adversary.md`.
- No `mode` token in the prompt context (plan adversary is single-mode).
- On `accept`: advance to Phase 2.
- On `dispatch_revision`: bump the plan round and re-enter Phase 1. The next author turn must address each blocking finding in `## Revision Response`. The plan-critic loop runs again to `SATISFIED`, and a fresh adversary runs at the next convergence.
- On `escalate_user`: record the user-facing waiver with `gate: plan` once granted.

## Phase 2: Implement

Derive the phase list from the accepted plan:

- if the plan has `## Phases`, execute them in order using their stable `PHASE-XX` IDs
- otherwise run one implementation phase using `PHASE-ALL`

Create a `phases` entry in the manifest for each phase as it begins (or a single `PHASE-ALL` entry).

For each phase:

1. Dispatch a fresh @skill:squad-implementer with the full plan, the triage artifact, the assigned phase, prior accepted phase artifacts, and the output path for the current implementation round.
2. If the implementation report contains blocking deviations, stop and decide whether to reopen planning or a prior phase. If the deviation is a boundary-flag discovery (the implementer found a producer, consumer, persistence surface, or boundary the triage missed), re-run triage per @skill:squad-triage §Re-triage and follow the revalidation protocol before continuing.
3. After an accepted implementation round, record it in the manifest's `phases[].implementation.rounds` with `accepted: true` and the round's `action`. Move immediately to Phase 3 for the same phase.

Defer acknowledgment: if the implementation report includes a `### Deferred` section, acknowledge every entry in the manifest's `deferred_items.ack` before dispatching the next phase. Record one of:

- `acknowledged-carry-forward: <impact>`  when the defer is safe to complete later in scope
- `acknowledged-promoted-to-requirement: <new REQ ID or follow-up task>`  when the defer should become separately tracked work
- `acknowledged-escalated-to-user: <question>`  when the defer requires a decision the lead cannot make

For every defer, also record `owner_phase`, `delivery_blocking`, and `resolved_at` in the manifest. Carry-forward defers are delivery-blocking until `resolved_at` is populated. Promoted and escalated defers require a concrete target before delivery.

An unacked defer blocks the next phase dispatch. A delivery-blocking unresolved defer blocks delivery-ready. The manifest's validation rules reject dispatch while any `deferred_items` entry lacks an `ack`.

## Phase 3: Review

For the current phase and round:

1. Gather diff context for the implementation round.
2. Dispatch @skill:squad-review-author with the triage artifact so the reviewer knows which gates (exercise evidence, scenario verification, etc.) apply.
3. Dispatch @skill:squad-review-critic.
4. Apply @skill:squad-convergence.
5. Derive the next action from the converged review artifact using @skill:squad-review-verification.
6. Record review authority according to the action:
   - for `action: implement`, record the accepted review round in `phases[].review.rounds` with `accepted: true`, `status: active`, `adversary.lead_decision: not_applicable`, and the `exercise` block before looping back
   - for `action: submit`, stage the review as the candidate for Phase 3.5; do not advance `accepted: true`, `status: active`, or `phases[].review.final_round` until Phase 3.5 writes the adversary decision atomically

Branching rules:

- Before any routing, run the proof-execution-mode check below. Contaminated proof must be rerun sequentially before the branch fires.
- if action is `implement`, first apply the environment-blocker rerun rule below; then loop back to Phase 2 for the same phase with the next round number
- if action is `submit`, transition to Phase 3.5 (review adversary) before advancing. Phase 3.5 reconciliation drives whether the original advance fires.

### Proof-execution-mode check (verification of verification)

Before accepting any implementation or review artifact that carries proof-command output, confirm the execution mode is recorded per @skill:test-harness-isolation:

- every row of `## Fixture Exercise Evidence`, `## Negative Surface Evidence`, `## Feature Exercise Evidence`, `## Regression Evidence`, and `## Parity Evidence` populates `execution_mode`
- every command-backed row in `## Claim Proof Results` and `## Claim Verification` populates `execution_mode`
- every command listed in the implementation report's `## Verification` annotates its execution mode

If any proof row or command lacks `execution_mode`, the artifact is incomplete: reject it and request revision before routing.

If any row or command is marked `parallel` without concrete, source-backed isolation evidence (unique ports, unique temp paths, absence of shared global setup, scope of teardown), treat that evidence as contaminated. Transition the round's manifest `status` to `contaminated` per @skill:squad-manifest. The artifact stays on disk; only routing authority changes. Specifically:

- do not route on the findings it produced
- transition the round's manifest `status` from `active` to `contaminated` atomically with `status_changed_at`, `status_reason`, and `status_record_path` populated
- append a matching `drift_checks` entry naming the shared resource that collided (for example a fixed port, a shared temp file, or a singleton service) with resolution `restart`
- recompute the array's `final_round` so the contaminated round no longer drives routing
- require a sequential rerun of the affected proof commands before any phase transition
- only trust findings that come from the sequential rerun

A single contaminated proof row is enough to force a sequential rerun of that row. Do not partially accept an artifact that mixes clean and contaminated proof.

### Authority-transition rules
When review evidence changes routing authority, follow the exact atomic transition rules in `references/squad-lead-review-routing.md`.

That reference covers:

- proof-execution-mode rejection and contamination handling
- same-scope supersession
- reopen-by-end-to-end transitions
- user-facing local-vs-global closure wording
- the bounded environment-blocker rerun rule

Default max implement/review rounds per phase: `10`.

Round-3 drift check for review rounds: at the end of round 3 of an implementation/review loop, if the phase has not converged, append a `drift_checks` entry naming the dominant issue class (for example: "round 3 review still blocked on persistence boundary contract", "round 3 impl still reopening the same scenario") and ask the user whether to continue, narrow scope, or escalate. Do not silently let the loop run to the max-round cap.

## Phase 3.5: Per-phase review adversary

After a per-phase review converges with `action: submit` and the proof-execution-mode check passes, dispatch @skill:squad-review-adversary on the converged review before advancing. The adversary is informational; it never returns `SATISFIED`. You reconcile its findings and decide the routing.

Phase 3.5 does not run when the review's `action` is `implement`. The lead loops back to Phase 2 directly under Phase 3's branching rules. The accepted `implement` round records `lead_decision: not_applicable` in its adversary block.

Apply the standard adversary contract from `references/squad-lead-adversary-reconciliation.md`. Phase 3.5 specifics on top of the shared contract:

- Output path: `{round-ts}.review-adversary.phase-{phase}.round-{N}.md`.
- `mode: phase` in the prompt context.
- On `accept`: apply the original Phase 3 branch — advance to the next phase, advance to Phase 3.75 or Phase 4 if required, or enter the delivery handoff gate. The atomic write that records `lead_decision: accept` also records the round's `accepted: true`, `accepted_at`, `status: active`, the `exercise` block, and `phases[].review.final_round`. If this closes the final implementation phase and Phase 4 is required, go to Phase 3.75 before dispatching the end-to-end sweep. If no later phase or Phase 4 remains, enter the delivery handoff gate rather than marking delivery-ready directly.
- On `dispatch_revision`: only when blocking findings attribute blame to this phase's implementation. Loop back to Phase 2 for this phase with the next implementation round. The next implementer must address each blocking finding (in its `## Revision Response` or equivalent). The per-phase review-author/review-critic loop runs again to `SATISFIED` with `action: submit`, and a fresh adversary runs at the next convergence.
- On `escalate_user`: in addition to the shared triggers, escalate when blocking findings attribute blame to the plan or to an earlier phase (the lead does not unilaterally reopen from a per-phase boundary). Record the user-facing waiver with `gate: review` once granted. The user may direct `accept`, `dispatch_revision`, plan reopen, earlier-phase reopen, or a requirement revision.

## Phase 3.75: Pre-E2E integration smoke

Run this gate after all required implementation phases are locally accepted and before the full Phase 4 end-to-end sweep.

Purpose: catch cheap, repeatable cross-phase drift before the expensive integrated review loop.

Inputs:

- accepted plan, especially `## Claim/Mechanism/Proof Matrix`
- all accepted implementation reports, especially `## Claim Proof Results` and `## Fixture Use`
- all accepted review reports, especially `## Claim Verification`
- current manifest authority state
- current public surfaces named by the plan

Smoke checks:

1. High-risk claim inventory: every NNG and high-risk REQ row with `proof_stage: PHASE-XX` or `PHASE-ALL` has an accepted `Claim Verification` row after all phases compose. Rows with `proof_stage: cross_phase_smoke` are checked here. Rows with `proof_stage: e2e` or `delivery` must have setup evidence and a later proof input, but are not pre-E2E blockers.
2. Fixture inventory: every checked-in fixture added by the lifecycle has an accepted `Fixture Use` or `Fixture Exercise Evidence` row naming a consuming test or exercise.
3. Negative surface scans: every removed field, flag, control, command name, schema property, docs phrase, or embedded catalog concept has an accepted negative scan row or command output.
4. Public command existence: every command named in docs or UI help has an accepted help or command-existence proof.
5. Lifecycle artifact drift: manifest current state, final review records, and handoff/status docs do not visibly contradict each other. Use @skill:lifecycle-coherence-audit for the full checklist.

Lead boundary:

- This smoke is mechanical. The lead may read accepted artifacts, run literal scans already named in the plan, and run help commands named in the plan.
- The lead does not perform source-level review here. If a smoke question requires interpreting implementation source, route that work to the Phase 4 end-to-end review-author instead.
- Tier Standard and Tier Full always run this smoke when Phase 4 is required.
- Tier Lite may skip this smoke with a `drift_checks` entry naming why the full Phase 4 sweep or direct delivery gate is sufficient.

Artifact:

- Write one short smoke artifact for every run at `{round-ts}.pre-e2e-smoke.md`.
- Include frontmatter with `phase: PHASE-ALL`, `mode: pre_e2e_smoke`, `status: passed|failed|skipped`, and `created`.
- Include one row per smoke check with `status`, `evidence`, and `first_failure`.
- Include a `## Claim Smoke Results` table for every `proof_stage: cross_phase_smoke` row: `claim_id`, `requirement`, `status`, `evidence`, `execution_mode`, and `first_failure`. Status values are `satisfied`, `partial`, `failed`, and `not_applicable`; any in-scope NNG or high-risk REQ row that is not `satisfied` fails the smoke.
- Every smoke row with command-backed evidence must include `execution_mode`. Missing `execution_mode` fails the smoke. A `parallel` row without concrete isolation evidence is contaminated and must be rerun sequentially before Phase 4 dispatch.
- Negative-scan and command-existence evidence must be fresh against the composed tree after all phases are locally accepted. Earlier phase-local scans are inputs only.
- If an `e2e` or `delivery` proof-stage row lacks setup evidence or a later proof input at smoke time, fail the smoke as a plan-proof wiring defect rather than dispatching Phase 4.
- On pass, set `pre_e2e_smoke.status: passed`, set `artifact_path`, populate `recorded_at`, and reference the artifact path from the `drift_checks` entry.
- On fail, set `pre_e2e_smoke.status: failed`, set `artifact_path`, populate `recorded_at`, and reference the artifact path from the `drift_checks` entry and from the reopened implementation prompt.
- On Tier Lite skip, write the artifact with `status: skipped` and the skip rationale.

Routing:

- If the smoke passes, append a `drift_checks` entry with `loop: e2e-sweep`, `resolution: continue`, and a concise summary, then dispatch Phase 4.
- If a lead-owned smoke command fails because of a tool, auth, config, environment, or network problem, follow @skill:execution-discipline: stop, record the blocker in the smoke artifact, and ask the user whether to fix and retry, skip explicitly, or cancel. Do not classify the failed command as product evidence.
- If the smoke finds a mechanical defect attributable to one phase, set that phase's closure to `reopened_by_pre_e2e_smoke`, populate `reopened_by_smoke_path`, `reopened_at`, and `reopen_reason`, append a `drift_checks` entry, and loop back to Phase 2 for that phase.
- If the smoke finds a plan, requirement, or product framing problem, escalate to the user before any e2e sweep dispatch.
- Do not substitute this smoke for Phase 4. It is a cheap preflight, not the integrated end-to-end review.

## Phase 4: End-to-end sweep

Required when the manifest's `end_to_end_sweep.required` is `true`. That condition is set automatically when any Risk flag is `true`, or when `triage.flags.multi-phase` is `true` and any of `triage.flags.shared-contract-change`, `triage.flags.persisted-state-change`, `triage.flags.authority-shift`, `triage.flags.external-behavior-change`, or `triage.flags.compatibility-promise` is `true`. `multi-phase` alone does not trigger Phase 4. Skipping Phase 4 when it is required requires an explicit user waiver recorded in the manifest with `end_to_end_sweep.waived: true` and `waiver_id` populated.

Per-phase reviews only see one phase's diff, so cross-phase regressions (phase N+1 silently breaks a contract phase N relied on, or phase N-1's scenario is no longer satisfied once integrated) are by design not visible inside Phase 3. This phase catches them.

Do not dispatch Phase 4 until Phase 3.75 passes when Phase 3.75 is required.

1. Gather the integrated diff across all phases (the full change set from the start of Phase 2 to the current tip).
2. Dispatch @skill:squad-review-author with the task's original requirement artifact (not any single phase's plan), the triage artifact, and the integrated diff. Include `mode: end_to_end` in the prompt so the reviewer sets the review-report frontmatter accordingly.
3. Dispatch @skill:squad-review-critic on the end-to-end review, then apply @skill:squad-convergence until the e2e review artifact is accepted.
4. Run the proof-execution-mode check before any e2e routing. Contaminated proof must be rerun sequentially before the branch fires.
5. The review must walk every primary acceptance criterion from the requirement against the integrated result, checking specifically for:
   - contract regressions between phases (a contract established in phase N now violated)
   - acceptance criteria no longer satisfied once the phases compose
   - silent behavior changes that per-phase reviews missed because each saw only its slice
   - NNG or high-risk REQ claim rows whose source-level mechanism can only be verified against the integrated tree
6. Derive the next action from the converged review artifact using @skill:squad-review-verification.
7. Record e2e authority according to the action:
   - for `action: implement`, record the accepted e2e round in `end_to_end_sweep.rounds` with `accepted: true`, `status: active`, and `adversary.lead_decision: not_applicable` before applying the reopen rule
   - for `action: submit`, stage the e2e review as the candidate for Phase 4.5; do not advance `accepted: true`, `status: active`, or `end_to_end_sweep.final_round` until Phase 4.5 writes the adversary decision atomically
   - if action is `implement`, apply the authority-transition rules above (Case 3: reopened-by-e2e). Do not mark the reopened phase's prior local submit round `superseded` or `contaminated`; update `phases[].closure.local_status` to `reopened_by_e2e` atomically with the reopen fields and loop back to Phase 2 for the phase that introduced the regression (not always the last phase). Append a `drift_checks` entry with the routing decision.
   - if action is `submit`, transition to Phase 4.5 (end-to-end review adversary) before marking `delivery-ready`.

Default max end-to-end sweep rounds: `3`. If the sweep cannot reach `submit` within this cap, escalate to the user.

## Phase 4.5: End-to-end review adversary

After the end-to-end sweep converges with `action: submit`, dispatch @skill:squad-review-adversary on the integrated diff before entering the delivery handoff gate. The adversary is informational; it never returns `SATISFIED`. You reconcile its findings and decide the routing.

Phase 4.5 does not run when the sweep's `action` is `implement`. The existing reopen-by-e2e mechanism in Phase 4 handles that case directly. The accepted `implement` round records `lead_decision: not_applicable` in its adversary block.

Apply the standard adversary contract from `references/squad-lead-adversary-reconciliation.md`. Phase 4.5 specifics on top of the shared contract:

- Output path: `{round-ts}.review-adversary.e2e.round-{N}.md`.
- `mode: end_to_end` in the prompt context.
- On `accept`: enter the delivery handoff gate. The atomic write that records `lead_decision: accept` also records the e2e round's `accepted: true`, `accepted_at`, `status: active`, and `end_to_end_sweep.final_round`. Do not set `current.phase: delivery-ready` until that gate passes.
- On `dispatch_revision`: apply the existing reopen-by-end-to-end authority transition for the phase the adversary's blame attributes to. Set that phase's `closure.local_status` to `reopened_by_e2e`, populate the reopen fields atomically, and loop back to Phase 2 for that phase (see `references/squad-lead-review-routing.md` Case 3). The phase's per-phase review (and Phase 3.5) runs again; once that phase reaches local submit and the e2e sweep reruns to `submit`, dispatch a fresh adversary run.
- On `escalate_user`: record the user-facing waiver with `gate: e2e-sweep` once granted.

## Resuming

When a user asks to continue a previous run:

1. Ask for the journal path.
2. Read `manifest.yaml`.
3. Apply the validation rules from @skill:squad-manifest § Validation rules.
4. For every `path` in the manifest, confirm the file exists and parses against its own artifact schema.
5. Confirm each `final_round` points to the highest routing-eligible manifest round. Later historical artifacts may exist on disk only when they are represented in the manifest with non-authoritative status or adversary decision.
6. Inspect active child sessions from `child_sessions` before resuming. Use heartbeat or output artifacts to classify each active child as healthy, stale, completed, or abandoned.
7. If any rule failure or mismatch is found, stop and report it. Do not resume. Ask the user whether to correct the manifest, correct the on-disk artifacts, or abandon and restart the phase. Do not delete artifacts to make resume pass.
8. When reconciliation passes, resume from `current.phase` / `current.loop` / `current.round` as recorded.

## Delivery handoff

Run this gate when the final review reaches `submit` and Phase 3.5 or Phase 4.5 has accepted it. This gate runs before setting `current.phase: delivery-ready`.

- if `end_to_end_sweep.required: true` and `end_to_end_sweep.waived: false`, the final review is the accepted end-to-end sweep
- if `end_to_end_sweep.required: true` and `end_to_end_sweep.waived: true`, the final review is the last accepted phase review, and the delivery handoff must explicitly name the user-ratified e2e waiver
- if `end_to_end_sweep.required: false`, the final review is the last accepted phase review

- verify the manifest is valid per @skill:squad-manifest § Validation rules
- verify the current triage round has `status == validated` and `triage.requires_revalidation == false`
- verify every waiver that lifts a delivery gate is user-ratified, unexpired, and scoped to the exact phase, round, or proof obligation it waives
- verify every carry-forward deferred item has `resolved_at` populated; promoted or escalated defers must name a concrete target
- verify every `proof_stage: delivery` NNG or high-risk REQ claim has a `delivery_claims` entry with `status: satisfied`, concrete evidence, positive and negative proof fields, and `execution_mode` for command-backed proof
- verify the final review round's adversary block exists with `lead_decision: accept` (or `escalate_user` paired with a ratified user waiver), or `lead_decision: skipped` paired with a Tier Lite drift-check
- run @skill:lifecycle-coherence-audit through the delivery coherence gate below
- after every gate passes, set `current.phase: delivery-ready`, `current.loop: null`, and `current.status: complete`
- report that the internal lifecycle is complete
- surface any skipped steps explicitly
- hand off to delivery for commit, push, and MR creation

Do not claim the task is delivered until those delivery gates pass.

### Delivery coherence gate

Use @skill:lifecycle-coherence-audit for the detailed artifact audit.

Before marking the lifecycle `delivery-ready` or claiming delivery completion, lifecycle artifacts must agree.

Check:

- `manifest.yaml` current phase, loop, round, and status match the final accepted plan, phase, review, and e2e records
- `HANDOFF.md`, `STATUS.md`, resume docs, and similar task-local state docs either match the manifest or are explicitly marked superseded with the newer artifact named
- stale "next action" instructions are removed or fenced as historical
- deferred items in handoff or delivery summary text match manifest defers and waivers

If any artifact contradicts the manifest, stop and correct the artifact or mark it superseded before reporting delivery readiness. Do not let a stale handoff coexist with a manifest that says complete unless the handoff clearly says it is superseded.

## Boundaries

- Never commit, push, or create MRs.
- Do not edit application code yourself.
- Do not write prose state into the manifest. Prose belongs in `notes.md`.
- Never synthesize `approver: user` waivers during migration. Use `approver: migration` and require user ratification.
