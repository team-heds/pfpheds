const { Router } = require('express')
const { supabaseAdmin } = require('../supabaseClient')
const {
  filterSITeacherProfiles,
  filterStudentProfiles
} = require('../security/userAudience')

const router = Router()
const PROFILE_FIELDS = [
  'user_id',
  'firebase_id',
  'email',
  'role',
  'permissions',
  'is_active',
  'family_name',
  'forname',
  'classe',
  'pfp_cohort',
  'display_name',
  'avatar_url',
  'house_id',
  'created_at'
].join(',')

function mapStudent(profile, physio) {
  const classe =
    physio?.class ||
    physio?.classe ||
    profile.classe ||
    profile.pfp_cohort ||
    'Non défini'

  return {
    id: profile.user_id,
    user_id: profile.user_id,
    firebase_id: profile.firebase_id || null,
    Nom: profile.family_name || 'Nom non disponible',
    Prenom: profile.forname || 'Prénom non disponible',
    Mail: profile.email || 'Email non disponible',
    family_name: profile.family_name || '',
    forname: profile.forname || '',
    email: profile.email || '',
    display_name: profile.display_name || '',
    Classe: classe,
    classe,
    SAE: physio?.sae === true || physio?.cas_particulier === true,
    avatar_url: profile.avatar_url || null,
    house_id: profile.house_id || null,
    created_at: profile.created_at || null,
    pfp_cohort: profile.pfp_cohort || null,
    repondant_hes: physio?.repondant_hes || null,
    role: profile.role,
    permissions: profile.permissions,
    is_active: profile.is_active,
    source: 'server-audience-directory'
  }
}

async function loadProfiles() {
  const { data, error } = await supabaseAdmin.from('user_profiles').select(PROFILE_FIELDS)
  if (error) throw error
  return data || []
}

async function loadPhysioByUserId(userIds) {
  if (!userIds.length) return new Map()
  const { data, error } = await supabaseAdmin
    .from('StudentsPhysio')
    .select('user_id,class,sae,cas_particulier,repondant_hes')
    .in('user_id', userIds)

  if (error && !['42P01', 'PGRST205'].includes(error.code)) throw error
  return new Map((data || []).map((entry) => [entry.user_id, entry]))
}

router.get('/students', async (req, res) => {
  try {
    const profiles = filterStudentProfiles(await loadProfiles())
    const physioByUserId = await loadPhysioByUserId(profiles.map((profile) => profile.user_id))
    let students = profiles.map((profile) => mapStudent(profile, physioByUserId.get(profile.user_id)))

    const classe = String(req.query?.classe || '').trim()
    if (classe) students = students.filter((student) => student.Classe === classe)

    return res.json({ data: students, count: students.length })
  } catch (error) {
    console.error('[AUDIENCE] Unable to load students:', error.message)
    return res.status(500).json({ error: 'Impossible de charger la liste des étudiants.' })
  }
})

router.get('/si-teachers', async (_req, res) => {
  try {
    const teachers = filterSITeacherProfiles(await loadProfiles()).map((profile) => ({
      id: profile.user_id,
      name:
        profile.display_name ||
        `${profile.forname || ''} ${profile.family_name || ''}`.trim() ||
        profile.email,
      email: profile.email,
      role: 'Enseignant SI'
    }))
    return res.json({ data: teachers, count: teachers.length })
  } catch (error) {
    console.error('[AUDIENCE] Unable to load SI teachers:', error.message)
    return res.status(500).json({ error: 'Impossible de charger la liste des enseignants SI.' })
  }
})

module.exports = router
