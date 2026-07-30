# _archive — code retire du build

Ce dossier est volontairement place HORS de `src/` : `useDynamicRoutes.js` fait
`import.meta.glob('@/views/**/*.vue')` et `('@/components/**/*.vue')`, ce qui
embarque dans le build TOUS les fichiers presents sous ces dossiers, meme ceux
qu'aucune route n'atteint. Deplacer un fichier ici le sort donc reellement du
bundle.

## Verification faite avant archivage

Chaque fichier ici a ete verifie sur DEUX plans :
1. aucune reference dans le code (`scripts/audit-dead-files.cjs`) ;
2. aucune reference dans la table `dynamic_routes` en base de production
   (les routes y designent leur composant par une chaine de caracteres, donc
   une vue peut etre utilisee sans apparaitre dans le code).

## Contenu

### views/ — vues sans route (code ni base)
- EnhancedDashboardView.vue — dashboard abandonne
- PlaceManagementView.vue — doublon de la gestion des places
- VotationResultsView.vue — remplace par les vues PHYFP
- ComposeNew.vue / MailTypes.vue — module mail jamais branche
- MobileChatLayout.vue — chat mobile orphelin
- MobileSearchView.vue — orphelin
- AlpinPhysioAdminView.vue — admin d'un module associatif

### composables/
- useDebounce.js — jamais importe

### components/tiptap-react-template/
Template TipTap **React** (103 fichiers .jsx) depose dans un projet Vue et
jamais importe. L'editeur reellement utilise est
`src/components/editor/notes/TiptapSimpleEditor.vue`, base sur `@tiptap/vue-3`.
Sa suppression a permis de retirer `@tiptap/react` et 4 extensions inutilisees.

## Restauration

Remettre le fichier a son emplacement d'origine sous `src/` suffit.
