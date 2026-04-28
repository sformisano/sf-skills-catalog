# Brief: Add an Adversary Role to the Squad Planning Loop

**For:** an agent dispatched to author a new SkillCatalog skill and edit the
existing squad-* family in `/Users/salvatoreformisano/Projects/sf-skills-catalog`.

**Authored by:** the lead agent of the SkillCatalog scoring-sidecar plan loop
that surfaced the structural gap this rewrite addresses. The author of this
brief has the same blind-spot profile as the agent that will execute it —
read the brief, then push back on its assumptions explicitly in your output.
The whole point of this rewrite is to break same-model consensus; if you
take this brief at face value you have already failed at adversary mode.

**Date:** 2026-04-28.

---

## What this rewrite is solving

The squad planning loop ran on a real task (`scoring-sidecar-migration` in
the SkillCatalog desktop-app repo) and converged on `SATISFIED` twice in a
row. After each `SATISFIED`, an external adversarial reviewer was given the
plan and the code seams and asked to find what the in-loop critic missed.
Both times the adversary found load-bearing blockers the loop did not.

**Round 2 (SATISFIED) → adversary found:**
- `fs2 = "0.4"` in the dependency graph but the plan claimed a `fs2`
  10-second timeout API that does not exist (the crate exposes only
  `lock_exclusive`, `try_lock_exclusive`, and `unlock` — no timeout).
- "Embedded catalog is read-only" claim was false: the embedded catalog is
  registered in `catalog_config.rs:20` like any other catalog, with a real
  GitHub source URL, and is fully writable on disk.
- Per-provider HTTP timeout missing entirely; one slow provider hangs the
  whole run.
- Lock file `<skill-dir>/SCORE.lock` ships in user catalogs with no
  gitignore mechanism.

**Round 3 (SATISFIED, after addressing all four above) → adversary found:**
- Flat-MD skill layout (`<slug>.md` rather than `<slug>/SKILL.md`) is a
  supported variant in the codebase (`tier1_checker.rs:117,634`,
  `service.rs:479`) — the plan assumed `<slug>/SKILL.md` everywhere and
  has no defined sidecar location for flat skills. Three rounds of plan
  loop, this gap was latent through all of them.
- A 90-second outer fan-out budget exists in pseudocode comments only;
  the plan claims a property no test could verify.
- `tokio-util::sync::CancellationToken` referenced but the dep is missing
  from the workspace.
- `score_skill_multi(catalog_id, slug, …)` requires a structural choice
  (rewrite the service vs. keep IPC scoping) the plan punts.
- Content sanitization rule applied at two boundaries via separately
  described logic, not a shared helper.

These are not nitpicks. B1 (flat-MD) would have shipped and broken
operators on day one. B2 (90s budget) is the kind of thing that
embarrasses a team in code review. B5 (sanitization drift) is exactly
the supply-chain attack surface the rule is meant to prevent.

The two empirical points to internalize:
1. The in-loop critic returned `SATISFIED` with substantial fresh evidence
   in both cases. It is not lazy or under-resourced. It is *inside the same
   frame as the author* and structurally cannot see frame-level mistakes.
2. The loop's "convergence" criterion was satisfied; the plan was not
   actually ready. We need a structurally different role that runs after
   the loop converges.

---

## Why the in-loop critic misses these things

Five structural reasons, all converging:

**1. Shared frame.** The plan-critic reads the plan, the requirement, and
the triage. The plan-author wrote the plan; the lead wrote the requirement
and triage. The critic checks the plan *against the frame*, not the frame
against reality. Frame-level mistakes are invisible from inside the frame.

**2. Convergence pressure.** The loop's success state is `SATISFIED`. After
two rounds of revision, both author and critic are pulled — psychologically
and structurally (see `squad-convergence`) — toward landing. The adversary
must have no such pressure.

**3. Checklist methodology.** `squad-plan-critic` walks named angles
(structural completeness, feasibility, consistency, testing gaps, risk
blind spots, scope creep, closure quality, blast radius). This catches
things on the checklist and structurally misses things off it. "Verify the
plan handles every existing on-disk variant of the artifact it touches"
isn't on any angle, so flat-MD never came up.

**4. "Does it exist?" vs. "Is the claim correct?"** Round-2 critic
confirmed `fs2 = "0.4"` is in `Cargo.toml`. That answered the wrong
question. The right question — "does fs2's API actually support a 10s
timeout?" — required reading the crate source. The critic spec encourages
grounding evidence but doesn't push depth past existence-checks.

**5. Same model, similar blind spots.** Plan-author and plan-critic are
different agent definitions but the same underlying model. They share
training-distribution priors. A different agent definition gets you a
different *role*, not a different *mind*. The adversary role partially
mitigates this by giving an explicit anti-frame instruction; running on a
different model entirely would mitigate it further.

---

## Design decision

After considering author/adversary (collapses critic and adversary into
one role; loses structural-completeness function), author/adversary/
moderator (extra coordination role for problems we don't have at this
volume), and author/critic/adversary, the chosen pattern is:

**author / critic / adversary, with the lead doing moderator work.**

- **Critic** stays as-is (with sharpened anti-frame instructions). Returns
  `SATISFIED | NEEDS_REVISION`. Verdict gates routing. This role catches
  structural defects (missing ledger, unpinned IPC shapes, missing
  scenarios) that the adversary will skip because they're "boring."
- **Adversary** is new. Runs *after* the critic returns `SATISFIED`, once
  per converged plan (not once per author/critic round). Returns findings
  always — never `SATISFIED`. Findings are informational; the lead
  reconciles.
- **Lead** consumes adversary findings and decides: accept the plan,
  dispatch another author round to address findings, or escalate to user.

The cost: roughly one additional dispatch per converged plan (not per
round). For Tier Standard or Full plans this is well worth the cost in
catching frame-level blockers before implementation. For Tier Lite plans
the adversary should be optional and skippable.

Why this pattern works:
- Critic and adversary have *different jobs* with *different frames*
  (validate-against-frame vs. challenge-the-frame), not different volumes
  of the same job. Their outputs don't compete.
- The convergence-pressure problem is contained to the critic, where it
  belongs (we *do* want convergence on structural shape). The adversary
  is freed from it because it's not gating.
- The lead's job (route work, decide what to dispatch next) already
  encompasses moderator-style triage of adversary findings.

---

## Core principles for the adversary role

Encode these into the new skill explicitly. They are non-negotiable.

1. **Informational, not gating.** The adversary returns findings or a
   strongest residual concern; it never returns `SATISFIED`. Acceptance is
   a lead decision, not a verdict.

2. **No empty deliverable.** If after deep grounding the adversary finds
   no blocking issue, it must still produce a `Strongest residual concern`
   section naming the most plausible implementation failure mode and the
   evidence for it. An "all clear" output is never acceptable; even a
   well-converged plan has *some* residual risk worth naming.

3. **Frame is fair game.** The adversary explicitly questions the
   requirement, the triage, and the plan's framing — not just the plan's
   internal consistency. If the requirement narrows scope incorrectly, or
   the triage mis-flagged a boundary, that is a finding.

4. **Depth budget includes external sources.** The adversary must read
   actual code, library source, documentation, and tests — not just plan
   claims. Specifically:
   - Every external-library claim (a crate, an API, a syscall) must be
     grounded in the library's own source or its published documentation.
     "The dependency exists in Cargo.toml" is not enough.
   - Every "the codebase already supports X" claim must be grounded in a
     specific file:line citation, including variants the plan does not
     name.
   - Every claim about runtime behavior (timeouts, cancellation, atomic
     writes, lock semantics) must be grounded in how the runtime actually
     works under the cited platforms, not how the plan describes it.

5. **Off-checklist gap search is required.** The adversary must search
   for issues that aren't covered by the critic's named angles. Examples
   of question shapes that produce off-checklist findings:
   - "What variants of the input artifact does the plan not handle?"
   - "What claims rest on properties of an external system the plan did
     not verify?"
   - "What happens at the operational boundary the plan treats as a
     no-op?" (e.g. read-only filesystems, network filesystems, sleeping
     laptops, downgraded clients).
   - "What user workflows that exist today does this change break or
     forbid silently?"

6. **Convergence pressure is forbidden.** The adversary must not pull
   toward "looks good." Phrases like "the plan is sound overall" or
   "addresses the core concerns" are anti-patterns. The adversary's job
   is finding things, not blessing things.

7. **Different model when possible.** When the orchestration layer can
   route the adversary to a different model than the critic and author,
   it should. Same-model blind spots are the deepest source of
   undetected gaps. The skill itself shouldn't require a different
   model, but should note the recommendation in its `## Integration
   notes` section.

8. **One run per converged plan.** The adversary does not run on every
   author/critic round — that would re-introduce convergence pressure
   into the inner loop. It runs once, after the critic has returned
   `SATISFIED`, before the lead accepts the plan. If adversary findings
   trigger another author round, the critic loop runs again to
   `SATISFIED`, and the adversary runs again at the next convergence.

---

## Artifacts to produce or edit

All paths are absolute under `/Users/salvatoreformisano/Projects/sf-skills-catalog/`.

**Create:**

- `skills/squad-plan-adversary.md` — new skill, full implementation per
  the principles above. The shape (sections, schema, dispatch contract)
  is your design call within those constraints.

**Edit:**

- `skills/squad-lead.md` — add a Phase 1.5 dispatch step:
  > **Phase 1.5: Adversarial review.** When the plan-critic returns
  > `SATISFIED`, before recording plan acceptance in the manifest,
  > dispatch `squad-plan-adversary`. Reconcile its findings: accept the
  > plan as-is when only minor or strategic findings remain; dispatch
  > another author round when the adversary surfaces a blocker; escalate
  > to user when the finding requires a product or architecture call the
  > lead cannot make.
  Place this between the existing critic-acceptance step and the manifest
  acceptance write. Update the phase numbering or sub-step numbering as
  appropriate, and update the manifest schema reference (see below).

- `skills/squad-plan-critic.md` — sharpen anti-frame instructions:
  - Add a rule: every external-library claim in the plan must be grounded
    in the library's actual API surface (read source if necessary), not
    just in `Cargo.toml`.
  - Add a rule: every "the codebase supports X" claim in the plan must be
    spot-checked against the codebase, including variants the plan does
    not name.
  - Sharpen the "fresh-pass requirement" language to forbid trusting the
    plan-author's framing of any external system.
  Do not change the verdict semantics. Critic still gates routing.

- `skills/squad-convergence.md` — add a section explaining how adversary
  findings flow into the author/critic loop:
  - The adversary's output is not subject to convergence rules; it is
    informational.
  - When adversary findings trigger a new author round, the round is
    treated as an ordinary revision round (the author addresses each
    finding in `## Revision Response`), and the critic loop re-runs to
    `SATISFIED`. The adversary then re-runs at the next convergence.
  - The adversary does not have a max-rounds concept (it runs once per
    convergence). The author/critic loop's existing max-rounds applies
    unchanged.

- `skills/squad-manifest.md` — extend the schema to record adversary
  runs:
  - Add an `adversary` block under each `plan.rounds[]` entry (or as a
    sibling collection — your call). Fields: `path` (artifact location),
    `dispatched_at`, `findings_count_blocking`, `findings_count_advisory`,
    `lead_decision: accept | dispatch_revision | escalate_user`,
    `decision_reason`, `decision_at`.
  - Update the validation rules to require: when `plan.final_round` is
    set and tier is Standard or Full, the corresponding plan round must
    have an `adversary` block whose `lead_decision` is `accept` (or
    `escalate_user` with a recorded user decision in `waivers`). Tier
    Lite is exempt.

**Out of scope but flag for follow-up:**

- Mirroring the pattern for review (`squad-review-adversary.md`). The
  `squad-review-critic` skill has the same structural issues. Don't author
  this in the same change set; flag it as a known follow-up in the
  squad-lead skill's `## Future work` or equivalent location, or in a
  short note in `docs/design/`.
- Automated cross-task analysis of adversary effectiveness (how often
  does the adversary find blockers per task, over time). This is
  observability, not protocol; out of scope.
- Model-routing (which model runs adversary vs. critic). The skill
  recommends a different model but does not require one. Routing is an
  orchestration-layer concern.

---

## Required reading before drafting

1. **The squad-* family in this catalog**, especially:
   - `skills/squad-lead.md` (you will edit this)
   - `skills/squad-plan-critic.md` (you will edit this)
   - `skills/squad-plan-author.md` (the role the adversary complements)
   - `skills/squad-convergence.md` (you will edit this)
   - `skills/squad-manifest.md` (you will edit this)
   - `skills/squad-plan-verification.md` (the structural ruleset the
     critic enforces; understand what it covers so you don't duplicate
     it in the adversary)

2. **The empirical evidence** of why this rewrite is needed, in the
   journal of the SkillCatalog scoring task:
   `/Users/salvatoreformisano/Projects/skillcatalog/skillcatalog-app/docs/journal/20260427T2221_scoring-sidecar-migration/`
   - `20260427T2221.requirement.md` (with Revision 2 appended)
   - `triage.md`
   - `2026-04-27T204451.plan.md` (round 2 plan)
   - `2026-04-27T205741.plan-critic.md` (round 2 critic, SATISFIED)
   - `2026-04-27T213359.plan.md` (round 3 plan)
   - `2026-04-27T215102.plan-critic.md` (round 3 critic, SATISFIED)
   - `manifest.yaml` (lifecycle state)

   The actual adversarial-review outputs are in this brief's author's
   conversation history, not in the journal. Read enough of the round-2
   and round-3 critics to understand what `SATISFIED` looked like to the
   in-loop critic, then read enough of the plans to understand what the
   adversary then found that the critic missed. The diagnosis section
   above lists the specific findings.

3. **`docs/design/`** in this catalog (sf-skills-catalog) for prior
   protocol-level design notes, if any.

---

## Style conventions

Match the existing squad-* family in this catalog:

- Frontmatter shape (note: this catalog uses display-name-style `name`,
  not slug):
  ```yaml
  ---
  name: Squad Plan Adversary
  description: "<one-line description, double-quoted>"
  author: Salvatore Formisano
  created_at: "2026-04-28T00:00:00Z"
  updated_at: "2026-04-28T00:00:00Z"
  ---
  ```
- Tone: imperative, terse, declarative. Match `squad-plan-critic.md`'s
  voice. No filler, no hedging, no "let's", no "we'll".
- Section depth: top-level `# Title`, then `## Section`, then `### Sub`
  where needed. Avoid going deeper than three levels.
- References to other skills: use the `~/.claude/skills/<name>/SKILL.md`
  path convention seen throughout the family. (The catalog source is
  flat-MD, but the references point at the installed location.)
- Do not introduce emojis. Do not use em-dashes; use commas, colons, or
  separate sentences (see the catalog's `copywriting.md` skill).
- When adding sections to existing skills, add them in a position
  consistent with the existing flow, not at the end as a tacked-on
  appendix.

---

## Process notes

- **Produce all artifacts in one coherent change set.** The new skill,
  the squad-lead edit, the squad-plan-critic edit, the squad-convergence
  edit, and the squad-manifest edit are interdependent. Do not split
  across runs.

- **Be explicit in each edit about what changed.** When editing an
  existing skill, the diff should be readable: keep the existing
  structure, insert new sections at sensible positions, do not silently
  rephrase load-bearing text.

- **Update timestamps.** Every edited skill's `updated_at` frontmatter
  field bumps to today's date.

- **Catalog metadata.** If `catalog.yaml` carries a top-level skill list
  or stack reference that the new skill should join, update it. Inspect
  before deciding.

- **No code edits outside this catalog.** This rewrite ships in
  sf-skills-catalog. It does not touch the SkillCatalog desktop app or
  any other repo.

---

## Push back on this brief

The brief was written by an agent with the same blind-spot profile as
yours. Specific things you should question:

- Is `author/critic/adversary` actually the right shape, or does the
  argument against `author/adversary/moderator` rest on assumptions
  specific to one task and not the general case?
- Is "adversary runs once per convergence" the right cadence, or would
  per-round adversary be more effective at the cost of more tokens?
- Is the depth-budget instruction strong enough to force grounding, or
  does it leave too much wiggle room for the adversary to skim?
- Does the lead-as-moderator framing put too much load on a role that's
  already busy?
- Are there roles missing entirely — e.g. a "reconciliation" role
  separate from lead, or a "challenger" role that contests adversary
  findings?

If after reading the brief and the empirical evidence you conclude the
diagnosis or design decision is wrong, your output should say so plainly
and propose an alternative. Producing the artifacts as specified despite
disagreeing with the design is the failure mode this whole rewrite is
trying to break.

---

## Output expectations

When you are done, your output should include:

1. **The new `squad-plan-adversary.md` file**, fully drafted.
2. **The diffs to the four edited skills**, applied in place.
3. **A short summary** (under 500 words) of:
   - What you authored / changed.
   - Any disagreements with this brief, and what you did instead.
   - Any open questions for the lead or the user.
   - Any follow-up work you flagged but did not do.

If you encounter a blocker (missing context, contradiction in the
existing skills, ambiguity in this brief), stop and write a `## Blockers`
section in your summary instead of guessing. Do not silently work
around.
