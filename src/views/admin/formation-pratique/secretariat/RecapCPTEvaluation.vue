<template>
  <AdminLayout>
    <Toast />
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-star text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Récapitulatif CPT Évaluation Reçue</h1>
              <p class="text-600 m-0 mt-2">Étudiant, année + 4 PFP CPT + 4 PFP Eval + répondant - Données modifiables</p>
            </div>
          </div>
          <div class="flex align-items-center gap-3">

            <div class="flex flex-column gap-1">
              <label class="font-semibold text-sm">Classe :</label>
              <Dropdown 
                v-model="filterClasse" 
                :options="classeOptions" 
                placeholder="Toutes les classes" 
                class="w-full md:w-8rem"
                showClear
              />
            </div>
          </div>
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable 
          :value="filteredEvaluations" 
          :loading="loading" 
          responsiveLayout="scroll" 
          :paginator="true" 
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50]"
          showGridlines
          stripedRows
        >
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Étudiants ({{ filteredEvaluations.length }})</span>
              <span class="p-input-icon-left">
                <i class="pi pi-search" />
                <InputText v-model="searchText" placeholder="Rechercher un étudiant..." class="w-20rem" />
              </span>
            </div>
          </template>
          <template #empty>Aucun étudiant trouvé.</template>
          <template #loading>Chargement des étudiants...</template>
          
          <Column field="etudiant" header="Étudiant" :frozen="true" style="min-width: 12rem; max-width: 14rem" sortable>
            <template #body="{ data }">
              <div class="font-semibold text-sm">{{ data.etudiant }}</div>
            </template>
          </Column>
          
          <Column field="classe" header="Classe" style="min-width: 5rem; max-width: 6rem" sortable></Column>
          
          <Column field="annee" header="Année" style="min-width: 5rem; max-width: 6rem" sortable></Column>
          
          <!-- 4 PFP CPT Columns -->
          <Column header="PFP1 CPT" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp1_cpt" 
                :comment="data.pfp1_cpt_comment"
                @update:value="updateField(data, 'pfp1_cpt', $event)"
                @update:comment="updateField(data, 'pfp1_cpt_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP2 CPT" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp2_cpt" 
                :comment="data.pfp2_cpt_comment"
                @update:value="updateField(data, 'pfp2_cpt', $event)"
                @update:comment="updateField(data, 'pfp2_cpt_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP3 CPT" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp3_cpt" 
                :comment="data.pfp3_cpt_comment"
                @update:value="updateField(data, 'pfp3_cpt', $event)"
                @update:comment="updateField(data, 'pfp3_cpt_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP4 CPT" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp4_cpt" 
                :comment="data.pfp4_cpt_comment"
                @update:value="updateField(data, 'pfp4_cpt', $event)"
                @update:comment="updateField(data, 'pfp4_cpt_comment', $event)"
              />
            </template>
          </Column>
          
          <!-- 4 PFP Eval Columns -->
          <Column header="PFP1 Eval" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp1_eval" 
                :comment="data.pfp1_eval_comment"
                @update:value="updateField(data, 'pfp1_eval', $event)"
                @update:comment="updateField(data, 'pfp1_eval_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP2 Eval" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp2_eval" 
                :comment="data.pfp2_eval_comment"
                @update:value="updateField(data, 'pfp2_eval', $event)"
                @update:comment="updateField(data, 'pfp2_eval_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP3 Eval" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp3_eval" 
                :comment="data.pfp3_eval_comment"
                @update:value="updateField(data, 'pfp3_eval', $event)"
                @update:comment="updateField(data, 'pfp3_eval_comment', $event)"
              />
            </template>
          </Column>
          
          <Column header="PFP4 Eval" style="min-width: 7rem; max-width: 8rem">
            <template #body="{ data }">
              <TriStateCell 
                :value="data.pfp4_eval" 
                :comment="data.pfp4_eval_comment"
                @update:value="updateField(data, 'pfp4_eval', $event)"
                @update:comment="updateField(data, 'pfp4_eval_comment', $event)"
              />
            </template>
          </Column>
          
          <Column field="repondant" header="Répondant" style="min-width: 10rem; max-width: 12rem">
            <template #body="{ data }">
              <span v-if="data.repondant" class="text-primary text-sm">{{ data.repondant }}</span>
              <span v-else class="text-gray-400 italic text-sm">Non assigné</span>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script>
import { defineComponent } from 'vue'
import studentsService from '@/service/studentsService'
import { supabase } from '@/supabase'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import TriStateCell from '@/components/admin/TriStateCell.vue'

export default defineComponent({
  name: 'RecapCPTEvaluation',
  components: {
    AdminLayout,
    DataTable,
    Column,
    Dropdown,
    InputText,
    Toast,
    TriStateCell
  },
  setup() {
    const toast = useToast()
    return { toast }
  },
  data() {
    return {
      loading: false,
      students: [],
      evaluations: [],
      filterYear: null,
      filterClasse: null,
      searchText: '',
      years: ['2024', '2025', '2026'],
      classeOptions: [ 'BA23', 'BA24', 'BA25'],
      savingDebounce: null
    }
  },
  computed: {
    filteredEvaluations() {
      let list = this.evaluations
      
      if (this.filterYear) {
        list = list.filter(e => e.annee === this.filterYear)
      }
      
      if (this.filterClasse) {
        list = list.filter(e => e.classe === this.filterClasse)
      }
      
      if (this.searchText) {
        const search = this.searchText.toLowerCase()
        list = list.filter(e => 
          e.etudiant.toLowerCase().includes(search) ||
          (e.classe || '').toLowerCase().includes(search)
        )
      }
      
      return list
    }
  },
  async mounted() {
    await this.fetchData()
  },
  methods: {
    async fetchData() {
      this.loading = true
      try {
        await Promise.all([
          this.fetchStudents(),
          this.fetchEvaluationsData()
        ])
        this.mergeData()
      } catch (e) {
        console.error('Erreur fetchData:', e)
        this.toast.add({
          severity: 'error',
          summary: 'Erreur',
          detail: 'Impossible de charger les données',
          life: 5000
        })
      } finally {
        this.loading = false
      }
    },
    
    async fetchStudents() {
      try {
        this.students = await studentsService.getAllStudents()
        
        const { data: physioData } = await supabase
          .from('StudentsPhysio')
          .select('user_id, repondant_hes')
        
        const physioMap = new Map((physioData || []).map(p => [p.user_id, p]))
        
        this.students.forEach(s => {
          const physio = physioMap.get(s.id)
          s.repondant_hes = physio?.repondant_hes || null
        })
        
        console.log(`✅ ${this.students.length} étudiants chargés`)
      } catch (e) {
        console.error('Erreur fetchStudents:', e)
        throw e
      }
    },
    
    async fetchEvaluationsData() {
      try {
        const { data, error } = await supabase
          .from('recap_cpt_evaluation')
          .select('*')
        
        if (error) throw error
        
        this.evaluations = data || []
        console.log(`✅ ${this.evaluations.length} évaluations chargées`)
      } catch (e) {
        console.error('Erreur fetchEvaluationsData:', e)
        this.evaluations = []
      }
    },
    
    mergeData() {
      const currentYear = new Date().getFullYear().toString()
      const evalMap = new Map()
      
      this.evaluations.forEach(ev => {
        const key = `${ev.user_id}_${ev.annee}`
        evalMap.set(key, ev)
      })
      
      this.evaluations = this.students.map(student => {
        const key = `${student.id}_${currentYear}`
        const existing = evalMap.get(key)
        
        if (existing) {
          return {
            ...existing,
            etudiant: `${(student.Nom || '').toUpperCase()} ${student.Prenom || ''}`.trim(),
            classe: student.Classe || '-',
            repondant: student.repondant_hes || null
          }
        }
        
        return {
          id: null,
          user_id: student.id,
          etudiant: `${(student.Nom || '').toUpperCase()} ${student.Prenom || ''}`.trim(),
          classe: student.Classe || '-',
          annee: currentYear,
          pfp1_cpt: null,
          pfp1_cpt_comment: '',
          pfp2_cpt: null,
          pfp2_cpt_comment: '',
          pfp3_cpt: null,
          pfp3_cpt_comment: '',
          pfp4_cpt: null,
          pfp4_cpt_comment: '',
          pfp1_eval: null,
          pfp1_eval_comment: '',
          pfp2_eval: null,
          pfp2_eval_comment: '',
          pfp3_eval: null,
          pfp3_eval_comment: '',
          pfp4_eval: null,
          pfp4_eval_comment: '',
          repondant: student.repondant_hes || null
        }
      })
      
      console.log(`✅ ${this.evaluations.length} lignes fusionnées`)
    },
    
    async updateField(rowData, field, value) {
      rowData[field] = value
      
      if (this.savingDebounce) {
        clearTimeout(this.savingDebounce)
      }
      
      this.savingDebounce = setTimeout(async () => {
        await this.saveRow(rowData)
      }, 800)
    },
    
    async saveRow(rowData) {
      try {
        console.log('📝 Tentative de sauvegarde pour:', rowData.etudiant, 'user_id:', rowData.user_id)
        
        // Test simple payload first
        const simplePayload = {
          user_id: rowData.user_id,
          annee: rowData.annee,
          pfp1_cpt: rowData.pfp1_cpt
        }
        
        console.log('🔍 Payload simple:', JSON.stringify(simplePayload, null, 2))
        
        // Try simple insert first
        const { data: simpleData, error: simpleError } = await supabase
          .from('recap_cpt_evaluation')
          .upsert(simplePayload, { onConflict: 'user_id,annee' })
          .select()
        
        console.log('📊 Réponse simple:', { simpleData, simpleError })
        
        if (simpleError) {
          console.error('❌ Erreur simple:', JSON.stringify(simpleError, null, 2))
          console.error('❌ Erreur simple keys:', Object.keys(simpleError))
          throw simpleError
        }
        
        if (simpleData) {
          console.log('✅ Sauvegarde simple réussie!')
          if (!rowData.id && simpleData[0]) {
            rowData.id = simpleData[0].id
          }
        }
        
        // If simple works, try full payload
        const fullPayload = {
          user_id: rowData.user_id,
          annee: rowData.annee,
          pfp1_cpt: rowData.pfp1_cpt,
          pfp1_cpt_comment: rowData.pfp1_cpt_comment || '',
          pfp2_cpt: rowData.pfp2_cpt,
          pfp2_cpt_comment: rowData.pfp2_cpt_comment || '',
          pfp3_cpt: rowData.pfp3_cpt,
          pfp3_cpt_comment: rowData.pfp3_cpt_comment || '',
          pfp4_cpt: rowData.pfp4_cpt,
          pfp4_cpt_comment: rowData.pfp4_cpt_comment || '',
          pfp1_eval: rowData.pfp1_eval,
          pfp1_eval_comment: rowData.pfp1_eval_comment || '',
          pfp2_eval: rowData.pfp2_eval,
          pfp2_eval_comment: rowData.pfp2_eval_comment || '',
          pfp3_eval: rowData.pfp3_eval,
          pfp3_eval_comment: rowData.pfp3_eval_comment || '',
          pfp4_eval: rowData.pfp4_eval,
          pfp4_eval_comment: rowData.pfp4_eval_comment || ''
        }
        
        console.log('🔍 Payload complet:', JSON.stringify(fullPayload, null, 2))
        
        const { data, error } = await supabase
          .from('recap_cpt_evaluation')
          .upsert(fullPayload, { onConflict: 'user_id,annee' })
          .select()
        
        console.log('📊 Réponse complète:', { data, error })
        
        if (error) {
          console.error('❌ Erreur complète:', JSON.stringify(error, null, 2))
          throw error
        }
        
        console.log('✅ Sauvegarde complète réussie pour', rowData.etudiant)
      } catch (e) {
        console.error('❌ Erreur saveRow complète:', {
          message: e.message,
          details: e.details,
          hint: e.hint,
          code: e.code,
          stack: e.stack,
          fullError: e,
          errorString: JSON.stringify(e, null, 2)
        })
        
        let errorDetail = `Impossible de sauvegarder les données pour ${rowData.etudiant}`
        if (e.message) {
          errorDetail += ` - ${e.message}`
        }
        
        this.toast.add({
          severity: 'error',
          summary: 'Erreur de sauvegarde',
          detail: errorDetail,
          life: 8000
        })
      }
    }
  }
})
</script>

<style scoped>
.text-gray-400 {
  color: #9ca3af;
}
</style>
