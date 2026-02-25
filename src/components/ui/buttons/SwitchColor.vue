<template>
  <div class="theme-switch">
    <label class="label" @click="toggleTheme">
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
import { ref, onMounted } from "vue";
import { useLayout } from "@/layout/composables/layout";

const { layoutConfig } = useLayout();
const isDimTheme = ref(layoutConfig.colorScheme.value === "dim");

const detectCurrentScheme = () => {
  const themeLink = document.getElementById("theme-link");
  if (!themeLink) return null;
  const href = themeLink.getAttribute("href") || '';
  if (href.includes('theme-dim')) return 'dim';
  if (href.includes('theme-light')) return 'light';
  if (href.includes('theme-dark')) return 'dark';
  return null;
};

onMounted(() => {
  const actual = detectCurrentScheme();
  if (actual) {
    layoutConfig.colorScheme.value = actual;
    isDimTheme.value = actual === 'dim';
  }
});

const toggleTheme = () => {
  isDimTheme.value = !isDimTheme.value;
  const newScheme = isDimTheme.value ? "dim" : "light";
  changeColorScheme(newScheme);
};

const changeColorScheme = (newColorScheme) => {
  const themeLink = document.getElementById("theme-link");
  if (!themeLink) return;

  const href = themeLink.getAttribute("href");
  const newHref = href.replace(/theme-(dim|light|dark)/g, 'theme-' + newColorScheme);

  if (newHref === href) return;

  replaceLink(themeLink, newHref, () => {
    layoutConfig.colorScheme.value = newColorScheme;
  });
};

const replaceLink = (linkElement, href, onComplete) => {
  if (!linkElement || !href) return;

  const id = linkElement.getAttribute("id");
  const cloneLinkElement = linkElement.cloneNode(true);

  cloneLinkElement.setAttribute("href", href);
  cloneLinkElement.setAttribute("id", `${id}-clone`);

  linkElement.parentNode.insertBefore(cloneLinkElement, linkElement.nextSibling);

  cloneLinkElement.addEventListener("load", () => {
    linkElement.remove();
    cloneLinkElement.setAttribute("id", id);
    if (onComplete) onComplete();
  });
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