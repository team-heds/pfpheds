/**
 * Utilitaire pour vérifier l'authentification Supabase
 * Utilisez ceci dans la console du navigateur: checkSupabaseAuth()
 */
import { supabase } from '@/supabase';

export async function checkSupabaseAuth() {
  console.log('🔍 Vérification de l\'authentification Supabase...');
  
  // Vérifier l'utilisateur
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    console.error('❌ Erreur lors de la récupération de l\'utilisateur:', userError);
    return;
  }
  
  if (!user) {
    console.warn('⚠️ Aucun utilisateur Supabase connecté');
    console.log('💡 Vous devez vous connecter avec Supabase pour modifier les places');
    return;
  }
  
  console.log('✅ Utilisateur Supabase connecté:');
  console.log('  - Email:', user.email);
  console.log('  - ID:', user.id);
  console.log('  - Role:', user.role);
  
  // Vérifier la session
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) {
    console.error('❌ Erreur lors de la récupération de la session:', sessionError);
    return;
  }
  
  if (session) {
    console.log('✅ Session active:');
    console.log('  - Access Token:', session.access_token.substring(0, 20) + '...');
    console.log('  - Expire à:', new Date(session.expires_at * 1000).toLocaleString());
  } else {
    console.warn('⚠️ Pas de session active');
  }
  
  return { user, session };
}

// Export pour utilisation dans la console
if (typeof window !== 'undefined') {
  window.checkSupabaseAuth = checkSupabaseAuth;
}
