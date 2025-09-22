<template>
  <div class="p-4">
    <!-- Header -->
    <div class="mb-4">
      <h1 class="text-4xl font-bold text-primary mb-2">Alp'in Physio</h1>
      <p class="text-xl text-600 mb-3">Association d'étudiants en physiothérapie</p>
      <p class="text-700">
        Si vous êtes étudiants en physiothérapie, sportifs ou organisateurs de manifestations, 
        ce site est fait pour vous !
      </p>
    </div>

    <!-- Navigation -->
    <div class="mb-4">
      <Button 
        v-for="tab in tabs" 
        :key="tab.id"
        :label="tab.label"
        :class="{ 'p-button-outlined': activeTab !== tab.id }"
        @click="activeTab = tab.id"
        class="mr-2 mb-2"
      />
    </div>

    <!-- Content -->
    <div class="content-container">
      <!-- Accueil -->
      <Card v-if="activeTab === 'accueil'" class="mb-4">
        <template #title>Bienvenue sur le site Alp'in physio !</template>
        <template #content>
          <p class="mb-3">
            Découvrez toutes les manifestations sportives, les conférences ou les formations à venir dans notre calendrier.
          </p>
          <p class="mb-3">
            Et si vous préparez votre propre événement, un espace dédié vous attend pour imaginer ensemble un partenariat avec l'association.
          </p>
          <p>
            N'hésitez pas à nous contacter pour tout complément d'informations.
          </p>
        </template>
      </Card>

      <!-- Association -->
      <Card v-if="activeTab === 'association'" class="mb-4">
        <template #title>Notre Association</template>
        <template #content>
          <h3 class="text-primary mb-3">Histoire</h3>
          <p class="mb-3">
            Nous sommes des étudiants et étudiantes en physiothérapie, sportifs et sportives, autant de 
            caractéristiques qui nous ont poussés à mettre sur pied l'association Alp'in Physio en <strong>2012</strong>.
          </p>
          
          <h3 class="text-primary mb-3 mt-4">Comité</h3>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-4 mb-2" v-for="role in roles" :key="role">
              <div class="flex align-items-center p-2 surface-100 border-round">
                <i class="pi pi-user text-primary mr-2"></i>
                <span>{{ role }}</span>
              </div>
            </div>
          </div>
          
          <h3 class="text-primary mb-3 mt-4">Nos Sponsors</h3>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-3 mb-3" v-for="sponsor in sponsors" :key="sponsor">
              <Card class="text-center">
                <template #content>
                  <div class="font-bold">{{ sponsor }}</div>
                </template>
              </Card>
            </div>
          </div>
        </template>
      </Card>

      <!-- Calendrier -->
      <Card v-if="activeTab === 'calendrier'" class="mb-4">
        <template #title>Calendrier & Inscriptions</template>
        <template #content>
          <p class="mb-3 text-600">
            Cette page est réservée aux étudiants de la HES-SO Physiothérapie de Loèche-les-Bains.
          </p>
          
          <h4 class="text-primary mb-3">Événements à venir :</h4>
          <div class="grid">
            <div class="col-12" v-for="event in events" :key="event.date">
              <div class="flex align-items-center justify-content-between p-3 border-round mb-2 surface-100">
                <div class="flex align-items-center">
                  <span class="font-bold text-primary mr-3">{{ event.date }}</span>
                  <span class="font-medium">{{ event.title }}</span>
                </div>
                <Button icon="pi pi-external-link" class="p-button-text p-button-sm" />
              </div>
            </div>
          </div>
        </template>
      </Card>

      <!-- Prestations -->
      <Card v-if="activeTab === 'prestations'" class="mb-4">
        <template #title>Espace organisateurs / nos prestations</template>
        <template #content>
          <div class="mb-4 p-3 surface-100 border-round">
            <p class="font-medium text-primary mb-2">
              Si vous êtes organisateur d'un événement sportif et que vous cherchez un groupe d'étudiants pour les 
              massages de récupération, vous êtes au bon endroit !
            </p>
          </div>
          
          <p class="mb-4">
            Nous proposons des prestations de massage post-effort aux participants de tout événement sportif.
          </p>

          <div class="flex flex-column md:flex-row gap-3 justify-content-center mt-4">
            <Button 
              label="Contrat de partenariat" 
              icon="pi pi-download"
              class="p-button-outlined"
              @click="downloadContract"
            />
            <Button 
              label="Nous contacter" 
              icon="pi pi-envelope"
              class="p-button-success"
              @click="openContactForm"
            />
          </div>
        </template>
      </Card>

      <!-- Galerie -->
      <Card v-if="activeTab === 'galerie'" class="mb-4">
        <template #title>Galerie</template>
        <template #content>
          <div class="text-center">
            <div class="surface-100 border-round p-6">
              <i class="pi pi-images text-6xl text-400 mb-4"></i>
              <p class="text-600 text-xl">Galerie photos à venir...</p>
            </div>
          </div>
        </template>
      </Card>

      <!-- Contact -->
      <Card v-if="activeTab === 'contact'" class="mb-4">
        <template #title>Contact</template>
        <template #content>
          <p class="mb-4">
            Pour toute demande de partenariat, question ou autre information, vous pouvez nous contacter :
          </p>
          
          <div class="grid">
            <div class="col-12 md:col-4 mb-4">
              <div class="flex align-items-center p-3 surface-100 border-round">
                <i class="pi pi-envelope text-primary text-2xl mr-3"></i>
                <div>
                  <div class="font-medium mb-1">Mail</div>
                  <a href="mailto:alpinphysio@hevs.ch" class="text-primary">alpinphysio@hevs.ch</a>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-4 mb-4">
              <div class="flex align-items-center p-3 surface-100 border-round">
                <i class="pi pi-instagram text-primary text-2xl mr-3"></i>
                <div>
                  <div class="font-medium mb-1">Instagram</div>
                  <a href="https://instagram.com/alpinphysio" class="text-primary">@alpinphysio</a>
                </div>
              </div>
            </div>
            
            <div class="col-12 md:col-4 mb-4">
              <div class="flex align-items-center p-3 surface-100 border-round">
                <i class="pi pi-map-marker text-primary text-2xl mr-3"></i>
                <div>
                  <div class="font-medium mb-1">Adresse</div>
                  <div class="text-600 line-height-3">
                    Alp'in Physio<br>
                    HES-SO Valais<br>
                    Thermenstrasse 41<br>
                    3954 Leukerbad
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Card from 'primevue/card'
import Button from 'primevue/button'

const activeTab = ref('accueil')

const tabs = [
  { id: 'accueil', label: 'Accueil' },
  { id: 'association', label: 'Notre Association' },
  { id: 'calendrier', label: 'Calendrier' },
  { id: 'prestations', label: 'Prestations' },
  { id: 'galerie', label: 'Galerie' },
  { id: 'contact', label: 'Contact' }
]

const roles = [
  'Président',
  'Vice-président', 
  'Secrétaire',
  'Caissier',
  'Responsable communication',
  'Responsable formations',
  'Responsables de course',
  'Responsable matériel'
]

const sponsors = [
  'Compex',
  'Perskindol',
  'PhysioSwiss',
  'HES-SO Valais'
]

const events = [
  { date: '06.09', title: 'Le Grand Raid BCVS' },
  { date: '17.09', title: 'Présentation Alp\'in physio aux BA25' },
  { date: '28.09', title: 'RunMate à Montreux' },
  { date: '12.11', title: 'Distribution des habits' }
]

const downloadContract = () => {
  console.log('Téléchargement du contrat de partenariat')
}

const openContactForm = () => {
  window.location.href = 'mailto:alpinphysio@hevs.ch'
}
</script>

<style scoped>
.content-container {
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .flex-column {
    flex-direction: column;
  }
}
</style>
