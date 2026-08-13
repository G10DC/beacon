---
name: beacon
status: implemented
description: >-
  Automated changelog and release notes generator. Parses Conventional Commit
  histories and git tags to generate structured, human-readable release notes,
  Markdown changelogs, and version bump suggestions. Use when preparing a
  release and you need a changelog derived from commit history. Never use for
  arbitrary prose generation; never use as a substitute for manual release
  planning.
---

# Beacon

Automated Changelog & Release Notes Generator. Beacon parses Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `BREAKING CHANGE:`) and compiles them into structured, publication-ready Markdown release notes.

## Features

1. **Semantic Grouping**: Categorizes commits into Features, Bug Fixes, Performance Enhancements, Refactoring, and Breaking Changes.
2. **Version Bump Calculation**: Automatically recommends standard Semantic Version bumps (`MAJOR`, `MINOR`, `PATCH`) based on commit types.
3. **Markdown Output**: Generates clean, standard `CHANGELOG.md` files or GitHub Release payloads.

## Execution Guide

Generate release notes from the last 50 commits:
```bash
node lib/beacon.js --version "v1.1.0"
```
Or a real tag range, e.g. everything since the last release:
```bash
node lib/beacon.js --version "v1.1.0" --range "v1.0.0..HEAD"
```
Or parse a custom commit message list:
```bash
node lib/beacon.js --commits "feat: add OAuth login\nfix: handle null token"
```

**Honest scope**: without `--range` or `--commits`, it defaults to the last 50 commits
(`--count N` overrides the number). Category detection is Conventional-Commits prefix matching
only (`feat:`, `fix:`, `perf:`, `refactor:`, `docs:`, `BREAKING CHANGE`/`!:`) — commits that
don't follow that convention land in an uncategorized bucket. `git` is invoked via `execFileSync`
with an argument array (no shell), so `--range` cannot be used for command injection even with
untrusted input.

## When to use

- Drafting a changelog/release-notes entry from recent Conventional-Commit history, either the
  last N commits or a specific tag range, as a starting draft you'll review before publishing.

## When NOT to use

- **Commits don't follow Conventional Commits** — everything lands in the uncategorized bucket
  and the semver-bump suggestion degrades to a default of `PATCH`; the tool adds little value here.
- **As a substitute for actually deciding what belongs in the release** — treat the output as a
  draft grouped by commit prefix, not an editorially reviewed changelog.
