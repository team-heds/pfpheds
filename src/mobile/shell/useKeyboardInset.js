import { onBeforeUnmount, onMounted } from 'vue'

/**
 * Hauteur occupée par le clavier du téléphone, exposée dans la variable CSS
 * `--m-keyboard` de l'élément donné. Sur iPhone le clavier recouvre la page
 * sans la redimensionner : les panneaux du bas s'en servent pour rester visibles.
 */
export function useKeyboardInset(elementRef, win = typeof window !== 'undefined' ? window : null) {
  const viewport = win?.visualViewport
  if (!viewport) return

  const update = () => {
    const inset = Math.max(0, Math.round(win.innerHeight - viewport.height - viewport.offsetTop))
    // En dessous de 80 px ce n'est pas un clavier (barre du navigateur qui se replie).
    elementRef.value?.style.setProperty('--m-keyboard', `${inset > 80 ? inset : 0}px`)
  }

  onMounted(() => {
    viewport.addEventListener('resize', update)
    viewport.addEventListener('scroll', update)
    update()
  })
  onBeforeUnmount(() => {
    viewport.removeEventListener('resize', update)
    viewport.removeEventListener('scroll', update)
  })
}
