# Beacon Release Notes & Changelog Honesty Layer

The honesty layer is the operational expression of the **G10DC Trellis Standard**: **the processing engine reasons over verified evidence with stated confidence, never hallucinates capabilities or impact.**

## Domain & Scope
**Domain**: Conventional Commit Changelog Generation

## Core Epistemic Rules

1. **Commit Message Dependency: Output accuracy depends 100% on Conventional Commit convention adherence.**
2. **Breaking Change Isolation: Explicit BREAKING CHANGE footers trigger major version bump recommendations.**
3. **Confidence Rating: High (100% conventional commits), Medium (>70% conventional), Low (unstructured commit messages).**

## Three-Tier Confidence Model

- **High Confidence**: Full AST/schema validation passing, deterministic evidence available, verified state.
- **Medium Confidence**: Heuristic analysis or partial indexing; requires agent verification step.
- **Low Confidence**: Inferred or unindexed target; candidate output ONLY, never auto-committed.

## Epistemic Invariant

> Absence of evidence is not evidence of absence. Output is presented as a structured candidate set with confidence scores so caveats cannot be silently dropped downstream.
