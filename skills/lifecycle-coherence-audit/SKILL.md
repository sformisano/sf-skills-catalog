---
name: lifecycle-coherence-audit
description: "Audit governance artifacts for a formal squad lifecycle before resume, delivery-ready, or delivered claims. Use when manifest, handoff, status, or resume docs disagree inside a squad journal."
metadata:
  skillcatalog/display_name: "Lifecycle Coherence Audit"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-30T07:40:21Z"
  skillcatalog/updated_at: "2026-05-03T10:19:17Z"
---
# Lifecycle Coherence Audit

## Purpose

Find stale handoff, status, resume, or manifest documents that silently diverge from the authoritative task state.

Use this for governance artifacts. For runtime application state, use the runtime state-coherence audit skill instead.

## When to Use

- Before claiming a squad lifecycle is delivery-ready or delivered
- Before resuming an old squad journal
- When `manifest.yaml`, `HANDOFF.md`, `STATUS.md`, or resume docs disagree about the current phase or next action
- When a waiver, defer, handoff, or delivery summary says something different from the manifest

## Steps

### 1. Identify Lifecycle Authorities

Find task-local state artifacts:

- `manifest.yaml`
- `HANDOFF.md`
- `STATUS.md`
- resume docs, notes, or checkpoint files
- implementation, review, critic, and adversary artifacts referenced by the manifest

Treat `manifest.yaml` as the structured routing authority. Other files may add context, but they must not contradict the manifest unless they are clearly marked superseded.

### 2. Compare Current State

Check:

- manifest `current.phase`, `current.loop`, `current.round`, and `current.status`
- `plan.final_round`
- each phase's implementation and review `final_round`
- end-to-end sweep `final_round`
- `pre_e2e_smoke` status and artifact path when Phase 4 is required
- adversary blocks and lead decisions
- waivers, defers, delivery claims, checklist candidates, child sessions, and drift checks
- handoff or status "next action" text

### 3. Flag Stale Lifecycle State

Flag as a coherence defect:

- a handoff says work is pending while the manifest says complete
- a status doc names a next action that has already been superseded
- a delivery summary claims delivery but the manifest has an open loop
- resume instructions point to a stale phase or round
- a waiver, defer, or accepted product trade-off appears in one artifact but not the others

### 4. Remediate

Prefer one of these fixes:

- update the stale document to match the manifest
- mark the stale document explicitly superseded and point to the newer manifest or handoff
- update the manifest only when the structured state is wrong
- block delivery claims until handoff, status, and resume docs are coherent

Do not delete historical artifacts to make the audit pass. Historical files remain useful when they are clearly superseded.

## Report Format

| field | description |
| --- | --- |
| authoritative_state | Manifest current phase, loop, round, status, and final accepted artifacts |
| stale_artifact | File whose state conflicts with the authority |
| conflict | The exact contradiction |
| severity | resume blocker, delivery blocker, or context warning |
| fix | Update, mark superseded, or correct manifest |
