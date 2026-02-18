/**
 * Store Pinia pour la gestion de l'association Alp'in Physio
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/supabase';

export const useAlpinPhysioStore = defineStore('alpinPhysio', () => {
  // État
  const members = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Charger tous les membres actifs de l'association
   */
  async function fetchMembers() {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: fetchError } = await supabase
        .from('alpinphysio_members')
        .select('*')
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (fetchError) throw fetchError;

      members.value = data || [];
      return data;
    } catch (err) {
      console.error('Erreur lors du chargement des membres:', err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Vérifier si un utilisateur est membre de l'association
   * @param {string} userId - UID de l'utilisateur
   * @returns {boolean}
   */
  function isMember(userId) {
    if (!userId) return false;
    return members.value.some(m => m.user_id === userId && m.is_active);
  }

  /**
   * Vérifier si un utilisateur est admin de l'association
   * @param {string} userId - UID de l'utilisateur
   * @returns {boolean}
   */
  function isAdmin(userId) {
    if (!userId) return false;
    return members.value.some(m => m.user_id === userId && m.role === 'admin' && m.is_active);
  }

  /**
   * Obtenir les infos d'un membre
   * @param {string} userId - UID de l'utilisateur
   * @returns {Object|null}
   */
  function getMember(userId) {
    if (!userId) return null;
    return members.value.find(m => m.user_id === userId) || null;
  }

  /**
   * Ajouter un membre à l'association (admin only)
   * @param {Object} memberData - { user_id, nom, prenom, email, poste, role }
   */
  async function addMember(memberData) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: insertError } = await supabase
        .from('alpinphysio_members')
        .insert([{
          user_id: memberData.user_id,
          nom: memberData.nom || '',
          prenom: memberData.prenom || '',
          email: memberData.email || '',
          poste: memberData.poste || '',
          role: memberData.role || 'member',
          is_active: true
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      await fetchMembers(); // Recharger la liste
      return data;
    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Mettre à jour un membre (admin only)
   * @param {string} memberId - ID du membre
   * @param {Object} updates - Champs à mettre à jour
   */
  async function updateMember(memberId, updates) {
    try {
      loading.value = true;
      error.value = null;

      const { data, error: updateError } = await supabase
        .from('alpinphysio_members')
        .update(updates)
        .eq('id', memberId)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchMembers(); // Recharger la liste
      return data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour du membre:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Désactiver un membre (admin only)
   * @param {string} memberId - ID du membre
   */
  async function deactivateMember(memberId) {
    try {
      loading.value = true;
      error.value = null;

      const { error: updateError } = await supabase
        .from('alpinphysio_members')
        .update({ is_active: false })
        .eq('id', memberId);

      if (updateError) throw updateError;

      await fetchMembers(); // Recharger la liste
      return true;
    } catch (err) {
      console.error('Erreur lors de la désactivation du membre:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Supprimer un membre (admin only)
   * @param {string} memberId - ID du membre
   */
  async function deleteMember(memberId) {
    try {
      loading.value = true;
      error.value = null;

      const { error: deleteError } = await supabase
        .from('alpinphysio_members')
        .delete()
        .eq('id', memberId);

      if (deleteError) throw deleteError;

      await fetchMembers(); // Recharger la liste
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression du membre:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  return {
    // État
    members,
    loading,
    error,
    
    // Actions
    fetchMembers,
    isMember,
    isAdmin,
    getMember,
    addMember,
    updateMember,
    deactivateMember,
    deleteMember
  };
});
