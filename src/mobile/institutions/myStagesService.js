import { supabase } from '@/supabase.js'
import {
  PROFILE_CRITERIA_KEYS,
  buildProgressionProfileStages,
  computeAggregatedCriteriaFromSources,
  extractStudentsPhysioFieldEntries,
  getPlaceByIdFromMap,
  parseProfileAttemptEntries,
  resolvePlaceId,
} from '@/utils/profileStages'

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

// Libellés des critères de formation pratique (les codes restent affichés).
export const CRITERIA = Object.freeze([
  { key: 'MSQ', label: 'Musculo-squelettique' },
  { key: 'SYSINT', label: 'Systèmes internes' },
  { key: 'NEUROGER', label: 'Neuro-gériatrie' },
  { key: 'AIGU', label: 'Soins aigus' },
  { key: 'REHAB', label: 'Réadaptation' },
  { key: 'AMBU', label: 'Ambulatoire' },
  { key: 'FR', label: 'Stage en français' },
  { key: 'DE', label: 'Stage en allemand' },
])

/** Critères validés et restants, dans l'ordre d'affichage. */
export function splitCriteria(aggregated = {}) {
  const known = CRITERIA.filter((criterion) => PROFILE_CRITERIA_KEYS.includes(criterion.key))
  return {
    validated: known.filter((criterion) => aggregated[criterion.key]),
    remaining: known.filter((criterion) => !aggregated[criterion.key]),
  }
}

/**
 * Stages d'un étudiant, du plus ancien au plus récent, et critères validés :
 * mêmes sources et même calcul que le profil (attributions de la votation,
 * puis parcours enregistré).
 */
export async function fetchMyStages(userId, { places = [], resolveInstitutionName = () => '' } = {}) {
  if (!userId) return { stages: [], criteria: splitCriteria() }
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
  const placesById = indexPlacesById(places)
  const stages = buildProgressionProfileStages({
    studentResultVotes: votes,
    physioStages: physio.flatMap((row) => [
      ...parseProfileAttemptEntries(row.pfp_valided),
      ...parseProfileAttemptEntries(row.pfp2_data),
    ]),
    placesById,
    resolveInstitutionName,
  })
  const aggregated = computeAggregatedCriteriaFromSources({
    studentResultVotes: votes,
    userProfile: physio[0] || null,
    studentPfpList: extractStudentsPhysioFieldEntries(physio, ['pfp_valided', 'pfp2_data']),
    resolvePlaceFromStage: (stage) => getPlaceByIdFromMap(placesById, resolvePlaceId(stage)
      ?? stage?.assigned_place_id ?? stage?.selected_places ?? stage?.id),
    criteriaKeys: PROFILE_CRITERIA_KEYS,
  })
  return { stages, criteria: splitCriteria(aggregated) }
}
