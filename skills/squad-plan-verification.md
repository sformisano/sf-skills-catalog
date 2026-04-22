---
name: Squad Plan Verification
description: "Defines the required shape of a squad implementation plan, including frontmatter, sections, walkthroughs, and verification inputs. Use when writing, checking, or revising a plan artifact or plan format before implementation."
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-18T15:02:16Z"
---

# Plan Verification

This skill defines what a complete plan artifact looks like. The goal is deterministic execution, not plan prose.

## Build order

1. Fill frontmatter and the required sections.
2. Apply triage to decide which conditional sections are mandatory.
3. Add verification inputs that downstream implementation and review can run without rediscovery.
4. Add any optional sections only when they improve execution quality.
5. Run the quality checks before handing the plan to critique or implementation.

## Frontmatter

```yaml
---
name: <short plan name>
overview: <one-line summary>
ticket: <ticket ID or "none">   # use `task` when no ticket exists
created: <YYYY-MM-DDTHHMMSS>
---
```

Required:

- `name`
- `created`
- either `ticket` or `task`

The plan's tier and obligation set are derived from `triage.md` per @skill:squad-triage, not declared in plan frontmatter. The manifest (@skill:squad-manifest) carries the computed tier label.

## Required sections

### Context

Why this work exists and which requirement artifact it implements.

### Goals

Concrete outcomes the implementation must achieve.

### Scope

Use two subsections:

- `#### In Scope`
- `#### Out of Scope`

### Requirement Ledger

Include every source `NNG-XX` and `REQ-XXX` exactly once.

| id | type | summary | priority | phase | boundary | verification |
| --- | --- | --- | --- | --- | --- | --- |
| NNG-01 | nng | CLI contract remains stable | non_negotiable | PHASE-01 | no breaking CLI change | compatibility test |
| REQ-001 | req | Journals move to `docs/journal/` | high | PHASE-01 | no legacy writes | path audit |

Rules:

- `type` is `nng` or `req`
- `priority` is `non_negotiable`, `high`, `medium`, or `low`
- `phase` is a stable phase ID such as `PHASE-01`, or `PHASE-ALL` when the plan is unphased

### Design

Explain the technical approach, major decisions, and dependency roots.

### Concept Glossary

**Triage trigger:** required when `shared-contract-change` or `multi-boundary` is `true` in `triage.md` per @skill:squad-triage. If the plan itself reveals cross-context term drift that triage failed to flag, that is a triage defect and the critic bounces the round to re-triage. When no trigger flag fires, the section may be omitted; if included, it carries `- Not required by triage.`.

List every load-bearing concept that the plan uses in more than one context, with one row per context.

"Context" means any boundary the plan itself names or distinguishes — module, service, process, machine, tier, repository, team, document, artifact, or any other partition the plan depends on. Use the boundary vocabulary the plan already uses in Design; do not invent a layer model.

The glossary is required whenever the plan uses the same word to label two things that the plan itself treats as distinct. If you write "order" in one context and "order" in another, the glossary must say what each means. The trigger is the plan's own vocabulary, not a fixed list of layers.

| concept | context | definition | source-of-truth mechanism |
| --- | --- | --- | --- |
| session token | authentication service | opaque short-lived bearer issued on login | `Session::token` field |
| session token | billing service | long-lived key used to sign invoices | `Invoice::session_hmac` field |

(The example shows a name collision: one word, two meanings, two different systems. The glossary surfaces it instead of letting readers assume the same thing.)

Rules:

- A concept used in only one context does not need an entry.
- A concept used in two or more contexts with only one row is incomplete. Fill in every context it appears in.
- If two rows describe the same concept with materially different definitions, the Design section must explicitly say whether this is intended (renaming, context-local meaning, distinct mechanism under a shared label) or is a bug.
- Use `- None.` only when the plan truly uses no cross-context load-bearing concepts. If Design names more than one boundary and the glossary is `- None.`, the author must justify the claim in the compact form: `- None. The plan crosses <boundaries>, but no load-bearing concept changes meaning or source of truth across them.` The critic rechecks that claim.

This section is the vocabulary the `### End-State Walkthrough` and the critic's angle 4 and angle 6 rely on.

### End-State Walkthrough

**Triage trigger:** required when `external-behavior-change: true` in `triage.md` per @skill:squad-triage. When `compatibility-promise: true`, a second walkthrough covering the compatibility path is also required. When no trigger flag fires, the section may be omitted; if included, it carries `- Not required by triage.`.

Walk one primary acceptance criterion from input to observable outcome using the plan as the only source of truth. Pick the highest-risk criterion when the primary one is trivial.

The walkthrough must name:

- the triggering input (caller invocation, user action, incoming event, message, scheduled tick, anything that starts the flow)
- each boundary the data crosses, in order, using the plan's own context vocabulary from the `## Concept Glossary`
- each load-bearing concept as it appears at each boundary, using the `## Concept Glossary` labels exactly
- the observable outcome as seen by the external party (caller, user, downstream consumer, persisted artifact)

Format (pick the archetype closest to the change; adapt freely):

- CLI or one-shot
- service or event flow
- library or API call
- UI flow

See `skills/references/squad-plan-walkthrough-archetypes.md` for the archetype templates.

You only need one walkthrough. Pick the archetype that matches the acceptance criterion you picked. If the change spans multiple archetypes, pick the one carrying the most risk or extend the walkthrough to cover the cross-boundary hop.

Rules:

- If a load-bearing concept changes meaning between two boundaries, the `## Concept Glossary` must make the per-context definitions explicit. Otherwise the walkthrough is wrong or the glossary is incomplete.
- If a step cannot be completed using only text from this plan, the plan is missing a mechanism; add it in Design before finalizing.
- If the walkthrough references a boundary or concept not defined in Design or the glossary, the plan is missing a definition.

This section is the implementer's input for the pre-flight reality check in @skill:squad-implementer and the critic's angle 6 target in @skill:squad-plan-critic.

### Implementation Steps

Ordered execution steps. If the plan uses phases, this section becomes a concise index into the phase sections rather than duplicating every detail.

### Verification

One line per in-scope ledger item stating how it will be verified.

### Verification Inputs

Concrete execution inputs for downstream implementation and review. This section exists to remove rediscovery: later agents should be able to run the proof path directly instead of re-finding commands, fixtures, and expected signals.

| proof obligation | command or action | fixture or setup | expected signal | evidence location |
| --- | --- | --- | --- | --- |
| feature exercise | run the documented command or user flow | named fixture, seed data, or environment knob | the externally observable result named in the plan | implementation or review artifact section that will carry the fresh evidence |

Rules:

- include one row for every non-trivial proof path the plan expects downstream agents to run
- rows may name commands, manual actions, harness paths, fixture files, seeded data, endpoints, or environment toggles
- rows record inventory-class facts only; they are execution inputs, not proof results
- when `compatibility-promise: true`, include the compatibility-path row explicitly
- when `bug-fix-regression: true`, include the regression reproducer or targeted test entry explicitly
- when `behavior-preserving-refactor: true`, include the parity method entry explicitly

### Testing Strategy

Risk-appropriate tests and manual checks.

### Risks and Mitigations

Likely failure modes, detection signals, and rollback or containment options.

### Open Questions

Use `- None.` when empty.

### Unresolved Disagreements

Use `- None.` when empty. Each real entry must include the disagreement, the working assumption, and the follow-up validation.

### Deviations

Use `- None.` when empty. Record missing context, blocked reads, or tool workarounds here.

## Conditionally required sections

These sections are required when their trigger applies. They are not optional in those cases.

### Current Behavior

Required when the plan changes an existing file format, persisted schema, CLI, IPC, API contract, resolver behavior, or cross-boundary data contract.

Describe:

- the current source of truth
- the current producers
- the current consumers
- the current ordering or persistence semantics that matter

### Shared Contract Producer/Consumer Audit

Required when the plan changes any shared contract.

| contract | producers | consumers | planned updates | verification |
| --- | --- | --- | --- | --- |

Rules:

- include every real producer and consumer the plan depends on
- missing a real producer or consumer is a blocking plan defect

### Persistence and Authority Model

Required when the plan changes persisted state, runtime composition, or cross-file authority.

Describe:

- what is persisted
- what is derived or composed at runtime
- where the authoritative copy lives after the change
- whether any duplicated state exists and how it stays coherent

### Data-Structure and Ordering Invariants

Required when the plan's observable behavior depends on ordering, uniqueness, determinism, or key semantics.

Describe:

- the chosen type
- the required observable semantics
- why the chosen type preserves them

### Phase Integrity

Required for phased plans.

For each phase, state:

- which producers and consumers are migrated in that phase
- why the tree remains buildable and usable after that phase
- what temporary fences or assumptions exist

## Optional sections

Use these only when they improve execution quality:

- `## Phases`
- `## Scenarios`
- `## Dependencies`
- `## Approaches Considered`
- `## Evidence`
- `## Resource Costs`
- `## State Machine Impact`

## Phases contract

Use phases when the work spans multiple subsystems, has clear dependency boundaries, or would overload one implementer context window.

Each phase must use a stable heading:

```markdown
### PHASE-01: <title>

- Scope: <what this phase delivers>
- Depends on: <prior phase IDs or none>
- Verification: <how the lead knows this phase is complete>
```

Then list the phase-specific implementation steps under that heading.

## Scenario contract

If the plan includes scenarios, they must follow @skill:scenario-authoring. Once scenarios are present, downstream implementation and review artifacts must include the required mapping tables.

## Quality checks

Before a plan is accepted, the plan critic verifies:

**Unconditional checks:**

- all source `NNG-XX` and `REQ-XXX` IDs appear in the ledger
- `Scope` includes both `In Scope` and `Out of Scope`
- every ledger row has a verification method
- `## Verification Inputs` exists and gives concrete execution inputs for every non-trivial proof path in the plan
- every phased plan uses stable `PHASE-XX` IDs
- `Deviations` exists
- every NNG in the ledger traces to a concrete mechanism in Design that shows how it is satisfied; a ledger entry alone is not sufficient
- every NNG is falsifiable per @skill:requirements-authoring — the NNG body names the observable signal that proves violation (Design may not be used to rescue a non-falsifiable NNG; if the NNG body lacks a signal, bounce to requirement normalization)

**Triage-conditional checks** (see @skill:squad-triage for the full derivation table):

- `## Concept Glossary` is required when `shared-contract-change` or `multi-boundary` is `true`; it either covers every load-bearing concept per context, or uses the compact justified `- None.` form when the plan crosses boundaries but no term drift exists
- `## End-State Walkthrough` is required and traces one primary acceptance criterion end-to-end using only this plan when `external-behavior-change` is `true`; a second walkthrough covering the compatibility path is also required when `compatibility-promise` is `true`
- `## Current Behavior` and `## Shared Contract Producer/Consumer Audit` are required when `shared-contract-change` is `true`
- `## Persistence and Authority Model` is required when `persisted-state-change` or `authority-shift` is `true`
- `## Data-Structure and Ordering Invariants` is required when `persisted-state-change` or `safety-scope` is `true`
- `## Phase Integrity` is required when `multi-phase` is `true`
- Performance-characterization scenario and verification are required when `performance-scope` is `true`
- Regression scenario + regression test are required when `bug-fix-regression` is `true`
- Parity evidence commitment is required when `behavior-preserving-refactor` is `true`, using the method named in the triage's `## Parity method`

**Lite baseline** (required when zero flags fire):

- Changed-surface inventory (concrete files, modules, or components)
- Explicit external-behavior yes/no statement
- Regression proof commitment if the triage sets `bug-fix-regression: true`
- Focused verification method
- Verification Inputs seed row with concrete command or action, fixture or setup, expected signal, and evidence location
- One-sentence skip justification for omitted heavy sections

**Renaming discipline:** load-bearing concepts that cross any boundary the plan names (identity schemes, naming, persistence formats, error contracts) appear in the `## Concept Glossary` per context when required, and renamed concepts are distinguished from removed concepts both in the glossary and in Design.

## Output location

Plans live in the active task journal, typically `docs/journal/{task-ts}_{slug}/{artifact-ts}.plan.md`.
