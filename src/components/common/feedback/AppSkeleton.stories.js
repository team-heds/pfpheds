import AppSkeleton from './AppSkeleton.vue'

export default {
  title: 'Composants/Feedback/Squelette de chargement',
  component: AppSkeleton,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 58rem)"><story /></div>' })],
  args: {
    variant: 'table',
    rows: 5,
    cols: 4,
    label: 'Chargement du tableau des institutions',
  },
  argTypes: {
    variant: { control: 'select', options: ['table', 'list', 'line'] },
    rows: { control: { type: 'range', min: 1, max: 12 } },
    cols: { control: { type: 'range', min: 1, max: 8 } },
  },
}

export const Tableau = {}
export const Liste = { args: { variant: 'list', rows: 6, label: 'Chargement de la liste des étudiants' } }
export const LigneUnique = { args: { variant: 'line', label: 'Chargement de la valeur' } }

