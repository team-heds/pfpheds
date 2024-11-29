<template>
  <div class="flex justify-content-center align-items-center h-screen bg-surface-ground">
    <!-- Conteneur principal -->
    <div class="flex w-full max-w-7xl rounded-md overflow-hidden">
      <!-- Section gauche -->
      <div class="flex flex-column justify-content-center align-items-center w-6 text-white p-5">
        <img src="/public/assets/images/FR-DE_HEdS_rvb_neg.png" alt="Logo" class="mb-3 h-15rem" />
      </div>

      <!-- Section droite -->
      <div class="flex flex-column justify-content-center align-items-center w-3 p-7">
        <h1 class="text-6xl ">La formation pratique, c’est par ici</h1>

        <!-- Formulaire de connexion -->
        <form @submit.prevent="submitForm" class="w-full md:w-25rem">
          <div class="mb-4">
            <InputText
              id="email"
              v-model="email"
              placeholder="Email"
              class="w-full"
              :class="{ 'p-invalid': emailError }"
            />
            <small v-if="emailError" class="p-error">Veuillez entrer une adresse e-mail valide.</small>
          </div>
          <div class="flex align-items-center mb-4">
            <Password
              id="password"
              placeholder="Mot de passe"
              v-model="password"
              class="w-full"
              inputClass="w-full md:w-25rem"
              :feedback="false"
              :class="{ 'p-invalid': passwordError }"
              toggleMask
            />
            <small v-if="passwordError" class="p-error">Le mot de passe est requis.</small>
          </div>
          <div class="flex align-items-center mb-4">
            <Checkbox v-model="rememberMe" inputId="remember-me" class="mr-2" />
            <label for="remember-me" class="text-sm">Se souvenir de moi</label>
          </div>
          <Button label="Se connecter" type="submit" class="w-full p-button-raised p-button-primary" />
        </form>

        <!-- Lien d'inscription -->
        <p class="mt-4 text-sm">
          Vous n'avez pas de compte ?
          <a href="/" class="text-primary font-bold hover:underline">Inscrivez-vous</a>
        </p>
      </div>
    </div>
    <Toast />
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "primevue/usetoast";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Checkbox from "primevue/checkbox";

// Variables réactives
const email = ref("");
const password = ref("");
const rememberMe = ref(false);
const emailError = ref(false);
const passwordError = ref(false);
const router = useRouter();
const auth = getAuth();
const toast = useToast();

// Méthode pour gérer la soumission du formulaire
const submitForm = async () => {
  // Réinitialisation des erreurs
  emailError.value = false;
  passwordError.value = false;

  // Validation des champs
  if (!email.value || !email.value.includes("@")) {
    emailError.value = true;
  }
  if (!password.value) {
    passwordError.value = true;
  }

  if (emailError.value || passwordError.value) {
    toast.add({
      severity: "warn",
      summary: "Champs invalides",
      detail: "Veuillez corriger les erreurs pour continuer.",
      life: 3000,
    });
    return;
  }

  try {
    // Authentification avec Firebase
    await signInWithEmailAndPassword(auth, email.value, password.value);

    // Notification de succès
    toast.add({
      severity: "success",
      summary: "Connexion réussie",
      detail: "Vous êtes connecté ! Redirection en cours...",
      life: 3000,
    });

    // Redirection après un délai
    setTimeout(() => {
      router.push("/feed");
    }, 1500);
  } catch (error) {
    // Gestion des erreurs Firebase
    let errorMessage = "Une erreur est survenue.";
    if (error.code === "auth/user-not-found") {
      errorMessage = "Utilisateur introuvable.";
    } else if (error.code === "auth/wrong-password") {
      errorMessage = "Mot de passe incorrect.";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "Adresse e-mail invalide.";
    }

    // Notification d'erreur
    toast.add({
      severity: "error",
      summary: "Erreur de connexion",
      detail: errorMessage,
      life: 5000,
    });
  }
};
</script>

<style scoped>
.p-password .p-password-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: absolute;
  right: 1rem; /* Ajuster l'espace par rapport au bord droit */
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-color);
  font-size: 1.25rem; /* Ajustez la taille pour correspondre au champ */
  cursor: pointer;
}

.p-error {
  font-size: 0.875rem;
  color: var(--red-500);
}
</style>
