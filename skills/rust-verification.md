---
name: Rust Verification
description: Run the standard Rust verification suite, `fmt`, `clippy`, `test`, and `build`, before reporting implementation or remediation work complete.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-06T21:43:21Z"
---

# Rust Verification

Run this suite before claiming Rust work is ready:

```bash
cargo fmt --all --check
cargo clippy --all --all-targets --all-features -- -Dwarnings -Drust-2018-idioms -Drust-2021-compatibility -Adeprecated
cargo test --all-targets
cargo build --release
```

## When to run

- before reporting implementation completion
- before closing a remediation round
- after meaningful Rust code changes

## Failure handling

- If `fmt` fails, run `cargo fmt --all`, then re-check.
- If `clippy` fails, fix the warnings or justify any narrow allow with a one-line comment.
- If `test` fails, fix the code or the test. Do not ignore the failure.
- If `build` fails, treat the work as incomplete.

## Boundary

This skill defines the verification commands only. Use @skill:completion-verification for claim discipline.
