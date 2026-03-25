const CARECONVERS_SESSIONS_TABLE = 'careconvers_sessions';
const CARECONVERS_INTERACTIONS_TABLE = 'careconvers_interactions';

function getDefaultSessionState() {
  return {
    currentStep: 1,
    opqrstCount: 0,
    isbarParts: [],
    quizState: null,
  };
}

function createPersistenceService(supabaseAdmin) {
  let persistenceAvailable = true;
  let interactionLoggingAvailable = true;

  function isTransientTransportError(error) {
    const message = String(error?.message || error || '').toLowerCase();
    return (
      message.includes('fetch failed') ||
      message.includes('network') ||
      message.includes('ecconnreset') ||
      message.includes('etimedout') ||
      message.includes('enotfound')
    );
  }

  async function loadSessionState(userId) {
    if (!persistenceAvailable) return getDefaultSessionState();

    try {
      const { data, error } = await supabaseAdmin
        .from(CARECONVERS_SESSIONS_TABLE)
        .select('current_step, opqrst_count, isbar_parts, quiz_state')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        if (error.code === '42P01') {
          persistenceAvailable = false;
          console.warn(`[CareConvers] Table "${CARECONVERS_SESSIONS_TABLE}" introuvable. Retour au mode mémoire.`);
        } else {
          console.error('[CareConvers] Erreur chargement session Supabase:', error.message || error);
        }
        return getDefaultSessionState();
      }

      if (!data) return getDefaultSessionState();

      return {
        currentStep: Number.isInteger(data.current_step) ? data.current_step : 1,
        opqrstCount: Number.isInteger(data.opqrst_count) ? data.opqrst_count : 0,
        isbarParts: Array.isArray(data.isbar_parts) ? data.isbar_parts : [],
        quizState: data.quiz_state || null,
      };
    } catch (e) {
      console.error('[CareConvers] Exception chargement session:', e?.message || e);
      return getDefaultSessionState();
    }
  }

  async function saveSessionState(userId, state) {
    if (!persistenceAvailable) return;

    try {
      const payload = {
        user_id: userId,
        current_step: state.currentStep,
        opqrst_count: state.opqrstCount,
        isbar_parts: state.isbarParts,
        quiz_state: state.quizState,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabaseAdmin
        .from(CARECONVERS_SESSIONS_TABLE)
        .upsert(payload, { onConflict: 'user_id' });

      if (error) {
        if (error.code === '42P01') {
          persistenceAvailable = false;
          console.warn(`[CareConvers] Table "${CARECONVERS_SESSIONS_TABLE}" introuvable. Retour au mode mémoire.`);
          return;
        }
        console.error('[CareConvers] Erreur sauvegarde session Supabase:', error.message || error);
        return;
      }
    } catch (e) {
      if (isTransientTransportError(e)) {
        console.warn('[CareConvers] Supabase indisponible temporairement pendant la sauvegarde session:', e?.message || e);
        return;
      }
      console.error('[CareConvers] Exception sauvegarde session Supabase:', e?.message || e);
    }
  }

  async function deleteSessionState(userId) {
    if (!persistenceAvailable) return;

    try {
      const { error } = await supabaseAdmin
        .from(CARECONVERS_SESSIONS_TABLE)
        .delete()
        .eq('user_id', userId);

      if (error && error.code !== '42P01') {
        console.error('[CareConvers] Erreur suppression session Supabase:', error.message || error);
      }
    } catch (e) {
      if (isTransientTransportError(e)) {
        console.warn('[CareConvers] Supabase indisponible temporairement pendant suppression session:', e?.message || e);
        return;
      }
      console.error('[CareConvers] Exception suppression session Supabase:', e?.message || e);
    }
  }

  async function saveInteraction(interaction) {
    if (!interactionLoggingAvailable) return;

    try {
      const { error } = await supabaseAdmin
        .from(CARECONVERS_INTERACTIONS_TABLE)
        .insert(interaction);

      if (error) {
        if (error.code === '42P01') {
          interactionLoggingAvailable = false;
          console.warn(`[CareConvers] Table "${CARECONVERS_INTERACTIONS_TABLE}" introuvable. Journalisation des interactions désactivée.`);
          return;
        }
        console.error('[CareConvers] Erreur sauvegarde interaction:', error.message || error);
        return;
      }
    } catch (e) {
      if (isTransientTransportError(e)) {
        console.warn('[CareConvers] Supabase indisponible temporairement pendant sauvegarde interaction:', e?.message || e);
        return;
      }
      console.error('[CareConvers] Exception sauvegarde interaction:', e?.message || e);
    }
  }

  function isPersistenceAvailable() {
    return persistenceAvailable;
  }

  return {
    getDefaultSessionState,
    loadSessionState,
    saveSessionState,
    deleteSessionState,
    saveInteraction,
    isPersistenceAvailable,
  };
}

module.exports = {
  createPersistenceService,
  getDefaultSessionState,
};
