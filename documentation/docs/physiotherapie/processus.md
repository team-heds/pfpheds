---
title: Processus — Formation pratique
sidebar_label: Processus FP
---

Ce guide décrit le processus de gestion des lieux de formation pratique pour la filière Physiothérapie.

## 1) Pré-requis

- Rôles/permissions configurés (accès admin requis)
- Variables `.env` valides (Firebase/Supabase)
- Données de base vérifiées (Institutions)

## 2) Institutions

- Créer/mettre à jour les institutions (nom, adresse, canton, coordonnées GPS)
- Ajouter URL et contacts (responsable physio, email/téléphone)

## 3) Places de formation

- Créer les places rattachées à une institution
- Renseigner catégories (AIGU, REHAB, AMBU, MSQ, SYSINT, NEUROGER)
- Renseigner langues (FR, DE, IT, EN)
- Configurer les volumes par année (PFP1A, PFP1B, PFP2, PFP3, PFP4)

## 4) Praticiens formateurs

- Référentiel des PF (Prénom, Nom, Email, Institution)
- Associer des PF aux places si nécessaire

## 5) Documents (PDF)

- Joindre le descriptif du lieu (PDF) — visible côté fiche d’institution
- Vérifier l’accessibilité du lien (public ou URL signée)

## 6) Vérifications

- Carte: la place apparaît-elle correctement ?
- Fiche institution: le PDF apparaît-il ?
- Filtrage/Recherche: nom, canton, institution

## 7) Bonnes pratiques

- Tenir à jour les coordonnées GPS pour un affichage précis sur la carte
- Nettoyer les données (noms cohérents, emails valides)
- Archiver les places obsolètes (au lieu de supprimer si historique nécessaire)

Pour la carte et la navigation, voir `map/overview`, `map/institutions` et `map/places`.
