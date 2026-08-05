---
name: beacon
description: Automated Changelog and Release Notes Generator. Parses Conventional Commit histories and git tags to generate structured, human-readable release notes, Markdown changelogs, and version bump suggestions.
---

# 📡 Beacon

Automated Changelog & Release Notes Generator. Beacon parses Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `BREAKING CHANGE:`) and compiles them into structured, publication-ready Markdown release notes.

## 🎯 Features

1. **Semantic Grouping**: Categorizes commits into Features, Bug Fixes, Performance Enhancements, Refactoring, and Breaking Changes.
2. **Version Bump Calculation**: Automatically recommends standard Semantic Version bumps (`MAJOR`, `MINOR`, `PATCH`) based on commit types.
3. **Markdown Output**: Generates clean, standard `CHANGELOG.md` files or GitHub Release payloads.

## 🚀 Execution Guide

Generate release notes from recent git commits:
```bash
node C:/Users/GdC/.gemini/config/skills/beacon/lib/beacon.js --version "v1.1.0"
```
Or parse a custom commit message list:
```bash
node C:/Users/GdC/.gemini/config/skills/beacon/lib/beacon.js --commits "feat: add OAuth login\nfix: handle null token"
```


---

## ⚡ Spark Breakthrough Enhancement

- **Feature**: **AI Executive Release Digest**
- **Description**: Synthesizes git commit histories into executive markdown & video-ready release notes.
- **Synergy**: Integrated with `yt-digest` (digest layout) & `spark` (enhancements).
- **Framework**: Applied via the `spark` 4-Lens Lateral Ideation Engine.
