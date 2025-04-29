<template>
  <div class="theme-switch">
    <input
      type="checkbox"
      class="checkbox"
      id="theme-checkbox"
      v-model="isDimTheme"
      @change="toggleTheme"
    />
    <label for="theme-checkbox" class="label">
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
    </label>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from "vue";
import { useLayout } from "@/layout/composables/layout";

const { layoutConfig } = useLayout();
const isDimTheme = ref(layoutConfig.colorScheme.value === "dim");

onMounted(() => {
  toggleTheme();
});

watch(isDimTheme, (newValue) => {
  const newScheme = newValue ? "dim" : "light";
  changeColorScheme(newScheme);
});

const toggleTheme = () => {
  const theme = isDimTheme.value ? "dim" : "light";
  changeColorScheme(theme);
};

const changeColorScheme = (newColorScheme) => {
  const themeLink = document.getElementById("theme-link");
  if (!themeLink) return;

  const currentTheme = layoutConfig.colorScheme.value;
  const newHref = themeLink.getAttribute("href").replace(currentTheme, newColorScheme);

  replaceLink(themeLink, newHref, () => {
    layoutConfig.colorScheme.value = newColorScheme;
  });
};

const replaceLink = (linkElement, href, onComplete) => {
  const id = linkElement.getAttribute("id");
  const cloneLinkElement = linkElement.cloneNode(true);

  cloneLinkElement.setAttribute("href", href);
  cloneLinkElement.setAttribute("id", `${id}-clone`);

  linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);

  cloneLinkElement.addEventListener("load", () => {
    linkElement.remove();
    const element = document.getElementById(id);
    element && element.remove();
    cloneLinkElement.setAttribute("id", id);
    onComplete && onComplete();
  });
};
</script>

<style scoped>

.theme-switch {
  display: flex;
  justify-content: center;
  align-items: center;
}

.theme-switch .checkbox {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.theme-switch .label {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 25%;
  position: relative;
  height: 50px;
  width: 50px;
  cursor: pointer;
  background-color: var(--surface-overlay);
  transition: background-color 0.3s ease, transform 0.3s ease;
}

.theme-switch .label:hover {
  background-color: var(--surface-hover);
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
</style>
