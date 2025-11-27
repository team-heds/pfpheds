# 📊 Guide Utilisateur - Système de KPI Personnalisable

## 🎯 Introduction

Le système de KPI (Indicateurs Clés de Performance) vous permet de **visualiser**, **personnaliser** et **surveiller** les métriques importantes de votre application en temps réel.

---

## 🚀 Démarrage Rapide

### Accéder au Dashboard
1. Connectez-vous à l'application
2. Naviguez vers `/admin`
3. Visualisez vos 16 KPI par défaut

---

## 🎨 Personnalisation des KPI

### Mode Édition
**Activer le mode édition:**
```
Cliquez sur le bouton "Éditer" en haut à droite
```

En mode édition, vous pouvez:
- ✅ Déplacer les KPI (drag & drop)
- ✅ Masquer/Afficher des KPI
- ✅ Changer la taille des KPI
- ✅ Configurer des alertes

---

## 📐 Tailles de KPI

### 5 Tailles Disponibles

#### 1. **Compact** (1 colonne)
- Affichage minimal
- Juste label + valeur
- Idéal pour: compteurs simples

#### 2. **Small** (1 colonne)
- Label + valeur + mini-graphique
- Idéal pour: métriques avec tendance

#### 3. **Medium** (2 colonnes) ⭐ **Par défaut**
- Label + valeur + graphique + comparaison
- Idéal pour: KPI principaux

#### 4. **Large** (3 colonnes)
- Affichage étendu avec détails
- Idéal pour: KPI critiques

#### 5. **X-Large** (4 colonnes)
- Vue complète avec historique
- Idéal pour: KPI stratégiques

### Changer la Taille
1. **Mode édition activé**
2. **Cliquez** sur l'icône de taille (📏) sur le KPI
3. **Sélectionnez** la taille souhaitée
4. **Validez** - Le changement est automatiquement sauvegardé

---

## 🎯 Réorganiser les KPI

### Drag & Drop
1. **Activez le mode édition**
2. **Cliquez et maintenez** sur un KPI
3. **Glissez** vers la nouvelle position
4. **Relâchez** - L'ordre est sauvegardé automatiquement

> **💡 Astuce:** Les KPI importants en haut gauche pour une visibilité maximale!

---

## 👁️ Masquer/Afficher des KPI

### Masquer un KPI
1. **Mode édition** → **Cliquez** sur l'icône œil (👁️)
2. Le KPI disparaît de la vue normale
3. Reste visible en mode édition (grisé)

### Réafficher un KPI masqué
1. **Mode édition** → **Trouvez** le KPI grisé
2. **Cliquez** sur l'icône œil barré
3. Le KPI réapparaît en vue normale

> **⚠️ Note:** Les KPI masqués restent en mémoire et peuvent être réaffichés à tout moment

---

## 🚨 Système d'Alertes Intelligentes

### Types d'Alertes Automatiques

#### 1. **Chute Critique** (🔻)
- **Déclenchement:** Baisse >30% par rapport à la veille
- **Sévérité:** ERREUR
- **Action:** Analyse immédiate requise

#### 2. **Hausse Anormale** (📈)
- **Déclenchement:** Augmentation >50%
- **Sévérité:** AVERTISSEMENT
- **Action:** Vérifier la cohérence des données

#### 3. **Valeur Nulle** (⚠️)
- **Déclenchement:** KPI = 0 (sauf exceptions)
- **Sévérité:** AVERTISSEMENT
- **Action:** Vérifier la connexion aux données

#### 4. **Tendance Négative** (📉)
- **Déclenchement:** Baisse sur 3 mesures consécutives
- **Sévérité:** INFO
- **Action:** Surveillance accrue

#### 5. **Seuils Personnalisés** (🎯)
- **Déclenchement:** Valeur < min OU > max
- **Sévérité:** Variable selon configuration
- **Action:** Selon le seuil configuré

### Configurer une Alerte Personnalisée
1. **Mode édition** → **Cliquez** sur ⚙️ (engrenage)
2. **Activez** les alertes avec le switch
3. **Définissez** le type (pourcentage/unités)
4. **Indiquez** le seuil de déclenchement
5. **Sauvegardez**

---

## 📊 Comparaison de Périodes

### Périodes Disponibles
- **Hier** vs Aujourd'hui
- **Semaine dernière** vs Cette semaine
- **Mois dernier** vs Ce mois
- **Année dernière** vs Cette année

### Activer la Comparaison
```
Cliquez sur "Comparer" en haut du dashboard
Sélectionnez la période de référence
```

### Interpréter les Résultats

#### Symboles
- 🚀 **Croissance explosive** (>50%)
- 📈 **Croissance forte** (20-50%)
- ↗️ **Croissance modérée** (<20%)
- ➡️ **Stable** (±5%)
- ↘️ **Baisse modérée** (<20%)
- 📉 **Baisse forte** (20-50%)
- 🔻 **Chute importante** (>50%)

#### Couleurs
- 🟢 **Vert:** Excellent (>20% positif)
- 🟡 **Jaune:** Avertissement (>20% négatif)
- 🔴 **Rouge:** Critique (>50% négatif)
- ⚪ **Gris:** Stable (±5%)

---

## 💾 Sauvegarde et Configuration

### Sauvegarde Automatique
Toutes vos personnalisations sont **sauvegardées automatiquement** dans votre navigateur:
- Ordre des KPI
- Tailles configurées
- KPI masqués
- Alertes définies

### Export de Configuration
1. **Cliquez** sur "Export" en haut à droite
2. **Copiez** le JSON généré
3. **Sauvegardez-le** dans un fichier

### Import de Configuration
1. **Cliquez** sur "Import"
2. **Collez** votre JSON de configuration
3. **Validez** - Votre dashboard est restauré!

> **💡 Astuce:** Partagez vos configurations avec vos collègues!

---

## 🎨 Animations et Expérience Utilisateur

### Animations Intégrées
- **Apparition progressive** des KPI (effet cascade)
- **Hover effects** (élévation au survol)
- **Transitions fluides** lors des changements de taille
- **Feedback tactile** sur les interactions

### Responsive Design
Le dashboard s'adapte automatiquement:
- **Desktop** (>1200px): 4 colonnes
- **Tablette** (768-1200px): 2 colonnes
- **Mobile** (<768px): 1 colonne

---

## 🔧 Dépannage

### Les KPI ne s'affichent pas
**Solutions:**
1. Vérifiez votre connexion internet
2. Actualisez la page (F5)
3. Videz le cache navigateur (Ctrl + Shift + R)
4. Vérifiez les logs de la console (F12)

### La configuration ne se sauvegarde pas
**Causes possibles:**
- LocalStorage désactivé dans le navigateur
- Mode navigation privée actif
- Quota de stockage dépassé

**Solution:**
- Activez les cookies et le stockage local
- Utilisez le mode navigation normal
- Exportez régulièrement votre configuration

### Les alertes ne se déclenchent pas
**Vérifications:**
1. Les alertes sont bien activées
2. Les seuils sont correctement configurés
3. Les données sont mises à jour régulièrement

---

## 📈 Bonnes Pratiques

### Organisation du Dashboard
1. **Top-left** (coin supérieur gauche): KPI les plus critiques
2. **Top-right**: KPI de suivi quotidien
3. **Bottom**: KPI d'analyse et de détail

### Choix des Tailles
- **X-Large:** 1-2 KPI stratégiques maximum
- **Large:** 3-4 KPI importants
- **Medium:** KPI de suivi régulier
- **Small/Compact:** KPI de contexte

### Configuration des Alertes
- **Ne pas sur-alerter:** Max 5-6 alertes actives
- **Seuils réalistes:** Basés sur l'historique
- **Actions claires:** Définir quoi faire en cas d'alerte

---

## 🎓 Cas d'Usage

### Cas 1: Dashboard de Direction
```
[X-Large] Utilisateurs Actifs
[Large] Revenue | Conversions
[Medium] Nouveaux Users | Churn | Satisfaction
[Small] Bugs | Support | Uptime
```

### Cas 2: Dashboard Opérationnel
```
[Large] Places disponibles | Institutions actives
[Medium] Défis en cours | Quêtes terminées | Badges distribués
[Small] Users Online | API Calls | Cache Hit Rate
```

### Cas 3: Dashboard Analytique
```
[X-Large] Tendance Utilisateurs (30j)
[Large] Rétention | Engagement
[Medium] Sources Trafic | Comportements | Conversion
[Small] Données techniques
```

---

## 🆘 Support

### Besoin d'Aide?
- **Documentation technique:** `/docs`
- **API des KPI:** `/api/docs/kpi`
- **Support:** support@pfpheds.ch
- **GitHub Issues:** [lien vers repo]

---

## 📝 Changelog

### Version 2.0 (2025-01-27)
- ✨ Ajout des alertes intelligentes
- ✨ Comparaison de périodes
- ✨ Animations fluides
- ✨ 5 tailles de KPI
- 🐛 Correction affichage avec données manquantes
- 🐛 Fix localStorage corrompu

### Version 1.0 (2025-01-01)
- 🎉 Lancement initial du système de KPI
- ✅ 16 KPI disponibles
- ✅ Drag & drop
- ✅ Configuration sauvegardée

---

## 🎉 Conclusion

Le système de KPI est conçu pour être **flexible**, **intuitif** et **puissant**. N'hésitez pas à expérimenter avec les différentes configurations pour trouver celle qui correspond le mieux à vos besoins!

**Bon monitoring!** 📊✨
