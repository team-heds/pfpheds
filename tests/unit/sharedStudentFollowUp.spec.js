import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { reactive, nextTick } from 'vue'
import source from '../../src/views/admin/formation-pratique/secretariat/SuiviCasParticuliers.vue?raw'
import SharedStudentFollowUp from '../../src/components/admin/SharedStudentFollowUp.vue'

describe('cas particuliers par étudiant', () => {
  it('gère une fiche absente ou vide', () => {
    expect(mount(SharedStudentFollowUp).text()).toBe('Chargement du suivi…')
    const empty = mount(SharedStudentFollowUp, { props: { student: { pfp1: { commentaire: '  ' } } } })
    expect(empty.find('details').exists()).toBe(true)
    expect(empty.text()).toContain('Aucun commentaire enregistré')
  })
  it('affiche les remarques seules, intégralement et sans interpréter le HTML', () => {
    const text = 'Remarques\nSuivi LPP\n<script>aucune exécution</script>'
    const wrapper = mount(SharedStudentFollowUp, { props: { student: { info_etudiant: { commentaire: text } } } })
    expect(wrapper.find('p').element.textContent).toBe(text)
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.find('h4').text()).toBe('Remarques / Suivi LPP')
  })
  it('sépare les PFP, répétitions et SAE du motif d’arrêt', async () => {
    const student = { pfp1: { commentaire: 'Premier stage' }, pfp1_prime: { commentaire: 'Répétition' }, sae: { commentaire: 'Aménagement' }, commentaire_arret: 'Motif distinct' }
    const wrapper = mount(SharedStudentFollowUp, { props: { student } })
    expect(wrapper.findAll('h4').map(h => h.text())).toEqual(['PFP1', 'PFP1 bis', 'Suivi SAE'])
    expect(wrapper.text()).not.toContain('Motif distinct')
    await wrapper.findAll('.edit-button')[1].trigger('click')
    expect(wrapper.emitted('edit')).toEqual([['pfp1_prime']])
    expect(student.pfp1_prime.commentaire).toBe('Répétition')
  })
  it('permet d’ajouter une rubrique encore vide', async () => {
    const wrapper = mount(SharedStudentFollowUp, { props: { student: { info_etudiant: { commentaire: 'Déjà rempli' } } } })
    expect(wrapper.find('select').element.value).toBe('pfp1')
    await wrapper.find('.add-button').trigger('click')
    expect(wrapper.emitted('edit')).toEqual([['pfp1']])
  })
  it('peut masquer la rubrique déjà présentée dans la vue courante', () => {
    const student = { pfp1: { commentaire: 'Premier stage' }, sae: { commentaire: 'Aménagement' } }
    const wrapper = mount(SharedStudentFollowUp, { props: { student, excludedFields: ['sae'], title: 'Autres cas particuliers' } })
    expect(wrapper.find('summary').text()).toContain('Autres cas particuliers')
    expect(wrapper.findAll('h4').map(h => h.text())).toEqual(['PFP1'])
    expect(wrapper.text()).not.toContain('Aménagement')
    expect(wrapper.findAll('option').map(option => option.element.value)).not.toContain('sae')
  })
  it('répercute une modification dans toutes les instances sans rechargement', async () => {
    const student = reactive({ info_etudiant: { commentaire: 'Avant' } })
    const views = Array.from({ length: 3 }, () => mount(SharedStudentFollowUp, { props: { student } }))
    student.info_etudiant = { commentaire: 'Après\nLPP' }
    await nextTick()
    views.forEach(view => expect(view.find('p').element.textContent).toBe('Après\nLPP'))
  })
  it('intègre le suivi dans les trois vues et place Info après les PFP', () => {
    expect(source.match(/<SharedStudentFollowUp\b/g)).toHaveLength(3)
    expect(source.match(/header="Cas particuliers"/g)).toHaveLength(2)
    expect(source).toContain('class="sae-roster"')
    expect(source).toContain('title="Autres cas particuliers"')
    expect(source).toContain(':excluded-fields="[\'sae\']"')
    expect(source.indexOf('<Column header="Info étudiant"')).toBeGreaterThan(source.indexOf('<template v-for="group in pfpGroups"'))
    expect(source.indexOf('<Column header="Info étudiant"')).toBeLessThan(source.indexOf('</DataTable>'))
    const openFailure = source.split('const openEchecFollowUp =')[1].split('const truncate =')[0]
    expect(openFailure).not.toContain('student[field] =')
    expect(source).toContain('lesedList.value = lesedList.value.map')
  })
})
