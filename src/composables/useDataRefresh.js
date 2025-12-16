import { nextTick } from 'vue'

/**
 * Composable pour gérer les refresh de données après CRUD operations
 * 
 * Pattern standardisé pour éviter les problèmes de timing entre:
 * - Sauvegarde des données
 * - Émission d'événements
 * - Fermeture de dialogs
 * - Refresh des listes parentes
 * 
 * @example
 * // Dans un Dialog de création/modification
 * import { useDataRefresh } from '@/composables/useDataRefresh'
 * 
 * const { emitAndWait } = useDataRefresh()
 * 
 * const saveData = async () => {
 *   try {
 *     // 1. Sauvegarder les données
 *     await saveToDB()
 *     
 *     // 2. Émettre l'événement et attendre le refresh parent
 *     await emitAndWait(emit, 'data-updated')
 *     
 *     // 3. Afficher le toast de succès
 *     toast.add({ severity: 'success', summary: 'Succès' })
 *     
 *     // 4. Fermer le dialog
 *     closeDialog()
 *   } catch (error) {
 *     // Gérer l'erreur
 *   }
 * }
 */
export function useDataRefresh() {
  /**
   * Émettre un événement et attendre que le parent le traite
   * @param {Function} emit - La fonction emit de Vue
   * @param {String} eventName - Le nom de l'événement à émettre
   * @param {*} payload - Les données à émettre (optionnel)
   * @param {Number} waitMs - Temps d'attente en ms (défaut: 100)
   * @returns {Promise<void>}
   */
  const emitAndWait = async (emit, eventName, payload = undefined, waitMs = 100) => {
    // Émettre l'événement
    if (payload !== undefined) {
      emit(eventName, payload)
    } else {
      emit(eventName)
    }
    
    // Attendre le prochain cycle de rendu
    await nextTick()
    
    // Attendre un délai supplémentaire pour que le parent refresh
    await new Promise(resolve => setTimeout(resolve, waitMs))
  }

  /**
   * Gestionnaire standardisé pour les opérations CRUD dans un Dialog
   * @param {Object} options
   * @param {Function} options.emit - La fonction emit de Vue
   * @param {String} options.eventName - Le nom de l'événement à émettre
   * @param {Function} options.saveOperation - La fonction async de sauvegarde
   * @param {Function} options.toast - L'instance toast de PrimeVue
   * @param {Function} options.closeDialog - La fonction pour fermer le dialog
   * @param {Object} options.messages - Messages de succès/erreur personnalisés
   * @returns {Promise<boolean>} - true si succès, false sinon
   */
  const handleCrudOperation = async ({
    emit,
    eventName,
    saveOperation,
    toast,
    closeDialog,
    messages = {}
  }) => {
    try {
      // 1. Exécuter l'opération de sauvegarde
      await saveOperation()
      
      // 2. Émettre l'événement et attendre le refresh parent
      await emitAndWait(emit, eventName)
      
      // 3. Afficher le toast de succès
      toast.add({
        severity: 'success',
        summary: messages.successSummary || 'Succès',
        detail: messages.successDetail || 'Opération réussie',
        life: 3000
      })
      
      // 4. Fermer le dialog
      closeDialog()
      
      return true
    } catch (error) {
      console.error(`Erreur lors de l'opération ${eventName}:`, error)
      
      // Afficher le toast d'erreur
      toast.add({
        severity: 'error',
        summary: messages.errorSummary || 'Erreur',
        detail: messages.errorDetail || error.message || 'Une erreur est survenue',
        life: 3000
      })
      
      return false
    }
  }

  return {
    emitAndWait,
    handleCrudOperation
  }
}
