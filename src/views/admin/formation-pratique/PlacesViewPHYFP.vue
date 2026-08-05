<template>
  <AdminLayout>
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Places</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Places</h1>
              <p class="text-600 m-0 mt-2">Gestion des places de formation pratique</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3 flex-wrap">
            <div class="flex align-items-center gap-2">
              <span class="text-600">Année</span>
              <Dropdown :options="years" optionLabel="label" optionValue="value" v-model="selectedYear" class="w-10rem" />
            </div>
            <div class="flex align-items-center gap-2">
              <span class="text-600">Afficher</span>
              <Dropdown :options="rowsOptions" optionLabel="label" optionValue="value" v-model="rowsPerPage" class="w-10rem" :disabled="showAll" />
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="showAll" />
                <span class="text-600">Tout</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="showHalf" />
                <span class="text-600">Moitié</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="withPdfOnly" />
                <span class="text-600">Avec PDF</span>
              </div>
              <div class="flex align-items-center gap-2">
                <InputSwitch v-model="compact" />
                <span class="text-600">Compact</span>
              </div>
            </div>
            <span class="flex-1"></span>
            <div class="flex align-items-center gap-2">
              <Button icon="pi pi-eye" outlined @click="toggleColumnsPanel" v-tooltip.top="'Afficher/Masquer colonnes'" />
              <Button icon="pi pi-refresh" outlined :disabled="loading" @click="reload" />
            </div>
          </div>
        </div>
        <ProgressBar v-if="loading" mode="indeterminate" style="height: 4px" class="mt-3" />
      </div>

      <div class="grid mb-3" v-if="placeKpis.length">
        <div class="col-6 md:col-3" v-for="kpi in placeKpis" :key="kpi.label">
          <div class="surface-card fp-dark p-3 border-round shadow-2 text-center">
            <div class="text-3xl font-bold" :class="kpi.colorClass">{{ kpi.value }}</div>
            <div class="text-600 text-sm mt-1">{{ kpi.label }}</div>
          </div>
        </div>
      </div>

      <!-- Panel de sélection des colonnes -->
      <OverlayPanel ref="columnsPanel" :style="{ width: '300px' }">
        <div class="p-3">
          <h3 class="text-lg font-semibold mb-3">Afficher les colonnes</h3>

          <div class="field-checkbox mb-2">
            <Checkbox v-model="showCriteresColumns" inputId="show-criteres" :binary="true" @change="toggleAllCriteres" />
            <label for="show-criteres" class="font-semibold">Critères (tous)</label>
          </div>

          <div class="ml-4 mb-3">
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.MSQ" inputId="col-msq" :binary="true" />
              <label for="col-msq">MSQ</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.SYSINT" inputId="col-sysint" :binary="true" />
              <label for="col-sysint">SYSINT</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.NEUROGER" inputId="col-neuroger" :binary="true" />
              <label for="col-neuroger">NEUROGER</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.AIGU" inputId="col-aigu" :binary="true" />
              <label for="col-aigu">AIGU</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.REHAB" inputId="col-rehab" :binary="true" />
              <label for="col-rehab">REHAB</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.AMBU" inputId="col-ambu" :binary="true" />
              <label for="col-ambu">AMBU</label>
            </div>
          </div>

          <div class="field-checkbox mb-2">
            <Checkbox v-model="showLanguesColumns" inputId="show-langues" :binary="true" @change="toggleAllLangues" />
            <label for="show-langues" class="font-semibold">Langues (toutes)</label>
          </div>

          <div class="ml-4">
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.FR" inputId="col-fr" :binary="true" />
              <label for="col-fr">FR</label>
            </div>
            <div class="field-checkbox mb-2">
              <Checkbox v-model="visibleColumns.DE" inputId="col-de" :binary="true" />
              <label for="col-de">DE</label>
            </div>
          </div>
        </div>
      </OverlayPanel>

      <div class="places-table-shell surface-card fp-dark p-3 border-round shadow-2">
        <DataTableToolbar v-model:query="searchInput" :result-count="totalMatchingRows" placeholder="Rechercher une place…">
          <template #primary><Button icon="pi pi-plus" label="Nouvelle place" @click="showCreateDialog = true" severity="success" /></template>
          <template #tools><Button icon="pi pi-filter-slash" label="Réinitialiser" outlined severity="secondary" @click="resetFilters" /><span v-if="isTruncated" class="text-orange-500">{{ displayedRows.length }} affichés</span></template>
        </DataTableToolbar>
        <DataTable
          :value="displayedRows"
          :loading="loading"
          dataKey="PlaceId"
          sortMode="multiple"
          :multiSortMeta="multiSortMeta"
          :paginator="!showAll"
          :rows="rowsPerPage"
          :rowsPerPageOptions="rawRowsPerPageOptions"
          :rowHover="true"
          :scrollable="true"
          scrollHeight="68vh"
          :virtualScrollerOptions="displayedRows.length > 200 ? { itemSize: 46, delay: 0 } : null"
          :resizableColumns="true"
          columnResizeMode="fit"
          :reorderableColumns="true"
          :class="[{ 'table-compact': compact }]"
        >
          <template #empty>
            <div class="text-center p-4 text-600">Aucune place trouvée</div>
          </template>
          <Column header="" style="width: 8rem">
            <template #body="{ data }">
              <div class="flex gap-2">
                <Button
                  v-if="!isEditingRow(data)"
                  icon="pi pi-pencil"
                  size="small"
                  outlined
                  @click="startEditRow(data)"
                />
                <Button
                  v-else
                  icon="pi pi-check"
                  size="small"
                  severity="success"
                  outlined
                  :loading="savingRowId === data.PlaceId"
                  @click="saveEditRow(data)"
                />
                <Button
                  v-if="isEditingRow(data)"
                  icon="pi pi-times"
                  size="small"
                  severity="secondary"
                  outlined
                  :disabled="savingRowId === data.PlaceId"
                  @click="cancelEditRow()"
                />
              </div>
            </template>
          </Column>
          <Column header="Institution Name" sortable sortField="InstitutionNameSort">
            <template #body="{ data }">
              <Dropdown
                v-if="isEditingRow(data)"
                v-model="editBuffer.InstitutionId"
                :options="institutionsOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="🔍 Rechercher et sélectionner..."
                class="w-full no-institution"
                filter
                filterPlaceholder="Taper pour rechercher"
                :filterMatchMode="'contains'"
                showClear
              />
              <span v-else>{{ institutionNameById[data.InstitutionId] || data.InstitutionName || '-' }}</span>
            </template>
          </Column>
          <Column header="Nom" sortable sortField="NomPlace">
            <template #body="{ data }">
              <InputText
                v-if="isEditingRow(data)"
                v-model="editBuffer.NomPlace"
              />
              <span v-else>{{ data.NomPlace || '-' }}</span>
            </template>
          </Column>
          <Column header="PFP3">
            <template #body="{ data }">
              <InputText v-if="isEditingRow(data)" v-model="editBuffer.PFP3" class="p-inputtext-sm" />
              <span v-else :class="(data.PFP3 && (data.PFP3[selectedYear] != null && data.PFP3[selectedYear] !== '') || (selectedYear === '2028' && data.PFP3 && data.PFP3['2027'] != null && data.PFP3['2027'] !== '')) ? 'font-semibold text-green-600' : 'text-400'">
                {{ (data.PFP3 && (data.PFP3[selectedYear] || (selectedYear === '2028' ? data.PFP3['2027'] : null))) || '-' }}
              </span>
            </template>
          </Column>
          <Column header="PFP2">
            <template #body="{ data }">
              <InputText v-if="isEditingRow(data)" v-model="editBuffer.PFP2" class="p-inputtext-sm" />
              <span v-else :class="(data.PFP2 && data.PFP2[selectedYear] != null && data.PFP2[selectedYear] !== '') ? 'font-semibold text-green-600' : 'text-400'">
                {{ (data.PFP2 && data.PFP2[selectedYear]) || '-' }}
              </span>
            </template>
          </Column>
          <Column header="PFP1A">
            <template #body="{ data }">
              <InputText v-if="isEditingRow(data)" v-model="editBuffer.PFP1A" class="p-inputtext-sm" />
              <span v-else :class="(data.PFP1A && data.PFP1A[selectedYear] != null && data.PFP1A[selectedYear] !== '') ? 'font-semibold text-green-600' : 'text-400'">
                {{ (data.PFP1A && data.PFP1A[selectedYear]) || '-' }}
              </span>
            </template>
          </Column>
          <Column header="PFP1B">
            <template #body="{ data }">
              <InputText v-if="isEditingRow(data)" v-model="editBuffer.PFP1B" class="p-inputtext-sm" />
              <span v-else :class="(data.PFP1B && data.PFP1B[selectedYear] != null && data.PFP1B[selectedYear] !== '') ? 'font-semibold text-green-600' : 'text-400'">
                {{ (data.PFP1B && data.PFP1B[selectedYear]) || '-' }}
              </span>
            </template>
          </Column>
          <Column header="PFP4">
            <template #body="{ data }">
              <InputText v-if="isEditingRow(data)" v-model="editBuffer.PFP4" class="p-inputtext-sm" />
              <span v-else :class="(data.PFP4 && data.PFP4[selectedYear] != null && data.PFP4[selectedYear] !== '') ? 'font-semibold text-green-600' : 'text-400'">
                {{ (data.PFP4 && data.PFP4[selectedYear]) || '-' }}
              </span>
            </template>
          </Column>
          <Column header="MSQ" v-if="visibleColumns.MSQ">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.MSQ" />
              <Tag v-else :value="isTrueFlag(data.MSQ) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.MSQ) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="SYSINT" v-if="visibleColumns.SYSINT">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.SYSINT" />
              <Tag v-else :value="isTrueFlag(data.SYSINT) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.SYSINT) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="NEUROGER" v-if="visibleColumns.NEUROGER">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.NEUROGER" />
              <Tag v-else :value="isTrueFlag(data.NEUROGER) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.NEUROGER) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="AIGU" v-if="visibleColumns.AIGU">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.AIGU" />
              <Tag v-else :value="isTrueFlag(data.AIGU) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.AIGU) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="REHAB" v-if="visibleColumns.REHAB">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.REHAB" />
              <Tag v-else :value="isTrueFlag(data.REHAB) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.REHAB) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="AMBU" v-if="visibleColumns.AMBU">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.AMBU" />
              <Tag v-else :value="isTrueFlag(data.AMBU) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.AMBU) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="FR" v-if="visibleColumns.FR">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.FR" />
              <Tag v-else :value="isTrueFlag(data.FR) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.FR) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="DE" v-if="visibleColumns.DE">
            <template #body="{ data }">
              <InputSwitch v-if="isEditingRow(data)" v-model="editBuffer.DE" />
              <Tag v-else :value="isTrueFlag(data.DE) ? 'Oui' : 'Non'" :severity="isTrueFlag(data.DE) ? 'success' : 'secondary'" />
            </template>
          </Column>
          <Column header="Canton" sortable>
            <template #body="{ data }">
              {{ institutionCantonById[data.InstitutionId] || data.Canton || '-' }}
            </template>
          </Column>
          <Column header="Critères">
            <template #body="{ data }">
              <div class="flex gap-2 flex-wrap">
                <Tag v-if="isTrueFlag(data.MSQ)" value="MSQ" />
                <Tag v-if="isTrueFlag(data.SYSINT)" value="SYSINT" />
                <Tag v-if="isTrueFlag(data.AIGU)" value="AIGU" />
                <Tag v-if="isTrueFlag(data.REHAB)" value="REHAB" />
                <Tag v-if="isTrueFlag(data.AMBU)" value="AMBU" />
                <Tag v-if="isTrueFlag(data.NEUROGER)" value="NEUROGER" />
              </div>
            </template>
          </Column>
          <Column header="Langues">
            <template #body="{ data }">
              <div class="flex gap-2 flex-wrap">
                <Tag v-if="data.FR" value="FR" />
                <Tag v-if="data.DE" value="DE" />
                <Tag v-if="data.IT" value="IT" />
                <Tag v-if="data.ENG" value="EN" />
              </div>
            </template>
          </Column>
          <Column header="Praticien Formateur">
            <template #body="{ data }">
              <div class="praticiens-container">
                <div v-if="!data.praticiensFormateurs || data.praticiensFormateurs.length === 0" class="text-500 text-sm mb-2">
                  Aucun praticien
                </div>
                <div v-else class="praticiens-names mb-2">
                  <div
                    v-for="pfId in data.praticiensFormateurs"
                    :key="pfId"
                    class="praticien-name"
                  >
                    {{ getPraticienDisplayName(pfId) }}
                  </div>
                </div>
                <Button
                  icon="pi pi-pencil"
                  label="Modifier"
                  text
                  size="small"
                  @click="openPraticienSelector(data)"
                  class="p-button-sm"
                />
              </div>
            </template>
          </Column>
          <Column header="Remarques">
            <template #body="{ data }">
              <Textarea :value="(data.Remarques && (data.Remarques[selectedYear] || data.Remarques['note'] || '')) || ''" @change="e => onChangeRemarques(data, e.target.value)" rows="2" class="w-full" />
            </template>
          </Column>
          <Column header="Fiche">
            <template #body="{ data }">
              <div class="flex align-items-center gap-2">
                <a v-if="data.fileurl || data.fileURL" :href="data.fileurl || data.fileURL" target="_blank" class="text-primary">
                  <i class="pi pi-file-pdf"></i> PDF
                </a>
                <span v-else class="text-500">Aucun fichier</span>
                <Button
                  icon="pi pi-upload"
                  text
                  rounded
                  size="small"
                  @click="openFileUpload(data)"
                  v-tooltip.top="'Ajouter/Modifier le document'"
                />
              </div>
            </template>
          </Column>
          <Column header="Actions"  alignFrozen="right">
            <template #body="{ data }">
              <Button
                icon="pi pi-trash"
                severity="danger"
                text
                rounded
                @click="confirmDelete(data)"
                v-tooltip.top="'Supprimer la place'"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <!-- Dialog de création de place -->
    <CreatePlaceDialog
      v-model:visible="showCreateDialog"
      :selected-year="selectedYear"
      @created="onPlaceCreated"
    />

    <!-- Dialog de sélection des praticiens -->
    <Dialog
      v-model:visible="showPraticienDialog"
      modal
      header="Sélectionner les praticiens formateurs"
      :style="{ width: '600px' }"
    >
      <div class="mb-3">
        <label class="block text-sm font-semibold mb-2">Rechercher et sélectionner</label>
        <small class="text-500 block mb-2">{{ praticiensOptions.length }} praticiens disponibles</small>
        <MultiSelect
          v-model="selectedPraticiens"
          :options="praticiensOptions"
          optionLabel="label"
          optionValue="id"
          display="chip"
          class="w-full"
          filter
          :filterFields="['label']"
          filterPlaceholder="🔍 Rechercher un praticien..."
          placeholder="Sélectionner des praticiens..."
          :virtualScrollerOptions="{ itemSize: 38 }"
          :maxSelectedLabels="5"
          scrollHeight="300px"
        >
          <template #option="slotProps">
            <div class="flex align-items-center gap-2">
              <i class="pi pi-user" style="font-size: 0.85rem"></i>
              <span>{{ slotProps.option.label }}</span>
            </div>
          </template>
          <template #empty>
            <div class="p-3 text-center text-500">Aucun praticien trouvé</div>
          </template>
        </MultiSelect>
      </div>

      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showPraticienDialog = false"
        />
        <Button
          label="Enregistrer"
          icon="pi pi-check"
          @click="savePraticiens"
        />
      </template>
    </Dialog>

    <!-- Dialog d'upload de fichier -->
    <Dialog
      v-model:visible="showFileDialog"
      modal
      header="Ajouter un document"
      :style="{ width: '500px' }"
    >
      <div class="mb-3">
        <label class="block text-sm font-semibold mb-2">Sélectionner un fichier PDF</label>
        <input
          type="file"
          ref="fileInput"
          accept=".pdf"
          @change="onFileSelected"
          class="w-full p-2 border-1 surface-border border-round"
        />
        <small class="text-500 block mt-2">Formats acceptés : PDF uniquement</small>
      </div>

      <div v-if="selectedFile" class="surface-card p-3 border-round mb-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-file-pdf text-primary text-2xl"></i>
          <div class="flex-1">
            <div class="font-semibold">{{ selectedFile.name }}</div>
            <div class="text-sm text-500">{{ formatFileSize(selectedFile.size) }}</div>
          </div>
          <Button
            icon="pi pi-times"
            text
            rounded
            severity="danger"
            @click="clearFile"
          />
        </div>
      </div>

      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showFileDialog = false"
        />
        <Button
          label="Uploader"
          icon="pi pi-upload"
          @click="uploadFile"
          :disabled="!selectedFile"
          :loading="uploading"
        />
      </template>
    </Dialog>

    <!-- Dialog de confirmation de suppression -->
    <Dialog
      v-model:visible="showDeleteDialog"
      modal
      header="Confirmer la suppression"
      :style="{ width: '450px' }"
    >
      <div class="flex align-items-center gap-3 mb-3">
        <i class="pi pi-exclamation-triangle text-orange-500" style="font-size: 2rem"></i>
        <div>
          <p class="m-0 font-semibold">Êtes-vous sûr de vouloir supprimer cette place ?</p>
          <p class="m-0 mt-2 text-600" v-if="placeToDelete">
            <strong>{{ placeToDelete.NomPlace }}</strong>
            <span v-if="placeToDelete.InstitutionName"> - {{ placeToDelete.InstitutionName }}</span>
          </p>
        </div>
      </div>

      <div class="surface-card p-3 border-round mb-3" style="background: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3);">
        <p class="m-0 text-sm">
          <i class="pi pi-info-circle mr-2"></i>
          Cette action est <strong>irréversible</strong>. Toutes les données associées à cette place seront définitivement supprimées.
        </p>
      </div>

      <template #footer>
        <Button
          label="Annuler"
          icon="pi pi-times"
          text
          @click="showDeleteDialog = false"
        />
        <Button
          label="Supprimer"
          icon="pi pi-trash"
          severity="danger"
          @click="deletePlace"
          :loading="deleting"
        />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import DataTableToolbar from '@/components/common/tables/DataTableToolbar.vue'
import Button from 'primevue/button'
import { usePlacesStore } from '@/stores/placesStore'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import InputSwitch from 'primevue/inputswitch'
import MultiSelect from 'primevue/multiselect'
import Textarea from 'primevue/textarea'
import { usePraticiensStore } from '@/stores/praticiensStore'
import Dropdown from 'primevue/dropdown'
import { checkSupabaseAuth } from '@/utils/checkAuth'
import CreatePlaceDialog from '@/components/admin/places/CreatePlaceDialog.vue'
import Dialog from 'primevue/dialog'
import OverlayPanel from 'primevue/overlaypanel'
import Checkbox from 'primevue/checkbox'
import ProgressBar from 'primevue/progressbar'
import { storage } from '@/firebase'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const store = usePlacesStore()
const institutionsStore = useInstitutionsStore()
const praticiensStore = usePraticiensStore()
const toast = useToast()
const loading = computed(() => store.loading)
const multiSortMeta = ref([{ field: 'InstitutionNameSort', order: 1 }])
const searchInput = ref('')
const search = ref('')
const years = ref([
  { label: '2024-2025', value: '2025' },
  { label: '2025-2026', value: '2026' },
  { label: '2026-2027', value: '2027' },
  { label: '2027-2028', value: '2028' }
])
const selectedYear = ref('2026')
const FILTERS_KEY = 'fp_phy_places_filters'

const hasPdf = (p) => Boolean(p?.fileURL || p?.FileURL || p?.pdfUrl || p?.PdfUrl || p?.fileUrl || p?.fileurl)

const hasYearActivity = (p, year) => {
  const fields = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
  return fields.some((field) => {
    const v = p?.[field]
    if (!v) return false
    if (typeof v === 'string') return v.trim().length > 0
    if (typeof v === 'object') return Boolean(v?.[year])
    return false
  })
}

const placeKpis = computed(() => {
  const all = store.places || []
  const total = all.length
  const withInstitution = all.filter((p) => p?.InstitutionId).length
  const withPdf = all.filter((p) => hasPdf(p)).length
  const yearActive = all.filter((p) => hasYearActivity(p, selectedYear.value)).length

  return [
    { label: 'Places totales', value: total, colorClass: 'text-blue-400' },
    { label: 'Avec institution', value: withInstitution, colorClass: 'text-green-400' },
    { label: 'Avec PDF', value: withPdf, colorClass: 'text-yellow-400' },
    { label: `Actives ${selectedYear.value}`, value: yearActive, colorClass: 'text-purple-400' },
  ]
})

const debug = (...args) => {
  if (import.meta.env.DEV) console.log(...args)
}

let searchDebounceTimer = null
watch(searchInput, (val) => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer)
  searchDebounceTimer = setTimeout(() => {
    search.value = val
  }, 300)
})
const institutionNameById = computed(() => {
  const m = {}
  for (const inst of institutionsStore.institutions || []) {
    if (inst?.InstitutionId) m[inst.InstitutionId] = inst?.Name || ''
  }
  return m
})

// Récupérer le Canton depuis l'institution
const institutionCantonById = computed(() => {
  const m = {}
  for (const inst of institutionsStore.institutions || []) {
    if (inst?.InstitutionId) m[inst.InstitutionId] = inst?.Canton || ''
  }
  return m
})

const MAX_SHOW_ALL_ROWS = 500

const editingRowId = ref(null)
const savingRowId = ref(null)
const editBuffer = ref({
  PlaceId: null,
  InstitutionId: null,
  NomPlace: '',
  MSQ: false,
  SYSINT: false,
  NEUROGER: false,
  AIGU: false,
  REHAB: false,
  AMBU: false,
  FR: false,
  DE: false,
  PFP2: '',
  PFP1A: '',
  PFP1B: '',
  PFP3: '',
  PFP4: ''
})

const isEditingRow = (row) => {
  return !!row?.PlaceId && editingRowId.value === row.PlaceId
}

const isTrueFlag = (value) => {
  return value === true || value === 'true' || value === 1 || value === '1'
}

const ensureCriteriaColumnsVisible = () => {
  visibleColumns.value.MSQ = true
  visibleColumns.value.SYSINT = true
  visibleColumns.value.NEUROGER = true
  visibleColumns.value.AIGU = true
  visibleColumns.value.REHAB = true
  visibleColumns.value.AMBU = true
  visibleColumns.value.FR = true
  visibleColumns.value.DE = true
}

const startEditRow = (row) => {
  if (!row?.PlaceId) return
  const yearKey = selectedYear.value
  ensureCriteriaColumnsVisible()
  editingRowId.value = row.PlaceId
  editBuffer.value = {
    PlaceId: row.PlaceId,
    InstitutionId: row.InstitutionId || null,
    NomPlace: row.NomPlace || '',
    MSQ: isTrueFlag(row.MSQ),
    SYSINT: isTrueFlag(row.SYSINT),
    NEUROGER: isTrueFlag(row.NEUROGER),
    AIGU: isTrueFlag(row.AIGU),
    REHAB: isTrueFlag(row.REHAB),
    AMBU: isTrueFlag(row.AMBU),
    FR: isTrueFlag(row.FR),
    DE: isTrueFlag(row.DE),
    PFP2: (row.PFP2 && row.PFP2[yearKey]) || '',
    PFP1A: (row.PFP1A && row.PFP1A[yearKey]) || '',
    PFP1B: (row.PFP1B && row.PFP1B[yearKey]) || '',
    PFP3: (row.PFP3 && row.PFP3[yearKey]) || '',
    PFP4: (row.PFP4 && row.PFP4[yearKey]) || ''
  }
}

const cancelEditRow = () => {
  editingRowId.value = null
  editBuffer.value = {
    PlaceId: null,
    InstitutionId: null,
    NomPlace: '',
    MSQ: false,
    SYSINT: false,
    NEUROGER: false,
    AIGU: false,
    REHAB: false,
    AMBU: false,
    FR: false,
    DE: false,
    PFP2: '',
    PFP1A: '',
    PFP1B: '',
    PFP3: '',
    PFP4: ''
  }
}

const saveEditRow = async (row) => {
  if (!row?.PlaceId) return
  if (savingRowId.value) return

  const nomPlace = (editBuffer.value.NomPlace || '').trim()
  if (!nomPlace) {
    toast.add({ severity: 'warn', summary: 'Nom requis', detail: 'Le nom de la place est obligatoire.', life: 3500 })
    return
  }

  const duplicate = (store.places || []).find((p) => {
    if (!p?.PlaceId || p.PlaceId === row.PlaceId) return false
    return (p.InstitutionId || null) === (editBuffer.value.InstitutionId || null)
      && (p.NomPlace || '').trim().toLowerCase() === nomPlace.toLowerCase()
  })

  if (duplicate) {
    toast.add({ severity: 'warn', summary: 'Doublon détecté', detail: 'Une place avec le même nom existe déjà pour cette institution.', life: 4000 })
    return
  }

  savingRowId.value = row.PlaceId
  try {
    const yearKey = selectedYear.value
    const institutionId = editBuffer.value.InstitutionId || null
    const institutionName = institutionId ? (institutionNameById.value[institutionId] || null) : null

    const pfp2 = { ...(row.PFP2 || {}) }
    pfp2[yearKey] = editBuffer.value.PFP2 || ''
    const pfp1a = { ...(row.PFP1A || {}) }
    pfp1a[yearKey] = editBuffer.value.PFP1A || ''
    const pfp1b = { ...(row.PFP1B || {}) }
    pfp1b[yearKey] = editBuffer.value.PFP1B || ''
    const pfp3 = { ...(row.PFP3 || {}) }
    pfp3[yearKey] = editBuffer.value.PFP3 || ''
    const pfp4 = { ...(row.PFP4 || {}) }
    pfp4[yearKey] = editBuffer.value.PFP4 || ''

    await store.updatePlace(row.PlaceId, {
      InstitutionId: institutionId,
      InstitutionName: institutionName,
      NomPlace: nomPlace,
      MSQ: !!editBuffer.value.MSQ,
      SYSINT: !!editBuffer.value.SYSINT,
      NEUROGER: !!editBuffer.value.NEUROGER,
      AIGU: !!editBuffer.value.AIGU,
      REHAB: !!editBuffer.value.REHAB,
      AMBU: !!editBuffer.value.AMBU,
      FR: !!editBuffer.value.FR,
      DE: !!editBuffer.value.DE,
      PFP2: pfp2,
      PFP1A: pfp1a,
      PFP1B: pfp1b,
      PFP3: pfp3,
      PFP4: pfp4
    })

    await store.fetchPlaceById(row.PlaceId)
    await store.fetchPlaces()

    cancelEditRow()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Mise à jour impossible', detail: error?.message || 'Vérifiez les données de la place puis réessayez.', life: 4500 })
  } finally {
    savingRowId.value = null
  }
}

const baseRows = computed(() => {
  // Liste brute depuis le store
  let list = [...(store.places || [])]

  // Filtre PDF
  if (withPdfOnly.value) {
    list = list.filter(p => {
      const fileUrl = p.fileURL || p.FileURL || p.pdfUrl || p.PdfUrl || p.fileUrl
      return !!fileUrl
    })
  }

  // Filtre recherche
  const s = (search.value || '').trim().toLowerCase()
  if (s) {
    list = list.filter(p => {
      const institutionName = p.InstitutionName || institutionNameById.value[p.InstitutionId] || ''
      const canton = institutionCantonById.value[p.InstitutionId] || p.Canton || ''
      return (
        (p.NomPlace || '').toLowerCase().includes(s) ||
        institutionName.toLowerCase().includes(s) ||
        canton.toLowerCase().includes(s)
      )
    })
  }

  // Champ de tri stable sur le texte réellement affiché
  return list.map(p => {
    const institutionName = p.InstitutionName || institutionNameById.value[p.InstitutionId] || ''
    return {
      ...p,
      InstitutionNameSort: institutionName
    }
  })
})

const totalMatchingRows = computed(() => baseRows.value.length)

const displayedRows = computed(() => {
  let list = baseRows.value

  // Moitié
  if (showHalf.value) {
    list = list.slice(0, Math.ceil(list.length / 2))
  }

  // "Tout" = pas de paginator, mais on garde une limite de sécurité
  if (showAll.value && list.length > MAX_SHOW_ALL_ROWS) {
    list = list.slice(0, MAX_SHOW_ALL_ROWS)
  }

  return list
})

const isTruncated = computed(() => {
  if (!showAll.value) return false
  return displayedRows.value.length < totalMatchingRows.value
})

const praticiensOptions = computed(() => {
  const items = praticiensStore.items || []
  debug('🔍 Praticiens Store Items:', items.length)
  if (items.length > 0) {
    debug('📋 Premier praticien:', items[0])
  }

  const options = items.map(p => {
    const prenom = p.prenom || p.Prenom || ''
    const nom = p.nom || p.Nom || ''
    const fullName = `${prenom} ${nom}`.trim()
    const label = fullName || p.mail || p.Mail || `PF-${p.id}`

    return {
      id: String(p.id),
      label: label
    }
  })

  if (options.length > 0) {
    debug('✅ Première option:', options[0])
  }

  return options
})

const institutionsOptions = computed(() => {
  return (institutionsStore.institutions || []).map(inst => ({
    value: inst.InstitutionId,
    label: `${inst.Name || 'Sans nom'} ${inst.Canton ? `(${inst.Canton})` : ''}`.trim()
  }))
})

// UI/UX controls
const rowsOptions = ref([
  { label: '20 par page', value: 20 },
  { label: '30 par page', value: 30 },
  { label: '50 par page', value: 50 },
  { label: '100 par page', value: 100 },
])
const rawRowsPerPageOptions = computed(() => rowsOptions.value.map(o => o.value))
const rowsPerPage = ref(20)
const showAll = ref(false)
const showHalf = ref(false)
const withPdfOnly = ref(false)
const compact = ref(false)

try {
  const saved = JSON.parse(localStorage.getItem(FILTERS_KEY) || '{}')
  if (typeof saved.searchInput === 'string') searchInput.value = saved.searchInput
  if (typeof saved.selectedYear === 'string') selectedYear.value = saved.selectedYear
  if (typeof saved.rowsPerPage === 'number') rowsPerPage.value = saved.rowsPerPage
  if (typeof saved.showAll === 'boolean') showAll.value = saved.showAll
  if (typeof saved.compact === 'boolean') compact.value = saved.compact
  if (Array.isArray(saved.multiSortMeta) && saved.multiSortMeta.length) multiSortMeta.value = saved.multiSortMeta
} catch {
  localStorage.removeItem(FILTERS_KEY)
}

watch([searchInput, selectedYear, rowsPerPage, showAll, compact, multiSortMeta], () => {
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify({
      searchInput: searchInput.value,
      selectedYear: selectedYear.value,
      rowsPerPage: rowsPerPage.value,
      showAll: showAll.value,
      compact: compact.value,
      multiSortMeta: multiSortMeta.value,
    }))
  } catch (e) {
    console.warn('Erreur sauvegarde filtres places:', e)
  }
})

function resetFilters() {
  searchInput.value = ''
  search.value = ''
  selectedYear.value = years.value[0] || '2026'
  multiSortMeta.value = [{ field: 'InstitutionNameSort', order: 1 }]
  rowsPerPage.value = 20
  showAll.value = false
  showHalf.value = false
  withPdfOnly.value = false
  compact.value = false
  visibleColumns.value = {
    MSQ: false,
    SYSINT: false,
    NEUROGER: false,
    AIGU: false,
    REHAB: false,
    AMBU: false,
    FR: false,
    DE: false
  }
  try {
    localStorage.removeItem(FILTERS_KEY)
  } catch (e) {
    console.warn('Erreur reset filtres places:', e)
  }
}

const showCreateDialog = ref(false)
const showDeleteDialog = ref(false)
const showPraticienDialog = ref(false)
const showFileDialog = ref(false)
const placeToDelete = ref(null)
const deleting = ref(false)
const columnsPanel = ref(null)
const currentPlace = ref(null)
const selectedPraticiens = ref([])
const selectedFile = ref(null)
const fileInput = ref(null)
const uploading = ref(false)

// Visibilité des colonnes
const visibleColumns = ref({
  MSQ: false,
  SYSINT: false,
  NEUROGER: false,
  AIGU: false,
  REHAB: false,
  AMBU: false,
  FR: false,
  DE: false
})

// Computed pour les checkboxes "tous"
const showCriteresColumns = computed({
  get: () => visibleColumns.value.MSQ && visibleColumns.value.SYSINT &&
    visibleColumns.value.NEUROGER && visibleColumns.value.AIGU &&
    visibleColumns.value.REHAB && visibleColumns.value.AMBU,
  set: (val) => {
    visibleColumns.value.MSQ = val
    visibleColumns.value.SYSINT = val
    visibleColumns.value.NEUROGER = val
    visibleColumns.value.AIGU = val
    visibleColumns.value.REHAB = val
    visibleColumns.value.AMBU = val
  }
})

const showLanguesColumns = computed({
  get: () => visibleColumns.value.FR && visibleColumns.value.DE,
  set: (val) => {
    visibleColumns.value.FR = val
    visibleColumns.value.DE = val
  }
})

async function onChangeSimple(row, field, value) {
  if (!row?.PlaceId) return
  try {
    await store.updatePlace(row.PlaceId, { [field]: value })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde: ' + error.message, life: 5000 })
  }
}

async function onChangeInstitution(row, institutionId) {
  if (!row?.PlaceId) return

  const institutionName = institutionId
    ? institutionsOptions.value.find(inst => inst.value === institutionId)?.label || ''
    : 'Aucune'

  console.log('🏥 Assignation institution:', {
    placeId: row.PlaceId,
    placeName: row.NomPlace,
    institutionId,
    institutionName
  })

  try {
    await store.updatePlace(row.PlaceId, {
      InstitutionId: institutionId || null,
      InstitutionName: institutionNameById.value[institutionId] || null
    })

    // Recharger la place pour avoir les données à jour
    await store.fetchPlaceById(row.PlaceId)

    console.log('✅ Institution assignée avec succès')
  } catch (error) {
    console.error('❌ Erreur lors de l\'assignation de l\'institution:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde: ' + error.message, life: 5000 })
  }
}

async function onChangeBool(row, field, value) {
  if (!row?.PlaceId) return
  console.log('📝 Modification Bool:', { field, value, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: !!value })
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Bool:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde.', life: 5000 })
  }
}

async function onChangePFP(row, field, vYear) {
  if (!row?.PlaceId) return
  const current = row[field] || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(vYear ?? '') }
  console.log('📝 Modification PFP:', { field, yr, current, updates, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: updates })
    // Recharger la place pour s'assurer d'avoir les dernières données
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification PFP:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde.', life: 5000 })
  }
}

async function onChangeRemarques(row, text) {
  if (!row?.PlaceId) return
  const current = row.Remarques || {}
  const yr = selectedYear.value
  const updates = { ...current, [yr]: String(text || '') }
  console.log('📝 Modification Remarques:', { yr, current, updates, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { Remarques: updates })
    // Recharger la place pour s'assurer d'avoir les dernières données
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Remarques:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde.', life: 5000 })
  }
}

async function onChangeArray(row, field, arr) {
  if (!row?.PlaceId) return
  const value = Array.isArray(arr) ? arr : []
  console.log('📝 Modification Array:', { field, value, rowId: row.PlaceId })
  try {
    await store.updatePlace(row.PlaceId, { [field]: value })
    await store.fetchPlaceById(row.PlaceId)
  } catch (error) {
    console.error('❌ Erreur lors de la modification Array:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde.', life: 5000 })
  }
}

async function reload() {
  console.log('🔄 [PlacesView] Début du rechargement des places...')
  await store.fetchPlaces()
  console.log('✅ [PlacesView] Places rechargées:', store.places?.length || 0)
}

async function onPlaceCreated(place) {
  console.log('📢 [PlacesView] Événement reçu - Nouvelle place créée:', place?.PlaceId)
  
  // Petit délai pour laisser Supabase se synchroniser
  await new Promise(resolve => setTimeout(resolve, 200))
  
  // Recharger la liste des places
  console.log('🔄 [PlacesView] Rechargement de la liste complète...')
  await reload()
  
  // Double vérification - recharger une seconde fois si nécessaire
  if (place?.PlaceId) {
    await new Promise(resolve => setTimeout(resolve, 300))
    const placeExists = store.places?.some(p => p.PlaceId === place.PlaceId)
    if (!placeExists) {
      console.warn('⚠️ [PlacesView] Place non trouvée après refresh, rechargement supplémentaire...')
      await reload()
    }
  }
  
  console.log('✅ [PlacesView] Handler onPlaceCreated terminé')
}

function toggleColumnsPanel(event) {
  columnsPanel.value.toggle(event)
}

function toggleAllCriteres() {
  // Géré par le computed
}

function toggleAllLangues() {
  // Géré par le computed
}

function getPraticienDisplayName(praticienId) {
  // Debug: afficher le type et la valeur de l'ID recherché
  if (import.meta.env.DEV) {
    const storeIds = (praticiensStore.items || []).slice(0, 3).map(p => ({ id: p.id, type: typeof p.id }))
    console.log('🔍 getPraticienDisplayName:', { praticienId, type: typeof praticienId, storeItemsCount: praticiensStore.items?.length, sampleStoreIds: storeIds })
  }

  // Chercher dans les options — comparaison souple (number vs string)
  const praticien = praticiensOptions.value.find(p =>
    p.id === praticienId ||
    p.id === String(praticienId) ||
    String(p.id) === String(praticienId) ||
    p.id === Number(praticienId) ||
    Number(p.id) === Number(praticienId)
  )

  if (praticien?.label) {
    return praticien.label
  }

  // Si on ne trouve pas dans les options, chercher directement dans le store
  const pf = (praticiensStore.items || []).find(p =>
    p.id === praticienId ||
    p.id === String(praticienId) ||
    String(p.id) === String(praticienId) ||
    p.id === Number(praticienId) ||
    Number(p.id) === Number(praticienId)
  )

  if (pf) {
    const prenom = pf.prenom || pf.Prenom || ''
    const nom = pf.nom || pf.Nom || ''
    const fullName = `${prenom} ${nom}`.trim()
    return fullName || pf.mail || pf.Mail || `PF-${praticienId}`
  }

  // Fallback: afficher l'ID
  return `PF-${praticienId}`
}

function openPraticienSelector(place) {
  currentPlace.value = place
  selectedPraticiens.value = [...(place.praticiensFormateurs || [])]
  showPraticienDialog.value = true
}

async function savePraticiens() {
  if (!currentPlace.value?.PlaceId) return

  try {
    await onChangeArray(currentPlace.value, 'praticiensFormateurs', selectedPraticiens.value)
    showPraticienDialog.value = false
    currentPlace.value = null
    selectedPraticiens.value = []
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde des praticiens:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la sauvegarde.', life: 5000 })
  }
}

function openFileUpload(place) {
  currentPlace.value = place
  selectedFile.value = null
  showFileDialog.value = true
}

function onFileSelected(event) {
  const file = event.target.files[0]
  if (file && file.type === 'application/pdf') {
    selectedFile.value = file
  } else if (file) {
    toast.add({ severity: 'warn', summary: 'Format invalide', detail: 'Veuillez sélectionner un fichier PDF.', life: 3000 })
    event.target.value = ''
  }
}

function clearFile() {
  selectedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

async function uploadFile() {
  if (!selectedFile.value || !currentPlace.value?.PlaceId) return

  uploading.value = true

  try {
    console.log('📤 Upload du fichier:', selectedFile.value.name, 'pour la place:', currentPlace.value.PlaceId)

    // Créer un nom de fichier unique avec timestamp
    const timestamp = Date.now()
    const fileName = `${timestamp}_${selectedFile.value.name}`
    const filePath = `places/${currentPlace.value.PlaceId}/${fileName}`

    console.log('📁 Upload vers Firebase Storage:', filePath)

    // Créer la référence Firebase Storage
    const fileRef = storageRef(storage, filePath)

    // Upload le fichier vers Firebase Storage
    const snapshot = await uploadBytes(fileRef, selectedFile.value, {
      contentType: 'application/pdf',
      customMetadata: {
        placeId: String(currentPlace.value.PlaceId),
        placeName: currentPlace.value.NomPlace || 'unknown',
        uploadedAt: new Date().toISOString()
      }
    })

    console.log('✅ Fichier uploadé:', snapshot.metadata.fullPath)

    // Obtenir l'URL de téléchargement avec token
    const downloadURL = await getDownloadURL(fileRef)

    console.log('🔗 URL du fichier:', downloadURL)

    // Mettre à jour la place avec l'URL du fichier
    console.log('🔄 Tentative de mise à jour Supabase:', {
      placeId: currentPlace.value.PlaceId,
      fileurl: downloadURL,
      filename: selectedFile.value.name
    })

    const updatedPlace = await store.updatePlace(currentPlace.value.PlaceId, {
      fileurl: downloadURL,
      filename: selectedFile.value.name
    })

    console.log('✅ Place mise à jour avec le lien du fichier:', updatedPlace)

    // Mettre à jour l'objet currentPlace pour que la vue se rafraîchisse
    if (updatedPlace) {
      Object.assign(currentPlace.value, updatedPlace)
    }

    // Recharger toutes les places pour être sûr
    await store.fetchPlaces()

    toast.add({ severity: 'success', summary: 'Succès', detail: 'Document uploadé avec succès !', life: 3000 })

    showFileDialog.value = false
    selectedFile.value = null
    currentPlace.value = null
  } catch (error) {
    console.error('❌ Erreur lors de l\'upload du fichier:', error)
    toast.add({ severity: 'error', summary: 'Upload impossible', detail: error?.message || 'Le document n\'a pas pu être uploadé.', life: 5000 })
  } finally {
    uploading.value = false
  }
}

function confirmDelete(place) {
  placeToDelete.value = place
  showDeleteDialog.value = true
  console.log('🗑️ Demande de suppression:', place.PlaceId, place.NomPlace)
}

async function deletePlace() {
  if (!placeToDelete.value?.PlaceId) return

  deleting.value = true

  try {
    console.log('🗑️ Suppression de la place:', placeToDelete.value.PlaceId)
    await store.deletePlace(placeToDelete.value.PlaceId)
    console.log('✅ Place supprimée avec succès')

    // Attendre que Supabase propage la suppression
    console.log('⏱️ Attente de propagation de la suppression...')
    await new Promise(resolve => setTimeout(resolve, 300))

    // Recharger la liste (AVEC await)
    console.log('🔄 Rechargement de la liste après suppression...')
    await reload()

    // Fermer le dialog
    showDeleteDialog.value = false
    placeToDelete.value = null

    console.log('✅ Suppression terminée et liste mise à jour')
  } catch (error) {
    console.error('❌ Erreur lors de la suppression:', error)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la suppression: ' + error.message, life: 5000 })
  } finally {
    deleting.value = false
  }
}

onMounted(async () => {
  // Vérifier l'authentification Supabase au chargement
  await checkSupabaseAuth()

  console.log('🚀 [PlacesView] Chargement initial...')

  if (!store.places?.length) {
    console.log('📍 Chargement des places...')
    await store.fetchPlaces()
  }

  if (!institutionsStore.institutions?.length) {
    console.log('🏥 Chargement des institutions...')
    await institutionsStore.fetchInstitutions()
  }

  console.log('👥 Chargement des praticiens...')
  await praticiensStore.fetchPraticiens()
  console.log('✅ Praticiens chargés:', praticiensStore.items?.length)

  if (praticiensStore.items && praticiensStore.items.length > 0) {
    console.log('📋 Exemple de praticien:', praticiensStore.items[0])
  }
})

watch(search, () => { /* filtering is computed */ })
watch(selectedYear, () => {
  // Optionnel: recharger si vous souhaitez recalculer côté backend
  reload()
})

// Watch pour forcer la mise à jour des options quand les praticiens sont chargés
watch(() => praticiensStore.items, (newItems) => {
  console.log('🔄 [PlacesView] Praticiens store mis à jour:', newItems?.length)
  if (newItems && newItems.length > 0) {
    console.log('📋 Premier praticien après update:', newItems[0])
  }
}, { immediate: true, deep: true })
</script>

<style>
@import '@/assets/styles/fp-dark.css';
</style>

<style scoped>
.search-input {
  min-width: 320px;
}
.table-compact :deep(.p-datatable-thead > tr > th),
.table-compact :deep(.p-datatable-tbody > tr > td) {
  padding: 0.25rem 0.5rem;
  font-size: 0.85rem;
}
.table-compact :deep(.p-inputtext),
.table-compact :deep(.p-inputswitch),
.table-compact :deep(.p-multiselect),
.table-compact :deep(textarea) {
  font-size: 0.85rem;
}
.table-compact :deep(.p-inputtext),
.table-compact :deep(textarea) {
  padding: 0.25rem 0.5rem;
}
.table-compact :deep(.p-multiselect .p-multiselect-label) {
  padding: 0.25rem 0.5rem;
}
.table-compact :deep(.p-tag) {
  padding: 0.1rem 0.4rem;
}
.surface-card {
  border: 1px solid var(--surface-border);
}
@media (max-width: 768px) {
  .search-input { min-width: 180px; width: 100%; }
  .places-table-shell { padding:.75rem !important; }
  .places-table-shell :deep(.p-datatable-wrapper) { max-width:calc(100vw - 2.5rem); }
  .places-table-shell :deep(.p-paginator) { justify-content:flex-start; overflow-x:auto; flex-wrap:nowrap; }
}

/* Styles pour le panel de sélection de colonnes */
.field-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.field-checkbox label {
  cursor: pointer;
  user-select: none;
}

/* Mise en évidence des places sans institution */
.no-institution :deep(.p-dropdown) {
  border: 2px solid #f59e0b !important;
  background: rgba(245, 158, 11, 0.1) !important;
}

.no-institution :deep(.p-dropdown .p-placeholder) {
  color: #f59e0b !important;
  font-weight: 600;
}

/* Affichage des institutions assignées */
.institution-assigned {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.3);
  border-radius: 6px;
  color: #059669;
}

/* Styles pour les noms des praticiens */
.praticiens-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.praticiens-names {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.praticien-name {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
  line-height: 1.2;
}

.fp-dark .praticien-name {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.15);
  color: #f3f4f6;
}
</style>

<style>
/* Global styles for MultiSelect overlay panel (renders as portal) */
.p-multiselect-panel .p-multiselect-items .p-multiselect-item {
  color: var(--text-color) !important;
}
.p-multiselect-panel .p-multiselect-items .p-multiselect-item span {
  color: var(--text-color) !important;
}
</style>
