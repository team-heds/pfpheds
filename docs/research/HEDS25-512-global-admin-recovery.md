# HEDS25-512 — Réinitialisation administrateur pour tous les comptes

## Demande confirmée

Le 21 septembre 2026, l'utilisateur demande que la récupération de mot de passe fonctionne pour tous les comptes, quelle que soit la classe. Aucun envoi collectif automatique n'est demandé.

## Preuves inspectées

- `backend/supabase/passwordRecoveryRequestBackend.js` fournit déjà la demande publique sécurisée : redirection imposée, réponse non énumérable et limitation par IP.
- `src/service/passwordRecoveryService.js` et `src/views/pages/ResetPassword.vue` acceptent lien PKCE/implicite et code OTP, mettent à jour le mot de passe puis ferment la session de récupération.
- `public/auth-email-templates/password-recovery.html` contient désormais le bouton et `{{ .Token }}` ; la copie publiée en production a été vérifiée par empreinte et HTTP 200.
- `src/service/studentInitialAccessService.js` et `backend/supabase/studentInitialAccessService.js` limitent volontairement l'action administrateur aux classes BA26/BAC26. Cette fonction suit le premier accès et ne doit pas être détournée pour les récupérations ultérieures.
- `backend/index.js` monte `adminUsersRoutes` derrière `authenticate` et `requireAdmin`. `backend/supabase/adminUsersBackend.js` est donc le point d'intégration cohérent pour une action ciblée sur un compte.
- Audit production : les 63 BA25 ont un compte Auth confirmé, actif, non banni et déjà utilisé. Le compte de Pernelle est sain ; ses anciennes demandes ont créé une session de récupération, mais aucun événement de changement de mot de passe n'a été enregistré.
- Incident du 21 septembre 2026 : les journaux Auth montrent qu'un scanner Microsoft ouvre automatiquement `ConfirmationURL` avant l'étudiante, crée la session de récupération puis rend le lien et l'OTP inutilisables. Le modèle doit donc suivre l'option OTP recommandée par Supabase : aucun lien direct vers `/auth/v1/verify`, uniquement une page neutre et la saisie manuelle de `{{ .Token }}` avec `{{ .Email }}`.

## Orientation

Ajouter une action administrateur distincte de « premier accès » : elle vise un identifiant de compte, vérifie côté serveur que le profil est actif et que le compte Auth possède une adresse, puis demande à Supabase d'envoyer un lien de récupération. La classe et le rôle ne doivent pas déterminer l'éligibilité. Le navigateur ne transmet ni adresse, ni redirection, ni mot de passe. Les logs contiennent uniquement acteur, cible, identifiant de requête et catégorie générique.

## Risques et tests

- L'endpoint doit rester derrière `requireAdmin`, refuser un UUID invalide, un profil inactif ou un compte Auth absent.
- Aucun secret, adresse ou message SMTP brut ne doit apparaître dans les logs/réponses.
- La limite SMTP Supabase de 60 secondes reste l'autorité anti-relance ; le frontend bloque les doubles clics.
- Aucun email n'est envoyé en masse. Chaque envoi reste une action confirmée pour un compte précis.
- Tests backend du contrôle serveur et tests frontend de l'appel/présentation ; tests complets et build avant livraison sur test puis production.
