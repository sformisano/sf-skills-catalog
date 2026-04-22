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

## Proof discipline and routing

12. Proof-execution-mode discipline: every proof row populates `execution_mode`; any unsupported `parallel` row is contaminated and needs a sequential rerun
13. Authority state consistency: if the current review cites earlier rounds, make sure those rounds are still `active` in the manifest and not silently superseded or contaminated

## Output expectation

When you return `NEEDS_REVISION`, say exactly what must change in the review artifact:

- missing section or field
- weak or missing evidence
- wrong severity or false positive
- routing or authority mismatch
