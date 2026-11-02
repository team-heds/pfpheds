export const PROFILE_LANGUAGE_OPTIONS = Object.freeze([
  Object.freeze({ label: 'Français', value: 'fr' }),
  Object.freeze({ label: 'Allemand', value: 'de' }),
])

export const SWISS_CANTON_OPTIONS = Object.freeze([
  ['AG', 'Argovie'],
  ['AI', 'Appenzell Rhodes-Intérieures'],
  ['AR', 'Appenzell Rhodes-Extérieures'],
  ['BE', 'Berne'],
  ['BL', 'Bâle-Campagne'],
  ['BS', 'Bâle-Ville'],
  ['FR', 'Fribourg'],
  ['GE', 'Genève'],
  ['GL', 'Glaris'],
  ['GR', 'Grisons'],
  ['JU', 'Jura'],
  ['LU', 'Lucerne'],
  ['NE', 'Neuchâtel'],
  ['NW', 'Nidwald'],
  ['OW', 'Obwald'],
  ['SG', 'Saint-Gall'],
  ['SH', 'Schaffhouse'],
  ['SO', 'Soleure'],
  ['SZ', 'Schwytz'],
  ['TG', 'Thurgovie'],
  ['TI', 'Tessin'],
  ['UR', 'Uri'],
  ['VD', 'Vaud'],
  ['VS', 'Valais'],
  ['ZG', 'Zoug'],
  ['ZH', 'Zurich'],
].map(([value, name]) => Object.freeze({ label: `${name} (${value})`, value })))

const valueFromOptions = (value, options) => {
  const normalized = String(value || '').trim().toUpperCase()
  return options.some((option) => option.value.toUpperCase() === normalized)
    ? options.find((option) => option.value.toUpperCase() === normalized).value
    : null
}

export const normalizeProfilePreferences = ({ city, preferredLanguage, cantonOfOrigin } = {}) => ({
  city: String(city || '').trim().slice(0, 100) || null,
  preferred_language: valueFromOptions(preferredLanguage, PROFILE_LANGUAGE_OPTIONS),
  canton_of_origin: valueFromOptions(cantonOfOrigin, SWISS_CANTON_OPTIONS),
})

export const getProfileLanguageLabel = (value) =>
  PROFILE_LANGUAGE_OPTIONS.find((option) => option.value === value)?.label || 'Non renseignée'

export const getCantonOfOriginLabel = (value) =>
  SWISS_CANTON_OPTIONS.find((option) => option.value === value)?.label || 'Non renseigné'
