---
name: prepare-release
description: Prepare a Brixtora release checklist and evidence without deploying automatically.
---

# Prepare release

Use after validated implementation/review. Inputs: release scope, CI, migrations, env contract, security review, versioning policy. Check CI, migration ordering/rollback, required variable names (not values), review verdict, notes, backup considerations, rollback and post-deploy verification. Output release notes/checklist and unresolved blockers. Validate evidence is exact and contains no secrets. Stop for failed CI, critical findings, absent human approval, destructive migration, credentials, production action, or paid resources. Never deploy, merge, or change unrelated files.
