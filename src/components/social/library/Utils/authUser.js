// Utilitaire pour gérer l'authentification des utilisateurs
import { auth } from '../../../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Récupère l'utilisateur actuellement connecté
 * @returns {Promise<Object|null>} L'utilisateur connecté ou null
 */
export function getCurrentUser() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, 
      user => {
        unsubscribe();
        resolve(user);
      },
      error => {
        unsubscribe();
        reject(error);
      }
    );
  });
}

/**
 * Vérifie si l'utilisateur est connecté
 * @returns {Promise<boolean>} true si l'utilisateur est connecté, false sinon
 */
export async function isUserLoggedIn() {
  try {
    const user = await getCurrentUser();
    return !!user;
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'authentification:', error);
    return false;
  }
}

/**
 * Récupère l'ID de l'utilisateur actuellement connecté
 * @returns {Promise<string|null>} L'ID de l'utilisateur ou null
 */
export async function getCurrentUserId() {
  try {
    const user = await getCurrentUser();
    return user ? user.uid : null;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'ID utilisateur:', error);
    return null;
  }
}
