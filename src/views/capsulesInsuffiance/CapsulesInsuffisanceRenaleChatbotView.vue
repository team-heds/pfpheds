<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Capsules — Insuffisance Rhénale"
        subtitle="Conversation guidée avec chatbot"
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
            <span class="text-900">Conversation guidée avec chatbot</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="card">
      <div class="text-900 font-semibold text-xl mb-2">Conversation guidée avec chatbot</div>
      <div class="text-600 mb-4">
        Simulation (fake) d’une conversation clinique: tu poses des questions, le bot répond, et tu ajustes ton hypothèse.
      </div>

      <div class="grid">
        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Objectif de la conversation</div>
            <ul class="m-0 pl-3 text-700">
              <li>Recueillir 5 informations clés (symptômes, diurèse, contexte, traitements, constantes).</li>
              <li>Formuler une hypothèse (IRA/IRC) et la justifier.</li>
              <li>Proposer une première prise en charge (fake).</li>
            </ul>
          </div>
        </div>

        <div class="col-12 md:col-6">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Consignes (fake)</div>
            <div class="text-700">
              <div class="mb-2"><span class="text-900">Ton rôle:</span> infirmier·ère en triage</div>
              <div class="mb-2"><span class="text-900">Contrainte:</span> 3 minutes</div>
              <div><span class="text-900">Sortie:</span> “je suspecte … car …, je fais …”</div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Questions suggérées</div>
            <div class="grid">
              <div class="col-12 md:col-6">
                <ul class="m-0 pl-3 text-700">
                  <li>Depuis quand la diurèse a-t-elle diminué ?</li>
                  <li>Y a-t-il des vomissements/diarrhées ?</li>
                  <li>Quels médicaments (AINS, diurétiques, IEC/ARA2) ?</li>
                </ul>
              </div>
              <div class="col-12 md:col-6">
                <ul class="m-0 pl-3 text-700">
                  <li>Douleurs lombaires / globe vésical ?</li>
                  <li>Dernier bilan connu (créatinine de base) ?</li>
                  <li>Signes de surcharge (œdèmes, dyspnée) ?</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="col-12">
          <div class="surface-card border-1 surface-border border-round p-3">
            <div class="text-900 font-medium mb-2">Transcription (fake)</div>
            <div class="grid">
              <div class="col-12 md:col-6">
                <div class="surface-ground border-round p-3 h-full">
                  <div class="text-600 text-sm mb-1">Toi</div>
                  <div class="text-900">“Depuis quand urinez-vous moins ?”</div>
                  <div class="mt-3 text-600 text-sm mb-1">Bot</div>
                  <div class="text-900">“Depuis hier soir, presque plus.”</div>
                </div>
              </div>
              <div class="col-12 md:col-6">
                <div class="surface-ground border-round p-3 h-full">
                  <div class="text-600 text-sm mb-1">Toi</div>
                  <div class="text-900">“Avez-vous eu diarrhées ou fièvre ?”</div>
                  <div class="mt-3 text-600 text-sm mb-1">Bot</div>
                  <div class="text-900">“Diarrhées 2 jours, pas de fièvre.”</div>
                </div>
              </div>
            </div>
            <div class="mt-3 text-700">
              <span class="text-900">Note ergonomie:</span> ici on affichera plus tard le vrai chat.
            </div>
          </div>
        </div>
      </div>
    </div>

    <CapsulesInsuffisanceRenaleNav
      prev-to="/capsules-insuffisance-renale/comprendre-ira-irc"
      next-to="/capsules-insuffisance-renale/activites-ira"
    />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import CapsulesInsuffisanceRenaleNav from '@/components/capsulesInsuffiance/CapsulesInsuffisanceRenaleNav.vue'
</script>
