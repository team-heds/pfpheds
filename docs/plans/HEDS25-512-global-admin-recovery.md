---
ticket: HEDS25-512
validated: yes
---

# Extension — récupération administrateur pour tous les comptes

- [x] **1. Ajouter l'endpoint administrateur ciblé.** Créer `backend/supabase/adminPasswordRecoveryBackend.js`, ses tests et le monter dans `backend/index.js` derrière `authenticate` + `requireAdmin`. La cible est un UUID ; le serveur charge le profil actif et l'adresse depuis Auth, impose `/reset-password?flow=recovery`, appelle Supabase et renvoie seulement un état générique. Interdit : adresse/redirection/mot de passe reçus du navigateur, secret dans les logs, envoi collectif. Validation : tests backend via Portly. Rollback : retirer la route additive.

- [x] **2. Ajouter l'action dans la liste des comptes.** Créer un petit service frontend et adapter `src/views/admin/users/UserListView.vue` pour afficher « Réinitialiser l'accès » pour tout profil actif, indépendamment de la classe, avec confirmation, chargement anti-double-clic et message générique. Conserver séparément le suivi « premier accès » BA26. Validation : tests Vitest ciblés via Portly. Aucune donnée sensible nouvelle dans le navigateur.

- [x] **3. Vérifier et livrer.** Les suites complètes ont réussi via Portly (backend : 99 tests ; frontend : 1 310 tests dans 122 fichiers), ainsi que l'ESLint ciblé et les builds isolés. La recette sur `test.hedsvs.ch` a confirmé les protections 401/400/409 sans envoyer d'email et l'action visible sur plusieurs classes. Le même code a ensuite été déployé en production avec sauvegarde préalable. La santé du backend, le frontend, le modèle OTP et l'action « Réinitialiser l'accès » ont été vérifiés en production, notamment sur le compte BA25 de Pernelle. Aucun email n'a été déclenché pendant la recette.

## Validation humaine

Le périmètre a été confirmé par l'utilisateur le 21 septembre 2026 : « règle le souci pour tous les comptes, n'importe la classe ». Cette confirmation autorise la généralisation ciblée, mais pas un envoi collectif.
