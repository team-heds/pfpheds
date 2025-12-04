<template>
  <div class="primevue-docs-wrapper">
    <Navbar />
    
    <div class="docs-container">
      <!-- Header -->
      <div class="docs-header">
        <div class="header-content">
          <Button 
            icon="pi pi-arrow-left" 
            @click="goBack"
            class="back-btn"
            text
            rounded
          />
          <div class="title-section">
            <h1 class="page-title">
              <i class="pi pi-book"></i>
              Documentation PrimeVue
            </h1>
            <p class="page-subtitle">Documentation complète des composants et fonctionnalités PrimeVue</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
        <p>Chargement de la documentation...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="pi pi-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <Button label="Réessayer" @click="loadDocumentation" />
      </div>

      <!-- Documentation Content -->
      <div v-else class="docs-content">
        <!-- Search Bar -->
        <div class="search-section">
          <IconField iconPosition="left">
            <InputIcon class="pi pi-search" />
            <InputText 
              v-model="searchQuery" 
              placeholder="Rechercher dans la documentation..."
              class="search-input"
            />
          </IconField>
          <Button 
            v-if="searchQuery"
            icon="pi pi-times"
            @click="searchQuery = ''"
            text
            rounded
            severity="secondary"
          />
        </div>

        <!-- Table of Contents -->
        <div v-if="!searchQuery" class="toc-section">
          <h3><i class="pi pi-list"></i> Table des matières</h3>
          <div class="toc-grid">
            <Card 
              v-for="section in tableOfContents" 
              :key="section.id"
              class="toc-card"
              @click="scrollToSection(section.id)"
            >
              <template #content>
                <i :class="section.icon"></i>
                <span>{{ section.title }}</span>
              </template>
            </Card>
          </div>
        </div>

        <!-- Documentation Sections -->
        <div class="markdown-content" v-html="renderedContent"></div>

        <!-- Scroll to Top Button -->
        <Button 
          v-if="showScrollTop"
          icon="pi pi-arrow-up"
          @click="scrollToTop"
          class="scroll-top-btn"
          rounded
          severity="secondary"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { marked } from 'marked'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const loading = ref(true)
const error = ref(null)
const rawContent = ref('')
const searchQuery = ref('')
const showScrollTop = ref(false)

// Table of Contents
const tableOfContents = ref([
  { id: 'introduction', title: 'Introduction', icon: 'pi pi-info-circle' },
  { id: 'configuration', title: 'Configuration', icon: 'pi pi-cog' },
  { id: 'theming', title: 'Théming', icon: 'pi pi-palette' },
  { id: 'components', title: 'Composants', icon: 'pi pi-th-large' },
  { id: 'accessibility', title: 'Accessibilité', icon: 'pi pi-universal-access' },
  { id: 'pass-through', title: 'Pass Through', icon: 'pi pi-code' }
])

// Rendered content with markdown parsing
const renderedContent = computed(() => {
  if (!rawContent.value) return ''
  
  let content = rawContent.value
  
  // Filter by search query
  if (searchQuery.value) {
    const lines = content.split('\n')
    const searchLower = searchQuery.value.toLowerCase()
    const filteredLines = lines.filter(line => 
      line.toLowerCase().includes(searchLower)
    )
    content = filteredLines.join('\n')
  }
  
  // Configure marked options
  marked.setOptions({
    breaks: true,
    gfm: true,
    headerIds: true,
    mangle: false
  })
  
  // Parse markdown to HTML
  let html = marked.parse(content)
  
  // Highlight search terms
  if (searchQuery.value) {
    const regex = new RegExp(`(${searchQuery.value})`, 'gi')
    html = html.replace(regex, '<mark>$1</mark>')
  }
  
  return html
})

// Load documentation from public folder
const loadDocumentation = async () => {
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch('/Primevue/llms-full.txt')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    rawContent.value = await response.text()
    
    // Extract sections for TOC
    extractSections()
    
  } catch (err) {
    console.error('Error loading documentation:', err)
    error.value = 'Impossible de charger la documentation. Vérifiez que le fichier existe.'
  } finally {
    loading.value = false
  }
}

// Extract sections from content for dynamic TOC
const extractSections = () => {
  const lines = rawContent.value.split('\n')
  const sections = []
  
  lines.forEach((line, index) => {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      const title = line.replace('# ', '').trim()
      sections.push({
        id: title.toLowerCase().replace(/\s+/g, '-'),
        title: title,
        icon: getSectionIcon(title)
      })
    }
  })
  
  if (sections.length > 0) {
    tableOfContents.value = sections
  }
}

// Get icon for section
const getSectionIcon = (title) => {
  const iconMap = {
    'introduction': 'pi pi-info-circle',
    'configuration': 'pi pi-cog',
    'theming': 'pi pi-palette',
    'accessibility': 'pi pi-universal-access',
    'components': 'pi pi-th-large',
    'guide': 'pi pi-book'
  }
  
  const key = title.toLowerCase()
  return iconMap[key] || 'pi pi-file'
}

// Scroll to section
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Scroll to top
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Handle scroll for "scroll to top" button
const handleScroll = () => {
  showScrollTop.value = window.scrollY > 500
}

// Navigate back
const goBack = () => {
  router.back()
}

// Lifecycle
onMounted(() => {
  loadDocumentation()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.primevue-docs-wrapper {
  min-height: 100vh;
}

.docs-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header Styles */
.docs-header {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.back-btn {
  flex-shrink: 0;
}

.title-section {
  flex: 1;
}

.page-title {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 700;
  color: #fff;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-title i {
  color: var(--primary-color);
}

.page-subtitle {
  color: #fff;
  font-size: 1rem;
  margin: 0;
}

/* Loading and Error States */
.loading-state,
.error-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.loading-state p,
.error-state p {
  margin-top: 1rem;
  color: #fff;
}

.error-state i {
  font-size: 3rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state h3 {
  color: #fff;
  margin-bottom: 0.5rem;
}

/* Search Section */
.search-section {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input {
  flex: 1;
  font-size: 1rem;
}

/* Table of Contents */
.toc-section {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
}

.toc-section h3 {
  color: #fff;
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.toc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.toc-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.toc-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.toc-card :deep(.p-card-content) {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
}

.toc-card i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.toc-card span {
  font-weight: 600;
  color: #fff;
}

/* Documentation Content */
.docs-content {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);
  position: relative;
}

.markdown-content {
  line-height: 1.8;
  color: #fff;
}

/* Markdown Styling */
.markdown-content :deep(h1) {
  color: #1e293b;
  font-size: 2.5rem;
  font-weight: 700;
  margin: 2rem 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid var(--primary-color);
}

.markdown-content :deep(h2) {
  color: #1e293b;
  font-size: 2rem;
  font-weight: 600;
  margin: 1.5rem 0 1rem 0;
}

.markdown-content :deep(h3) {
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
  margin: 1.25rem 0 0.75rem 0;
}

.markdown-content :deep(p) {
  margin: 1rem 0;
}

.markdown-content :deep(code) {
  background: var(--surface-card);
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 0.9em;
  color: #e11d48;
}

.markdown-content :deep(pre) {
  background: #1e293b;
  color: #f1f5f9;
  padding: 1.5rem;
  border-radius: 8px;
  overflow-x: auto;
  margin: 1.5rem 0;
}

.markdown-content :deep(pre code) {
  background: transparent;
  color: inherit;
  padding: 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin: 1rem 0;
  padding-left: 2rem;
}

.markdown-content :deep(li) {
  margin: 0.5rem 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: 1rem;
  margin: 1rem 0;
  color: #fff;
  font-style: italic;
}

.markdown-content :deep(mark) {
  background: #fef08a;
  padding: 0.1rem 0.3rem;
  border-radius: 2px;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1.5rem 0;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #e2e8f0;
  padding: 0.75rem;
  text-align: left;
}

.markdown-content :deep(th) {
  background: #f8fafc;
  font-weight: 600;
  color: #1e293b;
}

/* Scroll to Top Button */
.scroll-top-btn {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  z-index: 1000;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Responsive */
@media (max-width: 768px) {
  .docs-container {
    padding: 1rem;
  }

  .docs-header {
    padding: 1.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .toc-grid {
    grid-template-columns: 1fr;
  }

  .docs-content {
    padding: 1.5rem;
  }

  .markdown-content :deep(h1) {
    font-size: 1.75rem;
  }

  .markdown-content :deep(h2) {
    font-size: 1.5rem;
  }
}
</style>
