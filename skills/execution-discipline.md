---
name: Execution Discipline
description: Foundational execution contract for agent work. Covers constraint precedence, lifecycle integrity, preflight checks, and external tool failure handling.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-19T08:45:00Z"
---

# Execution Discipline

Use this skill as the behavioral contract for multi-step agent work. It defines how to resolve conflicts, what must never be violated, what to check before acting, and how to respond when tools fail.

## Constraint precedence

When multiple constraints apply at once, use this order:

1. Compliance and data safety
2. Cross-boundary correctness
3. Workflow and runtime correctness
4. Methodology and quality
5. Style and copywriting

If two constraints conflict, apply the higher-precedence rule and report which lower-precedence rule was not applied. If two rules have equal precedence and conflict, stop and ask the user which one to honor.

## Lifecycle integrity

These rules apply whenever you are working inside a plan -> implement -> review lifecycle or managing delivery artifacts.

### Never bypass review

- Code that entered the delivery lifecycle must not be pushed as delivered work without a completed review recommending `submit` with zero blocking findings.
- Passing tests are not a substitute for review.
- When a lifecycle run stops mid-flow, resume from the latest artifact instead of bypassing the workflow with ad hoc commit or push steps.

### Never destroy lifecycle artifacts

- Never run abort or cleanup commands without explicit user instruction.
- Before proposing cleanup, warn that it may delete plans, reports, journals, or session state.
- Prefer continue, resume, or a fresh review round over destructive cleanup.

### Never delete tracked artifacts proactively

- Never delete requirement files, journal artifacts, or changelog entries without explicit user instruction for each file.
- Prior approval for one deletion does not authorize later deletions.

### Never rewrite pushed history without approval

- Never run `git reset` on pushed commits without explicit user instruction.
- Never run `git push --force` without explicit user instruction.

## Preflight checks

Run these before substantial multi-step work:

1. **Context**
   - Confirm the active task, repo, and artifact paths.
   - Load prior artifacts before drafting new ones.
2. **Ambiguity**
   - If requirements are underspecified or conflicting, stop and clarify.
   - Do not invent hidden business requirements.
3. **Concurrency safety**
   - Re-read each target file right before editing it.
   - Keep edits minimal and localized.
   - If a file changed since your last read, stop and reassess.
4. **Changelog context**
   - When `docs/changelog/` exists, read relevant entries before modifying the same area.
5. **Verification planning**
   - Identify the fresh command or artifact that will prove success.
   - Apply @skill:completion-verification before claiming completion.
6. **Proof isolation**
   - Before running any proof, exercise, or verification command, apply @skill:test-harness-isolation.
   - Default to sequential execution of proof commands. Only parallelize when isolation is explicitly proven from source (unique ports, unique temp paths, no shared global setup or teardown).
   - Treat the archetypal mistake of running an isolated slice and an integrated slice of the same harness at the same time as a stop sign.
7. **Skill discovery**
   - Load any required tool, review, authoring, or testing skills before execution.

### Non-negotiable preflight behavior

- Do not skip preflight silently.
- If a required preflight step cannot be completed, stop and report the blocker.
- Do not claim success from stale output.

## Tool failure handling

Scope: workflow and tool execution failures only. This skill does not define application error semantics.

### Interactive context

Use this when a user can respond in the current session.

When a required external tool fails:

1. Stop the current step immediately.
2. Present the error clearly.
3. Ask the user to choose one of three paths:
   - fix and retry
   - skip explicitly
   - cancel
4. Never skip or substitute a different workflow on your own.
5. Never report a skipped step as completed.

### Non-interactive context

Use this for specialist roles, background automation, or CI jobs that cannot ask the user questions.

When a required external tool fails:

1. Record the tool, attempted operation, and error.
2. Attempt a safe workaround only when the failed step is non-essential to the core deliverable.
3. Document every skipped or substituted step in a `## Deviations` section of the output artifact.
4. Stop only when the failure blocks the core deliverable.
5. Never emit an empty deliverable if partial useful work exists.

### Common rules

- Never report skipped work as completed work.
- Apply this policy to all required CLIs and external dependencies.
- If a request says "error handling" without clear scope, disambiguate workflow/tool failures vs code-level error behavior before acting.
