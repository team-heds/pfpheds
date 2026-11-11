import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { buildOverlayHash, parseOverlayHash, useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { buildTabs, pageKey, tabForPath } from '@/mobile/shell/tabs'

const USER = 'etudiant-1'
const route = (fullPath) => {
  const [withoutHash, hash = ''] = fullPath.split('#')
  return { fullPath, path: withoutHash.split('?')[0], hash: hash ? `#${hash}` : '' }
}

describe('onglets de l’application mobile', () => {
  it('présente cinq onglets dans l’ordre convenu', () => {
    expect(buildTabs(USER).map((tab) => tab.label)).toEqual(['Carte', 'Institutions', 'Accueil', 'Recherche', 'Profil'])
    expect(buildTabs(USER).map((tab) => tab.root)).toEqual(['/map', '/institution', '/feed', '/mobile-search', `/profile/${USER}`])
  })

  it('range chaque adresse dans son onglet', () => {
    expect(tabForPath('/feed')).toBe('home')
    expect(tabForPath('/communities/abc')).toBe('home')
    expect(tabForPath('/institution')).toBe('institutions')
    expect(tabForPath('/documents_pfp')).toBe('institutions')
    expect(tabForPath('/quiz/12')).toBe('search')
    expect(tabForPath('/mot-de-la-semaine')).toBe('search')
    expect(tabForPath('/mentorat')).toBe('search')
    expect(tabForPath('/map')).toBe('map')
    expect(tabForPath('/settings')).toBe('profile')
    expect(tabForPath(`/profile/${USER}`, { userId: USER })).toBe('profile')
  })

  it('garde dans l’onglet courant une adresse sans onglet attitré', () => {
    expect(tabForPath('/profile/quelquun-d-autre', { currentTab: 'home', userId: USER })).toBe('home')
    expect(tabForPath('/admin/dashboard', { currentTab: 'search', userId: USER })).toBe('search')
    expect(tabForPath('/documentsxyz', { currentTab: 'map' })).toBe('map')
  })

  it('ignore l’ancre pour identifier une page', () => {
    expect(pageKey('/feed#/commentaires')).toBe('/feed')
    expect(pageKey('/quiz?theme=epaule#/x')).toBe('/quiz?theme=epaule')
  })
})

describe('mémoire de la coque mobile', () => {
  let store
  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMobileShellStore()
    store.setUser(USER)
    store.syncRoute(route('/feed'))
  })

  it('démarre sur l’accueil, sans retour possible', () => {
    expect(store.activeTab).toBe('home')
    expect(store.canGoBack).toBe(false)
    expect(store.backTarget()).toBeNull()
  })

  it('empile les écrans ouverts dans un onglet et sait revenir', () => {
    store.syncRoute(route('/mobile-search'))
    expect(store.direction).toBe('tab')
    store.syncRoute(route('/quiz'))
    expect(store.direction).toBe('forward')
    store.syncRoute(route('/quiz/12'))
    expect(store.canGoBack).toBe(true)
    expect(store.backTarget()).toBe('/quiz')

    store.syncRoute(route('/quiz'))
    expect(store.direction).toBe('back')
    expect(store.backTarget()).toBe('/mobile-search')
    store.syncRoute(route('/mobile-search'))
    expect(store.direction).toBe('back')
    expect(store.canGoBack).toBe(false)
  })

  it('chaque onglet garde sa vue ouverte quand on y revient', () => {
    store.syncRoute(route('/mobile-search'))
    store.syncRoute(route('/mentorat'))
    expect(store.tabTarget('home')).toBe('/feed')
    store.syncRoute(route('/feed'))
    expect(store.activeTab).toBe('home')
    // L'onglet Recherche retrouve l'écran laissé ouvert, et sa pile.
    expect(store.tabTarget('search')).toBe('/mentorat')
    store.syncRoute(route('/mentorat'))
    expect(store.activeTab).toBe('search')
    expect(store.backTarget()).toBe('/mobile-search')
  })

  it('un nouvel appui sur l’onglet actif ramène à sa racine, puis en haut de page', () => {
    store.syncRoute(route('/mobile-search'))
    store.syncRoute(route('/quiz'))
    expect(store.tabTarget('search')).toBe('/mobile-search')
    store.syncRoute(route('/mobile-search'))
    const before = store.scrollTopSignal
    expect(store.tabTarget('search')).toBeNull()
    expect(store.scrollTopSignal).toBe(before + 1)
  })

  it('ouvre le profil d’une autre personne dans l’onglet courant', () => {
    store.syncRoute(route('/profile/autre-personne'))
    expect(store.activeTab).toBe('home')
    expect(store.backTarget()).toBe('/feed')
    store.syncRoute(route(`/profile/${USER}`))
    expect(store.activeTab).toBe('profile')
    expect(store.canGoBack).toBe(false)
  })

  it('oublie les piles au changement de compte', () => {
    store.syncRoute(route('/mobile-search'))
    store.syncRoute(route('/quiz'))
    store.setUser('etudiant-2')
    expect(store.activeTab).toBe('home')
    expect(store.tabTarget('search')).toBe('/mobile-search')
    expect(store.tabTarget('profile')).toBe('/profile/etudiant-2')
  })
})

describe('panneaux et écrans empilés', () => {
  let store
  beforeEach(() => {
    setActivePinia(createPinia())
    store = useMobileShellStore()
    store.setUser(USER)
    store.syncRoute(route('/feed'))
  })

  it('lit et écrit les panneaux dans l’ancre de l’adresse', () => {
    expect(parseOverlayHash('#/notifications/commentaires')).toEqual(['notifications', 'commentaires'])
    expect(parseOverlayHash('#titre-de-section')).toEqual([])
    expect(parseOverlayHash('')).toEqual([])
    expect(buildOverlayHash(['notifications'])).toBe('#/notifications')
    expect(buildOverlayHash([])).toBe('')
  })

  it('ouvre un panneau avec ses données, puis le ferme au retour du téléphone', () => {
    const post = { id: 'p1' }
    const { hash } = store.openOverlay('commentaires', { post })
    expect(hash).toBe('#/commentaires')
    expect(store.syncRoute(route('/feed#/commentaires')).redirect).toBeNull()
    expect(store.overlays).toHaveLength(1)
    expect(store.overlays[0].props.post).toEqual(post)
    expect(store.direction).toBe('none')
    expect(store.overlayParent()).toBe('/feed')

    // Retour : l'adresse n'a plus d'ancre, le panneau disparaît.
    store.syncRoute(route('/feed'))
    expect(store.overlays).toHaveLength(0)
    expect(store.activeTab).toBe('home')
  })

  it('empile un panneau sur un écran et ne ferme que celui du dessus', () => {
    store.openOverlay('notifications')
    store.syncRoute(route('/feed#/notifications'))
    store.openOverlay('commentaires', { post: { id: 'p2' } })
    store.syncRoute(route('/feed#/notifications/commentaires'))
    expect(store.overlayNames).toEqual(['notifications', 'commentaires'])
    expect(store.overlayParent()).toBe('/feed#/notifications')
    store.syncRoute(route('/feed#/notifications'))
    expect(store.overlayNames).toEqual(['notifications'])
  })

  it('après un rechargement, rouvre seulement ce qui peut l’être', () => {
    const canRestore = (name) => name === 'notifications'
    expect(store.syncRoute(route('/feed#/notifications'), { canRestore }).redirect).toBeNull()
    expect(store.overlayNames).toEqual(['notifications'])

    // Les commentaires ont besoin d'une publication : l'adresse est nettoyée.
    const result = store.syncRoute(route('/feed#/notifications/commentaires'), { canRestore })
    expect(result.redirect).toBe('/feed#/notifications')
    expect(store.overlayNames).toEqual(['notifications'])
  })

  it('annule un panneau dont l’ouverture n’a pas abouti', () => {
    const { id } = store.openOverlay('publier')
    store.dropOverlay(id)
    expect(store.overlays).toHaveLength(0)
  })

  it('ferme les panneaux quand on change de page', () => {
    store.openOverlay('commentaires', { post: { id: 'p1' } })
    store.syncRoute(route('/feed#/commentaires'))
    store.syncRoute(route('/profile/autre-personne'))
    expect(store.overlays).toHaveLength(0)
  })
})
