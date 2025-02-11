<!-- src/components/Versionning.vue -->
<template>
    <div class="versionning">
      v :  {{ version }}
    </div>
  </template>
  
  <script>
  // On importe le fichier package.json pour récupérer la version.
  // Attention : le chemin peut varier selon la structure de votre projet.
  import pkg from '../../../package.json';
  
  export default {
    name: "VersionningComponent",
    data() {
      return {
        version: pkg.version
      };
    },
  };
  </script>
  
  <style scoped>
  .versionning {
    position: fixed;
    bottom: 5px;
    right: 45px;
    z-index: 1000;
  }
  
  @media (max-width: 768px) {
    .versionning {
      bottom: 5px;
      right: 10px;
      width: 80px; /* Ajuster la taille pour les petits écrans */
      height: 80px;
    }
  }
  </style>
  