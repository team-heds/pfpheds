---
title: Test Supabase
---

Vérifier la configuration et la connectivité Supabase.

## 1) Vérifier les variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_KEY`

Présentes dans `.env` et lues dans `src/supabase.js`.

## 2) Outil de diagnostic (in‑app)

- Ouvrir la route: `/admin/supabase-diagnostic`
- Affiche la session et exécute des tests simples (lecture/erreur)

## 3) Requête de test (exemple)

```js
import { supabase } from '@/supabase.js'

async function testSupabase() {
  const { data, error } = await supabase
    .from('places')
    .select('PlaceId', { count: 'exact', head: true })
  console.log('count:', data, 'error:', error)
}

testSupabase()
```

Exécuter dans un composant/vue de test ou une page sandbox.

## 4) Erreurs fréquentes

- URL mal formée (contient `/rest/v1`) → `src/supabase.js` normalise l’URL
- Clés manquantes → remplir `.env`, redémarrer `npm run dev`
