import { getAcademicYearKeys } from '@/domain/pfp/academicPeriod'
import { supabase } from '@/supabase'

const normalize = (value) => String(value ?? '').trim()

export function findExistingCampaignAssignment(rows, { userId, pfpType, year }) {
  const academicYears = new Set(getAcademicYearKeys(year).map(normalize))
  const normalizedUserId = normalize(userId)
  const normalizedPfpType = normalize(pfpType).toUpperCase()

  return (Array.isArray(rows) ? rows : []).find((row) => (
    normalize(row?.user_id) === normalizedUserId &&
    normalize(row?.pfp_type).toUpperCase() === normalizedPfpType &&
    academicYears.has(normalize(row?.year)) &&
    Boolean(normalize(row?.assigned_place_id))
  )) || null
}

export async function getExistingCampaignAssignment({ userId, pfpType, year }) {
  if (!userId || !pfpType || !year) return null

  const { data, error } = await supabase
    .from('student_result_vote')
    .select(
      'id,user_id,pfp_type,year,assigned_place_id,assigned_place_name,assigned_institution_name,status'
    )
    .eq('user_id', userId)
    .eq('pfp_type', pfpType)
    .not('assigned_place_id', 'is', null)

  if (error) throw error
  return findExistingCampaignAssignment(data, { userId, pfpType, year })
}

export async function removeAssignedCampaigns(userId, sessions) {
  const candidates = Array.isArray(sessions) ? sessions : []
  if (!userId || candidates.length === 0) return candidates

  const { data, error } = await supabase
    .from('student_result_vote')
    .select('user_id,pfp_type,year,assigned_place_id')
    .eq('user_id', userId)
    .not('assigned_place_id', 'is', null)

  if (error) throw error

  return candidates.filter((session) => !findExistingCampaignAssignment(data, {
    userId,
    pfpType: session.pfp_type,
    year: session.year
  }))
}
