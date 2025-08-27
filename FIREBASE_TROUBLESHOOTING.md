# 🔥 Guide de Dépannage Firebase

## Erreur : "Component auth has not been registered yet"

Cette erreur indique que Firebase Auth ne peut pas s'initialiser correctement. Voici les étapes de résolution :

### 1. 📁 Vérification du fichier .env

**Emplacement :** Le fichier `.env` doit être à la **racine du projet** (même niveau que `package.json`)

**Noms de fichiers possibles :**
- `.env` (développement)
- `.env.local` (override local)
- `.env.production` (production)

**Vérifiez que le fichier existe :**
```bash
# Dans le terminal, à la racine du projet
ls -la | grep .env
# ou sur Windows
dir | findstr .env
```

### 2. 📝 Format des Variables

**Format correct dans le fichier .env :**
```bash
# PAS D'ESPACES autour du =
VITE_FIREBASE_API_KEY=AIzaSyC...
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet-id
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
VITE_FIREBASE_DATABASE_URL=https://votre-projet-default-rtdb.europe-west1.firebasedatabase.app
```

**❌ Formats incorrects :**
```bash
VITE_FIREBASE_API_KEY = AIzaSyC...  # Espaces autour du =
VITE_FIREBASE_API_KEY="AIzaSyC..." # Guillemets (pas nécessaires)
FIREBASE_API_KEY=AIzaSyC...         # Manque le préfixe VITE_
```

### 3. 🔄 Redémarrage Obligatoire

Après modification du fichier `.env`, **TOUJOURS redémarrer** :
```bash
# Arrêter le serveur (Ctrl+C)
# Puis relancer
npm run dev
```

### 4. 🧹 Nettoyage du Cache

Si le problème persiste :
```bash
# Nettoyer le cache Vite
rm -rf node_modules/.vite
# ou sur Windows
rmdir /s node_modules\.vite

# Redémarrer
npm run dev
```

### 5. 🔍 Diagnostic Intégré

Utilisez les outils de diagnostic dans l'interface admin :

1. Allez sur `/admin/modules/simple`
2. Cliquez sur **"Test Variables ENV"**
3. Vérifiez la console pour voir quelles variables sont manquantes
4. Cliquez sur **"Diagnostic Firebase"** pour tester la connexion

### 6. 🐛 Vérifications Avancées

**Vérifier les variables dans la console du navigateur :**
```javascript
// Dans la console du navigateur
console.log(import.meta.env)
```

**Vérifier l'initialisation Firebase :**
```javascript
// Dans firebase.js, ajoutez temporairement
console.log('Config Firebase:', firebaseConfig)
console.log('App Firebase:', app)
console.log('Auth Firebase:', auth)
```

### 7. 🏗️ Problèmes de Build

Si vous êtes en production :
```bash
# Rebuild complet
npm run build
```

### 8. 📋 Checklist de Vérification

- [ ] Fichier `.env` existe à la racine
- [ ] Toutes les variables `VITE_FIREBASE_*` sont présentes
- [ ] Pas d'espaces autour des `=`
- [ ] Serveur redémarré après modification
- [ ] Cache Vite nettoyé
- [ ] Variables visibles dans `import.meta.env`
- [ ] Diagnostic Firebase passe

### 9. 🆘 Si Rien ne Fonctionne

1. **Créez un nouveau fichier `.env.local`** avec vos variables
2. **Copiez exactement** depuis `.env.production.example`
3. **Testez avec des valeurs factices** pour voir si le problème vient des valeurs
4. **Vérifiez les permissions** du fichier `.env`

### 10. 🔧 Test Manuel

Créez un fichier de test temporaire :
```javascript
// test-firebase-manual.js
console.log('Test manuel Firebase:')
console.log('API Key:', import.meta.env.VITE_FIREBASE_API_KEY)
console.log('Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN)
// ... autres variables
```

---

## 📞 Support

Si le problème persiste après toutes ces étapes, vérifiez :
1. Les permissions du fichier `.env`
2. L'encodage du fichier (UTF-8)
3. Les caractères spéciaux dans les valeurs
4. La configuration de votre IDE/éditeur
