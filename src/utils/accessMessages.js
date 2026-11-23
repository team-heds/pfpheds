const DEFAULT_MESSAGE = Object.freeze({
  title: 'Accès non autorisé',
  description: 'Votre compte n’a pas les droits nécessaires pour ouvrir cette page. Si vous pensez que c’est une erreur, contactez un administrateur de la plateforme.',
  icon: 'pi-lock',
})

const MESSAGES = Object.freeze({
  'profile-scope': {
    title: 'Profil non accessible',
    description: 'Ce profil n’est pas accessible avec votre compte. Si vous en avez besoin, contactez un administrateur de la plateforme.',
    icon: 'pi-lock',
  },
  'profile-check-failed': {
    title: 'Vérification impossible',
    description: 'Nous n’avons pas pu vérifier votre accès à ce profil. Réessayez dans un instant.',
    icon: 'pi-exclamation-triangle',
  },
})

/** Message affiché sur la page d'accès refusé, selon la raison transmise par le routeur. */
export function accessMessage(reason) {
  return Object.hasOwn(MESSAGES, reason) ? MESSAGES[reason] : DEFAULT_MESSAGE
}
