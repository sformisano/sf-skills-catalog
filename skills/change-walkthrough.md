---
name: Change Walkthrough
description: Use when explaining a code changeset in chat, MR descriptions, or changelogs. Orders concepts before files and enforces full code-diff coverage with surface-specific reference formats.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-18T11:46:10Z"
---

# Change Walkthrough

Use this skill to explain code changes in conceptual order so a human reviewer can understand dependencies before reading files in raw diff order.

## Boundary

- Walkthrough is a comprehension aid.
- It does not replace review findings, changelog gates, or verification gates.
- It applies only to code changes. Non-code files belong in changelog or review narrative, not the walkthrough itself.

## Output surfaces

- **Chat**: concept-ordered walkthrough with fenced citation blocks
- **MR description**: shorter concept-ordered walkthrough section
- **Changelog**: `## Walkthrough` appendix with dual-link references

## Applicability gate

Classify changed files first:

- **Code files**: compiled, interpreted, or executed by tooling, for example `.rs`, `.py`, `.ts`, `.js`, `.sh`, `.sql`, `Dockerfile`, CI pipeline configs
- **Non-code files**: documents, policies, catalog entries, and structured metadata such as `.md`, `.toml`, `.json`, `.yaml`

Then apply the gate:

1. If there are no changed code files, stop and report: `Walkthrough skipped: change contains no code files.`
2. If all changed files are code, walk the full diff.
3. If the change is mixed, walk only the code portion.

## Analysis order

Read context in this order:

1. diff stat
2. changed-path list
3. commit log or MR metadata
4. full diff
5. changed file content needed for precise references
6. relevant changelog or journal entries when they clarify intent

## Ordering methodology

Default concept order:

1. data types and models
2. interfaces and contracts
3. core logic
4. infrastructure and wiring
5. configuration and environment
6. tests
7. support changes

Adjust the order when a cross-cutting dependency root matters more than the default categories. For example, start from schema or migration changes before writer and verifier logic when persistence shape is the true prerequisite.

## Step structure

Each step should explain one concept, not one file.

For every step:

- use a short title
- write 2 to 4 sentences in chat and changelog output
- write 1 to 2 sentences in MR output
- explain what changed, why it matters, and how it connects to the previous step

## Coverage and reference gates

### Diff coverage

Before writing the walkthrough, build an inventory of:

- every changed code file in scope
- every changed hunk in those files
- any fallback-only items such as deleted files, renamed old paths, binary files, or generated artifacts

All walkthrough output must cover the full scoped code diff.

### Reference formats

Use the active surface format for every existing or added file:

- **Chat and MR**: fenced citation blocks headed by `startLine:endLine:filepath`
- **Changelog**: dual-link line-range format from @skill:changelog-authoring

Path-only fallback is allowed only for deleted files, renamed old paths, binary files, or generated artifacts, and each fallback must include the reason.

If any reference violates the active surface format, regenerate the walkthrough before returning it.

## Templates

### Chat or MR step

````markdown
## Walkthrough

### 1. <Concept title>
<Narrative>

References:
```12:48:path/to/file.rs
// cited content
```
````

### Changelog step

````markdown
## Walkthrough

### 1. <Concept title>
<Narrative>

References:
- `src/example.rs:12-48` ([open](../../src/example.rs), [GitLab](https://<host>/<group>/<repo>/-/blob/<sha>/src/example.rs#L12-48))
````

## Invocation

### Scope selection

Determine the scope from user intent:

- `delta`: local branch work plus staged, unstaged, and untracked changes
- `branch`: a branch diff against its target
- `mr`: a merge request diff with MR metadata

If scope is ambiguous, ask which of `delta`, `branch`, or `mr` the user wants.

### Shared requirements

- default to the current repo unless the user specifies another one
- if cloning a remote repo, use `git clone --filter=blob:none`
- external tool failures follow @skill:execution-discipline
- apply @skill:completion-verification before claiming the walkthrough is complete

## Scope: Delta

1. Resolve the target branch in this order:
   - `origin/HEAD`
   - local `main`
   - local `master`
   - ask the user if still unresolved
2. Collect:
   - committed branch diff vs target
   - staged diff
   - unstaged diff
   - untracked files
3. Apply the applicability gate.
4. Read changed code files needed for references.
5. Build the coverage inventory.
6. Produce the walkthrough.

Suggested commands:

```bash
git rev-parse --abbrev-ref --symbolic-full-name origin/HEAD
git status --short
git --no-pager diff --stat <target>...HEAD
git --no-pager diff --name-only <target>...HEAD
git --no-pager diff <target>...HEAD
git --no-pager diff --cached
git --no-pager diff
```

## Scope: Branch

1. Resolve the repository.
2. Resolve the target branch using the same order as delta scope.
3. Gather `<target>...<branch>` diff context.
4. Apply the applicability gate.
5. Read changed code files.
6. Build the coverage inventory.
7. Produce the walkthrough.

Suggested commands:

```bash
git fetch origin
git --no-pager log --oneline <target>..<branch>
git --no-pager diff --stat <target>...<branch>
git --no-pager diff --name-only <target>...<branch>
git --no-pager diff <target>...<branch>
```

## Scope: MR

1. Resolve the repository.
2. Resolve the MR number or URL.
3. Fetch MR metadata through the repository's standard merge-request tooling.
4. Build the raw `<target>...<source>` diff inventory.
5. Apply the applicability gate.
6. If the MR description already contains a `## Walkthrough` section with a provenance marker and matching source SHA, reuse is allowed. Otherwise regenerate.
7. Read changed code files, build coverage, and produce the walkthrough when regenerating.

## MR walkthrough reuse

Reuse only when all three are true:

- the existing section is clearly bounded by `## Walkthrough`
- the provenance marker includes the current source SHA
- the references pass the active format gate

Otherwise regenerate.

## Required footer

End walkthrough outputs with:

> This walkthrough is a comprehension aid. It does not replace formal review findings or delivery gates.
