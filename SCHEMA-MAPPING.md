# Mapping des champs entre les tables

## Table `institutions` → Table `places`

Lors de la création d'une place, certains champs de l'institution sont copiés dans la table `places` pour des raisons de performance (éviter les jointures).

### Champs mappés automatiquement

| Champ dans `institutions` | Champ dans `places` | Type | Description |
|---------------------------|---------------------|------|-------------|
| `InstitutionId` | `InstitutionId` | TEXT | Clé étrangère vers l'institution |
| `Name` | `InstitutionName` | TEXT | Nom de l'institution |
| `Canton` | `Canton` | VARCHAR(10) | Canton (ex: "GE", "VD", "BE") |
| `Locality` | `Lieu` | TEXT | Ville/Localité ⚠️ Noms différents! |
| `Category` | `Categorie` | TEXT | Catégorie de l'institution ⚠️ Noms différents! |
| `AccordCadreDate` | `AccordCadreDate` | DATE | Date de l'accord cadre |
| `ConventionDate` | `ConventionDate` | DATE | Date de la convention |

### ⚠️ Attention aux différences de nommage

**Locality vs Lieu**
- Dans `institutions`: `Locality` (anglais)
- Dans `places`: `Lieu` (français)

**Category vs Categorie**
- Dans `institutions`: `Category` (anglais)
- Dans `places`: `Categorie` (français avec accent)

### Champs spécifiques à `institutions` (non copiés)

Ces champs restent uniquement dans la table `institutions`:

- `Address` - Adresse complète
- `NPA` - Code postal
- `Language` - Langue
- `Latitude` / `Longitude` - Coordonnées GPS
- `IdResponsablePhysio` - ID du responsable physiothérapie
- `MailChef` / `NomChef` / `PhoneChef` - Contact du chef
- `ImageURL` - Images (JSONB)
- `Description` - Description de l'institution
- `CyberleanURL` / `CyberlearnURL` - URLs externes
- `URL` - Site web
- `AccordCadrePDF` / `ConventionPDF` - PDFs des accords

### Champs spécifiques à `places`

Ces champs n'existent que dans la table `places`:

- `PlaceId` - ID unique de la place
- `NomPlace` - Nom de la place
- `fileURL` - PDF descriptif de la place
- **Critères** (BOOLEAN):
  - `MSQ`, `SYSINT`, `AIGU`, `REHAB`, `AMBU`, `NEUROGER`
- **Langues** (BOOLEAN):
  - `FR`, `DE`, `IT`, `ENG`
- **PFP par année** (JSONB):
  - `PFP1A`, `PFP1B`, `PFP2`, `PFP3`, `PFP4`
  - Format: `{"2025": "2", "2026": "3"}`
- `Remarques` - Remarques par année (JSONB)
- `praticiensFormateurs` - IDs des praticiens (TEXT[])

## Exemple de flux de création

### 1. Utilisateur sélectionne une institution dans le dropdown

```javascript
// Chargement des institutions depuis Supabase
const institutions = await supabase.from('institutions').select('*')

// Affichage dans le dropdown
"HUG Genève (GE)"  // Format: {Name} {Locality} ({Canton})
```

### 2. Utilisateur remplit le formulaire

```javascript
formData = {
  NomPlace: "Orthopédie",
  InstitutionId: "inst-001",
  Canton: "GE",           // Peut être modifié
  Locality: "Genève",     // Peut être modifié
  // ... autres champs
}
```

### 3. Création de la place avec mapping automatique

```javascript
const institution = institutions.find(i => i.InstitutionId === "inst-001")

const newPlace = {
  PlaceId: generateId(),
  NomPlace: "Orthopédie",
  InstitutionId: "inst-001",
  
  // ✅ Mapping automatique depuis institution
  InstitutionName: institution.Name,        // "HUG"
  Canton: formData.Canton || institution.Canton,  // "GE"
  Lieu: formData.Locality || institution.Locality, // "Genève" ⚠️ Locality → Lieu
  Categorie: institution.Category,          // ⚠️ Category → Categorie
  AccordCadreDate: institution.AccordCadreDate,
  ConventionDate: institution.ConventionDate,
  
  // Champs spécifiques à la place
  MSQ: true,
  FR: true,
  PFP2: {"2025": "3"},
  // ...
}
```

## Requête SQL pour vérifier le mapping

```sql
-- Vérifier les données copiées depuis institutions vers places
SELECT 
  p."PlaceId",
  p."NomPlace",
  p."InstitutionId",
  i."Name" as "Institution_Name",
  p."InstitutionName" as "Place_InstitutionName",
  i."Locality" as "Institution_Locality",
  p."Lieu" as "Place_Lieu",
  i."Category" as "Institution_Category",
  p."Categorie" as "Place_Categorie",
  i."Canton" as "Institution_Canton",
  p."Canton" as "Place_Canton"
FROM 
  public.places p
  LEFT JOIN public.institutions i ON p."InstitutionId" = i."InstitutionId"
LIMIT 10;
```

## Notes importantes

1. **Cohérence des données**: Si l'institution change (ex: nouveau canton), les places existantes conservent les anciennes valeurs. C'est voulu pour garder l'historique.

2. **Performance**: La duplication des champs évite des jointures coûteuses lors de l'affichage de la liste des places.

3. **Mise à jour**: Si vous voulez synchroniser les données, vous devrez mettre à jour manuellement les places après modification d'une institution.

4. **Nommage**: À terme, il serait bien d'uniformiser les noms de champs entre les deux tables (soit tout en français, soit tout en anglais).
