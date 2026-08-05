---
name: analyze-codebase
description: Research one Brixtora ticket against verified repository evidence before planning.
---

# Analyze codebase

Use before planning any non-trivial ticket. Inputs: ticket/issue, `AGENTS.md`, product/architecture docs, ADRs, and repository. Map folders, entry points, scripts/config; trace one representative feature end to end; identify naming, validation, data-access, authorization, and test conventions; open every named file/symbol; record integration points, dependencies, risks, and unresolved questions. Never modify code, propose a rewrite, or make unrelated recommendations. Output `docs/research/<ticket-id>.md`. Validate that all claims cite inspected paths and the document covers security/tests. Stop for missing/conflicting requirements, inaccessible sources, secrets, production access, or destructive work.
