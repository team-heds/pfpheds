# HEDS25-629 — Déploiement test

Date : 2026-09-29

## Environnement

- Cible : `https://test.hedsvs.ch`
- Base : staging/test inchangée
- Production : non modifiée

## Artefact

- Build isolé avec les variables staging via `deploy/staging/build-current-test.mjs`.
- Empreinte SHA-256 de `index.html` : `d68e9a3618fd326c0d812bb6aa2874d06fc01cef90ff1fc5421f392a0a7b8a2b`.
- Sauvegarde frontend : `/opt/pfpheds-staging/backups/frontend-dist-before-HEDS25-629-20260929-120843`.

## Vérifications

- Dashboard secrétariat SI : année `2026-2027`, 11 classes, données chargées.
- Cours en postulation : année `2026-2027` visible, résultats limités au périmètre actif.
- Feuille de charges : année `2026-2027` visible.
- Planning journalier : année `2026-2027` visible, 45 créneaux pour la semaine contrôlée.
- Réponse HTTP publique attendue : `401` derrière la protection d’accès test.

## Retour arrière

Restaurer le contenu de la sauvegarde frontend ci-dessus dans `/opt/pfpheds-staging/frontend-dist`. Aucune restauration de base de données n’est requise pour ce ticket.

