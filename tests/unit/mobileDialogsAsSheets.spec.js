import fs from 'node:fs'
import path from 'node:path'
import { mount } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  DIALOG_OVERLAY,
  isDragHandle,
  requestDialogClose,
  useDialogsAsSheets,
} from '@/mobile/shell/useDialogsAsSheets'
import { OVERLAYS, canRestoreOverlay } from '@/mobile/shell/overlayRegistry'

function addMask({ closable = true } = {}) {
  const mask = document.createElement('div')
  mask.className = 'p-dialog-mask'
  mask.innerHTML = `<div class="p-dialog"><div class="p-dialog-header"><span class="p-dialog-title">Titre</span>${
    closable ? '<button class="p-dialog-header-close" aria-label="Fermer"></button>' : ''
  }</div><div class="p-dialog-content"><input></div></div>`
  document.body.appendChild(mask)
  return mask
}

const flush = async () => {
  await Promise.resolve()
  await nextTick()
}

function mountShell() {
  const names = ref([])
  const shell = {
    open: vi.fn((name) => { names.value = [...names.value, name] }),
    close: vi.fn(() => { names.value = names.value.slice(0, -1) }),
    overlayNames: () => names.value,
  }
  const Host = defineComponent({
    setup() {
      useDialogsAsSheets(shell)
      return () => h('div')
    },
  })
  const wrapper = mount(Host)
  return { wrapper, shell, names }
}

afterEach(() => {
  document.body.querySelectorAll('.p-dialog-mask').forEach((mask) => mask.remove())
})

describe('fenêtres des pages existantes en panneaux du bas', () => {
  it('inscrit chaque fenêtre ouverte dans l’adresse, sans pouvoir la rouvrir après un rechargement', async () => {
    const { wrapper, shell } = mountShell()
    addMask()
    await flush()
    expect(shell.open).toHaveBeenCalledWith(DIALOG_OVERLAY)
    expect(OVERLAYS[DIALOG_OVERLAY]).toBeTruthy()
    expect(canRestoreOverlay(DIALOG_OVERLAY)).toBe(false)
    wrapper.unmount()
  })

  it('le retour du téléphone ferme la fenêtre par sa croix', async () => {
    const { wrapper, names } = mountShell()
    const mask = addMask()
    const close = vi.fn()
    mask.querySelector('.p-dialog-header-close').addEventListener('click', close)
    await flush()
    names.value = [] // le retour retire « #/fenetre » de l’adresse
    await flush()
    expect(close).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('fermée par sa croix, la fenêtre retire aussi son entrée d’historique', async () => {
    const { wrapper, shell } = mountShell()
    const mask = addMask()
    await flush()
    mask.remove()
    await flush()
    expect(shell.close).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('sans croix, la fermeture passe par la touche Échap', () => {
    const mask = addMask({ closable: false })
    const escape = vi.fn()
    mask.querySelector('.p-dialog').addEventListener('keydown', (event) => escape(event.key))
    expect(requestDialogClose(mask)).toBe(true)
    expect(escape).toHaveBeenCalledWith('Escape')
  })

  it('on tire le panneau par son en-tête, jamais par un champ ou un bouton', () => {
    const mask = addMask()
    const dialog = mask.querySelector('.p-dialog')
    expect(isDragHandle(mask.querySelector('.p-dialog-title'), dialog)).toBe(true)
    expect(isDragHandle(dialog, dialog)).toBe(true)
    expect(isDragHandle(mask.querySelector('.p-dialog-header-close'), dialog)).toBe(false)
    expect(isDragHandle(mask.querySelector('input'), dialog)).toBe(false)
  })

  it('la feuille de style pose le panneau en bas, à 90 % au plus, avec la zone sûre', () => {
    const css = fs.readFileSync(path.resolve(__dirname, '../../src/mobile/shell/mobileDialogs.css'), 'utf8')
    expect(css).toMatch(/align-items: flex-end/)
    expect(css).toMatch(/max-height: 90%/)
    expect(css).toMatch(/safe-area-inset-bottom/)
    expect(css).toMatch(/prefers-reduced-motion/)
  })
})
