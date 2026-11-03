# Se connecter et tester HEdS

## Voir la base de test

Ouvrir http://localhost:8181/project/default, puis saisir les identifiants de `studio-access.json` (pas le mot de passe commun étudiant). Dans **Table Editor**, choisir `StudentsPhysio` pour les étudiants, `user_profiles` pour les profils, `places` pour les places ou `votation_sessions` pour les sessions. **Authentication** affiche les comptes de connexion.

Laisser le tunnel `PlateformeHEdS/studio-test-tunnel` actif dans Portly. Sans ce tunnel, l'adresse locale ne répond pas. Cet accès admin permet aussi de modifier la base de test : rester en consultation pour une simple vérification. La configuration et la connexion à la base `staging` ont été contrôlées.

## Accès actuel — données réelles copiées

Depuis le 15 septembre 2026, utiliser **son email habituel** avec le **mot de passe commun de test** dans `real-test-access.json`. Les rôles ont été conservés. Les étapes ci-dessous qui citent `admin.test@example.invalid` et `ba25.test.*` sont historiques : ces comptes ne sont plus dans la base active.

1. Ouvrir https://test.hedsvs.ch depuis le réseau autorisé (IP publique `153.109.1.101`). Un refus 403 depuis un autre réseau est une protection volontaire, pas un mauvais mot de passe.
2. Garder les identifiants de `web-access.json` pour la première fenêtre d'accès équipe.
3. Se déconnecter d'une éventuelle ancienne session dans l'application, puis utiliser l'email du compte réel et le mot de passe du fichier privé `real-test-access.json`.
4. Pour simuler un étudiant, utiliser son email dans une fenêtre privée avec le même mot de passe de test. Ne jamais essayer ce mot de passe sur www.hedsvs.ch.

Les données sont réelles : ne pas partager les accès ni publier de captures contenant les informations personnelles. Aucun changement du test ne remonte automatiquement vers la production. Les emails restent capturés et les votations sont fermées à la livraison.

## Pilote gamification HEDS25-617

Le pilote gamification utilise deux comptes entièrement fictifs et distincts
des comptes copiés. Leurs identifiants privés se trouvent dans
`gamification-pilot-accounts.json`, ignoré par Git et lisible seulement sur
cette machine. Ne jamais copier les mots de passe dans Jira, un commit ou une
capture d'écran.

Procédure :

1. Garder `PlateformeHEdS/staging-tunnel` actif dans Portly.
2. Préparer ou réparer les deux comptes avec
   `node deploy/staging/prepare-gamification-pilot-accounts.mjs`.
3. Exécuter la preuve reproductible avec
   `node deploy/staging/run-gamification-pilot.mjs`. La commande effectue deux
   cycles complets puis laisse un pilote propre installé pour les essais. Le
   lot canonique conserve automatiquement ses dates d'origine afin de rester
   relançable. Pour un nouveau lot, fournir `HEDS_PILOT_BATCH`,
   `HEDS_PILOT_START` et `HEDS_PILOT_END`.
4. Vérifier les interfaces avec
   `node deploy/staging/check-gamification-pilot-browser.mjs`.
5. Pour repartir de zéro, relancer le scénario : le reset est borné aux UUID et
   objets enregistrés pour le lot `heds25-617-pilot-v1`.

Les commandes de validation longues doivent être lancées avec `portly temp`.
Le pilote ne contacte ni Firebase ni la production, n'envoie aucun email réel
et n'émet aucune notification push. Connexion, profil, publication, défi,
badge, quête complète, plafond et rejeu sont couverts. L'expiration est validée
par la suite SQL d'isolation, séparément du double cycle fonctionnel.

**Historique de préparation avec comptes fictifs ci-dessous.**

## Accès administrateur

1. Ouvrir https://test.hedsvs.ch.
2. Si le navigateur demande des identifiants, utiliser `username` et `password` du fichier privé `web-access.json`, dans ce dossier. Ce premier accès protège le site de test ; ce n'est pas le compte applicatif.
3. Dans le formulaire de connexion HEdS, utiliser `admin.test@example.invalid` et le champ `password` de l'entrée correspondante dans `test-accounts.json`.
4. Ne pas utiliser le mot de passe du compte de production. Si une session étudiant est ouverte, se déconnecter de l'application avant de se connecter comme administrateur.

Connexion et accès à l'API d'administration vérifiés le 15 septembre 2026 (HTTP 200). Cette vérification ne valide pas encore tous les écrans.

## Tester comme étudiant

Garder l'administrateur dans une fenêtre normale. Ouvrir une fenêtre privée ou un autre navigateur, passer le même accès équipe, puis se connecter avec un des comptes `ba25.test.*@example.invalid` du fichier `test-accounts.json`.

Les comptes sont fictifs mais disposent de vraies connexions sur la base de test. Les identifiants sont privés : ne pas les ajouter à Git, aux tickets Jira ou à une documentation publique.

## Scénario de votation

Préparer uniquement sur le domaine de test une campagne portant le préfixe `TEST`. Vérifier cohorte BA25, PFP2, année académique 2026-2027, dates, population et offres avant ouverture. Ne pas confondre année académique et clé d'année civile des capacités : ne pas modifier cette dernière au hasard.

Tester successivement la préparation administrateur, les choix de plusieurs étudiants fictifs, puis le contrôle administrateur et l'attribution. Ajouter ensuite des cas particuliers explicites (prioritaire/lésé, non-votant, non-éligible, manque de places). Ne pas considérer ces scénarios comme déjà présents ou validés.

Limite connue : la lecture des résultats présente une erreur SQL `get_algorithm_results`. Corriger ce point avant de valider le parcours complet. Aucun email ne part aux étudiants : les messages sont capturés dans Mailpit, accessible par le tunnel privé sur http://localhost:8025.

## Circuit de développement

Ticket → branche `codex/HEDS25-xxx-description` → vérifications locales → publication d'une version identifiée sur test → validation humaine → publication de cette même version en production.

Ce circuit est une convention de travail, pas un déploiement automatique déjà configuré. Une branche est du code, pas une base de données. Vérifier la cible Supabase et le backend avant de démarrer en local : `localhost` ne garantit pas une base de test.

Le test utilise une instance Supabase séparée sur le VPS. Son interface Studio n'est pas installée : l'ancien Studio ne représente pas cette base. La production reste sur https://www.hedsvs.ch. Ne jamais transférer les comptes, votes ou attributions fictifs vers la production ; seuls le code et les changements de structure validés doivent y être promus.

À terminer : correction SQL des résultats, bandeau visible d'environnement/version, scénario reproductible avec cas particuliers et procédure de publication formalisée. Ces éléments ne sont pas rendus disponibles par la seule vérification de connexion administrateur.
