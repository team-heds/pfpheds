---
name: review-security
description: Perform an authorized, non-destructive security review of a Brixtora repository or diff.
---

# Review security

Use when a ticket/diff is authorized for review. Inputs: scope, threat/architecture docs, code/diff, tests. Read only; inspect authentication, authorization, tenant/RLS, tokens, secrets, uploads/signed URLs, injection/sanitization, rate limits, logging, AI minimization, dependencies, public endpoints, mass assignment, and IDOR. Output prioritized findings with evidence, impact, and remediation guidance. Validate scope and avoid unsupported claims. Stop for external exploitation, destructive testing, credentials, production access, or scope ambiguity. Never modify code or unrelated files.
