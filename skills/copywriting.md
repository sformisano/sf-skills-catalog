---
name: Copywriting
description: Use when writing commit messages, ticket descriptions, MR descriptions, reports, comments, documentation, or other persistent text artifacts. Keeps wording concise, direct, and free of common AI filler.
author: Salvatore Formisano
created_at: "2026-04-06T21:43:21Z"
updated_at: "2026-04-06T21:43:21Z"
---

# Copywriting Standards

Apply these standards to ALL text you generate: commit messages, ticket descriptions, MR descriptions, reports, comments, documentation, and any other written output.

## Core Rules

- Never use em dashes or double hyphens as punctuation. Use commas, colons, semicolons, or split into separate sentences.
- Keep sentences short and direct. Remove filler that does not add meaning.
- Avoid weak AI-style phrasing such as: "it's important to note", "let's dive in", "leverage", "utilize", "facilitate".
- Avoid hedging when facts are known. Prefer clear statements over "maybe", "perhaps", "it might".
- Prefer outcome language over implementation noise when writing tickets, reports, or summaries.
- No unicode arrows (`→`). Use `->` in code contexts, or rephrase in prose.

**Replace em dashes with** (when tempted): period and new sentence, comma, colon, parentheses, or semicolon for closely related clauses.

## Before You Generate Text

1. Are there any em dashes, double hyphens, or unicode arrows? Replace them.
2. Can any sentences be removed? Remove them.
3. Is there filler, self-reference, or vague authority language? Rewrite it.
4. Is every word necessary? Trim it.
