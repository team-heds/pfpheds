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
        <svg
          v-if="!isDimTheme"
          class="moon"
          width="24"
          height="24"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 11.5066C3 16.7497 7.25034 21 12.4934 21C16.2209 21 19.4466 18.8518 21 15.7259C12.4934 15.7259 8.27411 11.5066 8.27411 3C5.14821 4.55344 3 7.77915 3 11.5066Z"
            stroke="#FFD700"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        <svg
          v-if="isDimTheme"
          class="sun"
          width="24"
          height="24"
          stroke-width="1.5"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18Z"
            stroke="#FFA500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M22 12L23 12" stroke="#FFA500" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 2V1" stroke="#FFA500" stroke-linecap="round" stroke-linejoin="round" />
          <path d="M12 23V22" stroke="#FFA500" stroke-linecap="round" stroke-linejoin="round" />
          <path
            d="M20 20L19 19"
            stroke="#FFA500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M20 4L19 5"
            stroke="#FFA500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M4 20L5 19"
            stroke="#FFA500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M4 4L5 5"
            stroke="#FFA500"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path d="M1 12L2 12" stroke="#FFA500" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
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

body.light {
  --surface-overlay: var(--light-surface-overlay);
}

body.dim {
  --surface-overlay: var(--dim-surface-overlay);
}

.theme-switch .moon,
.theme-switch .sun {
  transition: transform 0.3s ease;
}
</style>
