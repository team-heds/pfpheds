<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Anatomie et physiologie"
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
            <span class="text-900">Anatomie et physiologie</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Anatomie et physiologie</div>
      <div class="text-600 mb-4">
        Objectif: se remettre en tête le trajet de l’urine, les compartiments (cortex/médulla) et le rôle du néphron.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Rappel express</div>
            <ul class="m-0 pl-3 text-700">
              <li>Le rein filtre le plasma, régule eau/électrolytes et contribue à l’équilibre acido-basique.</li>
              <li>Le DFG (débit de filtration glomérulaire) est un repère de fonction globale.</li>
              <li>Le tubule adapte la composition finale de l’urine (réabsorption / sécrétion).</li>
            </ul>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Le néphron (fake)</div>
            <div class="text-700">
              <div class="mb-2"><span class="text-900">1.</span> Glomérule: filtration</div>
              <div class="mb-2"><span class="text-900">2.</span> Tubule proximal: réabsorption massive</div>
              <div class="mb-2"><span class="text-900">3.</span> Anse de Henle: concentration</div>
              <div class="mb-2"><span class="text-900">4.</span> Tubule distal/collecteur: réglages fins</div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Mini tableau (fake)</div>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead>
                  <tr>
                    <th class="text-left p-2">Segment</th>
                    <th class="text-left p-2">Fonction</th>
                    <th class="text-left p-2">Indice clinique</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td class="p-2">Glomérule</td>
                    <td class="p-2 text-700">Filtre</td>
                    <td class="p-2 text-700">Créatinine / DFG</td>
                  </tr>
                  <tr>
                    <td class="p-2">Tubule proximal</td>
                    <td class="p-2 text-700">Réabsorbe</td>
                    <td class="p-2 text-700">Glycosurie/Protéinurie (selon cas)</td>
                  </tr>
                  <tr>
                    <td class="p-2">Collecteur</td>
                    <td class="p-2 text-700">Ajuste l’eau</td>
                    <td class="p-2 text-700">Diurèse, densité urinaire</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Check rapide (fake)</div>
            <div class="text-700 mb-2">Quel segment est le plus lié à la concentration des urines ?</div>
            <ul class="m-0 pl-3 text-700">
              <li>Anse de Henle</li>
              <li>Tube collecteur</li>
              <li>(Réponse attendue: les deux contribuent)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/introduction"
      next-to="/capsules-insuffisance-renale/comprendre-ira-irc"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
