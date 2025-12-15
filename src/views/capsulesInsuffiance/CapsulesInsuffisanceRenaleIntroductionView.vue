<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Introduction"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <router-link
              to="/capsules-insuffisance-renale"
              class="text-600 no-underline hover:text-primary"
            >
              Capsules Insuffisance Rhénale
            </router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Introduction</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Introduction</div>
      <div class="text-600 mb-4">
        Cette capsule sert de parcours guidé pour réviser les bases (IRA / IRC), puis s’entraîner avec des activités et valider les acquis.
      </div>

      <div class="grid">
        <div class="col-12 lg:col-4">
          <CapsulesInsuffisanceRenalePageToc
            :items="[
              { id: 'intro-objectifs', label: 'Objectifs' },
              { id: 'intro-deroule', label: 'Déroulé' },
              { id: 'intro-cas', label: 'Cas fil rouge' },
              { id: 'intro-avant', label: 'Avant de commencer' },
            ]"
          />
        </div>

        <div class="col-12 lg:col-8">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div id="intro-objectifs" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Objectifs (fake)</div>
                <ul class="m-0 pl-3 text-700">
                  <li>Identifier les signaux d’alerte d’une insuffisance rénale.</li>
                  <li>Distinguer IRA vs IRC sur un cas simple.</li>
                  <li>Choisir 2 actions de prise en charge immédiate.</li>
                </ul>
              </div>
            </div>

            <div class="col-12 md:col-6">
              <div id="intro-deroule" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Déroulé</div>
                <div class="text-700">
                  <div class="mb-2"><span class="text-900">Durée estimée:</span> 25–35 min</div>
                  <div class="mb-2"><span class="text-900">Format:</span> lecture + activités + QCM</div>
                  <div><span class="text-900">Progression:</span> une page = une étape</div>
                </div>
              </div>
            </div>

            <div class="col-12">
              <div id="intro-cas" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Cas fil rouge (fake)</div>
                <div class="text-700 mb-3">
                  Patiente de 78 ans, diarrhées depuis 48h, hypotension, baisse des urines. Créatinine augmentée sur le bilan.
                </div>
                <div class="grid">
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">Symptômes</div>
                    <div class="text-900">Asthénie, oligurie, soif</div>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">Contexte</div>
                    <div class="text-900">Déshydratation probable</div>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">Question</div>
                    <div class="text-900">IRA pré-rénale ?</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="col-12">
              <div id="intro-avant" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Avant de commencer</div>
                <ul class="m-0 pl-3 text-700">
                  <li>As-tu accès à un bilan biologique fictif ?</li>
                  <li>Prévois un carnet de notes (ou une note dans l’app).</li>
                  <li>Objectif: comprendre, pas mémoriser tout de suite.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      :prev-to="''"
      next-to="/capsules-insuffisance-renale/anatomie-physiologie"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
import CapsulesInsuffisanceRenalePageToc from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenalePageToc.vue'
</script>
