// Test simple des variables d'environnement
console.log('=== TEST VARIABLES D\'ENVIRONNEMENT AU DÉMARRAGE ===')
console.log('VITE_VIMEO_ACCESS_TOKEN:', import.meta.env.VITE_VIMEO_ACCESS_TOKEN)
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID)
console.log('NODE_ENV:', import.meta.env.NODE_ENV)
console.log('MODE:', import.meta.env.MODE)
console.log('DEV:', import.meta.env.DEV)

// Export pour pouvoir l'importer
export const envTest = () => {
  return {
    vimeoToken: import.meta.env.VITE_VIMEO_ACCESS_TOKEN,
    firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    nodeEnv: import.meta.env.NODE_ENV,
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV
  }
}
