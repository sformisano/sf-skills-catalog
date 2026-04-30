# Squad Review Critic Checklist

Use this reference after the main review-critic workflow passes structural checks.

## Finding quality

1. Missed findings
2. False positives
3. Severity inflation or understatement
4. Inconsistent treatment of similar issues
5. Requirement drift the author overlooked

## Evidence quality

6. Weak or missing scenario verification evidence
7. Feature Exercise Evidence quality for behavior-changing work
8. Exercise-skip discipline: bounded attempt, concrete blocker, and `implement` downgrade when proof is incomplete
9. Regression evidence quality for `bug-fix-regression: true`
10. Parity evidence quality for `behavior-preserving-refactor: true`
11. Evidence independence: reuse setup facts only, not prior proof as current-round proof
12. Claim Verification quality: NNG or high-risk REQ claim rows have concrete mechanism checks, direct proof, and evidence anchors, not only broad suite success
13. Proof-stage ownership: phase reviews, end-to-end reviews, smoke checks, and delivery gates verify the rows assigned to their lifecycle stage without forcing premature proof
14. Fixture consumption: a fixture path exists, but the cited test or exercise does not reference it or assert against it
15. Implementation fixture parity: the implementation report lists added, modified, or relied-on fixtures, but the review omitted fixture exercise evidence
16. Test-name drift: a test name implies coverage that the body and assertions do not prove
17. Negative-scan adequacy: removed fields, options, UI controls, command names, schema properties, or docs wording still appear on public or generated surfaces
18. Generated artifact drift: a source type or template changed, but generated schema, generated docs, help text, or snapshots were not regenerated or literal-scanned
19. Runtime semantics: a concurrency, cancellation, timeout, lock, or atomicity claim is not backed by actual source semantics
20. IPC/API/CLI error shape coverage: new variants exist but the review did not exercise every public error shape promised by the plan

## Proof discipline and routing

21. Proof-execution-mode discipline: every proof row populates `execution_mode`; any unsupported `parallel` row is contaminated and needs a sequential rerun
22. Authority state consistency: if the current review cites earlier rounds, make sure those rounds are still `active` in the manifest and not silently superseded or contaminated
23. Lifecycle artifact drift: `manifest.yaml`, `HANDOFF.md`, `STATUS.md`, final changelog, and resume docs do not contradict each other, or stale docs are explicitly marked superseded

## Output expectation

When you return `NEEDS_REVISION`, say exactly what must change in the review artifact:

- missing section or field
- weak or missing evidence
- wrong severity or false positive
- routing or authority mismatch
