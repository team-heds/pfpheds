# 📋 Système de Gestion des Listes d'Équipes

## 🎯 Objectif

Ce système permet de **sauvegarder** et **réutiliser** des listes d'équipes pour créer rapidement des tournois sans avoir à ressaisir tous les noms à chaque fois.

---

## 🚀 Utilisation

### **1. Créer un nouveau tournoi avec une liste**

1. Cliquez sur **"Nouveau Tournoi"**
2. Remplissez le nom du tournoi
3. Cliquez sur **"📋 Charger liste"**
4. Sélectionnez une liste sauvegardée
5. Les équipes sont automatiquement chargées !
6. Créez le tournoi

### **2. Sauvegarder une nouvelle liste**

1. Cliquez sur **"📋 Charger liste"**
2. Cliquez sur **"💾 Sauvegarder nouvelle liste"**
3. Entrez le nom de la liste (ex: "Équipes HES-SO 2025")
4. Collez les noms des équipes, **une par ligne**
5. Cliquez sur **"💾 Sauvegarder"**

### **3. Exporter une liste en JSON**

1. Créez votre liste comme ci-dessus
2. Cliquez sur **"📥 Exporter JSON"**
3. Le fichier `.json` est téléchargé
4. Vous pouvez le partager ou l'archiver

### **4. Importer une liste depuis JSON**

1. Cliquez sur **"📋 Charger liste"**
2. Cliquez sur **"📥 Importer depuis fichier"**
3. Sélectionnez votre fichier `.json`
4. La liste est ajoutée à vos listes sauvegardées

---

## 📄 Format du fichier JSON

```json
{
  "nom": "Nom de la liste",
  "equipes": [
    "Équipe 1",
    "Équipe 2",
    "Équipe 3"
  ],
  "dateExport": "2025-01-09T19:00:00.000Z"
}
```

---

## 🎮 Exemple : Tournoi HES-SO 2025

### **Fichier fourni : `equipes_hesso_2025.json`**

Ce fichier contient les **36 équipes** du tournoi HES-SO 2025 :
- Montrer le muay thaï
- La Trigger Pinte
- FC Barsoulone
- Peña Baiona
- ... (32 autres équipes)

### **Comment l'utiliser :**

1. Importez le fichier `equipes_hesso_2025.json`
2. Créez un nouveau tournoi
3. Cliquez sur "📋 Charger liste"
4. Sélectionnez "Équipes HES-SO 2025"
5. Les 36 équipes sont automatiquement chargées !

---

## ✨ Avantages

- ✅ **Gain de temps** : Plus besoin de ressaisir les noms
- ✅ **Réutilisable** : Une liste pour plusieurs tournois
- ✅ **Partageable** : Exportez en JSON et partagez
- ✅ **Flexible** : Adaptable à tout type de tournoi
- ✅ **Sauvegarde locale** : Vos listes restent dans le navigateur

---

## 🎯 Cas d'usage

### **Tournoi récurrent (ex: mensuel)**
1. Créez une liste "Équipes Mensuelles"
2. Exportez-la en JSON (backup)
3. Réutilisez-la chaque mois

### **Tournoi avec inscriptions**
1. Collectez les noms des équipes
2. Créez une liste avec tous les noms
3. Utilisez-la pour créer le tournoi officiel

### **Partage entre organisateurs**
1. Exportez votre liste en JSON
2. Envoyez le fichier aux co-organisateurs
3. Ils l'importent et créent le tournoi

---

## 🔧 Conseils

- **Nommez bien vos listes** : Utilisez des noms explicites (ex: "Beer Pong 2025 - Janvier")
- **Exportez régulièrement** : Créez des backups JSON de vos listes importantes
- **Vérifiez avant de créer** : Le compteur affiche le nombre d'équipes détectées
- **Une équipe par ligne** : Respectez bien ce format pour éviter les erreurs

---

## 💾 Stockage

- Les listes sont sauvegardées dans **localStorage** du navigateur
- Elles persistent entre les sessions
- Elles sont liées à ce navigateur/ordinateur
- Exportez en JSON pour les transférer vers un autre appareil

---

**Bon tournoi ! 🍺🏆**
