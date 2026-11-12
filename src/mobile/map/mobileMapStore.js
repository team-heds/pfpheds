import { defineStore } from 'pinia'

/** Demande d'affichage d'une institution sur la carte (depuis sa fiche, par exemple). */
export const useMobileMapStore = defineStore('mobileMap', {
  state: () => ({ focusKey: null, focusRequest: 0 }),
  actions: {
    focus(key) {
      this.focusKey = key == null ? null : String(key)
      this.focusRequest += 1
    },
  },
})
