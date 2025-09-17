import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { supabase } from '@/supabase'; // Assurez-vous que ce chemin est correct

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref(null);
  const session = ref(null);
  const loading = ref(false);
  const error = ref(null);

  // Getters
  const isLoggedIn = computed(() => !!user.value);

  // Actions
  async function signUp(credentials) {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: signUpError } = await supabase.auth.signUp(credentials);
      if (signUpError) throw signUpError;
      // L'utilisateur est créé, mais la session peut ne pas être active avant la confirmation de l'email
      user.value = data.user;
      session.value = data.session;
      return data;
    } catch (e) {
      error.value = e.message;
      console.error('Sign up error:', e.message);
    } finally {
      loading.value = false;
    }
  }

  async function signIn(credentials) {
    loading.value = true;
    error.value = null;
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword(credentials);
      if (signInError) throw signInError;
      user.value = data.user;
      session.value = data.session;
    } catch (e) {
      error.value = e.message;
      console.error('Sign in error:', e.message);
    } finally {
      loading.value = false;
    }
  }

  async function signOut() {
    loading.value = true;
    error.value = null;
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) throw signOutError;
      user.value = null;
      session.value = null;
    } catch (e) {
      error.value = e.message;
      console.error('Sign out error:', e.message);
    } finally {
      loading.value = false;
    }
  }

  async function fetchUser() {
    const { data } = await supabase.auth.getUser();
    user.value = data.user;
  }
  
  // Gérer les changements d'état d'authentification
  supabase.auth.onAuthStateChange((event, newSession) => {
    session.value = newSession;
    user.value = newSession?.user ?? null;
  });

  return {
    user,
    session,
    loading,
    error,
    isLoggedIn,
    signUp,
    signIn,
    signOut,
    fetchUser,
  };
});
