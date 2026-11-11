/**
 * Abonnement aux notifications push de l'appareil, pour le compte connecté.
 *
 * Utilise le client Supabase de l'application (même session que le reste du site) :
 * l'abonnement est toujours rattaché au compte connecté, jamais anonyme, sinon le
 * service d'envoi ne saurait pas à qui il appartient.
 */
import { supabase } from '@/supabase'

export const PUSH_STATES = Object.freeze({
  UNSUPPORTED: 'unsupported',
  NOT_CONFIGURED: 'not_configured',
  DENIED: 'denied',
  DISABLED: 'disabled',
  ENABLED: 'enabled',
})

const vapidPublicKey = () => String(import.meta.env.VITE_VAPID_PUBLIC || '').trim()

export function isPushSupported() {
  return typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && 'serviceWorker' in navigator
    && 'PushManager' in window
    && typeof Notification !== 'undefined'
}

/** iPhone/iPad : les notifications n'existent que pour le site ajouté à l'écran d'accueil. */
export function needsHomeScreenInstall() {
  if (typeof navigator === 'undefined' || typeof window === 'undefined') return false
  const isApple = /iPhone|iPad|iPod/i.test(navigator.userAgent || '')
  const standalone = window.matchMedia?.('(display-mode: standalone)')?.matches || navigator.standalone === true
  return isApple && !standalone
}

export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const raw = atob((base64String + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}

function platformName() {
  const agent = navigator.userAgent || ''
  if (/iPhone|iPad|iPod/i.test(agent)) return 'ios'
  if (/Android/i.test(agent)) return 'android'
  return 'web'
}

async function currentUserId() {
  const { data } = await supabase.auth.getSession()
  return data?.session?.user?.id || null
}

const REGISTRATION_TIMEOUT_MS = 4000
const REGISTRATION_RETRIES = 3
const REGISTRATION_RETRY_MS = 500

/** Service worker du site, ou null s'il n'est pas installé (aperçu local, navigation privée…). */
async function activeRegistration() {
  let known = await navigator.serviceWorker.getRegistration()
  // Première visite : l'installation du service worker peut encore être en cours.
  for (let attempt = 0; !known && attempt < REGISTRATION_RETRIES; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, REGISTRATION_RETRY_MS))
    known = await navigator.serviceWorker.getRegistration()
  }
  if (!known) return null
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((resolve) => setTimeout(() => resolve(null), REGISTRATION_TIMEOUT_MS)),
  ])
}

async function browserSubscription() {
  const registration = await activeRegistration()
  return {
    registration,
    subscription: registration ? await registration.pushManager.getSubscription() : null,
  }
}

/** L'abonnement de ce navigateur est-il enregistré pour le compte connecté ? */
async function isRegisteredForUser(endpoint, userId) {
  const { data, error } = await supabase
    .from('push_subscriptions')
    .select('id')
    .eq('endpoint', endpoint)
    .eq('user_id', userId)
    .limit(1)
  return !error && Array.isArray(data) && data.length > 0
}

/** État des notifications sur cet appareil, pour le compte connecté. */
export async function getPushState() {
  if (!isPushSupported()) return PUSH_STATES.UNSUPPORTED
  if (!vapidPublicKey()) return PUSH_STATES.NOT_CONFIGURED
  if (Notification.permission === 'denied') return PUSH_STATES.DENIED
  try {
    if (Notification.permission !== 'granted') {
      return (await activeRegistration()) ? PUSH_STATES.DISABLED : PUSH_STATES.NOT_CONFIGURED
    }
    const userId = await currentUserId()
    const { registration, subscription } = await browserSubscription()
    if (!registration) return PUSH_STATES.NOT_CONFIGURED
    if (!userId || !subscription) return PUSH_STATES.DISABLED
    return (await isRegisteredForUser(subscription.endpoint, userId)) ? PUSH_STATES.ENABLED : PUSH_STATES.DISABLED
  } catch {
    return PUSH_STATES.DISABLED
  }
}

function fail(code, message) {
  return Object.assign(new Error(message), { code })
}

/**
 * Active les notifications sur cet appareil pour le compte connecté.
 * À appeler depuis un clic : le navigateur n'affiche sa demande d'autorisation qu'à ce moment.
 */
export async function enablePushForCurrentUser() {
  if (!isPushSupported()) throw fail('unsupported', 'Ce navigateur ne permet pas les notifications.')
  if (!vapidPublicKey()) throw fail('not_configured', 'Les notifications ne sont pas configurées sur ce site.')
  const userId = await currentUserId()
  if (!userId) throw fail('auth_required', 'Connectez-vous pour activer les notifications.')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw fail('denied', 'Vous n’avez pas autorisé les notifications pour ce site.')
  }

  const { registration, subscription: existing } = await browserSubscription()
  if (!registration) throw fail('not_configured', 'Les notifications ne sont pas disponibles sur ce site pour le moment.')
  let subscription = existing

  if (subscription && await isRegisteredForUser(subscription.endpoint, userId)) {
    return PUSH_STATES.ENABLED
  }

  // Abonnement laissé par un autre compte sur ce navigateur (ou jamais enregistré) :
  // on repart d'un abonnement neuf, pour que cet appareil ne reçoive que les
  // notifications du compte connecté.
  if (subscription) await subscription.unsubscribe()
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey()),
    })
  } catch {
    // Certains navigateurs exposent les notifications sans service d'envoi derrière.
    throw fail(
      'subscribe_failed',
      'Ce navigateur n’a pas pu créer l’abonnement aux notifications. Essayez avec Chrome, Edge, Firefox ou Safari.',
    )
  }

  const keys = subscription.toJSON().keys || {}
  const { error } = await supabase.from('push_subscriptions').insert({
    user_id: userId,
    endpoint: subscription.endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    platform: platformName(),
    user_agent: navigator.userAgent,
  })
  if (error) {
    await subscription.unsubscribe().catch(() => {})
    throw fail('save_failed', 'L’activation n’a pas pu être enregistrée. Réessayez dans un instant.')
  }
  return PUSH_STATES.ENABLED
}

/** Désactive les notifications sur cet appareil. */
export async function disablePushOnThisDevice() {
  if (!isPushSupported()) return PUSH_STATES.UNSUPPORTED
  const { subscription } = await browserSubscription()
  if (subscription) {
    await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint)
    await subscription.unsubscribe()
  }
  return PUSH_STATES.DISABLED
}
