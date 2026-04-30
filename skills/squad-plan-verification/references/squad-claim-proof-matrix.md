# Squad Claim Proof Matrix

Use this reference whenever a squad plan, implementation report, or review artifact needs to prove load-bearing claims instead of relying on broad suite success.

The goal is to catch repeatable proof gaps early. A passing broad suite is supporting evidence. It is not sufficient proof for NNG or high-risk REQ claims such as concurrency, cancellation, atomicity, schema removal, public wording removal, or fixture-backed behavior.

The matrix turns a claim into an inspectable contract:

| claim_id | requirement | shipped claim | mechanism in code | producer surfaces | consumer surfaces | proof | negative proof | proof_stage |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CLAIM-001 | REQ-001 | The generated schema no longer exposes `cache_key`. | `ScoringEnvelope` omits the field and schema generation reads that type. | schema generator, Rust type | generated JSON schema, UI consumers | regenerate schema and inspect generated artifact | literal search for `cache_key` in generated schema | PHASE-03 |

## When required

Use the matrix for every Standard or Full tier plan. Lite plans may omit it only when all claims are trivial and directly covered by the unconditional verification inputs.

At minimum, add rows for:

- every NNG
- every high-risk REQ
- every external behavior, compatibility, persistence, authority, shared-contract, security, safety, compliance, or regression claim
- every claim that asserts an operator-visible behavior change, runtime safety property, removed or renamed surface, fixture-backed behavior, generated artifact, persistence change, authority change, migration, or shared contract

High-risk REQ means:

- the plan ledger marks the REQ `priority` as `high` or `non_negotiable`
- the REQ is covered by any true Risk flag in `triage.md`
- the REQ carries an external behavior, compatibility, persistence, authority, shared-contract, security, safety, compliance, or regression claim
- the REQ includes a trigger principle above, even if the ledger priority is lower

Examples of trigger terms include `parallel`, `concurrent`, `atomic`, `cancel`, `timeout`, `lock`, `cache`, `removed`, `deprecated`, `schema`, `CLI`, `IPC`, `API`, `embedded`, `generated`, and `fixture`. The list is not exhaustive; use the principles above as the source of truth.

## Field rules

- `claim_id` is stable within the artifact, for example `CLAIM-001`.
- `requirement` names the exact `NNG-XX` or `REQ-XXX`.
- `shipped claim` is the user-visible or operator-visible assertion that must be true after implementation.
- `mechanism in code` names the concrete implementation mechanism, not an intention.
- `producer surfaces` names every source that creates or writes the contract.
- `consumer surfaces` names every source that reads, renders, validates, or depends on the contract.
- `proof` names the direct positive proof or points to the relevant fixture inventory row. A broad suite can be supporting evidence, but not the only proof for an NNG or high-risk REQ claim.
- `negative proof` names the scan, check, or surface inventory row that proves a removed field, command, UI control, wording, or behavior is absent from the relevant surfaces. Use `none` only when the claim has no negative component.
- `proof_stage` names the earliest lifecycle stage that can prove the claim.

Allowed `proof_stage` values:

- `PHASE-XX` or `PHASE-ALL`: the named phase implementation and review must prove the claim before local submit.
- `cross_phase_smoke`: Phase 3.75 proves the claim mechanically after phases compose. Use only for inventory, fixture-consumption, negative-scan, command-existence, or lifecycle-artifact checks that do not require source-level review.
- `e2e`: Phase 4 end-to-end review proves the integrated behavior or source-level mechanism after all phases compose.
- `delivery`: the delivery gate proves the claim, usually final changelog, handoff, resume, or external delivery coherence.

Rules:

- If a claim can be proven inside one implementation phase, use that phase's `PHASE-XX` value, or `PHASE-ALL` for an unphased plan.
- If a claim is integrated-only, use `e2e` and make the earlier phases provide setup evidence without claiming final proof.
- If a claim is delivery-only, use `delivery` and do not let phase implementation reports claim it as proven.
- A later `proof_stage` is an accepted proof deferral only when the plan names the later proof input and the phase integrity section explains why earlier phases can still close locally.

## Special claim types

Concurrency and ordering claims require source-backed runtime proof. For example, a parallel fan-out claim must identify the call path that constructs concurrent work and the command, test, or trace that proves it is not serial.

Cancellation and timeout claims require proof of propagation semantics. Name the token, abort handle, request timeout, or lock acquisition path, and prove where cancellation reaches the work being cancelled.

Atomicity and filesystem claims require target-platform semantics. Name the API, temporary path, rename behavior, lock behavior, or fsync boundary that makes the claim true.

Removed-surface claims require negative scans. If the plan says a field, option, picker, command, help text, schema property, or docs wording is gone, the proof must search the public and generated surfaces where it could still appear.

Fixture-backed claims require fixture consumption proof. A fixture path alone is inventory, not evidence. The proof must name the test or exercise that reads the fixture and the assertion that would fail if the fixture were wrong.

Public wording claims require surface inventory. Include UI copy, CLI help, docs, embedded catalogs, generated schemas, and system specs when those surfaces exist in the codebase.

Public surface alignment claims require both positive and negative checks when the change removes or renames an operator-visible concept. Name every relevant surface up front: UI strings, CLI help, docs, embedded catalog skills, generated schema, system spec, examples, and tests.

Generated-artifact claims require checking the generator and the generated output when both exist. A source type change does not prove the checked-in generated schema changed.

Command-existence claims require a real command or help proof. If docs tell users to run a command, the matrix must include a proof that the command exists or a negative scan that the stale command name is gone.

Runtime-state claims require the producer, consumer, and status surfaces. If a claim depends on a lock, status endpoint, cache, registry, or cancellation map, the proof must show the same state object is used by the execution path and the observing path.

## Artifact responsibilities

Plan artifacts define the matrix. The plan author must not leave NNG or high-risk REQ rows with vague mechanisms or proof such as `run tests`. Each row must name the correct `proof_stage`; do not assign a row to a phase if the claim can only be proven after later phases compose.

Implementation reports produce `Claim Proof Results` and, when relevant, `Fixture Use` from the plan's matrix. Runtime mechanism checks and negative scans are recorded as evidence types inside `Claim Proof Results`, not as separate claim-id tables. If a `PHASE-XX` or `PHASE-ALL` row owned by the current phase cannot be proven, the report records a blocking deviation and does not hand off as ready for review. Rows owned by `cross_phase_smoke`, `e2e`, or `delivery` are not phase-proof failures; the implementation report may record setup evidence, but final proof belongs to the named later stage.

Review artifacts produce `Claim Verification` from the same rows for their lifecycle stage. Phase reviews verify rows whose `proof_stage` is the current `PHASE-XX` or `PHASE-ALL`. End-to-end reviews verify `e2e` rows and any integrated interaction that earlier phase-local reviews could not see. Phase 3.75 smoke proves `cross_phase_smoke` rows in its smoke artifact. Delivery proves `delivery` rows through the delivery coherence gate. Status values are `satisfied`, `partial`, `failed`, and `not_applicable`. Any in-scope `partial`, `failed`, or `not_applicable` row for an NNG or high-risk REQ forces `action: implement`. Each load-bearing review row must include an evidence anchor: file and line, command output summary, or artifact path. Command-backed proof rows must include `execution_mode`.

Critics audit the matrix for completeness and proof quality. Adversaries may still find off-matrix risks, but repeatable mechanical misses should be promoted back into this reference or the critic checklists.

## Mechanical misses to promote upstream

When any lifecycle role finds one of these, treat it as a checklist candidate rather than a one-off:

- a fixture exists but no executed or inspected test consumes it
- a test name implies coverage that the assertions do not prove
- a public surface still contains a removed concept or nonexistent command
- generated schema, generated docs, or generated help text was not regenerated or literal-scanned
- a runtime concurrency claim is not backed by actual fan-out semantics before awaits
- an IPC, CLI, or API error shape was added but not exercised for each variant
- a handoff or status document contradicts the manifest or final changelog
