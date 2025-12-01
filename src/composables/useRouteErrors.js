import { onMounted } from 'vue';
import { useToast } from 'primevue/usetoast';

/**
 * Composable pour gérer l'affichage des erreurs de navigation
 * Vérifie sessionStorage pour des erreurs stockées par les route guards
 */
export function useRouteErrors() {
  const toast = useToast();

  onMounted(() => {
    // Vérifier s'il y a une erreur de route à afficher
    const routeError = sessionStorage.getItem('routeError');
    
    if (routeError) {
      try {
        const error = JSON.parse(routeError);
        
        // Afficher un toast selon le type d'erreur
        if (error.type === 'pfp_access_denied') {
          toast.add({
            severity: 'error',
            summary: error.message || 'Accès refusé',
            detail: error.detail || 'Vous n\'avez pas les permissions nécessaires pour accéder à cette page.',
            life: 6000,
            closable: true
          });
        } else {
          // Erreur générique
          toast.add({
            severity: 'warn',
            summary: error.message || 'Erreur de navigation',
            detail: error.detail || 'Une erreur est survenue lors de la navigation.',
            life: 5000,
            closable: true
          });
        }
        
        // Nettoyer le sessionStorage après affichage
        sessionStorage.removeItem('routeError');
        
        console.log('📢 Erreur de route affichée:', error);
      } catch (e) {
        console.error('❌ Erreur lors du parsing de routeError:', e);
        sessionStorage.removeItem('routeError');
      }
    }
  });
}
