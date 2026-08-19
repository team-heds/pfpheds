---
name: review-changes
description: Independently review a Brixtora ticket diff and produce a read-only ship verdict.
---

# Review changes

Use in fresh context after implementation. Inputs: issue, `AGENTS.md`, research, validated plan, architecture/ADRs, diff against base. Verify acceptance criteria, plan/scope, types, server/client boundaries, input validation, auth/RLS/tenant isolation, token/file/AI security, states/accessibility, tests/regressions, secrets/logging/dependencies. Run non-destructive checks; do not fix. Output `docs/reviews/<ticket-id>.md` with critical/major/minor findings and cited paths. Validate exact commands/results. Stop if inputs/base are unavailable. No unrelated changes. End exactly:
`Max severity: critical|major|minor|none`
`Ship allowed: yes|no`
Any critical finding requires `Ship allowed: no`.
