<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Validations des acquis IRA"
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
            <span class="text-900">Validations des acquis IRA</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Validations des acquis IRA</div>
      <div class="text-600 mb-4">
        Checklist de validation (fake): l’objectif est de vérifier que tu sais appliquer un raisonnement minimal.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Grille (fake)</div>
            <ul class="m-0 pl-3 text-700">
              <li>Je peux citer 3 causes pré-rénales.</li>
              <li>Je sais identifier une urgence (hyperK, anurie…).</li>
              <li>Je sais proposer 3 surveillances infirmières.</li>
              <li>Je sais quand alerter le médecin.</li>
            </ul>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Cas de validation (fake)</div>
            <div class="text-700 mb-2">
              Patient 65 ans, vomissements, TA 90/55, diurèse faible.
            </div>
            <div class="text-700">
              <div class="mb-2"><span class="text-900">Ta phrase:</span> “Je suspecte … car …”</div>
              <div><span class="text-900">Tes 2 premières actions:</span> …</div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Auto-correction (fake)</div>
            <div class="text-700">
              <div class="mb-2"><span class="text-900">Attendu:</span> hypothèse IRA pré-rénale, surveillance diurèse, hydratation selon protocole, alerte si aggravation.</div>
              <div class="text-600">(Ce bloc sera remplacé plus tard par une correction interactive.)</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/activite-irc"
      next-to="/capsules-insuffisance-renale/validation-acquis-irc"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
