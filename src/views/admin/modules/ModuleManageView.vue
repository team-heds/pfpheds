<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        :title="module ? module.title : 'Gestion du module'" 
        :subtitle="`Module ${module?.number || ''} - Année ${module?.year || ''}`"
        icon="pi pi-cog"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin/dashboard-rm" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300"></i>
            <span class="text-900">Gestion du module</span>
          </div>
        </template>
      </PageHeader>
    </template>

    <!-- Loading -->
    <div v-if="loading" class="loading-container">
      <ProgressSpinner />
      <p>Chargement du module...</p>
    </div>

    <!-- Permission refusée -->
    <div v-else-if="!canEdit" class="permission-denied">
      <Card>
        <template #content>
          <div class="text-center p-5">
            <i class="pi pi-lock text-6xl text-red-500 mb-3"></i>
            <h2>Accès refusé</h2>
            <p class="text-600">{{ permissionError }}</p>
            <Button label="Retour au dashboard" icon="pi pi-arrow-left" @click="$router.push('/admin/dashboard-rm')" class="mt-3" />
          </div>
        </template>
      </Card>
    </div>

    <!-- Contenu principal -->
    <div v-else class="module-manage-container">
      
      <!-- Actions rapides 
      <div class="module-actions-bar">
        <Button 
          icon="pi pi-calendar" 
          label="Planning du module" 
          severity="info"
          @click="$router.push(`/admin/modules/${moduleId}/planning`)"
        />
        <Button 
          icon="pi pi-users" 
          label="Enseignants" 
          severity="secondary"
          outlined
          @click="activeTab = 1"
        />
      </div>-->
      
      <!-- Onglets de gestion -->
      <TabView>
        
        <!-- Onglet: Planning -->
        <TabPanel header="Planning">
          <Card>
            <template #content>
              <!-- Header avec filtres -->
              <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="flex align-items-center gap-3">
                  <h3 class="m-0">Planning du module</h3>
                  <Tag v-if="selectedClass" :value="`${filteredPlanning.length} séances`" severity="info" />
                </div>
                <div class="flex align-items-center gap-2 flex-wrap">
                  <Button 
                    label="Temps plein BAC 25"
                    :severity="selectedClass === 'BAC25' ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== 'BAC25'"
                    @click="selectedClass = selectedClass === 'BAC25' ? null : 'BAC25'"
                  />
                  <Button 
                    label="Temps partiel BAC24-TP"
                    :severity="selectedClass === 'BAC24-TP' ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== 'BAC24-TP'"
                    @click="selectedClass = selectedClass === 'BAC24-TP' ? null : 'BAC24-TP'"
                  />
                  <Button 
                    icon="pi pi-refresh" 
                    severity="secondary" 
                    outlined
                    @click="loadModulePlanning"
                    :loading="loadingPlanning"
                    v-tooltip="'Actualiser'"
                  />
                  <Button 
                    icon="pi pi-file-excel" 
                    severity="secondary" 
                    outlined
                    @click="exportPlanningToExcel"
                    :disabled="filteredPlanning.length === 0"
                    v-tooltip="'Exporter en Excel'"
                  />
                  <Button 
                    icon="pi pi-file-pdf" 
                    severity="secondary" 
                    outlined
                    @click="exportPlanningToPDF"
                    :disabled="filteredPlanning.length === 0"
                    v-tooltip="'Exporter en PDF'"
                  />
                  <div class="flex border-round overflow-hidden">
                    <Button 
                      icon="pi pi-list" 
                      :severity="planningView === 'list' ? 'primary' : 'secondary'"
                      :outlined="planningView !== 'list'"
                      @click="planningView = 'list'"
                      v-tooltip="'Vue liste'"
                      class="border-noround-right"
                    />
                  </div>
                  <Button 
                    label="Gérer le planning" 
                    icon="pi pi-external-link" 
                    @click="$router.push(`/admin/modules/${moduleId}/planning`)"
                  />
                </div>
              </div>

              <!-- Liste des séances -->
              <div v-if="loadingPlanning" class="text-center p-4">
                <ProgressSpinner style="width: 40px; height: 40px" />
              </div>
              
              <div v-else-if="filteredPlanning.length === 0" class="text-center p-5">
                <i class="pi pi-hand-pointer text-6xl text-400 mb-3"></i>
                <h4>Sélectionnez une classe</h4>
                <p class="text-600 mb-4">Sélectionnez temps plein ou temps partiel BAC24-TP pour voir le planning</p>
                <div class="flex justify-content-center gap-3">
                  <Button 
                    label="Temps plein BAC 25"
                    :severity="selectedClass === 'BAC25' ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== 'BAC25'"
                    @click="selectedClass = selectedClass === 'BAC25' ? null : 'BAC25'"
                    size="large"
                  />
                  <Button 
                    label="Temps partiel BAC24-TP"
                    :severity="selectedClass === 'BAC24-TP' ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== 'BAC24-TP'"
                    @click="selectedClass = selectedClass === 'BAC24-TP' ? null : 'BAC24-TP'"
                    size="large"
                  />
                </div>
              </div>

              <!-- Vue Liste -->
              <div v-else-if="planningView === 'list'" class="planning-list">
                <DataTable 
                  :value="flatPlanningData" 
                  responsiveLayout="scroll"
                  :rowClass="rowClass"
                  class="planning-datatable"
                >
                  <Column field="week_number" header="Semaine" style="width: 120px">
                    <template #body="{ data }">
                      <div v-if="data.isFirstSlotOfWeek" class="week-header-cell">
                        <div class="week-content">
                          <Button 
                            icon="pi pi-plus" 
                            severity="secondary" 
                            text
                            rounded
                            size="small"
                            @click="addSessionToWeek(data.week_number)"
                            v-tooltip="'Ajouter une séance'"
                            class="add-button-inline"
                          />
                          <div class="week-badge">
                            <i class="pi pi-calendar"></i>
                            <span class="week-text">Semaine {{ data.week_number }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Column>
                  <Column field="day" header="Jour" style="width: 140px">
                    <template #body="{ data }">
                      <div v-if="data.isFirstSlotOfDay" class="day-header-cell">
                        <div class="day-badge">
                          <div class="day-circle">
                            <span class="day-initial">{{ formatDay(data.day).charAt(0) }}</span>
                          </div>
                          <div class="day-info">
                            <span class="day-name">{{ formatDay(data.day) }}</span>
                          </div>
                        </div>
                      </div>
                    </template>
                  </Column>
                  <Column field="dateX" header="DateX" style="width: 120px">
                    <template #body="{ data }">
                      <span class="text-sm font-medium text-600">{{ formatDateForDisplay(data.week_number, data.day) }}</span>
                    </template>
                  </Column>
                  <Column header="Horaire" style="width: 120px">
                    <template #body="{ data }">
                      <div class="time-slot">{{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}</div>
                    </template>
                  </Column>
                  <Column field="course_title" header="Cours" style="width: 200px" class="course-title-cell">
                    <template #body="{ data }">
                      <div class="course-title">{{ data.course_title || module?.title || '—' }}</div>
                    </template>
                  </Column>
                  <Column field="teacher_name" header="Enseignant" style="width: 150px">
                    <template #body="{ data }">
                      <div class="flex align-items-center gap-2">
                        <i class="pi pi-user text-500"></i>
                        <span>{{ data.teacher_name || '—' }}</span>
                      </div>
                    </template>
                  </Column>
                  <Column field="activity" header="Type" style="width: 100px">
                    <template #body="{ data }">
                      <Tag :value="data.activity || 'Cours'" :severity="getActivitySeverity(data.activity)" />
                    </template>
                  </Column>
                  <Column field="room" header="Salle" style="width: 100px">
                    <template #body="{ data }">
                      {{ data.room || '—' }}
                    </template>
                  </Column>
                  <Column field="class_code" header="Classe" style="width: 80px">
                    <template #body="{ data }">
                      <Tag 
                        :value="normalizeClass(data.class_code)" 
                        size="small"
                        :style="{ backgroundColor: '#' + getClassDisplayColor(data.class_code), color: getClassTextColor(data.class_code) }"
                      />
                    </template>
                  </Column>
                  <Column header="Actions" style="width: 120px">
                    <template #body="{ data }">
                      <div class="flex gap-1">
                        <Button 
                          icon="pi pi-pencil" 
                          severity="secondary" 
                          outlined
                          size="small"
                          @click="editSession(data)"
                          v-tooltip="'Modifier cette séance'"
                        />
                        <Button 
                          icon="pi pi-trash" 
                          severity="danger" 
                          text 
                          size="small"
                          @click="deleteSession(data)"
                          v-tooltip="'Supprimer cette séance'"
                        />
                      </div>
                    </template>
                  </Column>
                </DataTable>
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Informations générales -->
        <TabPanel header="Informations générales">
          <Card>
            <template #content>
              <form @submit.prevent="saveModule" class="p-fluid">
                <div class="grid">
                  <!-- Numéro du module -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="number">Numéro du module *</label>
                      <InputText 
                        id="number" 
                        v-model="moduleForm.number" 
                        placeholder="Ex: M1.1"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Année -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="year">Année *</label>
                      <Dropdown 
                        id="year" 
                        v-model="moduleForm.year" 
                        :options="[1, 2, 3]" 
                        placeholder="Sélectionner l'année"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Titre -->
                  <div class="col-12">
                    <div class="field">
                      <label for="title">Titre du module *</label>
                      <InputText 
                        id="title" 
                        v-model="moduleForm.title" 
                        placeholder="Ex: Anatomie et physiologie humaine"
                      />
                    </div>
                  </div>

                  <!-- Description -->
                  <div class="col-12">
                    <div class="field">
                      <label for="description">Description</label>
                      <Textarea 
                        id="description" 
                        v-model="moduleForm.description" 
                        rows="5"
                        placeholder="Description détaillée du module..."
                      />
                    </div>
                  </div>

                  <!-- Responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable">Responsable</label>
                      <InputText 
                        id="responsable" 
                        v-model="moduleForm.responsable" 
                        placeholder="Nom du responsable"
                        :disabled="!isAdmin"
                      />
                    </div>
                  </div>

                  <!-- Email du responsable -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="responsable_email">Email du responsable</label>
                      <InputText 
                        id="responsable_email" 
                        v-model="moduleForm.responsable_email" 
                        type="email"
                        placeholder="email@hevs.ch"
                        :disabled="!isAdmin"
                      />
                      <small class="text-500">L'email détermine qui peut gérer ce module</small>
                    </div>
                  </div>

                  <!-- Crédits ECTS -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="credits">Crédits ECTS</label>
                      <InputNumber 
                        id="credits" 
                        v-model="moduleForm.credits" 
                        :min="0"
                        :max="30"
                      />
                    </div>
                  </div>

                  <!-- Heures de contact -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="heures_contact">Heures de contact</label>
                      <InputNumber 
                        id="heures_contact" 
                        v-model="moduleForm.heures_contact" 
                        :min="0"
                      />
                    </div>
                  </div>

                  <!-- Couleur -->
                  <div class="col-12 md:col-4">
                    <div class="field">
                      <label for="color">Couleur (planning)</label>
                      <ColorPicker v-model="moduleForm.color" format="hex" />
                    </div>
                  </div>

                  <!-- Code court -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="short_code">Code court</label>
                      <InputText 
                        id="short_code" 
                        v-model="moduleForm.short_code" 
                        placeholder="Ex: ANAT"
                      />
                    </div>
                  </div>

                  <!-- Coordinateur -->
                  <div class="col-12 md:col-6">
                    <div class="field">
                      <label for="coordinateur">Coordinateur</label>
                      <InputText 
                        id="coordinateur" 
                        v-model="moduleForm.coordinateur" 
                        placeholder="Nom du coordinateur"
                      />
                    </div>
                  </div>
                </div>

                <!-- Boutons d'action -->
                <div class="flex justify-content-end gap-2 mt-4">
                  <Button 
                    label="Annuler" 
                    icon="pi pi-times" 
                    severity="secondary" 
                    outlined
                    @click="$router.push('/admin/dashboard-rm')" 
                  />
                  <Button 
                    label="Enregistrer" 
                    icon="pi pi-check" 
                    type="submit"
                    :loading="saving"
                  />
                </div>
              </form>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Enseignants -->
        <TabPanel header="Enseignants">
          <Card>
            <template #content>
              <!-- Filtres et mode -->
              <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="flex align-items-center gap-3">
                  <h3 class="m-0">Enseignants</h3>
                  <Tag :value="`${filteredTeachersList.length} enseignants`" severity="info" />
                </div>
                <div class="flex align-items-center gap-2 flex-wrap">
                  <!-- Filtre par type de classe (comme le planning) -->
                  <Button 
                    label="Temps plein BAC 25"
                    :severity="classFilter === 'BAC25' ? 'primary' : 'secondary'"
                    :outlined="classFilter !== 'BAC25'"
                    @click="classFilter = classFilter === 'BAC25' ? null : 'BAC25'"
                  />
                  <Button 
                    label="Temps partiel BAC24-TP"
                    :severity="classFilter === 'BAC24-TP' ? 'primary' : 'secondary'"
                    :outlined="classFilter !== 'BAC24-TP'"
                    @click="classFilter = classFilter === 'BAC24-TP' ? null : 'BAC24-TP'"
                  />
                  
                <!--   <Button 
                    label="Ajouter un enseignant" 
                    icon="pi pi-plus" 
                    @click="showAddTeacherDialog = true"
                  />-->
                </div>
              </div>

              <!-- DataTable Enseignants -->
              <DataTable 
                :value="filteredTeachersList" 
                responsiveLayout="scroll" 
                stripedRows
                :loading="loadingGlobalTeachers"
              >
                <Column field="name" header="Nom" sortable>
                  <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-user text-primary"></i>
                      <span class="font-medium">{{ data.name }}</span>
                      <Tag v-if="data.source === 'planning'" value="Planning" severity="secondary" class="text-xs" />
                      <Tag v-if="data.modules" :value="`${data.modules.length} modules`" severity="info" class="text-xs" />
                    </div>
                  </template>
                </Column>
                <Column field="email" header="Email">
                  <template #body="{ data }">
                    <span v-if="data.email" class="text-600">{{ data.email }}</span>
                    <span v-else class="text-400">—</span>
                  </template>
                </Column>
                <Column field="planningHours" header="Heures planning" sortable>
                  <template #body="{ data }">
                    <Tag 
                      :value="`${data.planningHours}h`" 
                      :severity="getHoursSeverity(data.planningHours)"
                    />
                  </template>
                </Column>
                <Column field="sessionsCount" header="Séances" sortable>
                  <template #body="{ data }">
                    {{ data.sessionsCount }} séance{{ data.sessionsCount > 1 ? 's' : '' }}
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <div class="flex gap-1">
                      <Button 
                        icon="pi pi-eye" 
                        severity="secondary" 
                        text 
                        size="small"
                        @click="showTeacherDetails(data)"
                        v-tooltip="'Voir les détails'"
                      />
                      <Button 
                        icon="pi pi-trash" 
                        severity="danger" 
                        text 
                        size="small"
                        @click="removeTeacher(data)"
                        v-tooltip="'Retirer'"
                      />
                    </div>
                  </template>
                </Column>
                <template #empty>
                  <div class="text-center p-4">
                    <i class="pi pi-users text-4xl text-400 mb-2"></i>
                    <p class="text-600">Aucun enseignant trouvé</p>
                    <small class="text-400">
                      Essayez de changer les filtres
                    </small>
                  </div>
                </template>
              </DataTable>
              
              <!-- Résumé des heures -->
              <div v-if="filteredTeachersList.length > 0" class="mt-4 p-3 surface-100 border-round">
                <div class="flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <span class="font-bold">Total:</span> 
                    {{ filteredTeachersList.length }} enseignant{{ filteredTeachersList.length > 1 ? 's' : '' }}
                    <span v-if="classFilter">({{ classFilter }})</span>
                  </div>
                  <div>
                    <span class="font-bold">Heures planifiées:</span> 
                    <Tag :value="`${totalFilteredHours}h`" severity="info" />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </TabPanel>

 

        <!-- Onglet: Statistiques -->
        <TabPanel header="Statistiques">
          <div class="grid">
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-users text-4xl text-primary mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleStats.totalStudents }}</div>
                    <div class="text-600">Étudiants</div>
                  </div>
                </template>
              </Card>
            </div>
            
            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-clock text-4xl text-green-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.heures_contact || 0 }}h</div>
                    <div class="text-600">Heures de contact</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-star-fill text-4xl text-orange-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleForm.credits || 0 }}</div>
                    <div class="text-600">Crédits ECTS</div>
                  </div>
                </template>
              </Card>
            </div>

            <div class="col-12 md:col-3">
              <Card>
                <template #content>
                  <div class="text-center">
                    <i class="pi pi-book text-4xl text-purple-500 mb-2"></i>
                    <div class="text-2xl font-bold">{{ moduleTeachers.length }}</div>
                    <div class="text-600">Enseignants</div>
                  </div>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

        <!-- Onglet: Historique & Validation -->
        <TabPanel header="Historique">
          <div class="grid">
            <!-- Validation du planning -->
            <div class="col-12 lg:col-4">
              <Card>
                <template #title>
                  <div class="flex align-items-center gap-2">
                    <i class="pi pi-check-circle"></i>
                    Validation du planning
                  </div>
                </template>
                <template #content>
                  <div class="mb-3">
                    <div class="flex align-items-center gap-2 mb-2">
                      <Tag :value="validationStatus.label" :severity="validationStatus.severity" />
                      <span class="text-sm text-600">{{ selectedClass || 'Toutes classes' }}</span>
                    </div>
                    <div v-if="currentValidation?.validated_at" class="text-sm text-600">
                      Validé le {{ formatDate(currentValidation.validated_at) }}
                      <span v-if="currentValidation.validated_by_name">par {{ currentValidation.validated_by_name }}</span>
                    </div>
                  </div>
                  
                  <div class="flex flex-column gap-2">
                    <Button 
                      v-if="validationStatus.status !== 'validated'"
                      label="Valider le planning" 
                      icon="pi pi-check" 
                      severity="success"
                      @click="validatePlanning"
                      :disabled="filteredPlanning.length === 0"
                    />
                    <Button 
                      v-if="validationStatus.status === 'validated'"
                      label="Retirer la validation" 
                      icon="pi pi-times" 
                      severity="warning"
                      outlined
                      @click="unvalidatePlanning"
                    />
                    <Button 
                      label="Soumettre pour révision" 
                      icon="pi pi-send" 
                      severity="info"
                      outlined
                      @click="submitForReview"
                      :disabled="filteredPlanning.length === 0"
                    />
                  </div>

                  <!-- Budget heures -->
                  <div class="mt-4 pt-3 border-top-1 surface-border">
                    <h4 class="mt-0 mb-3">Budget heures</h4>
                    <div class="flex flex-column gap-2">
                      <div class="flex justify-content-between">
                        <span>Heures prévues:</span>
                        <InputNumber v-model="hoursBudget.planned_hours" :min="0" :max="999" suffix="h" class="w-6rem" size="small" />
                      </div>
                      <div class="flex justify-content-between align-items-center">
                        <span>Heures planifiées:</span>
                        <Tag :value="`${totalPlanningHours}h`" :severity="totalPlanningHours >= (hoursBudget.planned_hours || 0) ? 'success' : 'warning'" />
                      </div>
                      <div class="flex justify-content-between align-items-center">
                        <span>Différence:</span>
                        <Tag 
                          :value="`${hoursDifference >= 0 ? '+' : ''}${hoursDifference}h`" 
                          :severity="hoursDifference === 0 ? 'success' : (hoursDifference > 0 ? 'info' : 'danger')" 
                        />
                      </div>
                      <Button label="Sauvegarder budget" icon="pi pi-save" size="small" outlined class="mt-2" @click="saveHoursBudget" />
                    </div>
                  </div>
                </template>
              </Card>
            </div>

            <!-- Historique des modifications -->
            <div class="col-12 lg:col-8">
              <Card>
                <template #title>
                  <div class="flex justify-content-between align-items-center">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-history"></i>
                      Historique des modifications
                    </div>
                    <Button icon="pi pi-refresh" text @click="loadPlanningHistory" :loading="loadingHistory" />
                  </div>
                </template>
                <template #content>
                  <DataTable 
                    :value="planningHistory" 
                    :loading="loadingHistory"
                    :rows="10"
                    :paginator="planningHistory.length > 10"
                    responsiveLayout="scroll"
                    stripedRows
                    class="p-datatable-sm"
                  >
                    <Column field="changed_at" header="Date" style="width: 140px">
                      <template #body="{ data }">
                        <span class="text-sm">{{ formatDateTime(data.changed_at) }}</span>
                      </template>
                    </Column>
                    <Column field="action" header="Action" style="width: 90px">
                      <template #body="{ data }">
                        <Tag 
                          :value="getActionLabel(data.action)" 
                          :severity="getActionSeverity(data.action)"
                          class="text-xs"
                        />
                      </template>
                    </Column>
                    <Column field="dateX" header="DateX" style="width: 120px">
                      <template #body="{ data }">
                        <Tag :value="formatDateForDisplay(data.week_number, data.day)" severity="success" size="small" />
                      </template>
                    </Column>
                    <Column field="changes_summary" header="Modifications">
                      <template #body="{ data }">
                        <span class="text-sm">{{ data.changes_summary || 'Modification' }}</span>
                      </template>
                    </Column>
                    <Column field="changed_by_name" header="Par" style="width: 120px">
                      <template #body="{ data }">
                        <span class="text-sm text-600">{{ data.changed_by_name || 'Système' }}</span>
                      </template>
                    </Column>
                    <template #empty>
                      <div class="text-center p-4">
                        <i class="pi pi-inbox text-4xl text-400 mb-2"></i>
                        <p class="text-600">Aucune modification enregistrée</p>
                        <small class="text-400">L'historique sera enregistré automatiquement</small>
                      </div>
                    </template>
                  </DataTable>
                </template>
              </Card>
            </div>
          </div>
        </TabPanel>

      </TabView>
    </div>

    <!-- Dialog: Ajouter un enseignant -->
    <Dialog v-model:visible="showAddTeacherDialog" header="Ajouter un enseignant" :style="{ width: '450px' }" modal>
      <div class="p-fluid">
        <div class="field">
          <label for="teacher-name">Nom</label>
          <InputText id="teacher-name" v-model="newTeacher.name" />
        </div>
        <div class="field">
          <label for="teacher-email">Email</label>
          <InputText id="teacher-email" v-model="newTeacher.email" type="email" />
        </div>
        <div class="field">
          <label for="teacher-hours">Heures</label>
          <InputNumber id="teacher-hours" v-model="newTeacher.hours" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="showAddTeacherDialog = false" />
        <Button label="Ajouter" icon="pi pi-check" @click="addTeacher" />
      </template>
    </Dialog>

    <!-- Dialogue: Détails enseignant -->
    <Dialog 
      v-model:visible="showTeacherDetailsDialog" 
      :header="`Détails - ${selectedTeacher?.name || 'Enseignant'}`"
      :style="{ width: '800px' }"
      modal
    >
      <div v-if="selectedTeacher" class="teacher-details">
        <!-- Informations générales -->
        <div class="grid mb-4">
          <div class="col-12 md:col-6">
            <div class="p-3 surface-100 border-round">
              <h4 class="m-0 mb-2">Informations</h4>
              <p><strong>Nom:</strong> {{ selectedTeacher.name }}</p>
              <p><strong>Email:</strong> {{ selectedTeacher.email || '—' }}</p>
              <p><strong>Total heures:</strong> {{ selectedTeacher.planningHours }}h</p>
              <p><strong>Séances:</strong> {{ selectedTeacher.sessionsCount }}</p>
            </div>
          </div>
          <div class="col-12 md:col-6">
            <div class="p-3 surface-100 border-round">
              <h4 class="m-0 mb-2">Statistiques</h4>
              <Tag :value="`${selectedTeacher.planningHours}h total`" :severity="getHoursSeverity(selectedTeacher.planningHours)" class="mb-2" />
              <p><strong>Modules:</strong> {{ selectedTeacher.modules?.length || 0 }}</p>
              <p><strong>Source:</strong> {{ selectedTeacher.source || 'Planning' }}</p>
            </div>
          </div>
        </div>
        
        <!-- Séances groupées par semaine -->
        <div v-if="selectedTeacher">
          <h4 class="m-0 mb-3">Planning par semaine - {{ selectedTeacher.name }}</h4>
          
          <div v-if="getTeacherGroupedSessions(selectedTeacher.name).length > 0">
            <div class="space-y-3">
              <div 
                v-for="week in getTeacherGroupedSessions(selectedTeacher.name)" 
                :key="week.week_number"
                class="p-3 surface-50 border-round border-1 border-200"
              >
                <!-- En-tête de semaine -->
                <div class="flex justify-content-between align-items-center mb-3">
                  <div class="flex align-items-center gap-2">
                    <Tag :value="`Semaine ${week.week_number}`" severity="info" />
                    <Tag :value="`${week.totalHours}h`" severity="success" />
                    <Tag :value="`${week.sessions.length} séance${week.sessions.length > 1 ? 's' : ''}`" severity="secondary" />
                  </div>
                  <div class="flex gap-1">
                    <Tag 
                      v-for="cls in week.classes" 
                      :key="cls"
                      :value="normalizeClass(cls)" 
                      size="small"
                      :style="{ backgroundColor: '#' + getClassDisplayColor(cls), color: getClassTextColor(cls) }"
                    />
                  </div>
                </div>
                
                <!-- Détail des séances de la semaine -->
                <div class="grid gap-2">
                  <div 
                    v-for="session in week.sessions" 
                    :key="`${session.week_number}-${session.day}-${session.start_time}`"
                    class="flex align-items-center gap-3 p-2 bg-white border-round"
                  >
                    <!-- Jour et Semaine -->
                    <div class="flex flex-column" style="min-width: 80px">
                      <span class="font-medium text-sm">{{ session.day }}</span>
                      <span class="text-500 text-xs">S{{ session.week_number }}</span>
                    </div>
                    
                    <!-- Heures -->
                    <div class="flex align-items-center gap-1">
                      <Tag :value="session.start_time" severity="secondary" size="small" />
                      <span class="text-400">-</span>
                      <Tag :value="session.end_time" severity="secondary" size="small" />
                    </div>
                    
                    <!-- Classe -->
                    <Tag 
                      :value="normalizeClass(session.class_code)" 
                      size="small"
                      :style="{ backgroundColor: '#' + getClassDisplayColor(session.class_code), color: getClassTextColor(session.class_code) }"
                    />
                    
                    <!-- Cours -->
                    <div class="flex-1">
                      <span class="text-sm line-clamp-1">{{ session.course_title || '—' }}</span>
                    </div>
                    
                    <!-- Durée -->
                    <Tag :value="`${getSlotHours(session)}h`" severity="success" size="small" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div v-else class="text-center p-4">
            <i class="pi pi-calendar text-3xl text-400 mb-2"></i>
            <p class="text-600">Aucune séance planifiée pour cet enseignant</p>
          </div>
        </div>
      </div>
      
      <template #footer>
        <Button 
          label="Fermer" 
          icon="pi pi-times" 
          @click="showTeacherDetailsDialog = false" 
          class="p-button-text"
        />
      </template>
    </Dialog>

    <!-- Dialogue d'édition/ajout de séance (même format que ModulePlanningView) -->
    <Dialog 
      v-model:visible="showDialog" 
      :header="editingSession?.id ? 'Modifier la séance' : 'Ajouter une séance'"
      :style="{ width: '700px' }"
      modal
    >
      <div class="session-form" v-if="editingSession">
        <div class="field-row">
          <div class="field">
            <label>Classe / Volée</label>
            <Dropdown 
              v-model="editingSession.classCode" 
              :options="classOptions" 
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner une classe"
              class="w-full"
            />
          </div>
          <div class="field">
            <label>Semaine</label>
            <InputNumber v-model="editingSession.weekNumber" :min="1" :max="52" class="w-full" />
          </div>
          <div class="field">
            <label>Jour</label>
            <Dropdown 
              v-model="editingSession.day" 
              :options="dayOptions" 
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
            <small class="text-500" v-if="editingSession.weekNumber && editingSession.day">
              {{ formatDateForDisplay(editingSession.weekNumber, editingSession.day) }}
            </small>
          </div>
        </div>
        
        <div class="field-row">
          <div class="field">
            <label>Heure début</label>
            <InputText v-model="editingSession.startTime" placeholder="09:00" class="w-full" />
          </div>
          <div class="field">
            <label>Heure fin</label>
            <InputText v-model="editingSession.endTime" placeholder="11:00" class="w-full" />
          </div>
        </div>
        
        <div class="field">
          <label>Nom du cours (affiché dans le planning)</label>
          <Textarea 
            v-model="editingSession.courseTitle" 
            placeholder="Ex: Introduction Module: questions-réponses en lien avec la vidéo"
            :rows="2"
            class="w-full"
          />
          <small class="text-500">Ce texte apparaîtra comme titre principal du cours</small>
        </div>
        
        <div class="field">
          <label>Détails / Activité complémentaire</label>
          <Dropdown 
            v-model="editingSession.activity" 
            :options="activityOptions"
            editable
            placeholder="Type d'activité"
            class="w-full"
          />
        </div>
        
        <div class="field">
          <label>Enseignants (max 6)</label>
          <AutoComplete 
            v-model="editingSession.teachers"
            :suggestions="filteredTeachers"
            @complete="searchTeachers"
            optionLabel="name"
            placeholder="Saisissez un nom (Entrée pour valider)"
            multiple
            :forceSelection="false"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex align-items-center">
                <i v-if="slotProps.option.isNew" class="pi pi-plus mr-2 text-green-500"></i>
                <span :class="{ 'font-bold': slotProps.option.isNew }">
                  {{ slotProps.option.isNew ? 'Ajouter : ' : '' }}{{ slotProps.option.name }}
                </span>
              </div>
            </template>
          </AutoComplete>
          <small class="text-500">Sélectionnez jusqu'à 6 enseignants</small>
        </div>
        
        <div class="field-row">
          <div class="field">
            <label>Salle</label>
            <InputText v-model="editingSession.room" placeholder="Salle 101" class="w-full" />
          </div>
          <div class="field">
            <label>Notes</label>
            <InputText v-model="editingSession.notes" placeholder="Notes additionnelles" class="w-full" />
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-content-between">
          <Button 
            v-if="editingSession?.id" 
            label="Supprimer" 
            icon="pi pi-trash" 
            severity="danger" 
            class="p-button-text"
            @click="deleteCurrentSession"
          />
          <div class="flex gap-2">
            <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showDialog = false" />
            <Button label="Enregistrer" icon="pi pi-check" @click="saveSession" :loading="saving" />
          </div>
        </div>
      </template>
    </Dialog>

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useModules } from '@/composables/useModules'
import { useModulePermissions } from '@/composables/useModulePermissions'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Badge from 'primevue/badge'
import Chip from 'primevue/chip'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import ColorPicker from 'primevue/colorpicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import { supabase } from '@/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { 
  getModulePlanningStats,
  saveModuleTimeSlot,
  deleteModuleTimeSlot,
  getAvailableClasses
} from '@/services/modulePlanningService'
import { v4 as uuidv4 } from 'uuid'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { modules, loadModules, updateModule: updateModuleInStore } = useModules()
const { canEditModule, isAdmin, getPermissionErrorMessage } = useModulePermissions()

const moduleId = parseInt(route.params.id)
const loading = ref(true)
const saving = ref(false)
const module = ref(null)
const permissionError = ref('')
const canEdit = ref(false)

// Formulaire du module
const moduleForm = ref({
  number: '',
  year: null,
  title: '',
  description: '',
  responsable: '',
  responsable_email: '',
  credits: null,
  heures_contact: null,
  color: '#3B82F6',
  short_code: '',
  coordinateur: ''
})

// Filtres par classe (même valeurs que le planning)
const classFilter = ref(null) // 'BAC25', 'BAC24-TP', or null
const loadingGlobalTeachers = ref(false)
const globalTeachers = ref([])
const selectedTeacher = ref(null)
const showTeacherDetailsDialog = ref(false)

// Enseignants du module
const moduleTeachers = ref([])
const showAddTeacherDialog = ref(false)
const newTeacher = ref({
  name: '',
  email: '',
  hours: 0
})

// Statistiques
const moduleStats = ref({
  totalStudents: 0,
  totalHours: 0
})

// Planning du module
const modulePlanning = ref([])
const loadingPlanning = ref(false)
const selectedClass = ref(null)
const planningView = ref('list') // 'list' ou 'calendar'

// Historique et validation
const planningHistory = ref([])
const loadingHistory = ref(false)
const currentValidation = ref(null)
const hoursBudget = ref({
  planned_hours: 0,
  lecture_hours: 0,
  tp_hours: 0,
  td_hours: 0
})

// Normaliser le code classe (B25-tp = B25-TP) - utilisé partout
const normalizeClass = (code) => {
  if (!code) return ''
  return code.toUpperCase().trim()
}

// Planning filtré par classe (comparaison normalisée)
const filteredPlanning = computed(() => {
  if (!selectedClass.value) return []
  const normalizedFilter = normalizeClass(selectedClass.value)
  return modulePlanning.value.filter(slot => {
    const normalizedClassCode = normalizeClass(slot.class_code)
    // Filtrer par classe exacte
    return normalizedClassCode === normalizedFilter
  })
})

// Calculer les heures depuis un créneau
const getSlotHours = (slot) => {
  if (!slot.start_time || !slot.end_time) return 0
  const [startH, startM] = slot.start_time.split(':').map(Number)
  const [endH, endM] = slot.end_time.split(':').map(Number)
  return (endH + endM / 60) - (startH + startM / 60)
}

// Enseignants avec statistiques d'heures depuis le planning
const teachersWithStats = computed(() => {
  // Utiliser un Map pour éviter les doublons et garantir l'unicité par nom
  const teachersMap = new Map()
  
  // D'abord ajouter les enseignants de moduleTeachers (priorité)
  moduleTeachers.value.forEach(teacher => {
    if (teacher.name) {
      const normalizedName = teacher.name.toLowerCase()
      teachersMap.set(normalizedName, {
        ...teacher,
        planningHours: 0,
        sessionsCount: 0,
        source: teacher.source || 'module'
      })
    }
  })
  
  // Ensuite ajouter les enseignants du planning qui ne sont pas déjà dans moduleTeachers
  modulePlanning.value.forEach(slot => {
    const teachers = slot.teachers_list || slot.teachers || []
    teachers.forEach(t => {
      const name = typeof t === 'object' ? t.name : t
      if (name) {
        const normalizedName = name.toLowerCase()
        
        // Si cet enseignant n'est pas déjà dans moduleTeachers, l'ajouter
        if (!teachersMap.has(normalizedName)) {
          teachersMap.set(normalizedName, {
            id: Date.now() + Math.random(),
            name: name,
            email: '',
            hours: 0,
            source: 'planning',
            planningHours: 0,
            sessionsCount: 0
          })
        }
      }
    })
  })
  
  // Maintenant calculer les heures pour tous les enseignants uniques
  teachersMap.forEach(teacher => {
    let planningHours = 0
    let sessionsCount = 0
    let hasValidHours = false
    
    modulePlanning.value.forEach(slot => {
      const teachers = slot.teachers_list || slot.teachers || []
      const teacherNames = teachers.map(t => typeof t === 'object' ? t.name : t)
      
      if (teacherNames.some(name => name?.toLowerCase() === teacher.name.toLowerCase())) {
        sessionsCount++
        const slotHours = getSlotHours(slot)
        
        // Si c'est un enseignant manuel et qu'on trouve des heures valides
        if (teacher.source === 'manual' && slotHours > 0) {
          planningHours += slotHours
          hasValidHours = true
        } else if (teacher.source !== 'manual') {
          // Pour les enseignants non manuels, calculer normalement
          planningHours += slotHours
          hasValidHours = true
        }
      }
    })
    
    // Pour les enseignants manuels sans heures valides, garder NaN
    let finalHours = planningHours
    if (teacher.source === 'manual' && !hasValidHours) {
      finalHours = NaN
    }
    
    // Mettre à jour les heures dans le Map
    teacher.planningHours = hasValidHours ? Math.round(finalHours * 10) / 10 : NaN
    teacher.sessionsCount = sessionsCount
  })
  
  // Convertir le Map en tableau et trier
  return Array.from(teachersMap.values()).sort((a, b) => {
    // Mettre les NaN à la fin
    if (isNaN(a.planningHours) && !isNaN(b.planningHours)) return 1
    if (!isNaN(a.planningHours) && isNaN(b.planningHours)) return -1
    return b.planningHours - a.planningHours
  })
})

// Liste filtrée des enseignants (avec filtre automatique >0h ou NaN)
const filteredTeachersList = computed(() => {
  let teachers = teachersWithStats.value
  
  // Si filtre de classe, utiliser les enseignants du planning filtré par classe
  if (classFilter.value) {
    // Filtrer les enseignants selon les classes du planning
    const filteredPlanning = modulePlanning.value.filter(slot => {
      const normalizedClass = normalizeClass(slot.class_code)
      const normalizedFilter = normalizeClass(classFilter.value)
      return normalizedClass === normalizedFilter
    })
    
    // Extraire les enseignants uniques du planning filtré
    const teacherNames = new Set()
    filteredPlanning.forEach(slot => {
      const teachers = slot.teachers_list || slot.teachers || []
      teachers.forEach(t => {
        const name = typeof t === 'object' ? t.name : t
        if (name && name.trim()) {
          teacherNames.add(name.trim())
        }
      })
    })
    
    // Filtrer teachersWithStats pour ne garder que ceux du planning filtré
    teachers = teachersWithStats.value.filter(teacher => 
      teacherNames.has(teacher.name)
    )
  }
  
  // Filtrer automatiquement pour n'afficher que >0h ou NaN, SAUF pour les nouveaux enseignants manuels
  let filtered = teachers.filter(teacher => {
    const hours = teacher.planningHours
    
    // Toujours inclure les enseignants ajoutés manuellement (source: 'manual')
    if (teacher.source === 'manual') {
      return true
    }
    
    // Pour les autres, n'afficher que >0h ou NaN
    return hours > 0 || isNaN(hours) || hours === null || hours === undefined
  })
  
  return filtered.sort((a, b) => b.planningHours - a.planningHours)
})

// Total des heures filtrées
const totalFilteredHours = computed(() => {
  return Math.round(filteredTeachersList.value.reduce((sum, teacher) => sum + (teacher.planningHours || 0), 0) * 10) / 10
})

// Sévérité des heures
const getHoursSeverity = (hours) => {
  if (isNaN(hours) || hours === null || hours === undefined) return 'warning'
  if (hours > 0) return 'success'
  return 'secondary'
}

// Label du filtre de classe (plus nécessaire car on utilise directement la valeur)
// const getClassFilterLabel = () => {
//   switch (classFilter.value) {
//     case 'BAC25': return 'Temps plein BAC 25'
//     case 'BAC24-TP': return 'Temps partiel BAC24-TP'
//     default: return ''
//   }
// }

// Total des heures planifiées
const totalPlanningHours = computed(() => {
  return Math.round(modulePlanning.value.reduce((sum, slot) => sum + getSlotHours(slot), 0) * 10) / 10
})

// Différence heures prévues vs planifiées
const hoursDifference = computed(() => {
  return Math.round((totalPlanningHours.value - (hoursBudget.value.planned_hours || 0)) * 10) / 10
})

// Statut de validation
const validationStatus = computed(() => {
  if (!currentValidation.value) {
    return { status: 'draft', label: 'Brouillon', severity: 'secondary' }
  }
  const statusMap = {
    'draft': { label: 'Brouillon', severity: 'secondary' },
    'pending': { label: 'En attente', severity: 'warning' },
    'validated': { label: 'Validé', severity: 'success' },
    'rejected': { label: 'Rejeté', severity: 'danger' }
  }
  return { status: currentValidation.value.status, ...statusMap[currentValidation.value.status] }
})

// Détecter les conflits horaires (même prof planifié 2x au même moment)
const planningConflicts = computed(() => {
  const conflicts = []
  const slots = modulePlanning.value
  
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      const slotA = slots[i]
      const slotB = slots[j]
      
      // Même semaine et même jour
      if (slotA.week_number !== slotB.week_number || slotA.day !== slotB.day) continue
      
      // Vérifier chevauchement horaire
      const startA = slotA.start_time || '00:00'
      const endA = slotA.end_time || '23:59'
      const startB = slotB.start_time || '00:00'
      const endB = slotB.end_time || '23:59'
      
      const overlap = startA < endB && startB < endA
      if (!overlap) continue
      
      // Vérifier si même enseignant
      const teachersA = (slotA.teachers_list || slotA.teachers || []).map(t => 
        (typeof t === 'object' ? t.name : t)?.toLowerCase()
      ).filter(Boolean)
      const teachersB = (slotB.teachers_list || slotB.teachers || []).map(t => 
        (typeof t === 'object' ? t.name : t)?.toLowerCase()
      ).filter(Boolean)
      
      const commonTeachers = teachersA.filter(t => teachersB.includes(t))
      
      if (commonTeachers.length > 0) {
        conflicts.push({
          teacher: commonTeachers[0],
          week: slotA.week_number,
          day: formatDay(slotA.day),
          slotA: {
            time: `${slotA.start_time?.substring(0,5)} - ${slotA.end_time?.substring(0,5)}`,
            class: normalizeClass(slotA.class_code)
          },
          slotB: {
            time: `${slotB.start_time?.substring(0,5)} - ${slotB.end_time?.substring(0,5)}`,
            class: normalizeClass(slotB.class_code)
          }
        })
      }
    }
  }
  
  return conflicts
})

// Semaines pour la vue calendrier
const calendarWeeks = computed(() => {
  const weeks = new Map()
  filteredPlanning.value.forEach(slot => {
    if (!weeks.has(slot.week_number)) {
      weeks.set(slot.week_number, {
        number: slot.week_number,
        dateRange: getWeekDateRange(slot.week_number, slot.date)
      })
    }
  })
  return Array.from(weeks.values()).sort((a, b) => a.number - b.number)
})

// Obtenir la plage de dates d'une semaine
const getWeekDateRange = (weekNumber, sampleDate) => {
  if (!sampleDate) return ''
  try {
    const date = new Date(sampleDate)
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
    const friday = new Date(monday)
    friday.setDate(monday.getDate() + 4)
    return `${monday.toLocaleDateString('fr-CH')} - ${friday.toLocaleDateString('fr-CH')}`
  } catch {
    return ''
  }
}

// Obtenir les créneaux d'un jour spécifique
const getDaySlots = (weekNumber, day) => {
  return filteredPlanning.value
    .filter(slot => slot.week_number === weekNumber && slot.day?.toLowerCase() === day.toLowerCase())
    .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
}

// Couleur selon l'activité (pour bordure calendrier)
const getActivityColor = (activity) => {
  const colors = {
    'Cours': '#3B82F6',
    'TP': '#22C55E',
    'TD': '#F59E0B',
    'Examen': '#EF4444',
    'Atelier': '#6B7280'
  }
  return colors[activity] || '#3B82F6'
}

// Couleurs pour les semaines (cycle de couleurs)
const weekColors = [
  { bg: '#3B82F6', border: '#1D4ED8' },  // Bleu
  { bg: '#10B981', border: '#047857' },  // Vert
  { bg: '#F59E0B', border: '#B45309' },  // Orange
  { bg: '#06B6D4', border: '#0891B2' },  // Cyan
  { bg: '#84CC16', border: '#4D7C0F' },  // Lime
  { bg: '#F97316', border: '#C2410C' },  // Orange foncé
  { bg: '#3B82F6', border: '#1D4ED8' },  // Bleu
  { bg: '#10B981', border: '#047857' },  // Vert
]

const getWeekColor = (weekIndex) => {
  return weekColors[weekIndex % weekColors.length]?.bg || '#3B82F6'
}

const getWeekBorderColor = (weekIndex) => {
  return weekColors[weekIndex % weekColors.length]?.border || '#1D4ED8'
}

// Couleurs pour les jours
const dayColors = [
  '#3B82F6',  // Lundi - Bleu
  '#10B981',  // Mardi - Vert
  '#F59E0B',  // Mercredi - Orange
  '#06B6D4',  // Jeudi - Cyan
  '#F97316'   // Vendredi - Orange foncé
]

const dayBackgroundColors = [
  '#EFF6FF',  // Lundi - Bleu clair
  '#ECFDF5',  // Mardi - Vert clair
  '#FFFBEB',  // Mercredi - Orange clair
  '#E0F2FE',  // Jeudi - Cyan clair
  '#FED7AA'   // Vendredi - Orange clair
]

const getDayColor = (dayIndex) => {
  return dayColors[dayIndex] || '#3B82F6'
}

const getDayBackgroundColor = (dayIndex) => {
  return dayBackgroundColors[dayIndex] || '#EFF6FF'
}

// Données groupées par semaine et jour pour un meilleur affichage
const groupedPlanningData = computed(() => {
  if (!filteredPlanning.value.length) return []
  
  const grouped = []
  let currentWeek = null
  let currentDay = null
  let weekGroup = null
  let dayGroup = null
  
  filteredPlanning.value.forEach((slot) => {
    const weekNum = slot.week_number
    const dayName = slot.day
    
    // Nouvelle semaine
    if (weekNum !== currentWeek) {
      currentWeek = weekNum
      weekGroup = {
        weekNumber: weekNum,
        days: [],
        weekSpan: 0
      }
      grouped.push(weekGroup)
      currentDay = null
    }
    
    // Nouveau jour dans la même semaine
    if (dayName !== currentDay) {
      currentDay = dayName
      dayGroup = {
        dayName: dayName,
        slots: [],
        daySpan: 0
      }
      weekGroup.days.push(dayGroup)
    }
    
    dayGroup.slots.push(slot)
    weekGroup.weekSpan++
    dayGroup.daySpan++
  })
  
  return grouped
})

// Données plates pour DataTable avec rowSpan (sans lignes d'ajout)
const flatPlanningData = computed(() => {
  const flat = []
  groupedPlanningData.value.forEach(weekGroup => {
    weekGroup.days.forEach((dayGroup, dayIndex) => {
      dayGroup.slots.forEach((slot, slotIndex) => {
        flat.push({
          ...slot,
          weekSpan: dayIndex === 0 ? weekGroup.weekSpan : 0,
          daySpan: slotIndex === 0 ? dayGroup.daySpan : 0,
          isFirstSlotOfWeek: dayIndex === 0 && slotIndex === 0,
          isFirstSlotOfDay: slotIndex === 0
        })
      })
    })
  })
  return flat
})

// Style des lignes pour grouper par semaine et jour
const rowClass = (data) => {
  const classes = [];
  
  // Alternance de couleur par semaine (bleu très clair / blanc)
  classes.push(data.week_number % 2 === 0 ? 'week-even' : 'week-odd');

  // Bordure supérieure si c'est une nouvelle semaine
  if (data.isFirstSlotOfWeek) {
    classes.push('new-week-row');
  } 
  // Bordure supérieure légère si c'est un nouveau jour dans la même semaine
  else if (data.isFirstSlotOfDay) {
    classes.push('new-day-row');
  } else {
    classes.push('same-day-row');
  }

  return classes;
};

// Variables pour l'édition de séance - utilise le même format que ModulePlanningView
const showDialog = ref(false)
const editingSession = ref(null)

// Variables pour les enseignants (même format que ModulePlanningView)
const teachers = ref([])
const filteredTeachers = ref([])

// Options pour les formulaires (même format que ModulePlanningView)
const classOptions = ref([
  { label: 'BAC25', value: 'BAC25' },
  { label: 'BAC24-TP', value: 'BAC24-TP' }
])

const dayOptions = [
  { label: 'Lundi', value: 'lundi' },
  { label: 'Mardi', value: 'mardi' },
  { label: 'Mercredi', value: 'mercredi' },
  { label: 'Jeudi', value: 'jeudi' },
  { label: 'Vendredi', value: 'vendredi' }
]

const activityOptions = ['Cours', 'TP', 'TD', 'Examen', 'Atelier', 'Conférence', 'Stage']

// Supprimer la séance en cours de modification
const deleteCurrentSession = async () => {
  if (!editingSession.value?.id) return
  
  try {
    // Demander confirmation
    const confirmed = await new Promise((resolve) => {
      const result = confirm(`Êtes-vous sûr de vouloir supprimer cette séance ?\n\n${editingSession.value.course_title || 'Sans titre'}\n${editingSession.value.day} ${editingSession.value.startTime}-${editingSession.value.endTime}\n\nCette action est irréversible.`)
      resolve(result)
    })
    
    if (!confirmed) return
    
    // Supprimer la séance
    const { error } = await supabase
      .from('module_time_slots')
      .delete()
      .eq('id', editingSession.value.id)
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Séance supprimée',
      detail: 'La séance a été supprimée avec succès',
      life: 3000
    })
    
    // Fermer le dialogue
    showDialog.value = false
    
    // Recharger le planning
    await loadModulePlanning()
    
  } catch (error) {
    console.error('Erreur suppression séance:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer la séance',
      life: 3000
    })
  }
}

// Supprimer une séance
const deleteSession = async (session) => {
  if (!session?.id) return
  
  try {
    // Demander confirmation
    const confirmed = await new Promise((resolve) => {
      const result = confirm(`Êtes-vous sûr de vouloir supprimer cette séance ?\n\n${session.course_title || 'Sans titre'}\n${session.day} ${session.start_time}-${session.end_time}\n\nCette action est irréversible.`)
      resolve(result)
    })
    
    if (!confirmed) return
    
    // Supprimer la séance
    const { error } = await supabase
      .from('module_time_slots')
      .delete()
      .eq('id', session.id)
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Séance supprimée',
      detail: 'La séance a été supprimée avec succès',
      life: 3000
    })
    
    // Recharger le planning
    await loadModulePlanning()
    
  } catch (error) {
    console.error('Erreur suppression séance:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer la séance',
      life: 3000
    })
  }
}

// Éditer une séance - utiliser le dialogue local (même logique que ModulePlanningView)
const editSession = (session) => {
  // Normaliser les enseignants en objets pour AutoComplete (comme dans ModulePlanningView)
  const normalizedTeachers = []
  if (session.teacher_name) {
    // Si teacher_name est une chaîne avec plusieurs noms séparés par des virgules
    const teacherNames = session.teacher_name.split(',').map(name => name.trim()).filter(name => name)
    normalizedTeachers.push(...teacherNames.map(name => ({ name })))
  } else if (session.teachers_list && Array.isArray(session.teachers_list)) {
    // Si teachers_list est un tableau d'objets ou de chaînes
    session.teachers_list.forEach(t => {
      if (typeof t === 'string') {
        normalizedTeachers.push({ name: t })
      } else if (t && t.name) {
        normalizedTeachers.push({ name: t.name })
      }
    })
  }
  
  editingSession.value = {
    id: session.id,
    classCode: session.class_code,
    weekNumber: session.week_number,
    day: session.day?.toLowerCase(),
    startTime: session.start_time,
    endTime: session.end_time,
    moduleCode: module.value?.code,
    courseTitle: session.course_title || '',
    activity: session.activity,
    teachers: normalizedTeachers,
    room: session.room,
    notes: session.notes || ''
  }
  showDialog.value = true
}

// Ajouter une séance à une semaine - utiliser le dialogue local
const addSessionToWeek = (weekNumber) => {
  editingSession.value = {
    id: null,
    classCode: selectedClass.value || 'BAC25',
    weekNumber: weekNumber,
    day: 'lundi',
    startTime: '09:00',
    endTime: '11:00',
    moduleCode: module.value?.code,
    courseTitle: '',
    activity: 'Cours',
    teachers: [],
    room: '',
    notes: ''
  }
  showDialog.value = true
}

// Sauvegarder la séance (même logique que ModulePlanningView)
const saveSession = async () => {
  if (!editingSession.value) return
  
  saving.value = true
  try {
    // Normaliser les enseignants et identifier les nouveaux
    const normalizedTeachers = []
    const newTeachers = []
    
    const teachersArray = Array.isArray(editingSession.value.teachers) 
      ? editingSession.value.teachers 
      : (editingSession.value.teachers ? [editingSession.value.teachers] : [])
    
    teachersArray.forEach(t => {
      const teacherName = typeof t === 'object' && t !== null ? t.name : t
      normalizedTeachers.push(teacherName)
      
      // Si c'est un nouvel enseignant (isNew flag), l'ajouter à la liste du module
      if (typeof t === 'object' && t.isNew) {
        newTeachers.push({
          name: teacherName,
          email: t.email || '',
          hours: 0,
          source: 'manual'
        })
      }
    })
    
    // Enregistrer les nouveaux enseignants dans la liste du module
    if (newTeachers.length > 0) {
      for (const newTeacher of newTeachers) {
        // Vérifier si l'enseignant n'existe pas déjà
        const exists = moduleTeachers.value.some(t => 
          t.name.toLowerCase() === newTeacher.name.toLowerCase()
        )
        
        if (!exists) {
          // Ajouter directement à moduleTeachers (sans email requis pour les enseignants de séance)
          const newTeacherObj = {
            id: Date.now() + Math.random(), // ID temporaire
            name: newTeacher.name,
            email: newTeacher.email || '',
            hours: 0,
            source: 'manual'
          }
          
          moduleTeachers.value.push(newTeacherObj)
          
          // Forcer la mise à jour immédiate des stats en ajoutant à teachersWithStats
          // teachersWithStats est une computed property, donc elle se mettra à jour automatiquement
          // quand moduleTeachers change
        }
      }
      
      // Pas besoin de recharger car teachersWithStats est une computed property
      // Elle se mettra à jour automatiquement quand moduleTeachers change
      // await loadModuleTeachers() // Commenté pour éviter le rechargement inutile
    }
    
    await saveModuleTimeSlot({
      id: editingSession.value.id,
      class_code: editingSession.value.classCode,
      week_number: editingSession.value.weekNumber,
      day: editingSession.value.day,
      date: getDateFromWeekAndDay(editingSession.value.weekNumber, editingSession.value.day),
      start_time: editingSession.value.startTime,
      end_time: editingSession.value.endTime,
      module_code: module.value?.code,
      course_title: editingSession.value.courseTitle,
      activity: editingSession.value.activity,
      teachers: normalizedTeachers,
      room: editingSession.value.room,
      notes: editingSession.value.notes
    })
    
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Séance enregistrée', life: 2000 })
    showDialog.value = false
    await loadModulePlanning()
  } catch (error) {
    console.error('Erreur save:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 3000 })
  } finally {
    saving.value = false
  }
}

// Charger les enseignants globaux (tous les modules)
const loadGlobalTeachers = async () => {
  loadingGlobalTeachers.value = true
  try {
    const { data: allPlanning, error: planningError } = await supabase
      .from('planning_time_slots')
      .select('module_code, teachers, class_code, start_time, end_time')
      .not('teachers', 'is', null)
      .not('teachers', 'eq', '[]')
    
    if (planningError) throw planningError
    
    // Grouper par enseignant
    const teachersMap = new Map()
    
    allPlanning?.forEach(slot => {
      const teachers = slot.teachers || []
      teachers.forEach(teacher => {
        const teacherName = typeof teacher === 'object' ? teacher.name : teacher
        if (!teacherName) return
        
        if (!teachersMap.has(teacherName)) {
          teachersMap.set(teacherName, {
            name: teacherName,
            email: '',
            planningHours: 0,
            sessionsCount: 0,
            modules: new Set()
          })
        }
        
        const teacherData = teachersMap.get(teacherName)
        teacherData.planningHours += getSlotHours(slot)
        teacherData.sessionsCount += 1
        teacherData.modules.add({
          module_code: slot.module_code,
          class_code: slot.class_code
        })
      })
    })
    
    // Convertir les Sets en Arrays
    globalTeachers.value = Array.from(teachersMap.values()).map(teacher => ({
      ...teacher,
      modules: Array.from(teacher.modules),
      planningHours: Math.round(teacher.planningHours * 10) / 10
    }))
    
  } catch (error) {
    console.error('Erreur chargement enseignants globaux:', error)
    globalTeachers.value = []
  } finally {
    loadingGlobalTeachers.value = false
  }
}

// Obtenir les séances groupées d'un enseignant
const getTeacherGroupedSessions = (teacherName) => {
  const sessions = getTeacherSessions(teacherName)
  
  // Grouper par semaine
  const groupedByWeek = {}
  
  sessions.forEach(session => {
    const weekKey = `Semaine ${session.week_number}`
    if (!groupedByWeek[weekKey]) {
      groupedByWeek[weekKey] = {
        week_number: session.week_number,
        sessions: [],
        totalHours: 0,
        classes: new Set()
      }
    }
    
    groupedByWeek[weekKey].sessions.push(session)
    groupedByWeek[weekKey].totalHours += getSlotHours(session)
    if (session.class_code) {
      groupedByWeek[weekKey].classes.add(session.class_code)
    }
  })
  
  // Convertir en tableau et trier
  return Object.values(groupedByWeek)
    .map(week => ({
      ...week,
      classes: Array.from(week.classes),
      totalHours: Math.round(week.totalHours * 10) / 10
    }))
    .sort((a, b) => a.week_number - b.week_number)
}
const getTeacherSessions = (teacherName) => {
  return modulePlanning.value.filter(slot => {
    const teachers = slot.teachers_list || slot.teachers || []
    const teacherNames = teachers.map(t => typeof t === 'object' ? t.name : t)
    return teacherNames.some(name => name?.toLowerCase() === teacherName?.toLowerCase())
  }).sort((a, b) => {
    // Trier par semaine puis par jour
    if (a.week_number !== b.week_number) {
      return a.week_number - b.week_number
    }
    const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
    return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
  })
}

// Afficher les détails d'un enseignant
const showTeacherDetails = (teacher) => {
  selectedTeacher.value = teacher
  showTeacherDetailsDialog.value = true
}

// Watcher pour le filtre de classe (plus nécessaire car on utilise le planning local)
// watch(classFilter, (newValue) => {
//   if (newValue) {
//     loadGlobalTeachers()
//   }
// })

// Charger le module
onMounted(async () => {
  try {
    await loadModules()
    await loadTeachers()
    
    // Trouver le module
    module.value = modules.value.find(m => m.id === moduleId)
    
    if (!module.value) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Module non trouvé',
        life: 3000
      })
      router.push('/admin/dashboard-rm')
      return
    }
    
    // Vérifier les permissions
    canEdit.value = canEditModule(module.value)
    
    if (!canEdit.value) {
      permissionError.value = getPermissionErrorMessage('edit')
      loading.value = false
      return
    }
    
    // Remplir le formulaire
    moduleForm.value = {
      number: module.value.number || '',
      year: module.value.year || null,
      title: module.value.title || '',
      description: module.value.description || '',
      responsable: module.value.responsable || '',
      responsable_email: module.value.responsable_email || '',
      credits: module.value.credits || null,
      heures_contact: module.value.heures_contact || null,
      color: module.value.color || '#3B82F6',
      short_code: module.value.short_code || '',
      coordinateur: module.value.coordinateur || ''
    }
    
    // Charger les données du module
    await Promise.all([
      loadModuleTeachers(),
      loadModulePlanning(),
      loadHoursBudget(),
      loadCurrentValidation(),
      loadPlanningHistory()
    ])
    
    loading.value = false
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le module',
      life: 3000
    })
    loading.value = false
  }
})

// Charger les enseignants (adapté de ModulePlanningView)
const loadTeachers = async () => {
  try {
    const { data: teacherData } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, forname, family_name, email')
      .in('role', ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio'])
    
    if (teacherData && teacherData.length > 0) {
      teachers.value = teacherData.map(t => ({
        id: t.user_id,
        name: t.display_name || `${t.forname} ${t.family_name}`,
        email: t.email
      }))
    }
  } catch (error) {
    console.error('Erreur chargement enseignants:', error)
  }
}

// Fonction de recherche d'enseignants pour l'autocomplétion
const searchTeachers = (event) => {
  const query = event.query.toLowerCase().trim()
  if (!query) {
    filteredTeachers.value = []
    return
  }
  
  // Combiner les enseignants de la DB et les enseignants du module
  const allTeachers = [
    ...teachers.value,  // Enseignants de la base de données
    ...moduleTeachers.value  // Enseignants du module (incluant ceux ajoutés manuellement)
  ]
  
  // Éliminer les doublons par nom
  const uniqueTeachers = []
  const seenNames = new Set()
  
  allTeachers.forEach(teacher => {
    const normalizedName = teacher.name.toLowerCase()
    if (!seenNames.has(normalizedName)) {
      seenNames.add(normalizedName)
      uniqueTeachers.push(teacher)
    }
  })
  
  // Filtrer par la requête de recherche
  const matchingTeachers = uniqueTeachers.filter(teacher => 
    teacher.name.toLowerCase().includes(query) ||
    (teacher.email && teacher.email.toLowerCase().includes(query))
  )
  
  // Vérifier si la requête correspond exactement à un enseignant existant
  const exactMatch = uniqueTeachers.find(teacher => 
    teacher.name.toLowerCase() === query
  )
  
  // Si pas de correspondance exacte, proposer de créer un nouvel enseignant
  if (!exactMatch && query.length > 2) {
    const newTeacher = {
      name: event.query,  // Garder la casse originale
      isNew: true,
      email: '',
      source: 'manual'
    }
    
    // Ajouter le nouvel enseignant au début des suggestions
    filteredTeachers.value = [newTeacher, ...matchingTeachers]
  } else {
    filteredTeachers.value = matchingTeachers
  }
}

// Sauvegarder le module
const saveModule = async () => {
  saving.value = true
  
  try {
    await updateModuleInStore(moduleId, moduleForm.value)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Module mis à jour avec succès',
      life: 3000
    })
    
    // Recharger les modules
    await loadModules()
    
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le module',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// Ajouter un enseignant
const addTeacher = async () => {
  if (!newTeacher.value.name || !newTeacher.value.email) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }
  
  try {
    // 0. Vérifier si l'enseignant existe déjà dans le module
    const existingTeacher = moduleTeachers.value.find(t => 
      t.name.toLowerCase() === newTeacher.value.name.toLowerCase() ||
      t.email?.toLowerCase() === newTeacher.value.email.toLowerCase()
    )
    
    if (existingTeacher) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Cet enseignant existe déjà dans ce module',
        life: 3000
      })
      return
    }
    
    // 1. Ajouter l'enseignant dans la base de données (table course_teachers)
    const { data: teacherData, error: teacherError } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('email', newTeacher.value.email)
      .single()
    
    let teacherId
    if (teacherError || !teacherData) {
      // Si l'enseignant n'existe pas dans user_profiles, créer uniquement l'association
      // dans course_teachers avec un ID temporaire, sans créer de profil
      
      // Utiliser un timestamp comme ID temporaire pour éviter les conflits
      teacherId = Date.now()
      
      // Ne pas créer de profil user_profiles pour éviter la contrainte FK
      // L'enseignant sera disponible dans le module mais n'aura pas de profil complet
      
      console.log('Création enseignant temporaire sans profil user_profiles:', newTeacher.value.name)
    } else {
      teacherId = teacherData.user_id
    }
    
    // 2. Ajouter l'association dans course_teachers
    const { error: courseTeacherError } = await supabase
      .from('course_teachers')
      .insert({
        course_code: module.value?.code,
        teacher_id: teacherId,
        hours: newTeacher.value.hours || 0
      })
    
    if (courseTeacherError) throw courseTeacherError
    
    // 3. Ajouter localement pour l'affichage immédiat
    moduleTeachers.value.push({ 
      ...newTeacher.value, 
      id: teacherId,
      source: 'course_teachers'
    })
    
    newTeacher.value = {
      name: '',
      email: '',
      hours: 0
    }
    
    showAddTeacherDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant ajouté et sauvegardé',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur ajout enseignant:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'ajouter l\'enseignant',
      life: 3000
    })
  }
}

// Retirer un enseignant
const removeTeacher = async (teacher) => {
  if (confirm(`Retirer ${teacher.name} de ce module ?`)) {
    try {
      // 1. Supprimer de la base de données (table course_teachers)
      if (teacher.source === 'course_teachers' && typeof teacher.id === 'number') {
        const { error } = await supabase
          .from('course_teachers')
          .delete()
          .eq('course_code', module.value?.code)
          .eq('teacher_id', teacher.id)
        
        if (error) {
          console.warn('Erreur suppression DB:', error)
          // Continuer quand même pour la suppression locale
        }
      }
      
      // 2. Supprimer localement pour l'affichage immédiat
      moduleTeachers.value = moduleTeachers.value.filter(t => t.id !== teacher.id)
      
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Enseignant retiré',
        life: 3000
      })
    } catch (error) {
      console.error('Erreur suppression enseignant:', error)
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Impossible de retirer l\'enseignant',
        life: 3000
      })
    }
  }
}

// Charger le planning du module depuis planning_time_slots
const loadModulePlanning = async () => {
  if (!module.value?.code) return
  
  loadingPlanning.value = true
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('module_code', module.value.code)
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) {
      console.warn('Erreur chargement planning:', error)
      modulePlanning.value = []
      return
    }
    
    // Transformer les données pour l'affichage (teachers array -> teacher_name string)
    modulePlanning.value = (data || []).map(slot => ({
      ...slot,
      // Convertir le tableau teachers en string pour l'affichage
      teacher_name: formatTeachersArray(slot.teachers),
      // Garder le tableau original pour les stats
      teachers_list: slot.teachers || []
    }))
    console.log('📅 Planning chargé:', modulePlanning.value.length, 'séances')
  } catch (error) {
    console.error('Erreur planning:', error)
    modulePlanning.value = []
  } finally {
    loadingPlanning.value = false
  }
}

// Charger les enseignants du module (course_teachers + planning) - MODIFIÉ pour utiliser les enseignants de la DB
const loadModuleTeachers = async () => {
  if (!module.value?.code) return
  
  try {
    const teachersMap = new Map()
    
    // 1. Récupérer les enseignants via course_teachers
    const { data, error } = await supabase
      .from('course_teachers')
      .select(`
        teacher_id,
        hours,
        user_profiles(
          user_id,
          email,
          forname,
          family_name,
          display_name,
          avatar_url
        )
      `)
    
    if (!error && data) {
      data.forEach(ct => {
        const id = ct.teacher_id
        if (!teachersMap.has(id)) {
          teachersMap.set(id, {
            id,
            name: ct.user_profiles?.display_name || 
                  `${ct.user_profiles?.forname || ''} ${ct.user_profiles?.family_name || ''}`.trim() || 'Inconnu',
            email: ct.user_profiles?.email || '',
            avatar: ct.user_profiles?.avatar_url,
            hours: 0,
            source: 'course_teachers'
          })
        }
        teachersMap.get(id).hours += ct.hours || 0
      })
    }
    
    // 2. Ajouter les enseignants du planning (tableau teachers)
    if (modulePlanning.value.length > 0) {
      const planningTeachers = new Set()
      modulePlanning.value.forEach(slot => {
        // Utiliser teachers_list (tableau) ou teachers directement
        const teachers = slot.teachers_list || slot.teachers || []
        if (Array.isArray(teachers)) {
          teachers.forEach(t => {
            const name = typeof t === 'object' ? t.name : t
            if (name && name.trim()) {
              planningTeachers.add(name.trim())
            }
          })
        }
      })
      
      planningTeachers.forEach(teacherName => {
        // Vérifier si pas déjà dans la liste (par nom)
        const exists = Array.from(teachersMap.values()).some(t => 
          t.name.toLowerCase() === teacherName.toLowerCase()
        )
        if (!exists) {
          const id = `planning_${teacherName.replace(/\s+/g, '_')}`
          teachersMap.set(id, {
            id,
            name: teacherName,
            email: '',
            avatar: null,
            hours: 0,
            source: 'planning'
          })
        }
      })
    }
    
    // 3. AJOUT: Charger tous les enseignants disponibles depuis la DB et les ajouter s'ils ne sont pas déjà présents
    const { data: allTeachers, error: teachersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, forname, family_name, email')
      .in('role', ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio'])
    
    if (!teachersError && allTeachers) {
      allTeachers.forEach(teacher => {
        const teacherName = teacher.display_name || `${teacher.forname || ''} ${teacher.family_name || ''}`.trim()
        if (teacherName) {
          // Vérifier si cet enseignant n'est pas déjà dans teachersMap
          const exists = Array.from(teachersMap.values()).some(t => 
            t.name.toLowerCase() === teacherName.toLowerCase()
          )
          if (!exists) {
            teachersMap.set(teacher.user_id, {
              id: teacher.user_id,
              name: teacherName,
              email: teacher.email || '',
              avatar: null,
              hours: 0,
              source: 'database'
            })
          }
        }
      })
    }
    
    moduleTeachers.value = Array.from(teachersMap.values())
    console.log('👥 Enseignants chargés:', moduleTeachers.value.length, '(course_teachers + planning + database)')
  } catch (error) {
    console.error('Erreur enseignants:', error)
    moduleTeachers.value = []
  }
}

// Formater le tableau des enseignants en string
const formatTeachersArray = (teachers) => {
  if (!teachers || !Array.isArray(teachers) || teachers.length === 0) return ''
  // Si c'est un tableau d'objets avec .name, extraire les noms
  // Si c'est un tableau de strings, joindre directement
  return teachers.map(t => typeof t === 'object' ? t.name : t).filter(Boolean).join(', ')
}

// Formater le jour
const formatDay = (day) => {
  const days = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi',
    jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance'
  }
  return days[day?.toLowerCase()] || day || '—'
}

// Couleur selon l'activité
const getActivitySeverity = (activity) => {
  const map = {
    'Cours': 'info',
    'TP': 'success',
    'TD': 'warning',
    'Examen': 'danger',
    'Atelier': 'secondary'
  }
  return map[activity] || 'info'
}

// Couleurs vives par classe pour l'affichage (plus distinctes)
const classDisplayColors = {
  'BA25-TP1': 'E53935', // Rouge
  'BA25-TP2': '43A047', // Vert
  'BA25-TP3': '1E88E5', // Bleu
  'BA25-TP4': 'FB8C00', // Orange
  'BA25-TP5': '00897B', // Teal
  'BA25-TP6': 'F4511E', // Orange foncé
  'BA25-TP7': '3949AB', // Indigo
  'BA25-TP8': '0277BD', // Bleu clair
  'BA24-TP1': '7CB342', // Vert lime
  'BA24-TP2': 'FFB300', // Ambre
  'BA24-TP3': '039BE5', // Bleu clair
  'BA24-TP4': '00897B', // Teal
  'BA24-TP5': '5E35B1', // Indigo
  'BA24-TP6': '00695C', // Vert foncé
}

// Couleurs pour l'export Excel (plus claires)
const classColors = {
  'BA25-TP1': 'FFC7CE', // Rouge clair
  'BA25-TP2': 'C6EFCE', // Vert clair
  'BA25-TP3': 'BDD7EE', // Bleu clair
  'BA25-TP4': 'FFEB9C', // Jaune clair
  'BA25-TP5': 'E0F2FE', // Cyan clair
  'BA25-TP6': 'FFD9B3', // Orange clair
  'BA24-TP1': 'D9EAD3', // Vert menthe
  'BA24-TP2': 'FCE5CD', // Pêche
  'BA24-TP3': 'D0E0E3', // Cyan clair
  'BA24-TP4': 'E0F2FE', // Cyan clair
  'BA24-TP5': 'E0F2FE', // Cyan clair
}

// Obtenir couleur pour l'export Excel
const getClassColor = (classCode) => {
  const normalized = normalizeClass(classCode)
  return classColors[normalized] || 'FFFFFF'
}

// Obtenir couleur vive pour l'affichage
const getClassDisplayColor = (classCode) => {
  const normalized = normalizeClass(classCode)
  // Si pas de couleur définie, générer une couleur basée sur le hash du nom
  if (!classDisplayColors[normalized]) {
    const hash = normalized.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const colors = ['E53935', '43A047', '1E88E5', 'FB8C00', '8E24AA', '00ACC1', '7CB342', 'FFB300', 'D81B60', '5E35B1']
    return colors[hash % colors.length]
  }
  return classDisplayColors[normalized]
}

// Obtenir couleur du texte (blanc ou noir selon la luminosité)
const getClassTextColor = (classCode) => {
  const color = getClassDisplayColor(classCode)
  // Calculer la luminosité
  const r = parseInt(color.substring(0, 2), 16)
  const g = parseInt(color.substring(2, 4), 16)
  const b = parseInt(color.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#FFFFFF'
}

// Export du planning en Excel avec feuilles par classe
const exportPlanningToExcel = () => {
  if (filteredPlanning.value.length === 0) return
  
  const wb = XLSX.utils.book_new()
  
  // Colonnes définies
  const colWidths = [
    { wch: 10 }, // Semaine
    { wch: 12 }, // Jour
    { wch: 12 }, // Date
    { wch: 8 },  // Début
    { wch: 8 },  // Fin
    { wch: 25 }, // Cours
    { wch: 12 }, // Type
    { wch: 22 }, // Enseignant
    { wch: 12 }, // Classe
    { wch: 15 }, // Salle
    { wch: 30 }  // Commentaire
  ]
  
  // Grouper les données par classe (normalisée)
  const byClass = new Map()
  filteredPlanning.value.forEach(slot => {
    const normalizedClass = normalizeClass(slot.class_code) || 'Sans classe'
    if (!byClass.has(normalizedClass)) {
      byClass.set(normalizedClass, [])
    }
    byClass.get(normalizedClass).push(slot)
  })
  
  // Si une seule classe filtrée, créer une seule feuille
  if (selectedClass.value || byClass.size === 1) {
    const data = filteredPlanning.value.map(slot => ({
      'Semaine': slot.week_number || '',
      'Jour': formatDay(slot.day),
      'Date': slot.date || '',
      'Début': slot.start_time?.substring(0,5) || '',
      'Fin': slot.end_time?.substring(0,5) || '',
      'Cours': slot.course_title || module.value?.title || '',
      'Type': slot.activity || slot.activity_type || 'Cours',
      'Enseignant': slot.teacher_name || '',
      'Classe': normalizeClass(slot.class_code),
      'Salle': slot.room || '',
      'Commentaire': slot.comment || slot.notes || ''
    }))
    
    const ws = XLSX.utils.json_to_sheet(data)
    ws['!cols'] = colWidths
    
    const sheetName = normalizeClass(selectedClass.value) || 'Planning'
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
  } else {
    // Créer une feuille par classe
    const sortedClasses = Array.from(byClass.keys()).sort()
    
    sortedClasses.forEach(classCode => {
      const slots = byClass.get(classCode)
      const data = slots.map(slot => ({
        'Semaine': slot.week_number || '',
        'Jour': formatDay(slot.day),
        'Date': slot.date || '',
        'Début': slot.start_time?.substring(0,5) || '',
        'Fin': slot.end_time?.substring(0,5) || '',
        'Cours': slot.course_title || module.value?.title || '',
        'Type': slot.activity || slot.activity_type || 'Cours',
        'Enseignant': slot.teacher_name || '',
        'Classe': classCode,
        'Salle': slot.room || '',
        'Commentaire': slot.comment || slot.notes || ''
      }))
      
      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = colWidths
      
      // Ajouter couleur de fond pour le header (ligne 1)
      const color = getClassColor(classCode)
      const range = XLSX.utils.decode_range(ws['!ref'])
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: C })
        if (!ws[addr]) continue
        ws[addr].s = {
          fill: { fgColor: { rgb: color } },
          font: { bold: true }
        }
      }
      
      XLSX.utils.book_append_sheet(wb, ws, classCode.substring(0, 31))
    })
    
    // Ajouter une feuille récapitulative
    const summaryData = sortedClasses.map(classCode => ({
      'Classe': classCode,
      'Nb Séances': byClass.get(classCode).length,
      'Couleur': getClassColor(classCode) === 'FFFFFF' ? 'Blanc' : 'Voir onglet'
    }))
    const summaryWs = XLSX.utils.json_to_sheet(summaryData)
    summaryWs['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }]
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif')
  }
  
  // Générer le nom du fichier
  const moduleCode = module.value?.code || 'module'
  const classLabel = normalizeClass(selectedClass.value) || 'all'
  const fileName = `Planning_${moduleCode}_${classLabel}.xlsx`
  
  // Télécharger le fichier
  XLSX.writeFile(wb, fileName)
  
  toast.add({
    severity: 'success',
    summary: 'Export réussi',
    detail: `${filteredPlanning.value.length} séances exportées (${byClass.size} classe${byClass.size > 1 ? 's' : ''})`,
    life: 3000
  })
}

// Export du planning en PDF
const exportPlanningToPDF = () => {
  if (filteredPlanning.value.length === 0) return
  
  const doc = new jsPDF('landscape')
  
  // Titre
  doc.setFontSize(18)
  doc.text(`Planning - ${module.value?.title || 'Module'}`, 14, 20)
  
  // Sous-titre
  doc.setFontSize(11)
  doc.setTextColor(100)
  doc.text(`Code: ${module.value?.code || ''} | Classe: ${selectedClass.value || 'Toutes'}`, 14, 28)
  doc.text(`Total: ${filteredPlanning.value.length} séances | ${totalPlanningHours.value}h planifiées`, 14, 34)
  doc.setTextColor(0)
  
  // Préparer les données pour la table
  const tableData = filteredPlanning.value.map(slot => [
    `S${slot.week_number}`,
    formatDay(slot.day),
    slot.date || '',
    `${slot.start_time?.substring(0,5) || ''} - ${slot.end_time?.substring(0,5) || ''}`,
    slot.course_title || module.value?.title || '',
    slot.teacher_name || '',
    slot.activity || 'Cours',
    normalizeClass(slot.class_code),
    slot.room || ''
  ])
  
  // Générer la table
  autoTable(doc, {
    head: [['Sem.', 'Jour', 'Date', 'Horaire', 'Cours', 'Enseignant', 'Type', 'Classe', 'Salle']],
    body: tableData,
    startY: 42,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [59, 130, 246] },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 28 },
      4: { cellWidth: 50 },
      5: { cellWidth: 40 },
      6: { cellWidth: 18 },
      7: { cellWidth: 25 },
      8: { cellWidth: 20 }
    }
  })
  
  // Ajouter le pied de page avec la date
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150)
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')} - Page ${i}/${pageCount}`, 14, doc.internal.pageSize.height - 10)
  }
  
  // Télécharger
  const moduleCode = module.value?.code || 'module'
  const classLabel = normalizeClass(selectedClass.value) || 'all'
  doc.save(`Planning_${moduleCode}_${classLabel}.pdf`)
  
  toast.add({
    severity: 'success',
    summary: 'Export PDF réussi',
    detail: `${filteredPlanning.value.length} séances exportées`,
    life: 3000
  })
}

// ==================== HISTORIQUE & VALIDATION ====================

// Charger l'historique des modifications
const loadPlanningHistory = async () => {
  if (!module.value?.code) return
  
  loadingHistory.value = true
  try {
    const { data, error } = await supabase
      .from('planning_history')
      .select('*')
      .eq('module_code', module.value.code)
      .order('changed_at', { ascending: false })
      .limit(50)
    
    if (error) {
      console.warn('Erreur chargement historique:', error)
      planningHistory.value = []
      return
    }
    
    planningHistory.value = data || []
  } catch (error) {
    console.error('Erreur historique:', error)
    planningHistory.value = []
  } finally {
    loadingHistory.value = false
  }
}

// Charger la validation actuelle
const loadCurrentValidation = async () => {
  if (!module.value?.code) return
  
  try {
    const classCode = selectedClass.value || 'ALL'
    const { data } = await supabase
      .from('planning_validations')
      .select('*')
      .eq('module_code', module.value.code)
      .eq('class_code', classCode)
      .maybeSingle()
    
    currentValidation.value = data || null
  } catch (error) {
    console.error('Erreur validation:', error)
    currentValidation.value = null
  }
}

// Charger le budget heures
const loadHoursBudget = async () => {
  if (!module.value?.code) return
  
  try {
    const { data } = await supabase
      .from('module_hours_budget')
      .select('*')
      .eq('module_code', module.value.code)
      .maybeSingle()
    
    if (data) {
      hoursBudget.value = data
    } else {
      hoursBudget.value = { planned_hours: module.value?.heures_contact || 0 }
    }
  } catch (error) {
    hoursBudget.value = { planned_hours: module.value?.heures_contact || 0 }
  }
}

// Sauvegarder le budget heures
const saveHoursBudget = async () => {
  if (!module.value?.code) return
  
  try {
    const { error } = await supabase
      .from('module_hours_budget')
      .upsert({
        module_code: module.value.code,
        planned_hours: hoursBudget.value.planned_hours || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code' })
    
    if (error) throw error
    
    toast.add({
      severity: 'success',
      summary: 'Budget sauvegardé',
      detail: `${hoursBudget.value.planned_hours}h prévues`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur sauvegarde budget:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le budget',
      life: 3000
    })
  }
}

// Valider le planning
const validatePlanning = async () => {
  if (!module.value?.code) return
  
  try {
    const classCode = selectedClass.value || 'ALL'
    const { error } = await supabase
      .from('planning_validations')
      .upsert({
        module_code: module.value.code,
        class_code: classCode,
        status: 'validated',
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code,class_code' })
    
    if (error) throw error
    
    await loadCurrentValidation()
    
    toast.add({
      severity: 'success',
      summary: 'Planning validé',
      detail: `${filteredPlanning.value.length} séances validées`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur validation:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de valider le planning',
      life: 3000
    })
  }
}

// Retirer la validation
const unvalidatePlanning = async () => {
  if (!module.value?.code || !currentValidation.value) return
  
  try {
    const { error } = await supabase
      .from('planning_validations')
      .update({ 
        status: 'draft',
        validated_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', currentValidation.value.id)
    
    if (error) throw error
    
    await loadCurrentValidation()
    
    toast.add({
      severity: 'info',
      summary: 'Validation retirée',
      detail: 'Le planning est de nouveau en brouillon',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur:', error)
  }
}

// Soumettre pour révision
const submitForReview = async () => {
  if (!module.value?.code) return
  
  try {
    const classCode = selectedClass.value || 'ALL'
    const { error } = await supabase
      .from('planning_validations')
      .upsert({
        module_code: module.value.code,
        class_code: classCode,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code,class_code' })
    
    if (error) throw error
    
    await loadCurrentValidation()
    
    toast.add({
      severity: 'info',
      summary: 'Soumis pour révision',
      detail: 'Le planning est en attente de validation',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur:', error)
  }
}

// Formater la date pour l'affichage (jour + date)
const formatDateForDisplay = (weekNumber, dayName) => {
  console.log('formatDateForDisplay appelé avec:', { weekNumber, dayName })
  
  const dateStr = getDateFromWeekAndDay(weekNumber, dayName)
  console.log('Date calculée:', dateStr)
  
  if (!dateStr) return ''
  
  const date = new Date(dateStr)
  const dateNum = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear().toString()
  
  const result = `${dateNum}/${month}/${year}`
  console.log('Résultat formaté:', result)
  
  return result
}

// Calculer la date précise à partir du numéro de semaine et du jour
const getDateFromWeekAndDay = (weekNumber, dayName) => {
  console.log('getDateFromWeekAndDay appelé avec:', { weekNumber, dayName })
  
  if (!weekNumber || !dayName) {
    console.log('Paramètres manquants')
    return ''
  }
  
  try {
    // Logique académique simplifiée
    let targetDate
    
    if (weekNumber >= 38 && weekNumber <= 53) {
      // Automne 2026 : la semaine 38 commence le lundi 14 septembre 2026
      const week38Monday = new Date(2026, 8, 14) // 14 septembre 2026 (lundi)
      const dayMap = {
        'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3, 'vendredi': 4, 'samedi': 5, 'dimanche': 6
      }
      
      // Calculer depuis le lundi de la semaine 38
      const targetDay = dayMap[dayName.toLowerCase()]
      const daysFromWeek38 = (weekNumber - 38) * 7 + targetDay
      targetDate = new Date(week38Monday)
      targetDate.setDate(week38Monday.getDate() + daysFromWeek38)
      
      console.log('Lundi semaine 38:', week38Monday)
      console.log('Jour cible:', dayName.toLowerCase(), '->', targetDay)
      console.log('Jours depuis semaine 38:', daysFromWeek38)
      console.log('Calcul: week38Monday.getDate() + daysFromWeek38 =', week38Monday.getDate(), '+', daysFromWeek38)
      
    } else if (weekNumber >= 1 && weekNumber <= 37) {
      // Printemps 2027 : la semaine 1 commence le lundi 4 janvier 2027
      const week1Monday = new Date(2027, 0, 4) // 4 janvier 2027 (lundi)
      const dayMap = {
        'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3, 'vendredi': 4, 'samedi': 5, 'dimanche': 6
      }
      
      // Calculer depuis le lundi de la semaine 1
      const targetDay = dayMap[dayName.toLowerCase()]
      const daysFromWeek1 = (weekNumber - 1) * 7 + targetDay
      targetDate = new Date(week1Monday)
      targetDate.setDate(week1Monday.getDate() + daysFromWeek1)
      
      console.log('Lundi semaine 1:', week1Monday)
      console.log('Jours depuis semaine 1:', daysFromWeek1)
      
    } else {
      console.log('Numéro de semaine invalide:', weekNumber)
      return ''
    }
    
    console.log('Date cible calculée:', targetDate)
    
    // Formater la date en YYYY-MM-DD pour la base de données (sans problème de fuseau horaire)
    const year = targetDate.getFullYear()
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0')
    const day = targetDate.getDate().toString().padStart(2, '0')
    const result = `${year}-${month}-${day}`
    console.log('Date formatée (sans fuseau):', result)
    
    return result
  } catch (error) {
    console.error('Erreur calcul date:', error)
    return ''
  }
}

// Obtenir le numéro de semaine actuel
const getCurrentWeekNumber = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const days = Math.floor((now - start) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + start.getDay() + 1) / 7)
}

// Formater date/heure - version simplifiée
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const dayName = days[date.getDay()]
  return `${dayName}`
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const dayName = days[date.getDay()]
  return `${dayName}`
}

// Obtenir les heures par classe
const getClassHours = (classCode) => {
  return Math.round(
    modulePlanning.value
      .filter(slot => normalizeClass(slot.class_code) === classCode)
      .reduce((sum, slot) => sum + getSlotHours(slot), 0) * 10
  ) / 10
}

// Labels et couleurs pour les actions d'historique
const getActionLabel = (action) => {
  const labels = { create: 'Créé', update: 'Modifié', delete: 'Supprimé' }
  return labels[action] || action
}

const getActionSeverity = (action) => {
  const severities = { create: 'success', update: 'info', delete: 'danger' }
  return severities[action] || 'secondary'
}

// Exposition des fonctions nécessaires
</script>

<style scoped>
.module-manage-container {
  padding: 2rem;
}

.module-actions-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 0.75rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.loading-container,
.permission-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 2rem;
}

.field {
  margin-bottom: 1.5rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

:deep(.p-tabview-nav) {
  background: var(--surface-card);
}

:deep(.p-tabview-panels) {
  padding: 1.5rem;
  background: transparent;
}

/* Vue Calendrier */
.planning-calendar {
  overflow-x: auto;
}

.calendar-week {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 1rem;
}

.day-column {
  min-height: 120px;
  border: 1px solid var(--surface-border);
}

.calendar-slot {
  background: var(--surface-0);
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.calendar-slot:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

/* Toggle buttons */
.border-noround-right {
  border-top-right-radius: 0 !important;
  border-bottom-right-radius: 0 !important;
}

.border-noround-left {
  border-top-left-radius: 0 !important;
  border-bottom-left-radius: 0 !important;
}

/* Styles pour le groupement de la DataTable par semaine/jour */
:deep(.planning-datatable .week-even) {
  background-color: rgba(59, 130, 246, 0.08) !important;
}

:deep(.planning-datatable .week-odd) {
  background-color: transparent !important;
}

:deep(.planning-datatable .new-week-row) {
  border-top: 3px solid var(--primary-color) !important;
}

:deep(.planning-datatable .new-day-row) {
  border-top: 1px solid var(--primary-400) !important;
}

:deep(.planning-datatable .same-day-row) {
  border-top: 1px dashed var(--surface-700) !important;
}

:deep(.planning-datatable tr) {
  color: var(--text-color) !important;
  background-color: transparent;
}

:deep(.planning-datatable td) {
  color: var(--text-color) !important;
  padding: 1rem 0.5rem !important;
}

:deep(.planning-datatable .p-tag) {
  font-weight: 600;
}

:deep(.planning-datatable tr:hover) {
  background-color: var(--surface-hover) !important;
}

/* Styles pour les badges de semaine et jour optimisés */
:deep(.planning-datatable .week-header-cell) {
  padding: 0.5rem 0.25rem;
}

:deep(.planning-datatable .week-content) {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

:deep(.planning-datatable .add-button-inline) {
width: 1.5rem !important;
height: 1.5rem !important;
opacity: 0.5;
flex-shrink: 0;
}

:deep(.planning-datatable .add-button-inline:hover) {
opacity: 1;
}

:deep(.planning-datatable .week-badge) {
display: flex;
align-items: center;
gap: 0.5rem;
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: white;
padding: 0.5rem 0.75rem;
border-radius: 0.75rem;
flex: 1;
}

:deep(.planning-datatable .week-text) {
font-weight: 700;
letter-spacing: 0.5px;
}

:deep(.planning-datatable .day-header-cell) {
padding: 0.5rem 0.25rem;
}

:deep(.planning-datatable .day-badge) {
display: flex;
align-items: center;
gap: 0.75rem;
background: linear-gradient(135deg, #10B981 0%, #059669 100%);
color: white;
padding: 0.75rem 1rem;
border-radius: 1.25rem;
min-width: 120px;
}

:deep(.planning-datatable .day-circle) {
width: 2.5rem;
height: 2.5rem;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
}

:deep(.planning-datatable .day-initial) {
font-size: 1.25rem;
font-weight: 800;
color: #10B981;
line-height: 1;
}

:deep(.planning-datatable .day-info) {
display: flex;
flex-direction: column;
align-items: flex-start;
}

:deep(.planning-datatable .day-name) {
font-size: 0.875rem;
font-weight: 700;
color: white;
line-height: 1.2;
text-transform: capitalize;
}

:deep(.planning-datatable .day-date) {
font-size: 0.75rem;
color: rgba(255, 255, 255, 0.9);
font-weight: 500;
margin-top: 0.125rem;
}

/* Espacement amélioré entre les groupes */
:deep(.planning-datatable .new-week-row td) {
padding-top: 2rem !important;
border-top: 3px solid #667eea !important;
}

:deep(.planning-datatable .new-day-row td) {
padding-top: 1.5rem !important;
border-top: 2px solid #3B82F6 !important;
}

:deep(.planning-datatable .same-day-row td) {
padding-top: 0.75rem !important;
border-top: 1px dashed var(--surface-300) !important;
}

/* Amélioration des cellules de contenu */
:deep(.planning-datatable td.course-title-cell) {
vertical-align: top;
padding-top: 1rem !important;
}

:deep(.planning-datatable .course-title) {
font-weight: 600;
color: var(--text-color);
font-size: 0.95rem;
line-height: 1.4;
}

:deep(.planning-datatable .time-slot) {
background: var(--surface-100);
padding: 0.5rem 0.75rem;
border-radius: 0.5rem;
font-weight: 500;
color: var(--text-color);
font-size: 0.875rem;
}

/* Styles pour le formulaire de séance (même format que ModulePlanningView) */
.session-form {
display: flex;
flex-direction: column;
gap: 1rem;
  gap: 1rem;
}

.field-row {
  display: flex;
  gap: 1rem;
}

.field-row .field {
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.875rem;
}

.field .w-full {
  width: 100%;
}
</style>
