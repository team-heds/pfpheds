<!-- src/components/Loader.vue -->
<template>
  <!-- Conteneur principal du loader -->
  <div ref="loaderContainer" class="loader-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'; // Import des fonctions réactives de Vue
import * as THREE from 'three'; // Import de la bibliothèque Three.js
import { RoundedBoxGeometry } from 'three-stdlib'; // Import de RoundedBoxGeometry depuis three-stdlib
import face1 from '@/assets/textures/face1.png'; // Import des textures pour chaque face du cube
import face2 from '@/assets/textures/face2.png';
import face3 from '@/assets/textures/face3.png';
import face4 from '@/assets/textures/face4.png';
import face5 from '@/assets/textures/face5.png';
import face6 from '@/assets/textures/face6.png';

// Référence au conteneur du loader dans le DOM
const loaderContainer = ref(null);

// Variables globales pour Three.js
let scene, camera, renderer, cube, animationId;

/**
 * Fonction pour charger les textures des faces du cube
 * @returns {Promise<Array<THREE.Texture>>} - Promesse résolue avec un tableau de textures
 */
const loadTextures = () => {
  const loader = new THREE.TextureLoader(); // Création d'un chargeur de textures
  return Promise.all([
    loader.loadAsync(face1), // Chargement asynchrone de chaque texture
    loader.loadAsync(face2),
    loader.loadAsync(face3),
    loader.loadAsync(face4),
    loader.loadAsync(face5),
    loader.loadAsync(face6),
  ]);
};

/**
 * Lifecycle hook exécuté lorsque le composant est monté
 * Initialise la scène Three.js, charge les textures, crée le cube et démarre l'animation
 */
onMounted(async () => {
  // Initialisation de la scène
  scene = new THREE.Scene();

  // Récupération des dimensions du conteneur
  const width = loaderContainer.value.clientWidth;
  const height = loaderContainer.value.clientHeight;

  // Initialisation de la caméra perspective
  camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 1000);
  camera.position.z = 5; // Positionnement de la caméra le long de l'axe z

  // Initialisation du rendu WebGL avec antialiasing et transparence
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height); // Définition de la taille du rendu
  loaderContainer.value.appendChild(renderer.domElement); // Ajout du canvas de rendu au DOM

  // Chargement des textures des faces du cube
  const textures = await loadTextures();

  // Création des matériaux en appliquant chaque texture à une face du cube
  const materials = textures.map(
    (texture) => new THREE.MeshBasicMaterial({ map: texture })
  );

  // Création de la géométrie arrondie pour le cube
  const geometry = new RoundedBoxGeometry(2, 2, 2, 16, 0.3); // Largeur, Hauteur, Profondeur, segments, rayon d'arrondi

  // Création du mesh du cube avec la géométrie et les matériaux
  cube = new THREE.Mesh(geometry, materials);
  scene.add(cube); // Ajout du cube à la scène

  // Ajout d'un écouteur d'événement pour gérer le redimensionnement de la fenêtre
  window.addEventListener('resize', onWindowResize);

  // Démarrage de la boucle d'animation
  animate();
});

/**
 * Lifecycle hook exécuté avant que le composant soit démonté
 * Nettoie les ressources et arrête l'animation pour éviter les fuites de mémoire
 */
onBeforeUnmount(() => {
  // Arrêt de l'animation
  cancelAnimationFrame(animationId);

  // Suppression de l'écouteur d'événement de redimensionnement
  window.removeEventListener('resize', onWindowResize);

  // Nettoyage des ressources Three.js
  renderer.dispose(); // Libération des ressources du renderer
  scene.remove(cube); // Suppression du cube de la scène
  cube.geometry.dispose(); // Libération de la géométrie du cube
  cube.material.forEach((material) => material.dispose()); // Libération de chaque matériau du cube
  loaderContainer.value.removeChild(renderer.domElement); // Suppression du canvas du DOM
});

/**
 * Fonction appelée lors du redimensionnement de la fenêtre
 * Ajuste l'aspect de la caméra et la taille du renderer
 */
const onWindowResize = () => {
  const width = loaderContainer.value.clientWidth;
  const height = loaderContainer.value.clientHeight;

  camera.aspect = width / height; // Mise à jour du rapport d'aspect de la caméra
  camera.updateProjectionMatrix(); // Mise à jour de la matrice de projection de la caméra

  renderer.setSize(width, height); // Mise à jour de la taille du renderer
};

/**
 * Fonction d'animation appelée à chaque frame
 * Met à jour la rotation du cube et rend la scène
 */
const animate = () => {
  animationId = requestAnimationFrame(animate); // Demande la prochaine frame d'animation

  // Rotation du cube autour des axes x et y
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;

  renderer.render(scene, camera); // Rendu de la scène depuis la caméra
};
</script>

<style scoped>
.loader-container {
  position: fixed; /* Positionnement fixe pour couvrir toute la fenêtre */
  top: 0;
  left: 0;
  width: 100%; /* Largeur complète */
  height: 100%; /* Hauteur complète */
  background-color: var(--surface-ground); /* Couleur de fond semi-transparent définie par une variable CSS */
  display: flex; /* Utilisation de flexbox pour centrer le contenu */
  align-items: center; /* Centrage vertical */
  justify-content: center; /* Centrage horizontal */
  z-index: 9999; /* Assure que le loader est au-dessus de tous les autres éléments */
}
</style>
