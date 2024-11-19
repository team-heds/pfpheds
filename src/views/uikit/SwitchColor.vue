<template>
  <div class="theme-toggle" @click="toggleTheme">
    <div class="toggle-switch" :class="{ active: isDarkTheme }">
      <div class="toggle-slider"></div>
    </div>
    <span class="label">{{ isDarkTheme ? 'Dim' : 'Light' }}</span>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isDarkTheme = ref(false); // Par défaut, le thème est clair

// Fonction pour basculer entre les thèmes
const toggleTheme = () => {
  const themeLink = document.getElementById('theme-link');
  if (!themeLink) return;

  // Définir les noms des thèmes
  const currentTheme = isDarkTheme.value ? 'light' : 'dim';
  const newTheme = isDarkTheme.value ? 'dim' : 'light';
  const newHref = themeLink.getAttribute('href').replace(currentTheme, newTheme);

  // Remplacer dynamiquement le fichier CSS
  replaceLink(themeLink, newHref, () => {
    isDarkTheme.value = !isDarkTheme.value;
  });
};

// Fonction pour remplacer dynamiquement le fichier CSS
const replaceLink = (linkElement, href, onComplete) => {
  const clone = linkElement.cloneNode(true);
  clone.setAttribute('href', href);
  clone.addEventListener('load', () => {
    linkElement.remove();
    clone.setAttribute('id', 'theme-link');
    if (onComplete) onComplete();
  });
  linkElement.parentNode.insertBefore(clone, linkElement.nextSibling);
};
</script>

<style scoped>
/* Conteneur principal */
.theme-toggle {
  display: flex;
  align-items: center;
  cursor: pointer;
  gap: 0.5rem;
  font-family: Arial, sans-serif;
  user-select: none;
}

/* Texte dynamique Light/Dark */
.label {
  font-size: 1rem;
  font-weight: bold;
  color: var(--text-color, #000);
}

/* Le switch */
.toggle-switch {
  position: relative;
  width: 60px;
  height: 30px;
  background-color: #e0e0e0;
  border-radius: 15px;
  transition: background-color 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 0 5px;
}

.toggle-switch.active {
  background-color: #333; /* Couleur pour le thème sombre */
  justify-content: flex-end;
}

/* Le cercle qui glisse */
.toggle-slider {
  width: 24px;
  height: 24px;
  background-color: #fff;
  border-radius: 50%;
  transition: transform 0.3s ease, background-color 0.3s ease;
  transform: translateX(0);
}

.toggle-switch.active .toggle-slider {
  transform: translateX(30px); /* Position finale en mode sombre */
  background-color: #000; /* Couleur du slider en mode sombre */
}
</style>
