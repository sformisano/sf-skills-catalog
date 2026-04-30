---
name: parallel-dispatch
description: "Use when a lead or orchestrator can split independent work into parallel child tasks without shared state, overlapping edits, or ordered dependencies."
metadata:
  skillcatalog/display_name: "Parallel Dispatch"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Parallel Dispatch

Parallel agent work helps only when scopes are truly independent.

## Boundary

- Parallel dispatch follows the delegation rules in @skill:squad-lead.
- Only the lead or equivalent orchestrator should dispatch parallel children.
- Specialist roles must not start parallel specialist work.

## Good candidates

- independent investigations in different subsystems
- read-only analysis tasks with disjoint scope
- unrelated failures that do not depend on the same fix

## Do not parallelize when

- tasks edit the same files
- tasks depend on each other's output
- the likely root cause sits in one shared pathway
- tasks run proof, exercise, or verification commands that touch any shared resource: a test harness, a bound port, a singleton service, a filesystem path, a database, or a shared temp or state file. Proof commands sharing a resource are not independent work. See @skill:test-harness-isolation for the preflight and isolation-proof requirements; if you cannot prove isolation, serialize them.

## Pre-dispatch checklist

1. Split work by independent problem domain.
2. Define explicit file or responsibility boundaries.
3. State prohibited side effects in each prompt.
4. Ask each child for a concise findings summary.
5. Keep concurrency small and deliberate, usually two to four children.

## Integration

After child work returns:

1. Review summaries and changed files.
2. Resolve overlaps before further edits.
3. Run unified verification on the integrated result.
4. Apply @skill:completion-verification before reporting done.

## Shared rules

- Respect concurrency safety from @skill:execution-discipline.
- Respect harness isolation from @skill:test-harness-isolation.
- External tool failures follow @skill:execution-discipline.
