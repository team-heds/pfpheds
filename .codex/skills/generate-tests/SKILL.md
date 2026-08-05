---
name: generate-tests
description: Add focused tests for one validated Brixtora ticket without changing product scope.
---

# Generate tests

Use for one validated ticket. Inputs: issue, plan, implementation, test conventions, risks. Map acceptance/risk to tests; prioritize business rules, permissions, isolation, trust boundaries, and regressions; add the smallest stable tests; run them and report gaps. Output focused tests and necessary test-only fixtures. Validate failures would be meaningful and avoid implementation-detail coupling. Stop if production behavior must change beyond testability or scope is unclear. No unrelated refactor or feature work.
