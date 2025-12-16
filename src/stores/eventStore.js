import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/supabase';

export const useEventStore = defineStore('event', () => {
  const debug = (...args) => {
    if (import.meta.env.DEV) console.log(...args);
  };

  const events = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * Charger tous les événements avec leurs comptes d'inscrits et likes
   */
  async function fetchEvents() {
    try {
      loading.value = true;
      error.value = null;

      debug('📥 Chargement des événements depuis Supabase...');

      // Essayer d'abord avec la vue, sinon fallback sur la table events
      let data, fetchError;
      
      const result = await supabase
        .from('events_with_counts')
        .select('*')
        .order('start_date', { ascending: true });

      data = result.data;
      fetchError = result.error;

      // Si la vue n'existe pas, utiliser la table directe
      if (fetchError && fetchError.message?.includes('does not exist')) {
        debug('⚠️ Vue events_with_counts introuvable, utilisation de la table events');
        const result2 = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });
        
        data = result2.data;
        fetchError = result2.error;
      }

      if (fetchError) {
        console.error('❌ Erreur lors du chargement:', fetchError);
        throw fetchError;
      }

      debug(`✅ ${data?.length || 0} événements chargés`);
      events.value = data || [];
      return data;
    } catch (err) {
      console.error('Erreur lors du chargement des événements:', err);
      error.value = err.message;
      return [];
    } finally {
      loading.value = false;
    }
  }

  /**
   * Écouter les changements en temps réel sur la table events
   */
  function listenEvents() {
    // Charger les événements initiaux
    fetchEvents();

    let refreshTimer = null;

    // S'abonner aux changements en temps réel (avec gestion d'erreur)
    try {
      const subscription = supabase
        .channel('events-channel')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'events' },
          (payload) => {
            debug('🔄 Changement temps réel détecté:', payload);

            if (refreshTimer) {
              clearTimeout(refreshTimer);
            }

            refreshTimer = setTimeout(() => {
              refreshTimer = null;
              fetchEvents();
            }, 500);
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            debug('✅ Abonnement temps réel actif');
          }
          if (err) {
            console.warn('⚠️ Erreur abonnement temps réel (non bloquant):', err);
          }
        });

      // Retourner la fonction de désabonnement
      return () => {
        debug('🔌 Désabonnement du temps réel');

        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        supabase.removeChannel(subscription);
      };
    } catch (err) {
      console.warn('⚠️ Temps réel non disponible (non bloquant):', err);
      // Retourner une fonction vide si le temps réel échoue
      return () => {};
    }
  }

  /**
   * Ajouter un événement
   */
  async function addEvent(event) {
    try {
      loading.value = true;
      error.value = null;

      // 1. Upload de l'image si présente
      let imageUrl = null;
      if (event.image) {
        console.log('Upload de l\'image...');
        const fileExt = event.image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `events/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, event.image, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error('Erreur upload image:', uploadError);
        } else {
          // Obtenir l'URL publique
          const { data: { publicUrl } } = supabase.storage
            .from('events')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
          console.log('Image uploadée:', imageUrl);
        }
      }

      // 2. Créer l'événement dans la base de données
      const eventData = {
        title: event.title,
        description: event.description || '',
        start_date: event.startDate,
        end_date: event.endDate,
        lieu: event.lieu || '',
        type: event.type || 'public',
        role: event.type === 'private' ? (event.role || null) : null,
        admin_uid: event.admin,  // ✅ Utilise admin_uid (contrainte NOT NULL)
        image_url: imageUrl
      };

      console.log('📤 Données envoyées à Supabase:', eventData);

      const { data, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select()
        .single();

      if (insertError) {
        console.error('❌ Erreur Supabase insert:', insertError);
        throw insertError;
      }

      console.log('Événement créé avec succès:', data);
      
      // Recharger les événements
      await fetchEvents();
      
      return data;
    } catch (err) {
      console.error('Erreur lors de la création de l\'événement:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Mettre à jour un événement complet
   */
  async function updateEventComplete(eventId, updatedData) {
    try {
      loading.value = true;
      error.value = null;

      // 1. Gestion de l'image si nouvelle image fournie
      let imageUrl = updatedData.image_url || updatedData.existingImage;
      
      if (updatedData.image && typeof updatedData.image !== 'string') {
        console.log('Nouvelle image détectée pour update');
        
        // Supprimer l'ancienne image si elle existe
        if (updatedData.existingImage) {
          const oldPath = updatedData.existingImage.split('/events/')[1];
          if (oldPath) {
            await supabase.storage.from('events').remove([`events/${oldPath}`]);
          }
        }

        // Upload de la nouvelle image
        const fileExt = updatedData.image.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `events/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, updatedData.image);

        if (uploadError) {
          console.error('Erreur upload nouvelle image:', uploadError);
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('events')
            .getPublicUrl(filePath);
          imageUrl = publicUrl;
          console.log('Nouvelle image uploadée:', imageUrl);
        }
      }

      // 2. Mettre à jour l'événement
      const { data, error: updateError } = await supabase
        .from('events')
        .update({
          title: updatedData.title,
          description: updatedData.description,
          start_date: updatedData.startDate,
          end_date: updatedData.endDate,
          lieu: updatedData.lieu || '',
          type: updatedData.type,
          role: updatedData.role || null,
          image_url: imageUrl
        })
        .eq('id', eventId)
        .select()
        .single();

      if (updateError) throw updateError;

      console.log('Événement mis à jour avec succès:', data);
      
      // Recharger les événements
      await fetchEvents();
      
      return data;
    } catch (err) {
      console.error('Erreur lors de la mise à jour de l\'événement:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Supprimer un événement
   */
  async function deleteEvent(eventId) {
    try {
      loading.value = true;
      error.value = null;

      // 1. Récupérer l'événement pour avoir l'URL de l'image
      const { data: event } = await supabase
        .from('events')
        .select('image_url')
        .eq('id', eventId)
        .single();

      // 2. Supprimer l'image du storage si elle existe
      if (event?.image_url) {
        const imagePath = event.image_url.split('/events/')[1];
        if (imagePath) {
          await supabase.storage.from('events').remove([`events/${imagePath}`]);
          console.log('Image supprimée du storage');
        }
      }

      // 3. Supprimer l'événement (les inscriptions et likes seront supprimés en cascade)
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (deleteError) throw deleteError;

      console.log('Événement supprimé avec succès');
      
      // Recharger les événements
      await fetchEvents();
      
      return true;
    } catch (err) {
      console.error('Erreur lors de la suppression de l\'événement:', err);
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  }

  /**
   * Corriger l'admin d'un événement
   */
  async function fixEventAdmin(eventId, adminUserId) {
    try {
      const { error: updateError } = await supabase
        .from('events')
        .update({ admin_uid: adminUserId })  // ✅ Utilise admin_uid
        .eq('id', eventId);

      if (updateError) throw updateError;

      console.log(`Événement ${eventId} mis à jour avec admin: ${adminUserId}`);
      await fetchEvents();
      return true;
    } catch (err) {
      console.error('Erreur lors de la correction de l\'événement:', err);
      throw err;
    }
  }

  /**
   * Toggle inscription utilisateur à un événement
   */
  async function toggleRegistration(eventId, userId, registeredList = [], userInfo = null) {
    try {
      // Vérifier si l'utilisateur est déjà inscrit
      const { data: existing } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_uid', userId)
        .single();

      if (existing) {
        // Désinscription
        const { error: deleteError } = await supabase
          .from('event_registrations')
          .delete()
          .eq('event_id', eventId)
          .eq('user_uid', userId);

        if (deleteError) throw deleteError;
        console.log('Utilisateur désinscrit');
      } else {
        // Inscription
        const { error: insertError } = await supabase
          .from('event_registrations')
          .insert([
            {
              event_id: eventId,
              user_uid: userId,
              user_nom: userInfo?.nom || '',
              user_prenom: userInfo?.prenom || '',
              user_photo_url: userInfo?.photoURL || 'https://ui-avatars.com/api/?name=Utilisateur'
            }
          ]);

        if (insertError) throw insertError;
        console.log('Utilisateur inscrit');
      }

      // Recharger les événements pour mettre à jour les comptes
      await fetchEvents();
    } catch (err) {
      console.error('Erreur lors de l\'inscription/désinscription:', err);
      throw err;
    }
  }

  /**
   * Toggle like sur un événement
   */
  async function toggleLike(eventId, userId) {
    try {
      // Vérifier si l'utilisateur a déjà liké
      const { data: existing } = await supabase
        .from('event_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_uid', userId)
        .single();

      if (existing) {
        // Unlike
        const { error: deleteError } = await supabase
          .from('event_likes')
          .delete()
          .eq('event_id', eventId)
          .eq('user_uid', userId);

        if (deleteError) throw deleteError;
        console.log('Like retiré');
      } else {
        // Like
        const { error: insertError } = await supabase
          .from('event_likes')
          .insert([
            {
              event_id: eventId,
              user_uid: userId
            }
          ]);

        if (insertError) throw insertError;
        console.log('Like ajouté');
      }

      // Recharger les événements pour mettre à jour les comptes
      await fetchEvents();
    } catch (err) {
      console.error('Erreur lors du like/unlike:', err);
      throw err;
    }
  }

  /**
   * Récupérer les inscrits d'un événement
   */
  async function getEventRegistrations(eventId) {
    try {
      const { data, error: fetchError } = await supabase
        .from('event_registrations')
        .select('*')
        .eq('event_id', eventId)
        .order('registered_at', { ascending: false });

      if (fetchError) throw fetchError;
      return data || [];
    } catch (err) {
      console.error('Erreur lors de la récupération des inscrits:', err);
      return [];
    }
  }

  /**
   * Vérifier si un utilisateur est inscrit à un événement
   */
  async function isUserRegistered(eventId, userId) {
    try {
      const { data } = await supabase
        .from('event_registrations')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_uid', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Vérifier si un utilisateur a liké un événement
   */
  async function hasUserLiked(eventId, userId) {
    try {
      const { data } = await supabase
        .from('event_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_uid', userId)
        .single();

      return !!data;
    } catch {
      return false;
    }
  }

  return {
    events,
    loading,
    error,
    fetchEvents,
    listenEvents,
    addEvent,
    updateEventComplete,
    deleteEvent,
    fixEventAdmin,
    toggleRegistration,
    toggleLike,
    getEventRegistrations,
    isUserRegistered,
    hasUserLiked
  };
});
