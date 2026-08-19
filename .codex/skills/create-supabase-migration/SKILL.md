---
name: create-supabase-migration
description: Create append-only, tenant-safe Supabase schema changes and isolation tests.
---

# Create Supabase migration

Use for a validated schema ticket. Inputs: issue/plan, architecture, current migrations/types. Inspect history; create a new migration with tables, constraints/indexes, RLS/policies; derive ownership from membership; add cross-organization and cascade tests; document rollback risk; regenerate types; validate locally without production. Output migration, tests, types, docs. Validate RLS on every authenticated business table. Stop for production access, applied-file edits, deletion/irreversible conversion, weaker authorization, or ambiguous ownership. Never modify unrelated schema/code.
