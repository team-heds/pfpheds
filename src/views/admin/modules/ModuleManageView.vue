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
                    v-for="cls in allClassOptions"
                    :key="cls"
                    :label="cls"
                    :severity="selectedClass === cls ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== cls"
                    @click="selectedClass = selectedClass === cls ? null : cls"
                    size="small"
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
                  
                </div>
              </div>

              <!-- Liste des séances -->
              <div v-if="loadingPlanning" class="text-center p-4">
                <ProgressSpinner style="width: 40px; height: 40px" />
              </div>
              
              <div v-else-if="filteredPlanning.length === 0 && !selectedClass" class="text-center p-5">
                <i class="pi pi-hand-pointer text-6xl text-400 mb-3"></i>
                <h4>Sélectionnez une classe</h4>
                <p class="text-600 mb-4">Sélectionnez une classe pour voir le planning</p>
                <div class="flex justify-content-center gap-2 flex-wrap">
                  <Button 
                    v-for="cls in allClassOptions"
                    :key="cls"
                    :label="cls"
                    :severity="selectedClass === cls ? 'primary' : 'secondary'"
                    :outlined="selectedClass !== cls"
                    @click="selectedClass = cls"
                  />
                </div>
              </div>

              <div v-else-if="filteredPlanning.length === 0 && selectedClass" class="text-center p-5">
                <i class="pi pi-calendar-plus text-6xl text-400 mb-3"></i>
                <h4>Aucune séance pour {{ selectedClass }}</h4>
                <p class="text-600 mb-4">Ce module n'a pas encore de séances pour cette classe. Ajoutez la première séance.</p>
                <Button 
                  label="Ajouter une séance" 
                  icon="pi pi-plus" 
                  @click="addSessionToWeek(1)"
                />
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
                      <div v-if="data.isFirstSlotOfWeek" class="week-header-cell" :id="`week-${data.week_number}`">
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
                      <div v-if="data.is_async || data.day === 'distance'" class="day-header-cell">
                        <Tag value="Cours Asynchrone" severity="info" />
                      </div>
                      <div v-else-if="data.isFirstSlotOfDay" class="day-header-cell">
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
                  <Column field="dateX" style="width: 120px">
                    <template #body="{ data }">
                      <span v-if="!data.is_async && data.day !== 'distance'" class="text-sm font-medium text-600">{{ formatDateForDisplay(data.week_number, data.day) }}</span>
                    </template>
                  </Column>
                  <Column header="Horaire / Périodes" style="width: 140px">
                    <template #body="{ data }">
                      <div v-if="data.is_async" class="flex align-items-center gap-2">
                        <i class="pi pi-clock text-500"></i>
                        <Tag :value="`${data.periods || 2} période(s)`" severity="warning" />
                      </div>
                      <div v-else class="time-slot">{{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}</div>
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
                  <Column field="class_code" header="Classes" style="width: 150px">
                    <template #body="{ data }">
                      <div class="flex gap-1 flex-wrap">
                        <Tag 
                          v-for="classCode in (data.class_codes && data.class_codes.length > 0 ? data.class_codes : [data.class_code])"
                          :key="classCode"
                          :value="normalizeClass(classCode)" 
                          size="small"
                          :style="{ backgroundColor: '#' + getClassDisplayColor(classCode), color: getClassTextColor(classCode) }"
                        />
                      </div>
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
                    v-for="cls in allClassOptions"
                    :key="cls"
                    :label="cls"
                    :severity="classFilter === cls ? 'primary' : 'secondary'"
                    :outlined="classFilter !== cls"
                    @click="classFilter = classFilter === cls ? null : cls"
                    size="small"
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
                    
                    <!-- Classes -->
                    <div class="flex gap-1">
                      <Tag 
                        v-for="classCode in (session.class_codes && session.class_codes.length > 0 ? session.class_codes : [session.class_code])"
                        :key="classCode"
                        :value="normalizeClass(classCode)" 
                        size="small"
                        :style="{ backgroundColor: '#' + getClassDisplayColor(classCode), color: getClassTextColor(classCode) }"
                      />
                    </div>
                    
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
        <!-- Sélection des classes (multi-sélection) -->
        <div class="field">
          <label class="mb-2 block">Classes / Volées <span class="text-400 text-sm">(Sélectionnez une ou plusieurs classes)</span></label>
          
          <!-- Affichage des classes déjà sélectionnées -->
          <div v-if="editingSession.classCodes && editingSession.classCodes.length > 0" class="mb-2" :key="editingSession.classCodes.length">
            <small class="text-600">Classes sélectionnées :</small>
            <div class="flex gap-1 flex-wrap mt-1">
              <Tag 
                v-for="classCode in editingSession.classCodes" 
                :key="`${classCode}-${editingSession.classCodes.length}`"
                :value="normalizeClass(classCode)" 
                size="small"
                :style="{ backgroundColor: '#' + getClassDisplayColor(classCode), color: getClassTextColor(classCode) }"
              />
            </div>
          </div>
          
          <div class="flex gap-2 flex-wrap">
            <Button 
              v-for="option in classOptions" 
              :key="option.value"
              :label="option.label"
              :severity="editingSession.classCodes.includes(option.value) ? 'primary' : 'secondary'"
              :outlined="!editingSession.classCodes.includes(option.value)"
              @click="toggleClass(option.value)"
              size="small"
              :icon="editingSession.classCodes.includes(option.value) ? 'pi pi-check' : ''"
            />
          </div>
          <small class="text-500 mt-1 block">
            {{ editingSession.classCodes.length }} classe{{ editingSession.classCodes.length > 1 ? 's' : '' }} sélectionnée{{ editingSession.classCodes.length > 1 ? 's' : '' }}
          </small>
        </div>
        
        <!-- Type d'activité (en haut maintenant) -->
        <div class="field">
          <label class="font-semibold">Type d'activité / Format</label>
          <div class="flex gap-2 flex-wrap mt-2">
            <Button 
              v-for="option in activityOptions" 
              :key="option"
              :label="option"
              :severity="editingSession.activity === option ? 'primary' : 'secondary'"
              :outlined="editingSession.activity !== option"
              @click="editingSession.activity = option"
              size="large"
              :icon="editingSession.activity === option ? 'pi pi-check' : ''"
            />
          </div>
          <small class="text-500 mt-1 block">
            Sélectionnez "Cours Asynchrone" pour un cours sans horaire fixe (défini en périodes)
          </small>
        </div>
        
        <!-- Champ Semaine (pour tous les types de cours) -->
        <div class="field">
          <label>Semaine</label>
          <InputNumber v-model="editingSession.weekNumber" :min="1" :max="52" class="w-full" />
          <small class="text-500">Semaine académique (1-52)</small>
        </div>
        
        <!-- Champs pour cours asynchrone: seulement périodes -->
        <div v-if="editingSession.activity === 'Cours Asynchrone'" class="field">
          <label>Nombre de périodes</label>
          <InputNumber v-model="editingSession.periods" :min="1" :max="100"  class="w-full" />
          <small class="text-500">Nombre de périodes de travail pour ce cours asynchrone</small>
        </div>
        
        <!-- Champs pour cours synchrone: jour et horaires -->
        <div v-if="editingSession.activity !== 'Cours Asynchrone'">
          <div class="field">
            <label class="font-semibold">Jour</label>
            <div class="flex flex-wrap gap-2 mt-2">
              <Button 
                v-for="opt in dayOptions" 
                :key="opt.value"
                :label="opt.label"
                :severity="editingSession.day === opt.value ? 'primary' : 'secondary'"
                :outlined="editingSession.day !== opt.value"
                size="small"
                @click="editingSession.day = opt.value"
                type="button"
              />
            </div>
          </div>
          <div class="grid">

            <div class="col-12 md:col-4">
              <div class="field">
                <label class="font-semibold">Heure début</label>
                <InputMask v-model="editingSession.startTime" mask="99:99" placeholder="09:00" class="w-full" />
              </div>
            </div>
            <div class="col-12 md:col-4">
              <div class="field">
                <label class="font-semibold">Heure fin</label>
                <InputMask v-model="editingSession.endTime" mask="99:99" placeholder="11:00" class="w-full" />
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useModules } from '@/composables/useModules'
import { useModulePermissions } from '@/composables/useModulePermissions'
import { useModuleHelpers } from '@/composables/useModuleHelpers'
import { useModulePlanning } from '@/composables/useModulePlanning'
import { useModuleTeachers } from '@/composables/useModuleTeachers'
import { useModuleValidation } from '@/composables/useModuleValidation'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Textarea from 'primevue/textarea'
import AutoComplete from 'primevue/autocomplete'
import ProgressSpinner from 'primevue/progressspinner'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputMask from 'primevue/inputmask'
import ColorPicker from 'primevue/colorpicker'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import academicYearService from '@/service/academicYearService'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const { modules, loadModules, updateModule: updateModuleInStore } = useModules()
const { canEditModule, isAdmin, getPermissionErrorMessage } = useModulePermissions()

// ===== Helpers =====
const {
  normalizeClass, getSlotHours, formatTeachersArray, formatDay,
  getActivitySeverity, getActivityColor,
  getClassColor, getClassDisplayColor, getClassTextColor,
  getWeekColor, getWeekBorderColor, getDayColor, getDayBackgroundColor,
  getHoursSeverity, getActionLabel, getActionSeverity,
  formatDateForDisplay, getDateFromWeekAndDay, getCurrentWeekNumber,
  formatDateTime, formatDate, getWeekDateRange,
} = useModuleHelpers()

const moduleId = parseInt(route.params.id)
const loading = ref(true)
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

// Statistiques
const moduleStats = ref({
  totalStudents: 0,
  totalHours: 0
})

// ===== Planning composable =====
const {
  modulePlanning, loadingPlanning, selectedClass, planningView,
  showDialog, editingSession, saving,
  dbClassCodes, availableClasses, allClassOptions,
  filteredPlanning, totalPlanningHours, planningConflicts,
  calendarWeeks, groupedPlanningData, flatPlanningData,
  classOptions, dayOptions, activityOptions, rowClass,
  getDaySlots,
  loadModulePlanning, loadDbClassCodes,
  editSession, addSessionToWeek, toggleClass,
  saveSession, deleteCurrentSession, deleteSession,
  exportPlanningToExcel, exportPlanningToPDF, getClassHours,
} = useModulePlanning(toast, module, null)

// ===== Teachers composable =====
const {
  moduleTeachers, showAddTeacherDialog, newTeacher,
  classFilter, loadingGlobalTeachers, globalTeachers,
  selectedTeacher, showTeacherDetailsDialog,
  teachers, filteredTeachers,
  teachersWithStats, filteredTeachersList, totalFilteredHours,
  loadTeachers, searchTeachers,
  loadModuleTeachers, loadGlobalTeachers,
  getTeacherSessions, getTeacherGroupedSessions,
  showTeacherDetails, addTeacher, removeTeacher,
} = useModuleTeachers(toast, module, modulePlanning)

// ===== Validation composable =====
const {
  planningHistory, loadingHistory, currentValidation,
  hoursBudget, hoursDifference, validationStatus,
  loadPlanningHistory, loadCurrentValidation,
  loadHoursBudget, saveHoursBudget,
  validatePlanning, unvalidatePlanning, submitForReview,
} = useModuleValidation(toast, module, selectedClass, filteredPlanning, totalPlanningHours)

// ===== Module save (stays in main component) =====
const saveModule = async () => {
  saving.value = true
  try {
    await updateModuleInStore(moduleId, moduleForm.value)
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Module mis à jour avec succès', life: 3000 })
    await loadModules()
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de sauvegarder le module', life: 3000 })
  } finally {
    saving.value = false
  }
}

// ===== Lifecycle =====
onMounted(async () => {
  try {
    await loadModules()
    await loadTeachers()

    // Trouver le module
    module.value = modules.value.find(m => m.id === moduleId)

    if (!module.value) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Module non trouvé', life: 3000 })
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

    // Charger les données du module + les classes dynamiques
    await Promise.all([
      loadModuleTeachers(),
      loadModulePlanning(),
      loadHoursBudget(),
      loadCurrentValidation(),
      loadPlanningHistory(),
      loadDbClassCodes(academicYearService)
    ])

    loading.value = false
  } catch (error) {
    console.error('Erreur lors du chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger le module', life: 3000 })
    loading.value = false
  }
})
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
