# 🔥 Guide de Configuration Firebase

## ❌ Problème Identifié

**Les modules ne s'enregistrent pas dans Firebase car les variables d'environnement Firebase sont manquantes.**

```
❌ VITE_FIREBASE_API_KEY: MANQUANT
❌ VITE_FIREBASE_AUTH_DOMAIN: MANQUANT  
❌ VITE_FIREBASE_PROJECT_ID: MANQUANT
❌ VITE_FIREBASE_STORAGE_BUCKET: MANQUANT
❌ VITE_FIREBASE_MESSAGING_SENDER_ID: MANQUANT
❌ VITE_FIREBASE_APP_ID: MANQUANT
❌ VITE_FIREBASE_DATABASE_URL: MANQUANT
```

## 🔧 Solution : Configurer Firebase

### Étape 1 : Obtenir les Clés Firebase

1. **Aller sur** [Firebase Console](https://console.firebase.google.com/)
2. **Sélectionner** votre projet (ou en créer un)
3. **Cliquer** sur l'icône ⚙️ → **Paramètres du projet**
4. **Descendre** jusqu'à "Vos applications"
5. **Cliquer** sur l'application web (icône `</>`)
6. **Copier** la configuration qui ressemble à :

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyC...",
  authDomain: "votre-projet.firebaseapp.com",
  projectId: "votre-projet-id",
  storageBucket: "votre-projet.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
  databaseURL: "https://votre-projet-default-rtdb.europe-west1.firebasedatabase.app"
};
```

### Étape 2 : Configurer le Fichier .env

**Ouvrir** le fichier `.env` à la racine du projet et **ajouter** :

```bash
# Configuration Firebase (OBLIGATOIRE)
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://votre-projet-default-rtdb.europe-west1.firebasedatabase.app

# Token Vimeo (optionnel pour les vidéos)
VITE_VIMEO_ACCESS_TOKEN=votre_token_vimeo_ici
```

### Étape 3 : Activer Realtime Database

1. **Dans Firebase Console** → **Realtime Database**
2. **Cliquer** "Créer une base de données"
3. **Choisir** la région (Europe pour la France)
4. **Commencer en mode test** (règles ouvertes temporairement)

### Étape 4 : Redémarrer le Serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

## ✅ Vérification

Après configuration, **tester** :

1. **Aller** sur `/admin/modules/simple`
2. **Cliquer** "Test Variables d'Environnement"
3. **Vérifier** que toutes les variables sont ✅
4. **Créer** un module test
5. **Vérifier** dans Firebase Console que les données apparaissent

## 🚨 Sécurité

- **Ne jamais** commiter le fichier `.env` 
- **Utiliser** `.env.production.example` comme template
- **Garder** les clés Firebase secrètes

## 🔍 Diagnostic

Pour diagnostiquer les problèmes :

```bash
node test-firebase.js
```

Ou dans l'interface admin :
- **Page** `/admin/modules/simple`
- **Section** "Diagnostic Firebase"
- **Boutons** de test disponibles
