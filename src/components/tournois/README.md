# 🏆 Système de Tournois Beer Pong

## 📋 Vue d'ensemble

Système complet de gestion de tournois avec **3 formats disponibles** :

### 1. 🏆 **Phase de Poule**
- Tournoi classique avec poules et matchs "tous contre tous"
- Calcul automatique des classements (Points → Goal Average → Buts)
- Idéal pour des tournois sur plusieurs jours avec beaucoup d'équipes

### 2. 🍺 **Bracket (Élimination Directe)**
- Format "Beer Pong Tournament" classique
- Arbre de bracket visuel (Quarts → Demis → Finale)
- Élimination directe : 1 défaite = éliminé
- Champion automatiquement couronné
- Idéal pour tournois rapides et intenses

### 3. 🔥 **Hybride (Poule + Bracket)**
- **Phase 1** : Matchs de poule pour qualifier les meilleures équipes
- **Phase 2** : Bracket final avec les qualifiés
- Combine équité (tout le monde joue) et intensité (phase finale)
- Parfait pour grands événements sur 2-3 jours

---

## 📁 Structure des fichiers

```
src/components/tournois/
├── TournoiDetails.vue    # Détails d'un tournoi (onglets selon type)
├── BracketView.vue        # Visualisation du bracket (arbre graphique)
└── README.md              # Cette documentation

src/views/apps/tools/
└── TournoisView.vue       # Page principale (liste + création)
```

---

## 🎮 Fonctionnalités

### **TournoisView.vue** (Page principale)
- ✅ Création de tournoi avec sélection du type
- ✅ Liste des tournois en cards
- ✅ Badges visuels (type + statut)
- ✅ Sauvegarde automatique en localStorage

### **TournoiDetails.vue** (Vue détaillée)
- ✅ Onglets dynamiques selon le type de tournoi
- ✅ Gestion des matchs (scores, validation)
- ✅ Classements en temps réel
- ✅ Modification des noms d'équipes
- ✅ Statistiques globales (meilleurs buteurs, etc.)
- ✅ **Mode Hybride** : Bouton pour générer le bracket avec les qualifiés

### **BracketView.vue** (Arbre de bracket)
- ✅ Visualisation graphique du bracket
- ✅ Saisie des scores match par match
- ✅ Avancement automatique des gagnants
- ✅ Banner animé pour le champion
- ✅ Modification avec réinitialisation en cascade

---

## 🚀 Utilisation

### **Créer un tournoi**
1. Cliquer sur "Nouveau tournoi"
2. Choisir le type : Poule, Bracket, ou Hybride
3. Définir le nombre d'équipes
4. (Si Poule/Hybride) Définir le nombre de poules
5. Valider → Structure générée automatiquement

### **Gérer un tournoi Bracket**
1. Ouvrir le tournoi
2. Entrer les scores de chaque match
3. Valider → Le gagnant avance automatiquement
4. Continuer jusqu'à la finale
5. Le champion est couronné automatiquement ! 🏆

### **Gérer un tournoi Hybride**
1. **Phase Poule** : Jouer tous les matchs des poules
2. Cliquer sur "🔥 Générer le bracket final"
3. Les 2 meilleurs de chaque poule sont qualifiés
4. **Phase Bracket** : Jouer la phase finale
5. Champion ! 🍺

---

## 🎨 Design

### **Codes couleur**
- 🏆 **Poule** : Bleu (info)
- 🍺 **Bracket** : Orange (warning)
- 🔥 **Hybride** : Rouge (danger)

### **Animations**
- Banner champion avec glow animé
- Cards avec effet hover
- Transitions fluides entre phases

---

## 💾 Données

### **Stockage**
- **localStorage** pour persistance locale
- Format JSON avec toutes les données du tournoi

### **Structure d'un tournoi**
```javascript
{
  id: 'tournoi-timestamp',
  nom: 'Beer Pong Tournament 2025',
  type: 'bracket', // ou 'poule' ou 'hybride'
  equipes: [...],
  statut: 'En cours',
  dateCreation: '2025-10-09T...',
  
  // Si type === 'poule' ou 'hybride'
  poules: [...],
  
  // Si type === 'bracket' ou (hybride en phase bracket)
  bracket: {
    rounds: [...],
    champion: {...}
  },
  
  // Si type === 'hybride'
  phaseActuelle: 'poule' // ou 'bracket'
}
```

---

## 🔧 Paramétrage

### **Nombre d'équipes recommandé**
- **Poule** : Minimum 4, maximum 64
- **Bracket** : 4 à 64 équipes (le système gère automatiquement les "byes")
- **Hybride** : 8 à 64 équipes (configuration flexible du nombre de qualifiés)

### **Règles de classement (Poule)**
1. **Points** (3 pour victoire, 1 pour nul, 0 pour défaite)
2. **Goal Average** (différence buts marqués - encaissés)
3. **Buts marqués** (en cas d'égalité)

### **Règles Bracket**
- Pas de match nul autorisé
- 1 défaite = élimination
- Le gagnant avance automatiquement au tour suivant

---

## 🎯 Cas d'usage

### **Soirée Beer Pong (1 soir)**
→ **Bracket** : 8 équipes, élimination directe, champion en 2-3h

### **Weekend tournoi (2-3 jours)**
→ **Hybride** : 16 équipes, poules Jour 1-2, bracket final Jour 3

### **Grand tournoi (36+ équipes)**
→ **Multi-Bracket** : 36 équipes = 6 mini-brackets de 6, top 2 de chaque = 12 qualifiés → Bracket final à 16 (avec byes)
→ **Hybride** : 36 équipes = 6 poules de 6, top 2 par poule = 12 qualifiés → Bracket à 16 (avec byes)

### **Championnat longue durée**
→ **Poule** : Plusieurs poules, classement sur toute la saison

---

## 🆕 Système de Byes (Nouveau !)

### **Qu'est-ce qu'un "Bye" ?**
Un **bye** permet à une équipe de passer automatiquement au tour suivant sans jouer de match. Utilisé quand le nombre d'équipes n'est pas une puissance de 2.

### **Exemple : Tournoi à 36 équipes**
```
36 équipes → Bracket de 64 places
64 - 36 = 28 byes

Tour 1 :
- 28 équipes obtiennent un bye (passent directement)
- 8 matchs joués (16 équipes)
- Total au tour 2 : 32 équipes

Tour 2 : 16 matchs (32 → 16)
Tour 3 (Huitièmes) : 8 matchs (16 → 8)
Tour 4 (Quarts) : 4 matchs (8 → 4)
Tour 5 (Demis) : 2 matchs (4 → 2)
Tour 6 (Finale) : 1 match → Champion ! 🏆
```

### **Fonctionnement automatique**
- ✅ Le système calcule automatiquement le nombre de byes nécessaires
- ✅ Les byes sont distribués équitablement au 1er tour
- ✅ Les équipes avec bye avancent automatiquement au tour suivant
- ✅ Affichage visuel distinct (badge jaune "BYE")
- ✅ Pas de saisie de score nécessaire pour les byes

### **Configuration Hybride flexible**
En mode Hybride, tu peux configurer :
- **Nombre de poules** (2 à 12)
- **Qualifiés par poule** (1 à 4)

Exemple : 36 équipes, 6 poules, 2 qualifiés/poule
→ 12 qualifiés → Bracket à 16 (4 byes automatiques)

---

## ⚡ Système Multi-Bracket (Nouveau !)

### **Concept**
Le **Multi-Bracket** est un format unique qui combine plusieurs mini-brackets en parallèle, parfait pour les grands tournois rapides.

### **Fonctionnement**

#### **Phase 1 : Mini-Brackets en parallèle**
```
36 équipes réparties en 6 mini-brackets de 6 équipes

Bracket A          Bracket B          Bracket C
6 équipes          6 équipes          6 équipes
↓                  ↓                  ↓
🏆 Champion A      🏆 Champion B      🏆 Champion C
🥈 Finaliste A     🥈 Finaliste B     🥈 Finaliste C

Bracket D          Bracket E          Bracket F
6 équipes          6 équipes          6 équipes
↓                  ↓                  ↓
🏆 Champion D      🏆 Champion D      🏆 Champion F
🥈 Finaliste D     🥈 Finaliste E     🥈 Finaliste F

Total qualifiés : 6 champions + 6 finalistes = 12 équipes
```

#### **Phase 2 : Bracket Final**
```
12 qualifiés → Bracket à 16 places
→ 4 byes automatiques pour les meilleurs
→ Champion final ! 🏆
```

### **Avantages**
- ⚡ **Rapide** : Élimination directe dès le début (pas de tous contre tous)
- 🎯 **Équitable** : Chaque équipe joue minimum 2-3 matchs avant élimination
- 🔥 **Intense** : Tous les matchs comptent immédiatement
- 📊 **Parallélisable** : Les 6 brackets peuvent se jouer simultanément sur 6 tables
- 🏆 **Double chance** : Les finalistes aussi se qualifient (pas que les champions)

### **Quand utiliser Multi-Bracket ?**
- ✅ **Grand tournoi** : 24-48 équipes
- ✅ **Temps limité** : 1-2 jours seulement
- ✅ **Plusieurs tables** : Possibilité de jouer en parallèle
- ✅ **Format compétitif** : Chaque match est décisif

### **Différence avec Hybride**
| Aspect | Multi-Bracket | Hybride |
|--------|---------------|---------|
| **Phase 1** | Mini-brackets (élimination) | Poules (tous contre tous) |
| **Matchs par équipe** | 2-3 matchs minimum | 4-6 matchs |
| **Durée** | Plus rapide | Plus long |
| **Équité** | Bonne (2 chances par bracket) | Excellente (tous affrontent tous) |
| **Meilleur pour** | Tournois intenses et rapides | Championnats équitables |

### **Interface utilisateur**
- 📊 **Résumé des qualifiés** : Tableau visuel montrant champion + finaliste de chaque bracket
- 🎯 **Compteur en temps réel** : "Total : X / 12 équipes qualifiées"
- ✅ **Bouton automatique** : "Générer le bracket final" apparaît quand les 6 brackets sont terminés
- 🏆 **Affichage clair** : Champion en vert, finaliste en bleu

### **Exemple réel : Tournoi Beer Pong 2025**

#### **Configuration**
```
Nom : Tournoi Beer Pong HES-SO 2025
Type : ⚡ Multi-Bracket
Équipes : 37
Brackets : 6
```

#### **Répartition automatique (37 équipes → 6 brackets)**
```
Bracket A (6 équipes)           Bracket B (6 équipes)
─────────────────────           ─────────────────────
1. Montrer le muay thaï         7. FC Barsoulone
2. La Trigger Pinte             8. Peña Baiona
3. Desper-à-trois               9. Fc Beercelona
4. Les sans-pressions           10. Nectar malté
5. Les 3 mousse'quetaires       11. Les Taties au fond du gobelet
6. Equipe 6 (BYE)               12. Les thérapintes

Bracket C (6 équipes)           Bracket D (6 équipes)
─────────────────────           ─────────────────────
13. ekip de SA-LO-PARD          19. Totaly spice
14. Gossip Pint                 20. Pizza de nata
15. FAA                         21. Les réservistes
16. Noir métal                  22. La chance du débutant
17. 3 bras                      23. Miss the cup
18. Les diables rouges          24. LLBELLES

Bracket E (6 équipes)           Bracket F (7 équipes)
─────────────────────           ─────────────────────
25. Alpenröstli                 31. Matze
26. Unagi                       32. Mat mon Q
27. Audrey                      33. Matze 02
28. R pong                      34. Luxe à Sion
29. Les mousses populaires      35. Les St-imiards
30. White wine                  36. Team raclette
                                37. Les pintasses
```

#### **Phase 1 : Mini-Brackets**
Chaque bracket joue en élimination directe :
- **Bracket A-E** : 6 équipes → 4 matchs → Champion + Finaliste
- **Bracket F** : 7 équipes → 1 bye + 5 matchs → Champion + Finaliste

#### **Phase 2 : Bracket Final**
```
12 Qualifiés :
🏆 Champion A       🏆 Champion B       🏆 Champion C
🥈 Finaliste A      🥈 Finaliste B      🥈 Finaliste C
🏆 Champion D       🏆 Champion E       🏆 Champion F
🥈 Finaliste D      🥈 Finaliste E      🥈 Finaliste F

→ Bracket à 16 (4 byes automatiques)
→ Champion HES-SO 2025 ! 🏆🍺
```

#### **Statistiques prévues**
- **Phase 1** : 6 brackets × ~4-5 matchs = ~26-30 matchs
- **Phase 2** : Bracket final = 15 matchs
- **Total** : ~41-45 matchs
- **Matchs minimum par équipe** : 2 (1er tour + finale/demi du mini-bracket)
- **Durée estimée** : 4-6 heures avec 6 tables en parallèle

---

## 📝 Notes techniques

- **Vue.js 3** avec Composition API
- **PrimeVue** pour les composants UI
- **localStorage** pour la persistance
- **Réactivité** : Toutes les mises à jour en temps réel
- **Responsive** : Fonctionne sur mobile et desktop

---

## 🚧 Améliorations futures possibles

- [ ] Export PDF du bracket final
- [ ] Gestion des horaires (matchs par jour)
- [ ] Système de double élimination (losers bracket)
- [ ] Statistiques avancées (MVP, etc.)
- [ ] Partage du tournoi (URL)
- [ ] Mode spectateur en direct

---

## 🍻 Enjoy !

**Le système est prêt pour tes tournois de Beer Pong ! 🏆🍺**
