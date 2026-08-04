<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="annual-planning-admin">
      <!-- Header -->
      <Card>
        <template #content>
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 class="text-3xl font-bold text-primary m-0">📅 Planification Annuelle par Volée</h1>
              <p class="text-600 mt-2">Vue d'ensemble complète de l'année académique</p>
            </div>
            
            <div class="flex gap-2">
              <Button 
                label="Retour au Planning"
                icon="pi pi-arrow-left"
                @click="$router.push('/admin/planning')"
                outlined
              />
              <Button 
                label="Vue Hebdomadaire"
                icon="pi pi-calendar"
                @click="$router.push('/admin/planning/weekly')"
                severity="info"
              />
            </div>
          </div>
        </template>
      </Card>

      <!-- Sélection -->
      <Card>
        <template #content>
          <div class="flex gap-3 align-items-end flex-wrap">
            <div class="flex-1">
              <label class="block mb-2 font-bold">Année académique :</label>
              <Dropdown 
                v-model="selectedYear"
                :options="yearOptions"
                optionLabel="label"
                optionValue="value"
                @change="loadAnnualPlanning"
                class="w-full"
              />
            </div>
            
            <Button 
              label="Exporter Année Complète"
              icon="pi pi-file-excel"
              @click="exportAnnualToExcel"
              severity="success"
            />
            
            <Button 
              label="Exporter Semestre 1"
              icon="pi pi-file-excel"
              @click="exportSemesterToExcel(1)"
              severity="info"
            />
            
            <Button 
              label="Exporter Semestre 2"
              icon="pi pi-file-excel"
              @click="exportSemesterToExcel(2)"
              severity="warning"
            />
          </div>
        </template>
      </Card>

      <PlanningLegend />

      <!-- Statistiques Annuelles -->
      <div v-if="annualStats" class="grid">
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-calendar text-4xl text-primary mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.totalWeeks }}</div>
                <div class="text-600">Semaines</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-clock text-4xl text-blue-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.totalSlots }}</div>
                <div class="text-600">Créneaux</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-book text-4xl text-green-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.totalModules }}</div>
                <div class="text-600">Modules</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-users text-4xl text-orange-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.totalTeachers }}</div>
                <div class="text-600">Enseignants</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-chart-bar text-4xl text-pink-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.avgSlotsPerWeek }}</div>
                <div class="text-600">Créneaux/sem</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-2">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-chart-line text-4xl text-cyan-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ annualStats.totalHours }}</div>
                <div class="text-600">Heures totales</div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Onglets Semestres -->
      <Card>
        <template #content>
          <TabView>
            <!-- Semestre 1 -->
            <TabPanel header="Semestre de Printemps (S1-S16)">
              <DataTable 
                :value="semester1Weeks"
                :rows="20"
                stripedRows
                class="p-datatable-sm"
              >
                <Column field="weekNumber" header="Semaine" style="width: 8rem">
                  <template #body="slotProps">
                    <Tag :value="`S${slotProps.data.weekNumber}`" severity="success" class="font-bold" />
                  </template>
                </Column>
                
                <Column field="label" header="Période" style="min-width: 15rem" />
                
                <Column field="slotsCount" header="Créneaux" style="width: 8rem">
                  <template #body="slotProps">
                    <Badge :value="slotProps.data.slotsCount || 0" severity="info" />
                  </template>
                </Column>
                
                <Column field="modules" header="Modules" style="min-width: 25rem">
                  <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                      <Chip 
                        v-for="module in slotProps.data.modules" 
                        :key="module.code"
                        :label="`${module.number} - ${module.title}`"
                        :style="{ backgroundColor: module.color, color: '#fff' }"
                        class="text-xs"
                      />
                    </div>
                  </template>
                </Column>
                
                <Column header="Actions" style="width: 10rem">
                  <template #body="slotProps">
                    <div class="flex gap-2">
                      <Button 
                        icon="pi pi-pencil"
                        @click="editWeek(slotProps.data.weekNumber)"
                        text
                        rounded
                        severity="info"
                        v-tooltip="'Éditer'"
                      />
                      <Button 
                        icon="pi pi-eye"
                        @click="viewWeek(slotProps.data.weekNumber)"
                        text
                        rounded
                        v-tooltip="'Voir'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>

            <!-- Semestre 2 -->
            <TabPanel header="Semestre d'Automne (S17-S32)">
              <DataTable 
                :value="semester2Weeks"
                :rows="20"
                stripedRows
                class="p-datatable-sm"
              >
                <Column field="weekNumber" header="Semaine" style="width: 8rem">
                  <template #body="slotProps">
                    <Tag :value="`S${slotProps.data.weekNumber}`" severity="warning" class="font-bold" />
                  </template>
                </Column>
                
                <Column field="label" header="Période" style="min-width: 15rem" />
                
                <Column field="slotsCount" header="Créneaux" style="width: 8rem">
                  <template #body="slotProps">
                    <Badge :value="slotProps.data.slotsCount || 0" severity="info" />
                  </template>
                </Column>
                
                <Column field="modules" header="Modules" style="min-width: 25rem">
                  <template #body="slotProps">
                    <div class="flex flex-wrap gap-1">
                      <Chip 
                        v-for="module in slotProps.data.modules" 
                        :key="module.code"
                        :label="`${module.number} - ${module.title}`"
                        :style="{ backgroundColor: module.color, color: '#fff' }"
                        class="text-xs"
                      />
                    </div>
                  </template>
                </Column>
                
                <Column header="Actions" style="width: 10rem">
                  <template #body="slotProps">
                    <div class="flex gap-2">
                      <Button 
                        icon="pi pi-pencil"
                        @click="editWeek(slotProps.data.weekNumber)"
                        text
                        rounded
                        severity="info"
                        v-tooltip="'Éditer'"
                      />
                      <Button 
                        icon="pi pi-eye"
                        @click="viewWeek(slotProps.data.weekNumber)"
                        text
                        rounded
                        v-tooltip="'Voir'"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </TabPanel>
          </TabView>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '@/components/common/utils/Navbar.vue'
import planningService from '@/service/planningService'
import academicPlanningService from '@/service/academicPlanningService'
import PlanningLegend from '@/components/common/planning/PlanningLegend.vue'

const router = useRouter()

const selectedYear = ref('2025-2026')
const semester1Weeks = ref([])
const semester2Weeks = ref([])
const allSlots = ref([])

const yearOptions = [
  { label: '2024-2025', value: '2024-2025' },
  { label: '2025-2026', value: '2025-2026' },
  { label: '2026-2027', value: '2026-2027' }
]

const annualStats = computed(() => {
  if (semester1Weeks.value.length === 0 && semester2Weeks.value.length === 0) return null
  
  const allWeeks = [...semester1Weeks.value, ...semester2Weeks.value]
  const totalSlots = allWeeks.reduce((sum, week) => sum + (week.slotsCount || 0), 0)
  
  const modulesSet = new Set()
  const teachersSet = new Set()
  let totalHours = 0
  
  allSlots.value.forEach(slot => {
    if (slot.moduleCode) modulesSet.add(slot.moduleCode)
    if (slot.teachers) {
      slot.teachers.forEach(teacher => teachersSet.add(teacher))
    }
    // Calculer heures (estimation)
    if (slot.startTime && slot.endTime) {
      const start = parseTime(slot.startTime)
      const end = parseTime(slot.endTime)
      if (start && end) {
        totalHours += (end - start) / 60
      }
    }
  })
  
  return {
    totalWeeks: allWeeks.length,
    totalSlots,
    totalModules: modulesSet.size,
    totalTeachers: teachersSet.size,
    avgSlotsPerWeek: allWeeks.length > 0 ? Math.round(totalSlots / allWeeks.length) : 0,
    totalHours: Math.round(totalHours)
  }
})

const parseTime = (timeStr) => {
  if (!timeStr) return null
  const match = timeStr.match(/(\d+)h(\d+)/)
  if (!match) return null
  return parseInt(match[1]) * 60 + parseInt(match[2])
}

const loadAnnualPlanning = async () => {
  try {
    const courseCodes = await academicPlanningService.getAllCourseCodes()
    allSlots.value = []
    
    // Charger semestre 1 (semaines 1-16)
    semester1Weeks.value = await loadSemesterWeeks(1, 16, courseCodes)
    
    // Charger semestre 2 (semaines 17-32)
    semester2Weeks.value = await loadSemesterWeeks(17, 32, courseCodes)
  } catch (error) {
    console.error('Erreur lors du chargement annuel:', error)
  }
}

const loadSemesterWeeks = async (startWeek, endWeek, courseCodes) => {
  const weeks = []
  
  for (let weekNum = startWeek; weekNum <= endWeek; weekNum++) {
    const slots = await planningService.getWeekTimeSlots(selectedYear.value, weekNum)
    allSlots.value.push(...slots)
    
    // Extraire les modules uniques
    const weekModules = {}
    slots.forEach(slot => {
      if (slot.moduleCode && !weekModules[slot.moduleCode]) {
        const courseData = courseCodes[slot.moduleCode]
        weekModules[slot.moduleCode] = {
          code: slot.moduleCode,
          number: slot.moduleNumber || courseData?.moduleNumber || slot.moduleCode.toUpperCase(),
          title: slot.moduleTitle || courseData?.label || '',
          color: courseData?.color || '#CCCCCC'
        }
      }
    })
    
    weeks.push({
      weekNumber: weekNum,
      label: `Semaine ${weekNum}`,
      slotsCount: slots.length,
      modules: Object.values(weekModules)
    })
  }
  
  return weeks
}

const exportAnnualToExcel = async () => {
  await exportMultipleWeeks(1, 32, 'planning-annuel')
}

const exportSemesterToExcel = async (semester) => {
  if (semester === 1) {
    await exportMultipleWeeks(1, 16, 'planning-semestre-1')
  } else {
    await exportMultipleWeeks(17, 32, 'planning-semestre-2')
  }
}

const exportMultipleWeeks = async (startWeek, endWeek, filename) => {
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    const courseCodes = await academicPlanningService.getAllCourseCodes()
    
    for (let weekNum = startWeek; weekNum <= endWeek; weekNum++) {
      const slots = await planningService.getWeekTimeSlots(selectedYear.value, weekNum)
      
      if (slots.length === 0) continue
      
      const worksheet = workbook.addWorksheet(`S${weekNum}`)
      
      // En-têtes
      const semesterLabel = weekNum <= 16 ? 'SEMESTRE DE PRINTEMPS' : 'SEMESTRE D\'AUTOMNE'
      
      worksheet.mergeCells('A1:I1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = `BACHELOR 25 (1ère) / ${semesterLabel}`
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFF6600' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      worksheet.getRow(1).height = 30

      worksheet.mergeCells('A3:I3')
      const weekCell = worksheet.getCell('A3')
      weekCell.value = `SEMAINE ${weekNum}`
      weekCell.font = { size: 14, bold: true, color: { argb: 'FF000000' } }
      weekCell.alignment = { horizontal: 'center', vertical: 'middle' }
      weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      worksheet.getRow(3).height = 25

      // Remplir les données
      await fillWeekData(worksheet, slots, courseCodes)
    }
    
    // Générer fichier
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${filename}-${selectedYear.value}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
  }
}

const fillWeekData = async (worksheet, slots, courseCodes) => {
  let currentRow = 5
  
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const groupedByDay = {}
  
  slots.forEach(slot => {
    if (!groupedByDay[slot.day]) {
      groupedByDay[slot.day] = []
    }
    groupedByDay[slot.day].push(slot)
  })
  
  const dayColors = {
    lundi: 'FFFFCCCC',
    mardi: 'FFCCCCFF',
    mercredi: 'FFFFCCCC',
    jeudi: 'FFCCCCFF',
    vendredi: 'FFFFCCCC'
  }
  
  dayOrder.forEach(day => {
    const daySlots = groupedByDay[day]
    if (!daySlots || daySlots.length === 0) return
    
    const dayBgColor = dayColors[day] || 'FFFFCCCC'
    const moduleStartRow = currentRow
    
    // Module principal
    const mainModule = getMainModule(daySlots, courseCodes)
    if (mainModule) {
      worksheet.mergeCells(currentRow, 2, currentRow, 9)
      const moduleCell = worksheet.getCell(currentRow, 2)
      moduleCell.value = `${mainModule.number} - ${mainModule.title}`
      moduleCell.font = { size: 10, bold: true }
      moduleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      moduleCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      worksheet.getRow(currentRow).height = 18
      currentRow++
    }
    
    // Créneaux
    daySlots.forEach(slot => {
      const moduleBgColor = mainModule?.color?.replace('#', 'FF') || 'FFFFFFFF'
      
      // Ligne 1
      const row1 = worksheet.getRow(currentRow)
      
      worksheet.mergeCells(currentRow, 2, currentRow + 1, 2)
      const timeCell = row1.getCell(2)
      timeCell.value = `${slot.startTime} - ${slot.endTime}`
      timeCell.font = { size: 9, bold: true }
      timeCell.alignment = { horizontal: 'center', vertical: 'middle' }
      timeCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      timeCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 3, currentRow, 8)
      const courseCell = row1.getCell(3)
      courseCell.value = slot.courseTitle || slot.activity || ''
      courseCell.font = { size: 9 }
      courseCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      courseCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      courseCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      
      worksheet.mergeCells(currentRow, 9, currentRow + 1, 9)
      const moduleNumCell = row1.getCell(9)
      moduleNumCell.value = slot.moduleNumber || ''
      moduleNumCell.font = { size: 10, bold: true }
      moduleNumCell.alignment = { horizontal: 'center', vertical: 'middle' }
      moduleNumCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
      moduleNumCell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
      
      row1.height = 20
      currentRow++
      
      // Ligne 2
      const row2 = worksheet.getRow(currentRow)
      for (let i = 0; i < 6; i++) {
        const teacherCell = row2.getCell(3 + i)
        teacherCell.value = slot.teachers?.[i] || ''
        teacherCell.font = { size: 9 }
        teacherCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        teacherCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: moduleBgColor } }
        teacherCell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } }
      }
      row2.height = 20
      currentRow++
    })
    
    // Fusionner colonne jour
    if (daySlots.length > 0) {
      const endRow = currentRow - 1
      worksheet.mergeCells(moduleStartRow, 1, endRow, 1)
      const dayCell = worksheet.getCell(moduleStartRow, 1)
      dayCell.value = `${day.charAt(0).toUpperCase() + day.slice(1)}\n\n${daySlots[0].date || ''}`
      dayCell.font = { size: 10, bold: true }
      dayCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      dayCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: dayBgColor } }
      dayCell.border = { top: { style: 'medium' }, left: { style: 'medium' }, bottom: { style: 'medium' }, right: { style: 'medium' } }
    }
  })
  
  // Largeurs
  worksheet.getColumn(1).width = 12
  worksheet.getColumn(2).width = 15
  for (let i = 3; i <= 8; i++) {
    worksheet.getColumn(i).width = 20
  }
  worksheet.getColumn(9).width = 8
}

const getMainModule = (daySlots, courseCodes) => {
  if (daySlots.length === 0) return null
  
  const moduleCounts = {}
  daySlots.forEach(slot => {
    if (slot.moduleCode) {
      moduleCounts[slot.moduleCode] = (moduleCounts[slot.moduleCode] || 0) + 1
    }
  })
  
  const mainModuleCode = Object.keys(moduleCounts).reduce((a, b) => 
    moduleCounts[a] > moduleCounts[b] ? a : b
  )
  
  const firstSlot = daySlots.find(s => s.moduleCode === mainModuleCode)
  const courseData = courseCodes[mainModuleCode]
  
  return {
    code: mainModuleCode,
    number: firstSlot.moduleNumber || courseData?.moduleNumber || mainModuleCode.toUpperCase(),
    title: firstSlot.moduleTitle || courseData?.label || 'Module',
    color: courseData?.color || '#CCCCCC'
  }
}

const editWeek = (weekNumber) => {
  router.push(`/admin/planning/weekly?year=${selectedYear.value}&week=${weekNumber}`)
}

const viewWeek = (weekNumber) => {
  router.push(`/planning?year=${selectedYear.value}&week=${weekNumber}`)
}

onMounted(() => {
  loadAnnualPlanning()
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.annual-planning-admin {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .annual-planning-admin {
    padding: 1rem;
  }
}
</style>
