import { defineStore } from 'pinia'
import { emptyFilters, toggleFilter } from '@/mobile/institutions/institutionHelpers'

/** État de l'onglet Institutions : vue ouverte, recherche, filtres. Gardé tant que l'application reste ouverte. */
export const useMobileInstitutionsStore = defineStore('mobileInstitutions', {
  state: () => ({
    view: 'list',
    searchTerm: '',
    filters: emptyFilters(),
  }),
  actions: {
    toggle(group, value) {
      this.filters = toggleFilter(this.filters, group, value)
    },
    clearFilters() {
      this.filters = emptyFilters()
    },
    clearAll() {
      this.searchTerm = ''
      this.filters = emptyFilters()
    },
  },
})
