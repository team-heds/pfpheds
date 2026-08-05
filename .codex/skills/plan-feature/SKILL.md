---
name: plan-feature
description: Create a small ordered implementation plan that requires explicit human validation.
---

# Plan feature

Use after research. Inputs: issue, `AGENTS.md`, research, architecture, ADRs. Output `docs/plans/<ticket-id>.md` starting with `---`, `ticket: BRX-000`, `validated: no`, `---`. For each unchecked task state objective, expected files, allowed/forbidden boundaries, tests, validation command, security and rollback considerations. Identify migrations/RLS/storage/public routes/AI/dependencies/destructive risks. Validate complete acceptance-criteria mapping and executable ordering. Stop for missing research, conflicts, or material ambiguity. Never set validation to yes, write application code, or change unrelated files.
