import LevelDisplay from './LevelDisplay.vue'

export default {
  title: 'Gamification/Niveau',
  component: LevelDisplay,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 42rem)"><story /></div>' })],
  args: {
    level: 7,
    currentXP: 4350,
    showProgress: true,
  },
  argTypes: {
    level: { control: { type: 'range', min: 1, max: 20, step: 1 } },
  },
}

export const Progression = {}

export const Palier = {
  args: {
    level: 10,
    currentXP: 9100,
  },
}

export const NiveauMaximum = {
  args: {
    level: 20,
    currentXP: 50000,
  },
}
