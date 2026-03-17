import { ref, computed, watch } from 'vue'

export function useVotationConfig() {
  const filterPFP = ref(null)
  const filterYear = ref(null)
  const filterClasse = ref(null)
  const searchQuery = ref('')
  const activeTab = ref(0)

  // ============================================
  // CONFIGURATION DYNAMIQUE - TOUTES LES CLASSES
  // ============================================
  // 3 années d'études :
  //   1ère année → PFP1A, PFP1B
  //   2ème année → PFP2
  //   3ème année → PFP3, PFP4
  // Les classes BA changent chaque année : BA{année d'entrée}
  // Ex: en 2025-2026 → 1ère=BA25, 2ème=BA24, 3ème=BA23
  //     en 2026-2027 → 1ère=BA26, 2ème=BA25, 3ème=BA24

  const currentAcademicYear = new Date().getMonth() >= 8
    ? new Date().getFullYear()   // Sept-Déc → année en cours
    : new Date().getFullYear() - 1 // Jan-Août → année précédente

  const academicYearShort = currentAcademicYear % 100 // ex: 25

  const buildPfpConfig = () => {
    const ba1 = `BA${academicYearShort}`      // 1ère année
    const ba2 = `BA${academicYearShort - 1}`  // 2ème année
    const ba3 = `BA${academicYearShort - 2}`  // 3ème année
    const pfpYear = `${currentAcademicYear + 1}` // ex: '2026' pour 2025-2026

    return {
      [ba1]: { label: `${ba1} (1ère année)`, pfps: ['PFP1A', 'PFP1B'], years: [pfpYear] },
      [ba2]: { label: `${ba2} (2ème année)`, pfps: ['PFP2'], years: [pfpYear] },
      [ba3]: { label: `${ba3} (3ème année)`, pfps: ['PFP3', 'PFP4'], years: [pfpYear] }
    }
  }

  const PFP_CONFIG = buildPfpConfig()

  const pfpColorMap = {
    PFP1A: '#8B5CF6',
    PFP1B: '#06B6D4',
    PFP2: '#6366F1',
    PFP3: '#EC4899',
    PFP4: '#F59E0B'
  }

  const classeOptions = Object.keys(PFP_CONFIG).map(key => ({
    label: PFP_CONFIG[key].label,
    value: key
  }))

  const activeConfig = computed(() => {
    if (!filterClasse.value) return null
    return PFP_CONFIG[filterClasse.value] || null
  })

  const pfpTypes = computed(() => {
    if (!activeConfig.value) return []
    return activeConfig.value.pfps.map(p => ({ label: p, value: p }))
  })

  const years = computed(() => {
    if (!activeConfig.value) return []
    return activeConfig.value.years
  })

  const canShowResults = computed(() => {
    return filterClasse.value && filterYear.value && filterPFP.value
  })

  const setupClassWatcher = (onClassChange) => {
    watch(filterClasse, (newVal) => {
      filterPFP.value = null
      filterYear.value = null

      if (newVal && PFP_CONFIG[newVal]) {
        const config = PFP_CONFIG[newVal]
        // Auto-sélectionner l'année si une seule
        if (config.years.length === 1) {
          filterYear.value = config.years[0]
        }
        // Auto-sélectionner le PFP si un seul
        if (config.pfps.length === 1) {
          filterPFP.value = config.pfps[0]
        }
      }

      if (onClassChange) onClassChange(newVal)
    })
  }

  const setupFilterWatcher = (onFilterChange) => {
    watch([filterPFP, filterYear], async ([pfp, year]) => {
      if (pfp && year && filterClasse.value) {
        if (onFilterChange) await onFilterChange(pfp, year)
      }
    })
  }

  return {
    filterPFP,
    filterYear,
    filterClasse,
    searchQuery,
    activeTab,
    PFP_CONFIG,
    pfpColorMap,
    classeOptions,
    activeConfig,
    pfpTypes,
    years,
    canShowResults,
    setupClassWatcher,
    setupFilterWatcher
  }
}
