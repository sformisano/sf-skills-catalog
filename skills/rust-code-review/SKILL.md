---
name: rust-code-review
description: "Use for external Rust review commands such as local delta, branch diff, merge request, or codebase audit. Prioritizes correctness, regression risk, async safety, compatibility, and test depth."
metadata:
  skillcatalog/display_name: "Rust Code Review"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-05-03T10:19:17Z"
---
# Rust Code Review

This skill defines external Rust review workflows. It is not the schema for internal squad review rounds.

## Review priorities

Review in this order:

1. intent and scope
2. correctness and regressions
3. panic safety, error handling, and async behavior
4. compatibility and public contract changes
5. tests, observability, and maintainability

## Intent loading

Before judging code:

- read the diff and commit context
- read relevant local scratch notes only when the user points to them or they are clearly task-local context
- read linked tickets or MR descriptions when available

Do not block a review because a changelog is absent. Changelog files are not required review inputs.

## Severity guidance

- `Critical`: correctness, security, or compatibility issue that blocks delivery
- `Major`: significant issue that should be fixed before merge
- `Minor`: real but limited issue
- `Trivial`: non-blocking note

## Core Rust checks

### Correctness and regressions

- Does the code do what the change claims?
- What existing behavior could it break?
- Are side effects ordered and repeated correctly?
- Are edge cases covered?

### Panic safety and error handling

- No reachable `unwrap`, `expect`, or unchecked indexing in production paths without a nearby invariant proof
- Error types carry enough context for callers
- Recoverable and terminal failures are distinguishable when the caller needs that distinction

### Async and concurrency

- no blocking work on the async executor
- no locks held across `.await`
- cancellation leaves the system in a safe state
- concurrency is bounded when needed

### Compatibility and public surface

- additive changes are backward-safe
- wire or persistence format changes have a migration or compatibility story
- public API changes are intentional and documented

### Logging, security, and tests

- sensitive data is not leaked in logs or error messages
- log messages are actionable
- tests cover the changed behavior and important failure paths

## Scenario verification

When the source plan includes scenarios:

- map each scenario to evidence
- mark each one `satisfied`, `partial`, `unsatisfied`, or `not_applicable (<reason>)`
- raise missing high-risk coverage as Major or Critical by default

## Output structure

Use:

```markdown
# Code Review: <identifier>

## Context
## Summary
## Findings
### Critical: <title>
### Major: <title>
### Minor: <title>
### Trivial: <title>
## Scenario Verification
## Recommendation
```

Omit empty sections except `## Recommendation`.

## Invocation

### Scope selection

Supported scopes:

- `delta`
- `branch`
- `mr`
- `codebase`

If the user does not specify a scope, ask for one.

### Shared requirements

- default to the current repo unless the user specifies another one
- use `git clone --filter=blob:none` for remote clones
- external tool failures follow @skill:execution-discipline
- apply @skill:completion-verification before claiming the review is complete

## Scope: Delta

Review local branch work plus staged, unstaged, and untracked changes.

1. Resolve target branch in this order:
   - `origin/HEAD`
   - local `main`
   - local `master`
2. Gather branch diff, staged diff, unstaged diff, and untracked files.
3. Load intent context.
4. Apply the review priorities.
5. Produce the report.

Suggested commands:

```bash
git rev-parse --abbrev-ref --symbolic-full-name origin/HEAD
git status --short
git --no-pager diff --stat <target>...HEAD
git --no-pager diff <target>...HEAD
git --no-pager diff --cached
git --no-pager diff
```

## Scope: Branch

Review `<target>...<branch>`.

1. Resolve the repo and target branch.
2. Gather diff context and recent commit history.
3. Review and report.

Suggested commands:

```bash
git fetch origin
git --no-pager log --oneline <target>..<branch>
git --no-pager diff --stat <target>...<branch>
git --no-pager diff <target>...<branch>
git --no-pager diff --name-only <target>...<branch>
```

## Scope: MR

Review an MR using GitLab metadata and the branch diff.

1. Resolve the repo.
2. Resolve the MR number or URL.
3. Use the repository's standard merge-request tooling to fetch MR metadata.
4. Gather `<target>...<source>` diff context.
5. Review and report.

## Scope: Codebase

Review the overall Rust codebase rather than one diff.

Focus on:

- architectural consistency
- common panic-safety or async hazards
- test coverage gaps
- error handling consistency
- major dependency or public API risks

## Codebase audit structure

```markdown
# Codebase Audit: <repo-name>

## Overview
## Architectural Health
## Common Risks
## Strengths
## Recommendations
```

## Boundary

- This skill is Rust-specific.
- Project-specific review skills may add stricter checks on top of it.
