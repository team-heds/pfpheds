---
name: design-architecture
description: Design secure Brixtora architecture from validated product artifacts without feature code.
---

# Design architecture

Use after stories pass review. Inputs: `AGENTS.md`, PRD, stories, review, repository/config. Define modules, routes, server/client boundaries, repositories/services/schemas, tenant/auth/RLS, portal tokens, private storage, questionnaire, AI draft lifecycle/traceability, approvals, project/change workflows, audit/notifications, testing, observability, rate limits, privacy, accessibility, deployment/migrations/backups/threats. Evaluate—not blindly adopt—proposed tables; separate MVP/later. Output concern documents in `docs/architecture/` and ADRs for material alternatives. Validate coverage and threat controls. Stop for unresolved security ownership or significant options needing human choice. No code/resources/deployment/unrelated changes.
