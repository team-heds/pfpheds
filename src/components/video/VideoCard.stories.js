import VideoCard from './VideoCard.vue'
import videoThumbnail from '../../../public/assets/images/courses/4by3/01.jpg'

const video = {
  vimeo_id: 'heds-clinical-01',
  title: 'Mobilisation de l’épaule : principes cliniques',
  description: 'Identifier les repères, doser la mobilisation et adapter la technique à la situation clinique.',
  thumbnail_url: videoThumbnail,
  duration: 18,
  in_library: true,
  matched_by_tag: true,
  vimeo_tags: ['Physiothérapie', 'Mobilisation', 'Épaule', 'Pratique clinique'],
  vimeo_url: 'https://vimeo.com/',
}

export default {
  title: 'Composants/Médias/Carte vidéo',
  component: VideoCard,
  tags: ['autodocs'],
  decorators: [() => ({ template: '<div style="width:min(100%, 23rem)"><story /></div>' })],
  args: { video, progress: 0, getVimeoThumbnail: () => videoThumbnail },
}

export const ADecouvrir = {}
export const EnCours = { args: { progress: 64 } }
export const SansDescription = { args: { video: { ...video, description: '', vimeo_tags: [] } } }
