import SimpleTable from './SimpleTable.vue'

const rows = [
  { filière: 'Physiothérapie', étudiants: 142, statut: 'Actif' },
  { filière: 'Soins infirmiers', étudiants: 318, statut: 'Actif' },
  { filière: 'Ergothérapie', étudiants: 86, statut: 'Planifié' },
  { filière: 'Nutrition et diététique', étudiants: 64, statut: 'Actif' },
]

export default {
  title: 'Composants/Tableaux/Tableau simple',
  component: SimpleTable,
  tags: ['autodocs'],
  args: { data: rows, height: 240, color: '#F3C300' },
}

export const Standard = {}
export const Vide = { args: { data: [] } }
export const ZoneCompacte = { args: { height: 130 } }
