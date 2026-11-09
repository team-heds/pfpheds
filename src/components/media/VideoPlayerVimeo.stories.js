import VideoPlayerVimeo from './VideoPlayerVimeo.vue'

export default {
  title: 'Composants/Médias/Lecteur Vimeo',
  component: VideoPlayerVimeo,
  tags: ['autodocs'],
  args: {
    vimeoId: '76979871',
    title: 'Présentation vidéo du module',
    params: { dnt: 1, title: 0, byline: 0, portrait: 0 },
  },
  decorators: [() => ({ template: '<div style="width:min(100%,64rem);margin-inline:auto"><story /></div>' })],
}

export const Standard = {}
export const AvecMetadonnees = { args: { params: { dnt: 1, title: 1, byline: 1, portrait: 1 } } }
export const LectureEnBoucle = { args: { params: { dnt: 1, loop: 1, muted: 1, title: 0 } } }
export const ControleMinimal = { args: { params: { dnt: 1, controls: 0, title: 0, byline: 0 } } }
export const Mobile = { parameters: { viewport: { defaultViewport: 'mobile1' } } }

