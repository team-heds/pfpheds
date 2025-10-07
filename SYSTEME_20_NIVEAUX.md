# 🎓 SYSTÈME DE NIVEAUX HES - 20 NIVEAUX

## 🎯 PHILOSOPHIE

Un système inspiré du parcours de formation infirmière HES, où chaque niveau représente une étape du développement professionnel, tout en contribuant aux points de ta maison.

---

## 📊 STRUCTURE DES NIVEAUX

### **PROGRESSION XP**
- Formule : `XP requis = niveau² × 100`
- Progression exponentielle pour maintenir l'engagement
- Total pour niveau 20 : **40,000 XP**

### **CONTRIBUTION MAISON**
- Chaque XP gagné = 1 point pour ta maison
- Bonus de maison à chaque palier (niveaux 5, 10, 15, 20)
- Compétition entre maisons

---

## 🎖️ LES 20 NIVEAUX

### **🌱 PHASE 1 : NOVICE (Niveaux 1-5)**
*Découverte du métier*

| Niveau | Titre | XP Min | XP Max | XP Requis | Description |
|--------|-------|--------|--------|-----------|-------------|
| 1 | Étudiant·e | 0 | 99 | 100 | Premier pas dans le monde des soins |
| 2 | Observateur·rice | 100 | 399 | 300 | Tu observes et apprends les bases |
| 3 | Apprenti·e | 400 | 899 | 500 | Tu commences à pratiquer sous supervision |
| 4 | Stagiaire | 900 | 1,599 | 700 | Tes premiers stages en milieu hospitalier |
| 5 | **Assistant·e** | 1,600 | 2,499 | 900 | **PALIER 1** - Tu assistes les soignant·es |

**Bonus Palier 1** : +500 points pour ta maison + Badge spécial

---

### **💪 PHASE 2 : INTERMÉDIAIRE (Niveaux 6-10)**
*Développement des compétences*

| Niveau | Titre | XP Min | XP Max | XP Requis | Description |
|--------|-------|--------|--------|-----------|-------------|
| 6 | Praticien·ne Junior | 2,500 | 3,599 | 1,100 | Tu pratiques de façon autonome supervisée |
| 7 | Soignant·e | 3,600 | 4,899 | 1,300 | Tu prends en charge des patient·es |
| 8 | Infirmier·ère Diplômé·e | 4,900 | 6,399 | 1,500 | Ton diplôme symbolique ! |
| 9 | Clinicien·ne | 6,400 | 8,099 | 1,700 | Expertise clinique en développement |
| 10 | **Spécialiste** | 8,100 | 9,999 | 1,900 | **PALIER 2** - Première spécialisation |

**Bonus Palier 2** : +1000 points pour ta maison + Badge rare

---

### **⭐ PHASE 3 : AVANCÉ (Niveaux 11-15)**
*Expertise et leadership*

| Niveau | Titre | XP Min | XP Max | XP Requis | Description |
|--------|-------|--------|--------|-----------|-------------|
| 11 | Expert·e Clinique | 10,000 | 12,099 | 2,100 | Maîtrise approfondie des soins |
| 12 | Référent·e | 12,100 | 14,399 | 2,300 | Les autres se tournent vers toi |
| 13 | Formateur·rice | 14,400 | 16,899 | 2,500 | Tu transmets ton savoir |
| 14 | Coordinateur·rice | 16,900 | 19,599 | 2,700 | Tu coordonnes les équipes |
| 15 | **Manager** | 19,600 | 22,499 | 2,900 | **PALIER 3** - Leadership confirmé |

**Bonus Palier 3** : +1500 points pour ta maison + Badge épique

---

### **👑 PHASE 4 : MAÎTRE (Niveaux 16-20)**
*Excellence et innovation*

| Niveau | Titre | XP Min | XP Max | XP Requis | Description |
|--------|-------|--------|--------|-----------|-------------|
| 16 | Maître Soignant·e | 22,500 | 25,599 | 3,100 | Excellence reconnue dans ton domaine |
| 17 | Consultant·e | 25,600 | 28,899 | 3,300 | On te consulte pour ton expertise |
| 18 | Chercheur·se | 28,900 | 32,399 | 3,500 | Tu innoves et recherches |
| 19 | Professeur·e | 32,400 | 36,099 | 3,700 | Tu enseignes à l'université |
| 20 | **Légende HES** | 36,100 | ∞ | 3,900 | **PALIER 4** - Sommet atteint ! |

**Bonus Palier 4** : +3000 points pour ta maison + Badge légendaire + Titre permanent

---

## 🏆 BONUS PAR MAISON

### **Harmonis** 🌿
- **Palier 1** : Débloquer "Équilibre Parfait" (méditation quotidienne)
- **Palier 2** : +10% XP sur activités de bien-être
- **Palier 3** : "Sage d'Harmonis" - Mentor automatique
- **Palier 4** : "Gardien de l'Harmonie" - Avatar exclusif

### **Elaris** ☀️
- **Palier 1** : Débloquer "Lumière du Savoir"
- **Palier 2** : +10% XP sur quiz et apprentissage
- **Palier 3** : "Porteur de Lumière" - Créer des quiz
- **Palier 4** : "Phare d'Elaris" - Badge animé spécial

### **Doloris** 💛
- **Palier 1** : Débloquer "Cœur Compatissant"
- **Palier 2** : +10% XP sur entraide communautaire
- **Palier 3** : "Empathie Incarnée" - Support prioritaire
- **Palier 4** : "Ange de Doloris" - Effets visuels exclusifs

### **Solencia** 🌙
- **Palier 1** : Débloquer "Apaisement"
- **Palier 2** : +10% XP sur activités de réflexion
- **Palier 3** : "Gardien de la Paix" - Modérateur
- **Palier 4** : "Étoile de Solencia" - Thème exclusif

---

## 📈 FORMULES DE CALCUL

### **XP pour atteindre un niveau**
```javascript
function getXPForLevel(level) {
  return level * level * 100
}
```

### **Niveau depuis XP total**
```javascript
function getLevelFromXP(totalXP) {
  return Math.floor(Math.sqrt(totalXP / 100))
}
```

### **XP restant pour niveau suivant**
```javascript
function getXPToNextLevel(currentLevel, currentXP) {
  const nextLevelXP = (currentLevel + 1) * (currentLevel + 1) * 100
  return nextLevelXP - currentXP
}
```

---

## 🎯 SOURCES D'XP

### **Activités Quotidiennes**
- Connexion quotidienne : 10 XP
- Compléter une quête : 50-200 XP
- Réussir un quiz : 20-100 XP
- Aider un·e étudiant·e : 30 XP

### **Activités Hebdomadaires**
- Quête hebdomadaire : 300 XP
- Défi hebdomadaire : 250 XP
- Top contributeur forum : 200 XP

### **Réalisations Spéciales**
- Badge rare débloqué : 150 XP
- Badge épique débloqué : 300 XP
- Badge légendaire : 500 XP
- Création de contenu : 100-500 XP

---

## 🏅 SYSTÈME DE CLASSEMENT

### **Classement Individuel**
1. Par XP total
2. Par niveau
3. Par badges débloqués

### **Classement par Maison**
1. Points totaux de maison
2. Moyenne des niveaux
3. Badges collectifs débloqués

---

## 🎁 RÉCOMPENSES PAR PALIER

### **Palier 1 (Niveau 5)**
- Badge "Assistant·e Certifié·e"
- 500 points de maison
- Débloquer création de discussions

### **Palier 2 (Niveau 10)**
- Badge "Spécialiste Reconnu·e"
- 1000 points de maison
- Débloquer création de défis
- Avatar spécial maison

### **Palier 3 (Niveau 15)**
- Badge "Manager Expérimenté·e"
- 1500 points de maison
- Débloquer création de quêtes
- Titre custom
- Couleur de nom unique

### **Palier 4 (Niveau 20)**
- Badge "Légende HES" (animé)
- 3000 points de maison
- Tous les privilèges
- Apparition dans Hall of Fame
- Mentor badge permanent
- Skin de profil exclusif

---

## 💡 ESTIMATION DE TEMPS

**Pour un·e étudiant·e actif·ve** :

- **Niveau 5** : 2-3 semaines
- **Niveau 10** : 2-3 mois
- **Niveau 15** : 6-8 mois
- **Niveau 20** : 1-2 ans

**Engagement quotidien** : 30-60 minutes

---

## 🚀 AVANTAGES DU SYSTÈME

✅ Progression claire et motivante
✅ Titres inspirés du parcours réel HES
✅ Contribution directe à la maison
✅ Récompenses significatives à chaque palier
✅ Équilibre entre accessibilité et défi
✅ Encourage l'engagement long terme
✅ Favorise la cohésion de maison

---

**Ce système est-il adapté à ta vision ? Je peux ajuster les valeurs ou ajouter des mécaniques !**
