---
name: risk-based-testing
description: "Use when planning or implementing tests for any code change. Scales test rigor by change risk, with stronger expectations for bug fixes, stateful logic, schema changes, and compatibility-sensitive paths. Language-agnostic."
metadata:
  skillcatalog/display_name: "Risk Based Testing"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Risk-Based Testing

Test depth should match failure impact and regression likelihood.

## Risk levels

### High risk

Use test-first or add failing proof before the fix when changes touch:

- bug fixes that need regression protection
- stateful or invariant-heavy logic
- event, schema, migration, or persistence shape changes
- redaction, authorization, or sensitive data behavior
- retry, idempotency, or failure semantics that can cause silent breakage

### Medium risk

Typical examples:

- orchestration changes
- service contract changes with existing scaffolding
- substantial refactors with no intended behavior change

Expectation:

- add or update tests before completion
- cover negative paths and edge cases

### Low risk

Typical examples:

- non-behavioral cleanup
- naming or documentation changes
- narrow wiring with low blast radius

Expectation:

- run targeted verification
- prove no regression with focused evidence

## Mandatory rules

1. Every bug fix gets regression coverage.
2. Every high-risk change gets explicit failure-mode coverage.
3. No completion claim without fresh verification evidence.
4. If a change crosses multiple persistence, API, or service boundaries, include boundary checks for those paths.

## Scenario-driven coverage

When a plan includes `## Scenarios`:

- map each scenario to a verification method
- treat high-risk scenarios as executable evidence by default
- justify any inspection-only evidence for medium-risk scenarios
- record partial or missing coverage explicitly

## Test selection checklist

- What breaks if this fails in production?
- Is data integrity or compatibility at risk?
- Could the failure be silent?
- Which negative paths matter most?

If the answers imply high risk, increase coverage depth.

## Anti-patterns

1. Testing mocks instead of behavior
2. Shipping bug fixes with no regression proof
3. Partial contract mocks that hide real fields
4. Timeout-driven async tests
5. Happy-path-only coverage on high-risk changes

## Integration

- Pair with @skill:completion-verification before handoff.
- Pair with @skill:systematic-debugging for bug investigation and fix validation.
