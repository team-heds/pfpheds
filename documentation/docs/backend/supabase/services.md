---
title: Supabase Services
---

Organisation des accès Supabase par services/stores pour une UI claire et testable.

## Client

- Client centralisé: `src/supabase.js`
- Importer `supabase` dans des services (ou directement dans des stores Pinia).

## Pattern recommandé

1) Créer un service par domaine (ex: `placesService`, `institutionsService`)
2) L’injecter dans un store Pinia pour l’état et le cache
3) Les vues consomment uniquement le store

## Exemple: lire des lignes

```js
import { supabase } from '@/supabase.js'

export async function listPlaces() {
  const { data, error } = await supabase
    .from('places')
    .select('*')
    .order('NomPlace', { ascending: true })
  if (error) throw error
  return data || []
}
```

## Mise à jour

```js
export async function updatePlace(id, patch) {
  const { data, error } = await supabase
    .from('places')
    .update(patch)
    .eq('PlaceId', id)
    .select()
  if (error) throw error
  return data?.[0]
}
```

## Bonnes pratiques

- Centraliser les appels HTTP dans des services
- Gérer les erreurs (toasts/logs) côté store ou vue
- Respecter les policies RLS: filtrer côté requête (pas de post-filtrage en front)
- Paginer côté requête si jeux de données volumineux
