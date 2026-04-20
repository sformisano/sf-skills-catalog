---
name: Completion Verification
description: Use before claiming work is complete, fixed, or ready for handoff. Requires fresh commands or artifacts that prove the exact claim being made.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-06T21:43:21Z"
---

# Completion Verification

Favor evidence over assumption. Before claiming success, run the command or inspect the artifact that proves it.

## When to use

Apply this skill before:

- saying a change is complete or fixed
- handing work to another phase or specialist
- creating commits, MRs, or delivery reports
- reporting delegated work as done

## Verification gate

Before any success claim:

1. Identify the exact proof for the claim.
2. Run or inspect that proof now, not from memory.
3. Read the output and status directly.
4. Confirm it supports the claim.
5. Only then report success.

If verification fails, report the failure evidence instead of the intended success claim.

## Claim-to-evidence examples

- tests pass -> test command exits cleanly with zero failures
- build succeeds -> build command exits zero
- lint is clean -> linter reports zero blocking issues
- bug is fixed -> reproducer failed before and now passes
- task is complete -> requirement coverage and verification evidence both hold

## Scenario mapping

When the plan includes scenarios:

1. list each `SCN-REQ-<id>-<index>`
2. attach concrete evidence for each one
3. use one of these statuses:
   - `covered`
   - `partial`
   - `missing`
   - `deferred (<rationale>)`

If any high-risk scenario is missing without approved rationale, do not claim completion.

## Delegation rule

If another agent reports success:

1. inspect the resulting diff or artifact
2. run local verification yourself
3. report the verified outcome, not the claimed outcome

## Red flags

Stop and verify if you are about to write:

- "should work"
- "probably fixed"
- "looks good"
- "done"

## Integration

- Pair with @skill:systematic-debugging after fixes.
- Pair with @skill:risk-based-testing for test scope decisions.
- Enforce through @skill:execution-discipline.
