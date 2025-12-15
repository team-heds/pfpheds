<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Activités IRA"
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
            <span class="text-900">Activités IRA</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Activités IRA</div>
      <div class="text-600 mb-4">
        Série d’exercices (fake) pour entraîner le raisonnement rapide face à une suspicion d’IRA.
      </div>

      <div class="grid">
        <div class="col-12 lg:col-4">
          <CapsulesInsuffisanceRenalePageToc
            :items="[
              { id: 'ira-act-1', label: 'Activité 1 — Tri des causes' },
              { id: 'ira-act-2', label: 'Activité 2 — Lecture d’un bilan' },
              { id: 'ira-act-3', label: 'Activité 3 — Plan d’action' },
            ]"
          />
        </div>

        <div class="col-12 lg:col-8">
          <div class="grid">
            <div class="col-12 md:col-6">
              <div id="ira-act-1" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Activité 1 — Tri des causes</div>
                <div class="text-700 mb-2">Classe les causes dans la bonne catégorie:</div>
                <div class="text-700">
                  <div class="mb-2"><span class="text-900">Pré-rénal:</span> déshydratation, hémorragie (exemples)</div>
                  <div class="mb-2"><span class="text-900">Rénal:</span> nécrose tubulaire aiguë (exemple)</div>
                  <div><span class="text-900">Post-rénal:</span> obstacle, globe vésical (exemples)</div>
                </div>
              </div>
            </div>

            <div class="col-12 md:col-6">
              <div id="ira-act-2" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Activité 2 — Lecture d’un bilan</div>
                <div class="text-700 mb-2">Bilan (fake):</div>
                <ul class="m-0 pl-3 text-700">
                  <li>Créatinine: 210 µmol/L</li>
                  <li>Urée: 18 mmol/L</li>
                  <li>K+: 5.6 mmol/L</li>
                </ul>
                <div class="mt-3 text-700">
                  <span class="text-900">Question:</span> quel paramètre te fait penser à une urgence ?
                </div>
              </div>
            </div>

            <div class="col-12">
              <div id="ira-act-3" class="surface-card border-1 surface-border border-round p-3">
                <div class="text-900 font-medium mb-2">Activité 3 — Plan d’action (fake)</div>
                <div class="grid">
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">À vérifier</div>
                    <ul class="m-0 pl-3 text-700">
                      <li>Diurèse horaire</li>
                      <li>TA / FC</li>
                      <li>Poids</li>
                    </ul>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">À faire</div>
                    <ul class="m-0 pl-3 text-700">
                      <li>Hydratation (selon protocole)</li>
                      <li>ECG si hyperK (fake)</li>
                      <li>Surveillance rapprochée</li>
                    </ul>
                  </div>
                  <div class="col-12 md:col-4">
                    <div class="text-600 text-sm">À transmettre</div>
                    <ul class="m-0 pl-3 text-700">
                      <li>Évolution créat / K+</li>
                      <li>Médicaments à risque</li>
                      <li>Signes d’obstacle</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/chatbot"
      next-to="/capsules-insuffisance-renale/activite-irc"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
import CapsulesInsuffisanceRenalePageToc from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenalePageToc.vue'
</script>
