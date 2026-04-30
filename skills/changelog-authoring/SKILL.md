---
name: changelog-authoring
description: "Defines final delivery changelog naming, gate behavior, and narrative structure. Also use it as context when reading recent changes or understanding why code looks unusual."
metadata:
  skillcatalog/display_name: "Changelog Authoring"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Changelog Authoring

A changelog is the final delivery narrative for a completed task. It records what was planned, what actually happened, what changed along the way, and what remains deferred.

## Changelog as context

When `docs/changelog/` exists, read relevant entries:

- before modifying the same area
- when code or behavior seems odd
- when reviewing recent design tradeoffs

Use changelog entries as supplementary context, not as a substitute for code or git history.

## Artifact contract

There are two delivery artifact families:

1. optional task journals under `docs/journal/`
2. mandatory final delivery changelogs under `docs/changelog/`

Internal squad planning, implementation, and review rounds use the journal. Final changelog authoring happens during delivery, after the internal lifecycle reaches a `submit` recommendation.

## File naming

Use:

```text
docs/changelog/YYYY-MM-DDTHHMM_<TICKET>_<brief-description>.md
docs/changelog/YYYY-MM-DDTHHMM_<brief-description>.md
```

Rules:

- include local date and minute
- include the ticket token when one exists
- use a short kebab-case description

## Gate behavior

This skill is the canonical gate for final delivery changelogs.

### Delivery completion gate

Before claiming a task is delivered:

1. verify the change set includes exactly one intended final changelog under `docs/changelog/`
2. if it is missing, stop and write it
3. if a journal exists, keep the journal and changelog separate

### MR creation gate

Before creating an MR:

1. verify the branch diff includes a final changelog under `docs/changelog/`
2. show the changelog path and content to the author
3. require explicit acknowledgment before proceeding

### External deliverable review gate

For external review commands such as `review-delta`, `review-branch`, and `review-mr`:

1. verify the change set includes a final changelog
2. if missing, stop review and ask for the changelog first

This gate does **not** apply to internal squad review rounds.

## Narrative structure

Every changelog should cover these five parts, scaled to the change size:

1. `## Plan`
2. `## Execution`
3. `## Surprises`
4. `## Outcome`
5. `## Deferred`

Simple changes can keep sections brief. Complex changes should include more rationale and tradeoffs.

## Runtime-dispatched mode

If a delivery flow pre-populates the section headings, fill them without renaming or reordering them.

## Templates

### Simple

```markdown
# <Brief title>

**Ticket:** <URL or none> | **Date:** YYYY-MM-DD

## Plan
<1-2 sentences>

## Outcome
<1-2 sentences>
```

### Standard

```markdown
# <Brief title>

**Ticket:** <URL or none> | **MR:** <URL or none> | **Date:** YYYY-MM-DD

## Plan
<planned scope and goal>

## Execution
- <significant step>

## Surprises
<scope shifts, discoveries, or "None.">

## Outcome
<what shipped and what was verified>

## Deferred
<what was intentionally left for later>
```

## Walkthrough appendix

Add `## Walkthrough` only when the delivered change contains code files.

- apply the applicability gate from @skill:change-walkthrough
- keep the walkthrough after `## Deferred`
- use the changelog reference format below

### Changelog reference format

Use:

```text
path/to/file.ext:12-48 ([open](OPEN_LINK), [GitLab](https://<host>/<group>/<repo>/-/blob/<sha>/path/to/file.ext#L12-48))
```

Rules:

- keep the plain text path and line range
- use a relative `open` link from `docs/changelog/`
- use commit SHA in the GitLab link
- if the GitLab remote is unavailable, keep only the `open` link

## Generate from git delta

Use this standalone workflow when delivery needs a final changelog from the current repo state.

1. Resolve the target branch in this order:
   - `origin/HEAD`
   - local `main`
   - local `master`
   - ask the user if still unresolved
2. Gather:
   - committed diff vs target
   - staged changes
   - unstaged changes
   - untracked files
3. If all four scopes are empty, stop and report:
   - `No changelog needed: no committed, staged, unstaged, or untracked changes were found.`
4. Derive filename inputs:
   - local datetime to the minute
   - ticket token from the branch name when present
   - short kebab-case description
5. Draft the narrative sections.
6. Add `## Walkthrough` only when code files are present.
7. Write exactly one final artifact under `docs/changelog/`.

## Failure handling

- branch resolution probe misses are expected, not workflow failures
- real external tool failures follow @skill:execution-discipline

## Optional system spec delta

When behavior or invariants changed, you may add a short subsection under `## Execution` or `## Outcome`:

```markdown
### System Spec Delta (optional)
Behavior changed: <yes/no>
Delta summary: <added/modified/removed behavior>
Spec update target: docs/system-spec.md section <name> or None
```
