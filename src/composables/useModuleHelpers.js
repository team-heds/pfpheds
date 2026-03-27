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
  'BAC25-PA': 'D97706', // Ambre (Passerelle 2ème)
  'BAC24-PA': 'BE185D', // Rose (Passerelle 3ème)
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
  'BAC25-PA': 'FDE68A', // Jaune (Passerelle 2ème)
  'BAC24-PA': 'FBCFE8', // Rose clair (Passerelle 3ème)
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

export function useModuleHelpers() {
  // Normaliser le code classe (B25-tp = B25-TP) - utilisé partout
  const normalizeClass = (code) => {
    if (!code) return ''
    return code.toUpperCase().trim()
  }

  // Calculer les heures depuis un créneau
  const getSlotHours = (slot) => {
    if (!slot.start_time || !slot.end_time) return 0
    const [startH, startM] = slot.start_time.split(':').map(Number)
    const [endH, endM] = slot.end_time.split(':').map(Number)
    return (endH + endM / 60) - (startH + startM / 60)
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

  const getWeekColor = (weekIndex) => {
    return weekColors[weekIndex % weekColors.length]?.bg || '#3B82F6'
  }

  const getWeekBorderColor = (weekIndex) => {
    return weekColors[weekIndex % weekColors.length]?.border || '#1D4ED8'
  }

  const getDayColor = (dayIndex) => {
    return dayColors[dayIndex] || '#3B82F6'
  }

  const getDayBackgroundColor = (dayIndex) => {
    return dayBackgroundColors[dayIndex] || '#EFF6FF'
  }

  // Sévérité des heures
  const getHoursSeverity = (hours) => {
    if (isNaN(hours) || hours === null || hours === undefined) return 'warning'
    if (hours > 0) return 'success'
    return 'secondary'
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

  // Formater la date pour l'affichage (jour + date)
  const formatDateForDisplay = (weekNumber, dayName) => {
    const dateStr = getDateFromWeekAndDay(weekNumber, dayName)
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const dateNum = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    return `${dateNum}/${month}/${year}`
  }

  // Calculer la date précise à partir du numéro de semaine et du jour
  const getDateFromWeekAndDay = (weekNumber, dayName) => {
    if (!weekNumber || !dayName) return ''

    try {
      let targetDate

      if (weekNumber >= 38 && weekNumber <= 53) {
        // Automne 2026 : la semaine 38 commence le lundi 14 septembre 2026
        const week38Monday = new Date(2026, 8, 14) // 14 septembre 2026 (lundi)
        const dayMap = {
          'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3, 'vendredi': 4, 'samedi': 5, 'dimanche': 6
        }
        const targetDay = dayMap[dayName.toLowerCase()]
        const daysFromWeek38 = (weekNumber - 38) * 7 + targetDay
        targetDate = new Date(week38Monday)
        targetDate.setDate(week38Monday.getDate() + daysFromWeek38)
      } else if (weekNumber >= 1 && weekNumber <= 37) {
        // Printemps 2027 : la semaine 1 commence le lundi 4 janvier 2027
        const week1Monday = new Date(2027, 0, 4) // 4 janvier 2027 (lundi)
        const dayMap = {
          'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3, 'vendredi': 4, 'samedi': 5, 'dimanche': 6
        }
        const targetDay = dayMap[dayName.toLowerCase()]
        const daysFromWeek1 = (weekNumber - 1) * 7 + targetDay
        targetDate = new Date(week1Monday)
        targetDate.setDate(week1Monday.getDate() + daysFromWeek1)
      } else {
        return ''
      }

      // Formater la date en YYYY-MM-DD pour la base de données (sans problème de fuseau horaire)
      const year = targetDate.getFullYear()
      const month = (targetDate.getMonth() + 1).toString().padStart(2, '0')
      const day = targetDate.getDate().toString().padStart(2, '0')
      return `${year}-${month}-${day}`
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
    return days[date.getDay()]
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
    return days[date.getDay()]
  }

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

  return {
    normalizeClass,
    getSlotHours,
    formatTeachersArray,
    formatDay,
    getActivitySeverity,
    getActivityColor,
    getClassColor,
    getClassDisplayColor,
    getClassTextColor,
    getWeekColor,
    getWeekBorderColor,
    getDayColor,
    getDayBackgroundColor,
    getHoursSeverity,
    getActionLabel,
    getActionSeverity,
    formatDateForDisplay,
    getDateFromWeekAndDay,
    getCurrentWeekNumber,
    formatDateTime,
    formatDate,
    getWeekDateRange,
  }
}
