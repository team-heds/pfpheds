// Demandes de partenariat Alp'in Physio : fonctions pures (testables, sans accès réseau).

export const PARTNERSHIP_STATUSES = [
  { value: 'new', label: 'Nouvelle' },
  { value: 'in_progress', label: 'En cours' },
  { value: 'done', label: 'Traitée' },
  { value: 'archived', label: 'Archivée' },
]

export const partnershipStatusLabel = (value) => PARTNERSHIP_STATUSES.find((status) => status.value === value)?.label || value

export const emptyPartnershipRequest = () => ({
  organization: '', contact_name: '', email: '', phone: '', event_date: '', location: '', masseurs_count: '', message: '', website: '',
})

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/

/** Renvoie un message par champ en erreur ; un objet vide signifie que le formulaire est valide. */
export function validatePartnershipRequest(form = {}) {
  const errors = {}
  const text = (key) => String(form[key] ?? '').trim()

  if (text('organization').length < 2) errors.organization = 'Indiquez le nom de votre événement ou de votre organisation.'
  else if (text('organization').length > 160) errors.organization = 'Ce nom est trop long (160 caractères au maximum).'

  if (text('contact_name').length < 2) errors.contact_name = 'Indiquez votre nom.'
  else if (text('contact_name').length > 120) errors.contact_name = 'Ce nom est trop long (120 caractères au maximum).'

  if (!text('email')) errors.email = 'Indiquez une adresse e-mail pour que nous puissions vous répondre.'
  else if (!EMAIL_PATTERN.test(text('email')) || text('email').length > 200) errors.email = 'Cette adresse e-mail ne semble pas valide.'

  if (text('phone').length > 40) errors.phone = 'Ce numéro est trop long.'
  if (text('location').length > 160) errors.location = 'Ce lieu est trop long (160 caractères au maximum).'
  if (text('event_date') && !/^\d{4}-\d{2}-\d{2}$/.test(text('event_date'))) errors.event_date = 'Cette date n’est pas valide.'

  if (text('masseurs_count')) {
    const count = Number(text('masseurs_count'))
    if (!Number.isInteger(count) || count < 1 || count > 200) errors.masseurs_count = 'Indiquez un nombre entre 1 et 200.'
  }
  if (text('message').length > 2000) errors.message = 'Ce message est trop long (2000 caractères au maximum).'
  return errors
}

/** Lien « répondre par e-mail » prérempli pour une demande. */
export function partnershipReplyLink(request = {}) {
  const subject = `Votre demande de partenariat — ${request.organization || 'Alp’in Physio'}`
  const body = `Bonjour ${request.contact_name || ''},\n\nMerci pour votre demande.\n\n`
  return `mailto:${encodeURIComponent(request.email || '').replace('%40', '@')}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
