import ModuleSection from './ModuleSection.vue'
import moduleThumbnailOne from '../../../public/assets/images/courses/4by3/01.jpg'
import moduleThumbnailTwo from '../../../public/assets/images/courses/4by3/02.jpg'

const videos = [
  {
    vimeo_id: 'heds-module-01',
    title: 'Observation et bilan initial',
    description: 'Structurer les premières minutes de l’évaluation.',
    thumbnail_url: moduleThumbnailOne,
    duration: 16,
    in_library: true,
    matched_by_tag: true,
    vimeo_tags: ['Bilan', 'Clinique'],
  },
  {
    vimeo_id: 'heds-module-02',
    title: 'Choisir les tests pertinents',
    description: 'Relier les hypothèses cliniques aux tests fonctionnels.',
    thumbnail_url: moduleThumbnailTwo,
    duration: 24,
    in_library: true,
    matched_by_tag: false,
    vimeo_tags: ['Tests', 'Raisonnement'],
  },
]

export default {
  title: 'Composants/Médias/Section de module',
  component: ModuleSection,
  tags: ['autodocs'],
  args: {
    moduleGroup: {
      module_name: 'Raisonnement clinique',
      module_description: 'Passer de l’observation à une hypothèse clinique argumentée.',
      videos,
    },
    getVimeoThumbnail: () => moduleThumbnailOne,
    initialExpanded: true,
  },
}

export const Depliee = {}
export const Repliee = { args: { initialExpanded: false } }
