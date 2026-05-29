<template>
  <AdminLayout>
    <Toast />
    <div class="votation-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Votation PFP</span>
      </div>

      <!-- Header -->
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4">
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
              <Dropdown v-model="filterClasse" :options="classeOptions" optionLabel="label" optionValue="value" placeholder="Classe" class="w-full md:w-12rem" :disabled="!filterYear" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterPFP" :options="pfpTypes" optionLabel="label" optionValue="value" placeholder="PFP" class="w-full md:w-8rem" :disabled="!filterClasse || !filterYear" />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année <span class="text-red-500">*</span></label>
              <Dropdown v-model="filterYear" :options="years" optionLabel="label" optionValue="value" placeholder="Année" class="w-full md:w-9rem" />
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
                <Button icon="pi pi-briefcase" label="Export opérationnel" outlined class="p-button-sm" severity="help" @click="exportOperationalSummary" :disabled="!canShowResults || !canExportOperational" v-tooltip="'Disponible après attribution'" />
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

      <div v-if="canShowResults" :class="['session-sticky-banner mb-3', sessionIsOpen ? 'session-sticky-banner--open' : 'session-sticky-banner--closed']">
        <i :class="['pi', sessionIsOpen ? 'pi-lock-open' : 'pi-lock', 'mr-2']"></i>
        <strong>{{ sessionIsOpen ? 'Session OUVERTE' : 'Session FERMÉE' }}</strong>
        <span class="ml-2">{{ filterClasse }} · {{ filterPFP }} · {{ filterYear }}</span>
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

      <div v-if="canShowResults" class="surface-card p-3 border-round shadow-2 mb-3">
        <div class="flex align-items-center gap-2 flex-wrap">
          <i :class="['pi', hasInsufficientCapacity ? 'pi-exclamation-triangle text-red-500' : 'pi-check-circle text-green-500']"></i>
          <span class="font-semibold text-900">Contrôle de capacité pré-algorithme</span>
          <Tag :value="`À placer: ${studentsToPlaceCount}`" severity="warning" class="text-xs" />
          <Tag v-if="excludedAssignedStudentsCount > 0" :value="`Déjà assignés (exclus): ${excludedAssignedStudentsCount}`" severity="secondary" class="text-xs" />
          <Tag :value="`Capacité: ${totalValidatedCapacity}`" :severity="hasInsufficientCapacity ? 'danger' : 'success'" class="text-xs" />
          <Tag v-if="hasInsufficientCapacity" :value="`Manque: ${missingCapacityCount}`" severity="danger" class="text-xs" />
        </div>
        <p :class="['m-0 mt-2 text-xs', hasInsufficientCapacity ? 'text-red-600' : 'text-green-600']">
          {{ hasInsufficientCapacity ? 'Capacité insuffisante : ajoutez des places ou réduisez le périmètre.' : 'Capacité suffisante pour lancer l\'algorithme.' }}
        </p>
      </div>

      <!-- Checklist pré-votation -->
      <div v-if="canShowResults" class="surface-card p-4 border-round shadow-2 mb-3">
        <div class="flex justify-content-between align-items-center flex-wrap gap-2 mb-3">
          <div class="flex align-items-center gap-2">
            <i class="pi pi-list-check text-primary"></i>
            <h3 class="text-lg font-bold text-900 m-0">Checklist pré-votation</h3>
            <Tag :value="`${checklistCompletedCount}/${checklistTotalCount}`" severity="info" class="text-xs" />
          </div>
          <Button icon="pi pi-refresh" label="Réinitialiser" size="small" outlined @click="resetChecklist" />
        </div>

        <div class="checklist-sections">
          <div v-for="section in checklistSections" :key="section.title" class="checklist-card">
            <div class="font-semibold text-900 mb-2">{{ section.title }}</div>
            <label
              v-for="item in section.items"
              :key="item.key"
              class="checklist-item"
            >
              <input
                type="checkbox"
                :checked="checklistState[item.key]"
                @change="toggleChecklistItem(item.key)"
              />
              <span class="text-sm text-700">{{ item.label }}</span>
            </label>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-3">
        <div class="col-6 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="border-circle p-3 bg-blue-100">
                <i class="pi pi-building text-2xl text-blue-500"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ proposedPlacesCount }}</h3>
                <p class="text-600 m-0 text-sm">Somme proposition brute ({{ filterPFP || '—' }})</p>
                <p class="text-500 m-0 text-xs">Source: champ proposition {{ filterPFP ? `${filterPFP.toLowerCase()}_proposition` : 'PFP_proposition' }}[{{ filterYear || 'année' }}] • {{ filterClasse || '—' }}</p>
              </div>
            </div>
          </div>
        </div>

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
              :value="filteredVotationsTableList" 
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
                <div class="flex justify-content-between align-items-center flex-wrap gap-2">
                  <span class="text-lg text-900 font-bold">Votes des Étudiants {{ filterClasse }} ({{ filteredVotationsTableList.length }})</span>
                  <div class="flex align-items-center gap-2 flex-wrap">
                    <Button :outlined="voteQuickFilter !== 'all'" size="small" :label="`Tous (${quickFilterCounts.all})`" @click="setVoteQuickFilter('all')" />
                    <Button :outlined="voteQuickFilter !== 'non_voted'" size="small" severity="danger" :label="`Non-votants (${quickFilterCounts.nonVoted})`" @click="setVoteQuickFilter('non_voted')" />
                    <Button :outlined="voteQuickFilter !== 'incomplete'" size="small" severity="warning" :label="`Incomplets (${quickFilterCounts.incomplete})`" @click="setVoteQuickFilter('incomplete')" />
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
        <div v-if="filterPFP === 'PFP4' && canShowResults" class="surface-card p-4 border-round shadow-2 mt-4 border-1 border-yellow-300" style="background: var(--surface-card); border-color: var(--yellow-500);">
          <div class="flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <div class="flex align-items-center gap-2">
                <i class="pi pi-filter-fill text-xl text-yellow-600"></i>
                <h3 class="text-lg font-bold m-0 text-yellow-600">Propositions PFP4 — Places par étudiant</h3>
              </div>
              <p class="m-0 mt-1 text-sm text-yellow-500">
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
          <div class="mb-3 p-3 border-round bg-white border-1 border-green-200">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-chart-bar text-green-600"></i>
              <span class="font-semibold text-900">Prévisualisation impact avant lancement</span>
            </div>
            <div class="flex gap-2 flex-wrap mb-2">
              <Tag :value="`Étudiants à placer: ${studentsToPlaceCount}`" severity="info" class="text-xs" />
              <Tag :value="`Capacité: ${totalValidatedCapacity}`" :severity="hasInsufficientCapacity ? 'danger' : 'success'" class="text-xs" />
              <Tag :value="`Risque aléatoire estimé: ${estimatedRandomRiskPercent}%`" :severity="estimatedRandomRiskPercent > 0 ? 'warning' : 'success'" class="text-xs" />
              <Tag :value="`Cas sensibles: ${quickFilterCounts.nonVoted + quickFilterCounts.incomplete}`" :severity="(quickFilterCounts.nonVoted + quickFilterCounts.incomplete) > 0 ? 'warning' : 'success'" class="text-xs" />
            </div>
            <div v-if="sensitiveCasesPreview.length > 0" class="text-sm text-700">
              <strong>À surveiller:</strong>
              <span>{{ sensitiveCasesPreview.map(s => `${s.prenom} ${s.nom} (${s.status})`).join(', ') }}</span>
              <span v-if="sensitiveCasesMoreCount > 0"> (+{{ sensitiveCasesMoreCount }} autres)</span>
            </div>
          </div>

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

    <div v-if="canShowResults" class="surface-card p-4 border-round shadow-2 mb-3 mt-4">
      <div class="flex justify-content-between align-items-center mb-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-list text-primary"></i>
          <h3 class="text-lg font-bold text-900 m-0">Historique des actions admin</h3>
          <Tag :value="adminActionHistory.length" severity="secondary" rounded />
        </div>
        <Button icon="pi pi-trash" label="Vider" text size="small" @click="clearAdminActionHistory" :disabled="adminActionHistory.length === 0" />
      </div>
      <div v-if="adminActionHistory.length === 0" class="text-600 text-sm">
        Aucune action enregistrée pour ce contexte.
      </div>
      <div v-else class="flex flex-column gap-2">
        <div v-for="entry in adminActionHistory.slice(0, 12)" :key="entry.id" class="p-2 border-round border-1 surface-border">
          <div class="flex justify-content-between align-items-center gap-2">
            <span class="font-semibold text-900">{{ entry.action }}</span>
            <span class="text-xs text-500">{{ formatDate(entry.at) }}</span>
          </div>
          <div class="text-sm text-700 mt-1">{{ entry.detail }}</div>
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
import { ref, computed, watch, onMounted } from 'vue'
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
import votesBackendService from '@/service/votesBackendService'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'
import Chips from 'primevue/chips'
import AutoComplete from 'primevue/autocomplete'
import { useVotationSession } from '@/composables/useVotationSession'
import { useVotationConfig } from '@/composables/useVotationConfig'
import { useVotationExclusions } from '@/composables/useVotationExclusions'
import { usePfp4Proposals } from '@/composables/usePfp4Proposals'
import { useVotationAlgorithm } from '@/composables/useVotationAlgorithm'

const toast = useToast()
const userStore = useUserStore()
const loading = ref(false)

// ============================================
// COMPOSABLES
// ============================================
const {
  filterPFP, filterYear, filterClasse, searchQuery, activeTab,
  pfpColorMap, classeOptions, activeConfig, pfpTypes, years,
  canShowResults, setupClassWatcher, setupFilterWatcher
} = useVotationConfig()

const {
  currentSession, showSessionDialog, sessionLoading, sessionIsOpen,
  sessionHistory, showHistoryPanel,
  loadCurrentSession, openVotation: _openVotation, closeVotation: _closeVotation,
  loadSessionHistory, formatDuration
} = useVotationSession(toast, userStore)

const votationsList = ref([])
const allStudents = ref([])
const allVotes = ref([])
const votesAggregation = ref({})
const placesWithStats = ref([])
const validatedPlaces = ref([])
const placesFullMap = ref(new Map())
const excludedAssignedStudentsCount = ref(0)

const {
  excludedStudentIds, excludeSearchValue, excludeFilteredSuggestions,
  excludedStudentOptions, filterExcludeStudents, onExcludeStudent,
  removeExcludedStudent, getExcludedStudentName, resetExclusions
} = useVotationExclusions(allStudents)

const {
  pfp4Proposals, pfp4AllPlaces, pfp4Stats, pfp4Loading, pfp4Saved,
  pfp4SearchQuery, pfp4FilterRule, pfp4RuleLabels, pfp4RuleSeverity,
  filteredPfp4Proposals, generatePfp4Proposals: _generatePfp4Proposals,
  savePfp4Proposals: _savePfp4Proposals, exportPfp4BilanCSV: _exportPfp4BilanCSV,
  resetPfp4, CRITERIA_KEYS
} = usePfp4Proposals(toast, excludedStudentIds, votationsList)

const {
  algorithmResults, algorithmStats, placesWithAssignments, algorithmLoading,
  startAlgorithm: _startAlgorithm, resetAlgorithm
} = useVotationAlgorithm(toast)

const stats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  incomplete: 0
})

const checklistSections = [
  {
    title: 'Avant ouverture',
    items: [
      { key: 'configChecked', label: 'Année, classe et PFP vérifiés' },
      { key: 'capacityChecked', label: 'Capacités proposition contrôlées' },
      { key: 'studentsChecked', label: 'Étudiants/cas sensibles vérifiés' }
    ]
  },
  {
    title: 'Avant algorithme',
    items: [
      { key: 'sessionClosed', label: 'Session votation fermée' },
      { key: 'votesChecked', label: 'Votes non-votants / incomplets contrôlés' },
      { key: 'placesChecked', label: 'Places validées cohérentes' }
    ]
  },
  {
    title: 'Après algorithme',
    items: [
      { key: 'resultsChecked', label: 'Résultats relus (top choix / aléatoire)' },
      { key: 'unassignedChecked', label: 'Non assignés analysés' },
      { key: 'exportDone', label: 'Export de contrôle effectué' }
    ]
  }
]

const createDefaultChecklistState = () => ({
  configChecked: false,
  capacityChecked: false,
  studentsChecked: false,
  sessionClosed: false,
  votesChecked: false,
  placesChecked: false,
  resultsChecked: false,
  unassignedChecked: false,
  exportDone: false
})

const checklistState = ref(createDefaultChecklistState())

const adminActionHistory = ref([])

const checklistStorageKey = computed(() => {
  const classe = filterClasse.value || 'none'
  const pfp = filterPFP.value || 'none'
  const year = filterYear.value || 'none'
  return `pfp-votation-checklist:${classe}:${pfp}:${year}`
})

const adminActionStorageKey = computed(() => {
  const classe = filterClasse.value || 'none'
  const pfp = filterPFP.value || 'none'
  const year = filterYear.value || 'none'
  return `pfp-admin-actions:standard:${classe}:${pfp}:${year}`
})

const checklistTotalCount = computed(() => Object.keys(checklistState.value).length)
const checklistCompletedCount = computed(() => Object.values(checklistState.value).filter(Boolean).length)

const toggleChecklistItem = (key) => {
  checklistState.value[key] = !checklistState.value[key]
}

const resetChecklist = () => {
  Object.keys(checklistState.value).forEach((key) => {
    checklistState.value[key] = false
  })
}

const loadChecklistState = () => {
  if (typeof window === 'undefined') return
  const defaults = createDefaultChecklistState()
  try {
    const raw = window.localStorage.getItem(checklistStorageKey.value)
    if (!raw) {
      checklistState.value = defaults
      return
    }
    const parsed = JSON.parse(raw)
    checklistState.value = {
      ...defaults,
      ...(parsed && typeof parsed === 'object' ? parsed : {})
    }
  } catch (error) {
    checklistState.value = defaults
  }
}

const exportOperationalSummary = async () => {
  if (!canShowResults.value) return
  try {
    if (!Array.isArray(algorithmResults.value) || algorithmResults.value.length === 0) {
      toast.add({ severity: 'warn', summary: 'Attribution requise', detail: 'Lancez d\'abord l\'algorithme pour générer un export opérationnel.', life: 4000 })
      return
    }

    const assignments = algorithmResults.value || []
    const assignedIds = new Set(assignments.map(a => String(a.user_id)))
    const toPlaceRows = filteredVotationsList.value
    const nonAssignedRows = toPlaceRows.filter(v => !assignedIds.has(String(v.userId)))
    const randomAssignments = assignments.filter(a => Number(a.assigned_rank) === 99)
    const remainingPlaces = Math.max(0, totalValidatedCapacity.value - assignments.length)

    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const summaryRows = [
      { indicateur: 'Classe', valeur: filterClasse.value || '-' },
      { indicateur: 'PFP', valeur: filterPFP.value || '-' },
      { indicateur: 'Année', valeur: filterYear.value || '-' },
      { indicateur: 'Étudiants à placer', valeur: toPlaceRows.length },
      { indicateur: 'Assignés', valeur: assignments.length },
      { indicateur: 'Non assignés', valeur: nonAssignedRows.length },
      { indicateur: 'Assignations aléatoires', valeur: randomAssignments.length },
      { indicateur: 'Places restantes', valeur: remainingPlaces }
    ]

    const assignedRows = assignments.map((row) => ({
      etudiant: getStudentName(row.user_id),
      place: row.assigned_place_name || '-',
      institution: row.assigned_institution_name || '-',
      rang: row.assigned_rank === 99 ? 'Aléatoire' : `Choix ${row.assigned_rank}`
    }))

    const nonAssignedExportRows = nonAssignedRows.map((row) => ({
      etudiant: `${row.prenom} ${row.nom}`,
      statut: row.status,
      nb_choix: row.nbChoix
    }))

    const randomRows = randomAssignments.map((row) => ({
      etudiant: getStudentName(row.user_id),
      place: row.assigned_place_name || '-',
      institution: row.assigned_institution_name || '-'
    }))

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'Résumé')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(assignedRows.length ? assignedRows : [{ etudiant: '-', place: '-', institution: '-', rang: '-' }]), 'Assignés')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(nonAssignedExportRows.length ? nonAssignedExportRows : [{ etudiant: '-', statut: '-', nb_choix: '-' }]), 'Non assignés')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(randomRows.length ? randomRows : [{ etudiant: '-', place: '-', institution: '-' }]), 'Aléatoires')

    XLSX.writeFile(wb, `export_operationnel_${filterClasse.value || 'classe'}_${filterPFP.value || 'pfp'}_${filterYear.value || 'annee'}.xlsx`)

    addAdminAction('Export opérationnel', `Export XLSX généré (${assignments.length} assignés, ${nonAssignedRows.length} non assignés)`)

    toast.add({ severity: 'success', summary: 'Export opérationnel', detail: 'Export prêt équipe généré', life: 3000 })
  } catch (error) {
    console.error('Erreur export opérationnel:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de générer l’export opérationnel', life: 5000 })
  }
}

const saveChecklistState = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(checklistStorageKey.value, JSON.stringify(checklistState.value))
  } catch (error) {
    // ignore localStorage write errors
  }
}

const loadAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = window.localStorage.getItem(adminActionStorageKey.value)
    if (!raw) {
      adminActionHistory.value = []
      return
    }
    const parsed = JSON.parse(raw)
    adminActionHistory.value = Array.isArray(parsed) ? parsed : []
  } catch (error) {
    adminActionHistory.value = []
  }
}

const saveAdminActionHistory = () => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(adminActionStorageKey.value, JSON.stringify(adminActionHistory.value))
  } catch (error) {
    // ignore localStorage write errors
  }
}

const addAdminAction = (action, detail) => {
  adminActionHistory.value = [
    {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: new Date().toISOString(),
      action,
      detail
    },
    ...adminActionHistory.value
  ].slice(0, 80)
}

const clearAdminActionHistory = () => {
  adminActionHistory.value = []
}

watch(checklistStorageKey, () => {
  loadChecklistState()
}, { immediate: true })

watch(adminActionStorageKey, () => {
  loadAdminActionHistory()
}, { immediate: true })

watch(checklistState, () => {
  saveChecklistState()
}, { deep: true })

watch(adminActionHistory, () => {
  saveAdminActionHistory()
}, { deep: true })

// Computed: places validées pour le PFP/année sélectionnés
const computedValidatedPlaces = computed(() => {
  if (!filterPFP.value || !filterYear.value) return []
  return validatedPlaces.value
})

// Computed property pour filtrer les votations
const filteredVotationsList = computed(() => {
  if (!canShowResults.value) return []
  let filtered = votationsList.value
  filtered = filtered.filter(v => v.nbChoix > 0)
  filtered = filtered.filter(v => v.pfpType === filterPFP.value)
  filtered = filtered.filter(v => isYearMatch(v.year, filterYear.value))
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

const voteQuickFilter = ref('all')

const votationsTableBaseList = computed(() => {
  if (!canShowResults.value) return []
  let filtered = votationsList.value
  filtered = filtered.filter(v => v.pfpType === filterPFP.value)
  filtered = filtered.filter(v => isYearMatch(v.year, filterYear.value))

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

const filteredVotationsTableList = computed(() => {
  let filtered = votationsTableBaseList.value

  if (voteQuickFilter.value === 'non_voted') {
    filtered = filtered.filter(v => v.status === 'Non voté')
  } else if (voteQuickFilter.value === 'incomplete') {
    filtered = filtered.filter(v => v.status === 'Incomplet')
  }

  return filtered
})

const studentsToPlaceCount = computed(() => filteredVotationsList.value.length)
const totalValidatedCapacity = computed(() => computedValidatedPlaces.value.reduce((sum, place) => sum + (place.Capacity || 0), 0))
const hasInsufficientCapacity = computed(() => studentsToPlaceCount.value > totalValidatedCapacity.value)
const missingCapacityCount = computed(() => Math.max(0, studentsToPlaceCount.value - totalValidatedCapacity.value))
const estimatedRandomRiskPercent = computed(() => {
  if (studentsToPlaceCount.value === 0) return 0
  return Math.round((missingCapacityCount.value / studentsToPlaceCount.value) * 100)
})
const canExportOperational = computed(() => Array.isArray(algorithmResults.value) && algorithmResults.value.length > 0)
const quickFilterCounts = computed(() => {
  const rows = votationsTableBaseList.value
  return {
    all: rows.length,
    nonVoted: rows.filter(v => v.status === 'Non voté').length,
    incomplete: rows.filter(v => v.status === 'Incomplet').length
  }
})
const sensitiveCasesAll = computed(() => votationsTableBaseList.value.filter(v => v.status === 'Non voté' || v.status === 'Incomplet'))
const sensitiveCasesPreview = computed(() => sensitiveCasesAll.value.slice(0, 6))
const sensitiveCasesMoreCount = computed(() => Math.max(0, sensitiveCasesAll.value.length - sensitiveCasesPreview.value.length))
const proposedPlacesCount = computed(() => {
  if (!filterPFP.value || !filterYear.value) return 0
  return (placesStore.places || []).reduce((sum, place) => {
    return sum + getPropositionForPfp(place, filterPFP.value, filterYear.value)
  }, 0)
})

const setVoteQuickFilter = (mode) => {
  voteQuickFilter.value = mode
}

// Computed property pour filtrer les places par PFP sélectionné
const filteredPlacesByPFP = computed(() => {
  if (!filterPFP.value) return placesWithStats.value
  return placesWithStats.value.filter(place => {
    const hasVotesForPFP = allVotes.value.some(vote => {
      if (vote.pfp_type !== filterPFP.value) return false
      let choices = []
      if (typeof vote.choices === 'string') {
        try { choices = JSON.parse(vote.choices) } catch (e) { return false }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      return choices.some(choice => choice.placeId === place.PlaceId)
    })
    return hasVotesForPFP
  })
})

// Wrapper functions to pass current reactive values
const openVotation = async () => {
  await _openVotation(
    filterClasse.value, filterPFP.value, filterYear.value,
    computedValidatedPlaces.value.length,
    computedValidatedPlaces.value.reduce((s, p) => s + p.Capacity, 0)
  )
  if (sessionIsOpen.value) {
    addAdminAction('Ouverture session', `${filterClasse.value} · ${filterPFP.value} ${filterYear.value}`)
  }
}

const closeVotation = async () => {
  if (!filterPFP.value || !filterYear.value) return
  const confirmed = window.confirm(`Confirmer la fermeture de la votation ${filterClasse.value} · ${filterPFP.value} ${filterYear.value} ?`)
  if (!confirmed) return

  await _closeVotation(filterPFP.value, filterYear.value)
  if (!sessionIsOpen.value) {
    addAdminAction('Fermeture session', `${filterClasse.value} · ${filterPFP.value} ${filterYear.value}`)
  }
}

const generatePfp4Proposals = () => _generatePfp4Proposals(filterYear.value, filterClasse.value)
const savePfp4Proposals = () => _savePfp4Proposals(filterYear.value, filterClasse.value)
const exportPfp4BilanCSV = () => _exportPfp4BilanCSV(filterYear.value, filterClasse.value, allStudents.value)
const startAlgorithm = async () => {
  const confirmed = window.confirm(`Confirmer le lancement de l'algorithme pour ${filterClasse.value} · ${filterPFP.value} ${filterYear.value} ?`)
  if (!confirmed) return

  await _startAlgorithm(
    filterPFP.value, filterYear.value, filterClasse.value,
    canShowResults.value, filteredVotationsList.value,
    excludedStudentIds.value, loadData
  )

  if (Array.isArray(algorithmResults.value) && algorithmResults.value.length > 0) {
    addAdminAction('Lancement algorithme', `${algorithmResults.value.length} attributions générées`)
  }
}

const getPlaceCriteria = (placeId) => {
  if (!placeId || !placesFullMap.value.has(placeId)) return []
  const place = placesFullMap.value.get(placeId)
  return CRITERIA_KEYS.filter(key => place[key] === true || place[key] === 'true' || place[key] === 1 || place[key] === '1')
}
const placesStore = usePlacesStore()
const institutionsStore = useInstitutionsStore()

// ============================================
// WATCHERS
// ============================================
setupClassWatcher((newVal) => {
  resetAlgorithm()
  votationsList.value = []
  validatedPlaces.value = []
  resetExclusions()
})

setupFilterWatcher(async (pfp, year) => {
  await loadCurrentSession(pfp, year)
  await loadValidatedPlaces()
  await loadData()
})

// ============================================
// HELPERS
// ============================================
const getStatusSeverity = (status) => {
  const severities = { 'Complet': 'success', 'Incomplet': 'warning', 'Non voté': 'danger' }
  return severities[status] || 'secondary'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const sortAlphabetically = () => {
  votationsList.value.sort((a, b) => {
    const nameA = `${a.nom} ${a.prenom}`.toLowerCase()
    const nameB = `${b.nom} ${b.prenom}`.toLowerCase()
    return nameA.localeCompare(nameB)
  })
}

const getStudentName = (userId) => {
  const student = allStudents.value.find(s => s.user_id === userId || s.id === userId)
  if (student) {
    if (student.display_name) return student.display_name
    const nom = student.Nom || student.nom || student.family_name || ''
    const prenom = student.Prenom || student.prenom || student.forname || ''
    if (nom || prenom) return `${nom.toUpperCase()} ${prenom}`.trim()
    if (student.email || student.Mail) {
      const email = student.email || student.Mail
      return email.split('@')[0]
    }
  }
  return 'Inconnu'
}

const getVoteCountForPlace = (placeId) => {
  if (!placeId) return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
  if (votesAggregation.value[placeId]) return votesAggregation.value[placeId]
  return { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
}

const parseIntSafe = (value) => {
  const parsed = parseInt(value, 10)
  return Number.isNaN(parsed) ? 0 : parsed
}

const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

const isYearMatch = (candidateYear, selectedYear) => {
  if (!candidateYear || !selectedYear) return false
  return getAcademicYearKeys(selectedYear).includes(String(candidateYear))
}

const getPropositionForPfp = (place, pfpType, year) => {
  const proposition = place?.[`${pfpType.toLowerCase()}_proposition`]
  if (!proposition) return 0
  const yearKeys = getAcademicYearKeys(year)
  for (const yearKey of yearKeys) {
    const parsed = parseIntSafe(proposition?.[yearKey])
    if (parsed > 0) return parsed
  }
  return 0
}

const getStudentIdentityCandidates = (student) => {
  return [student?.id, student?.user_id, student?.firebase_id]
    .filter(Boolean)
    .map(value => String(value))
}

const isStudentAlreadyAssigned = (student, assignedUserIds) => {
  const ids = getStudentIdentityCandidates(student)
  return ids.some(id => assignedUserIds.has(id))
}

const loadAssignedSnapshot = async (pfpType, year) => {
  const empty = { userIds: new Set(), placeCounts: new Map() }
  if (!pfpType || !year) return empty
  const yearKeys = getAcademicYearKeys(year)

  const { data, error } = await supabase
    .from('student_result_vote')
    .select('user_id, assigned_place_id')
    .eq('pfp_type', pfpType)
    .in('year', yearKeys)
    .not('assigned_place_id', 'is', null)

  if (error) throw error

  const userIds = new Set()
  const placeCounts = new Map()
  ;(data || []).forEach((row) => {
    if (row.user_id) userIds.add(String(row.user_id))
    if (row.assigned_place_id) {
      const placeId = String(row.assigned_place_id)
      placeCounts.set(placeId, (placeCounts.get(placeId) || 0) + 1)
    }
  })

  return { userIds, placeCounts }
}

// ============================================
// DATA LOADING
// ============================================
const loadVoteStatistics = async () => {
  try {
    console.log('📊 Chargement des statistiques de votes...')
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
            aggregation[placeId] = { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
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
    
    console.log('📊 Calcul manuel des statistiques depuis les votes...')
    const yearKeys = getAcademicYearKeys(filterYear.value)
    const { data: allVotesData, error: votesError } = await supabase
      .from('student_votes')
      .select('choices')
      .eq('pfp_type', filterPFP.value)
      .in('year', yearKeys)
    if (votesError) throw votesError
    const aggregation = {}
    allVotesData.forEach(vote => {
      let choices = []
      if (typeof vote.choices === 'string') {
        try { choices = JSON.parse(vote.choices) } catch (e) { console.error('Erreur parsing choices pour stats:', e); return }
      } else if (Array.isArray(vote.choices)) {
        choices = vote.choices
      }
      if (choices && choices.length > 0) {
        choices.forEach((choice, index) => {
          const placeId = choice.placeId
          const rank = choice.rank || (index + 1)
          if (placeId) {
            if (!aggregation[placeId]) {
              aggregation[placeId] = { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
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
    institutions.forEach(inst => { institutionMap.set(inst.InstitutionId, inst) })
    const placesStats = []
    places.forEach(place => {
      const institution = institutionMap.get(place.InstitutionId)
      const voteStats = votesAggregation.value[place.PlaceId] || { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 }
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
    const assignedSnapshot = await loadAssignedSnapshot(filterPFP.value, filterYear.value)

    const institutionMap = new Map()
    institutionsStore.institutions.forEach(inst => { institutionMap.set(inst.InstitutionId, inst) })
    const pfp = filterPFP.value
    const year = filterYear.value

    validatedPlaces.value = placesStore.places
      .map(place => {
        const institution = institutionMap.get(place.InstitutionId)
        const rawCapacity = getPropositionForPfp(place, pfp, year)
        const alreadyAssigned = assignedSnapshot.placeCounts.get(String(place.PlaceId)) || 0
        const remainingCapacity = Math.max(0, rawCapacity - alreadyAssigned)
        if (!remainingCapacity || remainingCapacity < 1) return null
        return {
          PlaceId: place.PlaceId,
          NomPlace: place.NomPlace,
          InstitutionName: institution?.Name || 'Inconnu',
          InstitutionCategory: institution?.Category || '-',
          Capacity: remainingCapacity
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
  const config = activeConfig.value
  if (!config) { loading.value = false; return }

  try {
    const allStudentsData = await getAllStudents()
    allStudents.value = allStudentsData.filter(student => {
      const classe = student.Classe || student.classe || student.class || student.Class || ''
      return classe === targetClass
    })

    const assignedSnapshot = await loadAssignedSnapshot(filterPFP.value, filterYear.value)
    const eligibleStudents = allStudents.value.filter(student => !isStudentAlreadyAssigned(student, assignedSnapshot.userIds))
    excludedAssignedStudentsCount.value = Math.max(0, allStudents.value.length - eligibleStudents.length)
    console.log(`✅ ${allStudents.value.length} étudiants ${targetClass} chargés (${eligibleStudents.length} éligibles, ${allStudents.value.length - eligibleStudents.length} déjà assignés)`)
    
    await placesStore.fetchPlaces()
    const placesMap = new Map()
    const fullMap = new Map()
    placesStore.places.forEach(place => {
      placesMap.set(place.PlaceId, place.NomPlace)
      fullMap.set(place.PlaceId, place)
    })
    placesFullMap.value = fullMap

    await loadVoteStatistics()

    const yearKeys = getAcademicYearKeys(filterYear.value)
    let { data: votes, error: votesError } = await supabase
      .from('student_votes')
      .select('*')
      .eq('pfp_type', filterPFP.value)
      .in('year', yearKeys)
      .order('updated_at', { ascending: false })
    if (votesError) throw votesError
    allVotes.value = votes || []

    const votationsMap = new Map()
    const studentsById = new Map()
    eligibleStudents.forEach((student) => {
      getStudentIdentityCandidates(student).forEach((id) => {
        studentsById.set(id, student)
      })
    })

    allVotes.value.forEach((vote) => {
      const student = studentsById.get(String(vote.user_id))
      const studentClasse = student ? (student.Classe || student.classe || student.class || student.Class) : null
      if (student && studentClasse === targetClass) {
        let choices = []
        if (typeof vote.choices === 'string') {
          try { choices = JSON.parse(vote.choices) } catch (e) { choices = [] }
        } else if (Array.isArray(vote.choices)) {
          choices = vote.choices
        }
        const normalizedYear = isYearMatch(vote.year, filterYear.value) ? filterYear.value : vote.year
        const key = `${vote.user_id}-${vote.pfp_type}-${normalizedYear}`
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
          year: normalizedYear,
          choix1: getPlaceName(choices[0]), choix2: getPlaceName(choices[1]),
          choix3: getPlaceName(choices[2]), choix4: getPlaceName(choices[3]),
          choix5: getPlaceName(choices[4]),
          choix1Institution: getInstitutionName(choices[0]), choix2Institution: getInstitutionName(choices[1]),
          choix3Institution: getInstitutionName(choices[2]), choix4Institution: getInstitutionName(choices[3]),
          choix5Institution: getInstitutionName(choices[4]),
          choice1PlaceId: choices[0]?.placeId || null, choice2PlaceId: choices[1]?.placeId || null,
          choice3PlaceId: choices[2]?.placeId || null, choice4PlaceId: choices[3]?.placeId || null,
          choice5PlaceId: choices[4]?.placeId || null,
          nbChoix: choices.length,
          dateVote: vote.updated_at,
          status: choices.length >= 3 ? 'Complet' : 'Incomplet',
          rawVote: vote,
          rawStudent: student
        })
      }
    })

    const relevantPFPs = config.pfps
    const relevantYears = [filterYear.value]
    eligibleStudents.forEach(student => {
      relevantPFPs.forEach(pfpType => {
        relevantYears.forEach(year => {
          const studentId = student.id || student.user_id || student.firebase_id
          if (!studentId) return
          const key = `${studentId}-${pfpType}-${year}`
          if (!votationsMap.has(key)) {
            votationsMap.set(key, {
              id: null,
              userId: studentId,
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
    excludedAssignedStudentsCount.value = 0
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données: ' + error.message, life: 5000 })
  } finally {
    loading.value = false
  }
}

const updateStats = () => {
  const filtered = votationsList.value.filter(v =>
    v.pfpType === filterPFP.value && isYearMatch(v.year, filterYear.value)
  )
  const total = filtered.length
  const completed = filtered.filter(v => v.status === 'Complet').length
  const incomplete = filtered.filter(v => v.status === 'Incomplet').length
  const notVoted = filtered.filter(v => v.status === 'Non voté').length
  stats.value = { total, completed, pending: notVoted, incomplete }
}

const viewDetails = (data) => {
  if (!data.rawVote) return
  console.log('Détails du vote:', data)
  toast.add({ severity: 'info', summary: 'Détails du vote', detail: `${data.prenom} ${data.nom} - ${data.nbChoix} choix`, life: 3000 })
}

const remindStudent = (data) => {
  console.log('Relancer étudiant:', data)
  toast.add({ severity: 'info', summary: 'Relance', detail: `Relance envoyée à ${data.prenom} ${data.nom}`, life: 3000 })
}

const remindAllNonVoters = () => {
  const nonVoters = filteredVotationsList.value.filter(v => v.status === 'Non voté')
  if (nonVoters.length === 0) {
    toast.add({ severity: 'info', summary: 'Information', detail: 'Aucun étudiant à relancer', life: 3000 })
    return
  }
  console.log(`Relancer ${nonVoters.length} étudiants qui n'ont pas voté`)
  toast.add({ severity: 'success', summary: 'Relances envoyées', detail: `${nonVoters.length} relances envoyées aux étudiants n'ayant pas voté`, life: 5000 })
}

const exportResults = () => {
  if (algorithmResults.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Aucune donnée', detail: 'Pas de résultats à exporter', life: 3000 })
    return
  }
  const headers = ['Étudiant', 'Place Attribuée', 'Institution', 'Rang du Choix', 'Score de Priorité']
  const rows = algorithmResults.value.map(result => [
    getStudentName(result.user_id),
    result.assigned_place_name,
    result.assigned_institution_name,
    result.assigned_rank === 99 ? 'Aléatoire' : `${result.assigned_rank}er choix`,
    result.priority_score ? result.priority_score.toFixed(1) : 'N/A'
  ])
  const csvContent = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `attributions_${filterPFP.value}_${filterYear.value}_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  addAdminAction('Export résultats algorithme', `${algorithmResults.value.length} attributions exportées`)
  toast.add({ severity: 'success', summary: 'Export réussi', detail: `${algorithmResults.value.length} attributions exportées`, life: 3000 })
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
        row.nom, row.prenom, row.classe, row.pfpType, row.year,
        row.choix1 || '', row.choix1Institution || '', row.choice1PlaceId || '',
        row.choix2 || '', row.choix2Institution || '', row.choice2PlaceId || '',
        row.choix3 || '', row.choix3Institution || '', row.choice3PlaceId || '',
        row.choix4 || '', row.choix4Institution || '', row.choice4PlaceId || '',
        row.choix5 || '', row.choix5Institution || '', row.choice5PlaceId || '',
        row.nbChoix, row.dateVote ? formatDate(row.dateVote) : '', row.status
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
    addAdminAction('Export votes', `${dataToExport.length} lignes exportées`)
    toast.add({ severity: 'success', summary: 'Export réussi', detail: `${dataToExport.length} lignes exportées`, life: 3000 })
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'exporter les données', life: 5000 })
  }
}

onMounted(() => {
  // Data loads via watchers when class/pfp/year are selected
})
</script>

<style scoped>
.votation-page {
  min-height: 100%;
}

.session-sticky-banner {
  position: sticky;
  top: 0.5rem;
  z-index: 6;
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--surface-border);
  font-size: 0.9rem;
}

.session-sticky-banner--open {
  background: #ecfdf3;
  color: #166534;
}

.session-sticky-banner--closed {
  background: #fff7ed;
  color: #9a3412;
}

.checklist-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}

.checklist-card {
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  padding: 0.75rem;
}

.checklist-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.45rem;
  cursor: pointer;
}

.checklist-item:last-child {
  margin-bottom: 0;
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
