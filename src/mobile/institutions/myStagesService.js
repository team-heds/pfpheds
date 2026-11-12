import { supabase } from '@/supabase.js'
import { buildProgressionProfileStages, parseProfileAttemptEntries } from '@/utils/profileStages'

const rows = async (query) => {
  const { data, error } = await query
  if (error) throw error
  return data || []
}

/** Index des places par identifiant (texte et nombre), comme l'attend le calcul du parcours. */
export function indexPlacesById(places = []) {
  const byId = new Map()
  places.forEach((place) => {
    const id = place?.PlaceId || place?.id || place?.place_id
    if (!id) return
    byId.set(id, place)
    byId.set(String(id), place)
    const numeric = Number(id)
    if (Number.isFinite(numeric)) byId.set(numeric, place)
  })
  return byId
}

/**
 * Stages d'un étudiant, du plus ancien au plus récent : mêmes sources et même
 * calcul que le profil (attributions de la votation, puis parcours enregistré).
 */
export async function fetchMyStages(userId, { places = [], resolveInstitutionName = () => '' } = {}) {
  if (!userId) return []
  const [votes, physio] = await Promise.all([
    rows(supabase.from('student_result_vote').select('*').eq('user_id', userId)),
    rows(
      supabase
        .from('StudentsPhysio')
        .select('pfp_valided, pfp2_data')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
    ),
  ])
  return buildProgressionProfileStages({
    studentResultVotes: votes,
    physioStages: physio.flatMap((row) => [
      ...parseProfileAttemptEntries(row.pfp_valided),
      ...parseProfileAttemptEntries(row.pfp2_data),
    ]),
    placesById: indexPlacesById(places),
    resolveInstitutionName,
  })
}
