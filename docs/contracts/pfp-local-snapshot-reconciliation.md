# Rapprochement local du snapshot PFP2 BA25

La commande `pfp:reconcile-snapshot` rapproche quatre fichiers locaux sans appeler Supabase :

- le classeur officiel de répartition BA25 ;
- un export CSV de `user_profiles` ;
- un export CSV de `StudentsPhysio` ;
- un export CSV de `RepondantPhysioHES`.

## Colonnes minimales

`user_profiles` doit contenir `user_id`, `family_name`, `forname`, `classe`, `is_active`, `role` et `permissions`. Les alias français Nom/Prénom et `class` sont acceptés. Le filtre étudiant réutilise la règle de l'application afin qu'un profil admin ou enseignant ne soit jamais compté comme étudiant, même s'il porte une ancienne permission étudiante. `StudentsPhysio` doit contenir `user_id`, `class` et `repondant_hes`. Le registre des répondants doit contenir `first_name`, `last_name` et `is_active`.

Le rapprochement classeur/profils utilise uniquement Nom + Prénom après normalisation de la casse, des accents et des espaces. Il n'effectue aucune correspondance approximative. Zéro ou plusieurs profils correspondants produisent une anomalie. Les autres contrôles continuent ensuite par `user_id`.

Une différence de répondant entre le classeur et `StudentsPhysio`, un profil BA25 absent du classeur, une classe divergente, un compte inactif ou un répondant non actif bloque le bilan. La sortie contient seulement des totaux, des codes d'anomalie, les numéros de lignes Excel concernés et les empreintes des fichiers. Elle ne contient ni nom, ni email, ni `user_id`.

## Exhaustivité

La commande reste bloquante par défaut. `--exports-complete` doit être ajouté uniquement lorsque les trois exports contiennent toutes les lignes de leur table et n'ont pas été tronqués par l'interface ou la pagination. Ce drapeau atteste le mode d'export, pas la validité des données.

```sh
npm run pfp:reconcile-snapshot -- \
  --workbook=/chemin/repartition.xlsx \
  --profiles=/chemin/user_profiles.csv \
  --physio=/chemin/StudentsPhysio.csv \
  --respondents=/chemin/RepondantPhysioHES.csv \
  --exports-complete
```

Même avec un rapprochement parfait, `campaignReady` reste faux. Les offres, périodes, règles métier et résultats de simulation sont des contrôles séparés.
