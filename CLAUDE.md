# Plateforme HEdS (pfpheds)

Monolithe Vue 3 + Vite (PrimeVue, Pinia, Vue Router) avec backend Express (`backend/`) et données mixtes Firebase / Supabase.
Langue de travail : français (code, commits et docs suivent les conventions existantes).

@AGENTS.md

## Commandes

- Installation : `npm ci && npm --prefix backend ci`
- Dev complet (frontend :5180 + backend :3000) : `npm run dev:full` — toujours via Portly (voir AGENTS.md)
- Build : `npm run build`
- Tests unitaires : `npm run test:unit` (Vitest)
- Tests backend / sécurité : `npm run test:security`
- E2E : `npm run test:e2e` (Playwright)
- Lint : `npm run lint` (attention : applique `--fix`)

## Documentation

La source de vérité est `documentation/` (Docusaurus), pas les README dispersés.
Lire en priorité selon la zone touchée : `documentation/docs/architecture.md`, `frontend/route-catalog.md`, `backend/overview.md`, `data/overview.md`, `domains/*.md`, `ops/vps-operations.md`.

## Conventions git

- Commits conventionnels avec scope : `feat(pfp): …`, `fix(admin): …`, `feat(si): …`, `fix(gamification): …`
- Référencer le ticket quand il existe : `(HEDS25-601)`
- Une branche par sujet ; ne jamais committer sur `prod` directement.
- Ne pas committer `.env*`, `dist/`, `artifacts/`, `.codex-tmp/`.

## Règles de prudence

- Ne jamais lancer de déploiement (`deploy_hedsvs.sh`, `deploy-hedsvs.ps1`) ni toucher la prod Supabase sans demande explicite.
- Migrations Supabase dans `supabase/` / `migrations/` : proposer, ne pas appliquer en prod.
- Les preuves de vérification (captures, logs) vont dans `artifacts/<sujet>-<date>/`.

## UI

Pour tout travail d'interface, utiliser le skill `impeccable` (et les skills `better-*`) dans `.claude/skills/`.
