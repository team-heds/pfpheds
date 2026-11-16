// Nom complet d'une personne, comme dans les commentaires (get_post_comments) :
// display_name, sinon prénom + nom. Chaîne vide si le profil n'en a pas.
export function profileDisplayName(profile) {
  const display = String(profile?.display_name || '').trim()
  if (display) return display
  return [profile?.forname, profile?.family_name]
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .join(' ')
}
