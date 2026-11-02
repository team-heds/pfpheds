<template>
  <AdminLayout>
    <div class="cas-page p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">Secrétariat</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Suivi des cas particuliers</span>
      </div>

      <!-- Header -->
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-4 case-header">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3 case-header__intro">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-exclamation-triangle text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Suivi des cas particuliers</h1>
              <p class="text-600 m-0 mt-1">Regroupez les étudiants SAE, lésés et en échec de stage, puis consultez leur suivi PFP.</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button
              v-if="activeTab === 0"
              icon="pi pi-download"
              label="Exporter"
              outlined
              class="p-button-sm"
              @click="exportCSV"
            />
            <Button
              icon="pi pi-refresh"
              label="Actualiser"
              outlined
              class="p-button-sm"
              @click="refreshActiveTab"
              :loading="activeTabLoading"
            />
          </div>
        </div>

        <div class="filter-toolbar" role="search" aria-label="Filtrer les étudiants">
          <div class="filter-field filter-field--search">
              <label for="case-search" class="font-semibold text-sm">Rechercher un étudiant</label>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText
                  id="case-search"
                  v-model="searchTerm"
                  placeholder="Nom ou prénom"
                  class="w-full"
                  autocomplete="off"
                />
              </span>
          </div>
          <div class="filter-field">
              <label for="case-class" class="font-semibold text-sm">Classe</label>
              <Dropdown
                inputId="case-class"
                v-model="filterClasse"
                :options="classesList"
                placeholder="Toutes les classes"
                class="w-full"
                showClear
              />
          </div>
          <div v-if="activeTab === 0" class="filter-field">
              <label for="case-color" class="font-semibold text-sm">Couleur</label>
              <Dropdown
                inputId="case-color"
                v-model="filterColor"
                :options="colorFilterOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Toutes les couleurs"
                class="w-full"
                showClear
              />
          </div>
          <div v-if="activeTab === 0" class="filter-field">
              <label for="case-display" class="font-semibold text-sm">État du suivi</label>
              <Dropdown
                inputId="case-display"
                v-model="filterDisplay"
                :options="displayOptions"
                optionLabel="label"
                optionValue="value"
                class="w-full"
              />
          </div>

          <Button
            icon="pi pi-filter-slash"
            label="Réinitialiser"
            text
            class="filter-reset"
            :disabled="activeFilterCount === 0"
            @click="resetFilters"
          />
        </div>

        <div class="filter-summary" aria-live="polite">
          <span><strong>{{ currentResultCount }}</strong> {{ currentResultLabel }}</span>
          <span v-if="activeFilterCount" class="filter-summary__active">
            {{ activeFilterCount }} {{ activeFilterCount > 1 ? 'filtres actifs' : 'filtre actif' }}
          </span>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Étudiants suivis</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-flag text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.withComments }}</h3>
                <p class="text-600 m-0">Avec commentaire</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-exclamation-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.redCount }}</h3>
                <p class="text-600 m-0">Alertes rouges</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-3 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.greenCount }}</h3>
                <p class="text-600 m-0">Cas résolus</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TabView v-model:activeIndex="activeTab">
        <!-- Onglet 1 : tous les étudiants relevant d'au moins un cas particulier -->
        <TabPanel header="Tous les cas particuliers">
          <!-- Légende couleurs -->
          <div class="flex gap-2 align-items-center mb-3 px-1">
            <span class="text-sm text-600 font-semibold">Légende :</span>
            <span class="legend-dot legend-vert"></span><span class="text-xs text-600">Vert</span>
            <span class="legend-dot legend-orange"></span><span class="text-xs text-600">Orange</span>
            <span class="legend-dot legend-rouge"></span><span class="text-xs text-600">Rouge</span>
            <span class="legend-dot legend-noir"></span><span class="text-xs text-600">Noir</span>
            <span class="legend-dot legend-blanc"></span><span class="text-xs text-600">Blanc</span>
          </div>

          <!-- Table -->
          <div class="surface-card p-4 border-round shadow-2">
            <DataTable
              :value="filteredCases"
              :loading="loading"
              responsiveLayout="scroll"
              :paginator="true"
              :rows="50"
              :rowsPerPageOptions="[20, 50, 100]"
              :rowHover="true"
              dataKey="user_id"
              scrollable
              scrollHeight="flex"
              class="cas-table p-datatable-sm"
              :sortField="'etudiant'"
              :sortOrder="1"
            >
              <template #header>
                <div class="flex justify-content-between align-items-center">
                  <span class="text-xl text-900 font-bold">Tous les cas particuliers ({{ filteredCases.length }})</span>
                </div>
              </template>
              <template #empty>
                <div class="text-center p-4">
                  <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
                  <p class="text-600">Aucun cas particulier ne correspond aux filtres.</p>
                </div>
              </template>

              <Column field="etudiant" header="Étudiant" :frozen="true" sortable style="min-width: 180px">
                <template #body="{ data }">
                  <span class="font-semibold text-900">{{ data.etudiant }}</span>
                </template>
              </Column>
              <Column field="classe" header="Classe" sortable style="min-width: 80px">
                <template #body="{ data }">
                  <Tag :value="data.classe" severity="info" class="text-xs" />
                </template>
              </Column>
              <Column header="Type de cas" style="min-width: 210px">
                <template #body="{ data }">
                  <div class="case-type-list">
                    <Tag
                      v-for="category in getCaseTypes(data)"
                      :key="category.value"
                      :value="category.label"
                      :severity="category.severity"
                      class="text-xs"
                    />
                  </div>
                </template>
              </Column>
              <Column header="SAE" style="min-width: 110px">
                <template #body="{ data }">
                  <div
                    @click="openCellDialog(data, 'sae')"
                    :style="getCellStyle(data.sae)"
                    :class="['cell-box', 'cell-sae', { 'cell-has-content': data.sae?.couleur && data.sae.couleur !== 'blanc' }]"
                    :title="data.sae?.commentaire || 'Marquer / suivre un cas SAE'"
                  >
                    <i class="pi pi-star-fill text-xs mr-1" v-if="data.sae?.couleur && data.sae.couleur !== 'blanc'"></i>
                    <div v-if="data.sae?.commentaire" class="cell-text">
                      {{ truncate(data.sae.commentaire, 10) }}
                    </div>
                    <i v-else class="pi pi-plus text-400 text-xs"></i>
                  </div>
                </template>
              </Column>
              <template v-for="group in pfpGroups" :key="group.base">
                <Column :header="group.label" style="min-width: 90px">
                  <template #body="{ data }">
                    <div
                      @click="openCellDialog(data, group.base)"
                      :style="getCellStyle(data[group.base])"
                      class="cell-box"
                      :title="data[group.base]?.commentaire || 'Cliquez pour éditer'"
                    >
                      <i v-if="hasDateChange(data.user_id, group.base)" class="pi pi-calendar cell-badge" title="Changement de date enregistré"></i>
                      <div v-if="data[group.base]?.commentaire" class="cell-text">
                        {{ truncate(data[group.base].commentaire, 10) }}
                      </div>
                      <i v-else class="pi pi-minus text-400 text-xs"></i>
                    </div>
                  </template>
                </Column>
                <Column :header="group.label + '\''" style="min-width: 90px">
                  <template #body="{ data }">
                    <div v-if="hasEchec(data.user_id, group.echecTypes)"
                      @click="openCellDialog(data, group.prime)"
                      :style="getCellStyle(data[group.prime])"
                      class="cell-box"
                      :title="data[group.prime]?.commentaire || 'Cliquez pour éditer'"
                    >
                      <i v-if="hasDateChange(data.user_id, group.prime)" class="pi pi-calendar cell-badge" title="Changement de date enregistré"></i>
                      <div v-if="data[group.prime]?.commentaire" class="cell-text">
                        {{ truncate(data[group.prime].commentaire, 10) }}
                      </div>
                      <i v-else class="pi pi-minus text-400 text-xs"></i>
                    </div>
                    <div v-else class="cell-box cell-disabled" title="PFP non échouée">
                      <i class="pi pi-lock text-300 text-xs"></i>
                    </div>
                  </template>
                </Column>
              </template>
              <Column header="Info étudiant" style="min-width: 130px">
                <template #body="{ data }">
                  <button type="button"
                    @click="openInfoDialog(data)"
                    :class="['cell-box', 'cell-info', { 'cell-has-content': data.info_etudiant?.commentaire }]"
                    :title="data.info_etudiant?.commentaire || 'Cliquez pour éditer'"
                    :aria-label="`Modifier les informations de ${data.etudiant}`"
                  >
                    <span v-if="data.info_etudiant?.commentaire" class="cell-text">
                      {{ truncate(data.info_etudiant.commentaire, 14) }}
                    </span>
                    <i v-else class="pi pi-plus text-400 text-xs"></i>
                  </button>
                </template>
              </Column>
            </DataTable>
          </div>
        </TabPanel>

        <!-- Onglet 2 : étudiants lésés, par année et par PFP -->
        <TabPanel>
          <template #header>
            <span>Étudiants lésés</span>
            <Tag v-if="lesedList.length" :value="lesedList.length" severity="danger" class="ml-2 text-xs" />
          </template>

          <div class="flex gap-3 flex-wrap mb-3 align-items-end">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown v-model="lesedFilterYear" :options="lesedYears" placeholder="Toutes" class="w-full md:w-10rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown v-model="lesedFilterPfp" :options="lesedPfpTypes" placeholder="Tous" class="w-full md:w-10rem" showClear />
            </div>
            <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchLesedStudents" v-tooltip="'Rafraîchir'" :loading="loadingLesed" />
          </div>

          <div v-for="group in groupedLesed" :key="group.year + '-' + group.pfpType" class="surface-card p-3 border-round shadow-2 mb-3">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-exclamation-circle text-red-500"></i>
              <span class="font-bold text-900">{{ group.year }} — {{ group.pfpType }}</span>
              <Tag :value="`${group.items.length} étudiant(s)`" severity="danger" class="text-xs" />
            </div>
            <DataTable :value="group.items" class="p-datatable-sm" responsiveLayout="scroll">
              <Column field="etudiant" header="Étudiant" style="min-width: 180px" />
              <Column field="classe" header="Classe" style="min-width: 80px">
                <template #body="{ data }"><Tag :value="data.classe" severity="info" class="text-xs" /></template>
              </Column>
              <Column header="Motif" style="min-width: 160px">
                <template #body="{ data }">
                  <Tag
                    v-if="data.commentaire || (data.couleur && data.couleur !== 'blanc')"
                    :value="data.commentaire || getColorLabel(data.couleur)"
                    :style="getLesedMotifStyle(data)"
                    class="text-xs mr-1"
                  />
                  <Tag v-if="data.marqueLese" value="Marqué lésé (profil)" severity="warning" class="text-xs mr-1" />
                  <!--<Tag v-if="data.isFallback" value="Hors choix" severity="danger" class="text-xs" />-->

                </template>
              </Column>
              <Column field="assigned_place_name" header="Place assignée" style="min-width: 160px">
                <template #body="{ data }">{{ data.assigned_place_name || '—' }}</template>
              </Column>
              <Column field="assigned_institution_name" header="Institution" style="min-width: 180px">
                <template #body="{ data }">{{ data.assigned_institution_name || '—' }}</template>
              </Column>
              <Column header="Cas particuliers" style="min-width: 270px">
                <template #body="{ data }">
                  <SharedStudentFollowUp :student="casesById.get(data.user_id)" @edit="editSharedFollowUp(data.user_id, $event)" />
                </template>
              </Column>
              <Column header="Actions" style="min-width: 100px">
                <template #body="{ data }">
                  <Button icon="pi pi-folder-open" label="Éditer" size="small" outlined @click="openLesedFollowUp(data)" />
                </template>
              </Column>
            </DataTable>
          </div>
          <p v-if="!loadingLesed && groupedLesed.length === 0" class="text-600 text-center p-4">Aucun étudiant lésé pour ces filtres.</p>
        </TabPanel>

        <!-- Onglet 3 : étudiants en échec de stage, par année et par PFP -->
        <TabPanel>
          <template #header>
            <span>Échecs de stage</span>
            <Tag v-if="echecsList.length" :value="echecsList.length" severity="warning" class="ml-2 text-xs" />
          </template>

          <div class="flex gap-3 flex-wrap mb-3 align-items-end">
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Année :</label>
              <Dropdown v-model="echecFilterYear" :options="echecYears" placeholder="Toutes" class="w-full md:w-10rem" showClear />
            </div>
            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">PFP :</label>
              <Dropdown v-model="echecFilterPfp" :options="echecPfpTypes" placeholder="Tous" class="w-full md:w-10rem" showClear />
            </div>
            <Button icon="pi pi-refresh" outlined class="p-button-sm" @click="fetchEchecsStudents" v-tooltip="'Rafraîchir'" :loading="loadingEchecs" />
          </div>

          <div v-for="group in groupedEchecs" :key="group.year + '-' + group.pfpType" class="surface-card p-3 border-round shadow-2 mb-3">
            <div class="flex align-items-center gap-2 mb-2">
              <i class="pi pi-times-circle text-orange-500"></i>
              <span class="font-bold text-900">{{ group.year }} — {{ group.pfpType }}</span>
              <Tag :value="`${group.items.length} étudiant(s)`" severity="warning" class="text-xs" />
            </div>
            <DataTable :value="group.items" class="p-datatable-sm" responsiveLayout="scroll">
              <Column field="etudiant" header="Étudiant" style="min-width: 180px" />
              <Column field="classe" header="Classe" style="min-width: 80px">
                <template #body="{ data }"><Tag :value="data.classe" severity="info" class="text-xs" /></template>
              </Column>
              <Column field="assigned_place_name" header="Place" style="min-width: 160px">
                <template #body="{ data }">{{ data.assigned_place_name || '—' }}</template>
              </Column>
              <Column field="assigned_institution_name" header="Institution" style="min-width: 180px">
                <template #body="{ data }">{{ data.assigned_institution_name || '—' }}</template>
              </Column>
              <Column header="Statut" style="min-width: 140px">
                <template #body="{ data }">
                  <Tag v-if="data.pfp_arret" value="Arrêté" severity="danger" class="text-xs" />
                  <Tag v-else value="Échoué" severity="warning" class="text-xs" />
                </template>
              </Column>
              <Column field="commentaire_arret" header="Motif d'arrêt" style="min-width: 200px">
                <template #body="{ data }">{{ data.commentaire_arret || '—' }}</template>
              </Column>
              <Column header="Cas particuliers" style="min-width: 270px">
                <template #body="{ data }">
                  <SharedStudentFollowUp :student="casesById.get(data.user_id)" @edit="editSharedFollowUp(data.user_id, $event)" />
                </template>
              </Column>
              <Column header="Motif d’arrêt" style="min-width: 100px">
                <template #body="{ data }">
                  <Button icon="pi pi-folder-open" label="Éditer" size="small" outlined @click="openEchecFollowUp(data)" />
                </template>
              </Column>
            </DataTable>
          </div>
          <p v-if="!loadingEchecs && groupedEchecs.length === 0" class="text-600 text-center p-4">Aucun échec de stage pour ces filtres.</p>
        </TabPanel>

        <!-- Onglet 4 : liste des étudiants SAE, avec ajout rapide -->
        <TabPanel>
          <template #header>
            <span>Étudiants SAE</span>
            <Tag v-if="saeStudentsTotal" :value="saeStudentsTotal" severity="warning" class="ml-2 text-xs" />
          </template>

          <div class="surface-card p-3 border-round shadow-2 mb-3">
            <label class="font-semibold block mb-2">Marquer un étudiant SAE</label>
            <div class="flex gap-2 align-items-center flex-wrap">
              <AutoComplete
                v-model="saeSearchSelection"
                :suggestions="saeSearchSuggestions"
                optionLabel="etudiant"
                placeholder="Rechercher un étudiant par nom..."
                class="w-full md:w-20rem"
                @complete="searchSaeStudent"
                @item-select="markStudentSae"
              >
                <template #item="{ item }">
                  <div class="flex align-items-center gap-2">
                    <span>{{ item.etudiant }}</span>
                    <Tag :value="item.classe" severity="info" class="text-xs" />
                  </div>
                </template>
              </AutoComplete>
              <span class="text-xs text-600">Sélectionner un résultat l'ajoute directement à la liste ci-dessous.</span>
            </div>
          </div>

          <section class="sae-roster" aria-labelledby="sae-roster-title">
            <header class="sae-roster__header">
              <div>
                <h2 id="sae-roster-title">Étudiants SAE</h2>
                <p>
                  {{ saeStudentsList.length }} étudiant{{ saeStudentsList.length !== 1 ? 's' : '' }} affiché{{ saeStudentsList.length !== 1 ? 's' : '' }}
                  <template v-if="saeStudentsList.length !== saeStudentsTotal"> sur {{ saeStudentsTotal }}</template>
                </p>
              </div>
              <span class="sae-roster__hint"><i class="pi pi-info-circle" aria-hidden="true"></i>Ouvrez les autres suivis uniquement si nécessaire.</span>
            </header>

            <div v-if="saeStudentsList.length" class="sae-list">
              <article v-for="student in saeStudentsList" :key="student.user_id" class="sae-student-card">
                <header class="sae-student-card__header">
                  <div class="sae-student-card__identity">
                    <span class="sae-student-card__avatar" aria-hidden="true">{{ studentInitials(student.etudiant) }}</span>
                    <div>
                      <h3>{{ student.etudiant }}</h3>
                      <div class="sae-student-card__meta">
                        <Tag :value="student.classe" severity="info" class="text-xs" />
                        <span><i class="pi pi-star-fill" aria-hidden="true"></i>Suivi SAE actif</span>
                      </div>
                    </div>
                  </div>
                  <div class="sae-student-card__actions" aria-label="Actions de suivi">
                    <Button icon="pi pi-pencil" label="Modifier le suivi SAE" size="small" @click="openSAEFeaturesDialog(student, 'sae')" />
                    <Button icon="pi pi-times" label="Retirer du suivi" size="small" severity="danger" text @click="unmarkStudentSae(student)" />
                  </div>
                </header>

                <div class="sae-student-card__content">
                  <section class="sae-current-note" aria-label="Situation SAE actuelle">
                    <h4>Situation SAE actuelle</h4>
                    <p v-if="student.sae?.commentaire">{{ student.sae.commentaire }}</p>
                    <p v-else class="sae-current-note__empty">Aucune remarque SAE renseignée.</p>
                  </section>
                  <SharedStudentFollowUp
                    :student="student"
                    title="Autres cas particuliers"
                    :excluded-fields="['sae']"
                    @edit="editSharedFollowUp(student.user_id, $event)"
                  />
                </div>
              </article>
            </div>

            <div v-else class="sae-empty-state">
              <i class="pi pi-star" aria-hidden="true"></i>
              <h3>Aucun étudiant à afficher</h3>
              <p>{{ activeFilterCount ? 'Aucun étudiant SAE ne correspond aux filtres.' : "Aucun étudiant marqué SAE pour l'instant." }}</p>
            </div>
          </section>
        </TabPanel>
      </TabView>
    </div>

    <!-- Dialog pour éditer une cellule PFP : état courant + historique daté -->
    <Dialog v-model:visible="showCellDialog" :header="dialogTitle" :modal="true" :style="{ width: '640px' }" class="cas-cell-dialog">
      <div class="flex flex-column gap-4 p-1">

        <!-- État courant -->
        <div class="surface-ground p-3 border-round">
          <label class="font-semibold block mb-2">État actuel</label>
          <div class="flex gap-2 flex-wrap mb-3">
            <Button
              v-for="color in colorOptions"
              :key="color.value"
              :label="color.label"
              :class="{ 'p-button-outlined': editingCell?.couleur !== color.value }"
              :severity="color.severity"
              @click="editingCell.couleur = color.value"
              size="small"
            />
          </div>
          <Textarea
            v-model="editingCell.commentaire"
            rows="2"
            class="w-full"
            placeholder="Résumé rapide (optionnel)..."
          />
          <div class="flex justify-content-end mt-2">
            <Button label="Enregistrer l'état" icon="pi pi-check" size="small" @click="saveCellData" />
          </div>
        </div>

        <!-- Ajouter un événement à l'historique -->
        <div class="surface-card p-3 border-round border-1 surface-border">
          <label class="font-semibold block mb-2">Ajouter un événement</label>
          <div class="flex flex-column gap-2">
            <Dropdown
              v-model="newEvent.type_evenement"
              :options="eventTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <div v-if="newEvent.type_evenement === 'changement_date'" class="flex gap-2">
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Ancienne date</label>
                <Calendar v-model="newEvent.ancienne_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Nouvelle date</label>
                <Calendar v-model="newEvent.nouvelle_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
            </div>
            <Textarea
              v-model="newEvent.description"
              rows="2"
              class="w-full"
              placeholder="Détails, raison du changement..."
            />
            <div class="flex justify-content-end">
              <Button
                label="Ajouter à l'historique"
                icon="pi pi-plus"
                size="small"
                :loading="addingEvent"
                :disabled="!canAddEvent"
                @click="addHistoriqueEvent"
              />
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div>
          <label class="font-semibold block mb-2">Historique ({{ currentCellHistorique.length }})</label>
          <Timeline
            v-if="currentCellHistorique.length"
            :value="currentCellHistorique"
            align="left"
            class="cas-timeline"
          >
            <template #marker="{ item }">
              <div class="timeline-marker" :class="`marker-${eventTypeMeta(item.type_evenement).severity}`">
                <i :class="eventTypeMeta(item.type_evenement).icon"></i>
              </div>
            </template>
            <template #content="{ item }">
              <div class="timeline-event">
                <div class="flex align-items-center justify-content-between gap-2">
                  <Tag :value="eventTypeMeta(item.type_evenement).label" :severity="eventTypeMeta(item.type_evenement).severity" class="text-xs" />
                  <span class="text-xs text-600" :title="formatFullDate(item.created_at)">{{ formatRelativeDate(item.created_at) }}</span>
                </div>
                <div v-if="item.type_evenement === 'changement_date' && (item.ancienne_date || item.nouvelle_date)" class="date-change-line">
                  <span class="text-600">{{ item.ancienne_date ? formatDateOnly(item.ancienne_date) : '?' }}</span>
                  <i class="pi pi-arrow-right mx-2 text-xs"></i>
                  <span class="font-semibold">{{ item.nouvelle_date ? formatDateOnly(item.nouvelle_date) : '?' }}</span>
                </div>
                <p v-if="item.description" class="m-0 mt-1 text-sm">{{ item.description }}</p>
              </div>
            </template>
          </Timeline>
          <p v-else class="text-600 text-sm">Aucun événement enregistré pour l'instant.</p>
        </div>

        <div class="flex justify-content-end mt-1">
          <Button label="Fermer" severity="secondary" @click="closeCellDialog" />
        </div>
      </div>
    </Dialog>


    <!-- Dialog étudiants lésés - édition des particularités -->
    <Dialog v-model:visible="showLesedFeaturesDialog" :header="dialogTitle" :modal="true" :style="{ width: '640px' }" class="cas-cell-dialog">
      <div class="flex flex-column gap-4 p-1">

        <!-- État courant -->
        <div class="surface-ground p-3 border-round">
          <label class="font-semibold block mb-2">Motif</label>
          <div class="flex gap-2 flex-wrap mb-3">
            <Button
              v-for="color in colorOptions"
              :key="color.value"
              :label="color.label"
              :class="{ 'p-button-outlined': editingCell?.couleur !== color.value }"
              :severity="color.severity"
              @click="editingCell.couleur = color.value"
              size="small"
            />
          </div>
          <Textarea
            v-model="editingCell.commentaire"
            rows="2"
            class="w-full"
            placeholder="Indiquer le motif ici..."
          />
          <div class="flex justify-content-end mt-2">
          </div>
        </div>

        <!-- Ajouter un événement à l'historique -->
        <div class="surface-card p-3 border-round border-1 surface-border">
          <label class="font-semibold block mb-2">Ajouter un événement</label>
          <div class="flex flex-column gap-2">
            <Dropdown
              v-model="newEvent.type_evenement"
              :options="eventTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <div v-if="newEvent.type_evenement === 'changement_date'" class="flex gap-2">
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Ancienne date</label>
                <Calendar v-model="newEvent.ancienne_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Nouvelle date</label>
                <Calendar v-model="newEvent.nouvelle_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
            </div>
            <Textarea
              v-model="newEvent.description"
              rows="2"
              class="w-full"
              placeholder="Détails, raison du changement..."
            />
            <div class="flex justify-content-end">
              <Button
                label="Ajouter à l'historique"
                icon="pi pi-plus"
                size="small"
                :loading="addingEvent"
                :disabled="!canAddEvent"
                @click="addHistoriqueEvent"
              />
            </div>
          </div>
        </div>

        <!-- Historique -->
        <div>
          <label class="font-semibold block mb-2">Historique ({{ currentCellHistorique.length }})</label>
          <Timeline
            v-if="currentCellHistorique.length"
            :value="currentCellHistorique"
            align="left"
            class="cas-timeline"
          >
            <template #marker="{ item }">
              <div class="timeline-marker" :class="`marker-${eventTypeMeta(item.type_evenement).severity}`">
                <i :class="eventTypeMeta(item.type_evenement).icon"></i>
              </div>
            </template>
            <template #content="{ item }">
              <div class="timeline-event">
                <div class="flex align-items-center justify-content-between gap-2">
                  <Tag :value="eventTypeMeta(item.type_evenement).label" :severity="eventTypeMeta(item.type_evenement).severity" class="text-xs" />
                  <span class="text-xs text-600" :title="formatFullDate(item.created_at)">{{ formatRelativeDate(item.created_at) }}</span>
                </div>
                <div v-if="item.type_evenement === 'changement_date' && (item.ancienne_date || item.nouvelle_date)" class="date-change-line">
                  <span class="text-600">{{ item.ancienne_date ? formatDateOnly(item.ancienne_date) : '?' }}</span>
                  <i class="pi pi-arrow-right mx-2 text-xs"></i>
                  <span class="font-semibold">{{ item.nouvelle_date ? formatDateOnly(item.nouvelle_date) : '?' }}</span>
                </div>
                <p v-if="item.description" class="m-0 mt-1 text-sm">{{ item.description }}</p>
              </div>
            </template>
          </Timeline>
          <p v-else class="text-600 text-sm">Aucun événement enregistré pour l'instant.</p>
        </div>


        <div class="flex justify-content-end mt-1">
          <Button label="Annuler" class="mr-2" severity="secondary" @click="closeLesedFeaturesDialog" />
          <Button label="Valider" icon="pi pi-check" size="small" @click="saveLesedFeaturesData" />
        </div>
      </div>
    </Dialog>


    <!-- Dialog échec de stage - édition des particularités -->
    <Dialog v-model:visible="showEchecFeaturesDialog" :header="dialogTitle" :modal="true" :style="{ width: '640px' }" class="cas-cell-dialog">
      <div class="flex flex-column gap-4 p-1">

        <!-- État courant -->
        <div class="surface-ground p-3 border-round">
          <label class="font-semibold block mb-2">Motif</label>

          <Textarea
            v-model="editingCell.commentaire"
            rows="2"
            class="w-full"
            placeholder="Indiquer le motif ici..."
          />
          <div class="flex justify-content-end mt-2">
          </div>
        </div>

        <!-- Ajout évt. historique - Echec stage -->
        <div class="surface-card p-3 border-round border-1 surface-border">
          <label class="font-semibold block mb-2">Ajouter un événement</label>
          <div class="flex flex-column gap-2">
            <Dropdown
              v-model="newEvent.type_evenement"
              :options="eventTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <div v-if="newEvent.type_evenement === 'changement_date'" class="flex gap-2">
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Ancienne date</label>
                <Calendar v-model="newEvent.ancienne_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Nouvelle date</label>
                <Calendar v-model="newEvent.nouvelle_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
            </div>
            <Textarea
              v-model="newEvent.description"
              rows="2"
              class="w-full"
              placeholder="Détails, raison du changement..."
            />
            <div class="flex justify-content-end">
              <Button
                label="Ajouter à l'historique"
                icon="pi pi-plus"
                size="small"
                :loading="addingEvent"
                :disabled="!canAddEvent"
                @click="addHistoriqueEvent"
              />
            </div>
          </div>
        </div>

        <!-- Historique - Echec Stage -->
        <div>
          <label class="font-semibold block mb-2">Historique ({{ currentCellHistorique.length }})</label>
          <Timeline
            v-if="currentCellHistorique.length"
            :value="currentCellHistorique"
            align="left"
            class="cas-timeline"
          >
            <template #marker="{ item }">
              <div class="timeline-marker" :class="`marker-${eventTypeMeta(item.type_evenement).severity}`">
                <i :class="eventTypeMeta(item.type_evenement).icon"></i>
              </div>
            </template>
            <template #content="{ item }">
              <div class="timeline-event">
                <div class="flex align-items-center justify-content-between gap-2">
                  <Tag :value="eventTypeMeta(item.type_evenement).label" :severity="eventTypeMeta(item.type_evenement).severity" class="text-xs" />
                  <span class="text-xs text-600" :title="formatFullDate(item.created_at)">{{ formatRelativeDate(item.created_at) }}</span>
                </div>
                <div v-if="item.type_evenement === 'changement_date' && (item.ancienne_date || item.nouvelle_date)" class="date-change-line">
                  <span class="text-600">{{ item.ancienne_date ? formatDateOnly(item.ancienne_date) : '?' }}</span>
                  <i class="pi pi-arrow-right mx-2 text-xs"></i>
                  <span class="font-semibold">{{ item.nouvelle_date ? formatDateOnly(item.nouvelle_date) : '?' }}</span>
                </div>
                <p v-if="item.description" class="m-0 mt-1 text-sm">{{ item.description }}</p>
              </div>
            </template>
          </Timeline>
          <p v-else class="text-600 text-sm">Aucun événement enregistré pour l'instant.</p>
        </div>

        <div class="flex justify-content-end mt-1">
          <Button label="Annuler" class="mr-2" severity="secondary" @click="closeEchecFeaturesDialog" />
          <Button label="Valider" icon="pi pi-check" size="small" @click="saveEchecFeaturesData" />
        </div>
      </div>
    </Dialog>

    <!-- Dialog étudiants SAE - édition des particularités -->
    <Dialog v-model:visible="showSAEFeaturesDialog" :header="dialogTitle" :modal="true" :style="{ width: '640px' }" class="cas-cell-dialog">
      <div class="flex flex-column gap-4 p-1">


        <!-- Ajouter/éditer les particularités -->
        <div class="surface-card p-3 border-round border-1 surface-border">
          <label class="font-semibold block mb-2">Particularités</label>
          <div class="flex flex-column gap-2">

            <Textarea
              v-model="editingCell.commentaire"
              rows="2"
              class="w-full"
              placeholder="Entrer les particularités du statut SAE ici..."
            />
            <!--<div class="flex justify-content-end">
                <Button label="Enregistrer l'état" icon="pi pi-check" size="small" @click="saveCellData" />
            </div>-->
          </div>
        </div>

        <!-- Ajout évt. historique - SAE -->
        <div class="surface-card p-3 border-round border-1 surface-border">
          <label class="font-semibold block mb-2">Ajouter un événement</label>
          <div class="flex flex-column gap-2">
            <Dropdown
              v-model="newEvent.type_evenement"
              :options="eventTypeOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <div v-if="newEvent.type_evenement === 'changement_date'" class="flex gap-2">
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Ancienne date</label>
                <Calendar v-model="newEvent.ancienne_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
              <div class="flex-1 flex flex-column gap-1">
                <label class="text-xs text-600">Nouvelle date</label>
                <Calendar v-model="newEvent.nouvelle_date" dateFormat="dd/mm/yy" showIcon class="w-full" />
              </div>
            </div>
            <Textarea
              v-model="newEvent.description"
              rows="2"
              class="w-full"
              placeholder="Détails, raison du changement..."
            />
            <div class="flex justify-content-end">
              <Button
                label="Ajouter à l'historique"
                icon="pi pi-plus"
                size="small"
                :loading="addingEvent"
                :disabled="!canAddEvent"
                @click="addHistoriqueEvent"
              />
            </div>
          </div>
        </div>

        <!-- Historique - SAE -->
        <div>
          <label class="font-semibold block mb-2">Historique ({{ currentCellHistorique.length }})</label>
          <Timeline
            v-if="currentCellHistorique.length"
            :value="currentCellHistorique"
            align="left"
            class="cas-timeline"
          >
            <template #marker="{ item }">
              <div class="timeline-marker" :class="`marker-${eventTypeMeta(item.type_evenement).severity}`">
                <i :class="eventTypeMeta(item.type_evenement).icon"></i>
              </div>
            </template>
            <template #content="{ item }">
              <div class="timeline-event">
                <div class="flex align-items-center justify-content-between gap-2">
                  <Tag :value="eventTypeMeta(item.type_evenement).label" :severity="eventTypeMeta(item.type_evenement).severity" class="text-xs" />
                  <span class="text-xs text-600" :title="formatFullDate(item.created_at)">{{ formatRelativeDate(item.created_at) }}</span>
                </div>
                <div v-if="item.type_evenement === 'changement_date' && (item.ancienne_date || item.nouvelle_date)" class="date-change-line">
                  <span class="text-600">{{ item.ancienne_date ? formatDateOnly(item.ancienne_date) : '?' }}</span>
                  <i class="pi pi-arrow-right mx-2 text-xs"></i>
                  <span class="font-semibold">{{ item.nouvelle_date ? formatDateOnly(item.nouvelle_date) : '?' }}</span>
                </div>
                <p v-if="item.description" class="m-0 mt-1 text-sm">{{ item.description }}</p>
              </div>
            </template>
          </Timeline>
          <p v-else class="text-600 text-sm">Aucun événement enregistré pour l'instant.</p>
        </div>

        <div class="flex justify-content-end mt-1">
          <Button class="mr-2" label="Fermer" severity="secondary" @click="closeSAEFeaturesDialog" />
          <Button
            label="Valider"
            icon="pi pi-check"
            size="small"
            @click="saveSAEFeaturesData"
          />
        </div>
      </div>
    </Dialog>
    <!-- Fin Dialog SAE -->

    <!-- Dialog pour éditer les infos étudiant -->
    <Dialog v-model:visible="showInfoDialog" :header="infoDialogTitle" :modal="true" :style="{ width: '500px' }">
      <div class="flex flex-column gap-3 p-3">
        <div class="flex flex-column gap-2">
          <label class="font-semibold">Commentaire sur l'étudiant :</label>
          <Textarea
            v-model="editingInfo.commentaire"
            rows="6"
            class="w-full"
            placeholder="Ajoutez des informations sur cet étudiant..."
          />
        </div>
        <div class="flex justify-content-end gap-2 mt-3">
          <Button label="Annuler" severity="secondary" @click="closeInfoDialog" />
          <Button label="Enregistrer" @click="saveInfoData" />
        </div>
      </div>
    </Dialog>
    <Toast />
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '@/supabase'
import { FAILED_PFP_GRADE_FIELDS, isFailedPfpGrade } from '@/service/pfpFailureService'
import {
  filterStudents,
  getStudentCaseCategories,
  hasCaseFollowUp,
  isActiveSaeFollowUp,
  matchesStudentFilters
} from '@/domain/pfp/caseFollowUpFilters'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import SharedStudentFollowUp from '@/components/admin/SharedStudentFollowUp.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Button from 'primevue/button'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Calendar from 'primevue/calendar'
import Timeline from 'primevue/timeline'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import AutoComplete from 'primevue/autocomplete'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import { getAllStudents } from '@/service/studentDirectoryService'

const authStore = useAuthStore()

const toast = useToast()
const loading = ref(false)
const activeTab = ref(0)
const cases = ref([])
const casesById = computed(() => new Map(cases.value.map(student => [student.user_id, student])))
const editSharedFollowUp = (userId, field) => {
  const student = casesById.value.get(userId)
  if (!student) return
  if (field === 'info_etudiant') openInfoDialog(student)
  else openCellDialog(student, field)
}
const filterDisplay = ref('all')
const filterClasse = ref(null)
const filterColor = ref(null)
const searchTerm = ref('')
// Liste dynamique construite depuis les vraies données (ne jamais figer en dur :
// une classe/année réelle absente de cette liste devient invisible dans le filtre)
const classesList = computed(() => {
  const classes = new Set(cases.value.map(c => c.classe).filter(c => c && c !== '-'))
  return [...classes].sort()
})

const showCellDialog = ref(false)
const showLesedFeaturesDialog = ref(false)
const showEchecFeaturesDialog = ref(false)
const showSAEFeaturesDialog = ref(false)
const showInfoDialog = ref(false)
const editingCell = ref(null)
const editingInfo = ref(null)
const editingStudent = ref(null)
const editingField = ref(null)
const editingEchecRow = ref(null)
const dialogTitle = ref('')
const infoDialogTitle = ref('')

const pfpFields = ['pfp1', 'pfp1_prime', 'pfp2', 'pfp2_prime', 'pfp3', 'pfp3_prime', 'pfp4', 'pfp4_prime', 'sae']

const pfpGroups = [
  { base: 'pfp1', prime: 'pfp1_prime', label: 'PFP1', echecTypes: ['PFP1A', 'PFP1B'] },
  { base: 'pfp2', prime: 'pfp2_prime', label: 'PFP2', echecTypes: ['PFP2'] },
  { base: 'pfp3', prime: 'pfp3_prime', label: 'PFP3', echecTypes: ['PFP3'] },
  { base: 'pfp4', prime: 'pfp4_prime', label: 'PFP4', echecTypes: ['PFP4'] }
]

const fieldLabels = {
  'pfp1': 'PFP1',
  'pfp1_prime': "PFP1'",
  'pfp2': 'PFP2',
  'pfp2_prime': "PFP2'",
  'pfp3': 'PFP3',
  'pfp3_prime': "PFP3'",
  'pfp4': 'PFP4',
  'pfp4_prime': "PFP4'",
  'sae': 'SAE'
}

const echecMap = ref(new Map())

const hasEchec = (userId, echecTypes) => {
  const userEchecs = echecMap.value.get(userId)
  if (!userEchecs) return false
  return echecTypes.some(type => userEchecs.has(type))
}

const displayOptions = [
  { label: 'Tous les cas particuliers', value: 'all' },
  { label: 'Avec commentaire', value: 'with_comments' },
  { label: 'Sans commentaire', value: 'no_comments' }
]

const colorFilterOptions = [
  { label: 'Vert', value: 'vert' },
  { label: 'Orange', value: 'orange' },
  { label: 'Rouge', value: 'rouge' },
  { label: 'Noir', value: 'noir' }
]

const colorOptions = [
  { label: 'Blanc', value: 'blanc', severity: 'info' },
  { label: 'Vert', value: 'vert', severity: 'success' },
  { label: 'Orange', value: 'orange', severity: 'warning' },
  { label: 'Rouge', value: 'rouge', severity: 'danger' },
  { label: 'Noir', value: 'noir', severity: 'secondary' }
]

// --- Historique des événements (changement de date, institution, absence, note) ---
const historiqueList = ref([])
const addingEvent = ref(false)
const newEvent = ref({ type_evenement: 'note', ancienne_date: null, nouvelle_date: null, description: '' })

const eventTypeOptions = [
  { label: 'Changement de date', value: 'changement_date' },
  { label: "Changement d'institution", value: 'changement_institution' },
  { label: 'Absence', value: 'absence' },
  { label: 'Note', value: 'note' }
]

const eventTypeMetaMap = {
  changement_date: { icon: 'pi pi-calendar', label: 'Changement de date', severity: 'info' },
  changement_institution: { icon: 'pi pi-building', label: "Changement d'institution", severity: 'warning' },
  absence: { icon: 'pi pi-user-minus', label: 'Absence', severity: 'danger' },
  note: { icon: 'pi pi-comment', label: 'Note', severity: 'secondary' }
}
const eventTypeMeta = (type) => eventTypeMetaMap[type] || eventTypeMetaMap.note

const currentCellHistorique = computed(() => {
  if (!editingStudent.value || !editingField.value) return []
  return historiqueList.value
    .filter(h => h.user_id === editingStudent.value.user_id && h.pfp_field === editingField.value)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const canAddEvent = computed(() => {
  if (newEvent.value.type_evenement === 'changement_date') {
    return !!(newEvent.value.ancienne_date || newEvent.value.nouvelle_date)
  }
  return !!newEvent.value.description?.trim()
})

const dateChangeSet = computed(() => {
  const set = new Set()
  historiqueList.value.forEach(h => {
    if (h.type_evenement === 'changement_date') set.add(`${h.user_id}_${h.pfp_field}`)
  })
  return set
})

const hasDateChange = (userId, field) => dateChangeSet.value.has(`${userId}_${field}`)

const formatDateOnly = (date) => {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const formatFullDate = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('fr-CH')
}

const formatRelativeDate = (date) => {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const diffMin = Math.round(diffMs / 60000)
  if (diffMin < 1) return "à l'instant"
  if (diffMin < 60) return `il y a ${diffMin} min`
  const diffH = Math.round(diffMin / 60)
  if (diffH < 24) return `il y a ${diffH} h`
  const diffJ = Math.round(diffH / 24)
  if (diffJ < 30) return `il y a ${diffJ} j`
  return formatDateOnly(date)
}

const resetNewEvent = () => {
  newEvent.value = { type_evenement: 'note', ancienne_date: null, nouvelle_date: null, description: '' }
}

const addHistoriqueEvent = async () => {
  if (!editingStudent.value || !editingField.value || !canAddEvent.value) return
  addingEvent.value = true
  try {
    const currentUser = authStore.user
    const payload = {
      user_id: editingStudent.value.user_id,
      pfp_field: editingField.value,
      type_evenement: newEvent.value.type_evenement,
      ancienne_date: newEvent.value.ancienne_date ? toIsoDate(newEvent.value.ancienne_date) : null,
      nouvelle_date: newEvent.value.nouvelle_date ? toIsoDate(newEvent.value.nouvelle_date) : null,
      description: newEvent.value.description?.trim() || null,
      couleur: editingCell.value?.couleur || null,
      created_by: currentUser?.id || currentUser?.uid || null,
      created_by_name: currentUser?.email || currentUser?.user_metadata?.full_name || null
    }

    const { data, error } = await supabase
      .from('cas_particuliers_historique')
      .insert(payload)
      .select()
      .single()

    if (error) throw error

    historiqueList.value.unshift(data)
    resetNewEvent()
    toast.add({ severity: 'success', summary: 'Ajouté', detail: "Événement ajouté à l'historique", life: 2000 })
  } catch (e) {
    console.error('Erreur addHistoriqueEvent:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible d'ajouter l'événement: " + e.message, life: 3000 })
  } finally {
    addingEvent.value = false
  }
}

const toIsoDate = (d) => {
  if (typeof d === 'string') return d
  const dt = new Date(d)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}

// --- Onglet "Étudiants lésés" : par année et par PFP ---
// Deux signaux combinés : StudentsPhysio.lese (marqué manuellement) et assigned_rank = 99
// (fallback algorithmique = 0 critère manquant couvert, voir domains/votation-algorithm.md)
const lesedList = ref([])
const loadingLesed = ref(false)
const lesedFilterYear = ref(null)
const lesedFilterPfp = ref(null)

const lesedYears = computed(() => {
  const years = new Set(lesedList.value.map(l => l.year).filter(Boolean))
  return [...years].sort().reverse()
})
const lesedPfpTypes = computed(() => {
  const types = new Set(lesedList.value.map(l => l.pfp_type).filter(Boolean))
  return [...types].sort()
})

// Correspondance pfp_type (student_result_vote) -> pfp_field (suivi_cas_particuliers)
const pfpTypeToField = (pfpType) => {
  const group = pfpGroups.find(g => g.echecTypes.includes(pfpType))
  return group ? group.base : null
}

const filteredLesedRows = computed(() => {
  let list = filterStudents(lesedList.value, { query: searchTerm.value, classe: filterClasse.value })
  if (lesedFilterYear.value) list = list.filter(l => String(l.year) === String(lesedFilterYear.value))
  if (lesedFilterPfp.value) list = list.filter(l => l.pfp_type === lesedFilterPfp.value)
  return list
})

const groupedLesed = computed(() => {
  const list = filteredLesedRows.value

  const groups = new Map()
  list.forEach(l => {
    const key = `${l.year}_${l.pfp_type}`
    if (!groups.has(key)) groups.set(key, { year: l.year, pfpType: l.pfp_type, items: [] })
    groups.get(key).items.push(l)
  })

  return [...groups.values()].sort((a, b) => {
    if (b.year !== a.year) return b.year.localeCompare(a.year)
    return a.pfpType.localeCompare(b.pfpType)
  })
})

const fetchLesedStudents = async () => {
  loadingLesed.value = true
  try {
    const [{ data: fallbacks, error: fallbackError }, { data: studentsLese, error: leseError }] = await Promise.all([
      supabase
        .from('student_result_vote')
        .select('user_id, pfp_type, year, assigned_place_name, assigned_institution_name, assigned_rank')
        .eq('assigned_rank', 99),
      supabase
        .from('StudentsPhysio')
        .select('user_id, lese, class, year')
        .eq('lese', true)
    ])

    if (fallbackError) throw fallbackError
    if (leseError) throw leseError

    const userIds = new Set([
      ...(fallbacks || []).map(f => f.user_id),
      ...(studentsLese || []).map(s => s.user_id)
    ])

    if (userIds.size === 0) {
      lesedList.value = []
      return
    }

    const [studentDirectory, { data: suivis, error: suivisError }] = await Promise.all([
      getAllStudents(),
      supabase
        .from('suivi_cas_particuliers')
        .select('user_id, pfp_field, couleur, commentaire')
        .in('user_id', [...userIds])
    ])
    if (suivisError) throw suivisError

    const profiles = studentDirectory.filter(profile => userIds.has(profile.user_id))
    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]))
    const leseSet = new Set((studentsLese || []).map(s => s.user_id))
    const suivisMap = new Map((suivis || []).map(s => [`${s.user_id}_${s.pfp_field}`, {
      couleur: s.couleur || 'blanc',
      commentaire: s.commentaire || ''
    }]))

    // Une ligne par (étudiant, pfp_type, année) issue du fallback algorithmique
    const rows = (fallbacks || []).filter(f => profileMap.has(f.user_id)).map(f => {
      const profile = profileMap.get(f.user_id)
      const pfpField = pfpTypeToField(f.pfp_type)
      const suivi = suivisMap.get(`${f.user_id}_${pfpField}`) || { couleur: 'blanc', commentaire: '' }
      return {
        user_id: f.user_id,
        etudiant: profile ? `${(profile.family_name || '').toUpperCase()} ${profile.forname || ''}`.trim() : f.user_id,
        classe: profile?.classe || '-',
        year: f.year,
        pfp_type: f.pfp_type,
        pfp_field: pfpField,
        couleur: suivi.couleur,
        commentaire: suivi.commentaire,
        assigned_place_name: f.assigned_place_name,
        assigned_institution_name: f.assigned_institution_name,
        isFallback: true,
        marqueLese: leseSet.has(f.user_id)
      }
    })

    // Étudiants marqués "lese" manuellement mais sans ligne de fallback pour l'année en cours :
    // on les ajoute quand même, sans PFP/année précis si l'info manque côté StudentsPhysio.
    const coveredKeys = new Set(rows.map(r => `${r.user_id}_${r.year}_${r.pfp_type}`))
    ;(studentsLese || []).forEach(s => {
      const profile = profileMap.get(s.user_id)
      if (profile && ![...coveredKeys].some(k => k.startsWith(`${s.user_id}_${s.year}`))) {
        rows.push({
          user_id: s.user_id,
          etudiant: profile ? `${(profile.family_name || '').toUpperCase()} ${profile.forname || ''}`.trim() : s.user_id,
          classe: s.class || profile?.classe || '-',
          year: s.year || 'N/A',
          pfp_type: 'Non spécifié',
          pfp_field: null,
          couleur: 'blanc',
          commentaire: '',
          assigned_place_name: null,
          assigned_institution_name: null,
          isFallback: false,
          marqueLese: true
        })
      }
    })

    lesedList.value = rows
  } catch (e) {
    console.error('Erreur fetchLesedStudents:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les étudiants lésés', life: 3000 })
  } finally {
    loadingLesed.value = false
  }
}

// --- Onglet "Échecs de stage" : étudiants qui ont loupé un stage (pfp_echec = true) ---
const echecsList = ref([])
const loadingEchecs = ref(false)
const echecFilterYear = ref(null)
const echecFilterPfp = ref(null)

const echecYears = computed(() => {
  const years = new Set(echecsList.value.map(l => l.year).filter(Boolean))
  return [...years].sort().reverse()
})
const echecPfpTypes = computed(() => {
  const types = new Set(echecsList.value.map(l => l.pfp_type).filter(Boolean))
  return [...types].sort()
})

const filteredEchecRows = computed(() => {
  let list = filterStudents(echecsList.value, { query: searchTerm.value, classe: filterClasse.value })
  if (echecFilterYear.value) list = list.filter(l => String(l.year) === String(echecFilterYear.value))
  if (echecFilterPfp.value) list = list.filter(l => l.pfp_type === echecFilterPfp.value)
  return list
})

const groupedEchecs = computed(() => {
  const list = filteredEchecRows.value

  const groups = new Map()
  list.forEach(l => {
    const key = `${l.year}_${l.pfp_type}`
    if (!groups.has(key)) groups.set(key, { year: l.year, pfpType: l.pfp_type, items: [] })
    groups.get(key).items.push(l)
  })

  return [...groups.values()].sort((a, b) => {
    if (b.year !== a.year) return b.year.localeCompare(a.year)
    return a.pfpType.localeCompare(b.pfpType)
  })
})

const fetchEchecsStudents = async () => {
  loadingEchecs.value = true
  try {
    const [{ data: manualEchecs, error: echecsError }, { data: notes, error: notesError }, profiles] = await Promise.all([
      supabase
        .from('student_result_vote')
        .select('user_id, pfp_type, year, assigned_place_name, assigned_institution_name, pfp_arret, commentaire_arret')
        .eq('pfp_echec', true),
      supabase
        .from('StudentsPhysio')
        .select('user_id, year, pfp1a, pfp1b, pfp2, pfp3, pfp4'),
      getAllStudents()
    ])

    if (echecsError) throw echecsError
    if (notesError) throw notesError

    const mergedEchecs = new Map()
    const keyFor = (row) => `${row.user_id}_${row.pfp_type}_${String(row.year ?? 'N/A')}`

    // Les échecs ajoutés manuellement restent prioritaires afin de préserver leurs détails.
    ;(manualEchecs || []).forEach(echec => {
      mergedEchecs.set(keyFor(echec), echec)
    })

    ;(notes || []).forEach(note => {
      FAILED_PFP_GRADE_FIELDS.forEach(({ field, pfpType }) => {
        if (!isFailedPfpGrade(note[field])) return

        const gradeFailure = {
          user_id: note.user_id,
          pfp_type: pfpType,
          year: note.year || 'N/A',
          assigned_place_name: null,
          assigned_institution_name: null,
          pfp_arret: false,
          commentaire_arret: null
        }

        if (!mergedEchecs.has(keyFor(gradeFailure))) {
          mergedEchecs.set(keyFor(gradeFailure), gradeFailure)
        }
      })
    })

    const profileMap = new Map((profiles || []).map(profile => [profile.user_id, profile]))

    echecsList.value = [...mergedEchecs.values()]
      .filter(echec => profileMap.has(echec.user_id))
      .map(echec => {
        const profile = profileMap.get(echec.user_id)
        return {
          user_id: echec.user_id,
          etudiant: `${(profile.family_name || '').toUpperCase()} ${profile.forname || ''}`.trim(),
          classe: profile.classe || '-',
          year: echec.year || 'N/A',
          pfp_type: echec.pfp_type,
          assigned_place_name: echec.assigned_place_name,
          assigned_institution_name: echec.assigned_institution_name,
          pfp_arret: echec.pfp_arret,
          commentaire_arret: echec.commentaire_arret
        }
      })
  } catch (e) {
    console.error('Erreur fetchEchecsStudents:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: "Impossible de charger les échecs de stage", life: 3000 })
  } finally {
    loadingEchecs.value = false
  }
}

// --- Onglet "Étudiants SAE" : liste + ajout rapide par recherche ---
const saeSearchSelection = ref(null)
const saeSearchSuggestions = ref([])

const isActiveSae = (student) => isActiveSaeFollowUp(student)

const saeStudentsList = computed(() => {
  return filterStudents(cases.value, { query: searchTerm.value, classe: filterClasse.value })
    .filter(isActiveSae)
    .sort((a, b) => a.etudiant.localeCompare(b.etudiant))
})

const saeStudentsTotal = computed(() => cases.value.filter(isActiveSae).length)

const searchSaeStudent = (event) => {
  const q = event.query.trim()
  saeSearchSuggestions.value = cases.value
    .filter(c => !isActiveSae(c))
    .filter(c => matchesStudentFilters(c, { query: q }))
    .slice(0, 15)
}

const markStudentSae = async (event) => {
  const student = event.value
  if (!student) return
  try {
    const { error } = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: student.user_id,
        pfp_field: 'sae',
        couleur: 'orange',
        commentaire: student.sae?.commentaire || null,
        visible: true
      }, { onConflict: 'user_id,pfp_field' })

    if (error) throw error

    student.sae = { couleur: 'orange', commentaire: student.sae?.commentaire || '' }
    toast.add({ severity: 'success', summary: 'SAE', detail: `${student.etudiant} marqué SAE`, life: 2000 })
  } catch (e) {
    console.error('Erreur markStudentSae:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de marquer cet étudiant', life: 3000 })
  } finally {
    saeSearchSelection.value = null
  }
}

const unmarkStudentSae = async (student) => {
  try {
    const { error } = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: student.user_id,
        pfp_field: 'sae',
        couleur: 'blanc',
        commentaire: student.sae?.commentaire || null,
        visible: true
      }, { onConflict: 'user_id,pfp_field' })

    if (error) throw error

    student.sae = { couleur: 'blanc', commentaire: student.sae?.commentaire || '' }
    toast.add({ severity: 'success', summary: 'SAE', detail: `${student.etudiant} retiré de la liste SAE`, life: 2000 })
  } catch (e) {
    console.error('Erreur unmarkStudentSae:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de retirer cet étudiant', life: 3000 })
  }
}

const openLesedFollowUp = (lesedRow) => {
  const field = lesedRow.pfp_field || pfpTypeToField(lesedRow.pfp_type)
  if (!field) {
    toast.add({ severity: 'warn', summary: 'Non disponible', detail: "Type de PFP non reconnu pour le suivi détaillé", life: 3000 })
    return
  }

  const student = cases.value.find(c => c.user_id === lesedRow.user_id) || {
    user_id: lesedRow.user_id,
    etudiant: lesedRow.etudiant,
    classe: lesedRow.classe,
    visible: true
  }

  if (!student[field]) {
    student[field] = {
      couleur: lesedRow.couleur || 'blanc',
      commentaire: lesedRow.commentaire || ''
    }
  }

  openLesedFeaturesDialog(student, field)
}


const openEchecFollowUp = (lesedRow) => {
  const field = lesedRow.pfp_field || pfpTypeToField(lesedRow.pfp_type)
  if (!field) {
    toast.add({ severity: 'warn', summary: 'Non disponible', detail: "Type de PFP non reconnu pour le suivi détaillé", life: 3000 })
    return
  }

  const student = cases.value.find(c => c.user_id === lesedRow.user_id) || {
    user_id: lesedRow.user_id,
    etudiant: lesedRow.etudiant,
    classe: lesedRow.classe,
    visible: true
  }

  openEchecFeaturesDialog(student, field, lesedRow)
}

const truncate = (text, max) => {
  if (!text) return ''
  return text.length > max ? text.substring(0, max) + '…' : text
}

const studentInitials = (name) => String(name || '')
  .trim()
  .split(/\s+/)
  .filter(Boolean)
  .slice(0, 2)
  .map(part => part[0]?.toUpperCase())
  .join('') || '—'

const stats = computed(() => {
  const all = allCaseStudents.value
  const total = all.length
  const withComments = all.filter(c => hasFollowUp(c)).length
  const redCount = all.filter(c => pfpFields.some(f => c[f]?.couleur === 'rouge')).length
  const greenCount = all.filter(c => pfpFields.some(f => c[f]?.couleur === 'vert')).length
  return { total, withComments, redCount, greenCount }
})

const lesedStudentIds = computed(() => new Set(lesedList.value.map(row => row.user_id)))
const failedStudentIds = computed(() => new Set([
  ...echecsList.value.map(row => row.user_id),
  ...echecMap.value.keys()
]))

const caseCategoryContext = computed(() => ({
  lesedStudentIds: lesedStudentIds.value,
  failedStudentIds: failedStudentIds.value
}))

const allCaseStudents = computed(() => cases.value.filter(student => (
  getStudentCaseCategories(student, caseCategoryContext.value).length > 0
)))

const caseTypeDefinitions = {
  sae: { value: 'sae', label: 'SAE', severity: 'warning' },
  lese: { value: 'lese', label: 'Lésé', severity: 'danger' },
  echec: { value: 'echec', label: 'Échec de stage', severity: 'secondary' }
}

const getCaseTypes = (student) => getStudentCaseCategories(student, caseCategoryContext.value)
  .map(category => caseTypeDefinitions[category])

const filteredCases = computed(() => {
  let list = filterStudents(allCaseStudents.value, { query: searchTerm.value, classe: filterClasse.value })

  if (filterColor.value) {
    list = list.filter(c => pfpFields.some(f => c[f]?.couleur === filterColor.value))
  }

  if (filterDisplay.value === 'with_comments') {
    list = list.filter(c => hasFollowUp(c))
  } else if (filterDisplay.value === 'no_comments') {
    list = list.filter(c => !hasFollowUp(c))
  }

  const collator = new Intl.Collator('fr', { sensitivity: 'base' })
  list.sort((a, b) => collator.compare(a.etudiant, b.etudiant))

  return list
})

const hasFollowUp = (student) => hasCaseFollowUp(student, pfpFields)

const activeFilterCount = computed(() => {
  let count = Number(Boolean(searchTerm.value.trim())) + Number(Boolean(filterClasse.value))

  if (activeTab.value === 0) {
    count += Number(Boolean(filterColor.value))
    count += Number(filterDisplay.value !== 'all')
  } else if (activeTab.value === 1) {
    count += Number(Boolean(lesedFilterYear.value)) + Number(Boolean(lesedFilterPfp.value))
  } else if (activeTab.value === 2) {
    count += Number(Boolean(echecFilterYear.value)) + Number(Boolean(echecFilterPfp.value))
  }

  return count
})

const currentResultCount = computed(() => {
  if (activeTab.value === 1) return filteredLesedRows.value.length
  if (activeTab.value === 2) return filteredEchecRows.value.length
  if (activeTab.value === 3) return saeStudentsList.value.length
  return filteredCases.value.length
})

const currentResultLabel = computed(() => {
  const singular = currentResultCount.value === 1
  if (activeTab.value === 1) return singular ? 'étudiant lésé' : 'étudiants lésés'
  if (activeTab.value === 2) return singular ? 'échec de stage' : 'échecs de stage'
  if (activeTab.value === 3) return singular ? 'étudiant SAE' : 'étudiants SAE'
  return singular ? 'cas particulier' : 'cas particuliers'
})

const activeTabLoading = computed(() => {
  if (activeTab.value === 1) return loadingLesed.value
  if (activeTab.value === 2) return loadingEchecs.value
  return loading.value
})

const resetFilters = () => {
  searchTerm.value = ''
  filterClasse.value = null
  filterColor.value = null
  filterDisplay.value = 'all'
  lesedFilterYear.value = null
  lesedFilterPfp.value = null
  echecFilterYear.value = null
  echecFilterPfp.value = null
}

const refreshActiveTab = async () => {
  if (activeTab.value === 1) return fetchLesedStudents()
  if (activeTab.value === 2) return fetchEchecsStudents()
  return fetchCases()
}

const getCellStyle = (cellData) => {
  if (!cellData || !cellData.couleur || cellData.couleur === 'blanc') {
    return { backgroundColor: 'var(--surface-card)', border: '1px solid var(--surface-border)' }
  }

  const colors = {
    'vert': { bg: '#28a745', text: '#ffffff' },
    'orange': { bg: '#fd7e14', text: '#ffffff' },
    'rouge': { bg: '#dc3545', text: '#ffffff' },
    'noir': { bg: '#343a40', text: '#ffffff' }
  }

  const c = colors[cellData.couleur]
  return {
    backgroundColor: c.bg,
    color: c.text,
    border: '1px solid ' + c.bg,
    fontWeight: '600'
  }
}

const getLesedMotifStyle = (lesedRow) => getCellStyle({ couleur: lesedRow?.couleur || 'blanc' })
const getColorLabel = (value) => colorOptions.find(color => color.value === value)?.label || value

const openCellDialog = (student, field) => {
  editingStudent.value = student
  editingField.value = field

  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }

  editingCell.value = { ...student[field] }
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  resetNewEvent()
  showCellDialog.value = true
}

const closeCellDialog = () => {
  showCellDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
  resetNewEvent()
}


const openLesedFeaturesDialog = (student, field) => {
  editingStudent.value = student
  editingField.value = field

  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }

  editingCell.value = { ...student[field] }
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  resetNewEvent()
  showLesedFeaturesDialog.value = true
}

const closeLesedFeaturesDialog = () => {
  showLesedFeaturesDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
  resetNewEvent()
}



const openEchecFeaturesDialog = (student, field, echecRow) => {
  editingStudent.value = student
  editingField.value = field
  editingEchecRow.value = echecRow

  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }

  editingCell.value = {
    ...student[field],
    commentaire: echecRow?.commentaire_arret || ''
  }
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  resetNewEvent()
  showEchecFeaturesDialog.value = true
}

const closeEchecFeaturesDialog = () => {
  showEchecFeaturesDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
  editingEchecRow.value = null
  resetNewEvent()
}

const saveEchecFeaturesData = async () => {
  if (!editingStudent.value || !editingCell.value || !editingEchecRow.value) {
    closeEchecFeaturesDialog()
    return
  }

  const commentaireArret = editingCell.value.commentaire || ''
  const echecRow = editingEchecRow.value

  try {
    let query = supabase
      .from('student_result_vote')
      .update({ commentaire_arret: commentaireArret || null })
      .eq('user_id', editingStudent.value.user_id)
      .eq('pfp_type', echecRow.pfp_type)
      .eq('pfp_echec', true)

    query = echecRow.year === null || echecRow.year === undefined
      ? query.is('year', null)
      : query.eq('year', echecRow.year)

    const { error } = await query

    if (error) throw error

    echecsList.value = echecsList.value.map(row => (
      row.user_id === editingStudent.value.user_id &&
      row.pfp_type === echecRow.pfp_type &&
      row.year === echecRow.year
        ? { ...row, commentaire_arret: commentaireArret }
        : row
    ))

    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: "Motif d'arrêt mis à jour", life: 2000 })
    closeEchecFeaturesDialog()
  } catch (e) {
    console.error('Erreur saveEchecFeaturesData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }
}

const saveLesedFeaturesData = async () => {
  if (!editingStudent.value || !editingField.value || !editingCell.value) {
    closeLesedFeaturesDialog()
    return
  }

  const cellData = {
    couleur: editingCell.value.couleur || 'blanc',
    commentaire: editingCell.value.commentaire || ''
  }

  try {
    const { error } = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: editingField.value,
        couleur: cellData.couleur,
        commentaire: cellData.commentaire || null,
        visible: editingStudent.value.visible ?? true
      }, {
        onConflict: 'user_id,pfp_field'
      })

    if (error) throw error

    editingStudent.value[editingField.value] = { ...cellData }
    lesedList.value = lesedList.value.map(row => (
      row.user_id === editingStudent.value.user_id && row.pfp_field === editingField.value
        ? { ...row, ...cellData }
        : row
    ))
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Motif lésé mis à jour', life: 2000 })
    closeLesedFeaturesDialog()
  } catch (e) {
    console.error('Erreur saveLesedFeaturesData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }
}

const openSAEFeaturesDialog = (student, field) => {
  editingStudent.value = student
  editingField.value = field

  if (!student[field]) {
    student[field] = { couleur: 'blanc', commentaire: '' }
  }

  editingCell.value = { ...student[field] }
  dialogTitle.value = `${student.etudiant} - ${fieldLabels[field]}`
  resetNewEvent()
  showSAEFeaturesDialog.value = true
}

const closeSAEFeaturesDialog = () => {
  showSAEFeaturesDialog.value = false
  editingCell.value = null
  editingStudent.value = null
  editingField.value = null
  resetNewEvent()
}

const saveSAEFeaturesData = async () => {
  if (!editingStudent.value || !editingField.value || !editingCell.value) {
    closeSAEFeaturesDialog()
    return
  }

  const cellData = {
    couleur: editingCell.value.couleur || 'blanc',
    commentaire: editingCell.value.commentaire || ''
  }

  try {
    const { error } = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: editingField.value,
        couleur: cellData.couleur,
        commentaire: cellData.commentaire || null,
        visible: editingStudent.value.visible ?? true
      }, {
        onConflict: 'user_id,pfp_field'
      })

    if (error) throw error

    editingStudent.value[editingField.value] = { ...cellData }
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Particularités SAE mises à jour', life: 2000 })
    closeSAEFeaturesDialog()
  } catch (e) {
    console.error('Erreur saveSAEFeaturesData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }
}

const openInfoDialog = (student) => {
  editingStudent.value = student

  if (!student.info_etudiant) {
    student.info_etudiant = { commentaire: '' }
  }

  editingInfo.value = { ...student.info_etudiant }
  infoDialogTitle.value = `Informations - ${student.etudiant}`
  showInfoDialog.value = true
}

const closeInfoDialog = () => {
  showInfoDialog.value = false
  editingInfo.value = null
  editingStudent.value = null
}

const saveInfoData = async () => {
  if (!editingStudent.value || !editingInfo.value) {
    closeInfoDialog()
    return
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: 'info_etudiant',
        couleur: 'blanc',
        commentaire: editingInfo.value.commentaire || null,
        visible: true
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) throw result.error

    editingStudent.value.info_etudiant = { ...editingInfo.value }
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Informations mises à jour', life: 2000 })
  } catch (e) {
    console.error('Erreur saveInfoData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }

  closeInfoDialog()
}

const saveCellData = async () => {
  if (!editingStudent.value || !editingField.value || !editingCell.value) {
    closeCellDialog()
    return
  }

  const cellData = {
    couleur: editingCell.value.couleur || 'blanc',
    commentaire: editingCell.value.commentaire || ''
  }

  try {
    const result = await supabase
      .from('suivi_cas_particuliers')
      .upsert({
        user_id: editingStudent.value.user_id,
        pfp_field: editingField.value,
        couleur: cellData.couleur,
        commentaire: cellData.commentaire || null,
        visible: editingStudent.value.visible
      }, {
        onConflict: 'user_id,pfp_field'
      })
      .select()

    if (result.error) throw result.error

    editingStudent.value[editingField.value] = { ...cellData }
    lesedList.value = lesedList.value.map(row => (
      row.user_id === editingStudent.value.user_id && row.pfp_field === editingField.value
        ? { ...row, ...cellData }
        : row
    ))
    toast.add({ severity: 'success', summary: 'Sauvegardé', detail: 'Cellule mise à jour', life: 2000 })
  } catch (e) {
    console.error('Erreur saveCellData:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder: ' + e.message, life: 3000 })
  }

  closeCellDialog()
}

const allColumns = pfpGroups.flatMap(g => [{ field: g.base, label: g.label }, { field: g.prime, label: g.label + "'" }])

const exportCSV = () => {
  const headers = ['Étudiant', 'Classe', 'Info', ...allColumns.map(p => p.label + ' Couleur'), ...allColumns.map(p => p.label + ' Commentaire')]
  const rows = filteredCases.value.map(c => [
    c.etudiant,
    c.classe,
    c.info_etudiant?.commentaire || '',
    ...allColumns.map(p => c[p.field]?.couleur || ''),
    ...allColumns.map(p => c[p.field]?.commentaire || '')
  ])
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `suivi-cas-particuliers-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

const fetchCases = async () => {
  loading.value = true
  try {
    const [profiles, { data: suivis, error: suivisError }, { data: echecs, error: echecsError }, { data: historique, error: historiqueError }] = await Promise.all([
      getAllStudents(),
      supabase.from('suivi_cas_particuliers').select('*'),
      supabase.from('student_result_vote').select('user_id, pfp_type').eq('pfp_echec', true),
      supabase.from('cas_particuliers_historique').select('*').order('created_at', { ascending: false })
    ])

    if (suivisError) throw suivisError
    if (echecsError) throw echecsError
    if (historiqueError) console.warn('Historique cas particuliers non chargé:', historiqueError.message)

    historiqueList.value = historique || []

    const newEchecMap = new Map()
    ;(echecs || []).forEach(e => {
      if (!newEchecMap.has(e.user_id)) {
        newEchecMap.set(e.user_id, new Set())
      }
      newEchecMap.get(e.user_id).add(e.pfp_type)
    })
    echecMap.value = newEchecMap

    const suivisMap = new Map()
    ;(suivis || []).forEach(s => {
      suivisMap.set(`${s.user_id}_${s.pfp_field}`, {
        couleur: s.couleur || 'blanc',
        commentaire: s.commentaire || ''
      })
    })

    const visibilityMap = new Map()
    ;(suivis || []).forEach(s => {
      if (!visibilityMap.has(s.user_id)) {
        visibilityMap.set(s.user_id, s.visible)
      }
    })

    cases.value = (profiles || []).map(p => {
      const studentData = {
        user_id: p.user_id,
        etudiant: `${(p.family_name || '').toUpperCase()} ${p.forname || ''}`.trim(),
        classe: p.classe || '-',
        visible: visibilityMap.get(p.user_id) !== false
      }

      pfpFields.forEach(field => {
        studentData[field] = suivisMap.get(`${p.user_id}_${field}`) || { couleur: 'blanc', commentaire: '' }
      })

      studentData.info_etudiant = suivisMap.get(`${p.user_id}_info_etudiant`) || { commentaire: '' }
      return studentData
    })
  } catch (e) {
    console.error('Erreur fetchCases:', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les données', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCases()
  fetchLesedStudents()
  fetchEchecsStudents()
})
</script>

<style scoped>
.cas-page {
  min-height: 100%;
}

.case-header__intro {
  padding-bottom: 1rem;
}

.filter-toolbar {
  display: grid;
  grid-template-columns: minmax(15rem, 1.6fr) repeat(3, minmax(10rem, 1fr)) auto;
  gap: 0.875rem;
  align-items: end;
  padding-block: 1rem;
  border-block: 1px solid var(--surface-border);
}

.filter-field {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 0.4rem;
}

.filter-field label {
  color: var(--text-color-secondary);
}

.filter-reset {
  min-height: 2.75rem;
  white-space: nowrap;
}

.filter-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  min-height: 2.5rem;
  padding-top: 0.75rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.filter-summary strong {
  color: var(--text-color);
  font-variant-numeric: tabular-nums;
}

.filter-summary__active {
  color: var(--primary-color);
  font-weight: 600;
}

.sae-roster {
  overflow: hidden;
  border: 1px solid var(--surface-border);
  border-radius: 12px;
  background: var(--surface-card);
}

.sae-roster__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.sae-roster__header h2,
.sae-roster__header p,
.sae-student-card h3,
.sae-current-note h4,
.sae-current-note p,
.sae-empty-state h3,
.sae-empty-state p {
  margin: 0;
}

.sae-roster__header h2 {
  color: var(--text-color);
  font-size: 1.25rem;
  line-height: 1.25;
}

.sae-roster__header p {
  margin-top: 0.3rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.sae-roster__hint {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 28rem;
  color: var(--text-color-secondary);
  font-size: 0.8125rem;
  line-height: 1.4;
}

.sae-list {
  display: grid;
}

.sae-student-card {
  padding: 1.25rem 1.5rem 1.5rem;
}

.sae-student-card + .sae-student-card {
  border-top: 1px solid var(--surface-border);
}

.sae-student-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.25rem;
}

.sae-student-card__identity {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 0.875rem;
}

.sae-student-card__avatar {
  display: inline-grid;
  flex: 0 0 2.75rem;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  border-radius: 50%;
  color: var(--primary-color-text);
  background: var(--primary-color);
  font-size: 0.8125rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sae-student-card h3 {
  color: var(--text-color);
  font-size: 1rem;
  line-height: 1.3;
}

.sae-student-card__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.4rem;
}

.sae-student-card__meta > span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--text-color-secondary);
  font-size: 0.8125rem;
}

.sae-student-card__meta i {
  color: var(--primary-color);
  font-size: 0.6875rem;
}

.sae-student-card__actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 0.5rem;
}

.sae-student-card__content {
  display: grid;
  grid-template-columns: minmax(18rem, 0.9fr) minmax(24rem, 1.35fr);
  gap: 1rem;
  align-items: start;
  margin-top: 1rem;
}

.sae-current-note {
  min-height: 4.75rem;
  padding: 0.9rem 1rem;
  border-radius: 8px;
  background: var(--surface-ground);
}

.sae-current-note h4 {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.025em;
  text-transform: uppercase;
}

.sae-current-note p {
  max-width: 72ch;
  margin-top: 0.5rem;
  color: var(--text-color);
  font-size: 0.9375rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.sae-current-note .sae-current-note__empty {
  color: var(--text-color-secondary);
  font-style: italic;
}

.sae-student-card__content :deep(.shared-follow-up) {
  max-width: none;
}

.sae-empty-state {
  display: grid;
  min-height: 14rem;
  place-items: center;
  align-content: center;
  gap: 0.65rem;
  padding: 2rem;
  text-align: center;
}

.sae-empty-state > i {
  color: var(--text-color-secondary);
  font-size: 2rem;
}

.sae-empty-state h3 {
  color: var(--text-color);
  font-size: 1rem;
}

.sae-empty-state p {
  max-width: 34rem;
  color: var(--text-color-secondary);
}

@media (max-width: 1180px) {
  .filter-toolbar {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .filter-reset {
    justify-self: start;
  }

  .sae-student-card__content {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 640px) {
  .cas-page {
    padding: 0.75rem !important;
  }

  .filter-toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .filter-reset {
    width: 100%;
  }

  .filter-summary {
    align-items: flex-start;
    flex-direction: column;
    gap: 0.25rem;
  }

  .sae-roster__header,
  .sae-student-card__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .sae-roster__header,
  .sae-student-card {
    padding: 1rem;
  }

  .sae-roster__hint {
    max-width: none;
  }

  .sae-student-card__actions {
    width: 100%;
    align-items: stretch;
    flex-direction: column;
  }

  .sae-student-card__actions :deep(.p-button) {
    justify-content: center;
    width: 100%;
    min-height: 44px;
  }

  .sae-student-card__content {
    grid-template-columns: minmax(0, 1fr);
  }
}

.cas-table :deep(.p-datatable-thead > tr > th) {
  background: var(--surface-100);
  padding: 0.75rem 0.5rem;
  font-weight: 600;
  border-bottom: 2px solid var(--primary-color);
  white-space: nowrap;
  text-align: center;
}

.cas-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.35rem 0.25rem;
  vertical-align: middle;
}

.cas-table :deep(.p-datatable-tbody > tr) {
  transition: background 0.2s ease;
}

.cas-table :deep(.p-datatable-tbody > tr:hover) {
  background: var(--surface-50);
}

.case-type-list {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.cell-box {
  cursor: pointer;
  padding: 0.4rem 0.5rem;
  border-radius: 6px;
  text-align: center;
  min-height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  transition: all 0.2s ease;
}

.cell-box:hover {
  opacity: 0.85;
  transform: scale(1.03);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

.cell-disabled {
  background: var(--surface-ground);
  border: 1px dashed var(--surface-border);
  cursor: default;
  opacity: 0.5;
}

.cell-disabled:hover {
  transform: none;
  box-shadow: none;
  opacity: 0.5;
}

.cell-info {
  background: var(--surface-ground);
}

.cell-info.cell-has-content {
  background: rgba(59, 130, 246, 0.15);
  border-color: rgba(59, 130, 246, 0.4);
  color: var(--primary-color);
}

.cell-sae {
  background: var(--surface-ground);
}

.cell-sae.cell-has-content {
  border-color: rgba(253, 126, 20, 0.5);
}

.cell-text {
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1.2;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-left: 0.5rem;
}

.legend-vert { background: #28a745; }
.legend-orange { background: #fd7e14; }
.legend-rouge { background: #dc3545; }
.legend-noir { background: #343a40; }
.legend-blanc { background: var(--surface-card); border: 1px solid var(--surface-border); }

/* Badge "changement de date" sur les cellules du tableau */
.cell-box {
  position: relative;
}
.cell-badge {
  position: absolute;
  top: 2px;
  right: 3px;
  font-size: 0.6rem;
  color: var(--primary-color);
  background: var(--surface-card);
  border-radius: 50%;
  padding: 1px;
}

/* Timeline historique dans le dialog de cellule */
.cas-timeline :deep(.p-timeline-event-opposite) {
  display: none;
  flex: 0;
}
.timeline-marker {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.8rem;
  height: 1.8rem;
  border-radius: 50%;
  color: #fff;
  font-size: 0.85rem;
}
.marker-info { background: #3b82f6; }
.marker-warning { background: #fd7e14; }
.marker-danger { background: #dc3545; }
.marker-secondary { background: #6c757d; }

.timeline-event {
  background: var(--surface-ground);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
  margin-bottom: 0.5rem;
}

.date-change-line {
  display: flex;
  align-items: center;
  font-size: 0.85rem;
  margin-top: 0.3rem;
}
</style>
