export function initChapterProgress(deck) {
  const update = () => {
    const indices = deck.getIndices()
    const horizontalSlide = deck.getHorizontalSlides()[indices.h]
    const chapter = horizontalSlide?.dataset?.chapter
    document.documentElement.style.setProperty('--chapter-current', chapter ? `"Chapitre ${chapter}"` : '"Sommaire"')
  }

  deck.on('slidechanged', update)
  update()
}
