---
name: fix-ci
description: Diagnose and repair a failing Brixtora CI check with the smallest justified change.
---

# Fix CI

Use for an identified failing run. Inputs: run/check logs, branch diff, config, `AGENTS.md`. Inspect exact job and first root cause; reproduce locally; make only the necessary fix; rerun the affected command then relevant validation; report evidence. Output minimal code/config/test change. Validate no quality gate was weakened. Stop for secrets, production/deployment, unrelated failures, or ambiguous broad fixes. Never suppress tests, add required-check `continue-on-error`, or make unrelated changes.
