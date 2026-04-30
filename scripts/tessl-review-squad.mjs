#!/usr/bin/env node

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const skillsDir = path.join(repoRoot, "skills");
const squadStackPath = path.join(repoRoot, "stacks", "squad.yaml");

function escapeYamlSingleQuoted(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function getField(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  if (!match) {
    return null;
  }

  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function getMetadataField(frontmatter, key) {
  const metadataMatch = frontmatter.match(/^metadata:\n((?:[ \t].*\n?)*)/m);
  if (!metadataMatch) {
    return null;
  }

  const metadataBlock = metadataMatch[1];
  const match = metadataBlock.match(new RegExp(`^[ \t]+${key}:\\s*(.+)$`, "m"));
  if (!match) {
    return null;
  }

  let value = match[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function readSquadStackSlugs() {
  const raw = fs.readFileSync(squadStackPath, "utf8");
  const match = raw.match(/^skills:\n([\s\S]*)$/m);
  if (!match) {
    throw new Error(`Missing skills list: ${squadStackPath}`);
  }

  return match[1]
    .split("\n")
    .map((line) => line.match(/^\s*-\s+([a-z0-9-]+)\s*$/)?.[1])
    .filter(Boolean);
}

function resolveSkillPath(input) {
  const candidate = path.resolve(repoRoot, input);
  if (fs.existsSync(candidate)) {
    const stat = fs.statSync(candidate);
    if (stat.isDirectory()) {
      return path.join(candidate, "SKILL.md");
    }
    return candidate;
  }

  return path.join(skillsDir, input, "SKILL.md");
}

function parseSkill(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) {
    throw new Error(`Missing frontmatter: ${filePath}`);
  }

  const [, frontmatter, body] = match;
  const slug =
    path.basename(filePath) === "SKILL.md"
      ? path.basename(path.dirname(filePath))
      : path.basename(filePath, ".md");
  const description = getField(frontmatter, "description");
  const author =
    getField(frontmatter, "author") ??
    getMetadataField(frontmatter, "skillcatalog/author") ??
    getMetadataField(frontmatter, "author");
  const createdAt =
    getField(frontmatter, "created_at") ??
    getMetadataField(frontmatter, "skillcatalog/created_at") ??
    getMetadataField(frontmatter, "created_at");
  const updatedAt =
    getField(frontmatter, "updated_at") ??
    getMetadataField(frontmatter, "skillcatalog/updated_at") ??
    getMetadataField(frontmatter, "updated_at");

  if (!description) {
    throw new Error(`Missing description: ${filePath}`);
  }
  if (!author || !createdAt || !updatedAt) {
    throw new Error(`Missing catalog metadata fields: ${filePath}`);
  }

  return {
    slug,
    description,
    author,
    createdAt,
    updatedAt,
    body,
  };
}

function writeTesslCopy(tmpRoot, skill) {
  const outDir = path.join(tmpRoot, skill.slug);
  const sourceDir = path.dirname(skill.filePath);
  fs.mkdirSync(outDir, { recursive: true });

  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    if (entry.name === "SKILL.md" || entry.name === "SCORE.json") {
      continue;
    }
    const from = path.join(sourceDir, entry.name);
    const to = path.join(outDir, entry.name);
    fs.cpSync(from, to, { recursive: true });
  }

  const rewritten = [
    "---",
    `name: ${skill.slug}`,
    `description: ${escapeYamlSingleQuoted(skill.description)}`,
    "metadata:",
    '  version: "1"',
    `  author: ${escapeYamlSingleQuoted(skill.author)}`,
    `  created_at: ${escapeYamlSingleQuoted(skill.createdAt)}`,
    `  updated_at: ${escapeYamlSingleQuoted(skill.updatedAt)}`,
    "---",
    skill.body.replace(/\r\n/g, "\n"),
  ].join("\n");

  const outPath = path.join(outDir, "SKILL.md");
  fs.writeFileSync(outPath, rewritten, "utf8");
  return outDir;
}

const requested = process.argv.slice(2);
const selectedFiles =
  requested.length > 0
    ? requested.map(resolveSkillPath)
    : readSquadStackSlugs().map(resolveSkillPath);

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "tessl-squad-review-"));

for (const filePath of selectedFiles) {
  const relativePath = path.relative(repoRoot, filePath);
  const skill = parseSkill(filePath);
  skill.filePath = filePath;
  const reviewDir = writeTesslCopy(tmpRoot, skill);

  process.stdout.write(`### ${relativePath}\n`);
  const result = spawnSync("npx", ["tessl", "skill", "review", reviewDir], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  process.stdout.write("\n");

  if (result.status && result.status !== 0) {
    process.exitCode = result.status;
  }
}
