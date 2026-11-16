import { onBeforeUnmount, onMounted, watch } from 'vue'

// Sur téléphone, les fenêtres des pages existantes (PrimeVue `Dialog` et
// `ConfirmDialog`) deviennent des panneaux du bas : la feuille de style
// `mobileDialogs.css` les pose en bas de l'écran avec une poignée ; ce module
// ajoute la fermeture par glissement vers le bas et par le bouton retour du
// téléphone (chaque fenêtre ouverte inscrit « #/fenetre » dans l'adresse).

export const DIALOG_OVERLAY = 'fenetre'
/** Distance de glissement vers le bas qui ferme le panneau (comme `BottomSheet`). */
export const DISMISS_DISTANCE = 110
const MASK = '.p-dialog-mask'
const SETTLE = 'transform 220ms cubic-bezier(0, 0, 0.2, 1)'

/** Ferme une fenêtre PrimeVue comme le ferait la personne : croix, sinon touche Échap. */
export function requestDialogClose(mask, doc = mask?.ownerDocument) {
  const button = mask?.querySelector('.p-dialog-header-close, [data-pc-section="closebutton"]')
  if (button) {
    button.click()
    return true
  }
  const dialog = mask?.querySelector('.p-dialog')
  const KeyboardEventCtor = doc?.defaultView?.KeyboardEvent || (typeof KeyboardEvent === 'undefined' ? null : KeyboardEvent)
  if (!dialog || !KeyboardEventCtor) return false
  const escape = new KeyboardEventCtor('keydown', { key: 'Escape', code: 'Escape', bubbles: true })
  dialog.dispatchEvent(escape)
  doc?.dispatchEvent(new KeyboardEventCtor('keydown', { key: 'Escape', code: 'Escape', bubbles: true }))
  return true
}

/** Le doigt est-il posé sur la poignée ou l'en-tête (et pas sur un bouton ou un champ) ? */
export function isDragHandle(target, dialog) {
  if (!target || !dialog || !dialog.contains(target)) return false
  if (target.closest('button, a, input, select, textarea, [contenteditable="true"]')) return false
  if (target.closest('.p-dialog-header')) return true
  // La poignée est dessinée dans la marge haute du panneau.
  return target === dialog
}

/**
 * `shell` : `{ open(name), close(), overlayNames: () => string[] }`, les
 * commandes de la coque mobile.
 */
export function useDialogsAsSheets(shell, { doc = typeof document === 'undefined' ? null : document } = {}) {
  /** Fenêtres ouvertes, de la plus ancienne à la plus récente. */
  const open = []
  let observer = null

  const countOverlays = () => shell.overlayNames().filter((name) => name === DIALOG_OVERLAY).length

  function attachDrag(mask) {
    const dialog = mask.querySelector('.p-dialog')
    if (!dialog) return () => {}
    let startY = null
    let offset = 0
    const down = (event) => {
      if (event.button > 0 || !isDragHandle(event.target, dialog)) return
      startY = event.clientY
      offset = 0
      dialog.style.transition = 'none'
      dialog.setPointerCapture?.(event.pointerId)
    }
    const move = (event) => {
      if (startY === null) return
      offset = Math.max(0, event.clientY - startY)
      dialog.style.transform = offset ? `translateY(${offset}px)` : ''
    }
    const up = () => {
      if (startY === null) return
      startY = null
      dialog.style.transition = SETTLE
      if (offset > DISMISS_DISTANCE) {
        dialog.style.transform = 'translateY(100%)'
        requestDialogClose(mask, doc)
      } else {
        dialog.style.transform = ''
      }
      offset = 0
    }
    dialog.addEventListener('pointerdown', down)
    dialog.addEventListener('pointermove', move)
    dialog.addEventListener('pointerup', up)
    dialog.addEventListener('pointercancel', up)
    return () => {
      dialog.removeEventListener('pointerdown', down)
      dialog.removeEventListener('pointermove', move)
      dialog.removeEventListener('pointerup', up)
      dialog.removeEventListener('pointercancel', up)
    }
  }

  function added(mask) {
    if (open.some((entry) => entry.mask === mask)) return
    open.push({ mask, detach: attachDrag(mask) })
    shell.open(DIALOG_OVERLAY)
  }

  function removed(mask) {
    const index = open.findIndex((entry) => entry.mask === mask)
    if (index === -1) return
    open[index].detach()
    open.splice(index, 1)
    // Fermée par sa croix ou son bouton : on retire aussi son entrée d'historique.
    const names = shell.overlayNames()
    if (names[names.length - 1] === DIALOG_OVERLAY && countOverlays() > open.length) shell.close()
  }

  function scan() {
    if (!doc?.body) return
    const masks = [...doc.body.querySelectorAll(MASK)]
    for (const entry of [...open]) if (!masks.includes(entry.mask) || !entry.mask.isConnected) removed(entry.mask)
    for (const mask of masks) added(mask)
  }

  // Retour du téléphone : l'entrée « fenetre » a disparu de l'adresse, on ferme
  // la fenêtre la plus récente qui reste ouverte.
  const stop = watch(
    () => countOverlays(),
    (count) => {
      while (open.length > count) {
        const entry = open.pop()
        entry.detach()
        if (entry.mask.isConnected) requestDialogClose(entry.mask, doc)
      }
    },
  )

  onMounted(() => {
    if (!doc?.body || typeof MutationObserver === 'undefined') return
    observer = new MutationObserver(scan)
    observer.observe(doc.body, { childList: true })
    scan()
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    stop()
    for (const entry of open) entry.detach()
    open.length = 0
  })

  return { scan }
}
