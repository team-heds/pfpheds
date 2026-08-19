/**
 * @module authStore
 * @description Store Pinia pour l'authentification multi-provider (Firebase + Supabase).
 *
 * @state {Object|null} user - Utilisateur connecté (Firebase User ou Supabase User)
 * @state {Object|null} session - Session Supabase active
 * @state {boolean} loading - Indicateur de chargement
 * @state {string|null} error - Dernier message d'erreur
 * @state {string|null} authProvider - Provider actif ('firebase' | 'supabase')
 *
 * @getter {boolean} isLoggedIn - true si un utilisateur est connecté
 * @getter {boolean} isFirebaseUser - true si connecté via Firebase
 * @getter {boolean} isSupabaseUser - true si connecté via Supabase
 *
 * @action signUpFirebase(credentials) - Inscription Firebase
 * @action signInFirebase(credentials) - Connexion Firebase
 * @action resetPasswordFirebase(email) - Réinitialisation mot de passe Firebase
 * @action signUpSupabase(credentials) - Inscription Supabase
 * @action signInSupabase(credentials) - Connexion Supabase
 * @action resetPasswordSupabase(email) - Réinitialisation mot de passe Supabase
 * @action signOut() - Déconnexion (les deux providers)
 * @action monitorSession() - Surveillance de la session active
 */
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase';
import { auth, isFirebaseEnabled } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { requestPasswordRecovery } from '@/service/passwordRecoveryRequestService';

export const useAuthStore = defineStore('auth', () => {
  const AUTH_BYPASS = import.meta.env.VITE_DISABLE_AUTH === 'true';
  const GUEST_USER = {
    id: 'guest-user',
    email: 'guest@local',
    user_metadata: { full_name: 'Guest User' },
  };

  // State
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const authProvider = ref(null); // 'firebase' ou 'supabase'
  const sessionCheckInterval = ref(null);
  const lastSessionCheck = ref(null);
  const initialized = ref(false);
  let authCheckPromise = null;
  let initializePromise = null;
  let refreshPromise = null;
  let monitoringPromise = null;

  function applySupabaseSession(nextSession) {
    session.value = nextSession || null;
    user.value = nextSession?.user || null;
    authProvider.value = nextSession ? 'supabase' : null;
    lastSessionCheck.value = Date.now();
  }

  function isExpiredSessionError(authError) {
    const code = String(authError?.code || '').toLowerCase();
    const message = String(authError?.message || '').toLowerCase();
    return code.includes('refresh_token') || code.includes('session_not_found') ||
      message.includes('invalid') || message.includes('expired') || message.includes('jwt') ||
      message.includes('refresh token not found');
  }

  async function discardInvalidSupabaseSession() {
    // A rejected refresh token belongs only to this browser session. Supabase
    // recommends local scope so other devices remain signed in.
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (_) {
      // The in-memory state must still be cleared if the auth endpoint is down.
    }
    applySupabaseSession(null);
    initialized.value = true;
  }

  function refreshSessionSingleFlight() {
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
      const { data, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !data?.session) {
        if (isExpiredSessionError(refreshError)) {
          await discardInvalidSupabaseSession();
        }
        throw refreshError || new Error('Session refresh failed');
      }
      applySupabaseSession(data.session);
      return data.session;
    })().finally(() => {
      refreshPromise = null;
    });

    return refreshPromise;
  }

  // Getters
  const isLoggedIn = computed(() => AUTH_BYPASS || !!user.value);
  // Firebase reste disponible pour quelques données historiques, mais ne constitue
  // plus jamais un fournisseur d'authentification de la plateforme.
  const isFirebaseUser = computed(() => false);
  const isSupabaseUser = computed(() => AUTH_BYPASS || authProvider.value === 'supabase');

  // Actions Firebase
  async function signUpFirebase(credentials) {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      return { user: GUEST_USER, session: session.value };
    }
    if (!isFirebaseEnabled || !auth) {
      throw new Error('Firebase is disabled. Configure VITE_FIREBASE_* env vars to use Firebase auth.');
    }
    loading.value = true;
    error.value = null;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, credentials.email, credentials.password);
      user.value = userCredential.user;
      authProvider.value = 'firebase';
      session.value = null;
      return userCredential;
    } catch (e) {
      error.value = e.message;
      console.error('Firebase sign up error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signInFirebase(credentials) {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      return { user: GUEST_USER, session: session.value };
    }
    if (!isFirebaseEnabled || !auth) {
      throw new Error('Firebase is disabled. Configure VITE_FIREBASE_* env vars to use Firebase auth.');
    }
    loading.value = true;
    error.value = null;
    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      user.value = userCredential.user;
      authProvider.value = 'firebase';
      session.value = null;
      return userCredential;
    } catch (e) {
      error.value = e.message;
      console.error('Firebase sign in error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function resetPasswordFirebase(email) {
    if (AUTH_BYPASS) return;
    if (!isFirebaseEnabled || !auth) {
      throw new Error('Firebase is disabled. Configure VITE_FIREBASE_* env vars to use Firebase auth.');
    }
    loading.value = true;
    error.value = null;
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (e) {
      error.value = e.message;
      console.error('Firebase reset password error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  // Actions Supabase
  async function signUpSupabase(credentials) {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      return { user: GUEST_USER, session: session.value };
    }
    loading.value = true;
    error.value = null;
    try {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) throw signUpError;
      user.value = data.user;
      session.value = data.session;
      authProvider.value = 'supabase';
      return data;
    } catch (e) {
      error.value = e.message;
      console.error('Supabase sign up error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signInSupabase(credentials) {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      return { user: GUEST_USER, session: session.value };
    }
    loading.value = true;
    error.value = null;
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) throw signInError;
      user.value = data.user;
      session.value = data.session;
      authProvider.value = 'supabase';
      return data;
    } catch (e) {
      error.value = e.message;
      console.error('Supabase sign in error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function resetPasswordSupabase(email) {
    if (AUTH_BYPASS) return;
    loading.value = true;
    error.value = null;
    try {
      await requestPasswordRecovery(email);
    } catch (e) {
      error.value = e.code || 'password_recovery_unavailable';
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      return;
    }
    loading.value = true;
    error.value = null;
    try {
      if (authProvider.value === 'supabase') {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      } else if (authProvider.value === 'firebase' && auth) {
        await auth.signOut();
      }
      user.value = null;
      session.value = null;
      authProvider.value = null;
    } catch (e) {
      error.value = e.message;
      console.error('Sign out error:', e.message);
    } finally {
      loading.value = false;
    }
  }

  async function checkAuthState() {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      lastSessionCheck.value = Date.now();
      initialized.value = true;
      return session.value;
    }

    if (authCheckPromise) return authCheckPromise;

    authCheckPromise = (async () => {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        let currentSession = sessionData?.session || null;
        if (!currentSession) {
          applySupabaseSession(null);
          initialized.value = true;
          return null;
        }

        const expiresAt = Number(currentSession.expires_at || 0);
        const secondsUntilExpiry = expiresAt - Math.floor(Date.now() / 1000);
        if (expiresAt && secondsUntilExpiry < 300) {
          currentSession = await refreshSessionSingleFlight();
        }

        const { data: userData, error: getUserError } = await supabase.auth.getUser();
        if (getUserError) {
          if (!isExpiredSessionError(getUserError)) throw getUserError;
          currentSession = await refreshSessionSingleFlight();
        } else if (userData?.user) {
          currentSession = { ...currentSession, user: userData.user };
        }

        applySupabaseSession(currentSession);
        initialized.value = true;
        return currentSession;
      } catch (sessionFailure) {
        if (!isExpiredSessionError(sessionFailure)) throw sessionFailure;
        await discardInvalidSupabaseSession();
        return null;
      }
    })().finally(() => {
      authCheckPromise = null;
    });

    return authCheckPromise;
  }

  // Vérification périodique de la session (toutes les 2 minutes)
  function startSessionMonitoring() {
    if (AUTH_BYPASS) return;
    if (sessionCheckInterval.value) {
      clearInterval(sessionCheckInterval.value);
    }
    
    sessionCheckInterval.value = setInterval(async () => {
      // Ne vérifier que si un utilisateur est connecté
      if (user.value && authProvider.value === 'supabase') {
        if (monitoringPromise) return;
        monitoringPromise = (async () => {
        try {
          const { data, error } = await supabase.auth.getSession();
          if (error || !data.session) {
            await checkAuthState();
          } else {
            // Vérifier l'expiration
            const expiresAt = data.session.expires_at;
            const now = Math.floor(Date.now() / 1000);
            const timeUntilExpiry = expiresAt - now;
            
            if (timeUntilExpiry < 600) { // Moins de 10 minutes
              await refreshSessionSingleFlight();
            }
          }
        } catch (err) {
          console.error('❌ Erreur lors de la vérification périodique:', err);
        } finally {
          monitoringPromise = null;
        }
        })();
      }
    }, 120000); // Toutes les 2 minutes
    
  }
  
  function stopSessionMonitoring() {
    if (sessionCheckInterval.value) {
      clearInterval(sessionCheckInterval.value);
      sessionCheckInterval.value = null;
    }
  }

  // Initialisation du store
  async function initializeAuth() {
    if (AUTH_BYPASS) {
      user.value = GUEST_USER;
      authProvider.value = 'supabase';
      session.value = { user: GUEST_USER };
      lastSessionCheck.value = Date.now();
      initialized.value = true;
      return session.value;
    }
    if (initialized.value) return session.value;
    if (initializePromise) return initializePromise;

    initializePromise = (async () => {
      await checkAuthState();
      startSessionMonitoring();
      return session.value;
    })().finally(() => {
      initializePromise = null;
    });

    return initializePromise;
  }

  // Gérer les changements d'état d'authentification pour les deux systèmes

  // Supabase auth state change
  supabase.auth.onAuthStateChange((event, newSession) => {
    if (AUTH_BYPASS) return;
    // Gérer tous les événements qui indiquent une session active
    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' || event === 'USER_UPDATED') && newSession) {
      // Supabase est l'unique source d'authentification de la plateforme.
      applySupabaseSession(newSession);
        
      if (event === 'SIGNED_IN') {
        // 🆕 CRÉATION AUTOMATIQUE DU PROFIL (DÉSACTIVÉ TEMPORAIREMENT)
        try {
            // await userProfileAutoCreation.createUserProfileFromAuth(newSession.user, 'supabase');
          // await userProfileAutoCreation.updateLastLogin(newSession.user.id);
        } catch (error) {
          console.error('❌ Erreur création automatique profil:', error);
          // L\'erreur ne bloque pas la connexion
        }
      }
    } else if (event === 'SIGNED_OUT') {
      if (authProvider.value === 'supabase') {
        applySupabaseSession(null);
      }
    }
  });

  return {
    user,
    session,
    loading,
    error,
    authProvider,
    isLoggedIn,
    isFirebaseUser,
    isSupabaseUser,
    lastSessionCheck,
    initialized,
    // Firebase methods
    signUpFirebase,
    signInFirebase,
    resetPasswordFirebase,
    // Supabase methods
    signUpSupabase,
    signInSupabase,
    resetPasswordSupabase,
    // Common methods
    signOut,
    checkAuthState,
    refreshSessionSingleFlight,
    initializeAuth,
    startSessionMonitoring,
    stopSessionMonitoring,
  };
});
