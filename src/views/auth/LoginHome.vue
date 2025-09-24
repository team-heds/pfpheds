<template>
  <div class="flex flex-column lg:flex-row justify-content-center align-items-center h-screen bg-surface-ground px-2 lg:px-0">
    <!-- Conteneur principal -->
    <div class="flex flex-column lg:flex-row w-full max-w-7xl rounded-md overflow-hidden">
      <!-- Section gauche -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-6 text-white p-5">
        <img
          src="/assets/images/FR-DE_HEdS_rvb_neg.png"
          alt="Logo"
          class="mb-3 h-8rem lg:h-15rem" />
      </div>

      <!-- Section droite -->
      <div class="flex flex-column justify-content-center align-items-center w-full lg:w-3 p-4 lg:p-7">
        <h1 class="text-4xl lg:text-6xl text-left mb-4">La formation pratique, clé de votre avenir.</h1>

        <!-- Sélection du système d'authentification -->
        <div class="w-full max-w-25rem">
          <div class="mb-6">
            <h2 class="text-2xl font-semibold text-center mb-4">Choisissez votre système de connexion</h2>
            <p class="text-center text-gray-600 mb-6">Sélectionnez la plateforme correspondant à votre promotion</p>
          </div>
          
          <!-- Bouton BA23-24 (Firebase) -->
          <div class="mb-4">
            <Button 
              @click="navigateToFirebaseLogin" 
              class="w-full p-button-raised firebase-button flex align-items-center justify-content-center"
              style="height: 4rem;"
            >
              <i class="pi pi-graduation-cap mr-3" style="font-size: 1.5rem;"></i>
              <div class="text-left">
                <div class="font-bold text-lg">BA23-24</div>
                <div class="text-sm opacity-90">Connexion via Firebase</div>
              </div>
            </Button>
          </div>
          
          <!-- Bouton BA25 (Supabase) -->
          <div class="mb-4">
            <Button 
              @click="navigateToSupabaseLogin" 
              class="w-full p-button-raised supabase-button flex align-items-center justify-content-center"
              style="height: 4rem;"
            >
              <i class="pi pi-users mr-3" style="font-size: 1.5rem;"></i>
              <div class="text-left">
                <div class="font-bold text-lg">BA25</div>
                <div class="text-sm opacity-90">Connexion via Supabase</div>
              </div>
            </Button>
          </div>
          
          <!-- Information supplémentaire -->
          <div class="mt-6 p-3 bg-blue-50 border-round text-center">
            <small class="text-blue-800">
              <i class="pi pi-info-circle mr-1"></i>
              Choisissez le système correspondant à votre année d'études
            </small>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { useToast } from "primevue/usetoast";
import Button from "primevue/button";

// Variables réactives
const router = useRouter();
const toast = useToast();

// Méthode pour naviguer vers la connexion Firebase (BA23-24)
const navigateToFirebaseLogin = () => {
  toast.add({
    severity: "info",
    summary: "Redirection",
    detail: "Redirection vers la connexion Firebase (BA23-24)...",
    life: 2000,
  });
  // Rediriger vers la page de login Firebase (actuel LoginView ou créer une nouvelle page)
  setTimeout(() => router.push("/login"), 1000);
};

// Méthode pour naviguer vers la connexion Supabase (BA25)
const navigateToSupabaseLogin = () => {
  toast.add({
    severity: "info",
    summary: "Redirection",
    detail: "Redirection vers la connexion Supabase (BA25)...",
    life: 2000,
  });
  // Rediriger vers la page de login Supabase
  setTimeout(() => router.push("/home2"), 1000);
};
</script>

<style scoped>
/* Adaptations pour mobile */
@media (max-width: 768px) {
  h1 {
    font-size: 1.75rem;
  }

  img {
    max-height: 8rem;
  }
}

/* Bouton Firebase (BA23-24) */
.firebase-button {
  background: linear-gradient(135deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(243, 195, 0, 0.3);
}

.firebase-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(243, 195, 0, 0.4);
}

/* Bouton Supabase (BA25) */
.supabase-button {
  background: linear-gradient(135deg, #3ECF8E 0%, #2DD4BF 100%);
  color: white;
  border: none;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(62, 207, 142, 0.3);
}

.supabase-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(62, 207, 142, 0.4);
}

/* Styles généraux pour les boutons */
.firebase-button, .supabase-button {
  font-weight: 600;
  border-radius: 12px;
}

/* Animation d'entrée */
.firebase-button, .supabase-button {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
