import Reveal from 'reveal.js'
import RevealHighlight from 'reveal.js/plugin/highlight'
import RevealNotes from 'reveal.js/plugin/notes'
import RevealSearch from 'reveal.js/plugin/search'
import RevealZoom from 'reveal.js/plugin/zoom'

import 'reveal.js/reveal.css'
import 'reveal.js/theme/white.css'
import 'reveal.js/plugin/highlight/monokai.css'
import './theme/heds-theme.scss'
import './theme/print.scss'

import { slides } from './presentation.js'
import { initCopyCode } from './components/copy-code.js'
import { initExternalLinks } from './components/external-link.js'
import { initChapterProgress } from './components/chapter-progress.js'

document.querySelector('#slides-root').innerHTML = slides.join('\n')

const deck = new Reveal({
  width: '100%',
  height: '100%',
  margin: 0,
  minScale: 1,
  maxScale: 1,
  hash: true,
  history: true,
  slideNumber: 'c/t',
  progress: true,
  controls: true,
  controlsTutorial: true,
  center: false,
  transition: 'slide',
  backgroundTransition: 'fade',
  overview: true,
  touch: true,
  keyboard: true,
  fragments: true,
  plugins: [RevealHighlight, RevealNotes, RevealSearch, RevealZoom],
})

window.Reveal = deck

deck.initialize().then(() => {
  initCopyCode()
  initExternalLinks()
  initChapterProgress(deck)
})

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'f' && !event.ctrlKey && !event.metaKey && !event.altKey) {
    document.documentElement.requestFullscreen?.()
  }
})
