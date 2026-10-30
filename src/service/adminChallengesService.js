import { supabase } from '@/supabase'

const CHALLENGE_FIELDS = [
  'name',
  'description',
  'target_value',
  'action_type',
  'xp_reward',
  'badge_reward',
  'week_number',
  'year',
  'start_date',
  'end_date',
  'is_active'
]

const selectChallengeFields = CHALLENGE_FIELDS.join(',') + ',id,created_at'

class AdminChallengesService {
  async getChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select(selectChallengeFields)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getActiveBadges() {
    const { data, error } = await supabase
      .from('badges')
      .select('id,name')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  }

  async createChallenge(challenge) {
    const payload = this.toDatabasePayload(challenge)
    const { data, error } = await supabase
      .from('challenges')
      .insert(payload)
      .select(selectChallengeFields)
      .single()

    if (error) throw error
    return data
  }

  async updateChallenge(id, challenge) {
    const payload = this.toDatabasePayload(challenge)
    const { data, error } = await supabase
      .from('challenges')
      .update(payload)
      .eq('id', id)
      .select(selectChallengeFields)
      .single()

    if (error) throw error
    return data
  }

  async deleteChallenge(id) {
    const { error } = await supabase
      .from('challenges')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  toDatabasePayload(challenge) {
    return {
      name: challenge.name.trim(),
      description: challenge.description.trim() || null,
      target_value: Number(challenge.target_value),
      action_type: challenge.action_type,
      xp_reward: Number(challenge.xp_reward),
      badge_reward: challenge.badge_reward || null,
      week_number: challenge.week_number === null || challenge.week_number === '' ? null : Number(challenge.week_number),
      year: challenge.year === null || challenge.year === '' ? null : Number(challenge.year),
      start_date: challenge.start_date || null,
      end_date: challenge.end_date || null,
      is_active: Boolean(challenge.is_active)
    }
  }
}

export default new AdminChallengesService()
