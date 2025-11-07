---
title: Encodage .env
---

Corriger les problèmes d’encodage du fichier `.env` (variables non lues, caractères espacés, erreurs Vite/Firebase).

## Symptômes

- Variables affichées lettre par lettre (`V I T E _ F I R E B A S E ...`)
- `FIREBASE FATAL ERROR: Can't determine Firebase Database URL`
- Auth Firebase non initialisée (« Component auth has not been registered yet »)
- Variables `import.meta.env` vides en dev

## Causes probables

- `.env` enregistré en UTF‑16/ANSI ou avec BOM
- Copié depuis Word/Teams/email (guillemets typographiques, caractères invisibles)
- Lignes au mauvais format (espaces autour de `=` ou quotes courbes)

## Correctifs

1) Recréer un `.env` propre depuis un modèle

Windows (PowerShell):

```powershell
Copy-Item .env.production.example .env
# ou
Copy-Item .env.supabase.example .env
```

macOS/Linux:

```bash
cp .env.production.example .env
# ou
cp .env.supabase.example .env
```

2) Forcer l’encodage UTF‑8 (sans BOM)

- Ouvrir `.env` dans VS Code → Cmd/Ctrl+Shift+P → « Change File Encoding » → UTF‑8 → Save
- Notepad++: Encodage → Convertir en UTF‑8 (sans BOM)

3) Respecter le format KEY=VALUE

- Pas d’espaces autour de `=`: `VITE_FIREBASE_PROJECT_ID=pfpheds`
- Éviter les guillemets typographiques (“…”) → utiliser `"` si nécessaire
- Un couple par ligne, pas de commentaires inline

4) Purger le cache Vite et relancer

Windows (PowerShell):

```powershell
Remove-Item -Recurse -Force node_modules\.vite
npm run dev
```

macOS/Linux:

```bash
rm -rf node_modules/.vite
npm run dev
```

5) Valider

- Page in‑app: bouton « Diagnostic Firebase » (admin simple modules)
- Console: `src/test-env.js` affiche les variables chargées
- Documentation: voir aussi `troubleshooting/firebase-env`

## Rappels importants

- Vite n’expose que les clés préfixées `VITE_` (ex: `VITE_SUPABASE_URL`)
- `.env` doit être à la racine du projet (même niveau que `package.json`)
- Toujours redémarrer `npm run dev` après modification de `.env`
