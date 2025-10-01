<template>
  <div class="hes-house-quiz">
    <!-- Message si l'utilisateur a déjà une maison -->
    <div v-if="existingHouse" class="existing-house-message">
      <div class="message-card">
        <i class="pi pi-info-circle"></i>
        <h3>Vous avez déjà une maison !</h3>
        <p>Vous êtes actuellement dans la maison <strong>{{ existingHouse }}</strong>.</p>
        <p>Vous pouvez refaire le quiz pour changer de maison si vous le souhaitez.</p>
        <button @click="existingHouse = null" class="continue-button">
          Refaire le quiz
        </button>
      </div>
    </div>

    <!-- Header du quiz -->
    <div class="quiz-header" v-if="!quizCompleted && !existingHouse">
      <div class="quiz-logo">
        <i class="pi pi-graduation-cap quiz-icon"></i>
      </div>
      <h2 class="quiz-title">Quiz des Maisons HES</h2>
      <p class="quiz-subtitle">Découvre ta maison selon tes valeurs et ta personnalité</p>
      <div class="progress-container">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: progressPercentage + '%' }"></div>
        </div>
        <span class="progress-text">Question {{ currentQuestionIndex + 1 }} sur {{ questions.length }}</span>
      </div>
    </div>

    <!-- Questions du quiz -->
    <div class="question-section" v-if="!quizCompleted && !existingHouse && currentQuestion">
      <div class="question-card">
        <h3 class="question-title">{{ currentQuestion.question }}</h3>
        <div class="answers-container">
          <div
            v-for="(answer, index) in currentQuestion.answers"
            :key="index"
            @click="selectAnswer(answer)"
            class="answer-option"
            :class="{ 'selected': selectedAnswer === answer }"
          >
            <div class="answer-content">
              <span class="answer-letter">{{ String.fromCharCode(97 + index) }})</span>
              <span class="answer-text">{{ answer.text }}</span>
            </div>
          </div>
        </div>
        <div class="question-actions" v-if="selectedAnswer">
          <button @click="nextQuestion" class="next-button">
            <span v-if="currentQuestionIndex < questions.length - 1">Question suivante</span>
            <span v-else>Voir mon résultat</span>
            <i class="pi pi-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Résultat final -->
    <div class="result-section" v-if="quizCompleted">
      <div class="result-card">
        <div class="house-reveal">
          <div class="house-icon-container">
            <i :class="selectedHouse.icon" class="house-main-icon" :style="{ color: selectedHouse.color }"></i>
          </div>
          <h2 class="house-name" :style="{ color: selectedHouse.color }">{{ selectedHouse.name }}</h2>
          <p class="house-motto">"{{ selectedHouse.motto }}"</p>
          <div class="house-description">
            <p>{{ selectedHouse.description }}</p>
          </div>
          <div class="result-actions">
            <button @click="saveHouseSelection" class="accept-button" :style="{ backgroundColor: selectedHouse.color }">
              <i class="pi pi-check"></i>
              Accepter ma maison
            </button>
            <button @click="restartQuiz" class="restart-button">
              <i class="pi pi-refresh"></i>
              Refaire le test
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Overlay de calcul -->
    <div class="calculating-overlay" v-if="isCalculating">
      <div class="calculating-content">
        <div class="spinner"></div>
        <p>Calcul de votre maison en cours...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import gamificationIntegration from '@/service/gamificationIntegration'
import { useAuthStore } from '@/stores/authStore'

const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// Props
const props = defineProps({
  userId: {
    type: String,
    default: null
  }
})

// Emits
const emit = defineEmits(['houseSelected'])

// Variables réactives
const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const answers = ref([])
const quizCompleted = ref(false)
const isCalculating = ref(false)
const selectedHouse = ref(null)
const existingHouse = ref(null)

// Configuration des maisons HES
const houses = {
  harmonis: {
    name: 'Harmonis',
    motto: 'L\'équilibre soigne',
    description: 'Tu es quelqu\'un de stable, paisible et centré. Tu cherches l\'harmonie autour de toi, tu aides les autres à se sentir bien sans faire de bruit. Tu sais que l\'équilibre soigne.',
    color: '#2E8B57',
    icon: 'pi pi-circle'
  },
  elaris: {
    name: 'Elaris',
    motto: 'Clarifier, guider, apaiser',
    description: 'Tu es clair dans tes idées, tu aimes guider les autres et voir au-delà des apparences. Tu éclaires les chemins, tu transmets des idées avec calme et assurance.',
    color: '#DC143C',
    icon: 'pi pi-sun'
  },
  doloris: {
    name: 'Doloris',
    motto: 'Comprendre la douleur, c\'est soigner',
    description: 'Tu ressens profondément ce que les autres vivent. Tu as de la compassion, tu veux comprendre avant d\'agir. Tu ne fais pas les choses à moitié.',
    color: '#FFD700',
    icon: 'pi pi-heart'
  },
  solencia: {
    name: 'Solencia',
    motto: 'Apaiser pour mieux guérir',
    description: 'Tu es doux, apaisant, et tu offres ta présence aux autres dans les moments difficiles. Tu sais écouter, rassurer et consoler.',
    color: '#4169E1',
    icon: 'pi pi-moon'
  }
}

// Questions du quiz
const questions = ref([
  {
    question: "Quel animal te ressemble le plus ?",
    answers: [
      { text: "Le chat", house: 'harmonis' },
      { text: "Le hibou", house: 'elaris' },
      { text: "Le chien", house: 'doloris' },
      { text: "Le dauphin", house: 'solencia' }
    ]
  },
  {
    question: "Dans un groupe, tu es plutôt…",
    answers: [
      { text: "Celui qui écoute et observe", house: 'harmonis' },
      { text: "Celui qui propose des idées", house: 'elaris' },
      { text: "Celui qui ressent l'ambiance", house: 'doloris' },
      { text: "Celui qui rassure les autres", house: 'solencia' }
    ]
  },
  {
    question: "Face à un conflit, tu…",
    answers: [
      { text: "Cherches un compromis", house: 'harmonis' },
      { text: "Analyses la situation", house: 'elaris' },
      { text: "Comprends les émotions de chacun", house: 'doloris' },
      { text: "Apaises les tensions", house: 'solencia' }
    ]
  },
  {
    question: "Ton environnement idéal est…",
    answers: [
      { text: "Calme et équilibré", house: 'harmonis' },
      { text: "Stimulant et organisé", house: 'elaris' },
      { text: "Authentique et profond", house: 'doloris' },
      { text: "Chaleureux et accueillant", house: 'solencia' }
    ]
  },
  {
    question: "Quand tu aides quelqu'un, tu…",
    answers: [
      { text: "L'aides à retrouver son équilibre", house: 'harmonis' },
      { text: "Lui donnes des conseils clairs", house: 'elaris' },
      { text: "L'écoutes vraiment", house: 'doloris' },
      { text: "Le rassures et le réconfortes", house: 'solencia' }
    ]
  },
  {
    question: "Ta plus grande qualité est…",
    answers: [
      { text: "La stabilité", house: 'harmonis' },
      { text: "La clarté", house: 'elaris' },
      { text: "L'empathie", house: 'doloris' },
      { text: "La douceur", house: 'solencia' }
    ]
  },
  {
    question: "Dans le stress, tu…",
    answers: [
      { text: "Cherches à te recentrer", house: 'harmonis' },
      { text: "Analyses pour comprendre", house: 'elaris' },
      { text: "Ressens tout intensément", house: 'doloris' },
      { text: "Cherches du réconfort", house: 'solencia' }
    ]
  },
  {
    question: "Ton approche du soin est…",
    answers: [
      { text: "Holistique et équilibrée", house: 'harmonis' },
      { text: "Méthodique et précise", house: 'elaris' },
      { text: "Empathique et profonde", house: 'doloris' },
      { text: "Douce et rassurante", house: 'solencia' }
    ]
  },
  {
    question: "Ce qui te motive le plus c'est…",
    answers: [
      { text: "L'harmonie et la paix", house: 'harmonis' },
      { text: "La compréhension et la clarté", house: 'elaris' },
      { text: "La connexion humaine", house: 'doloris' },
      { text: "Le réconfort des autres", house: 'solencia' }
    ]
  },
  {
    question: "Ton style de communication est…",
    answers: [
      { text: "Posé et équilibré", house: 'harmonis' },
      { text: "Direct et clair", house: 'elaris' },
      { text: "Émotionnel et authentique", house: 'doloris' },
      { text: "Doux et bienveillant", house: 'solencia' }
    ]
  },
  {
    question: "Face à la souffrance, tu…",
    answers: [
      { text: "Cherches l'équilibre", house: 'harmonis' },
      { text: "Veux comprendre les causes", house: 'elaris' },
      { text: "Ressens profondément", house: 'doloris' },
      { text: "Offres ta présence", house: 'solencia' }
    ]
  },
  {
    question: "Ton élément naturel est…",
    answers: [
      { text: "La terre", house: 'harmonis' },
      { text: "Le feu", house: 'elaris' },
      { text: "L'eau", house: 'doloris' },
      { text: "L'air", house: 'solencia' }
    ]
  },
  {
    question: "Dans une équipe soignante, tu es…",
    answers: [
      { text: "Le pilier stable", house: 'harmonis' },
      { text: "Le guide éclairé", house: 'elaris' },
      { text: "Le cœur empathique", house: 'doloris' },
      { text: "La présence apaisante", house: 'solencia' }
    ]
  },
  {
    question: "Ta façon d'apprendre est…",
    answers: [
      { text: "Progressive et équilibrée", house: 'harmonis' },
      { text: "Analytique et structurée", house: 'elaris' },
      { text: "Par l'expérience et l'émotion", house: 'doloris' },
      { text: "Dans la douceur et la patience", house: 'solencia' }
    ]
  },
  {
    question: "Ce qui te caractérise le mieux…",
    answers: [
      { text: "Je suis un pont entre les extrêmes", house: 'harmonis' },
      { text: "Je vois clair dans les situations", house: 'elaris' },
      { text: "Je ressens ce que les autres vivent", house: 'doloris' },
      { text: "J'apporte la paix autour de moi", house: 'solencia' }
    ]
  },
  {
    question: "Si quelqu'un ne va pas bien, tu…",
    answers: [
      { text: "Restes présent sans trop parler", house: 'harmonis' },
      { text: "Essaies de lui faire voir le bon côté", house: 'elaris' },
      { text: "L'écoutes et comprends sa douleur", house: 'doloris' },
      { text: "L'entoures de douceur", house: 'solencia' }
    ]
  }
])

// Computed
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || null
})

const progressPercentage = computed(() => {
  return Math.round((currentQuestionIndex.value / questions.value.length) * 100)
})

// Méthodes
const selectAnswer = (answer) => {
  selectedAnswer.value = answer
}

const nextQuestion = () => {
  if (selectedAnswer.value) {
    answers.value.push(selectedAnswer.value)
    selectedAnswer.value = null
    
    if (currentQuestionIndex.value < questions.value.length - 1) {
      currentQuestionIndex.value++
    } else {
      calculateHouse()
    }
  }
}

const calculateHouse = () => {
  isCalculating.value = true
  
  setTimeout(() => {
    // Compter les réponses pour chaque maison
    const houseScores = {
      harmonis: 0,
      elaris: 0,
      doloris: 0,
      solencia: 0
    }
    
    answers.value.forEach(answer => {
      houseScores[answer.house]++
    })
    
    // Trouver la maison avec le score le plus élevé
    const winningHouse = Object.keys(houseScores).reduce((a, b) => 
      houseScores[a] > houseScores[b] ? a : b
    )
    
    selectedHouse.value = houses[winningHouse]
    isCalculating.value = false
    quizCompleted.value = true
  }, 2000)
}

const saveHouseSelection = async () => {
  try {
    const userId = props.userId || authStore.user?.id
    if (!userId) {
      toast.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'Utilisateur non connecté',
        life: 3000
      })
      return
    }

    // Sauvegarder la maison directement dans gamification_data
    try {
      const houseId = getHouseIdByName(selectedHouse.value.name)
      
      // Insertion directe dans gamification_data avec colonnes correctes
      const { data, error } = await gamificationServiceSupabase.supabase
        .from('gamification_data')
        .upsert({
          user_id: userId,
          email: authStore.user?.email || 'unknown@email.com',
          house_id: houseId,
          current_level: 1,
          total_xp: 50, // Bonus quiz
          house_points: 50, // Points initiaux pour la maison
          gamification_metadata: {
            quiz_completed: true,
            house_assigned: selectedHouse.value.name,
            quiz_date: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        console.error('❌ Erreur sauvegarde gamification_data:', error)
        throw error
      }

      console.log('✅ Maison sauvegardée dans gamification_data:', selectedHouse.value.name, 'pour utilisateur:', userId)
      console.log('Données sauvegardées:', data)
    } catch (error) {
      console.error('❌ Erreur sauvegarde Supabase:', error)
      // Continuer même en cas d'erreur de sauvegarde
    }

    // NOUVEAU : Déclencher l'intégration gamification pour quiz terminé
    await gamificationIntegration.onQuizComplete(userId, {
      house: selectedHouse.value.name.toLowerCase(),
      quizType: 'house_selection',
      questionsAnswered: questions.value.length,
      timestamp: Date.now()
    })

    toast.add({
      severity: 'success',
      summary: 'Félicitations !',
      detail: `Tu as été assigné à la maison ${selectedHouse.value.name} et tu as gagné 50 XP !`,
      life: 5000
    })

    emit('houseSelected', selectedHouse.value)
    
    // Rediriger vers le profil après 2 secondes
    setTimeout(() => {
      router.push('/profile/' + userId)
    }, 2000)

  } catch (error) {
    console.error('Erreur lors de la sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder ta maison',
      life: 3000
    })
  }
}

const restartQuiz = () => {
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  answers.value = []
  quizCompleted.value = false
  isCalculating.value = false
  selectedHouse.value = null
}

// Helper pour obtenir l'ID de la maison par son nom
const getHouseIdByName = (houseName) => {
  const houseMapping = {
    'Harmonis': '550e8400-e29b-41d4-a716-446655440001',
    'Elaris': '550e8400-e29b-41d4-a716-446655440002', 
    'Nexus': '550e8400-e29b-41d4-a716-446655440003',
    'Solencia': '550e8400-e29b-41d4-a716-446655440004'
  }
  return houseMapping[houseName] || houseMapping['Harmonis'] // Fallback
}

// Vérifier si l'utilisateur a déjà une maison avec Supabase
onMounted(async () => {
  try {
    const userId = props.userId || authStore.user?.id
    if (userId) {
      // Utiliser le service Supabase pour vérifier la maison existante
      const gamificationData = await gamificationServiceSupabase.getUserGamificationData(userId)
      if (gamificationData?.maison) {
        existingHouse.value = gamificationData.maison
        // Permettre de refaire le quiz même avec une maison existante
      }
    }
  } catch (error) {
    console.error('Erreur lors de la vérification Supabase:', error)
  }
})
</script>

<style scoped>
.hes-house-quiz {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  min-height: 100vh;
}

.quiz-header {
  text-align: center;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.quiz-logo {
  margin-bottom: 1rem;
}

.quiz-icon {
  font-size: 4rem;
  color: var(--primary-color);
}

.quiz-title {
  font-size: 2.5rem;
  margin: 1rem 0;
  font-weight: 700;
}

.quiz-subtitle {
  font-size: 1.2rem;
  opacity: 1;
  margin-bottom: 2rem;
}

.progress-container {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255,255,255,0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: var(--primary-color);
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 0.9rem;
  opacity: 1;
}

.question-section {
  margin-bottom: 2rem;
}

.question-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.question-title {
  font-size: 1.5rem;
  color: var(--primary-color);
  margin-bottom: 2rem;
  text-align: center;
}

.answers-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.answer-option {
  padding: 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
}

.answer-option:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.answer-option.selected {
  border-color: var(--primary-color);
  background: #ebf3fd;
}

.answer-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.answer-letter {
  font-weight: 700;
  color: var(--primary-color);
  min-width: 20px;
}

.answer-text {
  flex: 1;
  color: #2c3e50;
}

.question-actions {
  text-align: center;
}

.next-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: background 0.3s ease;
}

.next-button:hover {
  background: var(--primary-color-dark);
}

.result-section {
  text-align: center;
}

.result-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 3rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.house-icon-container {
  margin-bottom: 2rem;
}

.house-main-icon {
  font-size: 5rem;
}

.house-name {
  font-size: 3rem;
  margin: 1rem 0;
  font-weight: 700;
}

.house-motto {
  font-size: 1.3rem;
  font-style: italic;
  color: #7f8c8d;
  margin-bottom: 2rem;
}

.house-description {
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.6;
  color: #34495e;
}

.result-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.accept-button,
.restart-button {
  padding: 1rem 2rem;
  border-radius: 25px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;
}

.accept-button {
  color: white;
}

.restart-button {
  background: var(--surface-border);
  color: var(--text-color);
}

.restart-button:hover {
  background: var(--surface-hover);
}

.calculating-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.calculating-content {
  text-align: center;
  color: white;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.calculating-content p {
  font-size: 1.5rem;
  margin: 0;
}

.existing-house-message {
  text-align: center;
  margin-bottom: 2rem;
}

.message-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.message-card i {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.message-card h3 {
  font-size: 1.5rem;
  margin: 1rem 0;
  font-weight: 700;
}

.message-card p {
  font-size: 1.1rem;
  line-height: 1.6;
  color: var(--text-color);
  margin-bottom: 1rem;
}

.continue-button {
  background: var(--primary-color);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 25px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 auto;
  transition: background 0.3s ease;
}

.continue-button:hover {
  background: var(--primary-color-dark);
}

/* Responsive */
@media (max-width: 768px) {
  .hes-house-quiz {
    padding: 1rem;
  }
  
  .quiz-title {
    font-size: 2rem;
  }
  
  .house-name {
    font-size: 2rem;
  }
  
  .result-actions {
    flex-direction: column;
  }
  
  .question-card {
    padding: 1.5rem;
  }
}
</style>
