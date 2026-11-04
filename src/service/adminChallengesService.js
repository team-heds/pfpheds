import { supabase } from '@/supabase'

const normalizeChallenge = challenge => ({
  ...challenge,
  title: challenge.name,
  points: challenge.xp_reward || 0,
  target: challenge.target_value,
  actionType: challenge.action_type,
  startDate: challenge.start_date,
  endDate: challenge.end_date,
  createdAt: challenge.created_at
})

class AdminChallengesService {
  async getChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('id,name,description,target_value,action_type,xp_reward,badge_reward,week_number,year,start_date,end_date,is_active,status,published_at,completed_at,archived_at,created_at')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data || []).map(normalizeChallenge)
  }

  async getChallengeById(challengeId) {
    const { data, error } = await supabase
      .from('challenges')
      .select('id,name,description,target_value,action_type,xp_reward,badge_reward,week_number,year,start_date,end_date,is_active,status,published_at,completed_at,archived_at,created_at')
      .eq('id', challengeId)
      .single()
    if (error) throw error
    return normalizeChallenge(data)
  }

  toPayload(challengeData) {
    return {
      name: challengeData.title,
      description: challengeData.description || null,
      target_value: challengeData.target,
      action_type: challengeData.actionType,
      xp_reward: challengeData.points,
      start_date: challengeData.startDate || null,
      end_date: challengeData.endDate || null
    }
  }

  async createChallenge(challengeData) {
    const requestedStatus = challengeData.status || 'draft'
    const { data, error } = await supabase
      .from('challenges')
      .insert({
        ...this.toPayload(challengeData),
        status: 'draft',
        is_active: false
      })
      .select()
      .single()
    if (error) throw error
    if (requestedStatus !== 'draft') {
      await this.changeChallengeStatus(data.id, requestedStatus, 'Création depuis l’administration')
    }
    return normalizeChallenge(data)
  }

  async updateChallenge(challengeId, challengeData) {
    const current = await this.getChallengeById(challengeId)
    const { data, error } = await supabase
      .from('challenges')
      .update(this.toPayload(challengeData))
      .eq('id', challengeId)
      .select()
      .single()
    if (error) throw error
    if (challengeData.status && challengeData.status !== current.status) {
      await this.changeChallengeStatus(
        challengeId,
        challengeData.status,
        'Modification depuis l’administration'
      )
    }
    return normalizeChallenge(data)
  }

  async changeChallengeStatus(challengeId, status, reason = null) {
    const { data, error } = await supabase.rpc('transition_gamification_lifecycle', {
      p_entity_kind: 'challenge',
      p_entity_id: challengeId,
      p_next_status: status,
      p_reason: reason
    })
    if (error) throw error
    return data
  }

  async previewChallengeLifecycle(challengeId) {
    const { data, error } = await supabase.rpc('preview_gamification_lifecycle', {
      p_entity_kind: 'challenge',
      p_entity_id: challengeId
    })
    if (error) throw error
    return data
  }

  async archiveChallenge(challengeId) {
    await this.changeChallengeStatus(
      challengeId,
      'archived',
      'Archivage depuis l’administration'
    )
    return true
  }
}

export default new AdminChallengesService()
