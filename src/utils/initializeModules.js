// Script d'initialisation pour créer des années et modules de démonstration
import { createYear, createModule } from '@/service/mediaService'

export async function initializeDemoData() {
  try {
    console.log('🚀 Initialisation des données de démonstration...')
    
    // Créer des années
    const year2024 = await createYear({
      name: '2024-2025',
      description: 'Année académique 2024-2025',
      startDate: '2024-09-01',
      endDate: '2025-08-31'
    })
    
    const year2023 = await createYear({
      name: '2023-2024', 
      description: 'Année académique 2023-2024',
      startDate: '2023-09-01',
      endDate: '2024-08-31'
    })
    
    console.log('✅ Années créées:', { year2024, year2023 })
    
    // Créer des modules pour 2024-2025
    const modules2024 = [
      {
        title: 'Introduction aux Soins Infirmiers',
        yearId: year2024.id,
        description: 'Module d\'introduction aux concepts fondamentaux des soins infirmiers',
        order: 1,
        status: 'active'
      },
      {
        title: 'Anatomie et Physiologie',
        yearId: year2024.id,
        description: 'Étude du corps humain et de ses fonctions',
        order: 2,
        status: 'active'
      },
      {
        title: 'Pharmacologie Clinique',
        yearId: year2024.id,
        description: 'Médicaments et leurs effets thérapeutiques',
        order: 3,
        status: 'draft'
      },
      {
        title: 'Soins Critiques',
        yearId: year2024.id,
        description: 'Prise en charge des patients en état critique',
        order: 4,
        status: 'active'
      }
    ]
    
    // Créer des modules pour 2023-2024
    const modules2023 = [
      {
        title: 'Éthique et Déontologie',
        yearId: year2023.id,
        description: 'Principes éthiques dans la pratique infirmière',
        order: 1,
        status: 'archived'
      },
      {
        title: 'Communication Thérapeutique',
        yearId: year2023.id,
        description: 'Techniques de communication avec les patients',
        order: 2,
        status: 'archived'
      }
    ]
    
    // Créer tous les modules
    const createdModules = []
    
    for (const moduleData of [...modules2024, ...modules2023]) {
      const module = await createModule(moduleData)
      createdModules.push(module)
      console.log(`✅ Module créé: ${module.title}`)
    }
    
    console.log('🎉 Initialisation terminée!')
    console.log(`📊 Résumé: ${createdModules.length} modules créés dans 2 années`)
    
    return {
      years: [year2024, year2023],
      modules: createdModules
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation:', error)
    throw error
  }
}

// Fonction pour vérifier si les données existent déjà
export async function checkIfDataExists() {
  try {
    const { listYears, getAllModules } = await import('@/service/mediaService')
    const years = await listYears()
    const modules = await getAllModules()
    
    return {
      hasYears: years.length > 0,
      hasModules: modules.length > 0,
      yearCount: years.length,
      moduleCount: modules.length
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des données:', error)
    return { hasYears: false, hasModules: false, yearCount: 0, moduleCount: 0 }
  }
}
