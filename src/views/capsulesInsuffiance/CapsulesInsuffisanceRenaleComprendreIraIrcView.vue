<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Comprendre IRA et IRC"
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
            <span class="text-900">Comprendre IRA et IRC</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Comprendre IRA et IRC</div>
      <div class="text-600 mb-4">
        Ici on pose les définitions (fake) et on compare rapidement IRA vs IRC pour guider le raisonnement.
      </div>

      <div class="grid">
        <div class="col-12 lg:col-4">
          <CapsulesInsuffisanceRenalePageToc
            :items="[
              { id: 'defs-ira', label: 'Définition IRA' },
              { id: 'defs-irc', label: 'Définition IRC' },
              { id: 'comparaison', label: 'Comparaison' },
              { id: 'mini-cas', label: 'Mini-cas' },
            ]"
          />
        </div>

        <div class="col-12 lg:col-8">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div id="defs-ira" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">IRA (fake)</div>
                <div class="text-700 mb-2">Altération rapide de la fonction rénale (heures → jours).</div>
                <ul class="m-0 pl-3 text-700">
                  <li>Souvent réversible si cause traitée.</li>
                  <li>Causes typiques: pré-rénale, rénale, post-rénale.</li>
                  <li>Signes d’alerte: oligurie, augmentation créatinine.</li>
                </ul>
              </div>
            </div>

            <div class="col-12 md:col-6">
              <div id="defs-irc" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">IRC (fake)</div>
                <div class="text-700 mb-2">Altération progressive (mois → années).</div>
                <ul class="m-0 pl-3 text-700">
                  <li>Souvent associée à HTA/diabète (exemples).</li>
                  <li>Complications: anémie, troubles minéraux-osseux (fake).</li>
                  <li>Suivi: DFG, albuminurie, facteurs CV.</li>
                </ul>
              </div>
            </div>

            <div class="col-12">
              <div id="comparaison" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Comparaison rapide</div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead>
                      <tr>
                        <th class="text-left p-2">Critère</th>
                        <th class="text-left p-2">IRA</th>
                        <th class="text-left p-2">IRC</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td class="p-2">Temps</td>
                        <td class="p-2 text-700">Rapide</td>
                        <td class="p-2 text-700">Progressif</td>
                      </tr>
                      <tr>
                        <td class="p-2">Réversibilité</td>
                        <td class="p-2 text-700">Souvent oui</td>
                        <td class="p-2 text-700">Partielle/rare</td>
                      </tr>
                      <tr>
                        <td class="p-2">Objectif</td>
                        <td class="p-2 text-700">Identifier cause</td>
                        <td class="p-2 text-700">Ralentir progression</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="col-12">
              <div id="mini-cas" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Mini-cas (fake)</div>
                <div class="text-700 mb-2">
                  Créatinine: 80 → 190 µmol/L en 3 jours, diarrhées, TA basse.
                </div>
                <div class="text-700">
                  <span class="text-900">Hypothèse:</span> IRA pré-rénale probable.
                  <span class="ml-2 text-600">(On confirmera ensuite avec clinique + bilan)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/anatomie-physiologie"
      next-to="/capsules-insuffisance-renale/chatbot"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
import CapsulesInsuffisanceRenalePageToc from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenalePageToc.vue'
</script>
