/**
 * Script d'initialisation des années académiques Supabase
 * 
 * Ce script crée :
 * - Années académiques 2023-2031
 * - Classes pour chaque année (temps plein et temps partiel)
 * 
 * Usage:
 *   node scripts/initSupabaseAcademicYears.js
 * 
 * Note: Les variables VITE_SUPABASE_URL et VITE_SUPABASE_KEY doivent être
 * définies dans votre fichier .env à la racine du projet
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Lire le fichier .env manuellement
const envPath = resolve(process.cwd(), '.env')
let envVars = {}
try {
  const envContent = readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length) {
      const value = valueParts.join('=').trim()
      envVars[key.trim()] = value.replace(/^["']|["']$/g, '')
    }
  })
} catch (error) {
  console.error('⚠️  Impossible de lire le fichier .env')
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_KEY || process.env.VITE_SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables d\'environnement manquantes!')
  console.error('VITE_SUPABASE_URL:', supabaseUrl)
  console.error('VITE_SUPABASE_KEY:', supabaseKey ? '***' : 'undefined')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function initializeAcademicYears() {
  console.log('🎓 Initialisation des années académiques Supabase\n')

  try {
    // 1. Créer les années académiques (2023-2031)
    console.log('📅 Création des années académiques...')
    
    const academicYears = []
    for (let startYear = 2023; startYear <= 2030; startYear++) {
      const endYear = startYear + 1
      academicYears.push({
        name: `${startYear}-${endYear}`,
        start_date: `${startYear}-09-01`,
        end_date: `${endYear}-08-31`,
        is_active: startYear === 2026 // 2026-2027 active par défaut
      })
    }

    // Insérer ou ignorer si existe déjà (upsert)
    const { data: yearData, error: yearError } = await supabase
      .from('academic_years')
      .upsert(academicYears, { 
        onConflict: 'name',
        ignoreDuplicates: true 
      })
      .select()

    if (yearError && !yearError.message.includes('duplicate')) {
      throw yearError
    }

    console.log(`✅ ${academicYears.length} années académiques créées/vérifiées\n`)

    // 2. Récupérer toutes les années pour créer les classes
    const { data: allYears } = await supabase
      .from('academic_years')
      .select('*')
      .order('start_date', { ascending: false })

    console.log('👥 Création des classes...\n')

    let totalClasses = 0

    for (const year of allYears) {
      const startYearNum = parseInt(year.name.split('-')[0])
      
      // Déterminer l'année de la 1ère année pour cette année académique
      // Ex: Pour 2026-2027, la 1ère année sera B26, 2ème B25, 3ème B24
      const firstYearPromo = startYearNum + 1
      
      console.log(`  📚 ${year.name} (1ère année: B${firstYearPromo.toString().slice(-2)})`)

      // Classes temps plein
      const fullTimeClasses = []
      for (let level = 1; level <= 3; level++) {
        const classYear = firstYearPromo - (level - 1)
        const code = `B${classYear.toString().slice(-2)}`
        fullTimeClasses.push({
          code,
          name: `Bachelor ${classYear} - ${level}${level === 1 ? 'ère' : 'ème'} année (Temps plein)`,
          year_level: level,
          academic_year_id: year.id,
          modality: 'temps_plein'
        })
      }

      // Classes temps partiel
      const partTimeClasses = []
      for (let level = 1; level <= 4; level++) {
        const classYear = firstYearPromo - (level - 1)
        const code = `B${classYear.toString().slice(-2)}-PT`
        partTimeClasses.push({
          code,
          name: `Bachelor ${classYear} - ${level}${level === 1 ? 'ère' : 'ème'} année (Temps partiel)`,
          year_level: level,
          academic_year_id: year.id,
          modality: 'temps_partiel'
        })
      }

      const allClasses = [...fullTimeClasses, ...partTimeClasses]

      // Insérer les classes (ignorer les doublons)
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .upsert(allClasses, { 
          onConflict: 'code,academic_year_id',
          ignoreDuplicates: true 
        })
        .select()

      if (classError && !classError.message.includes('duplicate')) {
        console.error(`    ❌ Erreur: ${classError.message}`)
      } else {
        const created = classData?.length || 0
        console.log(`    ✅ ${created} classes créées`)
        totalClasses += created
      }
    }

    console.log(`\n✨ Initialisation terminée !`)
    console.log(`   📅 ${allYears.length} années académiques`)
    console.log(`   👥 ${totalClasses} classes créées\n`)

    // Afficher l'année active
    const activeYear = allYears.find(y => y.is_active)
    if (activeYear) {
      console.log(`🎯 Année active: ${activeYear.name}`)
      
      const { data: activeClasses } = await supabase
        .from('classes')
        .select('*')
        .eq('academic_year_id', activeYear.id)
        .order('modality', { ascending: true })
        .order('year_level', { ascending: true })

      console.log(`\n📝 Classes de l'année active:`)
      activeClasses.forEach(c => {
        const bac = 'bac' + c.code.substring(1).toLowerCase()
        console.log(`   - ${c.code.padEnd(10)} → ${bac.padEnd(12)} (${c.name})`)
      })
    }

    console.log('\n✅ Vous pouvez maintenant utiliser le planning!')
    console.log('   👉 Aller sur /admin/planning/weekly')
    console.log('   👉 Sélectionner une classe (ex: bac26)')

  } catch (error) {
    console.error('\n❌ Erreur:', error)
    process.exit(1)
  }
}

// Exécuter
initializeAcademicYears()
