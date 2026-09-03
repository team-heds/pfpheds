<template>
  <div class="theme-switch">
    <button
      type="button"
      class="label"
      :aria-label="isDimTheme ? 'Activer le thème clair' : 'Activer le thème sombre'"
      :title="isDimTheme ? 'Thème clair' : 'Thème sombre'"
      @click="toggleTheme"
    >
      <div class="icon-wrapper">
        <i
          v-if="!isDimTheme"
          class="pi pi-moon"
          style="color: var(--primary-color); font-size: 20px;"
        ></i>
        <i
          v-if="isDimTheme"
          class="pi pi-sun"
          style="color: var(--primary-color); font-size: 20px;"
        ></i>
      </div>
    </button>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useColorScheme } from "@/composables/useColorScheme";

const { colorScheme, toggleColorScheme } = useColorScheme();
const isDimTheme = computed(() => colorScheme.value === "dim");

const toggleTheme = () => {
  toggleColorScheme();
};
</script>

<style scoped>

.theme-switch {
  display: flex;
  justify-content: center;
  align-items: center;
}

.theme-switch .label {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 32%;
  position: relative;
  height: 44px;
  width: 44px;
  cursor: pointer;
  background-color: var(--surface-overlay);
  border: 0;
  color: var(--primary-color);
  transition: background-color 150ms ease, transform 150ms ease;
}

.theme-switch .label:hover {
  background-color: var(--surface-hover);
}

.theme-switch .label:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
}

.theme-switch .label:active {
  transform: scale(0.96);
}

.icon-wrapper:hover {
  transform: rotate(20deg);
}

.icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.theme-switch .moon,
.theme-switch .sun {
  transition: transform 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .theme-switch .label,
  .theme-switch .moon,
  .theme-switch .sun {
    transition: none;
  }

  .icon-wrapper:hover {
    transform: none;
  }
}
</style>
