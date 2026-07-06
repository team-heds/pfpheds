# Planning admin

Ce dossier regroupe les vues admin liées au planning.

Vues importantes :

- `PlanningAdminView.vue`
- `WeeklyPlanningAdminView.vue`
- `AnnualPlanningView.vue`

Couplages principaux :

- `src/service/planningService.js`
- tables / flux Supabase et couches historiques décrites dans la doc centrale

Documentation à lire en priorité :

- `documentation/docs/domains/planning-soins.md`
- `documentation/docs/frontend/route-catalog.md`
- `documentation/docs/frontend/services-catalog.md`
- `documentation/docs/frontend/stores-services-map.md`
- `documentation/docs/backend/frontend-backend-traceability.md`

En cas de bug :

1. vérifier la vue concernée ;
2. vérifier `planningService.js` ;
3. vérifier le contrat de données attendu ;
4. vérifier les routes admin `/admin/planning/*`.

Ce README est volontairement court. La source de vérité est Docusaurus.
