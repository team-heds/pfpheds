<template>
  <h1 v-if="title" class="sr-only" data-auto-heading>{{ title }}</h1>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

// Chaque page doit avoir un titre principal pour les lecteurs d'écran. Si elle n'en
// affiche aucun, celui-ci reprend le titre du document, sans changer l'affichage.
const SETTLE_MS = 900
const WATCH_MS = 4000

const route = useRoute()
const title = ref('')
let timer = null
let stopTimer = null
let observer = null

const pageHasHeading = () => Boolean(document.querySelector('#main-content h1:not([data-auto-heading])'))
const documentTitle = () => document.title.replace(/\s+—\s+HEdS$/, '').trim()

function stop() {
  clearTimeout(timer)
  clearTimeout(stopTimer)
  observer?.disconnect()
  observer = null
}

function update() {
  const label = documentTitle()
  title.value = pageHasHeading() || !label || label === 'Plateforme' ? '' : label
}

watch(() => route.fullPath, () => {
  stop()
  title.value = ''
  timer = setTimeout(() => {
    update()
    const main = document.getElementById('main-content')
    if (!main || !window.MutationObserver) return
    observer = new MutationObserver(update)
    observer.observe(main, { childList: true, subtree: true })
    stopTimer = setTimeout(stop, WATCH_MS)
  }, SETTLE_MS)
}, { immediate: true })

onBeforeUnmount(stop)
</script>
