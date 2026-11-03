# HEDS25-637 — Validation des tests métier et permissions SI

Date : 29 septembre 2026  
Environnement dynamique : `https://test.hedsvs.ch` et base Supabase `staging`  
Production : inchangée

## Résultats

### Tests unitaires et métier

- 9 fichiers exécutés ;
- 48 tests réussis sur 48 ;
- matrice AdminSoins / RMSoins / EnseignantSoins / EtudiantSoins / super.all ;
- année académique partagée, changement forcé et récupération après erreur ;
- agrégations des dashboards ;
- qualité planning, dont horaire invalide distinct d'un horaire absent ;
- catalogue de postulation ;
- identités enseignants canoniques, inconnues et ambiguës ;
- calcul de charge sans fusion arbitraire d'identités.

### Politiques RLS des votes SI

Le test `supabase/tests/si_postulation_votes_isolation.sql` a été exécuté sur la base `staging` dans une transaction annulée.

- enseignant actif : lecture, création et mise à jour de son propre vote ;
- enseignant actif : refus de modifier, supprimer ou créer le vote d'un tiers ;
- enseignant désactivé : aucune lecture ni création ;
- compte hors SI : aucune lecture, création, modification ou suppression ;
- RMSoins : lecture et suppression limitées à ses modules, sans création ni modification de vote ;
- administrateur : lecture globale et suppression autorisée, modification du vote enseignant refusée ;
- rôle anonyme : aucun privilège sur la table ;
- résultat final : `si_postulation_votes_isolation_ok` suivi de `ROLLBACK`.

### Smoke test navigateur

- une route SI protégée refuse le visiteur anonyme ;
- Dashboard Secrétariat SI chargé ;
- Dashboard RM chargé ;
- Vue journalière chargée ;
- Feuille de charges chargée ;
- Cours en postulation chargé ;
- erreurs JavaScript : 0 ;
- réponses serveur 5xx : 0 ;
- mutations déclenchées à l'ouverture : 0.

## Commande reproductible

```bash
./deploy/staging/test-heds637.sh
```

La commande doit être lancée comme tâche temporaire Portly conformément aux règles du dépôt.
