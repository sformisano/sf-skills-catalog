---
name: systematic-debugging
description: "Use when debugging test failures, production bugs, build issues, or unexpected behavior. Requires root-cause investigation before proposing fixes."
metadata:
  skillcatalog/display_name: "Systematic Debugging"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Systematic Debugging

## Overview

Fast guessing causes rework. Systematic debugging finds the real cause, tests a focused fix, and verifies the outcome.

Core principle: do not propose fixes before root-cause investigation.

## When to Use

Apply this skill for:

- failing tests
- production incidents
- integration regressions
- build and runtime failures
- flaky async behavior

## Four Phases

### 1) Root-Cause Investigation

- Read the full error output and stack traces.
- Reproduce the issue with clear steps.
- Check recent changes and nearby code.
- Trace data flow from symptom back to source.

Reference: see Root Cause Tracing section below.

### 2) Pattern Analysis

- Find similar code paths that work.
- Compare broken and working behavior side by side.
- List concrete differences before changing code.

### 3) Hypothesis and Minimal Test

- Write one specific hypothesis.
- Make the smallest change that tests it.
- Change one variable at a time.
- If the hypothesis fails, return to Phase 1.

### 4) Fix and Verify

- Reproduce with a failing regression test where practical.
- Implement the root-cause fix, not a symptom patch.
- Verify tests, build, and behavior after the fix.
- Use @skill:completion-verification before reporting done.

## Architecture Escalation Rule

If multiple targeted fixes fail in sequence, step back and question architecture assumptions instead of layering quick patches.

## Supporting Techniques

- Root Cause Tracing (below): trace backward to original trigger.
- Defense in Depth (below): add guards at multiple boundaries.
- Condition-Based Waiting (below): remove arbitrary sleep-based timing.

## Example

**Symptom:** `OrderMaterializer` test fails with "column retry_count does not exist."

**Hypothesis tree:**
1. Migration not run? → Check migration list; run pending.
2. Migration run but column missing? → Inspect DB schema.
3. Migration adds column but test DB is stale? → Recreate test DB.
4. Wrong migration order? → Verify migration timestamps.

**Narrowing:** Hypothesis 3 confirmed. Test setup used cached DB. Fix: add `migrate().await` to test setup before materializer runs.

## Red Flags

Return to Phase 1 when you see:

- "quick patch now, investigate later"
- multiple unrelated changes in one attempt
- retrying fixes without a new hypothesis
- replacing failing logic with larger timeouts

---

# Root Cause Tracing

Use this technique when an error appears deep in the stack and the source is unclear.

## Workflow

1. Start at the failing line and capture the immediate bad value/state.
2. Identify the caller that passed that value.
3. Repeat upward until you reach the first incorrect source.
4. Fix at the source, then verify downstream effects.

## Practical Notes

- Add temporary tracing at component boundaries if call flow is unclear.
- Log inputs, outputs, and key identifiers, not sensitive payloads.
- In tests, isolate the smallest reproducer before tracing full suites.

## Outcome

A symptom-level patch may hide the issue. Source-level fixes remove recurrence risk.

---

# Defense in Depth for Fixes

After root cause is found, strengthen boundaries so the same class of failure is less likely to recur.

## Layered Guard Pattern

1. Entry validation
   - Reject invalid input at API or handler boundaries.
2. Core logic validation
   - Assert invariants where business rules are applied.
3. Environment/runtime guard
   - Add context-specific safety checks for risky operations.
4. Observability hooks
   - Add logs/metrics that reveal recurrence early.

## Guidance

- Keep checks meaningful and close to the boundary they protect.
- Prefer explicit error paths over hidden fallbacks.
- Keep redaction and sensitive data rules intact in logs.

---

# Condition-Based Waiting

Replace fixed sleeps with waits tied to the actual condition under test.

## Why

Arbitrary delays create flaky tests and slow suites. Condition polling aligns timing with state changes.

## Pattern

- Bad: sleep for N ms, then assert.
- Better: wait until predicate is true or timeout expires.

## Use Cases

- waiting for async events to be observed
- waiting for background jobs to reach expected status
- waiting for eventually consistent read models to update

## Guardrails

- Always set a timeout with clear failure context.
- Poll at reasonable intervals to avoid busy loops.
- Use justified fixed delays only for intentional timing behavior tests.
