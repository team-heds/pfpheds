---
title: Gros Fichiers (Archives)
---

Recommandations pour gérer les fichiers volumineux (vidéos, PDF, archives).

## Stockage recommandé

- **Vidéos**: Vimeo (voir `media/vimeo-config`) ou un CDN vidéo
- **Docs/Images**: Firebase Storage ou Supabase Storage
- **Assets statiques de la doc**: `documentation/static/`

Éviter d’ajouter des gros binaires directement au repo Git.

## Git LFS (optionnel)

Si vous devez versionner des binaires dans Git, utilisez Git LFS:

```bash
git lfs install
git lfs track "*.mp4"
git add .gitattributes
git add <fichiers>
git commit -m "Add assets via LFS"
```

Note: nécessite un hébergement LFS (quotas, coûts). Préférez un stockage objet quand c’est possible.

## Bonnes pratiques

- Ne pas commiter d’archives temporaires ou exports (ajouter au `.gitignore`)
- Pour l’app, charger les médias via URL (Storage/CDN), pas en bundling
- Pour la doc, mettre les images dans `documentation/static/img/` et référencer via `/img/...`

## CI/CD

- Éviter d’uploader des gros artefacts en CI si non nécessaires
- Pour la prod, placer les gros fichiers sur le serveur/Storage et ne pas les inclure dans `dist/` sauf si indispensable
