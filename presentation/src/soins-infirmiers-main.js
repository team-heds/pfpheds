import { initializeDeck } from './deck.js'
import { soinsInfirmiersSlides } from './slides/soins-infirmiers.js'
import './theme/soins-infirmiers.scss'

initializeDeck(soinsInfirmiersSlides)

document.addEventListener('click', async (event) => {
  const trigger = event.target.closest('[data-start-fullscreen]')
  if (!trigger) return

  event.preventDefault()
  const destination = trigger.getAttribute('href')

  try {
    await document.documentElement.requestFullscreen?.()
  } catch {
    // Browsers may refuse fullscreen outside a direct user gesture.
  } finally {
    if (destination) window.location.hash = destination.replace(/^#/, '')
  }
})
