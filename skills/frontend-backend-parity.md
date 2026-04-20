---
name: Frontend-Backend Parity Audit
description: Compare frontend resolution and display logic against backend logic to find divergences where the UI computes differently from the server.
created_at: "2026-04-07T20:00:00Z"
updated_at: "2026-04-07T20:00:00Z"
---

# Frontend-Backend Parity Audit

## Purpose

Detect bugs where the frontend reimplements backend logic (counts, resolution, filtering, validation) and the two implementations diverge. This class of bug shows correct data in one surface (e.g. delivery works, API returns right results) but wrong data in another (e.g. UI shows wrong count, missing items, or stale labels).

## When to Use

- After adding a new entity type, relationship, or grouping mechanism (e.g. bundles that contain stacks that contain skills)
- When the UI shows counts, summaries, or derived data that could be computed differently from the backend
- When a user reports "the UI says X but the actual result is Y"
- As a periodic audit on any application with parallel frontend/backend logic

## Steps

### 1. Inventory backend resolution logic

Find every place the backend resolves, expands, or computes derived data. Common patterns:

- Expanding hierarchies: bundle to stacks to skills, group to members, category to items
- Counting: total items, active items, items per group
- Filtering: excluded items, enabled/disabled flags, visibility rules
- Validation: required fields, valid states, allowed transitions

For each, document:
- What entity types are involved
- What expansion or derivation rules apply
- What edge cases exist (empty lists, missing references, circular references)

### 2. Inventory frontend resolution logic

Find every place the frontend computes the same or similar derived data. Search for:

- `useMemo`, `useCallback`, `computed` with filtering/mapping/reducing logic
- Manual iteration over lists to count, group, or expand items
- Display logic that derives values from raw data (e.g. "X skills" computed from a profile's entries)
- Client-side search or filter implementations

### 3. Compare pairwise

For each backend resolution path, find its frontend counterpart. Compare:

| Aspect | Check |
|--------|-------|
| Entity types handled | Does the frontend handle all types the backend handles? (e.g. skill, stack, AND bundle) |
| Expansion depth | Does the frontend expand to the same depth? (e.g. bundle to stacks to skills, not just bundle to stacks) |
| Deduplication | Does the frontend deduplicate the same way? (e.g. first-seen-wins, by install path, by slug) |
| Exclusion rules | Does the frontend apply the same exclusions? (e.g. excluded_skills list, disabled targets) |
| Edge cases | Empty collections, missing references, circular references |
| Ordering | Same sort order, same priority rules |

### 4. Check data freshness

Even if logic matches, the frontend may operate on stale data:

- Does the frontend re-fetch after mutations that change the backend state?
- Are context providers refreshed when underlying data changes?
- Does optimistic UI match what the backend actually does?

### 5. Check type coverage

In TypeScript frontends, check that type definitions cover all backend variants:

- Union types or enums that match backend enums (e.g. `"skill" | "stack" | "bundle"`)
- Switch/if-else chains that handle all cases (watch for missing `else if` branches)
- Type narrowing that could silently skip unknown variants

## Report Format

For each divergence:

| Field | Description |
|-------|-------------|
| Backend logic | File, line numbers, and summary of what it does |
| Frontend logic | File, line numbers, and summary of what it does |
| Divergence | What the frontend does differently |
| Impact | What the user sees (wrong count, missing items, broken UI) |
| Fix | Add missing case, extract shared logic, or delegate to backend |

## Common Patterns to Flag

- Frontend switch/if-else on entity kind that handles fewer cases than the backend
- Frontend count computed by iterating a list without expanding nested types
- Frontend filter that doesn't match backend exclusion rules
- Display values computed from raw data instead of using backend-computed values
- Hardcoded lists of valid values that don't match backend validation
- Client-side sorting that differs from backend default ordering
