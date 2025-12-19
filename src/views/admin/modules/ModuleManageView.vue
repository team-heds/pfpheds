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
      
      <!-- Actions rapides -->
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
      </div>
      
      <!-- Onglets de gestion -->
      <TabView>
        
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
              <div class="mb-3">
                <Button 
                  label="Ajouter un enseignant" 
                  icon="pi pi-plus" 
                  @click="showAddTeacherDialog = true"
                />
              </div>

              <DataTable :value="teachersWithStats" responsiveLayout="scroll" stripedRows>
                <Column field="name" header="Nom" sortable>
                  <template #body="{ data }">
                    <div class="flex align-items-center gap-2">
                      <i class="pi pi-user text-primary"></i>
                      <span class="font-medium">{{ data.name }}</span>
                      <Tag v-if="data.source === 'planning'" value="Planning" severity="secondary" class="text-xs" />
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
                    <Tag :value="`${data.planningHours}h`" :severity="data.planningHours > 0 ? 'success' : 'secondary'" />
                  </template>
                </Column>
                <Column field="sessionsCount" header="Séances" sortable>
                  <template #body="{ data }">
                    {{ data.sessionsCount }} séance{{ data.sessionsCount > 1 ? 's' : '' }}
                  </template>
                </Column>
                <Column header="Actions">
                  <template #body="{ data }">
                    <Button 
                      icon="pi pi-trash" 
                      severity="danger" 
                      text 
                      @click="removeTeacher(data)"
                      v-tooltip="'Retirer'"
                    />
                  </template>
                </Column>
                <template #empty>
                  <div class="text-center p-4">
                    <i class="pi pi-users text-4xl text-400 mb-2"></i>
                    <p class="text-600">Aucun enseignant assigné</p>
                  </div>
                </template>
              </DataTable>
              
              <!-- Résumé des heures -->
              <div v-if="teachersWithStats.length > 0" class="mt-4 p-3 surface-100 border-round">
                <div class="flex justify-content-between align-items-center flex-wrap gap-3">
                  <div>
                    <span class="font-bold">Total:</span> 
                    {{ teachersWithStats.length }} enseignant{{ teachersWithStats.length > 1 ? 's' : '' }}
                  </div>
                  <div>
                    <span class="font-bold">Heures planifiées:</span> 
                    <Tag :value="`${totalPlanningHours}h`" severity="info" />
                  </div>
                </div>
              </div>
            </template>
          </Card>
        </TabPanel>

        <!-- Onglet: Planning -->
        <TabPanel header="Planning">
          <Card>
            <template #content>
              <!-- Alerte conflits -->
              <div v-if="planningConflicts.length > 0" class="mb-3 p-3 border-round bg-red-100 border-left-3 border-red-500">
                <div class="flex align-items-center gap-2 mb-2">
                  <i class="pi pi-exclamation-triangle text-red-600"></i>
                  <span class="font-bold text-red-700">{{ planningConflicts.length }} conflit(s) détecté(s)</span>
                </div>
                <div class="text-sm text-red-600">
                  <div v-for="(conflict, idx) in planningConflicts.slice(0, 3)" :key="idx" class="mb-1">
                    <strong>{{ conflict.teacher }}</strong> : S{{ conflict.week }} {{ conflict.day }} 
                    ({{ conflict.slotA.class }} {{ conflict.slotA.time }} / {{ conflict.slotB.class }} {{ conflict.slotB.time }})
                  </div>
                  <div v-if="planningConflicts.length > 3" class="text-xs">
                    ... et {{ planningConflicts.length - 3 }} autre(s)
                  </div>
                </div>
              </div>

              <!-- Header avec filtres -->
              <div class="flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div class="flex align-items-center gap-3">
                  <h3 class="m-0">Planning du module</h3>
                  <Tag :value="`${filteredPlanning.length} séances`" severity="info" />
                  <Tag v-if="planningConflicts.length > 0" :value="`${planningConflicts.length} conflits`" severity="danger" />
                </div>
                <div class="flex align-items-center gap-2 flex-wrap">
                  <Dropdown 
                    v-model="selectedYear"
                    :options="yearOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Année"
                    class="w-10rem"
                    @change="loadModulePlanning"
                  />
                  <Dropdown 
                    v-model="selectedClass"
                    :options="classOptions"
                    optionLabel="label"
                    optionValue="value"
                    placeholder="Toutes les classes"
                    class="w-12rem"
                    showClear
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
                    severity="success" 
                    outlined
                    @click="exportPlanningToExcel"
                    :disabled="filteredPlanning.length === 0"
                    v-tooltip="'Exporter en Excel'"
                  />
                  <Button 
                    icon="pi pi-file-pdf" 
                    severity="danger" 
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
                    <Button 
                      icon="pi pi-calendar" 
                      :severity="planningView === 'calendar' ? 'primary' : 'secondary'"
                      :outlined="planningView !== 'calendar'"
                      @click="planningView = 'calendar'"
                      v-tooltip="'Vue calendrier'"
                      class="border-noround-left"
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
                <i class="pi pi-calendar-times text-6xl text-400 mb-3"></i>
                <h4>Aucune séance planifiée</h4>
                <p class="text-600 mb-3">Ce module n'a pas encore de séances dans le planning</p>
                <Button 
                  label="Ajouter des séances" 
                  icon="pi pi-plus" 
                  @click="$router.push(`/admin/modules/${moduleId}/planning`)"
                />
              </div>

              <!-- Vue Liste -->
              <div v-else-if="planningView === 'list'" class="planning-list">
                <DataTable 
                  :value="filteredPlanning" 
                  responsiveLayout="scroll"
                  :paginator="filteredPlanning.length > 10"
                  :rows="10"
                  stripedRows
                >
                  <Column field="week_number" header="Semaine" sortable style="width: 80px">
                    <template #body="{ data }">
                      <Tag :value="`S${data.week_number}`" severity="secondary" />
                    </template>
                  </Column>
                  <Column field="day" header="Jour" sortable style="width: 100px">
                    <template #body="{ data }">
                      {{ formatDay(data.day) }}
                    </template>
                  </Column>
                  <Column field="date" header="Date" sortable style="width: 100px" />
                  <Column header="Horaire" style="width: 120px">
                    <template #body="{ data }">
                      <span class="font-semibold">{{ data.start_time?.substring(0,5) }} - {{ data.end_time?.substring(0,5) }}</span>
                    </template>
                  </Column>
                  <Column field="course_title" header="Cours" style="width: 180px">
                    <template #body="{ data }">
                      <span class="font-medium">{{ data.course_title || module?.title || '—' }}</span>
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
                </DataTable>
              </div>

              <!-- Vue Calendrier -->
              <div v-else class="planning-calendar">
                <div v-for="week in calendarWeeks" :key="week.number" class="calendar-week mb-4">
                  <div class="week-header flex align-items-center gap-2 mb-3 pb-2 border-bottom-1 surface-border">
                    <Tag :value="`Semaine ${week.number}`" severity="info" />
                    <span class="text-600 text-sm">{{ week.dateRange }}</span>
                  </div>
                  
                  <div class="grid">
                    <div v-for="day in ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']" 
                         :key="day" 
                         class="col-12 md:col"
                    >
                      <div class="day-column surface-card border-round p-3 h-full" 
                           :class="{ 'surface-100': !getDaySlots(week.number, day).length }">
                        <div class="day-header font-semibold mb-2 text-primary">
                          {{ formatDay(day) }}
                        </div>
                        
                        <div v-if="getDaySlots(week.number, day).length === 0" 
                             class="text-400 text-sm text-center py-3">
                          —
                        </div>
                        
                        <div v-for="slot in getDaySlots(week.number, day)" 
                             :key="slot.id" 
                             class="calendar-slot mb-2 p-2 border-round border-left-3"
                             :style="{ 
                               borderLeftColor: '#' + getClassDisplayColor(slot.class_code),
                               backgroundColor: '#' + getClassDisplayColor(slot.class_code) + '20'
                             }">
                          <div class="flex justify-content-between align-items-center mb-1">
                            <span class="text-xs text-600">
                              {{ slot.start_time?.substring(0,5) }} - {{ slot.end_time?.substring(0,5) }}
                            </span>
                            <Tag 
                              :value="normalizeClass(slot.class_code)" 
                              size="small"
                              class="text-xs"
                              :style="{ backgroundColor: '#' + getClassDisplayColor(slot.class_code), color: getClassTextColor(slot.class_code) }"
                            />
                          </div>
                          <div class="font-medium text-sm mb-1">
                            {{ slot.course_title || module?.title || 'Cours' }}
                          </div>
                          <div v-if="slot.teacher_name" class="flex align-items-center gap-1 text-xs text-600">
                            <i class="pi pi-user" style="font-size: 0.7rem"></i>
                            {{ slot.teacher_name }}
                          </div>
                          <div class="flex gap-1 mt-2 flex-wrap">
                            <Tag :value="slot.activity || 'Cours'" :severity="getActivitySeverity(slot.activity)" class="text-xs" />
                            <Tag v-if="slot.room" :value="slot.room" severity="secondary" class="text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div v-if="calendarWeeks.length === 0" class="text-center p-4 text-600">
                  Aucune semaine à afficher
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

  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useModules } from '@/composables/useModules'
import { useModulePermissions } from '@/composables/useModulePermissions'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import Card from 'primevue/card'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import ColorPicker from 'primevue/colorpicker'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import { supabase } from '@/supabase'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
const selectedYear = ref('2024-2025')
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

const yearOptions = [
  { label: '2024-2025', value: '2024-2025' },
  { label: '2023-2024', value: '2023-2024' },
  { label: '2025-2026', value: '2025-2026' }
]

// Normaliser le code classe (B25-tp = B25-TP) - utilisé partout
const normalizeClass = (code) => {
  if (!code) return ''
  return code.toUpperCase().trim()
}

// Options de classes (calculées et normalisées)
const classOptions = computed(() => {
  const classes = new Set()
  modulePlanning.value.forEach(slot => {
    if (slot.class_code) classes.add(normalizeClass(slot.class_code))
  })
  return [
    { label: 'Toutes les classes', value: null },
    ...Array.from(classes).sort().map(c => ({ label: c, value: c }))
  ]
})

// Planning filtré par classe (comparaison normalisée)
const filteredPlanning = computed(() => {
  if (!selectedClass.value) return modulePlanning.value
  const normalizedFilter = normalizeClass(selectedClass.value)
  return modulePlanning.value.filter(slot => normalizeClass(slot.class_code) === normalizedFilter)
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
  return moduleTeachers.value.map(teacher => {
    let planningHours = 0
    let sessionsCount = 0
    
    modulePlanning.value.forEach(slot => {
      const teachers = slot.teachers_list || slot.teachers || []
      const teacherNames = teachers.map(t => typeof t === 'object' ? t.name : t)
      
      if (teacherNames.some(name => name?.toLowerCase() === teacher.name?.toLowerCase())) {
        sessionsCount++
        planningHours += getSlotHours(slot)
      }
    })
    
    return {
      ...teacher,
      planningHours: Math.round(planningHours * 10) / 10,
      sessionsCount
    }
  }).sort((a, b) => b.planningHours - a.planningHours)
})

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

// Charger le module
onMounted(async () => {
  try {
    await loadModules()
    
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
    
    // Charger le planning du module
    await loadModulePlanning()
    
    // Charger les enseignants du module
    await loadModuleTeachers()
    
    // Charger historique, validation et budget
    await loadPlanningHistory()
    await loadCurrentValidation()
    await loadHoursBudget()
    
  } catch (error) {
    console.error('Erreur chargement module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger le module',
      life: 3000
    })
  } finally {
    loading.value = false
  }
})

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
const addTeacher = () => {
  if (!newTeacher.value.name || !newTeacher.value.email) {
    toast.add({
      severity: 'warn',
      summary: 'Attention',
      detail: 'Veuillez remplir tous les champs',
      life: 3000
    })
    return
  }
  
  moduleTeachers.value.push({ ...newTeacher.value, id: Date.now() })
  
  newTeacher.value = {
    name: '',
    email: '',
    hours: 0
  }
  
  showAddTeacherDialog.value = false
  
  toast.add({
    severity: 'success',
    summary: 'Succès',
    detail: 'Enseignant ajouté',
    life: 3000
  })
}

// Retirer un enseignant
const removeTeacher = (teacher) => {
  if (confirm(`Retirer ${teacher.name} de ce module ?`)) {
    moduleTeachers.value = moduleTeachers.value.filter(t => t.id !== teacher.id)
    
    toast.add({
      severity: 'success',
      summary: 'Succès',
      detail: 'Enseignant retiré',
      life: 3000
    })
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

// Charger les enseignants du module (course_teachers + planning)
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
    
    moduleTeachers.value = Array.from(teachersMap.values())
    console.log('👥 Enseignants chargés:', moduleTeachers.value.length, '(course_teachers + planning)')
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
  'BA25-TP5': '8E24AA', // Violet
  'BA25-TP6': '00ACC1', // Cyan
  'BA25-TP7': 'F4511E', // Orange foncé
  'BA25-TP8': '3949AB', // Indigo
  'BA24-TP1': '7CB342', // Vert lime
  'BA24-TP2': 'FFB300', // Ambre
  'BA24-TP3': '039BE5', // Bleu clair
  'BA24-TP4': 'D81B60', // Rose
  'BA24-TP5': '5E35B1', // Violet foncé
  'BA24-TP6': '00897B', // Teal
}

// Couleurs pour l'export Excel (plus claires)
const classColors = {
  'BA25-TP1': 'FFC7CE', // Rouge clair
  'BA25-TP2': 'C6EFCE', // Vert clair
  'BA25-TP3': 'BDD7EE', // Bleu clair
  'BA25-TP4': 'FFEB9C', // Jaune clair
  'BA25-TP5': 'E4DFEC', // Violet clair
  'BA25-TP6': 'FFD9B3', // Orange clair
  'BA24-TP1': 'D9EAD3', // Vert menthe
  'BA24-TP2': 'FCE5CD', // Pêche
  'BA24-TP3': 'D0E0E3', // Cyan clair
  'BA24-TP4': 'F4CCCC', // Rose clair
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
  const fileName = `Planning_${moduleCode}_${classLabel}_${selectedYear.value}.xlsx`
  
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
  doc.text(`Code: ${module.value?.code || ''} | Année: ${selectedYear.value} | Classe: ${selectedClass.value || 'Toutes'}`, 14, 28)
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
  doc.save(`Planning_${moduleCode}_${classLabel}_${selectedYear.value}.pdf`)
  
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
    const { data, error } = await supabase
      .from('planning_validations')
      .select('*')
      .eq('module_code', module.value.code)
      .eq('class_code', classCode)
      .eq('year', selectedYear.value)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.warn('Erreur chargement validation:', error)
    }
    
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
    const { data, error } = await supabase
      .from('module_hours_budget')
      .select('*')
      .eq('module_code', module.value.code)
      .eq('year', selectedYear.value)
      .single()
    
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
        year: selectedYear.value,
        planned_hours: hoursBudget.value.planned_hours || 0,
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code,year' })
    
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
        year: selectedYear.value,
        status: 'validated',
        validated_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code,class_code,year' })
    
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
        year: selectedYear.value,
        status: 'pending',
        updated_at: new Date().toISOString()
      }, { onConflict: 'module_code,class_code,year' })
    
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

// Formater date/heure
const formatDateTime = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-CH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-CH')
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
</style>
