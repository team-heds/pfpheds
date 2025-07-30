import { getAuth, onAuthStateChanged } from 'firebase/auth';

export function getCurrentUser() {
  return new Promise((resolve) => {
    const auth = getAuth();
    if (auth.currentUser) {
      resolve(auth.currentUser);
    } else {
      onAuthStateChanged(auth, user => {
        resolve(user);
      });
    }
  });
}
