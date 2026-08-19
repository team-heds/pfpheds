---
name: generate-stories
description: Convert a human-validated Brixtora PRD MVP into traceable end-to-end user stories.
---

# Generate stories

Use only after PRD validation. Inputs: `AGENTS.md` and validated `docs/product/prd.md`. Group stories into epics; include stable ID, actor, statement, value, requirement IDs, preconditions, testable acceptance/error/empty states, authorization/auditability, dependencies, complexity 1-5, and out of scope. Split complexity-5 work; technical layers are tasks, not stories; exclude later phases. Output `docs/product/stories.md`. Validate every MVP requirement is covered and security/visibility/human AI gates are explicit. Stop if PRD validation or material decisions are missing. Do not implement or change unrelated docs.
