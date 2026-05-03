---
name: changelog-authoring
description: "Use only when the user explicitly asks for a local changelog or delivery note, or when reading existing local scratch notes. This skill is not a delivery, review, MR, or commit gate."
metadata:
  skillcatalog/display_name: "Changelog Authoring"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-05-03T10:19:17Z"
---
# Local Changelog Authoring

This skill writes optional local notes. It must not create a committed delivery artifact, and it must not block review, MR creation, commit, push, or delivery when no changelog exists.

## Boundaries

- Do not require a changelog for ordinary delivery.
- Do not require a changelog to appear in a branch diff or change set.
- Do not add changelog files to commits.
- Do not alter `.gitignore` so `.tmp/` becomes tracked.
- Use chat, MR descriptions, commit messages, review artifacts, or the task's explicit journal for required delivery narrative.
- Use `.tmp/changelog/` only as ignored local scratch when the user explicitly requests a file or the workflow already has relevant local notes.

## Local Notes As Context

When ignored local `.tmp/changelog/` notes exist and are clearly relevant, you may read them:

- before modifying the same area
- when code or behavior seems odd
- when reviewing recent design tradeoffs

Use local notes as supplementary context, not as a substitute for code, git history, tickets, or current user instructions.

## File naming

Use:

```text
.tmp/changelog/YYYY-MM-DDTHHMM_<TICKET>_<brief-description>.md
.tmp/changelog/YYYY-MM-DDTHHMM_<brief-description>.md
```

Rules:

- include local date and minute
- include the ticket token when one exists
- use a short kebab-case description

## No Gate Behavior

This skill is not a gate. Missing changelog notes are never a reason to stop:

- delivery completion
- MR creation
- external deliverable review
- internal squad review
- commit or push

## Narrative structure

When the user explicitly requests a local changelog file, cover these five parts, scaled to the change size:

1. `## Plan`
2. `## Execution`
3. `## Surprises`
4. `## Outcome`
5. `## Deferred`

Simple changes can keep sections brief. Complex changes should include more rationale and tradeoffs.

## Runtime-dispatched mode

If a local-note flow pre-populates the section headings, fill them without renaming or reordering them.

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

Add `## Walkthrough` only when the requested local note covers code files.

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
- use a relative `open` link from `.tmp/changelog/`
- use commit SHA in the GitLab link
- if the GitLab remote is unavailable, keep only the `open` link

## Generate from git delta

Use this standalone workflow only when the user asks for a local changelog file from the current repo state.

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
7. Write the local artifact under `.tmp/changelog/`.
8. Leave the artifact untracked.

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
