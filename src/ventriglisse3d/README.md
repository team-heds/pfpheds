# Ventriglisse3D (Vue + Three.js)

Composant d'animation 3D pour un tirage au sort fun façon ventriglisse !

## Installation

1. Installe Three.js :

```sh
npm install three
```

2. Ajoute le composant `Ventriglisse3D.vue` dans tes pages Vue.js :

```vue
<script setup>
import Ventriglisse3D from '@/ventriglisse3d/Ventriglisse3D.vue';
</script>
<template>
  <Ventriglisse3D />
</template>
```

3. Modifie `participants.json` pour personnaliser les joueurs !

## Fonctionnement
- Clique sur "Lancer la glissade" pour démarrer l'animation
- Chaque capsule est projetée avec une force aléatoire et freinée par la friction
- Le plus loin remporte la partie !
- Tu peux "Rejouer" à l'infini

## Bonus possible
- Ajoute des effets 3D, sons, podium, import CSV...
- Remplace les capsules par des modèles 3D plus fun

---

Pour toute question ou évolution, demande à Cascade !
