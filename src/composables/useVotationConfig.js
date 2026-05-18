import { ref, computed, watch } from 'vue'

export function useVotationConfig() {
  const filterPFP = ref(null)
  const currentVotationYear = new Date().getMonth() >= 8
    ? new Date().getFullYear() + 1
    : new Date().getFullYear()

  const MIN_VOTATION_YEAR = 2025
  const MAX_VOTATION_YEAR = 2030
  const defaultYear = Math.min(Math.max(currentVotationYear, MIN_VOTATION_YEAR), MAX_VOTATION_YEAR)

  const filterYear = ref(String(defaultYear))
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

  const buildBaCode = (year) => {
    const yy = ((year % 100) + 100) % 100
    return `BA${String(yy).padStart(2, '0')}`
  }

  const buildPfpConfigForYear = (votationYear) => {
    const year = Number(votationYear)
    if (!Number.isFinite(year)) return {}

    const academicStartYear = year - 1
    const ba1 = buildBaCode(academicStartYear)
    const ba2 = buildBaCode(academicStartYear - 1)
    const ba3 = buildBaCode(academicStartYear - 2)

    return {
      [ba1]: { label: `${ba1} (1ère année)`, pfps: ['PFP1A', 'PFP1B'] },
      [ba2]: { label: `${ba2} (2ème année)`, pfps: ['PFP2'] },
      [ba3]: { label: `${ba3} (3ème année)`, pfps: ['PFP3', 'PFP4'] }
    }
  }

  const PFP_CONFIG = computed(() => buildPfpConfigForYear(filterYear.value))

  const pfpColorMap = {
    PFP1A: '#8B5CF6',
    PFP1B: '#06B6D4',
    PFP2: '#6366F1',
    PFP3: '#EC4899',
    PFP4: '#F59E0B'
  }

  const years = computed(() => {
    const size = MAX_VOTATION_YEAR - MIN_VOTATION_YEAR + 1
    return Array.from({ length: size }, (_, i) => {
      const year = String(MIN_VOTATION_YEAR + i)
      const start = String(Number(year) - 1)
      return {
        label: `${start}-${year}`,
        value: year
      }
    })
  })

  const classeOptions = computed(() => Object.keys(PFP_CONFIG.value).map(key => ({
    label: PFP_CONFIG.value[key].label,
    value: key
  })))

  const activeConfig = computed(() => {
    if (!filterClasse.value) return null
    return PFP_CONFIG.value[filterClasse.value] || null
  })

  const pfpTypes = computed(() => {
    if (!activeConfig.value) return []
    return activeConfig.value.pfps.map(p => ({ label: p, value: p }))
  })

  const canShowResults = computed(() => {
    return filterClasse.value && filterYear.value && filterPFP.value
  })

  const setupClassWatcher = (onClassChange) => {
    watch(filterYear, (newYear) => {
      if (!newYear) {
        filterClasse.value = null
        filterPFP.value = null
        return
      }

      const cfg = PFP_CONFIG.value
      if (!filterClasse.value || !cfg[filterClasse.value]) {
        filterClasse.value = null
        filterPFP.value = null
      } else if (filterPFP.value && !cfg[filterClasse.value].pfps.includes(filterPFP.value)) {
        filterPFP.value = null
      }
    }, { immediate: true })

    watch(filterClasse, (newVal) => {
      filterPFP.value = null

      if (newVal && PFP_CONFIG.value[newVal]) {
        const config = PFP_CONFIG.value[newVal]
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
