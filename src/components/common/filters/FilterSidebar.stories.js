import { ref } from 'vue'
import FilterSidebar from './FilterSidebar.vue'

const emptyFilters = {
  cantons: [],
  criter: [],
  languages: [],
  pfp: [],
}

const copyFilters = (filters = emptyFilters) => ({
  cantons: [...(filters.cantons || [])],
  criter: [...(filters.criter || [])],
  languages: [...(filters.languages || [])],
  pfp: [...(filters.pfp || [])],
})

const renderControlled = (args) => ({
  components: { FilterSidebar },
  setup() {
    const filters = ref(copyFilters(args.filters))
    const searchTerm = ref(args.searchTerm)
    const clear = () => {
      filters.value = copyFilters()
      searchTerm.value = ''
    }
    return { args, filters, searchTerm, clear }
  },
  template: `
    <div style="width:min(100%, 27rem); height:42rem">
      <FilterSidebar
        :cantons="args.cantons"
        :result-count="args.resultCount"
        :id-prefix="args.idPrefix"
        v-model:filters="filters"
        v-model:search-term="searchTerm"
        @clear="clear"
      />
    </div>
  `,
})

export default {
  title: 'Composants/Filtres/Filtres des institutions',
  component: FilterSidebar,
  tags: ['autodocs'],
  render: renderControlled,
  args: {
    cantons: ['BE', 'FR', 'GE', 'JU', 'NE', 'VD', 'VS'],
    filters: emptyFilters,
    searchTerm: '',
    resultCount: 42,
    idPrefix: 'storybook-institution-filters',
  },
}

export const SansFiltre = {}

export const FiltresActifs = {
  args: {
    filters: {
      cantons: ['VD', 'VS'],
      criter: ['AIGU'],
      languages: ['FR'],
      pfp: ['PFP2'],
    },
    searchTerm: 'réadaptation',
    resultCount: 7,
    idPrefix: 'storybook-active-institution-filters',
  },
}

export const AucunCanton = {
  args: {
    cantons: [],
    resultCount: 0,
    idPrefix: 'storybook-empty-cantons',
  },
}
