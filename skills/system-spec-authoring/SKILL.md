---
name: system-spec-authoring
description: "Use when a change alters externally observable behavior or invariant constraints and `docs/system-spec.md` must be updated."
metadata:
  skillcatalog/display_name: "System Spec Authoring"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# System Spec Authoring

Maintain `docs/system-spec.md` as the compact record of externally visible behavior and invariant workflow rules.

## When to update

Update the system spec when a change:

- alters observable user or operator behavior
- changes lifecycle contracts or artifact locations
- changes invariant constraints that affect correctness, compatibility, or workflow interpretation

Do not update it for purely internal refactors with no observable effect.

## Required section shape

Keep `docs/system-spec.md` aligned to this structure:

```markdown
# System Specification

## Domain Overview
## Current Observable Behaviors
## Repository Layout
## Constraints and Invariants
## External Interfaces
## Known Gaps / Deferred
```

## Update rules

- Prefer concise factual bullets over narrative history.
- Describe the live contract, not abandoned layouts.
- When behavior changed because of a specific lifecycle task, link the update back to the relevant journal or changelog entry when that reference is available.
- If an older skill or prompt conflicts with the live system spec, update the skill or prompt in the same change. Do not leave the spec correct and the skills stale.

## Drift handling

- If implementation behavior and `docs/system-spec.md` diverge, update the spec in the same task when the behavior change is intentional.
- If the implementation is wrong and the spec is right, fix the implementation instead.

## Boundary

- This skill governs only `docs/system-spec.md`.
- It does not replace lifecycle gates, changelog requirements, or review findings.
