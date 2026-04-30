---
name: requirements-authoring
description: "Use when writing or reviewing requirement documents for the squad lifecycle. Defines the structure, IDs, scope fences, and acceptance rules that downstream plans and reviews depend on."
metadata:
  skillcatalog/display_name: "Requirements Authoring"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Requirements Authoring

A requirement document is the source contract for the lifecycle. If the document is ambiguous, incomplete, or missing stable IDs, the planner and reviewer cannot behave deterministically.

## Core contract

- The document must be self-contained.
- The document must describe the problem and outcome, not the preferred implementation.
- The document must make it hard to build the wrong thing and still claim success.
- Stable IDs are mandatory because plans, implementations, reviews, and scenarios reference them directly.

## File naming

Use two cases:

1. Standalone drafts before orchestration:
   - `YYYY-MM-DDTHHMMSS_<slug>.md`
2. Orchestrated lifecycle journals:
   - `docs/journal/{task-ts}_{slug}/{artifact-ts}.requirement.md`

The slug should be short, lowercase, and hyphenated.

## Required structure

### Frontmatter

One-shot requirements:

```yaml
---
status: draft
---
```

Valid statuses: `draft`, `in_progress`, `done`, `abandoned`.

Recurring requirements:

```yaml
---
type: recurring
---
```

Recurring requirements are templates, not lifecycle instances.

### Title

One sentence naming the work. Do not use a ticket ID as the title.

### Problem

Describe the operator-visible issue with concrete evidence. Prefer observed behavior over internal code speculation.

### Goal

State the desired outcome in outsider-verifiable terms. The goal must describe what becomes true, not how to implement it.

### Scope

Use two required subsections:

#### In Scope

- Concrete categories of change this requirement expects.

#### Out of Scope

- Adjacent work that must not be folded into this task.

### Non-Negotiable Requirements

Use `### NNG-XX: <title>` entries. Example:

```markdown
## Non-Negotiable Requirements

### NNG-01: Existing CLI contract stays stable

The current command entry points and flags continue to work without migration.
```

Rules:

- One constraint per NNG.
- Each NNG must be falsifiable with an observable signal. The NNG body must name, or unambiguously imply, the signal that proves violation in production or in test. "Must remain stable," "must be reliable," "must not degrade," and "must not require users to migrate" are not falsifiable on their own.
- If the only way to tell an NNG is broken is by reading source code, rewrite it as a `REQ`, fold it into Acceptance Criteria, or delete it. NNGs are lifecycle gates, not aspirations.
- Do not renumber published NNG IDs.
- Use NNGs for invariants, compatibility promises, safety boundaries, and hard pass/fail conditions.

Falsifiability examples:

- Not falsifiable: `NNG-XX: System must remain stable under load.`
- Falsifiable: `NNG-XX: Error rate must stay below 1% over any 5-minute window at 100 concurrent users, measured by the ingress dashboard.`
- Not falsifiable: `NNG-XX: Existing CLI must remain backward compatible.`
- Falsifiable: `NNG-XX: Every CLI invocation that worked on the previous release must exit 0 with identical stdout on the new release, verified by the recorded-invocation compatibility suite.`

### Requirements

Use `### REQ-XXX: <title>` entries. Example:

```markdown
## Requirements

### REQ-001: Lifecycle journals use docs/journal

All orchestrated lifecycle artifacts are written under `docs/journal/`, not a legacy path.
```

Rules:

- Use zero-padded sequential IDs: `REQ-001`, `REQ-002`, and so on.
- Each requirement states one observable outcome or capability.
- Do not renumber published REQ IDs.
- Requirements should cover all in-scope behavior that the plan and review need to trace.

### Acceptance Criteria

Use numbered scenario-style statements:

1. When `<starting state>`, after `<action>`, then `<observable outcome>`.

Rules:

- Cover the primary success path.
- Cover at least one failure or edge path when behavior risk is non-trivial.
- Cover compatibility paths when backward compatibility matters.
- Every criterion must be able to fail.

## Scenario linkage

- Scenarios are optional in the requirement itself.
- When scenarios are added later, their IDs derive from REQ IDs: `SCN-REQ-<id>-<index>`.
- Do not create scenarios that contradict the requirement text.

## Scope discipline

Common failure mode: the agent solves an adjacent problem instead of the stated one.

Prevent that by:

- naming the exact change categories in `In Scope`
- naming tempting exclusions in `Out of Scope`
- writing at least one acceptance criterion that is impossible to satisfy without the core intended behavior

## Anti-patterns

- Describing the solution instead of the problem
- Missing `In Scope` or `Out of Scope`
- Vague NNGs such as "must be backward compatible" with no observable signal naming what breaks backward compatibility in practice
- NNGs that can only be checked by reading source code rather than by observing runtime or user-visible behavior
- Requirements without stable `REQ-XXX` IDs
- Acceptance criteria that could pass even if the core change never shipped
- File paths, function names, or module names used as the requirement itself

## Final checklist

Before finalizing:

1. A new reader can understand the problem and goal without chat history.
2. Every NNG and REQ has a stable ID.
3. `In Scope` and `Out of Scope` are both present.
4. Each NNG is falsifiable with an observable signal. For every NNG, state in one sentence the signal that would prove violation. If you cannot, rewrite or delete the NNG.
5. Acceptance criteria cover the real behavior, not just the document quality.
6. The document avoids file-level implementation prescriptions unless a file path is itself part of the observable contract.
