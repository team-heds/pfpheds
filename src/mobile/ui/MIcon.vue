<template>
  <svg class="m-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path :d="path" />
  </svg>
</template>

<script setup>
import { computed } from 'vue'

// Jeu d'icônes au trait de l'application mobile (repris du prototype validé).
const PATHS = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10',
  search: 'M11 4a7 7 0 100 14 7 7 0 000-14zM20 20l-4-4',
  map: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 8a2 2 0 100 4 2 2 0 000-4z',
  building: 'M4 21V5l8-2v18M12 9h8v12M8 8v0M8 12v0M8 16v0M16 13v0M16 17v0M3 21h18',
  user: 'M12 4a4 4 0 100 8 4 4 0 000-8zM4 21c0-4 3.6-6 8-6s8 2 8 6',
  plus: 'M12 5v14M5 12h14',
  bell: 'M6 16V11a6 6 0 0112 0v5l2 2H4l2-2zM10 21h4',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.7A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  chat: 'M4 5h16v11H9l-5 4V5z',
  share: 'M4 12v7h16v-7M12 4v11M8 8l4-4 4 4',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  x: 'M6 6l12 12M18 6L6 18',
  send: 'M4 12l16-8-6 16-3-7-7-1z',
  image: 'M4 5h16v14H4zM4 16l5-5 4 4 3-3 4 4M9 9v0',
  file: 'M6 3h8l4 4v14H6V3zM14 3v4h4M9 12h6M9 16h6',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z',
  settings: 'M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1M15 4v4M9 10v4M17 16v4',
  grid: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  users: 'M9 5a3 3 0 100 6 3 3 0 000-6zM3 20c0-3 2.7-5 6-5s6 2 6 5M17 6a3 3 0 010 6M18 15c2 .6 3 2.2 3 5',
  refresh: 'M20 12a8 8 0 11-2.3-5.7M20 4v5h-5',
  alert: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8v5M12 16.5v0',
  pin: 'M12 21s-7-6.2-7-11a7 7 0 0114 0c0 4.8-7 11-7 11zM12 8a2 2 0 100 4 2 2 0 000-4z',
  nav: 'M12 3l8 18-8-4-8 4 8-18z',
  globe: 'M12 3a9 9 0 100 18 9 9 0 000-18zM3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.400-3.800 9c-2.500-2.600-3.800-5.600-3.800-9S9.500 5.600 12 3z',
  mail: 'M4 6h16v12H4zM4 7l8 6 8-6',
  phone: 'M6 3h4l2 5-2.500 1.500a11 11 0 005 5L16 12l5 2v4a2 2 0 01-2 2A16 16 0 014 5a2 2 0 012-2z',
  folder: 'M3 6h6l2 2h10v11H3z',
  chevron: 'M6 9l6 6 6-6',
  check: 'M5 12l5 5 9-10',
  cal: 'M4 6h16v15H4zM4 10h16M8 3v4M16 3v4',
  target: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8z',
  letters: 'M4 18l4-12 4 12M5.5 14h5M15 18v-7a3 3 0 016 0v7M15 14h6',
  quiz: 'M12 3a9 9 0 100 18 9 9 0 000-18zM9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1-1.5 2M12 17v0',
  qr: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2M20 14v6h-6v-2',
  trophy: 'M8 4h8v6a4 4 0 01-8 0V4zM8 6H4v1a4 4 0 004 4M16 6h4v1a4 4 0 01-4 4M12 14v4M8 21h8',
  flame: 'M12 21a6 6 0 006-6c0-3-2-4.5-3-7-1 1-1.5 2-1.5 3.5C12 9.5 11 7 11 4 8 6 6 9.5 6 15a6 6 0 006 6z',
  camera: 'M4 8h3l2-3h6l2 3h3v11H4zM12 11a3 3 0 100 6 3 3 0 000-6z',
  sun: 'M12 8a4 4 0 100 8 4 4 0 000-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500L19 19M19 5l-1.500 1.500M6.500 17.500L5 19',
  moon: 'M20 14.500A8 8 0 019.500 4 8 8 0 1020 14.500z',
  logout: 'M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10',
  trash: 'M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13',
}

const props = defineProps({ name: { type: String, required: true } })
const path = computed(() => PATHS[props.name] || PATHS.alert)
</script>

<style scoped>
.m-icon {
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;
}
</style>
