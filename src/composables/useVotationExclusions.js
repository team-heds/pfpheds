import { ref, computed, nextTick } from 'vue'

export function useVotationExclusions(allStudents) {
  const excludedStudentIds = ref([])
  const excludeSearchValue = ref('')
  const excludeFilteredSuggestions = ref([])

  const excludedStudentOptions = computed(() => {
    return allStudents.value.map(s => {
      const nom = (s.Nom || s.nom || s.family_name || '').toUpperCase()
      const prenom = s.Prenom || s.prenom || s.forname || ''
      return {
        name: `${nom} ${prenom}`.trim() || s.email || 'Inconnu',
        code: s.id || s.user_id
      }
    }).filter(o => o.code).sort((a, b) => a.name.localeCompare(b.name))
  })

  const filterExcludeStudents = (event) => {
    const query = (event.query || '').toLowerCase().trim()
    const alreadyExcluded = new Set(excludedStudentIds.value)
    excludeFilteredSuggestions.value = excludedStudentOptions.value
      .filter(o => !alreadyExcluded.has(o.code))
      .filter(o => !query || o.name.toLowerCase().includes(query))
  }

  const onExcludeStudent = (event) => {
    const selected = event.value
    if (selected && selected.code && !excludedStudentIds.value.includes(selected.code)) {
      excludedStudentIds.value.push(selected.code)
    }
    nextTick(() => { excludeSearchValue.value = '' })
  }

  const removeExcludedStudent = (uid) => {
    excludedStudentIds.value = excludedStudentIds.value.filter(id => id !== uid)
  }

  const getExcludedStudentName = (uid) => {
    const opt = excludedStudentOptions.value.find(o => o.code === uid)
    return opt ? opt.name : uid.substring(0, 8)
  }

  const resetExclusions = () => {
    excludedStudentIds.value = []
    excludeSearchValue.value = ''
    excludeFilteredSuggestions.value = []
  }

  return {
    excludedStudentIds,
    excludeSearchValue,
    excludeFilteredSuggestions,
    excludedStudentOptions,
    filterExcludeStudents,
    onExcludeStudent,
    removeExcludedStudent,
    getExcludedStudentName,
    resetExclusions
  }
}
