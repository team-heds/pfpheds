/**
 * Service de gestion des sessions de votation PFP.
 * 
 * Stocke les sessions dans la table Supabase `votation_sessions`.
 * Structure attendue de la table :
 *   id (uuid, PK)
 *   pfp_type (text)       — ex: 'PFP1A', 'PFP3'
 *   year (text)            — ex: '2026'
 *   target_class (text)    — ex: 'BA25', 'BA23'
 *   status (text)          — 'open' | 'closed'
 *   opened_at (timestamptz)
 *   closed_at (timestamptz, nullable)
 *   opened_by (uuid)       — user_id de l'admin
 *   created_at (timestamptz)
 */
import { supabase } from '@/supabase'

const TABLE = 'votation_sessions'

const votationSessionService = {

  /**
   * Récupérer toutes les sessions (triées par date)
   */
  async fetchAll() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Récupérer la session active pour un PFP donné
   */
  async getActiveSession(pfpType, year) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('pfp_type', pfpType)
      .eq('year', year)
      .eq('status', 'open')
      .maybeSingle()

    if (error) throw error
    return data
  },

  /**
   * Récupérer toutes les sessions ouvertes
   */
  async getAllActiveSessions() {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('status', 'open')
      .order('opened_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  /**
   * Ouvrir une nouvelle session de votation
   */
  async openSession(pfpType, year, targetClass, userId) {
    // Fermer toute session existante pour ce PFP/année
    await this.closeSession(pfpType, year)

    const { data, error } = await supabase
      .from(TABLE)
      .insert({
        pfp_type: pfpType,
        year: year,
        target_class: targetClass,
        status: 'open',
        opened_at: new Date().toISOString(),
        opened_by: userId,
        closed_at: null
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Fermer une session de votation
   */
  async closeSession(pfpType, year) {
    const { error } = await supabase
      .from(TABLE)
      .update({
        status: 'closed',
        closed_at: new Date().toISOString()
      })
      .eq('pfp_type', pfpType)
      .eq('year', year)
      .eq('status', 'open')

    if (error) throw error
  },

  /**
   * Vérifier si une session est ouverte pour un type de PFP
   * (utilisé par les routes étudiants)
   */
  async isVotationOpen(pfpType, year) {
    const session = await this.getActiveSession(pfpType, year)
    return !!session
  },

  /**
   * Récupérer la session ouverte correspondant à la classe d'un étudiant
   * (utilisé par la page de votation étudiant)
   */
  async getOpenSessionForClass(targetClass) {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('target_class', targetClass)
      .eq('status', 'open')
      .order('opened_at', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export default votationSessionService
