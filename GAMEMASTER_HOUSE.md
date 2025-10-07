# 🎮 MAISON MAÎTRE DU JEU - Configuration

## 🎯 CONCEPT

Créer une **5ème maison spéciale** pour les administrateurs/maîtres du jeu :
- Accès admin complet
- Vue d'ensemble de tout le système
- Pas dans le classement normal
- Couleur distinctive (violet/pourpre royal)

---

## 📊 CARACTÉRISTIQUES

### **Maison : Game Master**

| Propriété | Valeur |
|-----------|--------|
| **Nom** | `gamemaster` |
| **UUID** | `550e8400-e29b-41d4-a716-446655440000` |
| **Couleur** | `#9333ea` (Violet royal) |
| **Devise** | "Voir tout, gérer tout" |
| **Description** | Maison spéciale réservée aux maîtres du jeu |

---

## 🚀 INSTALLATION

### **ÉTAPE 1 : Créer la maison**

**Exécute dans Supabase** :
```sql
-- Copie le contenu de add_gamemaster_house.sql
-- Ou juste cette partie :

INSERT INTO houses (id, name, color, motto, description, total_xp, member_count, level, created_at, updated_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'gamemaster',
  '#9333ea',
  'Voir tout, gérer tout',
  'Maison spéciale réservée aux maîtres du jeu et administrateurs',
  0, 0, 1, NOW(), NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  color = EXCLUDED.color,
  motto = EXCLUDED.motto;
```

**✅ Résultat** : 5 maisons au total (Harmonis, Elaris, Doloris, Solencia, GameMaster)

---

### **ÉTAPE 2 : Assigner un admin**

**Pour te donner les droits Game Master** :

```sql
-- 1. Trouver ton user_id
SELECT user_id, email FROM gamification_data WHERE email LIKE '%ton-email%';

-- 2. T'assigner à la maison Game Master
UPDATE gamification_data
SET house_id = '550e8400-e29b-41d4-a716-446655440000'
WHERE user_id = 'TON-USER-ID';

-- 3. Vérifier
SELECT 
  g.email,
  h.name as maison,
  h.color,
  h.motto
FROM gamification_data g
JOIN houses h ON g.house_id = h.id
WHERE g.user_id = 'TON-USER-ID';
```

---

## 🎨 DESIGN VISUEL

### **Couleur Distinctive**

```css
/* Violet royal pour Game Master */
background: #9333ea;
background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);

/* Effet brillant */
box-shadow: 0 0 30px rgba(147, 51, 234, 0.5);
```

### **Icône Suggérée**
- 👑 Couronne
- 🎮 Manette de jeu
- ⚡ Éclair
- 🔮 Boule de cristal

---

## 🔧 INTÉGRATION CODE

### **Mettre à jour `gamificationServiceSupabase.js`**

Ajouter Game Master dans les configurations :

```javascript
const HES_HOUSES = {
  harmonis: { /* ... */ },
  elaris: { /* ... */ },
  doloris: { /* ... */ },
  solencia: { /* ... */ },
  gamemaster: {
    name: 'gamemaster',
    displayName: 'Maître du Jeu',
    color: '#9333ea',
    motto: 'Voir tout, gérer tout',
    description: 'Maison spéciale des administrateurs',
    isAdmin: true  // 👈 Flag spécial
  }
}
```

---

## 🎯 FONCTIONNALITÉS FUTURES

### **Ce qu'on pourra faire avec la maison Game Master** :

1. **Dashboard Admin** 🎮
   - Vue d'ensemble de toutes les maisons
   - Statistiques globales
   - Graphiques temps réel

2. **Gestion Utilisateurs** 👥
   - Voir tous les étudiants
   - Modifier XP/niveaux
   - Changer de maison

3. **Gestion Système** ⚙️
   - Créer badges
   - Créer quêtes/défis
   - Gérer événements

4. **Monitoring** 📊
   - Activité en temps réel
   - Logs d'actions
   - Alertes système

5. **Exclusion Classement** 🏆
   - Game Master pas dans le classement normal
   - Stats séparées pour admins

---

## 🔒 SÉCURITÉ

### **Vérifier les droits dans le code** :

```javascript
// Fonction helper
const isGameMaster = (userHouse) => {
  return userHouse === 'gamemaster'
}

// Utilisation
if (isGameMaster(userGamification.maison)) {
  // Afficher dashboard admin
  router.push('/gamemaster/dashboard')
} else {
  // Afficher profil normal
  router.push('/gamification')
}
```

---

## 📋 CHECKLIST D'INSTALLATION

- [ ] Exécuter `add_gamemaster_house.sql`
- [ ] Vérifier que 5 maisons existent
- [ ] Assigner ton compte à Game Master
- [ ] Tester l'affichage dans l'app
- [ ] Vérifier la couleur violette apparaît
- [ ] Game Master pas dans classement normal

---

## 🎨 STRUCTURE FINALE

### **5 Maisons au Total** :

```
1. Harmonis   (#28a745) - L'équilibre soigne
2. Elaris     (#dc3545) - Clarifier, guider, apaiser
3. Doloris    (#ffc107) - Comprendre la douleur
4. Solencia   (#007bff) - Apaiser pour mieux guérir
5. GameMaster (#9333ea) - Voir tout, gérer tout ⭐
```

---

## 🚀 PROCHAINES ÉTAPES

Après avoir créé la maison :

1. **Mettre à jour le service** pour reconnaître Game Master
2. **Créer routes admin** (`/gamemaster/*`)
3. **Dashboard Game Master** avec toutes les stats
4. **Filtrer classement** pour exclure Game Master
5. **Permissions spéciales** dans l'app

---

**Exécute maintenant `add_gamemaster_house.sql` pour créer la maison !** 🎮✨
