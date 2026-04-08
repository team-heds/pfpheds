<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">
          <i class="pi pi-home mr-1"></i>Formation Pratique
        </router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Secrétariat</span>
      </div>

      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center gap-3">
          <i class="pi pi-briefcase text-primary text-3xl"></i>
          <div>
            <h1 class="text-2xl font-bold text-900 m-0">Secrétariat — Formation Pratique</h1>
            <p class="text-600 m-0 mt-1">Outils de suivi administratif du secrétariat</p>
          </div>
        </div>
      </div>

      <div class="grid">
        <div v-for="section in sections" :key="section.route" class="col-12 md:col-6 lg:col-4">
          <div
            class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
            @click="router.push(section.route)"
          >
            <div :class="['flex align-items-center justify-content-center w-3rem h-3rem border-circle mb-3', section.bgClass]">
              <i :class="[section.icon, section.iconClass, 'text-xl']"></i>
            </div>
            <h3 class="text-lg font-semibold text-900 m-0 mb-2">{{ section.title }}</h3>
            <p class="text-600 text-sm m-0 line-height-3">{{ section.description }}</p>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'

const router = useRouter()

const sections = [
  {
    title: "Vue d'ensemble FP",
    description: "Vision globale des stages, notes, critères et cas particuliers par étudiant",
    icon: 'pi pi-th-large',
    iconClass: 'text-primary-500',
    bgClass: 'bg-primary-100',
    route: '/admin/formation-pratique/secretariat/vue-ensemble'
  },
  {
    title: 'Récap CPT / Évaluation',
    description: "Suivi des contrats de place de travail et des évaluations par étudiant",
    icon: 'pi pi-star',
    iconClass: 'text-yellow-500',
    bgClass: 'bg-yellow-100',
    route: '/admin/formation-pratique/secretariat/recap-cpt-evaluation'
  },
  {
    title: 'Notes PFP',
    description: "Récapitulatif de toutes les notes PFP par étudiant",
    icon: 'pi pi-file-edit',
    iconClass: 'text-blue-500',
    bgClass: 'bg-blue-100',
    route: '/admin/formation-pratique/secretariat/recap-pfp-notes'
  },
  {
    title: 'Cas Particuliers',
    description: "Suivi et annotation des cas particuliers par couleur et commentaire",
    icon: 'pi pi-flag',
    iconClass: 'text-orange-500',
    bgClass: 'bg-orange-100',
    route: '/admin/formation-pratique/secretariat/suivi-cas-particuliers'
  },
  {
    title: 'Suivi des Institutions',
    description: "Conventions et accords cadres des institutions partenaires",
    icon: 'pi pi-building',
    iconClass: 'text-teal-500',
    bgClass: 'bg-teal-100',
    route: '/admin/formation-pratique/secretariat/suivi-institutions'
  },
  {
    title: 'Tableau Récap Offres',
    description: "Vue d'ensemble des offres de places par institution et PFP",
    icon: 'pi pi-table',
    iconClass: 'text-green-500',
    bgClass: 'bg-green-100',
    route: '/admin/formation-pratique/secretariat/tableau-offres'
  },
  {
    title: 'Vérification Critères',
    description: "Vérification des critères MSQ, SYSINT, NEUROGER, etc. par étudiant",
    icon: 'pi pi-check-square',
    iconClass: 'text-purple-500',
    bgClass: 'bg-purple-100',
    route: '/admin/formation-pratique/secretariat/verification-criteres'
  },
  {
    title: 'Alertes',
    description: "Tableau de bord des alertes et anomalies détectées dans les données PFP",
    icon: 'pi pi-bell',
    iconClass: 'text-red-500',
    bgClass: 'bg-red-100',
    route: '/admin/formation-pratique/secretariat/alertes'
  }
]
</script>