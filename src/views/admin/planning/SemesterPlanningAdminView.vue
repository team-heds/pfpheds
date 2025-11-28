<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="semester-planning-admin">
      <!-- Header -->
      <Card>
        <template #content>
          <div class="flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h1 class="text-3xl font-bold text-primary m-0">📆 Planification Semestrielle</h1>
              <p class="text-600 mt-2">Vue d'ensemble et export par semestre</p>
            </div>
            
            <div class="flex gap-2">
              <Button 
                label="Retour au Planning"
                icon="pi pi-arrow-left"
                @click="$router.push('/admin/planning')"
                outlined
              />
              <Button 
                label="Vue Annuelle"
                icon="pi pi-calendar"
                @click="$router.push('/admin/planning/annual')"
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
                @change="loadSemesterPlanning"
                class="w-full"
              />
            </div>
            
            <div class="flex-1">
              <label class="block mb-2 font-bold">Semestre :</label>
              <Dropdown 
                v-model="selectedSemester"
                :options="semesterOptions"
                optionLabel="label"
                optionValue="value"
                @change="loadSemesterPlanning"
                class="w-full"
              />
            </div>
            
            <Button 
              label="Exporter Excel Semestre"
              icon="pi pi-file-excel"
              @click="exportSemesterToExcel"
              severity="success"
            />
          </div>
        </template>
      </Card>

      <!-- Statistiques -->
      <div v-if="semesterStats" class="grid">
        <div class="col-12 md:col-3">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-calendar text-4xl text-primary mb-3"></i>
                <div class="text-2xl font-bold">{{ semesterStats.totalWeeks }}</div>
                <div class="text-600">Semaines</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-3">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-clock text-4xl text-blue-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ semesterStats.totalSlots }}</div>
                <div class="text-600">Créneaux</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-3">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-book text-4xl text-green-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ semesterStats.totalModules }}</div>
                <div class="text-600">Modules</div>
              </div>
            </template>
          </Card>
        </div>
        <div class="col-12 md:col-3">
          <Card>
            <template #content>
              <div class="text-center">
                <i class="pi pi-users text-4xl text-orange-500 mb-3"></i>
                <div class="text-2xl font-bold">{{ semesterStats.totalTeachers }}</div>
                <div class="text-600">Enseignants</div>
              </div>
            </template>
          </Card>
        </div>
      </div>

      <!-- Liste des semaines -->
      <Card>
        <template #content>
          <div class="mb-3">
            <h2 class="text-xl font-bold">Semaines du semestre</h2>
          </div>
          
          <DataTable 
            :value="semesterWeeks"
            :rows="20"
            stripedRows
            class="p-datatable-sm"
          >
            <Column field="weekNumber" header="Semaine" style="width: 8rem">
              <template #body="slotProps">
                <Tag :value="`S${slotProps.data.weekNumber}`" severity="info" class="font-bold" />
              </template>
            </Column>
            
            <Column field="label" header="Période" style="min-width: 15rem">
              <template #body="slotProps">
                <div class="font-semibold">{{ slotProps.data.label }}</div>
              </template>
            </Column>
            
            <Column field="slotsCount" header="Créneaux" style="width: 8rem">
              <template #body="slotProps">
                <Badge :value="slotProps.data.slotsCount || 0" severity="info" />
              </template>
            </Column>
            
            <Column field="modules" header="Modules" style="min-width: 20rem">
              <template #body="slotProps">
                <div class="flex flex-wrap gap-1">
                  <Chip 
                    v-for="module in slotProps.data.modules" 
                    :key="module.code"
                    :label="module.number || module.code"
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
                    v-tooltip="'Éditer la semaine'"
                  />
                  <Button 
                    icon="pi pi-eye"
                    @click="viewWeek(slotProps.data.weekNumber)"
                    text
                    rounded
                    v-tooltip="'Voir les détails'"
                  />
                </div>
              </template>
            </Column>
          </DataTable>
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

const router = useRouter()

const selectedYear = ref('2025-2026')
const selectedSemester = ref(1)
const semesterWeeks = ref([])
const allSlots = ref([])

const yearOptions = [
  { label: '2024-2025', value: '2024-2025' },
  { label: '2025-2026', value: '2025-2026' },
  { label: '2026-2027', value: '2026-2027' }
]

const semesterOptions = [
  { label: 'Semestre de printemps (S1-S16)', value: 1 },
  { label: 'Semestre d\'automne (S17-S32)', value: 2 }
]

const semesterStats = computed(() => {
  if (semesterWeeks.value.length === 0) return null
  
  const totalSlots = semesterWeeks.value.reduce((sum, week) => sum + (week.slotsCount || 0), 0)
  const modulesSet = new Set()
  const teachersSet = new Set()
  
  allSlots.value.forEach(slot => {
    if (slot.moduleCode) modulesSet.add(slot.moduleCode)
    if (slot.teachers) {
      slot.teachers.forEach(teacher => teachersSet.add(teacher))
    }
  })
  
  return {
    totalWeeks: semesterWeeks.value.length,
    totalSlots,
    totalModules: modulesSet.size,
    totalTeachers: teachersSet.size
  }
})

const getSemesterWeeks = (semester) => {
  if (semester === 1) {
    return Array.from({ length: 16 }, (_, i) => i + 1)
  } else {
    return Array.from({ length: 16 }, (_, i) => i + 17)
  }
}

const getSemesterLabel = (semester) => {
  return semester === 1 ? 'SEMESTRE DE PRINTEMPS' : 'SEMESTRE D\'AUTOMNE'
}

const loadSemesterPlanning = async () => {
  try {
    const weeks = getSemesterWeeks(selectedSemester.value)
    const courseCodes = await academicPlanningService.getAllCourseCodes()
    allSlots.value = []
    
    semesterWeeks.value = await Promise.all(weeks.map(async (weekNum) => {
      const slots = await planningService.getWeekTimeSlots(selectedYear.value, weekNum)
      allSlots.value.push(...slots)
      
      // Extraire les modules uniques de la semaine
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
      
      return {
        weekNumber: weekNum,
        label: `Semaine ${weekNum}`,
        slotsCount: slots.length,
        modules: Object.values(weekModules)
      }
    }))
  } catch (error) {
    console.error('Erreur lors du chargement du semestre:', error)
  }
}

const exportSemesterToExcel = async () => {
  try {
    const ExcelJS = await import('exceljs')
    const workbook = new ExcelJS.Workbook()
    
    const weeks = getSemesterWeeks(selectedSemester.value)
    
    for (const weekNum of weeks) {
      const worksheet = workbook.addWorksheet(`Semaine ${weekNum}`)
      const slots = await planningService.getWeekTimeSlots(selectedYear.value, weekNum)
      
      if (slots.length === 0) continue
      
      // Titre
      worksheet.mergeCells('A1:I1')
      const titleCell = worksheet.getCell('A1')
      titleCell.value = `BACHELOR 25 (1ère) / ${getSemesterLabel(selectedSemester.value)}`
      titleCell.font = { size: 16, bold: true, color: { argb: 'FFFF6600' } }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
      worksheet.getRow(1).height = 30

      // Semaine
      worksheet.mergeCells('A3:I3')
      const weekCell = worksheet.getCell('A3')
      weekCell.value = `SEMAINE ${weekNum}`
      weekCell.font = { size: 14, bold: true, color: { argb: 'FF000000' } }
      weekCell.alignment = { horizontal: 'center', vertical: 'middle' }
      weekCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }
      worksheet.getRow(3).height = 25

      // Grouper et remplir les données
      await fillWeekData(worksheet, slots, weekNum)
    }
    
    // Générer le fichier
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `planning-semestre-${selectedSemester.value}-${selectedYear.value}.xlsx`
    link.click()
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
  }
}

const fillWeekData = async (worksheet, slots, weekNum) => {
  const courseCodes = await academicPlanningService.getAllCourseCodes()
  let currentRow = 5
  
  const dayOrder = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi']
  const groupedByDay = {}
  
  slots.forEach(slot => {
    if (!groupedByDay[slot.day]) {
      groupedByDay[slot.day] = []
    }
    groupedByDay[slot.day].push(slot)
  })
  
  // Couleurs des jours
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
      
      // Ligne 1: Horaire + Nom du cours + Numéro
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
      
      // Ligne 2: Enseignants
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
    
    // Fusionner colonne jour/date
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
  loadSemesterPlanning()
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

.semester-planning-admin {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .semester-planning-admin {
    padding: 1rem;
  }
}
</style>
