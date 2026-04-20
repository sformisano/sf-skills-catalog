---
name: State Coherence Audit
description: Find cloned, snapshotted, or cached in-memory state that can silently diverge from the source of truth after mutations.
created_at: "2026-04-07T20:00:00Z"
updated_at: "2026-04-07T20:00:00Z"
---

# State Coherence Audit

## Purpose

Detect bugs where in-memory state becomes stale after mutations. This class of bug is silent: no error is raised, but the caller reads outdated data and produces wrong results. Common in applications that clone configuration objects, cache service state at construction time, or use snapshot-based interior mutability (e.g. `RwLock` clones that create independent copies).

## When to Use

- After adding a new service or configuration object that is shared across components
- When a feature works in integration tests but fails in the running application
- When data written by one operation is not visible to a subsequent operation in the same session
- As a periodic audit on any application with long-lived shared state

## Steps

### 1. Identify state holders

Find every struct or object that holds configuration, registry, or lookup state in memory. In Rust, look for structs with `RwLock`, `Mutex`, `Arc`, or interior mutability. In TypeScript/React, look for context providers, module-level caches, and stores.

Search patterns:
- `RwLock<`, `Mutex<`, `RefCell<`, `Arc<`
- `Clone for` implementations on stateful types
- Context providers, `createContext`, `useState` with shared mutable data
- Module-level `static` or singleton patterns

### 2. Trace clone and snapshot points

For each state holder, find every place it is cloned, copied, or passed by value. Each clone is a potential divergence point. Check:

- Does the clone create an independent copy of the mutable state (new lock, new map)?
- Or does it share the underlying data (Arc clone, reference)?

**Independent copies are the primary risk.** After cloning, mutations to the original are invisible to the copy and vice versa.

### 3. Map mutation flows

For each state holder, find every function that mutates its state (writes, inserts, deletes, updates). For each mutation site:

- List every other component that holds a clone or snapshot of the same state
- Determine whether those components will see the mutation
- If not, determine whether the component will be used after the mutation in the same user flow

### 4. Verify reload or invalidation paths

For each stale-clone risk, check whether a reload, refresh, or invalidation mechanism exists:

- File-backed state: is there a `reload()` or `refresh()` call before reads?
- In-memory state: is there a rebuild, notify, or subscription mechanism?
- UI state: is there a re-fetch or context refresh after the mutation?

### 5. Check construction timing

Services constructed at application startup are especially vulnerable. If the application initializes service A with a snapshot of config C, and config C is later modified by service B, service A has stale state. Check:

- What state exists at the time each service is constructed?
- Can that state change during the application's lifetime?
- If yes, does the service have a way to see the updated state?

### 6. Verify cross-component flows

Trace end-to-end user flows that span multiple components. For each flow:

- Does component 1 mutate state that component 2 needs to read?
- Does component 2 see the mutation, or does it read from a stale snapshot?
- Are there ordering assumptions (e.g. "X always happens before Y") that could break?

## Report Format

For each finding:

| Field | Description |
|-------|-------------|
| Location | File path and line numbers |
| State holder | The type or object holding stale state |
| Divergence point | Where the snapshot/clone is created |
| Mutation site | Where the source of truth is updated |
| User scenario | How a user would trigger the bug |
| Severity | Silent wrong data, missing data, crash, or UI inconsistency |
| Fix | Reload before read, share via Arc, add invalidation, or restructure ownership |

## Common Patterns to Flag

- `Clone` implementation on a type with `RwLock` or `Mutex` that creates a new lock with a snapshot of the data
- Service constructed with a cloned config at startup, used after config changes
- React context that caches derived data but doesn't re-derive when dependencies change
- File-backed state read once at init and never refreshed
- Event handlers that capture state in closures at registration time
