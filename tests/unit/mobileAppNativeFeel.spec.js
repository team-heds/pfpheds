import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  route: null,
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  toastAdd: vi.fn(),
  signIn: vi.fn(),
  resetPassword: vi.fn(),
  phone: null,
}))

vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('vue-router', () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: mocks.back }),
}))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toastAdd }) }))
vi.mock('primevue/toast', () => ({ default: { name: 'Toast', render: () => null } }))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ signInSupabase: mocks.signIn, resetPasswordSupabase: mocks.resetPassword, user: { id: 'u1' }, session: {} }),
}))
vi.mock('@/stores/role', () => ({ useRoleStore: () => ({ loadPermissions: vi.fn().mockResolvedValue({}) }) }))
vi.mock('@/config/adminRedirects', () => ({ getPostLoginRedirect: () => '/feed' }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: { userJourney: false } }))
vi.mock('@/service/gamificationIntegration', () => ({ default: { onLogin: vi.fn() } }))
vi.mock('@/utils/dailyVisit', () => ({ recordDailyVisit: vi.fn() }))
vi.mock('@/mobile/shell/useMobileViewport', () => ({ useMobileViewport: () => mocks.phone }))
vi.mock('@/components/common/forms/AuthForm.vue', () => ({ default: { name: 'AuthForm', render: () => null } }))

import { hideAppSplash } from '@/utils/appSplash'
import { MOBILE_BREAKPOINT_QUERY } from '@/mobile/shell/tabs'
import MobileLoginScreen from '@/mobile/auth/MobileLoginScreen.vue'
import LoginHome from '@/views/auth/LoginHome.vue'

const root = path.resolve(__dirname, '../..')
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8')

describe('application installée : portrait et démarrage', () => {
  it('le manifeste tient l’application à la verticale sur Android', () => {
    expect(read('vite.config.js')).toMatch(/orientation: 'portrait'/)
  })

  it('en paysage sur téléphone installé, un écran couvre l’application sans la démonter', () => {
    const html = read('index.html')
    expect(html).toMatch(/@media \(display-mode: standalone\) and \(orientation: landscape\) and \(max-height: 500px\) and \(pointer: coarse\)/)
    expect(html).toMatch(/id="rotate-hint" role="alert"/)
    expect(html).toMatch(/Tourne ton téléphone/)
    // L'écran est à côté de #app, pas dedans : l'application reste montée.
    expect(html.indexOf('id="rotate-hint"')).toBeLessThan(html.indexOf('<div id="app">'))
  })

  it('un téléphone tourné en paysage reste dans l’application mobile (rien n’est démonté)', () => {
    expect(MOBILE_BREAKPOINT_QUERY).toBe('(max-width: 768px), (pointer: coarse) and (max-height: 500px)')
  })

  it('chaque taille d’iPhone a son écran de démarrage, et le fichier existe', () => {
    const html = read('index.html')
    const images = [...html.matchAll(/apple-touch-startup-image" href="([^"]+)"/g)].map((match) => match[1])
    expect(images.length).toBe(12)
    for (const image of images) expect(fs.existsSync(path.join(root, 'public', image))).toBe(true)
  })

  it('l’écran de chargement s’efface en fondu après le premier rendu', () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div id="app-splash"></div>'
    const win = { matchMedia: () => ({ matches: false }), requestAnimationFrame: (callback) => callback() }
    expect(hideAppSplash({ doc: document, win })).toBe(true)
    expect(document.getElementById('app-splash').classList.contains('is-leaving')).toBe(true)
    vi.advanceTimersByTime(400)
    expect(document.getElementById('app-splash')).toBeNull()
    vi.useRealTimers()
  })

  it('sans fondu quand la personne demande moins de mouvement', () => {
    document.body.innerHTML = '<div id="app-splash"></div>'
    hideAppSplash({ doc: document, win: { matchMedia: () => ({ matches: true }) } })
    expect(document.getElementById('app-splash')).toBeNull()
    expect(hideAppSplash({ doc: document, win: {} })).toBe(false)
  })

  it('l’application retire l’écran de chargement juste après son montage', () => {
    expect(read('src/main.js')).toMatch(/app\.mount\('#app'\);\s*\n\s*hideAppSplash\(\);/)
  })
})

describe('connexion sur téléphone', () => {
  beforeEach(() => {
    mocks.route = reactive({ path: '/home', query: {}, hash: '' })
    mocks.phone = ref(true)
    mocks.push.mockImplementation((to) => { mocks.route.hash = to.hash || '' })
    mocks.replace.mockReset()
    mocks.toastAdd.mockReset()
    mocks.signIn.mockReset()
    mocks.resetPassword.mockReset()
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('champs prêts pour le trousseau iCloud et le clavier du téléphone', () => {
    const wrapper = mount(MobileLoginScreen)
    const email = wrapper.find('#m-login-email')
    const password = wrapper.find('#m-login-password')
    expect(email.attributes()).toMatchObject({ type: 'email', autocomplete: 'username', inputmode: 'email', enterkeyhint: 'next', autocapitalize: 'none' })
    expect(password.attributes()).toMatchObject({ type: 'password', autocomplete: 'current-password', enterkeyhint: 'go' })
    expect(wrapper.find('label[for="m-login-email"]').exists()).toBe(true)
  })

  it('afficher ou masquer le mot de passe', async () => {
    const wrapper = mount(MobileLoginScreen)
    const eye = wrapper.find('.m-login__eye')
    expect(eye.attributes('aria-label')).toBe('Afficher le mot de passe')
    await eye.trigger('click')
    expect(wrapper.find('#m-login-password').attributes('type')).toBe('text')
    expect(eye.attributes('aria-pressed')).toBe('true')
  })

  it('« Mot de passe oublié ? » ouvre un panneau du bas inscrit dans l’adresse', async () => {
    const wrapper = mount(MobileLoginScreen, { props: { email: 'a@heds.ch' } })
    await wrapper.find('.m-login__link').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ path: '/home', query: {}, hash: '#mot-de-passe-oublie' })
    await flushPromises()
    expect(wrapper.find('#m-login-reset-email').element.value).toBe('a@heds.ch')
    await wrapper.find('.m-login__reset').trigger('submit')
    expect(wrapper.emitted('reset')[0]).toEqual(['a@heds.ch'])
  })

  it('les erreurs de saisie s’affichent sous les champs, sans message flottant', async () => {
    const wrapper = mount(LoginHome)
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('#m-login-email-error').text()).toMatch(/adresse email est requise/)
    expect(wrapper.find('#m-login-password-error').text()).toMatch(/mot de passe est requis/)
    expect(wrapper.find('#m-login-email').attributes('aria-invalid')).toBe('true')
    expect(mocks.toastAdd).not.toHaveBeenCalled()
  })

  it('identifiants refusés : message sous le formulaire', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.signIn.mockRejectedValue(new Error('Adresse ou mot de passe incorrect.'))
    const wrapper = mount(LoginHome)
    await wrapper.find('#m-login-email').setValue('a@heds.ch')
    await wrapper.find('#m-login-password').setValue('Motdepasse1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.m-login__alert').text()).toBe('Adresse ou mot de passe incorrect.')
    expect(mocks.toastAdd).not.toHaveBeenCalled()
  })

  it('le refus du service d’authentification est traduit', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.signIn.mockRejectedValue(new Error('Invalid login credentials'))
    const wrapper = mount(LoginHome)
    await wrapper.find('#m-login-email').setValue('a@heds.ch')
    await wrapper.find('#m-login-password').setValue('Motdepasse1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(wrapper.find('.m-login__alert').text()).toBe('Adresse e-mail ou mot de passe incorrect.')
  })

  it('connexion réussie : l’application s’ouvre sans attente ni message', async () => {
    mocks.signIn.mockResolvedValue({})
    const wrapper = mount(LoginHome)
    await wrapper.find('#m-login-email').setValue('a@heds.ch')
    await wrapper.find('#m-login-password').setValue('Motdepasse1!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()
    expect(mocks.replace).toHaveBeenCalledWith('/feed')
    expect(mocks.toastAdd).not.toHaveBeenCalled()
  })

  it('lien envoyé : confirmation dans le panneau', async () => {
    mocks.resetPassword.mockResolvedValue({})
    mocks.route.hash = '#mot-de-passe-oublie'
    const wrapper = mount(LoginHome)
    await flushPromises()
    await wrapper.find('#m-login-reset-email').setValue('a@heds.ch')
    await wrapper.find('.m-login__reset').trigger('submit')
    await flushPromises()
    expect(mocks.resetPassword).toHaveBeenCalledWith('a@heds.ch')
    expect(wrapper.find('.m-login__success').text()).toMatch(/lien de réinitialisation a été envoyé/)
  })

  it('l’ordinateur garde sa page et ses messages', async () => {
    mocks.phone = ref(false)
    const wrapper = mount(LoginHome)
    expect(wrapper.find('.m-login').exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'AuthForm' }).exists()).toBe(true)
  })
})
