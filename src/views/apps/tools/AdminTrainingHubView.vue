<template>
  <div class="training-page">
    <Navbar />

    <main class="training-container">
      <div class="p-4 border-round shadow-2 mb-4">
        <div class="flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <div class="bg-primary-100 border-circle p-3">
              <i class="pi pi-book text-primary text-3xl"></i>
            </div>
            <div>
              <div class="flex align-items-center gap-2 mb-1">
                <span class="text-xs font-bold uppercase text-primary">Visible admin</span>
                <Tag value="Mini LMS" severity="info" />
              </div>
              <h1 class="text-3xl font-bold text-900 m-0">Espace formation</h1>
              <p class="text-600 m-0 mt-2">
                Catalogue des présentations Reveal.js, accès aux exports PDF et procédure de création.
              </p>
            </div>
          </div>

          <Button
            label="Nouvelle présentation"
            icon="pi pi-plus"
            severity="primary"
            @click="scrollToCreation"
          />
        </div>
      </div>

      <div class="grid mb-4">
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2 h-full">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-desktop text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ sortedPresentationCatalog.length }}</h3>
                <p class="text-600 m-0">Présentation déclarée</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2 h-full">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ publishedCount }}</h3>
                <p class="text-600 m-0">Support publié</p>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2 h-full">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-code text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">Reveal.js</h3>
                <p class="text-600 m-0">Supports versionnés dans Git</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center gap-3 mb-3">
          <div class="bg-cyan-100 border-circle p-3">
            <i class="pi pi-filter text-cyan-500 text-xl"></i>
          </div>
          <div>
            <h2 class="text-xl font-bold text-900 m-0">Rechercher un support</h2>
            <p class="text-600 m-0 mt-1">Filtre par texte, catégorie ou statut.</p>
          </div>
        </div>

        <div class="grid">
          <div class="col-12 md:col-6">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <InputText v-model="searchQuery" class="w-full" placeholder="Rechercher par titre, tag, public..." />
            </span>
          </div>

          <div class="col-12 md:col-3">
            <Dropdown
              v-model="selectedCategory"
              :options="presentationCategories"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>

          <div class="col-12 md:col-3">
            <Dropdown
              v-model="selectedStatus"
              :options="presentationStatuses"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>
      </section>

      <section class="mb-4">
        <div class="flex align-items-center justify-content-between mb-3">
          <div>
            <h2 class="text-2xl font-bold text-900 m-0">Présentations</h2>
            <p class="text-600 m-0 mt-1">
              {{ filteredCourses.length }} support(s) disponible(s). Clique sur “Détails” pour voir le plan du cours.
            </p>
          </div>
        </div>

        <div v-if="filteredCourses.length === 0" class="surface-card p-5 border-round shadow-2 text-center">
          <i class="pi pi-search text-500 text-4xl"></i>
          <h3 class="text-xl font-bold text-900 mb-2">Aucun support trouvé</h3>
          <p class="text-600 m-0">Modifie la recherche ou les filtres.</p>
        </div>

        <div v-else class="grid">
          <div v-for="course in filteredCourses" :key="course.id" class="col-12 lg:col-6 xl:col-4">
            <Card class="training-card h-full">
              <template #header>
                <div class="training-card-header">
                  <div class="training-card-icon">
                    <i :class="course.icon"></i>
                  </div>
                  <div class="flex align-items-center gap-2">
                    <Tag v-if="course.official" value="Officiel" severity="info" />
                    <Tag :value="course.statusLabel" :severity="getStatusSeverity(course.status)" />
                  </div>
                </div>
              </template>

              <template #title>
                <div class="text-xl font-bold text-900">{{ course.title }}</div>
              </template>

              <template #subtitle>
                <div class="text-600">
                  {{ course.categoryLabel }} · {{ course.duration }} · {{ course.level }}
                </div>
              </template>

              <template #content>
                <p class="text-700 line-height-3 m-0 mb-3">{{ course.description }}</p>

                <div class="flex align-items-center gap-2 text-sm text-600 mb-3">
                  <i class="pi pi-calendar"></i>
                  <span>Mis à jour le {{ course.updatedAt }}</span>
                </div>

                <div class="flex flex-wrap gap-2 mb-3">
                  <Tag v-for="tag in course.tags" :key="tag" :value="tag" severity="secondary" />
                </div>

                <div class="flex flex-wrap gap-2 text-sm text-600">
                  <span v-for="audience in course.audience" :key="audience" class="flex align-items-center gap-1">
                    <i class="pi pi-user"></i>
                    {{ audience }}
                  </span>
                </div>
              </template>

              <template #footer>
                <div class="flex flex-column gap-2">
                  <router-link
                    :to="`/outils/formations/${course.slug}`"
                    class="p-button p-component justify-content-center no-underline"
                  >
                    <span class="p-button-icon p-button-icon-left pi pi-info-circle"></span>
                    <span class="p-button-label">Détails</span>
                  </router-link>

                  <div class="flex gap-2">
                    <a
                      :href="getPresentationUrl(course)"
                      target="_blank"
                      rel="noreferrer noopener"
                      class="p-button p-component p-button-secondary p-button-outlined flex-1 justify-content-center no-underline"
                    >
                      <span class="p-button-icon p-button-icon-left pi pi-external-link"></span>
                      <span class="p-button-label">Ouvrir</span>
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
              </template>
            </Card>
          </div>
        </div>
      </section>

      <section ref="creationSection" class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-center gap-3 mb-4">
          <div class="bg-orange-100 border-circle p-3">
            <i class="pi pi-plus-circle text-orange-500 text-2xl"></i>
          </div>
          <div>
            <h2 class="text-2xl font-bold text-900 m-0">Créer une nouvelle présentation</h2>
            <p class="text-600 m-0 mt-1">
              Le support reste versionné avec le code pour garder un build, des tests et un déploiement maîtrisés.
            </p>
          </div>
        </div>

        <div class="grid mb-4">
          <div v-for="(step, index) in presentationCreationSteps" :key="step.title" class="col-12 md:col-6">
            <div class="creation-step surface-ground border-round p-3 h-full">
              <div class="flex gap-3">
                <span class="step-index">{{ index + 1 }}</span>
                <div class="min-w-0">
                  <h3 class="text-lg font-bold text-900 m-0">{{ step.title }}</h3>
                  <p class="text-600 line-height-3 m-0 mt-2">{{ step.text }}</p>
                  <code class="command-block">{{ step.command }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="grid">
          <div class="col-12 lg:col-6">
            <div class="surface-ground border-round p-3 h-full">
              <h3 class="text-lg font-bold text-900 mt-0">Checklist qualité</h3>
              <ul class="m-0 pl-3 text-700 line-height-3">
                <li v-for="item in presentationQualityChecklist" :key="item">{{ item }}</li>
              </ul>
            </div>
          </div>

          <div class="col-12 lg:col-6">
            <div class="surface-ground border-round p-3 h-full">
              <h3 class="text-lg font-bold text-900 mt-0">Exemple d’entrée catalogue</h3>
              <code class="command-block catalog-example">{{ presentationCatalogExample }}</code>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import * as presentationData from '@/config/presentationCatalog'

const creationSection = ref(null)
const searchQuery = ref('')
const selectedCategory = ref('all')
const selectedStatus = ref('all')

const sortedPresentationCatalog = computed(() => {
  const catalog = presentationData.sortedPresentationCatalog || presentationData.presentationCatalog || []
  return [...catalog].sort((a, b) => (a.order ?? 999) - (b.order ?? 999))
})

const presentationCategories = computed(
  () =>
    presentationData.presentationCategories || [
      { label: 'Toutes les catégories', value: 'all' },
      { label: 'Technique', value: 'technique' },
      { label: 'Métier', value: 'metier' },
      { label: 'Reprise', value: 'reprise' },
      { label: 'Admin', value: 'admin' },
    ],
)

const presentationStatuses = computed(
  () =>
    presentationData.presentationStatuses || [
      { label: 'Tous les statuts', value: 'all' },
      { label: 'Publié', value: 'published' },
      { label: 'Brouillon', value: 'draft' },
      { label: 'Archivé', value: 'archived' },
    ],
)

const presentationCreationSteps = computed(() => presentationData.presentationCreationSteps || [])
const presentationQualityChecklist = computed(() => presentationData.presentationQualityChecklist || [])
const presentationCatalogExample = computed(() => presentationData.presentationCatalogExample || '')

const publishedCount = computed(
  () => sortedPresentationCatalog.value.filter(course => course.status === 'published').length,
)

const filteredCourses = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()

  return sortedPresentationCatalog.value.filter(course => {
    const matchesCategory = selectedCategory.value === 'all' || course.category === selectedCategory.value
    const matchesStatus = selectedStatus.value === 'all' || course.status === selectedStatus.value

    const searchableText = [
      course.title,
      course.description,
      course.categoryLabel,
      course.level,
      ...(course.tags || []),
      ...(course.audience || []),
    ]
      .join(' ')
      .toLowerCase()

    return matchesCategory && matchesStatus && (!query || searchableText.includes(query))
  })
})

function getPresentationUrl(course, type = 'slides') {
  if (typeof presentationData.getPresentationUrl === 'function') {
    return presentationData.getPresentationUrl(course, type)
  }

  const source = type === 'pdf' ? course.pdfPath || course.pdfHref : course.path || course.href
  if (!source) return ''
  if (/^https?:\/\//i.test(source)) return source
  return `https://hedsvs.ch${source.startsWith('/') ? source : `/${source}`}`
}

function getStatusSeverity(status) {
  if (status === 'published') return 'success'
  if (status === 'draft') return 'warning'
  if (status === 'archived') return 'secondary'
  return 'info'
}

function scrollToCreation() {
  creationSection.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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

.uppercase {
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.training-card {
  cursor: default;
}

.training-card :deep(.p-card-body) {
  height: calc(100% - 5.5rem);
  display: flex;
  flex-direction: column;
}

.training-card :deep(.p-card-content) {
  flex: 1;
}

.training-card-header {
  min-height: 5.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1.25rem 1.25rem 0;
}

.training-card-icon {
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-50, #eef2ff);
  color: var(--primary-color);
  font-size: 1.35rem;
}

.step-index {
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--primary-color);
  color: var(--primary-color-text);
  font-weight: 700;
}

.command-block {
  display: block;
  width: 100%;
  max-width: 100%;
  overflow-x: auto;
  margin-top: 0.75rem;
  padding: 0.75rem;
  border-radius: var(--border-radius);
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  color: var(--text-color);
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 0.85rem;
  white-space: pre;
}

.catalog-example {
  max-height: 18rem;
}

@media (max-width: 900px) {
  .training-container {
    padding: 5rem 0.75rem 2rem;
  }
}
</style>
