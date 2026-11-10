import { auth, isFirebaseEnabled } from '../../firebase.js'

export const STORIES_UNAVAILABLE_MESSAGE =
  'La publication de stories est en cours de modernisation et n’est pas disponible pour le moment. ' +
  'En attendant, vous pouvez partager une publication.'

/**
 * Les stories sont encore stockées dans Firebase et exigent une session Firebase.
 * Les comptes se connectent aujourd'hui avec Supabase : sans session Firebase, on le dit
 * avant de faire préparer une story qui ne pourrait pas être publiée.
 */
export async function getStoryPublishingStatus() {
  if (!isFirebaseEnabled || !auth) return { available: false, message: STORIES_UNAVAILABLE_MESSAGE }
  try {
    await auth.authStateReady?.()
  } catch {
    return { available: false, message: STORIES_UNAVAILABLE_MESSAGE }
  }
  return auth.currentUser
    ? { available: true, message: '' }
    : { available: false, message: STORIES_UNAVAILABLE_MESSAGE }
}
