<script setup>
import { watch } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useColorScheme } from '@/composables/useColorScheme';

defineProps({
  simple: {
    type: Boolean,
    default: false,
  },
});

// Accéder à la configuration du layout
const { layoutConfig, layoutState, onConfigSidebarToggle } = useLayout();

// Source unique de vérité pour le schéma de couleur actuel
const { colorScheme, setColorScheme } = useColorScheme();

// Observer les changements de menu et ajuster l'état
watch(layoutConfig.menuMode, (newVal) => {
  if (newVal === 'static') {
    layoutState.staticMenuDesktopInactive.value = false;
  }
});

// Fonction pour basculer la sidebar de configuration
const onConfigButtonClick = () => {
  onConfigSidebarToggle();
};

// Changer le schéma de couleur (light ou dim)
const changeColorScheme = (newColorScheme) => {
  setColorScheme(newColorScheme);
};
</script>

<template>
  <!-- Bouton pour ouvrir la configuration -->
  <button
    class="layout-config-button config-link"
    type="button"
    @click="onConfigButtonClick"
  >
    <i class="pi pi-cog"></i>
  </button>

  <!-- Sidebar de configuration -->
  <Sidebar
    v-model:visible="layoutState.configSidebarVisible.value"
    position="right"
    class="layout-config-sidebar w-20rem"
    :pt="{ closeButton: 'ml-auto' }"
  >
    <h5>Thèmes</h5>
    <!-- Option thème clair -->
    <div class="field-radiobutton flex-1">
      <RadioButton
        v-model="colorScheme"
        name="colorScheme"
        value="light"
        @change="() => changeColorScheme('light')"
        inputId="light-theme"
      />
      <label for="light-theme">Clair</label>
    </div>

    <!-- Option thème sombre -->
    <div class="field-radiobutton flex-1">
      <RadioButton
        v-model="colorScheme"
        name="colorScheme"
        value="dim"
        @change="() => changeColorScheme('dim')"
        inputId="dim-theme"
      />
      <label for="dim-theme">Sombre</label>
    </div>
  </Sidebar>
</template>

<style lang="scss" scoped>
/* Vous pouvez ajouter des styles spécifiques à cette configuration */
.layout-config-sidebar {
  .field-radiobutton {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;

    label {
      margin-left: 0.5rem;
    }
  }
}
</style>
