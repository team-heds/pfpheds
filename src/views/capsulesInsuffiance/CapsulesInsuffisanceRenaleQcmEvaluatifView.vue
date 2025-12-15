<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="QCM évaluatif"
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
            <span class="text-900">QCM évaluatif</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">QCM évaluatif</div>
      <div class="text-600 mb-4">
        QCM (fake) pour tester l’ergonomie. Plus tard, on le rendra interactif.
      </div>

      <div class="surface-card border-1 surface-border border-round p-3 mb-3">
        <div class="text-900 font-medium mb-2">Question 1</div>
        <div class="text-700 mb-2">Une IRA est typiquement…</div>
        <ol class="m-0 pl-3 text-700">
          <li>une altération rapide de la fonction rénale</li>
          <li>une altération sur plusieurs années</li>
          <li>toujours irréversible</li>
        </ol>
        <div class="mt-2 text-600 text-sm">Réponse attendue (fake): 1</div>
      </div>

      <div class="surface-card border-1 surface-border border-round p-3 mb-3">
        <div class="text-900 font-medium mb-2">Question 2</div>
        <div class="text-700 mb-2">Quel est un “red flag” possible ?</div>
        <ol class="m-0 pl-3 text-700">
          <li>Hyperkaliémie</li>
          <li>Soif modérée isolée</li>
          <li>DFG stable</li>
        </ol>
        <div class="mt-2 text-600 text-sm">Réponse attendue (fake): 1</div>
      </div>

      <div class="surface-card border-1 surface-border border-round p-3 mb-3">
        <div class="text-900 font-medium mb-2">Question 3</div>
        <div class="text-700 mb-2">Une cause post-rénale correspond plutôt à…</div>
        <ol class="m-0 pl-3 text-700">
          <li>Obstacle sur les voies urinaires</li>
          <li>Déshydratation</li>
          <li>HTA chronique isolée</li>
        </ol>
        <div class="mt-2 text-600 text-sm">Réponse attendue (fake): 1</div>
      </div>

      <div class="surface-card border-1 surface-border border-round p-3">
        <div class="text-900 font-medium mb-2">Question 4</div>
        <div class="text-700 mb-2">Dans l’IRC, l’objectif principal est…</div>
        <ol class="m-0 pl-3 text-700">
          <li>Ralentir la progression et prévenir les complications</li>
          <li>Traiter en urgence une déshydratation aiguë uniquement</li>
          <li>Ne plus surveiller la tension</li>
        </ol>
        <div class="mt-2 text-600 text-sm">Réponse attendue (fake): 1</div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/synthese"
      :next-to="''"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
