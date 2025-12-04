# Protection des Routes de Votation PFP

## 🔒 Système de Sécurité

Les routes de votation PFP1A et PFP1B sont maintenant protégées pour empêcher l'accès croisé entre les cohortes.

## 📋 Fonctionnement

### Routes Protégées

- `/votation` (PFP1A) - Ligne 532 dans `router.js`
- `/votation_pfp1b` (PFP1B) - Ligne 570 dans `router.js`

### Vérifications Effectuées

Le système vérifie automatiquement le profil de l'utilisateur connecté et teste plusieurs champs possibles :

**Pour PFP1A** :
```javascript
profile?.pfp1a === true
profile?.pfp1a === 1
profile?.pfp === 'PFP1A'
profile?.pfp_cohort === 'PFP1A'
profile?.cohort === 'PFP1A'
```

**Pour PFP1B** :
```javascript
profile?.pfp1b === true
profile?.pfp1b === 1
profile?.pfp === 'PFP1B'
profile?.pfp_cohort === 'PFP1B'
profile?.cohort === 'PFP1B'
```

## 🎯 Configuration Requise

### Structure de la Table `user_profiles`

Pour que le système fonctionne, votre table `user_profiles` dans Supabase doit contenir **au moins un** de ces champs :

1. **Option 1** : Champs booléens séparés
   ```sql
   pfp1a BOOLEAN DEFAULT FALSE
   pfp1b BOOLEAN DEFAULT FALSE
   ```

2. **Option 2** : Champ texte unique
   ```sql
   pfp TEXT -- Valeurs possibles: 'PFP1A', 'PFP1B'
   ```

3. **Option 3** : Champ cohort
   ```sql
   pfp_cohort TEXT -- Valeurs possibles: 'PFP1A', 'PFP1B'
   cohort TEXT -- Alternative
   ```

## ⚠️ Comportement en Cas de Refus

Lorsqu'un utilisateur tente d'accéder à une page non autorisée :

1. **Log console** : Message d'avertissement avec le profil détecté
2. **Redirection** : Vers le Dashboard (`/admin/dashboard`)
3. **Toast notification** : Message d'erreur affiché automatiquement
4. **SessionStorage** : Erreur stockée temporairement pour affichage

### Message d'Erreur Affiché

```
❌ Accès refusé
Vous n'avez pas l'autorisation d'accéder à la votation PFP1A/PFP1B.
Votre profil ne correspond pas à cette cohorte.
```

## 🔧 Fichiers Modifiés

### 1. `router.js`
- Ajout de `beforeEnter` guards sur les routes de votation
- Import de `useUserStore` pour accéder au profil
- Tests multiples pour flexibilité de la structure de données

### 2. `composables/useRouteErrors.js` (nouveau)
- Composable pour afficher les erreurs de navigation
- Lecture du sessionStorage
- Affichage automatique de toasts PrimeVue

### 3. `views/admin/DashboardView.vue`
- Intégration de `useRouteErrors()`
- Affichage automatique des erreurs de redirection

## 📝 Logs de Debug

Les logs suivants sont affichés dans la console :

**Accès autorisé** :
```
✅ Accès autorisé à la votation PFP1A
```

**Accès refusé** :
```
❌ Accès refusé à la votation PFP1A - Profil: PFP1B
```

**Affichage du toast** :
```
📢 Erreur de route affichée: {message: "Accès refusé", ...}
```

## 🚀 Test du Système

Pour tester le système :

1. **Connectez-vous** avec un compte utilisateur
2. **Vérifiez votre profil** dans la console :
   ```javascript
   // Dans la console navigateur
   const userStore = useUserStore();
   console.log('Mon profil:', userStore.profile);
   ```
3. **Tentez d'accéder** directement à `/votation` ou `/votation_pfp1b`
4. **Observez** :
   - Si accès autorisé : vous arrivez sur la page
   - Si accès refusé : redirection + toast d'erreur

## 🔄 Adaptation selon votre Structure

Si votre structure de données est différente, modifiez les conditions dans `router.js` :

```javascript
// Ligne 548-553 pour PFP1A
const hasPfp1aAccess = 
  profile?.VOTRE_CHAMP === VOTRE_VALEUR ||
  profile?.AUTRE_CHAMP === 'PFP1A';

// Ligne 587-592 pour PFP1B  
const hasPfp1bAccess = 
  profile?.VOTRE_CHAMP === VOTRE_VALEUR ||
  profile?.AUTRE_CHAMP === 'PFP1B';
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs de la console
2. Inspectez la structure de `userStore.profile`
3. Adaptez les conditions de vérification si nécessaire
4. Vérifiez que le profil est bien chargé avant la navigation

## ✅ Checklist de Configuration

- [ ] Table `user_profiles` contient un champ de cohorte PFP
- [ ] Les utilisateurs ont leur cohorte PFP définie dans leur profil
- [ ] Les routes protégées sont testées
- [ ] Les toasts d'erreur s'affichent correctement
- [ ] La redirection fonctionne vers le Dashboard
