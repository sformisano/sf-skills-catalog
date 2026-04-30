---
name: rust-verification
description: "Run the standard Rust verification suite, `fmt`, `clippy`, `test`, and `build`, before reporting implementation or remediation work complete."
metadata:
  skillcatalog/display_name: "Rust Verification"
  skillcatalog/author: "Salvatore Formisano"
  skillcatalog/created_at: "2026-04-06T21:43:21Z"
  skillcatalog/updated_at: "2026-04-30T09:15:57Z"
---
# Rust Verification

Run this suite before claiming Rust work is ready:

```bash
cargo fmt --all --check
cargo clippy --all --all-targets --all-features -- -Dwarnings
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
