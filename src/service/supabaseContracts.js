const freezeColumns = (columns) => Object.freeze([...columns])

/**
 * Colonnes critiques validées en lecture seule contre le schéma de production.
 * La casse est volontaire : PostgREST distingue `CreatedAt` de `created_at`.
 */
export const CRITICAL_SUPABASE_CONTRACTS = Object.freeze({
  places: freezeColumns([
    'PlaceId',
    'InstitutionId',
    'NomPlace',
    'PFP1A',
    'PFP1B',
    'fileurl',
    'CreatedAt',
    'UpdatedAt'
  ]),
  institutions: freezeColumns(['InstitutionId', 'Name', 'Canton', 'Locality']),
  StudentsPhysio: freezeColumns([
    'user_id',
    'class',
    'msq',
    'sysint',
    'neuroger',
    'aigu',
    'rehab',
    'ambu',
    'fr',
    'de',
    'sae',
    'cas_particulier',
    'canton',
    'repondant_hes'
  ]),
  user_profiles: freezeColumns([
    'user_id',
    'email',
    'display_name',
    'forname',
    'family_name',
    'pfp_cohort',
    'role',
    'is_active'
  ]),
  student_result_vote: freezeColumns([
    'id',
    'status',
    'pfp_type',
    'pfp_validee',
    'pfp_echec',
    'pfp_arret',
    'assigned_place_id',
    'created_at',
    'updated_at'
  ]),
  votation_sessions: freezeColumns([
    'id',
    'pfp_type',
    'target_class',
    'status',
    'is_priority',
    'opened_at',
    'closed_at'
  ]),
  RepondantPhysioHES: freezeColumns(['id', 'first_name', 'last_name', 'email']),
  praticiens_formateurs: freezeColumns(['id'])
})

export const SUPABASE_SELECTS = Object.freeze({
  pfpStatsPlaces: 'PlaceId,PFP1A,PFP1B,InstitutionId',
  pfpStatsInstitutions: 'InstitutionId,Name,Canton,Locality',
  pfpStudents: 'user_id,email,display_name,forname,family_name,pfp_cohort',
  studentPhysioCriteria:
    'user_id,class,msq,sysint,neuroger,aigu,rehab,ambu,fr,de,sae,cas_particulier,canton',
  dashboardPlaces: 'PlaceId,InstitutionId,NomPlace,fileurl,CreatedAt,UpdatedAt',
  dashboardRecentPlaces: 'PlaceId,NomPlace,CreatedAt',
  dashboardVotes:
    'id,status,pfp_type,pfp_validee,pfp_echec,pfp_arret,assigned_place_id,created_at,updated_at',
  dashboardSessions: 'id,pfp_type,target_class,status,is_priority,opened_at,closed_at'
})

export function getCriticalContractSelect(table) {
  const columns = CRITICAL_SUPABASE_CONTRACTS[table]
  if (!columns) throw new Error(`Contrat Supabase critique inconnu: ${table}`)
  return columns.join(',')
}
