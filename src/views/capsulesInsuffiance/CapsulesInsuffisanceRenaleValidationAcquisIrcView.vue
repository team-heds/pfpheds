<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Validations des acquis IRC"
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
            <span class="text-900">Validations des acquis IRC</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Validations des acquis IRC</div>
      <div class="text-600 mb-4">
        Validation (fake) orientée suivi long terme: prévention, complications, messages d’éducation.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Checklist (fake)</div>
            <ul class="m-0 pl-3 text-700">
              <li>Je peux citer 3 complications possibles.</li>
              <li>Je sais quels paramètres suivre (DFG, albuminurie…).</li>
              <li>Je sais donner 3 conseils patient (AINS, tension, hydratation).</li>
              <li>Je sais repérer un signe de décompensation.</li>
            </ul>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Cas de validation (fake)</div>
            <div class="text-700 mb-2">
              Patiente 58 ans, DFG 38, HTA, œdèmes discrets.
            </div>
            <div class="text-700">
              <div class="mb-2"><span class="text-900">Priorité:</span> prévention CV + suivi</div>
              <div><span class="text-900">Éducation:</span> 3 messages clés</div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Barème (fake)</div>
            <div class="text-700">
              <div class="mb-2">0–2: à revoir</div>
              <div class="mb-2">3: ok</div>
              <div>4: très bien</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/validation-acquis-ira"
      next-to="/capsules-insuffisance-renale/synthese"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
