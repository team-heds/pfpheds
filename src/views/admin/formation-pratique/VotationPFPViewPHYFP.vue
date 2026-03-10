<template>
  <AdminLayout>
    <Toast />
    <div class="votation-page p-4">
      <!-- Header -->
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Formation Pratique</h1>
              <p class="text-600 m-0 mt-1">
                <span v-if="filterClasse">{{ filterClasse }} — {{ activeConfig?.pfps.join(', ') }}</span>
                <span v-else>Sélectionnez une classe pour commencer</span>
              </p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterClasse" :options="classeOptions" optionLabel="label" optionValue="value" placeholder="Classe" class="w-full md:w-12rem" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full md:w-8rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterYear" :options="years" placeholder="Année" class="w-full md:w-7rem" :disabled="!filterClasse" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Recherche :</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchQuery" placeholder="Nom ou prénom..." class="w-full md:w-14rem" :disabled="!canShowResults" />
              </span>
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">&nbsp;</label>
              <div class="flex gap-2">
                <Button icon="pi pi-download" label="Export" outlined class="p-button-sm" @click="exportData" :disabled="!canShowResults" />
                <Button icon="pi pi-envelope" outlined class="p-button-sm" severity="warning" @click="remindAllNonVoters" v-tooltip="'Relancer non-votants'" :disabled="!canShowResults" />
                <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="loadData" v-tooltip="'Rafraîchir'" :loading="loading" :disabled="!canShowResults" />
              </div>
            </div>
          </div>
        </div>
        <!-- Config banner inline -->
        <div v-if="filterClasse" class="flex align-items-center gap-2 mt-3 pt-3 border-top-1 surface-border">
          <i class="pi pi-cog text-500 text-sm"></i>
          <span class="text-sm text-600">Config :</span>
          <Tag :value="filterClasse" severity="info" class="text-xs" />
          <Tag v-if="filterPFP" :value="filterPFP" class="text-xs" :style="{ background: pfpColorMap[filterPFP] || '#6366F1', color: 'white' }" />
          <Tag v-if="filterYear" :value="filterYear" class="text-xs" />
          <span v-if="computedValidatedPlaces.length > 0" class="text-sm text-500 ml-2">
            • <strong>{{ computedValidatedPlaces.length }}</strong> places validées
            (<strong>{{ computedValidatedPlaces.reduce((s, p) => s + p.Capacity, 0) }}</strong> capacité totale)
          </span>
          <span v-if="canShowResults" class="text-sm text-500 ml-auto">
            <i class="pi pi-info-circle mr-1"></i>
            <strong>{{ filteredVotationsList.length }}</strong> votes avec choix
          </span>
        </div>
      </div>

      <!-- Panneau Session de Votation -->
      <div v-if="canShowResults" class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex justify-content-between align-items-center flex-wrap gap-3">
          <div class="flex align-items-center gap-3">
            <div :class="['border-circle p-3', sessionIsOpen ? 'bg-green-100' : 'bg-orange-100']">
              <i :class="['text-2xl', sessionIsOpen ? 'pi pi-lock-open text-green-500' : 'pi pi-lock text-orange-500']"></i>
            </div>
            <div>
              <h3 class="text-lg font-bold text-900 m-0">
                Session de votation — {{ filterPFP }} {{ filterYear }}
              </h3>
              <p v-if="sessionIsOpen" class="text-600 m-0 mt-1 text-sm">
                <i class="pi pi-check-circle text-green-500 mr-1"></i>
                Votation <strong>ouverte</strong> depuis le {{ formatDate(currentSession.opened_at) }}
                — Les étudiants {{ filterClasse }} peuvent voter
              </p>
              <p v-else class="text-600 m-0 mt-1 text-sm">
                <i class="pi pi-info-circle text-orange-500 mr-1"></i>
                Votation <strong>fermée</strong> — Les étudiants ne peuvent pas voter pour le moment
              </p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="!sessionIsOpen"
              icon="pi pi-play"
              label="Lancer la votation"
              severity="success"
              @click="showSessionDialog = true"
              :loading="sessionLoading"
            />
            <Button
              v-else
              icon="pi pi-stop"
              label="Fermer la votation"
              severity="danger"
              outlined
              @click="closeVotation"
              :loading="sessionLoading"
            />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-3">
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-indigo-100">
                <i class="pi pi-users text-2xl text-indigo-500"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0 text-sm">Total {{ filterClasse || '—' }} {{ filterPFP || '' }}</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-green-100">
                <i class="pi pi-check-circle text-2xl text-green-500"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.completed }}</h3>
                <p class="text-600 m-0 text-sm">Ont voté</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-orange-100">
                <i class="pi pi-hourglass text-2xl text-orange-500"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0 text-sm">En attente</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-red-100">
                <i class="pi pi-times-circle text-2xl text-red-500"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.incomplete }}</h3>
                <p class="text-600 m-0 text-sm">Incomplets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Résultats de l'algorithme -->
      <div v-if="canShowResults && algorithmResults.length > 0" class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex justify-content-between align-items-center mb-3">
          <div>
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-check-circle text-green-500 text-xl"></i>
              <h3 class="text-lg font-bold text-900 m-0">Résultats de l'Attribution</h3>
              <Tag :value="`${algorithmResults.length} attributions`" severity="success" class="ml-2" />
            </div>
            <div v-if="algorithmStats" class="flex gap-4 flex-wrap">
              <span class="text-sm text-600"><i class="pi pi-users mr-1 text-green-500"></i> <strong>{{ algorithmStats.totalStudents || 0 }}</strong> étudiants</span>
              <span class="text-sm text-600"><i class="pi pi-star mr-1 text-indigo-500"></i> <strong>{{ algorithmStats.firstChoiceCount || 0 }}</strong> en 1er choix</span>
              <span v-if="algorithmStats.randomAssignmentCount > 0" class="text-sm text-600"><i class="pi pi-question-circle mr-1 text-red-500"></i> <strong>{{ algorithmStats.randomAssignmentCount || 0 }}</strong> aléatoires</span>
              <span class="text-sm text-600"><i class="pi pi-building mr-1 text-purple-500"></i> <strong>{{ algorithmStats.placesUsed || 0 }}</strong> places</span>
              <span class="text-sm text-600"><i class="pi pi-chart-line mr-1 text-orange-500"></i> Rang moyen: <strong>{{ algorithmStats.averageRank || '0' }}</strong></span>
            </div>
          </div>
          <Button icon="pi pi-file-excel" label="Exporter" size="small" severity="success" outlined @click="exportResults" />
        </div>

        <DataTable 
          :value="algorithmResults" 
          responsiveLayout="scroll"
          :paginator="true"
          :rows="100"
          :rowsPerPageOptions="[25, 50, 100, 200]"
          paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
          currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} étudiants"
          sortField="assigned_rank"
          :sortOrder="1"
          stripedRows
          class="p-datatable-sm"
        >
          <Column field="user_id" header="Étudiant" sortable :style="{ width: '220px' }">
            <template #body="slotProps">
              <strong>{{ getStudentName(slotProps.data.user_id) }}</strong>
            </template>
          </Column>
          <Column field="assigned_place_name" header="Place Attribuée" sortable :style="{ minWidth: '250px' }">
            <template #body="slotProps">
              <div>
                <div class="font-semibold text-900">{{ slotProps.data.assigned_place_name }}</div>
                <small class="text-500">{{ slotProps.data.assigned_institution_name }}</small>
              </div>
            </template>
          </Column>
          <Column field="assigned_rank" header="Choix" sortable :style="{ width: '150px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag 
                v-if="slotProps.data.assigned_rank === 99"
                value="Aléatoire" 
                severity="danger"
                v-tooltip.top="'Place attribuée aléatoirement'"
              />
              <Tag 
                v-else
                :value="`${slotProps.data.assigned_rank}er choix`" 
                :severity="slotProps.data.assigned_rank === 1 ? 'success' : slotProps.data.assigned_rank === 2 ? 'info' : 'warning'"
              />
            </template>
          </Column>
          <Column field="priority_score" header="Score" sortable :style="{ width: '100px', textAlign: 'center' }">
            <template #body="slotProps">
              <span class="font-medium">{{ slotProps.data.priority_score ? slotProps.data.priority_score.toFixed(1) : 'N/A' }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Message si sélection incomplète -->
      <div v-if="!canShowResults" class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center gap-3">
          <div class="border-circle p-3 bg-indigo-100">
            <i class="pi pi-info-circle text-2xl text-indigo-500"></i>
          </div>
          <div>
            <h4 class="m-0 text-900 font-bold">Sélection requise</h4>
            <p class="m-0 mt-1 text-600">
              Veuillez sélectionner une <strong>classe</strong>, un <strong>PFP</strong> et une <strong>année</strong> pour afficher les résultats des votations.
            </p>
          </div>
        </div>
      </div>

      <!-- Places validées pour le PFP sélectionné -->
      <div v-if="canShowResults && computedValidatedPlaces.length > 0" class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex justify-content-between align-items-center mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-building text-xl text-primary"></i>
            <h3 class="text-lg font-bold text-900 m-0">Places validées — {{ filterPFP }} {{ filterYear }}</h3>
            <Tag :value="`${computedValidatedPlaces.length} places`" class="ml-2" :style="{ background: pfpColorMap[filterPFP] || '#6366F1', color: 'white' }" />
            <Tag :value="`${computedValidatedPlaces.reduce((s, p) => s + p.Capacity, 0)} places disponibles`" severity="success" class="ml-1" />
          </div>
        </div>
        <DataTable
          :value="computedValidatedPlaces"
          responsiveLayout="scroll"
          :paginator="computedValidatedPlaces.length > 15"
          :rows="15"
          stripedRows
          class="p-datatable-sm"
        >
          <Column field="InstitutionName" header="Institution" sortable :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-building text-primary"></i>
                <span class="font-medium text-900">{{ slotProps.data.InstitutionName }}</span>
              </div>
            </template>
          </Column>
          <Column field="NomPlace" header="Place" sortable :style="{ minWidth: '200px' }">
            <template #body="slotProps">
              <span class="font-medium text-900">{{ slotProps.data.NomPlace }}</span>
            </template>
          </Column>
          <Column field="InstitutionCategory" header="Catégorie" sortable :style="{ minWidth: '120px' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
            </template>
          </Column>
          <Column field="Capacity" header="Capacité" sortable :style="{ width: '120px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.Capacity" severity="success" rounded />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Onglets -->
      <div v-if="canShowResults" class="surface-card border-round shadow-2">
        <TabView v-model:activeIndex="activeTab">
          <!-- Onglet 1: Vue Étudiants -->
          <TabPanel header="Vue par Étudiants">
            <div v-if="allVotes.length === 0" class="border-round p-4 mb-3 bg-yellow-100 border-1 border-yellow-500">
              <div class="flex align-items-center gap-3">
                <i class="pi pi-exclamation-triangle text-2xl text-yellow-600"></i>
                <div>
                  <h4 class="m-0 font-bold text-yellow-900">Aucun vote chargé</h4>
                  <p class="m-0 mt-1 text-sm text-yellow-800">
                    Vérifiez les permissions RLS sur la table <code>student_votes</code>.
                  </p>
                </div>
              </div>
            </div>
            <DataTable 
              :value="filteredVotationsList" 
              :loading="loading" 
              responsiveLayout="scroll" 
              :paginator="true" 
              :rows="25"
              :rowsPerPageOptions="[25, 50, 100, 200]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} étudiants"
              sortField="nom"
              :sortOrder="1"
              stripedRows
              class="p-datatable-sm"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="text-lg text-900 font-bold">Votes des Étudiants {{ filterClasse }} ({{ filteredVotationsList.length }})</span>
                  <Button icon="pi pi-sort-alpha-down" label="Trier A-Z" outlined size="small" @click="sortAlphabetically" />
                </div>
              </template>
              <template #empty>
                <div class="text-center p-4">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucune votation trouvée</p>
                </div>
              </template>
              <Column field="nom" header="Nom" sortable :style="{ minWidth: '150px' }"></Column>
              <Column field="prenom" header="Prénom" sortable :style="{ minWidth: '150px' }"></Column>
              <Column field="classe" header="Classe" sortable :style="{ minWidth: '100px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.classe" severity="info" />
                </template>
              </Column>
              <Column field="pfpType" header="PFP" sortable :style="{ minWidth: '100px' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.pfpType" :value="slotProps.data.pfpType" />
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="year" header="Année" sortable :style="{ minWidth: '80px' }"></Column>
              <Column header="Choix 1" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix1" class="choice-cell choice-cell-1 p-2 border-round border-left-3 border-blue-500">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-blue-500">1</span>
                      <div class="flex-1">
                        <div class="font-semibold text-sm text-900">{{ slotProps.data.choix1 }}</div>
                        <div v-if="slotProps.data.choix1Institution" class="text-xs mt-1 text-600">{{ slotProps.data.choix1Institution }}</div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice1PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice1PlaceId).top1" severity="success" class="text-xs px-2 py-0" />
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1" v-if="getPlaceCriteria(slotProps.data.choice1PlaceId).length > 0">
                          <Tag v-for="c in getPlaceCriteria(slotProps.data.choice1PlaceId)" :key="c" :value="c" class="text-xs px-1 py-0 criteria-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 2" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix2" class="choice-cell choice-cell-2 p-2 border-round border-left-3 border-cyan-500">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-cyan-500">2</span>
                      <div class="flex-1">
                        <div class="font-semibold text-sm text-900">{{ slotProps.data.choix2 }}</div>
                        <div v-if="slotProps.data.choix2Institution" class="text-xs mt-1 text-600">{{ slotProps.data.choix2Institution }}</div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice2PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice2PlaceId).top2" severity="info" class="text-xs px-2 py-0" />
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1" v-if="getPlaceCriteria(slotProps.data.choice2PlaceId).length > 0">
                          <Tag v-for="c in getPlaceCriteria(slotProps.data.choice2PlaceId)" :key="c" :value="c" class="text-xs px-1 py-0 criteria-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 3" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix3" class="choice-cell choice-cell-3 p-2 border-round border-left-3 border-orange-500">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-orange-500">3</span>
                      <div class="flex-1">
                        <div class="font-semibold text-sm text-900">{{ slotProps.data.choix3 }}</div>
                        <div v-if="slotProps.data.choix3Institution" class="text-xs mt-1 text-600">{{ slotProps.data.choix3Institution }}</div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice3PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice3PlaceId).top3" severity="warning" class="text-xs px-2 py-0" />
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1" v-if="getPlaceCriteria(slotProps.data.choice3PlaceId).length > 0">
                          <Tag v-for="c in getPlaceCriteria(slotProps.data.choice3PlaceId)" :key="c" :value="c" class="text-xs px-1 py-0 criteria-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 4" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix4" class="choice-cell choice-cell-4 p-2 border-round border-left-3 border-purple-500">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-purple-500">4</span>
                      <div class="flex-1">
                        <div class="font-medium text-sm text-900">{{ slotProps.data.choix4 }}</div>
                        <div v-if="slotProps.data.choix4Institution" class="text-xs mt-1 text-600">{{ slotProps.data.choix4Institution }}</div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice4PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice4PlaceId).top4" class="text-xs px-2 py-0" />
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1" v-if="getPlaceCriteria(slotProps.data.choice4PlaceId).length > 0">
                          <Tag v-for="c in getPlaceCriteria(slotProps.data.choice4PlaceId)" :key="c" :value="c" class="text-xs px-1 py-0 criteria-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 5" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix5" class="choice-cell choice-cell-5 p-2 border-round border-left-3 border-pink-500">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-pink-500">5</span>
                      <div class="flex-1">
                        <div class="font-medium text-sm text-900">{{ slotProps.data.choix5 }}</div>
                        <div v-if="slotProps.data.choix5Institution" class="text-xs mt-1 text-600">{{ slotProps.data.choix5Institution }}</div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice5PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice5PlaceId).top5" class="text-xs px-2 py-0" />
                        </div>
                        <div class="flex flex-wrap gap-1 mt-1" v-if="getPlaceCriteria(slotProps.data.choice5PlaceId).length > 0">
                          <Tag v-for="c in getPlaceCriteria(slotProps.data.choice5PlaceId)" :key="c" :value="c" class="text-xs px-1 py-0 criteria-tag" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="nbChoix" header="Nb Choix" sortable :style="{ minWidth: '100px', textAlign: 'center' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.nbChoix" :value="slotProps.data.nbChoix" severity="success" rounded />
                  <Tag v-else value="0" severity="secondary" rounded />
                </template>
              </Column>
              <Column field="dateVote" header="Date Vote" sortable :style="{ minWidth: '150px' }">
                <template #body="slotProps">
                  <span v-if="slotProps.data.dateVote" class="text-sm">{{ formatDate(slotProps.data.dateVote) }}</span>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column field="status" header="Statut" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
                </template>
              </Column>
              <Column header="Actions" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <div class="flex gap-1">
                    <Button 
                      v-if="slotProps.data.status !== 'Non voté'" 
                      icon="pi pi-eye" 
                      class="p-button-text p-button-sm" 
                      @click="viewDetails(slotProps.data)"
                      v-tooltip.top="'Voir les détails'"
                    />
                    <Button 
                      v-if="slotProps.data.status === 'Non voté'" 
                      icon="pi pi-send" 
                      class="p-button-text p-button-sm" 
                      severity="warning"
                      @click="remindStudent(slotProps.data)"
                      v-tooltip.top="'Relancer l\'étudiant'"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
          
          <!-- Onglet 2: Vue Places -->
          <TabPanel header="Vue par Places">
            <DataTable 
              :value="filteredPlacesByPFP" 
              :loading="loading" 
              responsiveLayout="scroll"
              :scrollable="true"
              scrollHeight="60vh"
              :paginator="true" 
              :rows="25"
              :rowsPerPageOptions="[25, 50, 100, 200]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} places"
              sortField="InstitutionName"
              :sortOrder="1"
              stripedRows
              class="p-datatable-sm"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="text-lg text-900 font-bold">Statistiques par Places — {{ filterPFP }} {{ filterYear }} ({{ filteredPlacesByPFP.length }})</span>
                </div>
              </template>
              <template #empty>
                <div class="text-center p-4">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucune place trouvée</p>
                </div>
              </template>
              
              <!-- Colonnes du tableau places -->
              <Column header="Institution" sortable field="InstitutionName" :style="{ minWidth: '200px' }">
                <template #body="slotProps">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-building text-primary"></i>
                    <span class="font-medium">{{ slotProps.data.InstitutionName }}</span>
                  </div>
                </template>
              </Column>
              
              <Column header="Nom de la Place" sortable field="NomPlace" :style="{ minWidth: '180px' }">
                <template #body="slotProps">
                  <span class="font-medium">{{ slotProps.data.NomPlace }}</span>
                </template>
              </Column>
              
              <Column header="Catégorie" sortable field="InstitutionCategory" :style="{ minWidth: '120px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.InstitutionCategory" severity="info" />
                </template>
              </Column>
              
              <Column header="PFP" sortable field="pfpType" :style="{ minWidth: '80px' }">
                <template #body="slotProps">
                  <Tag v-if="slotProps.data.pfpType" :value="slotProps.data.pfpType" />
                </template>
              </Column>
              
              <Column header="Année" sortable field="year" :style="{ minWidth: '80px' }"></Column>
              
              <!-- Colonnes de votes Top 1 à 5 -->
              <Column v-for="i in 5" :key="'top-'+i" :header="'Top ' + i" :style="{ textAlign: 'center', width: '70px' }">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.votes['top'+i] || 0"
                    :severity="slotProps.data.votes['top'+i] > 0 ? 'success' : 'secondary'"
                    rounded
                    @click="showStudentsForPlace(slotProps.data, i)"
                    class="cursor-pointer"
                    v-tooltip.top="`${slotProps.data.votes['top'+i] || 0} étudiants ont choisi cette place en top ${i}`"
                  />
                </template>
              </Column>
              
              <Column header="Total" :style="{ textAlign: 'center', width: '80px' }">
                <template #body="slotProps">
                  <Tag
                    :value="slotProps.data.votes.total || 0"
                    severity="contrast"
                    rounded
                    class="font-semibold"
                    @click="showStudentsForPlace(slotProps.data, 0)"
                    v-tooltip.top="`${slotProps.data.votes.total || 0} votes au total`"
                  />
                </template>
              </Column>
              
              <Column header="Étudiants" :style="{ minWidth: '150px' }">
                <template #body="slotProps">
                  <Button 
                    icon="pi pi-users" 
                    label="Voir" 
                    size="small" 
                    outlined
                    @click="showStudentsForPlace(slotProps.data, 0)"
                  />
                </template>
              </Column>
            </DataTable>
          </TabPanel>

          <!-- Onglet 3: Attribution des Places (après algorithme) -->
          <TabPanel header="Attribution des Places" :disabled="placesWithAssignments.length === 0">
            <div v-if="placesWithAssignments.length === 0" class="border-round p-4 bg-indigo-100 border-1 border-indigo-300">
              <div class="flex align-items-center gap-3">
                <i class="pi pi-info-circle text-2xl text-indigo-500"></i>
                <div>
                  <h4 class="m-0 font-bold text-indigo-900">Aucune attribution</h4>
                  <p class="m-0 mt-1 text-sm text-indigo-700">Lancez l'algorithme d'attribution pour voir les résultats ici.</p>
                </div>
              </div>
            </div>

            <DataTable 
              v-else
              :value="placesWithAssignments" 
              responsiveLayout="scroll"
              :paginator="true"
              :rows="50"
              :rowsPerPageOptions="[25, 50, 100]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Affichage de {first} à {last} sur {totalRecords} places"
              sortField="institutionName"
              :sortOrder="1"
              stripedRows
              class="p-datatable-sm"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span class="text-lg text-900 font-bold">Toutes les Places du {{ filterPFP }}</span>
                    <div class="text-sm text-600 mt-1">
                      <strong class="text-green-500">{{ placesWithAssignments.filter(p => p.assignedCount > 0).length }}</strong> avec étudiants • 
                      <strong class="text-orange-500">{{ placesWithAssignments.filter(p => p.assignedCount === 0).length }}</strong> vides • 
                      <strong>{{ placesWithAssignments.length }}</strong> au total
                    </div>
                  </div>
                </div>
              </template>

              <Column header="Institution" sortable field="institutionName" :style="{ minWidth: '200px' }">
                <template #body="slotProps">
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-building text-primary"></i>
                    <span class="font-medium">{{ slotProps.data.institutionName }}</span>
                  </div>
                </template>
              </Column>

              <Column header="Nom de la Place" sortable field="placeName" :style="{ minWidth: '180px' }">
                <template #body="slotProps">
                  <span class="font-medium">{{ slotProps.data.placeName }}</span>
                </template>
              </Column>

              <Column header="Capacité Totale" sortable field="totalCapacity" :style="{ textAlign: 'center', width: '120px' }">
                <template #body="slotProps">
                  <Tag :value="slotProps.data.totalCapacity" severity="info" />
                </template>
              </Column>

              <Column header="Assignés" sortable field="assignedCount" :style="{ textAlign: 'center', width: '100px' }">
                <template #body="slotProps">
                  <Tag 
                    :value="slotProps.data.assignedCount" 
                    :severity="slotProps.data.assignedCount > 0 ? 'success' : 'secondary'"
                  />
                </template>
              </Column>

              <Column header="Restant" sortable field="remainingCapacity" :style="{ textAlign: 'center', width: '100px' }">
                <template #body="slotProps">
                  <Tag 
                    :value="slotProps.data.remainingCapacity" 
                    :severity="slotProps.data.remainingCapacity > 0 ? 'warning' : 'success'"
                  />
                </template>
              </Column>

              <Column header="Étudiants Assignés" :style="{ minWidth: '350px' }">
                <template #body="slotProps">
                  <!-- Place vide -->
                  <div v-if="slotProps.data.assignedStudents.length === 0" class="flex align-items-center gap-2 p-2 bg-orange-50 border-round">
                    <i class="pi pi-exclamation-triangle text-orange-500"></i>
                    <span class="text-orange-700 font-medium">Aucun étudiant assigné ({{ slotProps.data.totalCapacity }} place(s) disponible(s))</span>
                  </div>
                  <!-- Place avec étudiants -->
                  <div v-else class="assigned-students-list">
                    <div 
                      v-for="(assignment, idx) in slotProps.data.assignedStudents" 
                      :key="assignment.userId"
                      class="mb-1 p-2 bg-green-50 border-round"
                    >
                      <div class="flex align-items-center gap-2">
                        <Tag 
                          :value="`${idx + 1}`" 
                          severity="success"
                          rounded
                        />
                        <span class="font-semibold">{{ getStudentName(assignment.userId) }}</span>
                        <Tag 
                          v-if="assignment.rank === 99"
                          value="🎲 Aléatoire" 
                          severity="danger"
                          class="ml-auto"
                          v-tooltip.top="'Assignation aléatoire (place non dans les choix)'"
                        />
                        <Tag 
                          v-else
                          :value="`${assignment.rank}er choix`" 
                          :severity="assignment.rank === 1 ? 'success' : assignment.rank === 2 ? 'info' : 'warning'"
                          class="ml-auto"
                        />
                      </div>
                    </div>
                    <!-- Indication si place complète -->
                    <div v-if="slotProps.data.remainingCapacity === 0" class="mt-1">
                      <Tag value="Place complète" severity="success" class="w-full" />
                    </div>
                  </div>
                </template>
              </Column>
            </DataTable>
          </TabPanel>
        </TabView>

        <!-- Panneau Propositions PFP4 -->
        <div v-if="filterPFP === 'PFP4' && canShowResults" class="surface-card p-4 border-round shadow-2 mt-4 border-1 border-yellow-300" style="background: #FFFBEB;">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-filter-fill text-xl text-yellow-600"></i>
                <h3 class="text-lg font-bold m-0" style="color: #92400E;">Propositions PFP4 — Places par étudiant</h3>
              </div>
              <p class="m-0 mt-1 text-sm" style="color: #A16207;">
                Générer les places proposées pour chaque étudiant {{ filterClasse }} selon leurs critères manquants
              </p>
            </div>
            <div class="flex gap-2">
              <Button
                icon="pi pi-cog"
                label="Générer les propositions"
                severity="warning"
                @click="generatePfp4Proposals"
                :loading="pfp4Loading"
              />
              <Button
                v-if="pfp4Proposals.length > 0"
                icon="pi pi-save"
                label="Sauvegarder"
                :severity="pfp4Saved ? 'success' : 'info'"
                :outlined="pfp4Saved"
                @click="savePfp4Proposals"
                :loading="pfp4Loading"
                :disabled="pfp4Saved"
              />
              <Button
                v-if="pfp4Proposals.length > 0"
                icon="pi pi-file-excel"
                label="Export CSV"
                severity="secondary"
                outlined
                @click="exportPfp4BilanCSV"
              />
            </div>
          </div>

          <!-- Exclusion manuelle d'étudiants -->
          <div class="mt-3 pt-3 border-top-1 surface-border">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-user-minus text-red-500"></i>
              <span class="font-semibold text-sm" style="color: #92400E;">Exclure des étudiants :</span>
              <Tag v-if="excludedStudentIds.length > 0" :value="`${excludedStudentIds.length} exclu(s)`" severity="danger" class="text-xs" />
              <small class="text-500 ml-2">Exclus de la génération des propositions ET du tirage au sort</small>
            </div>
            <div class="flex gap-2 align-items-start flex-wrap">
              <AutoComplete
                v-model="excludeSearchValue"
                :suggestions="excludeFilteredSuggestions"
                optionLabel="name"
                placeholder="Rechercher un étudiant à exclure..."
                @complete="filterExcludeStudents"
                @item-select="onExcludeStudent"
                class="w-full md:w-25rem"
                :dropdown="true"
              />
            </div>
            <div v-if="excludedStudentIds.length > 0" class="flex gap-2 flex-wrap mt-2">
              <Tag 
                v-for="uid in excludedStudentIds" 
                :key="uid" 
                :value="getExcludedStudentName(uid)"
                severity="danger"
                class="text-xs cursor-pointer"
                @click="removeExcludedStudent(uid)"
                style="cursor: pointer;"
              >
                <template #default>
                  <span>{{ getExcludedStudentName(uid) }}</span>
                  <i class="pi pi-times ml-1" style="font-size: 0.7rem;"></i>
                </template>
              </Tag>
            </div>
          </div>

          <!-- Statistiques PFP4 -->
          <div v-if="pfp4Stats" class="grid mb-3">
            <div class="col-6 md:col-2">
              <div class="p-2 border-round text-center" style="background: rgba(245,158,11,0.1);">
                <div class="text-xl font-bold" style="color: #92400E;">{{ pfp4Stats.totalStudents }}</div>
                <div class="text-xs text-600">Étudiants</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="p-2 border-round text-center" style="background: rgba(99,102,241,0.1);">
                <div class="text-xl font-bold text-indigo-600">{{ pfp4Stats.totalPfp4Places }}</div>
                <div class="text-xs text-600">Places PFP4</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="p-2 border-round text-center" style="background: rgba(34,197,94,0.1);">
                <div class="text-xl font-bold text-green-600">{{ pfp4Stats.totalCapacity }}</div>
                <div class="text-xs text-600">Capacité totale</div>
              </div>
            </div>
            <div class="col-6 md:col-2">
              <div class="p-2 border-round text-center" style="background: rgba(99,102,241,0.1);">
                <div class="text-xl font-bold text-indigo-600">{{ pfp4Stats.averageProposedPlaces }}</div>
                <div class="text-xs text-600">Moy. places/étudiant</div>
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="p-2 border-round" style="background: rgba(245,158,11,0.05);">
                <div class="text-xs font-semibold text-600 mb-1">Répartition des règles :</div>
                <div class="flex flex-wrap gap-1">
                  <Tag v-for="(count, rule) in pfp4Stats.ruleDistribution" :key="rule"
                    :value="`${pfp4RuleLabels[rule] || rule}: ${count}`"
                    :severity="pfp4RuleSeverity[rule] || 'secondary'"
                    class="text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Indicateur sauvegardé -->
          <div v-if="pfp4Saved" class="flex align-items-center gap-2 p-2 border-round bg-green-50 border-1 border-green-300 mb-3">
            <i class="pi pi-check-circle text-green-500"></i>
            <span class="text-sm text-green-700 font-medium">Propositions sauvegardées ! Les étudiants verront uniquement leurs places proposées lors du vote PFP4.</span>
          </div>

          <!-- Tableau des propositions -->
          <div v-if="pfp4Proposals.length > 0">
            <div class="flex align-items-center gap-3 mb-2">
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="pfp4SearchQuery" placeholder="Rechercher un étudiant..." class="w-14rem p-inputtext-sm" />
              </span>
              <Dropdown
                v-model="pfp4FilterRule"
                :options="Object.entries(pfp4RuleLabels).map(([k, v]) => ({ label: v, value: k }))"
                optionLabel="label"
                optionValue="value"
                placeholder="Filtrer par règle"
                class="w-14rem"
                :showClear="true"
              />
              <span class="text-sm text-600">{{ filteredPfp4Proposals.length }} / {{ pfp4Proposals.length }} étudiants</span>
            </div>

            <DataTable
              :value="filteredPfp4Proposals"
              responsiveLayout="scroll"
              :paginator="true"
              :rows="25"
              :rowsPerPageOptions="[10, 25, 50, 100]"
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="{first}–{last} sur {totalRecords}"
              sortField="nom"
              :sortOrder="1"
              stripedRows
              class="p-datatable-sm"
            >
              <Column field="nom" header="Nom" sortable :style="{ width: '130px' }">
                <template #body="slotProps">
                  <strong>{{ slotProps.data.nom.toUpperCase() }}</strong> {{ slotProps.data.prenom }}
                </template>
              </Column>

              <Column header="Critères validés" :style="{ minWidth: '220px' }">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="c in ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']" :key="c"
                      :value="c"
                      :severity="slotProps.data.scores[c] > 0 ? 'success' : 'danger'"
                      class="text-xs"
                      :style="slotProps.data.scores[c] === 0 ? { opacity: 0.6 } : {}"
                    />
                  </div>
                </template>
              </Column>

              <Column header="Critères manquants" :style="{ minWidth: '150px' }">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1">
                    <Tag v-for="c in slotProps.data.missingCriteria" :key="c"
                      :value="c"
                      severity="danger"
                      class="text-xs font-bold"
                    />
                    <span v-if="slotProps.data.missingCriteria.length === 0" class="text-green-500 text-sm font-semibold">
                      <i class="pi pi-check-circle mr-1"></i>Complet
                    </span>
                  </div>
                </template>
              </Column>

              <Column field="appliedRule" header="Règle" sortable :style="{ width: '180px' }">
                <template #body="slotProps">
                  <Tag
                    :value="pfp4RuleLabels[slotProps.data.appliedRule] || slotProps.data.appliedRule"
                    :severity="pfp4RuleSeverity[slotProps.data.appliedRule] || 'secondary'"
                    class="text-xs"
                  />
                </template>
              </Column>

              <Column field="proposedPlacesCount" header="Places proposées" sortable :style="{ width: '120px', textAlign: 'center' }">
                <template #body="slotProps">
                  <Tag
                    :value="`${slotProps.data.proposedPlacesCount} / ${pfp4AllPlaces.length}`"
                    :severity="slotProps.data.proposedPlacesCount >= 5 ? 'success' : 'warning'"
                    rounded
                  />
                </template>
              </Column>

              <Column header="Détail places" :style="{ minWidth: '300px' }">
                <template #body="slotProps">
                  <div class="flex flex-wrap gap-1" style="max-height: 60px; overflow-y: auto;">
                    <Tag v-for="place in slotProps.data.proposedPlaces.slice(0, 8)" :key="place.PlaceId"
                      :value="`${place.InstitutionName || ''} — ${place.NomPlace}`"
                      severity="info"
                      class="text-xs"
                      v-tooltip.top="'Critères: ' + place.criteria.join(', ')"
                    />
                    <Tag v-if="slotProps.data.proposedPlaces.length > 8"
                      :value="`+${slotProps.data.proposedPlaces.length - 8} autres`"
                      severity="secondary"
                      class="text-xs"
                    />
                  </div>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>

        <!-- Bouton Algorithme -->
        <div class="surface-card p-4 border-round shadow-2 mt-4 bg-green-50 border-1 border-green-300">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-play-circle text-xl text-green-600"></i>
                <h3 class="text-lg font-bold m-0 text-green-900">Algorithme d'attribution</h3>
              </div>
              <p class="m-0 mt-1 text-sm text-green-700">
                Lancer l'algorithme pour {{ filterClasse }} — {{ filterPFP }} {{ filterYear }}
                <span v-if="filteredVotationsList.length > 0"> • <strong>{{ filteredVotationsList.length }}</strong> étudiants à traiter</span>
                <span v-if="excludedStudentIds.length > 0" class="text-red-600"> • <strong>{{ excludedStudentIds.length }}</strong> exclu(s)</span>
              </p>
            </div>
            <Button 
              icon="pi pi-play-circle" 
              label="Démarrer" 
              severity="success"
              @click="startAlgorithm"
              :disabled="filteredVotationsList.length === 0"
            />
          </div>
          <!-- Exclusion manuelle (hors PFP4 qui a son propre panneau) -->
          <div v-if="filterPFP !== 'PFP4' && excludedStudentOptions.length > 0" class="mt-3 pt-3 border-top-1 border-green-300">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-user-minus text-red-500"></i>
              <span class="font-semibold text-sm text-green-900">Exclure des étudiants :</span>
              <Tag v-if="excludedStudentIds.length > 0" :value="`${excludedStudentIds.length} exclu(s)`" severity="danger" class="text-xs" />
            </div>
            <div class="flex gap-2 align-items-start flex-wrap">
              <AutoComplete
                v-model="excludeSearchValue"
                :suggestions="excludeFilteredSuggestions"
                optionLabel="name"
                placeholder="Rechercher un étudiant à exclure..."
                @complete="filterExcludeStudents"
                @item-select="onExcludeStudent"
                class="w-full md:w-25rem"
                :dropdown="true"
              />
            </div>
            <div v-if="excludedStudentIds.length > 0" class="flex gap-2 flex-wrap mt-2">
              <Tag 
                v-for="uid in excludedStudentIds" 
                :key="uid" 
                :value="getExcludedStudentName(uid)"
                severity="danger"
                class="text-xs"
                @click="removeExcludedStudent(uid)"
                style="cursor: pointer;"
              >
                <template #default>
                  <span>{{ getExcludedStudentName(uid) }}</span>
                  <i class="pi pi-times ml-1" style="font-size: 0.7rem;"></i>
                </template>
              </Tag>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Historique des sessions de votation -->
    <div class="surface-card p-4 border-round shadow-2 mb-3 mt-4">
      <div class="flex justify-content-between align-items-center mb-3" style="cursor: pointer" @click="showHistoryPanel = !showHistoryPanel; if(showHistoryPanel && sessionHistory.length === 0) loadSessionHistory()">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-history text-xl text-primary"></i>
          <h3 class="text-lg font-bold text-900 m-0">Historique des sessions</h3>
          <Tag v-if="sessionHistory.length > 0" :value="sessionHistory.length" severity="secondary" rounded />
        </div>
        <Button
          :icon="showHistoryPanel ? 'pi pi-chevron-up' : 'pi pi-chevron-down'"
          text
          rounded
          size="small"
        />
      </div>
      <div v-if="showHistoryPanel">
        <div v-if="sessionHistory.length === 0" class="text-center p-4 text-600">
          <i class="pi pi-spin pi-spinner mr-2"></i> Chargement...
        </div>
        <DataTable
          v-else
          :value="sessionHistory"
          responsiveLayout="scroll"
          :paginator="sessionHistory.length > 10"
          :rows="10"
          stripedRows
          class="p-datatable-sm"
          sortField="opened_at"
          :sortOrder="-1"
        >
          <Column field="pfp_type" header="PFP" sortable :style="{ width: '100px' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.pfp_type" :style="{ background: pfpColorMap[slotProps.data.pfp_type] || '#6366F1', color: 'white' }" />
            </template>
          </Column>
          <Column field="year" header="Année" sortable :style="{ width: '80px' }">
            <template #body="slotProps">
              <span class="font-medium">{{ slotProps.data.year }}</span>
            </template>
          </Column>
          <Column field="target_class" header="Classe" sortable :style="{ width: '100px' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.target_class" severity="info" />
            </template>
          </Column>
          <Column field="status" header="Statut" sortable :style="{ width: '100px' }">
            <template #body="slotProps">
              <Tag
                :value="slotProps.data.status === 'open' ? 'Ouverte' : 'Fermée'"
                :severity="slotProps.data.status === 'open' ? 'success' : 'secondary'"
              />
            </template>
          </Column>
          <Column field="opened_at" header="Ouverture" sortable :style="{ minWidth: '150px' }">
            <template #body="slotProps">
              <span class="text-sm">{{ formatDate(slotProps.data.opened_at) }}</span>
            </template>
          </Column>
          <Column field="closed_at" header="Fermeture" sortable :style="{ minWidth: '150px' }">
            <template #body="slotProps">
              <span v-if="slotProps.data.closed_at" class="text-sm">{{ formatDate(slotProps.data.closed_at) }}</span>
              <span v-else class="text-400">-</span>
            </template>
          </Column>
          <Column header="Durée" :style="{ width: '120px' }">
            <template #body="slotProps">
              <span class="text-sm">{{ formatDuration(slotProps.data.opened_at, slotProps.data.closed_at) }}</span>
            </template>
          </Column>
          <Column field="voteCount" header="Votes" sortable :style="{ width: '80px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag :value="slotProps.data.voteCount" severity="primary" rounded class="font-semibold" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog de confirmation pour lancer la votation -->
    <Dialog
      v-model:visible="showSessionDialog"
      modal
      header="Lancer la votation"
      :style="{ width: '500px' }"
    >
      <div class="flex flex-column gap-3">
        <div class="flex align-items-center gap-3 p-3 border-round bg-green-50 border-1 border-green-300">
          <i class="pi pi-play text-green-600 text-2xl"></i>
          <div>
            <p class="m-0 font-bold text-green-900">Ouvrir la votation {{ filterPFP }} {{ filterYear }}</p>
            <p class="m-0 mt-1 text-sm text-green-700">Classe : {{ filterClasse }}</p>
          </div>
        </div>
        <p class="text-600 m-0">
          En lançant la votation, les étudiants de la classe <strong>{{ filterClasse }}</strong>
          pourront accéder à la page de votation et soumettre leurs choix pour
          <strong>{{ filterPFP }}</strong> — <strong>{{ filterYear }}</strong>.
        </p>
        <div class="flex align-items-center gap-2 p-2 border-round bg-blue-50 border-1 border-blue-300">
          <i class="pi pi-info-circle text-blue-500"></i>
          <span class="text-sm text-blue-700">
            <strong>{{ computedValidatedPlaces.length }}</strong> places validées
            (<strong>{{ computedValidatedPlaces.reduce((s, p) => s + p.Capacity, 0) }}</strong> capacité totale)
          </span>
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" severity="secondary" outlined @click="showSessionDialog = false" />
        <Button label="Lancer la votation" icon="pi pi-play" severity="success" @click="openVotation" :loading="sessionLoading" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Toast from 'primevue/toast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { supabase } from '@/supabase'
import { getAllStudents } from '@/service/studentsService'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { useUserStore } from '@/stores/userStore'
import votesBackendService from '@/stores/votesBackendService'
import resultatVotationService from '@/stores/resultatVotationService'
import votationSessionService from '@/service/votationSessionService'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Chips from 'primevue/chips'
import AutoComplete from 'primevue/autocomplete'

const toast = useToast()
const userStore = useUserStore()
const loading = ref(false)
const searchQuery = ref('')
const filterPFP = ref(null)
const filterYear = ref(null)
const filterClasse = ref(null)

// ============================================
// SESSION DE VOTATION
// ============================================
const currentSession = ref(null)
const showSessionDialog = ref(false)
const sessionLoading = ref(false)

const sessionIsOpen = computed(() => {
  return currentSession.value && currentSession.value.status === 'open'
})

const loadCurrentSession = async () => {
  if (!filterPFP.value || !filterYear.value) {
    currentSession.value = null
    return
  }
  try {
    currentSession.value = await votationSessionService.getActiveSession(filterPFP.value, filterYear.value)
  } catch (error) {
    console.error('❌ Erreur chargement session:', error)
    currentSession.value = null
  }
}

const openVotation = async () => {
  if (!filterClasse.value || !filterPFP.value || !filterYear.value) {
    toast.add({ severity: 'warn', summary: 'Sélection incomplète', detail: 'Veuillez sélectionner une classe, un PFP et une année', life: 3000 })
    return
  }
  sessionLoading.value = true
  try {
    const userId = userStore.user?.id || null
    const session = await votationSessionService.openSession(
      filterPFP.value,
      filterYear.value,
      filterClasse.value,
      userId
    )
    currentSession.value = session
    showSessionDialog.value = false
    if (showHistoryPanel.value) await loadSessionHistory()
    toast.add({
      severity: 'success',
      summary: 'Votation ouverte',
      detail: `La votation ${filterPFP.value} ${filterYear.value} est maintenant ouverte pour les étudiants ${filterClasse.value}`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur ouverture session:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ouvrir la votation: ' + error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}

const closeVotation = async () => {
  if (!filterPFP.value || !filterYear.value) return
  sessionLoading.value = true
  try {
    await votationSessionService.closeSession(filterPFP.value, filterYear.value)
    currentSession.value = null
    if (showHistoryPanel.value) await loadSessionHistory()
    toast.add({
      severity: 'info',
      summary: 'Votation fermée',
      detail: `La votation ${filterPFP.value} ${filterYear.value} est maintenant fermée`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur fermeture session:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de fermer la votation: ' + error.message, life: 5000 })
  } finally {
    sessionLoading.value = false
  }
}
// ============================================
// HISTORIQUE DES SESSIONS
// ============================================
const sessionHistory = ref([])
const showHistoryPanel = ref(false)

const loadSessionHistory = async () => {
  try {
    const allSessions = await votationSessionService.fetchAll()
    // Enrichir avec le nombre de votes pour chaque session
    const enriched = await Promise.all(allSessions.map(async (session) => {
      try {
        const { count } = await supabase
          .from('student_votes')
          .select('*', { count: 'exact', head: true })
          .eq('pfp_type', session.pfp_type)
          .eq('year', session.year)
        return { ...session, voteCount: count || 0 }
      } catch {
        return { ...session, voteCount: '?' }
      }
    }))
    sessionHistory.value = enriched
  } catch (error) {
    console.error('❌ Erreur chargement historique sessions:', error)
    sessionHistory.value = []
  }
}

const formatDuration = (openedAt, closedAt) => {
  if (!openedAt) return '-'
  const start = new Date(openedAt)
  const end = closedAt ? new Date(closedAt) : new Date()
  const diffMs = end - start
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  if (hours > 0) return `${hours}h ${minutes}min`
  return `${minutes}min`
}

const votationsList = ref([])
const allStudents = ref([])
const allVotes = ref([])
const votesAggregation = ref({})
const placesWithStats = ref([])
const validatedPlaces = ref([])
const activeTab = ref(0)
const placesFullMap = ref(new Map())

// ============================================
// EXCLUSION MANUELLE D'ÉTUDIANTS
// ============================================
const excludedStudentIds = ref([])
const excludeSearchValue = ref('')
const excludeFilteredSuggestions = ref([])

const excludedStudentOptions = computed(() => {
  return allStudents.value.map(s => {
    const nom = (s.Nom || s.nom || s.family_name || '').toUpperCase()
    const prenom = s.Prenom || s.prenom || s.forname || ''
    return {
      name: `${nom} ${prenom}`.trim() || s.email || 'Inconnu',
      code: s.id || s.user_id
    }
  }).filter(o => o.code).sort((a, b) => a.name.localeCompare(b.name))
})

const filterExcludeStudents = (event) => {
  const query = (event.query || '').toLowerCase().trim()
  const alreadyExcluded = new Set(excludedStudentIds.value)
  excludeFilteredSuggestions.value = excludedStudentOptions.value
    .filter(o => !alreadyExcluded.has(o.code))
    .filter(o => !query || o.name.toLowerCase().includes(query))
}

const onExcludeStudent = (event) => {
  const selected = event.value
  if (selected && selected.code && !excludedStudentIds.value.includes(selected.code)) {
    excludedStudentIds.value.push(selected.code)
  }
  nextTick(() => { excludeSearchValue.value = '' })
}

const removeExcludedStudent = (uid) => {
  excludedStudentIds.value = excludedStudentIds.value.filter(id => id !== uid)
}

const getExcludedStudentName = (uid) => {
  const opt = excludedStudentOptions.value.find(o => o.code === uid)
  return opt ? opt.name : uid.substring(0, 8)
}

const CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

const getPlaceCriteria = (placeId) => {
  if (!placeId || !placesFullMap.value.has(placeId)) return []
  const place = placesFullMap.value.get(placeId)
  return CRITERIA_KEYS.filter(key => place[key] === true || place[key] === 'true' || place[key] === 1 || place[key] === '1')
}
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const algorithmResults = ref([])
const algorithmStats = ref(null)
const placesWithAssignments = ref([])

// ============================================
// PROPOSITIONS PFP4
// ============================================
const pfp4Proposals = ref([])
const pfp4AllPlaces = ref([])
const pfp4Stats = ref(null)
const pfp4Loading = ref(false)
const pfp4Saved = ref(false)
const pfp4SearchQuery = ref('')
const pfp4FilterRule = ref(null)

const pfp4RuleLabels = {
  DE_ONLY: 'Manque DE uniquement',
  DE_AND_SYSINT: 'Manque DE + SYSINT',
  SYSINT_ONLY: 'Manque SYSINT uniquement',
  SYSINT_AND_OTHER: 'Manque SYSINT + autre',
  OTHER_MISSING: 'Autres critères manquants',
  ALL_COMPLETE: 'Tous critères validés'
}

const pfp4RuleSeverity = {
  DE_ONLY: 'warning',
  DE_AND_SYSINT: 'danger',
  SYSINT_ONLY: 'info',
  SYSINT_AND_OTHER: 'warning',
  OTHER_MISSING: 'secondary',
  ALL_COMPLETE: 'success'
}

const filteredPfp4Proposals = computed(() => {
  let filtered = [...pfp4Proposals.value]
  if (pfp4SearchQuery.value && pfp4SearchQuery.value.trim()) {
    const q = pfp4SearchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(p => 
      (p.nom || '').toLowerCase().includes(q) || 
      (p.prenom || '').toLowerCase().includes(q)
    )
  }
  if (pfp4FilterRule.value) {
    filtered = filtered.filter(p => p.appliedRule === pfp4FilterRule.value)
  }
  return filtered
})

const generatePfp4Proposals = async () => {
  if (!filterYear.value || !filterClasse.value) {
    toast.add({ severity: 'warn', summary: 'Sélection incomplète', detail: 'Veuillez sélectionner une classe et une année', life: 3000 })
    return
  }
  pfp4Loading.value = true
  pfp4Saved.value = false
  try {
    const year = filterYear.value
    const classe = filterClasse.value

    // ── 1. Charger toutes les données (même approche que VerificationCriteresEtudiants) ──
    const [allStudentsData, physioResult, assignmentsResult, placesResult] = await Promise.all([
      getAllStudents(),
      supabase.from('StudentsPhysio').select('user_id, pfp_valided, sae, cas_particulier'),
      supabase.from('student_result_vote').select('*').order('year', { ascending: false }),
      supabase.from('places').select('*')
    ])

    console.log('══════════════════════════════════════════════')
    console.log('📦 PFP4 PROPOSALS — Données chargées:')
    console.log(`   Étudiants (getAllStudents): ${allStudentsData.length}`)
    console.log(`   StudentsPhysio: ${physioResult.data?.length || 0} ${physioResult.error ? '⚠️ ' + physioResult.error.message : '✅'}`)
    console.log(`   student_result_vote: ${assignmentsResult.data?.length || 0} ${assignmentsResult.error ? '⚠️ ' + assignmentsResult.error.message : '✅'}`)
    console.log(`   places: ${placesResult.data?.length || 0} ${placesResult.error ? '⚠️ ' + placesResult.error.message : '✅'}`)

    const allClassStudents = allStudentsData.filter(s => (s.Classe || s.classe || '') === classe)
    console.log(`   Étudiants ${classe}: ${allClassStudents.length}`)

    // ── 1b. Exclure les étudiants déjà assignés en PFP4 et ceux exclus manuellement ──
    const pfp4AssignedUserIds = new Set()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (a.pfp_type === 'PFP4' && a.assigned_place_id) {
          pfp4AssignedUserIds.add(a.user_id)
        }
      })
    }
    const manuallyExcludedIds = new Set(excludedStudentIds.value || [])

    const classStudents = allClassStudents.filter(s => {
      const uid = s.id || s.user_id
      if (pfp4AssignedUserIds.has(uid)) return false
      if (manuallyExcludedIds.has(uid)) return false
      // Exclure les profils fantômes (pas de nom = pas un vrai étudiant)
      const nom = s.Nom || s.nom || s.family_name || ''
      if (!nom || nom === 'Nom non disponible') {
        console.log(`   👻 Ghost exclu: user_id=${uid} (pas de nom)`)
        return false
      }
      return true
    })

    const excludedAssigned = allClassStudents.filter(s => pfp4AssignedUserIds.has(s.id || s.user_id))
    const excludedManual = allClassStudents.filter(s => manuallyExcludedIds.has(s.id || s.user_id) && !pfp4AssignedUserIds.has(s.id || s.user_id))
    console.log(`   ❌ Exclus (déjà assignés PFP4): ${excludedAssigned.length}`)
    excludedAssigned.forEach(s => console.log(`      - ${s.Nom || s.nom} ${s.Prenom || s.prenom}`))
    console.log(`   ❌ Exclus (manuellement): ${excludedManual.length}`)
    excludedManual.forEach(s => console.log(`      - ${s.Nom || s.nom} ${s.Prenom || s.prenom}`))
    console.log(`   → ${classStudents.length} étudiants restants pour la génération`)

    // ── 2. Map des places (avec critères) ──
    const placesMap = new Map()
    ;(placesResult.data || []).forEach(p => {
      placesMap.set(p.PlaceId, {
        name: p.NomPlace,
        institution: p.InstitutionName || '',
        MSQ: !!p.MSQ, SYSINT: !!p.SYSINT, NEUROGER: !!p.NEUROGER,
        AIGU: !!p.AIGU, REHAB: !!p.REHAB, AMBU: !!p.AMBU, FR: !!p.FR, DE: !!p.DE,
        _raw: p
      })
    })

    // ── 3. Helper extractCrit (même logique que VerificationCriteresEtudiants) ──
    const extractCrit = (obj) => {
      if (!obj) return {}
      const r = {}
      CRITERIA_KEYS.forEach(c => { r[c] = !!(obj[c] || obj[c.toLowerCase()]) })
      return r
    }

    const parsePfpValided = (pfpVal) => {
      if (!pfpVal) return []
      if (Array.isArray(pfpVal)) return pfpVal
      if (typeof pfpVal === 'string') {
        try { const p = JSON.parse(pfpVal); return Array.isArray(p) ? p : [] } catch (e) { return [] }
      }
      if (typeof pfpVal === 'object') return Object.values(pfpVal)
      return []
    }

    // ── 4. Construire criteriaMap depuis pfp_valided ──
    const criteriaMap = new Map()
    const stagesMap = new Map()
    if (physioResult.data) {
      physioResult.data.forEach(physio => {
        if (!physio.pfp_valided) return
        const scores = {}
        CRITERIA_KEYS.forEach(k => { scores[k] = 0 })
        const pfpArray = parsePfpValided(physio.pfp_valided)
        pfpArray.forEach(place => {
          const crit = extractCrit(place)
          CRITERIA_KEYS.forEach(c => { if (crit[c]) scores[c]++ })
        })
        criteriaMap.set(physio.user_id, { scores, totalStages: pfpArray.length, sae: !!physio.sae, casParticulier: !!physio.cas_particulier })
        const enrichedStages = pfpArray.map((stage, idx) => ({
          _placeId: stage.PlaceId || stage.ID_PFP || stage.id_pfp || null,
          pfp_type: stage.pfp_type || stage.pfpLevel || ['PFP1', 'PFP2', 'PFP3', 'PFP4'][idx] || null
        }))
        stagesMap.set(physio.user_id, enrichedStages)
      })
    }
    console.log(`   Critères depuis pfp_valided: ${criteriaMap.size} étudiants`)

    // DEBUG BONVIN: afficher les données brutes
    if (physioResult.data) {
      const bonvinPhysio = physioResult.data.filter(p => {
        const student = classStudents.find(s => s.id === p.user_id && (s.Nom || '').toLowerCase().includes('bonvin'))
        return !!student
      })
      console.log(`🔍 DEBUG BONVIN — StudentsPhysio entries: ${bonvinPhysio.length}`)
      bonvinPhysio.forEach(p => {
        const pfpArray = parsePfpValided(p.pfp_valided)
        console.log(`   pfp_valided raw type: ${typeof p.pfp_valided}, isArray: ${Array.isArray(p.pfp_valided)}`)
        console.log(`   pfp_valided parsed: ${pfpArray.length} stages`)
        pfpArray.forEach((stage, i) => {
          const crit = extractCrit(stage)
          const activeCrit = CRITERIA_KEYS.filter(c => crit[c])
          console.log(`   Stage ${i}: PlaceId=${stage.PlaceId || stage.ID_PFP || 'N/A'} pfp_type=${stage.pfp_type || stage.pfpLevel || 'N/A'} critères=[${activeCrit.join(',')}]`)
        })
      })
    }

    // ── 5. Enrichir avec student_result_vote (anti-doublon comme VerificationCriteresEtudiants) ──
    const assignedPlacesMap = new Map()
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (a.assigned_place_id) {
          if (!assignedPlacesMap.has(a.user_id)) assignedPlacesMap.set(a.user_id, new Set())
          assignedPlacesMap.get(a.user_id).add(a.assigned_place_id)
        }

        if (a.pfp_validee && a.assigned_place_id) {
          const placeInfo = placesMap.get(a.assigned_place_id)
          if (placeInfo) {
            const existingStages = stagesMap.get(a.user_id) || []
            const alreadyExists = existingStages.some(s =>
              (s._placeId && s._placeId === a.assigned_place_id) ||
              (s.pfp_type && s.pfp_type === a.pfp_type)
            )
            if (!alreadyExists) {
              const existing = criteriaMap.get(a.user_id) || { scores: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0])), totalStages: 0, sae: false, casParticulier: false }
              CRITERIA_KEYS.forEach(c => { if (placeInfo[c]) existing.scores[c]++ })
              existing.totalStages++
              criteriaMap.set(a.user_id, existing)
            }
          }
        }
      })
    }
    console.log(`   Critères enrichis (+ student_result_vote): ${criteriaMap.size} étudiants`)
    console.log(`   Places assignées trackées: ${assignedPlacesMap.size} étudiants`)

    if (assignmentsResult.data?.length > 0) {
      const sample = assignmentsResult.data.slice(0, 5)
      sample.forEach(a => console.log(`   [srv] user=${a.user_id?.substring(0,8)} pfp=${a.pfp_type} place=${a.assigned_place_id?.substring(0,15)} validee=${a.pfp_validee}(${typeof a.pfp_validee})`))
    }

    // DEBUG BONVIN: afficher les assignations
    if (assignmentsResult.data) {
      const bonvinStudentIds = new Set(classStudents.filter(s => (s.Nom || '').toLowerCase().includes('bonvin')).map(s => s.id))
      const bonvinAssignments = assignmentsResult.data.filter(a => bonvinStudentIds.has(a.user_id))
      console.log(`🔍 DEBUG BONVIN — student_result_vote entries: ${bonvinAssignments.length}`)
      bonvinAssignments.forEach(a => {
        const placeInfo = placesMap.get(a.assigned_place_id)
        const placeCrit = placeInfo ? CRITERIA_KEYS.filter(c => placeInfo[c]) : []
        console.log(`   pfp=${a.pfp_type} place=${a.assigned_place_name || a.assigned_place_id?.substring(0,15)} validee=${a.pfp_validee}(${typeof a.pfp_validee}) critères_place=[${placeCrit.join(',')}]`)
      })
      bonvinStudentIds.forEach(uid => {
        const crit = criteriaMap.get(uid)
        const assigned = assignedPlacesMap.get(uid)
        console.log(`🔍 DEBUG BONVIN — criteriaMap pour ${uid.substring(0,8)}: ${crit ? JSON.stringify(crit.scores) : 'NON TROUVÉ'}`)
        console.log(`🔍 DEBUG BONVIN — assignedPlaces: ${assigned ? [...assigned].join(', ') : 'aucune'}`)
      })
    }

    // ── 6a. Compter les assignations PFP4 existantes par place ──
    const pfp4AssignCountByPlace = new Map() // placeId → nombre d'étudiants assignés en PFP4
    if (assignmentsResult.data) {
      assignmentsResult.data.forEach(a => {
        if (a.pfp_type === 'PFP4' && a.assigned_place_id) {
          pfp4AssignCountByPlace.set(a.assigned_place_id, (pfp4AssignCountByPlace.get(a.assigned_place_id) || 0) + 1)
        }
      })
    }
    console.log(`   Places PFP4 déjà assignées: ${pfp4AssignCountByPlace.size} places distinctes`)

    // ── 6b. Places PFP4 depuis pfp4_proposition, en excluant les places pleines ──
    const allPlaces = placesResult.data || []
    // Helper: lire la capacité — si la clé year existe, l'utiliser (même si "0").
    // Ne fallback sur default QUE si la clé year n'existe pas du tout.
    const getCapacity = (propData) => {
      if (propData.hasOwnProperty(year) && propData[year] !== '' && propData[year] !== null && propData[year] !== undefined) {
        return parseInt(propData[year]) || 0
      }
      const defVal = parseInt(propData['default'] || '0')
      return !isNaN(defVal) ? defVal : 0
    }
    const allPfp4Places = allPlaces.filter(place => {
      const propData = place.pfp4_proposition
      if (!propData) return false
      const capacity = getCapacity(propData)
      if (isNaN(capacity) || capacity < 1) return false
      const assignedCount = pfp4AssignCountByPlace.get(place.PlaceId) || 0
      if (assignedCount >= capacity) return false
      return true
    }).map(place => {
      const capacity = getCapacity(place.pfp4_proposition)
      const assignedCount = pfp4AssignCountByPlace.get(place.PlaceId) || 0
      return {
        PlaceId: place.PlaceId,
        NomPlace: place.NomPlace,
        InstitutionId: place.InstitutionId,
        InstitutionName: place.InstitutionName || '',
        Capacity: capacity,
        RemainingSeats: capacity - assignedCount,
        MSQ: !!place.MSQ, SYSINT: !!place.SYSINT, NEUROGER: !!place.NEUROGER,
        AIGU: !!place.AIGU, REHAB: !!place.REHAB, AMBU: !!place.AMBU,
        FR: !!place.FR, DE: !!place.DE,
        criteria: CRITERIA_KEYS.filter(c => !!place[c])
      }
    })
    const excludedFullPlaces = allPlaces.filter(p => {
      const propData = p.pfp4_proposition
      if (!propData) return false
      const cap = getCapacity(propData)
      const assigned = pfp4AssignCountByPlace.get(p.PlaceId) || 0
      return cap >= 1 && assigned >= cap
    })
    console.log(`   Places PFP4 (pfp4_proposition): ${allPfp4Places.length} disponibles (${excludedFullPlaces.length} pleines exclues)`)
    excludedFullPlaces.forEach(p => console.log(`   ❌ Pleine: ${p.NomPlace} (${p.InstitutionName}) — ${pfp4AssignCountByPlace.get(p.PlaceId)}/${getCapacity(p.pfp4_proposition)} assignées`))
    console.log(`   Places DE: ${allPfp4Places.filter(p => p.DE).length}, Places SYSINT: ${allPfp4Places.filter(p => p.SYSINT).length}`)
    console.log('══════════════════════════════════════════════')

    // ── 7. Appliquer les règles de filtrage PFP4 ──
    const proposals = []
    for (const student of classStudents) {
      const userId = student.id
      const studentCrit = criteriaMap.get(userId)
      const scores = studentCrit ? { ...studentCrit.scores } : Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0]))
      const missingCriteria = CRITERIA_KEYS.filter(c => scores[c] === 0)
      const missingDE = missingCriteria.includes('DE')
      const missingSYSINT = missingCriteria.includes('SYSINT')
      const otherMissing = missingCriteria.filter(c => c !== 'DE' && c !== 'SYSINT')

      const studentAssignedPlaces = assignedPlacesMap.get(userId) || new Set()

      // Helper : compte combien de critères manquants une place couvre
      const countMissingCovered = (place, missing) => missing.filter(c => place[c]).length

      let proposedPlaces = []
      let appliedRule = ''
      const MIN_PLACES = 5

      // Toutes les places disponibles (non assignées à cet étudiant)
      const availablePlaces = allPfp4Places.filter(p => !studentAssignedPlaces.has(p.PlaceId))
      const excludedCount = allPfp4Places.length - availablePlaces.length

      if (missingDE) {
        // ═══ DE MANQUANT : UNIQUEMENT PLACES DE (obligatoire pour diplôme) ═══
        // Toutes les places DE disponibles, triées par nb de critères manquants couverts
        proposedPlaces = availablePlaces
          .filter(p => p.DE)
          .sort((a, b) => countMissingCovered(b, missingCriteria) - countMissingCovered(a, missingCriteria))
        appliedRule = 'DE_MISSING'
        // Pas de minimum 5 pour DE : on ne propose JAMAIS de places FR

      } else if (missingCriteria.length > 0) {
        // ═══ DE OK, CRITÈRES MANQUANTS : maximiser la couverture ═══
        // Prendre toutes les places qui couvrent au moins 1 critère manquant
        proposedPlaces = availablePlaces
          .filter(p => missingCriteria.some(c => p[c]))
          .sort((a, b) => countMissingCovered(b, missingCriteria) - countMissingCovered(a, missingCriteria))
        appliedRule = missingSYSINT ? (otherMissing.length > 0 ? 'SYSINT_AND_OTHER' : 'SYSINT_ONLY') : 'OTHER_MISSING'

        // Minimum 5 places : élargir si nécessaire
        if (proposedPlaces.length < MIN_PLACES) {
          const currentIds = new Set(proposedPlaces.map(p => p.PlaceId))
          const rest = availablePlaces.filter(p => !currentIds.has(p.PlaceId))
          // D'abord ajouter des places SYSINT (critère le moins important)
          const sysintPlaces = rest.filter(p => p.SYSINT)
          proposedPlaces.push(...sysintPlaces)
          appliedRule += '_WIDENED'
        }

        if (proposedPlaces.length < MIN_PLACES) {
          const currentIds = new Set(proposedPlaces.map(p => p.PlaceId))
          const rest = availablePlaces.filter(p => !currentIds.has(p.PlaceId))
          const needed = MIN_PLACES - proposedPlaces.length
          proposedPlaces.push(...rest.slice(0, needed))
        }

      } else {
        // ═══ TOUT VALIDÉ : toutes les places ═══
        proposedPlaces = [...availablePlaces]
        appliedRule = 'ALL_COMPLETE'
      }

      const displayNom = student.Nom || student.nom || student.family_name || 'Nom non disponible'
      const displayPrenom = student.Prenom || student.prenom || student.forname || 'Prénom non disponible'
      const isGhost = displayNom === 'Nom non disponible'
      console.log(`👤 ${displayNom} ${displayPrenom}${isGhost ? ` [GHOST user_id=${userId}]` : ''} | scores=${JSON.stringify(scores)} | manquants=[${missingCriteria.join(',')}] | règle=${appliedRule} | ${proposedPlaces.length} places${excludedCount > 0 ? ` (-${excludedCount} déjà assignées)` : ''}${!studentCrit ? ' ⚠️ PAS DE CRITÈRES TROUVÉS' : ''}`)

      proposals.push({
        userId,
        nom: student.Nom || student.family_name || '',
        prenom: student.Prenom || student.forname || '',
        email: student.Email || student.email || '',
        classe,
        scores,
        missingCriteria,
        appliedRule,
        sae: studentCrit?.sae || false,
        casParticulier: studentCrit?.casParticulier || false,
        proposedPlaceIds: proposedPlaces.map(p => p.PlaceId),
        proposedPlacesCount: proposedPlaces.length,
        proposedPlaces: proposedPlaces.map(p => ({
          PlaceId: p.PlaceId, NomPlace: p.NomPlace, InstitutionName: p.InstitutionName,
          Capacity: p.Capacity, criteria: p.criteria
        }))
      })
    }

    // ── 8. Places orphelines : jamais proposées à aucun étudiant ──
    // Ces places ont été sélectionnées dans l'offre (pfp4_proposition) mais ne matchent
    // les critères manquants de personne. On les ajoute aux étudiants ALL_COMPLETE,
    // ou à TOUS les étudiants s'il n'y a aucun ALL_COMPLETE.
    const allProposedPlaceIds = new Set()
    proposals.forEach(p => (p.proposedPlaceIds || []).forEach(id => allProposedPlaceIds.add(id)))
    const orphanPlaces = allPfp4Places.filter(p => !allProposedPlaceIds.has(p.PlaceId))

    if (orphanPlaces.length > 0) {
      console.log(`🔄 ${orphanPlaces.length} places orphelines (jamais proposées):`)
      orphanPlaces.forEach(p => console.log(`   ${p.NomPlace} (${p.InstitutionName}) critères=[${p.criteria.join(',')}]`))

      const allCompleteStudents = proposals.filter(p => p.appliedRule === 'ALL_COMPLETE')
      const targets = allCompleteStudents.length > 0 ? allCompleteStudents : proposals

      console.log(`   → Ajout aux ${targets.length} étudiants ${allCompleteStudents.length > 0 ? 'ALL_COMPLETE' : '(tous, aucun ALL_COMPLETE)'}`)

      for (const student of targets) {
        const studentAssigned = assignedPlacesMap.get(student.userId) || new Set()
        const currentIds = new Set(student.proposedPlaceIds)
        let added = 0
        for (const op of orphanPlaces) {
          if (!currentIds.has(op.PlaceId) && !studentAssigned.has(op.PlaceId)) {
            student.proposedPlaceIds.push(op.PlaceId)
            student.proposedPlaces.push({
              PlaceId: op.PlaceId, NomPlace: op.NomPlace, InstitutionName: op.InstitutionName,
              Capacity: op.Capacity, criteria: op.criteria
            })
            student.proposedPlacesCount++
            added++
          }
        }
        if (added > 0) console.log(`   +${added} places pour ${student.nom} ${student.prenom}`)
      }
    }

    proposals.sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))

    const ruleStats = {}
    proposals.forEach(p => { ruleStats[p.appliedRule] = (ruleStats[p.appliedRule] || 0) + 1 })

    pfp4Proposals.value = proposals
    pfp4AllPlaces.value = allPfp4Places
    pfp4Stats.value = {
      totalStudents: proposals.length,
      totalPfp4Places: allPfp4Places.length,
      totalCapacity: allPfp4Places.reduce((sum, p) => sum + p.Capacity, 0),
      averageProposedPlaces: proposals.length > 0 ? Math.round(proposals.reduce((sum, p) => sum + p.proposedPlacesCount, 0) / proposals.length) : 0,
      ruleDistribution: ruleStats,
      assignCounts: Object.fromEntries(pfp4AssignCountByPlace)
    }

    console.log('📊 Distribution des règles:', ruleStats)

    toast.add({
      severity: 'success',
      summary: 'Propositions générées',
      detail: `${proposals.length} étudiants traités, moyenne ${pfp4Stats.value.averageProposedPlaces} places/étudiant`,
      life: 5000
    })
  } catch (error) {
    console.error('❌ Erreur génération propositions PFP4:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    pfp4Loading.value = false
  }
}

const savePfp4Proposals = async () => {
  if (pfp4Proposals.value.length === 0) return
  pfp4Loading.value = true
  try {
    await resultatVotationService.savePfp4Proposals(filterYear.value, filterClasse.value, pfp4Proposals.value, pfp4Stats.value.assignCounts)
    pfp4Saved.value = true
    toast.add({
      severity: 'success',
      summary: 'Propositions sauvegardées',
      detail: `${pfp4Proposals.value.length} propositions sauvegardées. Les étudiants verront uniquement leurs places proposées lors du vote.`,
      life: 8000
    })
  } catch (error) {
    console.error('❌ Erreur sauvegarde propositions PFP4:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 5000 })
  } finally {
    pfp4Loading.value = false
  }
}

// ============================================
// EXPORT CSV BILAN PFP4
// ============================================
const exportPfp4BilanCSV = () => {
  const BOM = '\uFEFF'
  const sep = ';'
  
  // --- Feuille 1: Étudiants BA23 ---
  let csvEtudiants = BOM + ['Nom', 'Prénom', 'Email', 'Assigné PFP4', 'Place assignée', 'Institution', 'Rang', 'Nb propositions', 'Statut'].join(sep) + '\n'
  
  const classe = filterClasse.value
  const allClassStudents = allStudents.value
  const assignedIds = new Set()
  const assignmentMap = new Map()
  votationsList.value.forEach(v => {
    if (v.assignedPlaceId) {
      assignedIds.add(v.userId)
      assignmentMap.set(v.userId, v)
    }
  })
  // Also check pfp4Proposals for assigned info
  pfp4Proposals.value.forEach(p => {
    if (!assignmentMap.has(p.userId)) {
      // student in proposals but maybe assigned
    }
  })
  
  const manualExcluded = new Set(excludedStudentIds.value)
  const proposalMap = new Map()
  pfp4Proposals.value.forEach(p => {
    proposalMap.set(p.userId, p)
  })
  
  const sortedStudents = [...allClassStudents].sort((a, b) => 
    ((a.Nom || a.nom || '').toUpperCase()).localeCompare((b.Nom || b.nom || '').toUpperCase())
  )
  
  let countAssigned = 0, countExcludedManual = 0, countEligible = 0
  
  sortedStudents.forEach(s => {
    const uid = s.id || s.user_id
    const nom = (s.Nom || s.nom || s.family_name || '').replace(/;/g, ',')
    const prenom = (s.Prenom || s.prenom || s.forname || '').replace(/;/g, ',')
    const email = (s.Mail || s.email || '').replace(/;/g, ',')
    
    const votation = votationsList.value.find(v => v.userId === uid)
    const isAssigned = votation && votation.assignedPlaceId
    const proposal = proposalMap.get(uid)
    
    let statut = 'Éligible votation'
    let placeName = '', instName = '', rank = '', nbProposals = ''
    
    if (isAssigned) {
      statut = 'Assigné PFP4'
      placeName = (votation.assignedPlaceName || '').replace(/;/g, ',')
      instName = (votation.assignedInstitutionName || '').replace(/;/g, ',')
      rank = votation.assignedRank || ''
      countAssigned++
    } else if (manualExcluded.has(uid)) {
      statut = 'Exclu manuellement'
      countExcludedManual++
    } else {
      countEligible++
      if (proposal) {
        nbProposals = proposal.places?.length || proposal.placeIds?.length || ''
      }
    }
    
    csvEtudiants += [nom, prenom, email, isAssigned ? 'OUI' : 'NON', placeName, instName, rank, nbProposals, statut].join(sep) + '\n'
  })
  
  csvEtudiants += '\n'
  csvEtudiants += ['TOTAL ' + classe, sortedStudents.length].join(sep) + '\n'
  csvEtudiants += ['Assignés PFP4', countAssigned].join(sep) + '\n'
  csvEtudiants += ['Exclus manuellement', countExcludedManual].join(sep) + '\n'
  csvEtudiants += ['Éligibles votation', countEligible].join(sep) + '\n'
  
  // --- Feuille 2: Places PFP4 ---
  let csvPlaces = BOM + ['Place', 'Institution', 'Capacité 2026', 'Sièges pris', 'Sièges restants', 'Statut', 'MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'].join(sep) + '\n'
  
  const institutionsStore2 = useInstitutionsStore()
  const instMap = new Map()
  if (institutionsStore2.institutions) {
    institutionsStore2.institutions.forEach(i => instMap.set(i.InstitutionId, i.Name))
  }
  
  // Count assignments per place from votationsList
  const placeAssignCounts = new Map()
  votationsList.value.forEach(v => {
    if (v.assignedPlaceId) {
      placeAssignCounts.set(v.assignedPlaceId, (placeAssignCounts.get(v.assignedPlaceId) || 0) + 1)
    }
  })
  
  const getExportCapacity = (propData) => {
    if (!propData || typeof propData !== 'object') return 0
    const yr = filterYear.value
    if (propData.hasOwnProperty(yr) && propData[yr] !== '' && propData[yr] !== null && propData[yr] !== undefined) {
      return parseInt(propData[yr]) || 0
    }
    const defVal = parseInt(propData['default'] || '0')
    return !isNaN(defVal) ? defVal : 0
  }
  const pfp4PlacesList = placesStore.places
    .filter(p => p.pfp4_proposition && getExportCapacity(p.pfp4_proposition) > 0)
    .sort((a, b) => (instMap.get(a.InstitutionId) || '').localeCompare(instMap.get(b.InstitutionId) || ''))
  
  let totalCap = 0, totalUsed = 0, totalLeft = 0, placesFull = 0, placesOpen = 0
  const boolStr = (v) => v === true || v === 'true' || v === 1 || v === '1' ? 'X' : ''
  
  pfp4PlacesList.forEach(p => {
    const cap = getExportCapacity(p.pfp4_proposition)
    const used = placeAssignCounts.get(p.PlaceId) || 0
    const remaining = Math.max(0, cap - used)
    totalCap += cap
    totalUsed += used
    totalLeft += remaining
    if (remaining > 0) placesOpen++
    else placesFull++
    
    const nom = (p.NomPlace || '').replace(/;/g, ',')
    const inst = (instMap.get(p.InstitutionId) || 'N/A').replace(/;/g, ',')
    const statut = remaining > 0 ? 'Disponible' : 'PLEINE'
    
    csvPlaces += [nom, inst, cap, used, remaining, statut, boolStr(p.MSQ), boolStr(p.SYSINT), boolStr(p.NEUROGER), boolStr(p.AIGU), boolStr(p.REHAB), boolStr(p.AMBU), boolStr(p.FR), boolStr(p.DE)].join(sep) + '\n'
  })
  
  csvPlaces += '\n'
  csvPlaces += ['TOTAL', '', totalCap, totalUsed, totalLeft].join(sep) + '\n'
  csvPlaces += ['Places pleines', '', placesFull].join(sep) + '\n'
  csvPlaces += ['Places disponibles', '', placesOpen].join(sep) + '\n'
  
  // --- Feuille 3: Bilan ---
  let csvBilan = BOM + ['Métrique', 'Valeur'].join(sep) + '\n'
  csvBilan += ['Classe', classe].join(sep) + '\n'
  csvBilan += ['Année', filterYear.value].join(sep) + '\n'
  csvBilan += ['Date export', new Date().toLocaleString('fr-CH')].join(sep) + '\n'
  csvBilan += '\n'
  csvBilan += ['Étudiants total', sortedStudents.length].join(sep) + '\n'
  csvBilan += ['Déjà assignés PFP4', countAssigned].join(sep) + '\n'
  csvBilan += ['Exclus manuellement', countExcludedManual].join(sep) + '\n'
  csvBilan += ['Éligibles votation', countEligible].join(sep) + '\n'
  csvBilan += '\n'
  csvBilan += ['Places PFP4 totales', pfp4PlacesList.length].join(sep) + '\n'
  csvBilan += ['Sièges totaux', totalCap].join(sep) + '\n'
  csvBilan += ['Sièges pris', totalUsed].join(sep) + '\n'
  csvBilan += ['Sièges restants', totalLeft].join(sep) + '\n'
  csvBilan += ['Places pleines', placesFull].join(sep) + '\n'
  csvBilan += ['Places disponibles', placesOpen].join(sep) + '\n'
  csvBilan += '\n'
  csvBilan += ['Ratio', `${countEligible} étudiants / ${totalLeft} sièges`].join(sep) + '\n'
  csvBilan += ['Marge', totalLeft >= countEligible ? `+${totalLeft - countEligible} sièges` : `DEFICIT ${countEligible - totalLeft} sièges!`].join(sep) + '\n'
  
  // --- Feuille 4: Détail propositions par étudiant ---
  let csvPropositions = BOM + ['Nom', 'Prénom', 'Règle', 'Critères manquants', 'Place', 'Institution', 'Capacité', 'MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE'].join(sep) + '\n'
  
  const sortedProposals = [...pfp4Proposals.value].sort((a, b) => 
    (a.nom || '').toUpperCase().localeCompare((b.nom || '').toUpperCase())
  )
  
  sortedProposals.forEach(p => {
    const nom = (p.nom || '').replace(/;/g, ',')
    const prenom = (p.prenom || '').replace(/;/g, ',')
    const regle = p.appliedRule || ''
    const manquants = (p.missingCriteria || []).join(', ')
    
    if (p.proposedPlaces && p.proposedPlaces.length > 0) {
      p.proposedPlaces.forEach(place => {
        const placeName = (place.NomPlace || '').replace(/;/g, ',')
        const instName = (place.InstitutionName || '').replace(/;/g, ',')
        const cap = place.Capacity || ''
        const c = place.criteria || {}
        csvPropositions += [nom, prenom, regle, manquants, placeName, instName, cap, boolStr(c.MSQ), boolStr(c.SYSINT), boolStr(c.NEUROGER), boolStr(c.AIGU), boolStr(c.REHAB), boolStr(c.AMBU), boolStr(c.FR), boolStr(c.DE)].join(sep) + '\n'
      })
    } else {
      csvPropositions += [nom, prenom, regle, manquants, 'AUCUNE PLACE', '', ''].join(sep) + '\n'
    }
  })

  // Download files
  const date = new Date().toISOString().split('T')[0]
  const downloadCSV = (content, filename) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
    URL.revokeObjectURL(link.href)
  }
  
  downloadCSV(csvBilan, `PFP4_Bilan_${classe}_${date}.csv`)
  setTimeout(() => downloadCSV(csvEtudiants, `PFP4_Etudiants_${classe}_${date}.csv`), 200)
  setTimeout(() => downloadCSV(csvPlaces, `PFP4_Places_${date}.csv`), 400)
  setTimeout(() => downloadCSV(csvPropositions, `PFP4_Propositions_${classe}_${date}.csv`), 600)
  
  toast.add({ severity: 'success', summary: 'Export CSV', detail: '4 fichiers téléchargés', life: 3000 })
}

// ============================================
// CONFIGURATION DYNAMIQUE - TOUTES LES CLASSES
// ============================================
// 3 années d'études :
//   1ère année → PFP1A, PFP1B
//   2ème année → PFP2
//   3ème année → PFP3, PFP4
// Les classes BA changent chaque année : BA{année d'entrée}
// Ex: en 2025-2026 → 1ère=BA25, 2ème=BA24, 3ème=BA23
//     en 2026-2027 → 1ère=BA26, 2ème=BA25, 3ème=BA24

const currentAcademicYear = new Date().getMonth() >= 8
  ? new Date().getFullYear()   // Sept-Déc → année en cours
  : new Date().getFullYear() - 1 // Jan-Août → année précédente

const academicYearShort = currentAcademicYear % 100 // ex: 25

const buildPfpConfig = () => {
  const ba1 = `BA${academicYearShort}`      // 1ère année
  const ba2 = `BA${academicYearShort - 1}`  // 2ème année
  const ba3 = `BA${academicYearShort - 2}`  // 3ème année
  const pfpYear = `${currentAcademicYear + 1}` // ex: '2026' pour 2025-2026

  return {
    [ba1]: { label: `${ba1} (1ère année)`, pfps: ['PFP1A', 'PFP1B'], years: [pfpYear] },
    [ba2]: { label: `${ba2} (2ème année)`, pfps: ['PFP2'], years: [pfpYear] },
    [ba3]: { label: `${ba3} (3ème année)`, pfps: ['PFP3', 'PFP4'], years: [pfpYear] }
  }
}

const PFP_CONFIG = buildPfpConfig()

const pfpColorMap = {
  PFP1A: '#8B5CF6',
  PFP1B: '#06B6D4',
  PFP2: '#6366F1',
  PFP3: '#EC4899',
  PFP4: '#F59E0B'
}

const classeOptions = Object.keys(PFP_CONFIG).map(key => ({
  label: PFP_CONFIG[key].label,
  value: key
}))

const activeConfig = computed(() => {
  if (!filterClasse.value) return null
  return PFP_CONFIG[filterClasse.value] || null
})

const pfpTypes = computed(() => {
  if (!activeConfig.value) return []
  return activeConfig.value.pfps.map(p => ({ label: p, value: p }))
})

const years = computed(() => {
  if (!activeConfig.value) return []
  return activeConfig.value.years
})

const stats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  incomplete: 0
})

// Computed property pour vérifier si on peut afficher les résultats
const canShowResults = computed(() => {
  return filterClasse.value && filterYear.value && filterPFP.value
})

// Computed: places validées pour le PFP/année sélectionnés
const computedValidatedPlaces = computed(() => {
  if (!filterPFP.value || !filterYear.value) return []
  return validatedPlaces.value
})

// Watcher: quand la classe change, reset PFP et année, auto-sélectionner si un seul choix
watch(filterClasse, (newVal) => {
  filterPFP.value = null
  filterYear.value = null
  algorithmResults.value = []
  algorithmStats.value = null
  placesWithAssignments.value = []
  votationsList.value = []
  validatedPlaces.value = []
  excludedStudentIds.value = []

  if (newVal && PFP_CONFIG[newVal]) {
    const config = PFP_CONFIG[newVal]
    // Auto-sélectionner l'année si une seule
    if (config.years.length === 1) {
      filterYear.value = config.years[0]
    }
    // Auto-sélectionner le PFP si un seul
    if (config.pfps.length === 1) {
      filterPFP.value = config.pfps[0]
    }
  }
})

// Watcher: quand PFP ou année change, charger les places validées, la session et les données
watch([filterPFP, filterYear], async ([pfp, year]) => {
  if (pfp && year && filterClasse.value) {
    await loadCurrentSession()
    await loadValidatedPlaces()
    await loadData()
  }
})

// Computed property pour filtrer les votations
const filteredVotationsList = computed(() => {
  // Si année et PFP ne sont pas sélectionnés, ne rien afficher
  if (!canShowResults.value) {
    return []
  }

  let filtered = votationsList.value

  // Filtre OBLIGATOIRE: uniquement les votations avec des choix (nbChoix > 0)
  filtered = filtered.filter(v => v.nbChoix > 0)

  // Filtre par PFP (obligatoire)
  filtered = filtered.filter(v => v.pfpType === filterPFP.value)

  // Filtre par année (obligatoire)
  filtered = filtered.filter(v => v.year === filterYear.value)

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(v => 
      v.nom.toLowerCase().includes(query) ||
      v.prenom.toLowerCase().includes(query) ||
      v.classe.toLowerCase().includes(query)
    )
  }

  return filtered
})

// Computed property pour filtrer les places par PFP sélectionné en haut
const filteredPlacesByPFP = computed(() => {
  if (!filterPFP.value) {
    return placesWithStats.value
  }
  
  return placesWithStats.value.filter(place => {
    const hasVotesForPFP = allVotes.value.some(vote => {
      if (vote.pfp_type !== filterPFP.value) return false
      
      let choices = []
      if (typeof vote.choices === 'string') {
        try {
          choices = JSON.parse(vote.choices)
        } catch (e) {
          return false
        }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      
      return choices.some(choice => choice.placeId === place.PlaceId)
    })
    
    return hasVotesForPFP
  })
})

const getStatusSeverity = (status) => {
  const severities = {
    'Complet': 'success',
    'Incomplet': 'warning',
    'Non voté': 'danger'
  }
  return severities[status] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sortAlphabetically = () => {
  votationsList.value.sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
    const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })
}

const startAlgorithm = async () => {
  if (!canShowResults.value) {
    toast.add({
      severity: 'warning',
      summary: 'Sélection incomplète',
      detail: 'Veuillez sélectionner une année et un PFP',
      life: 3000
    })
    return
  }

  if (filteredVotationsList.value.length === 0) {
    toast.add({
      severity: 'warning',
      summary: 'Aucun étudiant',
      detail: 'Aucun étudiant avec des choix à traiter',
      life: 3000
    })
    return
  }

  loading.value = true

  try {
    console.log('🚀 Démarrage de l\'algorithme d\'attribution')
    console.log('Configuration:', {
      year: filterYear.value,
      pfp: filterPFP.value,
      studentsCount: filteredVotationsList.value.length
    })

    toast.add({
      severity: 'info',
      summary: 'Algorithme en cours',
      detail: `Traitement de ${filteredVotationsList.value.length} étudiants ${filterClasse.value}...`,
      life: 5000
    })

    // ══════════════════════════════════════════════════════════════════
    // PRIORITY SCORE v2.0 — Calcul basé sur critères métier
    // Sources: StudentsPhysio.pfp_valided + student_result_vote (stages validés)
    // ══════════════════════════════════════════════════════════════════

    // Source 1: StudentsPhysio.pfp_valided
    const { data: physioData } = await supabase
      .from('StudentsPhysio')
      .select('user_id, pfp_valided, sae, cas_particulier')

    // Source 2: student_result_vote (stages validés = pfp_validee true)
    const { data: validatedAssignments } = await supabase
      .from('student_result_vote')
      .select('user_id, pfp_type, assigned_place_id, pfp_validee')

    // Charger les places pour résoudre les critères des stages validés
    await placesStore.fetchPlaces()
    const placesLookupForScore = new Map()
    placesStore.places.forEach(p => placesLookupForScore.set(p.PlaceId, p))

    // Construire un map userId → critères validés (fusion des 2 sources)
    const studentCriteriaMap = new Map()

    // Source 1: pfp_valided
    if (physioData) {
      physioData.forEach(physio => {
        const validatedCriteria = { MSQ: 0, SYSINT: 0, NEUROGER: 0, AIGU: 0, REHAB: 0, AMBU: 0, FR: 0, DE: 0 }
        let pfpArray = []
        if (physio.pfp_valided) {
          try {
            pfpArray = typeof physio.pfp_valided === 'string' ? JSON.parse(physio.pfp_valided) : physio.pfp_valided
            if (!Array.isArray(pfpArray)) pfpArray = Object.values(pfpArray)
          } catch (e) { pfpArray = [] }
        }
        pfpArray.forEach(stage => {
          CRITERIA_KEYS.forEach(c => {
            if (stage[c] === true || stage[c] === 'true' || stage[c] === 1 || stage[c.toLowerCase()] === true) {
              validatedCriteria[c]++
            }
          })
        })
        studentCriteriaMap.set(physio.user_id, {
          criteria: validatedCriteria,
          sae: !!physio.sae,
          casParticulier: !!physio.cas_particulier,
          stagesCount: pfpArray.length
        })
      })
    }

    // Source 2: enrichir avec student_result_vote (stages validés)
    if (validatedAssignments) {
      validatedAssignments.forEach(a => {
        if (a.pfp_validee && a.assigned_place_id) {
          const placeInfo = placesLookupForScore.get(a.assigned_place_id)
          if (placeInfo) {
            const existing = studentCriteriaMap.get(a.user_id) || {
              criteria: Object.fromEntries(CRITERIA_KEYS.map(k => [k, 0])),
              sae: false, casParticulier: false, stagesCount: 0
            }
            CRITERIA_KEYS.forEach(c => {
              if (placeInfo[c] === true || placeInfo[c] === 'true' || placeInfo[c] === 1) {
                existing.criteria[c]++
              }
            })
            studentCriteriaMap.set(a.user_id, existing)
          }
        }
      })
    }

    console.log(`📊 Critères chargés pour ${studentCriteriaMap.size} étudiants (pfp_valided + student_result_vote)`)

    // ══════════════════════════════════════════════════════════════════
    // computePriorityScore v2.0
    //
    // Barème (max ~100 pts):
    //   A. Critères manquants globaux   : (missingCount / 8) * 40    → 0–40 pts
    //   B. Critères critiques manquants  : DE manquant +15, SYSINT +10 → 0–25 pts
    //   C. Bonus SAE                     : +12 pts
    //   D. Bonus cas particulier         : +8 pts
    //   E. Pondération PFP               : PFP4 ×1.15, PFP3 ×1.05    → multiplicateur
    //   F. Tiebreaker aléatoire          : 0–1 pt (départager ex-aequo)
    //
    // Principe: plus le score est élevé, plus l'étudiant est prioritaire.
    // Un étudiant avec beaucoup de critères manquants et SAE sera traité en premier.
    // ══════════════════════════════════════════════════════════════════
    const currentPfp = filterPFP.value // PFP1, PFP2, PFP3, PFP4

    const computePriorityScore = (userId) => {
      const profile = studentCriteriaMap.get(userId)
      if (!profile) {
        console.warn(`   ⚠️ Pas de profil pour ${userId} → score minimal`)
        return Math.round(Math.random() * 100) / 100 // 0-1 pt uniquement
      }

      // A. Critères manquants globaux (0-40 pts)
      const missingCriteria = CRITERIA_KEYS.filter(c => profile.criteria[c] === 0)
      const missingCount = missingCriteria.length
      const missingGlobalScore = (missingCount / CRITERIA_KEYS.length) * 40

      // B. Bonus critères critiques (DE = très rare/obligatoire, SYSINT = rare)
      const bonusDE = profile.criteria.DE === 0 ? 15 : 0
      const bonusSYSINT = profile.criteria.SYSINT === 0 ? 10 : 0

      // C. Bonus SAE (situation d'apprentissage exceptionnelle)
      const bonusSae = profile.sae ? 12 : 0

      // D. Bonus cas particulier
      const bonusCas = profile.casParticulier ? 8 : 0

      // E. Multiplicateur PFP (derniers PFP = dernière chance pour compléter les critères)
      let pfpMultiplier = 1.0
      if (currentPfp === 'PFP4') pfpMultiplier = 1.15
      else if (currentPfp === 'PFP3') pfpMultiplier = 1.05

      // F. Tiebreaker aléatoire (très faible, juste pour départager les vrais ex-aequo)
      const tiebreaker = Math.random() * 1

      const rawScore = missingGlobalScore + bonusDE + bonusSYSINT + bonusSae + bonusCas + tiebreaker
      const finalScore = Math.round(rawScore * pfpMultiplier * 100) / 100

      return finalScore
    }

    // ── Exclure les étudiants déjà assignés en PFP4 et ceux exclus manuellement ──
    const { data: existingPfp4Assignments } = await supabase
      .from('student_result_vote')
      .select('user_id, assigned_place_id')
      .eq('pfp_type', filterPFP.value)
    
    const alreadyAssignedUserIds = new Set()
    const alreadyAssignedPlaceCounts = new Map()
    if (existingPfp4Assignments) {
      existingPfp4Assignments.forEach(a => {
        if (a.assigned_place_id) {
          alreadyAssignedUserIds.add(a.user_id)
          alreadyAssignedPlaceCounts.set(a.assigned_place_id, (alreadyAssignedPlaceCounts.get(a.assigned_place_id) || 0) + 1)
        }
      })
    }
    const manualExclusions = new Set(excludedStudentIds.value || [])

    const eligibleVotations = filteredVotationsList.value.filter(student => {
      if (alreadyAssignedUserIds.has(student.userId)) {
        console.log(`   ❌ Exclu (déjà assigné ${filterPFP.value}): ${student.nom} ${student.prenom}`)
        return false
      }
      if (manualExclusions.has(student.userId)) {
        console.log(`   ❌ Exclu (manuellement): ${student.nom} ${student.prenom}`)
        return false
      }
      return true
    })

    console.log(`📊 ${filteredVotationsList.value.length} votants → ${eligibleVotations.length} éligibles (${filteredVotationsList.value.length - eligibleVotations.length} exclus)`)

    if (eligibleVotations.length === 0) {
      toast.add({ severity: 'warn', summary: 'Aucun étudiant éligible', detail: 'Tous les étudiants sont déjà assignés ou exclus', life: 5000 })
      loading.value = false
      return
    }

    // Préparer les données des étudiants pour l'algorithme
    const studentsData = eligibleVotations.map(student => {
      const profile = studentCriteriaMap.get(student.userId)
      const score = computePriorityScore(student.userId)
      return {
        userId: student.userId,
        nom: student.nom,
        prenom: student.prenom,
        classe: student.classe,
        choices: [
          student.choice1PlaceId && { placeId: student.choice1PlaceId, rank: 1 },
          student.choice2PlaceId && { placeId: student.choice2PlaceId, rank: 2 },
          student.choice3PlaceId && { placeId: student.choice3PlaceId, rank: 3 },
          student.choice4PlaceId && { placeId: student.choice4PlaceId, rank: 4 },
          student.choice5PlaceId && { placeId: student.choice5PlaceId, rank: 5 }
        ].filter(Boolean),
        priorityScore: score,
        _debug: profile ? {
          missing: CRITERIA_KEYS.filter(c => profile.criteria[c] === 0),
          validated: CRITERIA_KEYS.filter(c => profile.criteria[c] > 0),
          sae: profile.sae,
          casParticulier: profile.casParticulier
        } : null
      }
    })

    // Log détaillé du breakdown des scores (trié par score descendant)
    const sortedForLog = [...studentsData].sort((a, b) => b.priorityScore - a.priorityScore)
    console.log('══════════════════════════════════════════════')
    console.log(`📊 PRIORITY SCORES v2.0 — ${currentPfp} ${filterYear.value} (×${currentPfp === 'PFP4' ? '1.15' : currentPfp === 'PFP3' ? '1.05' : '1.0'})`)
    console.log('══════════════════════════════════════════════')
    sortedForLog.forEach((s, i) => {
      const d = s._debug
      if (d) {
        console.log(`   ${i + 1}. ${s.nom} ${s.prenom}: ${s.priorityScore} pts | manquants=[${d.missing.join(',')}] validés=[${d.validated.join(',')}]${d.sae ? ' SAE' : ''}${d.casParticulier ? ' CAS_PART' : ''}`)
      } else {
        console.log(`   ${i + 1}. ${s.nom} ${s.prenom}: ${s.priorityScore} pts | ⚠️ PAS DE PROFIL`)
      }
    })
    console.log('══════════════════════════════════════════════')

    // Récupérer toutes les places disponibles
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()

    const institutionMap = new Map()
    institutionsStore.institutions.forEach(inst => {
      institutionMap.set(inst.InstitutionId, inst)
    })

    // 🎯 Filtrer les places selon le PFP sélectionné, en réduisant la capacité par les assignations existantes
    const placesData = placesStore.places
      .map(place => {
        const institution = institutionMap.get(place.InstitutionId)
        
        // Récupérer la capacité pour ce PFP et cette année
        let capacity = 0
        if (place[filterPFP.value] && place[filterPFP.value][filterYear.value]) {
          capacity = parseInt(place[filterPFP.value][filterYear.value])
        }
        
        // Si pas de capacité définie, ignorer cette place
        if (!capacity || isNaN(capacity) || capacity < 1) {
          return null
        }

        // Réduire la capacité par le nombre d'étudiants déjà assignés à cette place
        const alreadyAssigned = alreadyAssignedPlaceCounts.get(place.PlaceId) || 0
        const remainingCapacity = capacity - alreadyAssigned
        if (remainingCapacity < 1) {
          console.log(`   ❌ Place pleine: ${place.NomPlace} (${alreadyAssigned}/${capacity} assignés)`)
          return null
        }
        
        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionId: place.InstitutionId,
          InstitutionName: institution?.Name || 'Inconnu',
          Capacity: remainingCapacity
        }
      })
      .filter(Boolean) // Retirer les null

    console.log('📊 Données préparées:', {
      students: studentsData.length,
      places: placesData.length
    })

    // Lancer l'algorithme via le backend
    const result = await resultatVotationService.runAlgorithm(
      filterPFP.value,
      filterYear.value,
      studentsData,
      placesData
    )

    console.log('✅ Résultat de l\'algorithme:', result)

    // Stocker les résultats et statistiques
    algorithmResults.value = result.results || []
    algorithmStats.value = result.stats || {}
    placesWithAssignments.value = result.placesWithAssignments || []

    // Afficher les statistiques
    const stats = result.stats || {}
    toast.add({
      severity: 'success',
      summary: 'Algorithme terminé',
      detail: `${stats.successfulAssignments || 0} attributions réussies sur ${stats.totalStudents || 0} étudiants`,
      life: 8000
    })

    // Afficher les détails
    if (stats.firstChoiceCount > 0 || stats.secondChoiceCount > 0 || stats.thirdChoiceCount > 0) {
      toast.add({
        severity: 'info',
        summary: 'Répartition des choix',
        detail: `1er choix: ${stats.firstChoiceCount || 0} | 2e choix: ${stats.secondChoiceCount || 0} | 3e choix: ${stats.thirdChoiceCount || 0}`,
        life: 8000
      })
    }

    // Afficher les erreurs éventuelles
    if (result.errors && result.errors.length > 0) {
      toast.add({
        severity: 'warn',
        summary: 'Avertissements',
        detail: `${result.errors.length} étudiants n'ont pas pu être attribués`,
        life: 5000
      })
    }

    // Recharger les données pour afficher les résultats
    await loadData()

  } catch (error) {
    console.error('❌ Erreur lors de l\'exécution de l\'algorithme:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exécuter l\'algorithme: ' + error.message,
      life: 8000
    })
  } finally {
    loading.value = false
  }
}

const getStudentName = (userId) => {
  const student = allStudents.value.find(s => s.user_id === userId || s.id === userId)
  if (student) {
    // 1. Essayer display_name
    if (student.display_name) return student.display_name
    
    // 2. Essayer Nom + Prenom (format: NOM Prénom)
    const nom = student.Nom || student.nom || student.family_name || ''
    const prenom = student.Prenom || student.prenom || student.forname || ''
    
    if (nom || prenom) {
      // Format: NOM Prénom (nom en majuscules)
      return `${nom.toUpperCase()} ${prenom}`.trim()
    }
    
    // 3. Fallback sur email
    if (student.email || student.Mail) {
      const email = student.email || student.Mail
      return email.split('@')[0]
    }
  }
  return 'Inconnu'
}

const exportResults = () => {
  if (algorithmResults.value.length === 0) {
    toast.add({
      severity: 'warn',
      summary: 'Aucune donnée',
      detail: 'Pas de résultats à exporter',
      life: 3000
    })
    return
  }

  // Préparer les données CSV
  const headers = ['Étudiant', 'Place Attribuée', 'Institution', 'Rang du Choix', 'Score de Priorité']
  const rows = algorithmResults.value.map(result => [
    getStudentName(result.user_id),
    result.assigned_place_name,
    result.assigned_institution_name,
    result.assigned_rank === 99 ? 'Aléatoire' : `${result.assigned_rank}er choix`,
    result.priority_score ? result.priority_score.toFixed(1) : 'N/A'
  ])

  // Créer le CSV
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  // Télécharger le fichier
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `attributions_${filterPFP.value}_${filterYear.value}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${algorithmResults.value.length} attributions exportées`,
    life: 3000
  })
}

const getVoteCountForPlace = (placeId) => {
  if (!placeId) return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
  
  if (votesAggregation.value[placeId]) {
    return votesAggregation.value[placeId]
  }
  
  return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
}

const loadVoteStatistics = async () => {
  try {
    console.log('📊 Chargement des statistiques de votes...')
    
    // Méthode 1: Essayer d'utiliser la vue d'agrégation
    try {
      const allStats = await votesBackendService.getVotePlaceAggregation()
      
      if (allStats && allStats.length > 0) {
        console.log('✅ Statistiques depuis vue:', allStats.length, 'entrées')
        
        const aggregation = {}
        
        allStats.forEach(agg => {
          const placeId = agg.place_id
          const rank = agg.rank
          const count = agg.vote_count
          
          if (!aggregation[placeId]) {
            aggregation[placeId] = {
              top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
            }
          }
          
          aggregation[placeId][`top${rank}`] = count
          aggregation[placeId].total += count
        })
        
        votesAggregation.value = aggregation
        console.log('✅ Votes agrégés:', Object.keys(aggregation).length, 'places')
        return
      }
    } catch (viewError) {
      console.warn('⚠️ Vue d\'agrégation non disponible:', viewError.message)
    }
    
    // Méthode 2: Calculer manuellement depuis tous les votes
    console.log('📊 Calcul manuel des statistiques depuis les votes...')
    const { data: allVotesData, error: votesError } = await supabase
      .from('student_votes')
      .select('choices')
    
    if (votesError) throw votesError
    
    const aggregation = {}
    
    allVotesData.forEach(vote => {
      let choices = []
      if (typeof vote.choices === 'string') {
        try {
          choices = JSON.parse(vote.choices)
        } catch (e) {
          console.error('Erreur parsing choices pour stats:', e)
          return
        }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      
      if (choices && choices.length > 0) {
        choices.forEach((choice, index) => {
          const placeId = choice.placeId
          const rank = choice.rank || (index + 1)
          
          if (placeId) {
            if (!aggregation[placeId]) {
              aggregation[placeId] = {
                top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
              }
            }
            
            if (rank >= 1 && rank <= 5) {
              aggregation[placeId][`top${rank}`] = (aggregation[placeId][`top${rank}`] || 0) + 1
              aggregation[placeId].total += 1
            }
          }
        })
      }
    })
    
    votesAggregation.value = aggregation
    console.log('✅ Votes agrégés manuellement:', Object.keys(aggregation).length, 'places')
  } catch (error) {
    console.error('❌ Erreur lors du chargement des statistiques:', error)
    votesAggregation.value = {}
  }
}

const buildPlacesWithStats = async () => {
  try {
    console.log('🏥 Construction des statistiques par place...')
    
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()
    
    const places = placesStore.places
    const institutions = institutionsStore.institutions
    
    const institutionMap = new Map()
    institutions.forEach(inst => {
      institutionMap.set(inst.InstitutionId, inst)
    })
    
    const placesStats = []
    
    places.forEach(place => {
      const institution = institutionMap.get(place.InstitutionId)
      
      const voteStats = votesAggregation.value[place.PlaceId] || {
        top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0
      }
      
      placesStats.push({
        PlaceId: place.PlaceId,
        NomPlace: place.NomPlace,
        InstitutionName: institution?.Name || 'Inconnu',
        InstitutionCategory: institution?.Category || 'Non spécifié',
        InstitutionId: place.InstitutionId,
        pfpType: filterPFP.value || 'Tous',
        year: filterYear.value || new Date().getFullYear().toString(),
        votes: voteStats,
        rawPlace: place
      })
    })
    
    placesWithStats.value = placesStats
    console.log(`✅ ${placesStats.length} places avec statistiques`)
  } catch (error) {
    console.error('❌ Erreur lors de la construction des stats par place:', error)
  }
}

const showStudentsForPlace = (place, rank) => {
  console.log('Afficher les étudiants pour:', place, 'rang:', rank)
  
  const studentsForPlace = votationsList.value.filter(v => {
    if (rank === 0) {
      return v.choice1PlaceId === place.PlaceId ||
             v.choice2PlaceId === place.PlaceId ||
             v.choice3PlaceId === place.PlaceId ||
             v.choice4PlaceId === place.PlaceId ||
             v.choice5PlaceId === place.PlaceId
    } else {
      return v[`choice${rank}PlaceId`] === place.PlaceId
    }
  })
  
  const rankText = rank === 0 ? 'tous rangs confondus' : `en top ${rank}`
  const studentNames = studentsForPlace.map(s => `${s.prenom} ${s.nom}`).join(', ')
  
  toast.add({
    severity: 'info',
    summary: `Étudiants pour ${place.NomPlace}`,
    detail: `${studentsForPlace.length} étudiants ont voté (${rankText}): ${studentNames || 'Aucun'}`,
    life: 8000
  })
  
  activeTab.value = 0
  searchQuery.value = ''
}

const loadValidatedPlaces = async () => {
  if (!filterPFP.value || !filterYear.value) return
  try {
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()

    const institutionMap = new Map()
    institutionsStore.institutions.forEach(inst => {
      institutionMap.set(inst.InstitutionId, inst)
    })

    const pfp = filterPFP.value
    const year = filterYear.value

    validatedPlaces.value = placesStore.places
      .map(place => {
        const institution = institutionMap.get(place.InstitutionId)
        let capacity = 0
        if (place[pfp] && place[pfp][year]) {
          capacity = parseInt(place[pfp][year])
        }
        if (!capacity || isNaN(capacity) || capacity < 1) return null

        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionName: institution?.Name || 'Inconnu',
          InstitutionCategory: institution?.Category || '-',
          Capacity: capacity
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.InstitutionName.localeCompare(b.InstitutionName))

    console.log(`✅ ${validatedPlaces.value.length} places validées pour ${pfp} ${year}`)
  } catch (error) {
    console.error('❌ Erreur chargement places validées:', error)
    validatedPlaces.value = []
  }
}

const loadData = async () => {
  if (!filterClasse.value || !filterPFP.value || !filterYear.value) return
  loading.value = true
  const targetClass = filterClasse.value
  const config = PFP_CONFIG[targetClass]
  if (!config) { loading.value = false; return }

  try {
    // 1. Charger les étudiants de la classe sélectionnée
    const allStudentsData = await getAllStudents()
    allStudents.value = allStudentsData.filter(student => {
      const classe = student.Classe || student.classe || student.class || student.Class || ''
      return classe === targetClass
    })
    console.log(`✅ ${allStudents.value.length} étudiants ${targetClass} chargés`)
    
    // 2. Charger les places
    await placesStore.fetchPlaces()
    const placesMap = new Map()
    const fullMap = new Map()
    placesStore.places.forEach(place => {
      placesMap.set(place.PlaceId, place.NomPlace)
      fullMap.set(place.PlaceId, place)
    })
    placesFullMap.value = fullMap

    // 3. Charger les statistiques de votes
    await loadVoteStatistics()

    // 4. Charger tous les votes
    let { data: votes, error: votesError } = await supabase
      .from('student_votes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (votesError) throw votesError
    
    allVotes.value = votes || []

    // 5. Construire la liste des votations
    const votationsMap = new Map()

    allVotes.value.forEach((vote) => {
      const student = allStudents.value.find(s => 
        s.id === vote.user_id || s.user_id === vote.user_id
      )
      
      const studentClasse = student ? (student.Classe || student.classe || student.class || student.Class) : null
      
      if (student && studentClasse === targetClass) {
        let choices = []
        if (typeof vote.choices === 'string') {
          try { choices = JSON.parse(vote.choices) } catch (e) { choices = [] }
        } else if (Array.isArray(vote.choices)) {
          choices = vote.choices
        }
        
        const key = `${vote.user_id}-${vote.pfp_type}-${vote.year}`
        
        const getPlaceName = (choice) => {
          if (!choice) return null
          if (choice.placeName) return choice.placeName
          if (choice.placeId && placesMap.has(choice.placeId)) return placesMap.get(choice.placeId)
          return null
        }
        const getInstitutionName = (choice) => {
          if (!choice) return null
          if (choice.InstitutionName) return choice.InstitutionName
          if (choice.institutionName) return choice.institutionName
          if (choice.placeId && fullMap.has(choice.placeId)) return fullMap.get(choice.placeId).InstitutionName || null
          return null
        }
        
        votationsMap.set(key, {
          id: vote.id,
          userId: vote.user_id,
          nom: student.Nom || student.nom || student.family_name || 'N/A',
          prenom: student.Prenom || student.prenom || student.forname || 'N/A',
          classe: student.Classe || student.classe || student.class || 'N/A',
          pfpType: vote.pfp_type,
          year: vote.year,
          choix1: getPlaceName(choices[0]),
          choix2: getPlaceName(choices[1]),
          choix3: getPlaceName(choices[2]),
          choix4: getPlaceName(choices[3]),
          choix5: getPlaceName(choices[4]),
          choix1Institution: getInstitutionName(choices[0]),
          choix2Institution: getInstitutionName(choices[1]),
          choix3Institution: getInstitutionName(choices[2]),
          choix4Institution: getInstitutionName(choices[3]),
          choix5Institution: getInstitutionName(choices[4]),
          choice1PlaceId: choices[0]?.placeId || null,
          choice2PlaceId: choices[1]?.placeId || null,
          choice3PlaceId: choices[2]?.placeId || null,
          choice4PlaceId: choices[3]?.placeId || null,
          choice5PlaceId: choices[4]?.placeId || null,
          nbChoix: choices.length,
          dateVote: vote.updated_at,
          status: choices.length >= 3 ? 'Complet' : 'Incomplet',
          rawVote: vote,
          rawStudent: student
        })
      }
    })

    // Ajouter les étudiants qui n'ont pas encore voté
    const relevantPFPs = config.pfps
    const relevantYears = config.years

    allStudents.value.forEach(student => {
      relevantPFPs.forEach(pfpType => {
        relevantYears.forEach(year => {
          const key = `${student.id}-${pfpType}-${year}`
          
          if (!votationsMap.has(key)) {
            votationsMap.set(key, {
              id: null,
              userId: student.id || student.user_id,
              nom: student.Nom || student.nom || student.family_name || 'N/A',
              prenom: student.Prenom || student.prenom || student.forname || 'N/A',
              classe: student.Classe || student.classe || student.class || 'N/A',
              pfpType: pfpType,
              year: year,
              choix1: null, choix2: null, choix3: null, choix4: null, choix5: null,
              nbChoix: 0,
              dateVote: null,
              status: 'Non voté',
              rawVote: null,
              rawStudent: student
            })
          }
        })
      })
    })

    votationsList.value = Array.from(votationsMap.values())
    
    sortAlphabetically()
    updateStats()
    await buildPlacesWithStats()

    console.log(`✅ ${votationsList.value.length} votations ${targetClass} créées`)
  } catch (error) {
    console.error('❌ Erreur lors du chargement des données:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données: ' + error.message,
      life: 5000
    })
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const filtered = votationsList.value.filter(v =>
    v.pfpType === filterPFP.value && v.year === filterYear.value
  )
  const total = filtered.length
  const completed = filtered.filter(v => v.status === 'Complet').length
  const incomplete = filtered.filter(v => v.status === 'Incomplet').length
  const notVoted = filtered.filter(v => v.status === 'Non voté').length

  stats.value = {
    total,
    completed,
    pending: notVoted,
    incomplete
  }
}

const viewDetails = (data) => {
  if (!data.rawVote) return
  
  console.log('Détails du vote:', data)
  toast.add({
    severity: 'info',
    summary: 'Détails du vote',
    detail: `${data.prenom} ${data.nom} - ${data.nbChoix} choix`,
    life: 3000
  })
}

const remindStudent = (data) => {
  console.log('Relancer étudiant:', data)
  toast.add({
    severity: 'info',
    summary: 'Relance',
    detail: `Relance envoyée à ${data.prenom} ${data.nom}`,
    life: 3000
  })
}

const remindAllNonVoters = () => {
  const nonVoters = filteredVotationsList.value.filter(v => v.status === 'Non voté')
  
  if (nonVoters.length === 0) {
    toast.add({
      severity: 'info',
      summary: 'Information',
      detail: 'Aucun étudiant à relancer',
      life: 3000
    })
    return
  }

  console.log(`Relancer ${nonVoters.length} étudiants qui n'ont pas voté`)
  toast.add({
    severity: 'success',
    summary: 'Relances envoyées',
    detail: `${nonVoters.length} relances envoyées aux étudiants n'ayant pas voté`,
    life: 5000
  })
}

const exportData = () => {
  try {
    const dataToExport = filteredVotationsList.value

    const headers = [
      'Nom', 'Prénom', 'Classe', 'PFP', 'Année',
      'Choix 1 - Place', 'Choix 1 - Institution', 'Choix 1 - PlaceId',
      'Choix 2 - Place', 'Choix 2 - Institution', 'Choix 2 - PlaceId',
      'Choix 3 - Place', 'Choix 3 - Institution', 'Choix 3 - PlaceId',
      'Choix 4 - Place', 'Choix 4 - Institution', 'Choix 4 - PlaceId',
      'Choix 5 - Place', 'Choix 5 - Institution', 'Choix 5 - PlaceId',
      'Nb Choix', 'Date Vote', 'Statut'
    ]
    const csvContent = [
      headers.join(';'),
      ...dataToExport.map(row => [
        row.nom,
        row.prenom,
        row.classe,
        row.pfpType,
        row.year,
        row.choix1 || '', row.choix1Institution || '', row.choice1PlaceId || '',
        row.choix2 || '', row.choix2Institution || '', row.choice2PlaceId || '',
        row.choix3 || '', row.choix3Institution || '', row.choice3PlaceId || '',
        row.choix4 || '', row.choix4Institution || '', row.choice4PlaceId || '',
        row.choix5 || '', row.choix5Institution || '', row.choice5PlaceId || '',
        row.nbChoix,
        row.dateVote ? formatDate(row.dateVote) : '',
        row.status
      ].join(';'))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `votations_${filterClasse.value || 'pfp'}_${filterPFP.value || ''}_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `${dataToExport.length} lignes exportées`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'exporter les données',
      life: 5000
    })
  }
}

onMounted(() => {
  // Data loads via watchers when class/pfp/year are selected
})
</script>

<style scoped>
.votation-page {
  max-width: 1600px;
  margin: 0 auto;
}

/* Choice badges */
.choice-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.8rem;
  color: white;
  flex-shrink: 0;
}

/* Criteria tags - dark/light mode */
:deep(.criteria-tag.p-tag) {
  background: var(--surface-card) !important;
  color: var(--text-color) !important;
  font-size: 0.65rem !important;
  border: 1px solid var(--primary-color) !important;
  opacity: 0.85;
}

/* Choice cells - dark/light mode adaptive backgrounds */
.choice-cell {
  transition: all 0.2s ease;
  border-radius: 6px;
  background: var(--surface-card);
}

.choice-cell-1 { background: color-mix(in srgb, var(--blue-500) 10%, var(--surface-card)); }
.choice-cell-2 { background: color-mix(in srgb, var(--cyan-500) 10%, var(--surface-card)); }
.choice-cell-3 { background: color-mix(in srgb, var(--orange-500) 10%, var(--surface-card)); }
.choice-cell-4 { background: color-mix(in srgb, var(--purple-500) 10%, var(--surface-card)); }
.choice-cell-5 { background: color-mix(in srgb, var(--pink-500) 10%, var(--surface-card)); }

.choice-cell:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* Cursor pointer for clickable tags */
.cursor-pointer {
  cursor: pointer;
  transition: all 0.15s ease;
}

.cursor-pointer:hover {
  opacity: 0.85;
  transform: scale(1.05);
}

/* ========== TABLE STYLING ========== */

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: var(--surface-ground);
  font-weight: 700;
  color: var(--text-color);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 0.75rem 1rem;
  border-bottom: 2px solid var(--surface-border);
  border-right: 1px solid var(--surface-border);
  white-space: nowrap;
}

:deep(.p-datatable .p-datatable-thead > tr > th:last-child) {
  border-right: none;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: var(--surface-card);
  transition: background 0.15s ease;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: var(--surface-ground);
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: var(--highlight-bg) !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.6rem 1rem;
  border-bottom: 1px solid var(--surface-border);
  border-right: 1px solid var(--surface-border);
  color: var(--text-color);
  font-size: 0.9rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td:last-child) {
  border-right: none;
}

:deep(.p-datatable .p-datatable-wrapper) {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
}

:deep(.p-datatable .p-paginator) {
  background: var(--surface-ground);
  border-top: 1px solid var(--surface-border);
  padding: 0.5rem 1rem;
}

:deep(.p-datatable .p-paginator .p-paginator-current) {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
}

:deep(.p-datatable .p-datatable-header) {
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem;
}

:deep(.p-datatable .p-sortable-column .p-sortable-column-icon) {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

:deep(.p-datatable .p-sortable-column.p-highlight .p-sortable-column-icon) {
  color: var(--primary-color);
}

/* ========== TABVIEW STYLING ========== */

:deep(.p-tabview .p-tabview-nav) {
  background: var(--surface-card);
  border-bottom: 2px solid var(--surface-border);
  padding: 0 1rem;
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  border: none;
  font-weight: 600;
  color: var(--text-color-secondary);
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  transition: color 0.15s ease;
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link:hover) {
  color: var(--primary-color);
}

:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  color: var(--primary-color);
  border-bottom: 3px solid var(--primary-color);
}

:deep(.p-tabview .p-tabview-panels) {
  padding: 1rem;
}

/* ========== RESPONSIVE ========== */

@media (max-width: 768px) {
  .votation-page h1 {
    font-size: 1.25rem;
  }
}
</style>
