---
name: cold-start-audit
description: "Trace first-run and empty-state code paths to find initialization ordering bugs, missing defaults, and broken onboarding flows."
metadata:
  skillcatalog/display_name: "Cold Start Audit"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-07T20:00:00Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Cold Start Audit

## Purpose

Detect bugs that only manifest on a fresh install, empty database, first login, or factory reset. Developers almost never test from a truly empty state because their local environment accumulates data over time. This audit systematically traces every code path that runs when no prior state exists.

## When to Use

- Before shipping onboarding or setup wizards
- After adding new configuration, storage, or state that has implicit "already exists" assumptions
- When a user reports "it didn't work when I first installed it"
- After any change to initialization, migration, or bootstrap logic
- As a periodic audit before releases

## Steps

### 1. Identify all persistent state locations

List every place the application reads or writes persistent state:

- Configuration files (TOML, YAML, JSON, .env)
- Databases (SQLite, PostgreSQL, etc.)
- Directories that must exist (data dirs, cache dirs, log dirs)
- Browser storage (localStorage, sessionStorage, IndexedDB, cookies)
- OS-level state (keychain, registry, launchd/systemd)

For each, document:
- The path or key
- What creates it (first write, explicit init, migration)
- What happens when it doesn't exist (error, default, silent skip)

### 2. Trace the startup sequence

Follow the application's initialization from the very first instruction:

- What runs before the main UI or CLI handler?
- What state is read during initialization?
- What happens if that state doesn't exist?
- Are there ordering dependencies between initialization steps?

Map the dependency graph: "Service A needs Config B, which is created by Step C." If Step C runs after Service A is constructed, Service A has stale or missing state.

### 3. Trace the first-run flow

Walk through what a new user experiences:

- What is the first screen or command they see?
- What backend calls does it make?
- Do those calls assume state exists (registered entries, default profiles, seeded data)?
- What happens if the backend returns empty results?

For each step in the first-run flow:
- Does the UI handle empty/null/missing states gracefully?
- Does the backend create necessary defaults before or during this step?
- Is there a race condition between state creation and state reading?

### 4. Check initialization ordering

For multi-step setup flows (wizards, onboarding):

- Does step N create state that step N+1 depends on?
- If step N fails or is skipped, does step N+1 handle the missing state?
- Are services constructed before or after the setup flow modifies their dependencies?
- After the setup flow completes, do all services see the newly created state?

Common ordering bugs:
- Service constructed with empty config at startup, setup flow populates config, service still has empty config
- Step 1 registers an entity, step 2 queries it through a different code path that has a stale cache
- Auto-activation logic (e.g. "first registered item becomes active") conflicts with explicit activation in a later step

### 5. Check directory and file creation

For every path the application reads from:

- Who creates the parent directory?
- What happens if the directory doesn't exist? (crash, auto-create, silent failure)
- Are there TOCTOU races between checking existence and creating?
- Do atomic write patterns (write to temp, rename) work when the target directory doesn't exist?

### 6. Check default values and fallbacks

For every configuration value or state that has a default:

- Is the default a sensible "empty" state or could it cause unexpected behavior?
- Does code downstream of the default handle it correctly?
- Are defaults consistent between backend and frontend?
- Do fallback paths (e.g. "if config missing, use default") produce the same result as explicit initialization?

### 7. Test the reset path

If the application supports resetting to factory state:

- Does the reset remove ALL persistent state? (Check every location from step 1)
- After reset, does the application behave identically to a fresh install?
- Are there any state locations outside the reset scope (browser storage, OS keychain)?

## Report Format

For each finding:

| Field | Description |
|-------|-------------|
| Location | File path and line numbers |
| State dependency | What state must exist for this code to work |
| Who creates it | What code path creates this state |
| Ordering issue | Why the state might not exist when this code runs |
| User scenario | Fresh install, factory reset, first run of feature X |
| Severity | Crash, empty UI, silent data loss, or cosmetic |
| Fix | Reorder initialization, add default creation, add existence check |

## Common Patterns to Flag

- Services constructed at startup that depend on state created during onboarding
- Config readers that return empty defaults silently, causing downstream logic to produce "0 items" instead of erroring
- Auto-activation logic (first-registered-becomes-active) that makes a subsequent explicit activation check always false
- Directory-dependent operations that don't create parent directories
- UI components that show "empty state" but should show "loading" or "not initialized"
- Migration logic that assumes the previous version's state exists (breaks on fresh install)
- Fallback paths like `unwrap_or_default()` that mask "state doesn't exist yet" as "state is intentionally empty"
