# SF Catalog

This is a [SkillCatalog](https://skillcatalog.dev) catalog: a portable, version-controlled collection of AI agent skills.

## Structure

| Directory | Contents |
|-----------|----------|
| `skills/` | Directory-form skill definitions at `skills/{slug}/SKILL.md`, with companion files such as `references/` inside the skill directory |
| `stacks/` | Stacks that group related skills |
| `bundles/` | Bundles that group stacks for distribution |
| `catalog.yaml` | Catalog metadata and taxonomy |

## Getting started

Install the SkillCatalog app or CLI, then add this catalog:

```sh
skillcatalog add <remote-url>
```

For documentation, visit [skillcatalog.dev](https://skillcatalog.dev).
