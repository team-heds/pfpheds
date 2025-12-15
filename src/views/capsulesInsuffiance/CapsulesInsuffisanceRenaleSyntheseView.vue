<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Synthèse"
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
            <span class="text-900">Synthèse</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Synthèse</div>
      <div class="text-600 mb-4">
        Résumé (fake) des messages clés + mini-algorithme de décision.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">À retenir</div>
            <ul class="m-0 pl-3 text-700">
              <li>IRA = rapide, chercher cause (pré/rénal/post).</li>
              <li>IRC = chronique, ralentir progression + prévenir complications.</li>
              <li>Surveillance diurèse + K+ + signes cliniques = central.</li>
            </ul>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Red flags (fake)</div>
            <ul class="m-0 pl-3 text-700">
              <li>Anurie / oligurie sévère</li>
              <li>Hyperkaliémie</li>
              <li>Dyspnée / surcharge</li>
              <li>Troubles du rythme</li>
            </ul>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Mini-algorithme (fake)</div>
            <div class="grid">
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">1) Identifier</div>
                <div class="text-900">diurèse, TA, créat, K+</div>
              </div>
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">2) Orienter</div>
                <div class="text-900">pré / rénal / post</div>
              </div>
              <div class="col-12 md:col-4">
                <div class="text-600 text-sm">3) Agir</div>
                <div class="text-900">surveillance + alerte</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/validation-acquis-irc"
      next-to="/capsules-insuffisance-renale/qcm-evaluatif"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
