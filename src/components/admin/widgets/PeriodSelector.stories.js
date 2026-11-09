import { ref } from 'vue'
import PeriodSelector from './PeriodSelector.vue'

const renderControlled = (args) => ({
  components: { PeriodSelector },
  setup() {
    const period = ref(args.modelValue)
    return { args, period }
  },
  template: '<PeriodSelector v-bind="args" v-model="period" />',
})

export default {
  title: 'Composants/Administration/Sélecteur de période',
  component: PeriodSelector,
  tags: ['autodocs'],
  render: renderControlled,
  args: { modelValue: 'month', showCustom: true, showInfo: true },
}

export const Mois = {}
export const Annee = { args: { modelValue: 'year' } }
export const Compact = { args: { showCustom: false, showInfo: false } }
