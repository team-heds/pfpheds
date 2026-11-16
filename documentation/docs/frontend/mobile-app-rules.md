---
title: Règles de l'application mobile
---

# Règles de l'application mobile

Ces règles s'appliquent à tout écran de la coque mobile (`src/mobile/`, sous 768 px de large). Elles reprennent les conventions d'iOS (Human Interface Guidelines d'Apple) et d'Android (Material Design 3), adaptées à une application web installée (PWA). Une règle marquée **obligatoire** ne se négocie pas ; une règle **recommandée** peut céder devant une bonne raison, écrite dans la PR.

La structure des écrans et des onglets est décrite dans [Application mobile](./mobile-app.md).

## 1. Zones sûres et bords de l'écran

L'application occupe tout l'écran, y compris sous l'encoche et sous la barre d'accueil de l'iPhone (`viewport-fit=cover` dans `index.html`).

- **Obligatoire** : les fonds (en-tête, barre d'onglets, panneaux du bas) descendent jusqu'au bord physique de l'écran. Aucune bande vide ni d'une autre couleur sous la barre d'onglets.
- **Obligatoire** : le contenu touchable reste hors des zones réservées : `padding-top: env(safe-area-inset-top)` sur l'en-tête, `padding-bottom: env(safe-area-inset-bottom)` sur la barre d'onglets et les panneaux du bas, `env(safe-area-inset-left/right)` en paysage.
- **Obligatoire** : jamais `100vh` pour la hauteur de la coque : elle est ancrée aux quatre bords (`position: fixed; inset: 0`). `100dvh` seulement à l'intérieur, si besoin.
- **Obligatoire** : la page entière ne rebondit pas et ne défile pas (`overscroll-behavior: none` sur la coque) ; seul l'écran courant défile, avec `overscroll-behavior: contain`.

## 2. Barre d'onglets (en bas)

| | iOS | Android | Règle de la plateforme |
|---|---|---|---|
| Hauteur des boutons | 49 pt | 64 à 80 dp | **56 px** plus la zone sûre du bas |
| Nombre d'onglets | 3 à 5 | 3 à 5 | **5**, pas plus |
| Libellés | Toujours affichés | Affichés (au moins pour l'onglet actif) | Pictogramme seul accepté si chaque bouton a un `aria-label` ; libellés recommandés |
| Onglet actif | Couleur d'accent | Pastille derrière le pictogramme | Couleur d'accent **et** pastille ou trait, jamais la couleur seule |

- **Obligatoire** : la barre est collée au bas de l'écran, son fond couvre la barre d'accueil de l'iPhone, les pictogrammes restent au-dessus de cette zone (règle 1).
- **Obligatoire** : chaque onglet garde sa propre pile d'écrans et sa position de défilement.
- **Obligatoire** : toucher l'onglet déjà actif ramène à la racine de l'onglet ; un second toucher remonte en haut de la liste.
- **Obligatoire** : cible tactile d'au moins 44 × 44 px par bouton.
- **Recommandé** : fond légèrement translucide avec flou (`backdrop-filter: blur(20px)`), avec un fond opaque de repli si le navigateur ne gère pas le flou.

### Quand la barre disparaît

| Situation | Barre d'onglets |
|---|---|
| Racine d'un onglet (fil, carte, institutions, recherche, profil) | Visible |
| Défilement vers le bas dans un long fil (Accueil, listes) | **Se cache** après 48 px de défilement vers le bas |
| Défilement vers le haut, retour en haut de la liste, toucher de la barre d'état | **Réapparaît** immédiatement |
| Écran détaillé empilé (fiche d'institution, publication, défi) | Visible |
| Tâche plein écran : création de publication ou de story, lecteur de story, scanner, partie de quiz, duel, mot de la semaine en cours de saisie, photo plein écran | **Cachée** |
| Clavier ouvert | **Cachée** |
| Carte | Visible, jamais cachée au défilement |
| Panneau du bas ouvert | Recouverte par le panneau (le voile assombrit aussi la barre) |

- **Obligatoire** : se cacher en glissant vers le bas (200 à 250 ms, courbe de décélération), réapparaître en glissant vers le haut ; aucune animation si l'utilisateur a demandé moins de mouvement (`prefers-reduced-motion`).
- **Obligatoire** : quand la barre se cache, le contenu ne saute pas : la zone de défilement garde sa marge basse ou la barre se superpose au contenu.
- **Interdit** : cacher la barre sur un écran court qui ne défile pas, ou la cacher au premier pixel de défilement.

## 3. En-tête (en haut)

- **Obligatoire** : 44 px de hauteur utile (iOS) à 64 px (Android), plus la zone sûre du haut.
- **Obligatoire** : titre de l'écran au centre ou à gauche, retour à gauche sur un écran empilé, au plus deux actions à droite.
- **Recommandé** : sur les longues listes, grand titre qui se réduit en titre compact au défilement (comportement iOS).
- **Recommandé** : l'en-tête suit la barre d'onglets : il se cache au défilement vers le bas dans le fil, et réapparaît au défilement vers le haut.

## 4. Navigation et retour

- **Obligatoire** : un écran détaillé arrive par la droite et repart vers la droite ; une tâche plein écran arrive par le bas.
- **Obligatoire** : le bouton retour du téléphone (Android) et le retour du navigateur ferment d'abord le panneau ou l'écran le plus récent, jamais l'application entière.
- **Recommandé** : glisser depuis le bord gauche pour revenir en arrière sur un écran empilé (geste iOS). Ne jamais capter un glissement qui démarre à moins de 20 px du bord gauche dans un écran à défilement horizontal.

## 5. Panneaux du bas et fenêtres

- **Obligatoire** : sur mobile, aucune fenêtre modale au milieu de l'écran : un panneau du bas (`BottomSheet`) ou un écran plein écran.
- **Obligatoire** : poignée visible en haut du panneau, fermeture par glissement vers le bas, par le voile et par le bouton retour.
- **Obligatoire** : hauteur maximale 90 % de l'écran ; au-delà, écran plein écran.
- **Obligatoire** : le contenu du panneau respecte la zone sûre du bas et remonte au-dessus du clavier.

## 6. Toucher, texte et formulaires

- **Obligatoire** : cibles tactiles de 44 × 44 px minimum, espacées d'au moins 8 px.
- **Obligatoire** : champs de saisie à 16 px de texte minimum (sinon l'iPhone zoome la page).
- **Obligatoire** : pas d'effet au survol seul : chaque état de survol a un état d'appui (`:active`), et les styles de survol sont limités à `@media (hover: hover)`.
- **Obligatoire** : pas de surbrillance grise au toucher (`-webkit-tap-highlight-color: transparent`) ni de sélection de texte sur les boutons et la barre d'onglets (`user-select: none`), et pas de menu d'aperçu au toucher long sur les icônes (`-webkit-touch-callout: none`).
- **Recommandé** : clavier adapté au champ (`inputmode`, `type="email"`, `enterkeyhint`), et `autocomplete` renseigné.

## 7. Mouvement et retours

- **Obligatoire** : transitions entre 150 et 300 ms, courbes de décélération ; rien de plus long pour une action courante.
- **Obligatoire** : chaque action donne un retour visible en moins de 100 ms (état appuyé, changement d'icône, compteur).
- **Obligatoire** : chargement en squelettes à la forme du contenu plutôt qu'un rond qui tourne au milieu de l'écran.
- **Recommandé** : tirer pour rafraîchir sur le fil et les listes.

## 8. Application installée (PWA)

- **Obligatoire** : couleur de la barre d'état accordée à l'en-tête (`theme-color`, en clair et en sombre).
- **Obligatoire** : écran hors ligne lisible et bandeau « Nouvelle version disponible » plutôt qu'une mise à jour silencieuse en pleine action.
- **Obligatoire** : notifications demandées seulement après un geste de la personne et une explication, jamais au premier lancement. Sur iPhone, elles ne fonctionnent qu'une fois l'application ajoutée à l'écran d'accueil (iOS 16.4 et suivants) : l'écran de réglage le dit.
- **Recommandé** : invitation à installer l'application après une première action réussie, pas à l'ouverture.

## 9. Vérification avant de livrer un écran

- Taille 375 × 812 (iPhone récent) et 360 × 640 (petit Android), en clair et en sombre.
- Fond de la barre d'onglets jusqu'au bord bas, aucune bande vide ; contenu jamais caché sous l'encoche ni sous la barre.
- Clavier ouvert : le champ actif reste visible, la barre d'onglets est cachée.
- Bouton retour du téléphone : ferme le panneau, puis l'écran empilé, puis rien de plus.
- Lecture d'écran : chaque bouton à pictogramme a un nom.
- Essai sur un vrai iPhone en application installée avant d'annoncer un changement aux étudiants : le simulateur et le navigateur d'ordinateur ne montrent pas la barre d'accueil.

## Sources

- Apple, Human Interface Guidelines : Tab bars, Layout, Sheets, Navigation and search.
- Google, Material Design 3 : Navigation bar, Top app bar, Bottom sheets, Window insets (edge-to-edge).
- WebKit et MDN : `env(safe-area-inset-*)`, `viewport-fit=cover`, `overscroll-behavior`, Web Push sur iOS 16.4.
