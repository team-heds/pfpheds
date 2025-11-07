---
title: Guide de style de la documentation
sidebar_label: Guide de style (Docs)
---

Ce guide donne des règles simples pour écrire la documentation.

## Titres et structure

- Un `title` clair dans le frontmatter
- Introduction courte puis sections H2/H3
- Utiliser des listes courtes et des exemples concis

## Code et commandes

- Utiliser des *fences* avec la langue (ex: `bash`, `js`, `vue`)
- Préférer les **Tabs** pour npm/pnpm/yarn quand c’est pertinent
- Pour les commandes, utiliser `bash` afin de bénéficier du style doré

## Admonitions

- Utiliser des notes pour attirer l’attention: 

```md
:::note
Info utile ou prérequis
:::
```

## Liens internes

- Référencer les pages via leurs chemins (ex: `devops/overview`)
- Vérifier qu’une page existe avant d’ajouter un lien dans la sidebar

## Style graphique

- La sidebar est compacte (largeur ~180px), gardez des titres courts
- Éviter les pavés de texte, privilégier les sections

## Mermaid

- Pour des schémas d’architecture simples, utiliser Mermaid (voir `developing/architecture-diagrams`)
