---
name: scenario-authoring
description: "Use when a plan needs behavior scenarios tied to REQ IDs, or when implementation and review artifacts must map scenario coverage deterministically."
metadata:
  skillcatalog/display_name: "Scenario Authoring"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Scenario Authoring

Use scenarios to make behavior traceability explicit without turning the plan into implementation prose.

## Purpose and boundary

- Scenarios complement normal verification sections. They do not replace them.
- Scenarios should describe observable behavior, not code changes.
- Scenario IDs must remain stable across plan, implementation, and review rounds.

## Section contract

When scenarios are needed, use this shape:

```markdown
## Scenarios

### REQ-006: Risk-scaled verification behavior

#### SCN-REQ-006-01 | Risk-flagged behavior requires executable proof
- GIVEN the triage sets at least one Risk flag AND the changed behavior is high risk
- WHEN implementation claims completion
- THEN the implementation maps this scenario to executable evidence
- AND review marks the scenario unsatisfied when that evidence is missing
- ALSO-VERIFIES: REQ-019
```

## Format rules

- `###` headings bind the scenario group to one primary REQ ID.
- `####` headings use `SCN-REQ-<requirement-id>-<index>`.
- Scenario lines start with `GIVEN`, `WHEN`, `THEN`, and optional `AND` or `BUT`.
- If one scenario supports multiple requirements, keep one primary REQ in the ID and list the others with `ALSO-VERIFIES`.

## When to add scenarios

Scenario expectations follow triage flags (@skill:squad-triage), not a complexity-label freehand.

- Lite triage (zero flags): scenarios are optional.
- `bug-fix-regression: true`: a regression scenario is required.
- `external-behavior-change: true`: scenarios for each primary acceptance criterion are recommended; required when combined with any risk flag (`security-scope`, `safety-scope`, `compliance-scope`, `performance-scope`).
- `compatibility-promise: true`: a compatibility-path scenario is required.
- `performance-scope: true`: a performance-characterization scenario is required.
- Any Risk flag (`security-scope`, `safety-scope`, `compliance-scope`): scenarios for the risk-class behavior are required.
- Absent a matching flag: do not block on missing scenarios. Base the decision on observable risk.

## Downstream mapping contract

Once a plan includes `## Scenarios`, the downstream artifacts must carry explicit mappings.

Implementation mapping:

- Heading: `## Scenario Coverage`
- Columns: `scenario_id | requirement_id | verification_method | evidence | status`
- Status values: `covered`, `partial`, `missing`, `deferred (<rationale>)`

Review mapping:

- Heading: `## Scenario Verification`
- Columns: `scenario_id | status | evidence | notes`
- Status values: `satisfied`, `partial`, `unsatisfied`, `not_applicable (<reason>)`

## Severity guidance

- Missing or unsatisfied high-risk scenarios should usually become Major or Critical findings.
- Low-risk gaps may be Minor when the rationale and impact are explicit.
- Scenario status supports review findings. It does not replace them.

## Anti-patterns

- Scenario text that describes internal implementation steps
- Scenario IDs that change without a behavior change
- Plans that include scenarios but omit downstream coverage tables
- Scenario-only plans that weaken or replace the normal verification section

## Author checklist

- Every scenario group points to an existing REQ ID.
- IDs are stable and deterministic.
- Wording stays observable and testable.
- High-risk behavior has scenario coverage when the triage flags justify it (see above).
