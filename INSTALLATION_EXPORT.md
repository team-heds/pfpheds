# 📦 Installation des Dépendances pour l'Export KPI

## 🚀 Installation Requise

Pour que les exports Excel et PDF fonctionnent, vous devez installer ces packages:

```bash
npm install xlsx jspdf jspdf-autotable
```

## 📚 Packages Installés

### **1. xlsx** (Export Excel)
- **Version**: ^0.18.5
- **Taille**: ~1.5 MB
- **Usage**: Génération de fichiers Excel (.xlsx)
- **Documentation**: https://www.npmjs.com/package/xlsx

### **2. jspdf** (Export PDF)
- **Version**: ^2.5.1
- **Taille**: ~400 KB
- **Usage**: Génération de fichiers PDF
- **Documentation**: https://www.npmjs.com/package/jspdf

### **3. jspdf-autotable** (Tables PDF)
- **Version**: ^3.8.0
- **Taille**: ~50 KB
- **Usage**: Génération de tables dans les PDF
- **Documentation**: https://www.npmjs.com/package/jspdf-autotable

---

## 🗺️ Ajout de la Route

Ajoute cette route dans `src/router/index.js` (ou `router.js`):

```javascript
// Import de la vue
import AlertsDashboard from '@/views/admin/AlertsDashboard.vue'

// Dans les routes admin
{
  path: '/admin',
  component: AdminLayout,
  meta: { requiresAuth: true, requiresAdmin: true },
  children: [
    // ... autres routes admin
    {
      path: 'alerts',
      name: 'AlertsDashboard',
      component: AlertsDashboard,
      meta: {
        title: 'Alertes KPI',
        breadcrumb: [
          { label: 'Admin', to: '/admin' },
          { label: 'Alertes', active: true }
        ]
      }
    }
  ]
}
```

---

## 🔧 Configuration Vite (si problèmes)

Si tu as des erreurs avec ces packages, ajoute dans `vite.config.js`:

```javascript
export default defineConfig({
  // ... config existante
  optimizeDeps: {
    include: ['xlsx', 'jspdf', 'jspdf-autotable']
  },
  build: {
    commonjsOptions: {
      include: [/xlsx/, /jspdf/]
    }
  }
})
```

---

## 🧪 Test de l'Installation

Crée un fichier de test `test-export.js`:

```javascript
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Test Excel
const data = [{ Name: 'Test', Value: 123 }]
const ws = XLSX.utils.json_to_sheet(data)
const wb = XLSX.utils.book_new()
XLSX.utils.book_append_sheet(wb, ws, 'Test')
XLSX.writeFile(wb, 'test.xlsx')

// Test PDF
const doc = new jsPDF()
doc.text('Test PDF', 10, 10)
doc.save('test.pdf')

console.log('✅ Export packages installés correctement!')
```

---

## 📊 Formats d'Export Disponibles

### **Excel (.xlsx)**
- Inclut toutes les colonnes de données
- Formatage automatique
- Compatible Microsoft Excel / Google Sheets
- Taille: ~10-50 KB pour 100 alertes

### **PDF (.pdf)**
- Design professionnel avec logo (optionnel)
- Tables formatées avec jspdf-autotable
- Inclut statistiques et graphiques (optionnel)
- Taille: ~100-500 KB selon le contenu

### **CSV (.csv)**
- Format universel
- Importable dans n'importe quel tableur
- Pas de dépendances externes
- Taille minimale

---

## 🎯 Utilisation dans le Code

### Import dans un composant Vue:

```javascript
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Export Excel
function exportToExcel(data) {
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Alertes')
  XLSX.writeFile(wb, `alertes_${Date.now()}.xlsx`)
}

// Export PDF
function exportToPDF(data) {
  const doc = new jsPDF()
  doc.text('Rapport des Alertes', 14, 20)
  
  const tableData = data.map(item => [
    item.date,
    item.severity,
    item.message
  ])
  
  doc.autoTable({
    head: [['Date', 'Sévérité', 'Message']],
    body: tableData,
    startY: 30
  })
  
  doc.save(`rapport_${Date.now()}.pdf`)
}
```

---

## ⚠️ Troubleshooting

### Erreur: "Cannot find module 'xlsx'"
**Solution**: Relancer `npm install xlsx`

### Erreur: "jsPDF is not a constructor"
**Solution**: Vérifier l'import: `import jsPDF from 'jspdf'`

### Export Excel vide
**Solution**: Vérifier que les données sont un tableau d'objets

### PDF ne se télécharge pas
**Solution**: Vérifier les permissions du navigateur pour les téléchargements

---

## 🚀 Commande d'Installation Complète

```bash
# Installation des packages
npm install xlsx jspdf jspdf-autotable

# Vérification
npm list xlsx jspdf jspdf-autotable

# Si problèmes de version
npm install xlsx@latest jspdf@latest jspdf-autotable@latest
```

---

## 📝 Notes Importantes

1. **Taille du Bundle**: Ces packages ajoutent ~2 MB au bundle
2. **Performance**: L'export de >1000 alertes peut prendre quelques secondes
3. **Compatibilité**: Fonctionne dans tous les navigateurs modernes
4. **Licence**: Tous les packages sont open-source (MIT/Apache)

---

## ✅ Checklist Post-Installation

- [ ] `npm install` executé avec succès
- [ ] Pas d'erreurs dans la console
- [ ] Route `/admin/alerts` accessible
- [ ] Bouton "Exporter" visible
- [ ] Export Excel fonctionne
- [ ] Export PDF fonctionne
- [ ] Export CSV fonctionne
