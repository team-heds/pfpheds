<template>
  <AdminLayout>
    <Toast />
    <div class="votation-etudiants-page p-4">
      <!-- En-tête avec design moderne -->
      <div class="header-card p-4 border-round mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Formation Pratique - BA25</h1>
              <p class="text-600 m-0 mt-1">Gestion des choix de stages des étudiants BA25 (PFP1A et PFP1B)</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined @click="exportData" />
            <Button icon="pi pi-envelope" label="Relancer non-votants" severity="warning" @click="remindAllNonVoters" />
          </div>
        </div>
      </div>

      <!-- Configuration active -->
      <div class="config-banner p-3 border-round mb-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-calendar text-sm"></i>
          <span class="text-sm font-medium">Configuration active :</span>
          <Tag value="BA25" severity="info" class="text-xs" />
          <span class="text-sm">•</span>
          <Tag v-for="pfp in ACTIVE_CONFIG.activePFPs" :key="pfp" :value="pfp" severity="success" class="text-xs" />
          <span class="text-sm">•</span>
          <Tag v-for="year in ACTIVE_CONFIG.activeYears" :key="year" :value="year" severity="info" class="text-xs" />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="stat-card p-4 border-round">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Total Étudiants BA25</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.completed }}</h3>
                <p class="text-600 m-0">Ont Voté</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-hourglass text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0">En Attente</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.incomplete }}</h3>
                <p class="text-600 m-0">Incomplets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-card p-4 border-round mb-4">
        <div class="flex justify-content-between align-items-center mb-3">
          <span class="text-lg font-semibold">Sélection obligatoire</span>
          <Tag value="Année + PFP requis" severity="warning" />
        </div>
        <div class="grid">
          <div class="col-12 md:col-4">
            <label class="block text-sm font-medium mb-2">Année <span class="text-red-500">*</span></label>
            <Dropdown v-model="filterYear" :options="years" placeholder="Sélectionner une année" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label class="block text-sm font-medium mb-2">PFP <span class="text-red-500">*</span></label>
            <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="Sélectionner un PFP" class="w-full" />
          </div>
          <div class="col-12 md:col-4">
            <label class="block text-sm font-medium mb-2">Recherche</label>
            <InputText v-model="searchQuery" placeholder="Rechercher un étudiant..." class="w-full" :disabled="!canShowResults" />
          </div>
          <div class="col-12" v-if="canShowResults">
            <small class="text-500">
              <i class="pi pi-info-circle"></i> 
              Votes avec choix: <strong>{{ filteredVotationsList.length }}</strong> | 
              Configuration: <strong>{{ filterYear }} - {{ filterPFP }}</strong>
            </small>
          </div>
        </div>
      </div>

      <!-- Résultats de l'algorithme - Version compacte -->
      <div v-if="canShowResults && algorithmResults.length > 0" class="results-card p-3 border-round mb-3">
        <div class="flex justify-content-between align-items-center mb-3">
          <div>
            <h3 class="text-lg font-bold text-900 m-0 mb-1">
              <i class="pi pi-check-circle text-green-600 mr-2"></i>
              Résultats de l'Attribution
            </h3>
            <!-- Statistiques en ligne compacte -->
            <div v-if="algorithmStats" class="flex gap-4 flex-wrap">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-users text-green-600"></i>
                <span class="text-sm"><strong>{{ algorithmStats.totalStudents || 0 }}</strong> étudiants</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-star text-blue-600"></i>
                <span class="text-sm"><strong>{{ algorithmStats.firstChoiceCount || 0 }}</strong> en 1er choix</span>
              </div>
              <div v-if="algorithmStats.randomAssignmentCount > 0" class="flex align-items-center gap-2">
                <i class="pi pi-question-circle text-red-600"></i>
                <span class="text-sm"><strong>{{ algorithmStats.randomAssignmentCount || 0 }}</strong> aléatoires</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-building text-purple-600"></i>
                <span class="text-sm"><strong>{{ algorithmStats.placesUsed || 0 }}</strong> places utilisées</span>
              </div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-chart-line text-orange-600"></i>
                <span class="text-sm">Rang moyen: <strong>{{ algorithmStats.averageRank || '0' }}</strong></span>
              </div>
            </div>
          </div>
          <Tag :value="`${algorithmResults.length} attributions`" severity="success" />
        </div>

        <!-- Tableau des résultats - Compact et complet -->
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
          class="results-table"
          stripedRows
        >
          <template #header>
            <div class="flex justify-content-between align-items-center flex-wrap gap-2">
              <div>
                <span class="text-lg font-semibold">Liste complète des attributions</span>
                <br/>
                <span class="text-sm text-500">{{ algorithmResults.length }} étudiants assignés • Triés par rang de choix</span>
              </div>
              <div class="flex gap-2">
                <Button 
                  icon="pi pi-file-excel" 
                  label="Exporter" 
                  size="small" 
                  severity="success" 
                  outlined
                  @click="exportResults"
                  v-tooltip.top="'Exporter les résultats en CSV'"
                />
              </div>
            </div>
          </template>

          <Column field="user_id" header="Étudiant" sortable :style="{ width: '220px' }">
            <template #body="slotProps">
              <strong>{{ getStudentName(slotProps.data.user_id) }}</strong>
            </template>
          </Column>
          
          <Column field="assigned_place_name" header="Place Attribuée" sortable :style="{ minWidth: '250px' }">
            <template #body="slotProps">
              <div>
                <div class="font-semibold">{{ slotProps.data.assigned_place_name }}</div>
                <small class="text-500">{{ slotProps.data.assigned_institution_name }}</small>
              </div>
            </template>
          </Column>
          
          <Column field="assigned_rank" header="Choix" sortable :style="{ width: '150px', textAlign: 'center' }">
            <template #body="slotProps">
              <Tag 
                v-if="slotProps.data.assigned_rank === 99"
                value="🎲 Aléatoire" 
                severity="danger"
                v-tooltip.top="'Place attribuée aléatoirement (non dans les choix)'"
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
      <div v-if="!canShowResults" class="bg-blue-50 border-round p-4 mb-4">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
          <div>
            <h4 class="m-0 text-blue-900">Sélection requise</h4>
            <p class="m-0 mt-2 text-blue-800">
              Veuillez sélectionner une <strong>année</strong> et un <strong>PFP</strong> pour afficher les résultats des votations.
            </p>
          </div>
        </div>
      </div>

      <!-- Onglets -->
      <div v-if="canShowResults" class="tabs-card p-4 border-round">
        <TabView v-model:activeIndex="activeTab">
          <!-- Onglet 1: Vue Étudiants -->
          <TabPanel header="Vue par Étudiants">
            <div v-if="allVotes.length === 0" class="bg-yellow-50 border-round p-4 mb-3">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-exclamation-triangle text-yellow-600 text-2xl"></i>
                <div>
                  <h4 class="m-0 text-yellow-900">Aucun vote chargé</h4>
                  <p class="m-0 mt-2 text-yellow-800">
                    Les votes ne peuvent pas être chargés. Vérifiez les permissions RLS (Row Level Security) sur la table <code>student_votes</code>.
                    Les administrateurs doivent avoir accès en lecture à tous les votes.
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
              class="votations-table"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="text-xl text-900 font-bold">Votes des Étudiants BA25 ({{ filteredVotationsList.length }})</span>
                  <div class="flex gap-2">
                    <Button icon="pi pi-sort-alpha-down" label="Trier A-Z" outlined size="small" @click="sortAlphabetically" />
                  </div>
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
                  <div v-if="slotProps.data.choix1" class="choice-cell p-2 bg-blue-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-blue-500">1</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix1 }}</div>
                        <div v-if="slotProps.data.choix1Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix1Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice1PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice1PlaceId).top1" severity="success" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 2" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix2" class="choice-cell p-2 bg-cyan-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-cyan-500">2</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix2 }}</div>
                        <div v-if="slotProps.data.choix2Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix2Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice2PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice2PlaceId).top2" severity="info" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 3" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix3" class="choice-cell p-2 bg-orange-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-orange-500">3</span>
                      <div class="flex-1">
                        <div class="font-semibold text-900 text-sm">{{ slotProps.data.choix3 }}</div>
                        <div v-if="slotProps.data.choix3Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix3Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice3PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice3PlaceId).top3" severity="warning" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 4" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix4" class="choice-cell p-2 bg-gray-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-gray-500">4</span>
                      <div class="flex-1">
                        <div class="font-medium text-900 text-sm">{{ slotProps.data.choix4 }}</div>
                        <div v-if="slotProps.data.choix4Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix4Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice4PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice4PlaceId).top4" class="text-xs px-2 py-0" />
                        </div>
                      </div>
                    </div>
                  </div>
                  <span v-else class="text-400">-</span>
                </template>
              </Column>
              <Column header="Choix 5" :style="{ minWidth: '250px' }">
                <template #body="slotProps">
                  <div v-if="slotProps.data.choix5" class="choice-cell p-2 bg-gray-50 border-round">
                    <div class="flex align-items-start gap-2">
                      <span class="choice-badge bg-gray-500">5</span>
                      <div class="flex-1">
                        <div class="font-medium text-900 text-sm">{{ slotProps.data.choix5 }}</div>
                        <div v-if="slotProps.data.choix5Institution" class="text-xs text-600 mt-1">
                          {{ slotProps.data.choix5Institution }}
                        </div>
                        <div class="flex gap-1 mt-1" v-if="slotProps.data.choice5PlaceId">
                          <Tag :value="getVoteCountForPlace(slotProps.data.choice5PlaceId).top5" class="text-xs px-2 py-0" />
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
              class="places-stats-table"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center mb-3">
                  <span class="text-xl text-900 font-bold">Statistiques par Places ({{ filteredPlacesByPFP.length }})</span>
                  <div class="flex gap-2">
                    <Button 
                      label="Tous" 
                      :class="{ 'p-button-outlined': filterPlacesPFP !== null }"
                      size="small"
                      @click="filterPlacesPFP = null"
                    />
                    <Button 
                      label="PFP1A" 
                      severity="success"
                      :class="{ 'p-button-outlined': filterPlacesPFP !== 'PFP1A' }"
                      size="small"
                      @click="filterPlacesPFP = 'PFP1A'"
                    />
                    <Button 
                      label="PFP1B" 
                      severity="info"
                      :class="{ 'p-button-outlined': filterPlacesPFP !== 'PFP1B' }"
                      size="small"
                      @click="filterPlacesPFP = 'PFP1B'"
                    />
                  </div>
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
            <div v-if="placesWithAssignments.length === 0" class="bg-blue-50 border-round p-4">
              <div class="flex align-items-center gap-2">
                <i class="pi pi-info-circle text-blue-600 text-2xl"></i>
                <div>
                  <h4 class="m-0 text-blue-900">Aucune attribution</h4>
                  <p class="m-0 mt-2 text-blue-800">
                    Lancez l'algorithme d'attribution pour voir les résultats ici.
                  </p>
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
              class="places-attribution-table"
              stripedRows
            >
              <template #header>
                <div class="flex justify-content-between align-items-center flex-wrap gap-2">
                  <div>
                    <span class="text-xl text-900 font-bold">
                      <i class="pi pi-building text-primary mr-2"></i>
                      Toutes les Places du {{ filterPFP }}
                    </span>
                    <br/>
                    <span class="text-sm text-600">
                      <strong class="text-green-600">{{ placesWithAssignments.filter(p => p.assignedCount > 0).length }}</strong> places avec étudiants • 
                      <strong class="text-orange-600">{{ placesWithAssignments.filter(p => p.assignedCount === 0).length }}</strong> places vides • 
                      <strong>{{ placesWithAssignments.length }}</strong> au total
                    </span>
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

        <!-- Bouton Algorithme -->
        <div class="algorithm-section p-4 border-round mt-4">
          <div class="flex justify-content-between align-items-center">
            <div>
              <h3 class="text-xl font-bold text-900 m-0">Algorithme d'attribution</h3>
              <p class="text-600 m-0 mt-1">Lancer l'algorithme d'attribution des places pour {{ filterYear }} - {{ filterPFP }}</p>
            </div>
            <Button 
              icon="pi pi-play-circle" 
              label="Démarrer l'algorithme" 
              severity="success"
              size="large"
              @click="startAlgorithm"
              :disabled="filteredVotationsList.length === 0"
            />
          </div>
          <div class="mt-3" v-if="filteredVotationsList.length > 0">
            <small class="text-500">
              <i class="pi pi-info-circle"></i> 
              L'algorithme traitera <strong>{{ filteredVotationsList.length }}</strong> étudiants BA25 ayant effectué leurs choix.
            </small>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
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
import votesBackendService from '@/stores/votesBackendService'
import resultatVotationService from '@/stores/resultatVotationService'

const toast = useToast()
const loading = ref(false)
const searchQuery = ref('')
const filterPFP = ref(null)
const filterYear = ref(null)
const filterPlacesPFP = ref(null)
const votationsList = ref([])
const allStudents = ref([])
const allVotes = ref([])
const votesAggregation = ref({})
const placesWithStats = ref([])
const activeTab = ref(0)
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const algorithmResults = ref([]) // Résultats de l'algorithme
const algorithmStats = ref(null) // Statistiques de l'algorithme
const placesWithAssignments = ref([]) // Places avec étudiants assignés

// ============================================
// CONFIGURATION POUR BA25 - PFP1A et PFP1B
// ============================================
const ACTIVE_CONFIG = {
  // Classe ciblée
  targetClass: 'BA25',
  
  // Années actives pour les votations
  activeYears: ['2026'],
  
  // Types de PFP actifs pour BA25
  activePFPs: ['PFP1A', 'PFP1B'],
  
  // Configuration complète
  allPFPs: [
    { label: 'PFP1A', value: 'PFP1A', active: true },
    { label: 'PFP1B', value: 'PFP1B', active: true }
  ]
}

// Filtrer pour n'afficher que les PFP actifs
const pfpTypes = ref(
  ACTIVE_CONFIG.allPFPs.filter(pfp => pfp.active)
)

const years = ref(ACTIVE_CONFIG.activeYears)

const stats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  incomplete: 0
})

// Computed property pour vérifier si on peut afficher les résultats
const canShowResults = computed(() => {
  return filterYear.value && filterPFP.value
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

// Computed property pour filtrer les places par PFP
const filteredPlacesByPFP = computed(() => {
  if (!filterPlacesPFP.value) {
    return placesWithStats.value
  }
  
  return placesWithStats.value.filter(place => {
    const hasVotesForPFP = allVotes.value.some(vote => {
      if (vote.pfp_type !== filterPlacesPFP.value) return false
      
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
      detail: `Traitement de ${filteredVotationsList.value.length} étudiants BA25...`,
      life: 5000
    })

    // Préparer les données des étudiants pour l'algorithme
    const studentsData = filteredVotationsList.value.map(student => ({
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
      priorityScore: Math.random() * 100 // Score de priorité aléatoire pour l'instant
    }))

    // Récupérer toutes les places disponibles
    await placesStore.fetchPlaces()
    await institutionsStore.fetchInstitutions()

    const institutionMap = new Map()
    institutionsStore.institutions.forEach(inst => {
      institutionMap.set(inst.InstitutionId, inst)
    })

    // 🎯 Filtrer les places selon le PFP sélectionné
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
        
        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionId: place.InstitutionId,
          InstitutionName: institution?.Name || 'Inconnu',
          Capacity: capacity // Utiliser la capacité spécifique au PFP
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

const loadData = async () => {
  loading.value = true
  try {
    // 1. Charger tous les étudiants et filtrer par BA25
    console.log('📚 Chargement des étudiants BA25...')
    const allStudentsData = await getAllStudents()
    allStudents.value = allStudentsData.filter(student => {
      // Gérer différentes conventions de nommage pour la classe
      const classe = student.Classe || student.classe || student.class || student.Class || ''
      return classe === ACTIVE_CONFIG.targetClass
    })
    console.log(`✅ ${allStudents.value.length} étudiants BA25 chargés`)
    
    // Debug: Vérifier un échantillon d'étudiants
    if (allStudents.value.length > 0) {
      const sample = allStudents.value[0]
      console.log('🔍 Échantillon étudiant (TOUS les champs):', sample)
      console.log('🔍 Noms possibles:', {
        'display_name': sample.display_name,
        'Prenom': sample.Prenom,
        'Nom': sample.Nom,
        'forname': sample.forname,
        'family_name': sample.family_name,
        'email': sample.email,
        'Mail': sample.Mail
      })
    }
    
    // 2. Charger les places
    console.log('🏥 Chargement des places...')
    await placesStore.fetchPlaces()
    const placesMap = new Map()
    placesStore.places.forEach(place => {
      placesMap.set(place.PlaceId, place.NomPlace)
    })
    console.log(`✅ ${placesMap.size} places chargées`)

    // 3. Charger les statistiques de votes
    await loadVoteStatistics()

    // 4. Charger tous les votes
    console.log('🗳️ Chargement des votes...')
    
    let { data: votes, error: votesError } = await supabase
      .from('student_votes')
      .select('*')
      .order('updated_at', { ascending: false })

    if (votesError) {
      console.error('❌ Erreur lors du chargement des votes:', votesError)
      throw votesError
    }
    
    allVotes.value = votes || []
    console.log(`✅ ${allVotes.value.length} votes chargés`)
    
    if (allVotes.value.length === 0) {
      console.warn('⚠️ ATTENTION: Aucun vote chargé !')
      console.warn('⚠️ Vérifiez les permissions RLS sur la table student_votes')
    }

    // 5. Construire la liste des votations pour BA25
    const votationsMap = new Map()

    // Ajouter les votes existants pour les étudiants BA25
    allVotes.value.forEach((vote, index) => {
      const student = allStudents.value.find(s => 
        s.id === vote.user_id || s.user_id === vote.user_id
      )
      
      const studentClasse = student ? (student.Classe || student.classe || student.class || student.Class) : null
      
      if (student && studentClasse === ACTIVE_CONFIG.targetClass) {
        let choices = []
        if (typeof vote.choices === 'string') {
          try {
            choices = JSON.parse(vote.choices)
          } catch (e) {
            console.error('Erreur parsing choices:', e)
            choices = []
          }
        } else if (Array.isArray(vote.choices)) {
          choices = vote.choices
        }
        
        const key = `${vote.user_id}-${vote.pfp_type}-${vote.year}`
        
        if (index < 3) {
          console.log(`🔍 Vote BA25 ${index + 1}:`, {
            userId: vote.user_id,
            student_ALL_FIELDS: student,
            Nom: student.Nom,
            nom: student.nom,
            family_name: student.family_name,
            Prenom: student.Prenom,
            prenom: student.prenom,
            forname: student.forname,
            classe: student.Classe,
            pfpType: vote.pfp_type,
            year: vote.year,
            choicesCount: choices.length
          })
        }
        
        const getPlaceName = (choice) => {
          if (!choice) return null
          if (choice.placeName) return choice.placeName
          if (choice.placeId && placesMap.has(choice.placeId)) {
            return placesMap.get(choice.placeId)
          }
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
          choix1Institution: choices[0]?.InstitutionName || null,
          choix2Institution: choices[1]?.InstitutionName || null,
          choix3Institution: choices[2]?.InstitutionName || null,
          choix4Institution: choices[3]?.InstitutionName || null,
          choix5Institution: choices[4]?.InstitutionName || null,
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

    // Ajouter les étudiants BA25 qui n'ont pas encore voté
    const relevantYears = ACTIVE_CONFIG.activeYears
    const relevantPFPs = ACTIVE_CONFIG.activePFPs

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
              choix1: null,
              choix2: null,
              choix3: null,
              choix4: null,
              choix5: null,
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
    
    console.log(`📋 Total votations BA25 créées: ${votationsList.value.length}`)
    
    sortAlphabetically()
    updateStats()
    await buildPlacesWithStats()

    console.log(`✅ ${votationsList.value.length} lignes de votations BA25 créées`)
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
  const total = votationsList.value.length
  const completed = votationsList.value.filter(v => v.status === 'Complet').length
  const incomplete = votationsList.value.filter(v => v.status === 'Incomplet').length
  const notVoted = votationsList.value.filter(v => v.status === 'Non voté').length

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

    const headers = ['Nom', 'Prénom', 'Classe', 'PFP', 'Année', 'Choix 1', 'Choix 2', 'Choix 3', 'Nb Choix', 'Date Vote', 'Statut']
    const csvContent = [
      headers.join(';'),
      ...dataToExport.map(row => [
        row.nom,
        row.prenom,
        row.classe,
        row.pfpType,
        row.year,
        row.choix1 || '',
        row.choix2 || '',
        row.choix3 || '',
        row.nbChoix,
        row.dateVote ? formatDate(row.dateVote) : '',
        row.status
      ].join(';'))
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `votations_ba25_${new Date().toISOString().split('T')[0]}.csv`)
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

onMounted(async () => {
  await loadData()
})
</script>

<style scoped>
/* Design cohérent avec le reste de l'application */
.votation-etudiants-page {
  min-height: calc(100vh - 100px);
  background: #e5e7eb;
}

/* En-tête sombre */
.header-card {
  background: #1f2937;
}

.header-card h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.header-card p {
  color: #9ca3af;
}

.header-card .text-primary {
  color: #60a5fa !important;
}

/* Banner de configuration */
.config-banner {
  background: rgba(59, 130, 246, 0.1);
  color: #1e40af;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.config-banner i {
  color: #3b82f6;
}

.config-banner span {
  color: #1e40af;
}

/* Cartes de statistiques sur fond sombre */
.stat-card {
  background: #1f2937;
  border: 1px solid #374151;
}

/* Carte des filtres sur fond sombre */
.filters-card {
  background: #1f2937;
  border: 1px solid #374151;
}

/* Carte des onglets sur fond sombre */
.tabs-card {
  background: #1f2937;
  border: 1px solid #374151;
}

/* Onglets avec fond sombre */
:deep(.p-tabview .p-tabview-nav) {
  background: #111827;
  border-bottom: 1px solid #374151;
}

:deep(.p-tabview .p-tabview-nav li .p-tabview-nav-link) {
  background: transparent;
  color: #9ca3af;
  border: none;
}

:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: transparent;
  color: #fbbf24;
  border-bottom: 2px solid #fbbf24;
}

:deep(.p-tabview .p-tabview-panels) {
  background: #1f2937;
}

/* Table avec fond sombre */
:deep(.p-datatable) {
  background: #1f2937;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background: #111827;
  font-weight: 600;
  border: 1px solid #374151;
  padding: 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr) {
  background: #1f2937;
  border-bottom: 1px solid #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr:nth-child(even)) {
  background: #374151;
}

:deep(.p-datatable .p-datatable-tbody > tr:hover) {
  background: #4b5563 !important;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  border: 1px solid #374151;
  padding: 0.75rem;
}

/* Curseur pointer */
.cursor-pointer {
  cursor: pointer;
  transition: all 0.15s ease;
}

.cursor-pointer:hover {
  opacity: 0.85;
  transform: scale(1.03);
}

/* Cellules de choix avec fond blanc pour contraste */
.choice-cell {
  background-color: white !important;
  transition: all 0.2s ease;
}

.choice-cell:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

/* Style pour les colonnes de choix */
.bg-blue-50 {
  background-color: white !important;
  border-left: 4px solid #3b82f6;
}

.bg-cyan-50 {
  background-color: white !important;
  border-left: 4px solid #06b6d4;
}

.bg-orange-50 {
  background-color: white !important;
  border-left: 4px solid #f97316;
}

.bg-gray-50 {
  background-color: white !important;
  border-left: 4px solid #6b7280;
}

/* Badges de choix */
.choice-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-weight: 700;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.bg-blue-500 {
  background-color: #3b82f6;
}

.bg-cyan-500 {
  background-color: #06b6d4;
}

.bg-orange-500 {
  background-color: #f97316;
}

.bg-gray-500 {
  background-color: #6b7280;
}

/* Texte dans les choix */
.choice-cell .text-900 {
  color: #111827 !important;
}

.choice-cell .text-600 {
  color: #4b5563 !important;
}

/* Warning banner */
.bg-yellow-50 {
  background: #fef3c7 !important;
}

.text-yellow-600 {
  color: #d97706 !important;
}

.text-yellow-800,
.text-yellow-900 {
  color: #92400e !important;
}

/* Animation */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stat-card,
.filters-card,
.tabs-card {
  animation: fadeIn 0.3s ease-out;
}

/* Section Algorithme */
.algorithm-section {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border: 2px solid #047857;
}

.algorithm-section h3 {
  color: white;
}

.algorithm-section p {
  color: #d1fae5;
}

/* Message info bleu */
.bg-blue-50 {
  background: #dbeafe !important;
}

.text-blue-600 {
  color: #2563eb !important;
}

.text-blue-800,
.text-blue-900 {
  color: #1e3a8a !important;
}

/* Responsive */
@media (max-width: 768px) {
  .header-card h1 {
    font-size: 1.25rem;
  }
}
</style>
