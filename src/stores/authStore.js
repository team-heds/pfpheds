import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase';
import { auth } from '@/firebase'; // Import Firebase auth
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const error = ref(null);
  const authProvider = ref(null); // 'firebase' ou 'supabase'

  // Getters
  const isLoggedIn = computed(() => !!user.value);
  const isFirebaseUser = computed(() => authProvider.value === 'firebase');
  const isSupabaseUser = computed(() => authProvider.value === 'supabase');

  // Actions Firebase
  async function signUpFirebase(credentials) {
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
    loading.value = true;
    error.value = null;
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
      if (resetError) throw resetError;
    } catch (e) {
      error.value = e.message;
      console.error('Supabase reset password error:', e.message);
      throw e;
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    error.value = null;
    try {
      if (authProvider.value === 'supabase') {
        const { error: signOutError } = await supabase.auth.signOut();
        if (signOutError) throw signOutError;
      } else if (authProvider.value === 'firebase') {
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
    // Vérifier Firebase
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
      user.value = firebaseUser;
      authProvider.value = 'firebase';
      return;
    }

    // Vérifier Supabase
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      user.value = data.user;
      authProvider.value = 'supabase';
      const { data: sessionData } = await supabase.auth.getSession();
      session.value = sessionData.session;
    }
  }
  
  // Initialisation du store
  async function initializeAuth() {
    await checkAuthState();
  }

  // Gérer les changements d'état d'authentification pour les deux systèmes
  
  // Supabase auth state change
  supabase.auth.onAuthStateChange((event, newSession) => {
    console.log('Supabase auth state change:', event, newSession?.user?.email);
    
    if (event === 'SIGNED_IN' && newSession) {
      // Ne pas écraser si Firebase est déjà connecté
      if (authProvider.value !== 'firebase') {
        session.value = newSession;
        user.value = newSession.user;
        authProvider.value = 'supabase';
      }
    } else if (event === 'SIGNED_OUT') {
      if (authProvider.value === 'supabase') {
        session.value = null;
        user.value = null;
        authProvider.value = null;
      }
    }
  });

  // Firebase auth state change
  onAuthStateChanged(auth, (firebaseUser) => {
    console.log('Firebase auth state change:', firebaseUser?.email);
    
    if (firebaseUser) {
      // Ne pas écraser si Supabase est déjà connecté
      if (authProvider.value !== 'supabase') {
        user.value = firebaseUser;
        authProvider.value = 'firebase';
        session.value = null; // Firebase n'utilise pas de session comme Supabase
      }
    } else {
      if (authProvider.value === 'firebase') {
        user.value = null;
        authProvider.value = null;
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
    initializeAuth,
  };
});
