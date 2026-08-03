<template>
  <div class="training-page">
    <Navbar />

    <main class="training-container">
      <div v-if="!course" class="surface-card p-5 border-round shadow-2 text-center">
        <i class="pi pi-exclamation-triangle text-orange-500 text-4xl"></i>
        <h1 class="text-2xl font-bold text-900 mb-2">Formation introuvable</h1>
        <p class="text-600">Le support demandé n’est pas déclaré dans le catalogue.</p>
        <router-link to="/outils/formations" class="p-button p-component no-underline">
          Retour au catalogue
        </router-link>
      </div>

      <template v-else>
        <div class="surface-card p-4 border-round shadow-2 mb-4">
          <div class="flex flex-column lg:flex-row lg:align-items-center lg:justify-content-between gap-3">
            <div class="flex align-items-center gap-3">
              <div class="bg-primary-100 border-circle p-3">
                <i :class="[course.icon, 'text-primary text-3xl']"></i>
              </div>
              <div>
                <div class="flex flex-wrap align-items-center gap-2 mb-2">
                  <Tag v-if="course.official" value="Support officiel" severity="info" />
                  <Tag :value="course.statusLabel" :severity="getStatusSeverity(course.status)" />
                  <Tag :value="course.categoryLabel" severity="secondary" />
                </div>
                <h1 class="text-3xl font-bold text-900 m-0">{{ course.title }}</h1>
                <p class="text-600 line-height-3 m-0 mt-2">{{ course.description }}</p>
              </div>
            </div>

            <div class="flex flex-column sm:flex-row gap-2">
              <a
                :href="getPresentationUrl(course)"
                target="_blank"
                rel="noreferrer noopener"
                class="p-button p-component justify-content-center no-underline"
              >
                <span class="p-button-icon p-button-icon-left pi pi-external-link"></span>
                <span class="p-button-label">Ouvrir Reveal</span>
              </a>
              <a
                v-if="course.pdfPath || course.pdfHref"
                :href="getPresentationUrl(course, 'pdf')"
                target="_blank"
                rel="noreferrer noopener"
                class="p-button p-component p-button-secondary p-button-outlined justify-content-center no-underline"
              >
                <span class="p-button-icon p-button-icon-left pi pi-file-pdf"></span>
                <span class="p-button-label">PDF</span>
              </a>
            </div>
          </div>
        </div>

        <div class="grid mb-4">
          <div class="col-12 md:col-3">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <p class="text-600 m-0">Durée</p>
              <h3 class="text-xl font-bold text-900 m-0 mt-1">{{ course.duration }}</h3>
            </div>
          </div>
          <div class="col-12 md:col-3">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <p class="text-600 m-0">Niveau</p>
              <h3 class="text-xl font-bold text-900 m-0 mt-1">{{ course.level }}</h3>
            </div>
          </div>
          <div class="col-12 md:col-3">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <p class="text-600 m-0">Mise à jour</p>
              <h3 class="text-xl font-bold text-900 m-0 mt-1">{{ course.updatedAt }}</h3>
            </div>
          </div>
          <div class="col-12 md:col-3">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <p class="text-600 m-0">Public</p>
              <h3 class="text-xl font-bold text-900 m-0 mt-1">{{ course.audience.length }}</h3>
            </div>
          </div>
        </div>

        <div class="grid">
          <section class="col-12 lg:col-6">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <h2 class="text-2xl font-bold text-900 mt-0">Objectifs pédagogiques</h2>
              <ul class="m-0 pl-3 text-700 line-height-3">
                <li v-for="objective in course.objectives" :key="objective">{{ objective }}</li>
              </ul>
            </div>
          </section>

          <section class="col-12 lg:col-6">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <h2 class="text-2xl font-bold text-900 mt-0">Prérequis</h2>
              <ul class="m-0 pl-3 text-700 line-height-3">
                <li v-for="prerequisite in course.prerequisites" :key="prerequisite">{{ prerequisite }}</li>
              </ul>
            </div>
          </section>

          <section class="col-12 lg:col-6">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <h2 class="text-2xl font-bold text-900 mt-0">Ressources</h2>
              <div class="flex flex-column gap-2">
                <a
                  v-for="resource in resolvedResources"
                  :key="resource.label"
                  :href="resource.href"
                  target="_blank"
                  rel="noreferrer noopener"
                  class="resource-link"
                >
                  <i class="pi pi-external-link"></i>
                  <span>{{ resource.label }}</span>
                </a>
              </div>
            </div>
          </section>

          <section class="col-12 lg:col-6">
            <div class="surface-card p-4 border-round shadow-2 h-full">
              <h2 class="text-2xl font-bold text-900 mt-0">Checklist qualité</h2>
              <ul class="m-0 pl-3 text-700 line-height-3">
                <li v-for="item in course.qualityChecklist" :key="item">{{ item }}</li>
              </ul>
            </div>
          </section>
        </div>

        <div class="mt-4">
          <router-link to="/outils/formations" class="p-button p-component p-button-text no-underline">
            <span class="p-button-icon p-button-icon-left pi pi-arrow-left"></span>
            <span class="p-button-label">Retour au catalogue</span>
          </router-link>
        </div>
      </template>
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import Tag from 'primevue/tag'
import * as presentationData from '@/config/presentationCatalog'

const route = useRoute()

const sortedPresentationCatalog = computed(() => {
  const catalog = presentationData.sortedPresentationCatalog || presentationData.presentationCatalog || []
  return [...catalog].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
})

const course = computed(() =>
  sortedPresentationCatalog.value.find(item => item.slug === route.params.slug || item.id === route.params.slug),
)

const resolvedResources = computed(() => {
  if (!course.value) return []

  return (course.value.resources || []).map(resource => {
    if (resource.href) return resource
    if (resource.type === 'pdf') return { ...resource, href: getPresentationUrl(course.value, 'pdf') }
    return { ...resource, href: getPresentationUrl(course.value) }
  })
})

function getStatusSeverity(status) {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  if (status === 'archived') return 'secondary'
  return 'info'
}

function getPresentationUrl(courseItem, type = 'slides') {
  if (typeof presentationData.getPresentationUrl === 'function') {
    return presentationData.getPresentationUrl(courseItem, type)
  }

  const source = type === 'pdf' ? courseItem.pdfPath || courseItem.pdfHref : courseItem.path || courseItem.href
  if (!source) return ''
  if (/^https?:\/\//i.test(source)) return source
  return `https://hedsvs.ch${source.startsWith('/') ? source : `/${source}`}`
}
</script>

<style scoped>
.training-page {
  min-height: 100vh;
  font-family: var(--font-family, 'Poppins', sans-serif);
  background: none;
}

.training-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 7rem 1.25rem 3rem;
}

.resource-link {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.85rem 1rem;
  border-radius: var(--border-radius);
  background: var(--surface-ground);
  color: var(--text-color);
  font-weight: 600;
  text-decoration: none;
}

.resource-link:hover {
  color: var(--primary-color);
}

@media (max-width: 900px) {
  .training-container {
    padding: 5rem 0.75rem 2rem;
  }
}
</style>
