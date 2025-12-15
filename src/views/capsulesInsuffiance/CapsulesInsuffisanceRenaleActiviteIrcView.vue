<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Activité IRC"
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
            <span class="text-900">Activité IRC</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Activité IRC</div>
      <div class="text-600 mb-4">
        Exercices (fake) centrés sur l’IRC: suivi, éducation, complications et prévention.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Activité 1 — Lecture d’évolution (fake)</div>
            <div class="text-700 mb-2">DFG estimé (fake):</div>
            <ul class="m-0 pl-3 text-700">
              <li>12 mois: 48</li>
              <li>6 mois: 42</li>
              <li>Aujourd’hui: 36</li>
            </ul>
            <div class="mt-3 text-700"><span class="text-900">Question:</span> tendance ? actions possibles ?</div>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Activité 2 — Éducation patient (fake)</div>
            <div class="text-700 mb-2">Sélectionne 3 messages clés:</div>
            <ul class="m-0 pl-3 text-700">
              <li>Hydratation adaptée</li>
              <li>Éviter automédication AINS</li>
              <li>Suivi tensionnel</li>
              <li>Vaccins / prévention (exemples)</li>
            </ul>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Activité 3 — Complications (fake)</div>
            <div class="grid">
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">Biologie</div>
                <div class="text-900">Anémie, hyperK, acidose</div>
              </div>
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">Clinique</div>
                <div class="text-900">Œdèmes, HTA, fatigue</div>
              </div>
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">Action</div>
                <div class="text-900">Surveillance + orientation</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/activites-ira"
      next-to="/capsules-insuffisance-renale/validation-acquis-ira"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
