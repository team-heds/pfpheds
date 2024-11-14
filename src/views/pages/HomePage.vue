<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { usePrimeVue } from 'primevue/config';
import AppDarkAndLightMode from '@/layout/AppDarkAndLightMode.vue'
import Faq from '@/views/pages/Faq.vue'
import Navbar from '@/components/Utils/Navbar.vue';
import Footer from '@/components/Utils/Footer.vue';


const $primevue = usePrimeVue();

defineExpose({
  $primevue
});

const router = useRouter();

const isHidden = ref(false);


const { layoutConfig } = useLayout();

const darkMode = computed(() => {
  return layoutConfig.colorScheme.value !== 'light';
});



</script>

<template>
  <Navbar />
  <div class="relative overflow-hidden flex flex-column justify-content-center">
    <div class="bg-circle opacity-50" :style="{ top: '-200px', left: '-700px' }"></div>
    <div class="bg-circle hidden lg:flex" :style="{ top: '50px', right: '-800px', transform: 'rotate(60deg)' }"></div>
    <div class="landing-wrapper">

      <div class="py-4 px-4 mx-0 md:mx-6 lg:mx-8 lg:px-8 z-2">
        <div id="home" class="grid grid-nogutter justify-content-between align-items-center mb-6 py-6 md:mb-8 md:py-8">
          <div
            class="col-12 md:col-5 flex flex-column gap-4 flex-order-1 md:flex-order-0 align-items-center md:align-items-start text-center md:text-left">
            <span class="block text-900 font-bold text-7xl">Plateforme de formation pratique HEdS</span>
            <span class="block text-700 text-lg">Retrouver les différentes places de formation pratique de la filière physiothérapie de la HES-SO Valais-Wallis. </span>
            <Button type="button" label="Plus d'info" icon="pi pi-arrow-right" iconPos="right" class="w-12rem"
                    outlined></Button>
          </div>

          <div class="col-12 md:col-5 flex-order-0 md:flex-order-1 mb-6 md:mb-0 border-round">
            <img :src="`/demo/images/landing/${darkMode ? 'LBB_batiment-dark' : 'LBB_batiment-light'}.jpg`" alt=""
                 class="h-30rem border-round shadow-2 animation-duration-1000 fadeinright shadow" />
          </div>
        </div>

        <div id="features" class="my-6 py-6 md:my-3 md:py-3"> <!-- Changer l'id de la page -->
          <span class="text-900 block font-bold text-5xl mb-4 text-center">Informations</span>
          <span class="text-700 block text-xl mb-2 text-center line-height-3">Quelques chiffres sur la formation pratique au sein de la Haute École de Santé Valais-Wallis</span>
        </div>

        <!-- Ajouter une animation aux chiffres -->

        <div class="surface-ground px-4 py-5 md:px-6 lg:px-8">
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-3">
              <div class="surface-card shadow-2 p-3 border-round">
                <div class="flex justify-content-between mb-2 mt-2">
                  <div>
                    <span class="block text-900 font-medium mb-3 text-4xl">250</span>
                    <div class="text-500 font-medium text-2xl">Places de stages</div>
                  </div>
                  <div class="flex align-items-center justify-content-center bg-blue-100 border-round"
                       style="width:2.5rem;height:2.5rem">
                    <i class="pi pi-map text-blue-500 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <div class="surface-card shadow-2 p-3 border-round">
                <div class="flex justify-content-between mb-2 mt-2">
                  <div>
                    <span class="block text-900 font-medium mb-3 text-4xl">121</span>
                    <div class="text-500 font-medium text-2xl">Institutions</div>
                  </div>
                  <div class="flex align-items-center justify-content-center bg-orange-100 border-round"
                       style="width:2.5rem;height:2.5rem">
                    <i class="pi pi-map-marker text-orange-500 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-3">
              <div class="surface-card shadow-2 p-3 border-round">
                <div class="flex justify-content-between mb-2 mt-2">
                  <div>
                    <span class="block text-900 font-medium mb-3 text-4xl">180</span>
                    <div class="text-500 font-medium text-2xl">Étudiant-e-s</div>
                  </div>
                  <div class="flex align-items-center justify-content-center bg-cyan-100 border-round"
                       style="width:2.5rem;height:2.5rem">
                    <i class="pi pi-inbox text-cyan-500 text-xl"></i>
                  </div>
                </div>
              </div>

            </div>
            <div class="col-12 md:col-6 lg:col-3">
              <div class="surface-card shadow-2 p-3 border-round">
                <div class="flex justify-content-between mb-2 mt-2">
                  <div>
                    <span class="block text-900 font-medium mb-3 text-4xl">110</span>
                    <div class="text-500 font-medium text-2xl">Formateur-rice-s</div>
                  </div>
                  <div class="flex align-items-center justify-content-center bg-purple-100 border-round"
                       style="width:2.5rem;height:2.5rem">
                    <i class="pi pi-flag text-purple-500 text-xl"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Bienvenue sur la plateforme de choix de stage -->
        <div class="surface-ground px-4 py-5 md:px-6 lg:px-8 mb-2">
          <div class="grid grid-nogutter surface-section text-800 shadow-2 border-round">
            <div class="col-12 md:col-6 p-6 text-center md:text-left flex align-items-center ">
              <section>
                <span class="block text-6xl font-bold mb-1">Bienvenue sur la plateforme</span>
                <div class="text-6xl text-primary font-bold mb-3">de formation pratique</div>
                <p class="mt-0 mb-4 text-700 line-height-3">Choisissez votre prochain lieu de formation pratique pour
                  vos future PFP.</p>

                <Button label="En savoir plus" type="button" class="mr-3" raised></Button>
                <Button label="Vidéo explicative" type="button" outlined></Button>
                <!-- Ajouter Plyr et la vidéo de la capsule d'explication -->
              </section>
            </div>
            <div class="col-12 md:col-6 overflow-hidden">
              <img src="/demo/images/heds/LLB2.jpg" alt="Image" class="md:ml-auto block md:h-30rem border-round-right"
                   style="clip-path: polygon(8% 0, 100% 0%, 100% 100%, 0 100%)">
            </div>
          </div>
        </div>


        <div class="surface-ground px-4 py-8 md:px-6 lg:px-8 overflow-hidden">
          <div class="font-bold text-900 text-5xl mb-3 text-center">Comment utiliser la plateforme</div>
          <div class="text-700 text-center mb-5 line-height-3">Comment utiliser la plateforme de formation pratique de la HES-SO Valais-Wallis
          </div>
          <div class="flex lg:justify-content-center mb-5">
            <div class="py-3 pr-8 pl-3 w-30rem hidden lg:block">
              <img src="/public/assets/images/heds/plateforme/login.png" alt="Image" class="w-full mr-8 shadow" style="border-radius: 10px;">
            </div>
            <div class="flex flex-column align-items-center w-2rem">
              <span class="bg-primary-500 text-0 flex align-items-center justify-content-center border-circle"
                    style="min-width:2.5rem; min-height: 2.5rem">1</span>
              <div class="h-full bg-primary-500" style="width: 2px; min-height: 4rem"></div>
            </div>
            <div class="py-3 pl-5 lg:pl-8 pl-3 lg:w-30rem">
              <div class="text-900 text-xl mb-2 font-medium">Se connecter</div>
              <span class="block text-700 line-height-3 mb-3">Se connecter avec son compte utilisateur donné au début de l'année.</span>
              <div class="pt-3 border-top-1 border-300">
                <div class="mb-2 line-height-3">Récupérer son mot de passe en cas d'oubli.
                </div>
              </div>
              <img src="/public/assets/images/heds/plateforme/login.png" alt="Image"
                   class="w-full mt-3 block lg:hidden shadow" style="border-radius: 10px;"/>
            </div>
          </div>
          <div class="flex justify-content-center mb-5">
            <div class="py-3 pl-5 pr-3 lg:pr-8 lg:pl-3 lg:w-30rem flex-order-1 lg:flex-order-0">
              <div class="text-900 text-xl mb-2 font-medium">Choisir sa place de stage</div>
              <span class="block text-700 line-height-3 mb-3">Rechercher les différentes instituions sur la carte avec leur point GPS ou directement dans l'onglet institutions.</span>
              <div class="pt-3 border-top-1 border-300">
                <div class="mb-2 line-height-3">Ajouter au panier les places de stages désirées.</div>
              </div>
              <img src="/public/assets/images/heds/plateforme/institution.png" alt="Image"
                   class="w-full mt-3 block lg:hidden" />
            </div>
            <div class="flex flex-column align-items-center w-2rem flex-order-0 lg:flex-order-1">
              <span class="bg-primary-500 text-0 flex align-items-center justify-content-center border-circle"
                    style="min-width:2.5rem; min-height: 2.5rem">2</span>
              <div class="h-full bg-primary-500" style="width: 2px; min-height: 4rem"></div>
            </div>
            <div class="py-3 pl-8 pr-3 w-30rem hidden lg:block flex-order-2">
              <img src="/public/assets/images/heds/plateforme/institution.png" alt="Image" class="w-full mr-8 shadow" style="border-radius: 10px;">
            </div>
          </div>
          <div class="flex justify-content-center">
            <div class="py-3 pr-8 pl-3 w-30rem hidden lg:block">
              <img src="/public/assets/images/heds/plateforme/profil.png" alt="Image" class="w-full mr-8 shadow" style="border-radius: 10px;">
            </div>
            <div class="flex flex-column align-items-center w-2rem">
              <span class="bg-primary-500 text-0 flex align-items-center justify-content-center border-circle"
                    style="min-width:2.5rem; min-height: 2.5rem">3</span>
              <div class="h-full bg-primary-500" style="width: 2px; min-height: 4rem"></div>
            </div>
            <div class="py-3 pl-5 lg:pl-8 pl-3 lg:w-30rem">
              <div class="text-900 text-xl mb-2 font-medium">Votre profil en temps réel</div>
              <span class="block text-700 line-height-3 mb-3">Retrouver votre cursus en temps réel.</span>
              <div class="pt-3 border-top-1 border-300">
                <div class="mb-2 line-height-3">Modifier vos informations personnelles.
                </div>
              </div>
              <img src="/public/demo/images/blocks/feature/feature-timeline-3.png" alt="Image"
                   class="w-full mt-3 block lg:hidden" />
            </div>
          </div>
          <div class="flex justify-content-center mb-5">
            <div class="py-3 pl-5 pr-3 lg:pr-8 lg:pl-3 lg:w-30rem flex-order-1 lg:flex-order-0">
              <div class="text-900 text-xl mb-2 font-medium">Contact</div>
              <span class="block text-700 line-height-3 mb-3">Contacter votre professeur référent pour tout types de questions.</span>
              <div class="pt-3 border-top-1 border-300">
                <div class="mb-2 line-height-3">Une FAQ est disponible aussi pour tout type de question
                </div>
              </div>
              <img src="/public/demo/images/blocks/feature/feature-timeline-4.png" alt="Image"
                   class="w-full mt-3 block lg:hidden" />
            </div>
            <div class="flex flex-column align-items-center w-2rem flex-order-0 lg:flex-order-1">
              <span class="bg-primary-500 text-0 flex align-items-center justify-content-center border-circle"
                    style="min-width:2.5rem; min-height: 2.5rem">2</span>
              <div class="h-full bg-primary-500" style="width: 2px; min-height: 4rem"></div>
            </div>
            <div class="py-3 pl-8 pr-3 w-30rem hidden lg:block flex-order-2">
              <img src="/public/assets/images/heds/plateforme/chat.png" alt="Image" class="w-full mr-8 shadow" style="border-radius: 10px;">
            </div>
          </div>
        </div>

        <faq />

      </div>
    </div>
  </div>
  <AppDarkAndLightMode simple />
  <Footer />
</template>

<style scoped>
.bg-circle {
  width: 1000px;
  height: 1000px;
  border-radius: 50%;
  background-image: linear-gradient(140deg, var(--primary-color), var(--surface-ground) 80%);
  position: absolute;
  opacity: 0.25;
  z-index: -1;
}

.shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the map */
}
</style>
