---
name: review-stories
description: Independently review Brixtora stories against the PRD in read-only mode.
---

# Review stories

Use in fresh context after story generation. Inputs: `AGENTS.md`, PRD, stories. Read only; check all MVP coverage, missing journeys, duplicates/overlap, later leakage, untestable/loading/empty/error criteria, permissions, tenant and developer/client visibility, AI approval gates, traceability, dependency order, size, change control, file security, and accidental Jira scope. Output `docs/reviews/stories.md`, classifying critical/major/minor. Validate findings cite story/requirement IDs. Stop if sources are absent or inconsistent. Never fix files or make unrelated changes. End exactly:
`Max severity: critical|major|minor|none`
`Stories ready: yes|no`
