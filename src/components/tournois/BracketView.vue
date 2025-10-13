<template>
  <div class="bracket-view">
    <div v-if="bracket.champion" class="champion-banner">
      <i class="pi pi-trophy"></i>
      <h2>Champion : {{ bracket.champion.nom }}</h2>
      <i class="pi pi-trophy"></i>
    </div>
    
    <div class="bracket-container">
      <div 
        v-for="(round, roundIndex) in bracket.rounds" 
        :key="roundIndex"
        class="bracket-round"
      >
        <h3 class="round-title">{{ round.nom }}</h3>
        
        <div class="round-matchs">
          <div 
            v-for="(match, matchIndex) in round.matchs"
            :key="match.id"
            class="bracket-match"
            :class="{ 
              'match-completed': match.joue,
              'match-bye': match.isBye
            }"
          >
            <!-- Équipe 1 -->
            <div 
              class="match-team"
              :class="{ 
                'team-winner': match.joue && match.gagnant?.id === match.equipe1?.id,
                'team-loser': match.joue && match.gagnant?.id !== match.equipe1?.id,
                'team-empty': !match.equipe1
              }"
            >
              <span class="team-name">{{ match.equipe1?.nom || 'En attente...' }}</span>
              <InputNumber 
                v-if="match.equipe1 && match.equipe2 && !match.joue"
                v-model="match.score1"
                :min="0"
                :max="99"
                class="score-input-small"
                @update:modelValue="checkMatchComplete(match)"
              />
              <span v-else-if="match.joue" class="team-score">{{ match.score1 }}</span>
            </div>
            
            <!-- VS ou BYE -->
            <div class="match-vs">
              <span v-if="match.isBye" class="bye-badge">
                <i class="pi pi-arrow-right"></i> BYE
              </span>
              <span v-else>VS</span>
            </div>
            
            <!-- Équipe 2 -->
            <div 
              class="match-team"
              :class="{ 
                'team-winner': match.joue && match.gagnant?.id === match.equipe2?.id,
                'team-loser': match.joue && match.gagnant?.id !== match.equipe2?.id,
                'team-empty': !match.equipe2
              }"
            >
              <span class="team-name">{{ match.equipe2?.nom || 'En attente...' }}</span>
              <InputNumber 
                v-if="match.equipe1 && match.equipe2 && !match.joue"
                v-model="match.score2"
                :min="0"
                :max="99"
                class="score-input-small"
                @update:modelValue="checkMatchComplete(match)"
              />
              <span v-else-if="match.joue" class="team-score">{{ match.score2 }}</span>
            </div>
            
            <!-- Actions -->
            <div class="match-actions-bracket" v-if="match.equipe1 && match.equipe2 && !match.isBye">
              <Button 
                v-if="!match.joue && match.score1 !== null && match.score2 !== null && match.score1 !== match.score2"
                label="Valider"
                icon="pi pi-check"
                class="p-button-success p-button-sm"
                @click="validerMatch(roundIndex, matchIndex, match)"
              />
              <Button 
                v-else-if="match.joue"
                label="Modifier"
                icon="pi pi-pencil"
                class="p-button-warning p-button-sm"
                @click="modifierMatch(match)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, onMounted } from 'vue'
import InputNumber from 'primevue/inputnumber'
import Button from 'primevue/button'

const props = defineProps({
  bracket: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update'])

// Avancer les byes au montage
onMounted(() => {
  avancerByes()
})

function checkMatchComplete(match) {
  // Juste pour la réactivité
}

function validerMatch(roundIndex, matchIndex, match) {
  if (match.score1 === match.score2) {
    alert('Pas de match nul en élimination directe ! Il faut un gagnant.')
    return
  }
  
  // Déterminer le gagnant
  const gagnant = match.score1 > match.score2 ? match.equipe1 : match.equipe2
  match.gagnant = gagnant
  match.joue = true
  
  // Mettre à jour les statistiques des équipes
  if (match.equipe1) {
    match.equipe1.verresMis = (match.equipe1.verresMis || 0) + match.score1
    match.equipe1.verresEncaisses = (match.equipe1.verresEncaisses || 0) + match.score2
    match.equipe1.matchsJoues = (match.equipe1.matchsJoues || 0) + 1
    if (match.score1 > match.score2) {
      match.equipe1.victoires = (match.equipe1.victoires || 0) + 1
    } else {
      match.equipe1.defaites = (match.equipe1.defaites || 0) + 1
    }
  }
  
  if (match.equipe2) {
    match.equipe2.verresMis = (match.equipe2.verresMis || 0) + match.score2
    match.equipe2.verresEncaisses = (match.equipe2.verresEncaisses || 0) + match.score1
    match.equipe2.matchsJoues = (match.equipe2.matchsJoues || 0) + 1
    if (match.score2 > match.score1) {
      match.equipe2.victoires = (match.equipe2.victoires || 0) + 1
    } else {
      match.equipe2.defaites = (match.equipe2.defaites || 0) + 1
    }
  }
  
  // Faire avancer le gagnant au tour suivant
  if (roundIndex < props.bracket.rounds.length - 1) {
    const nextRound = props.bracket.rounds[roundIndex + 1]
    const nextMatchIndex = Math.floor(matchIndex / 2)
    const nextMatch = nextRound.matchs[nextMatchIndex]
    
    if (matchIndex % 2 === 0) {
      nextMatch.equipe1 = gagnant
    } else {
      nextMatch.equipe2 = gagnant
    }
    
    // Si le match suivant a déjà ses 2 équipes, vérifier si c'est un bye
    if (nextMatch.equipe1 && nextMatch.equipe2 && nextMatch.isBye) {
      nextMatch.isBye = false
    }
  } else {
    // C'est la finale, on a un champion !
    props.bracket.champion = gagnant
  }
  
  emit('update')
  
  // Avancer automatiquement les gagnants des byes au tour suivant
  avancerByes()
}

function avancerByes() {
  props.bracket.rounds.forEach((round, roundIndex) => {
    if (roundIndex < props.bracket.rounds.length - 1) {
      const nextRound = props.bracket.rounds[roundIndex + 1]
      
      round.matchs.forEach((match, matchIndex) => {
        if (match.isBye && match.gagnant) {
          const nextMatchIndex = Math.floor(matchIndex / 2)
          const nextMatch = nextRound.matchs[nextMatchIndex]
          
          if (matchIndex % 2 === 0) {
            if (!nextMatch.equipe1) nextMatch.equipe1 = match.gagnant
          } else {
            if (!nextMatch.equipe2) nextMatch.equipe2 = match.gagnant
          }
        }
      })
    }
  })
}

function modifierMatch(match) {
  // Réinitialiser le match et tous les matchs suivants
  if (confirm('Modifier ce match réinitialisera tous les matchs suivants. Continuer ?')) {
    match.joue = false
    match.gagnant = null
    
    // Réinitialiser les matchs suivants (à implémenter selon les besoins)
    emit('update')
  }
}
</script>

<style scoped>
.bracket-view {
  padding: 2rem 0;
}

.champion-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2rem;
  background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
  color: #000;
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 3rem;
  box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
  animation: championGlow 2s ease-in-out infinite;
}

@keyframes championGlow {
  0%, 100% {
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.4);
  }
  50% {
    box-shadow: 0 15px 40px rgba(255, 215, 0, 0.7);
  }
}

.champion-banner i {
  font-size: 3rem;
}

.champion-banner h2 {
  margin: 0;
  font-size: 2rem;
  font-weight: 800;
}

.bracket-container {
  display: flex;
  gap: 3rem;
  overflow-x: auto;
  padding: 2rem 1rem;
  min-height: 600px;
}

.bracket-round {
  flex: 0 0 300px;
  display: flex;
  flex-direction: column;
}

.round-title {
  text-align: center;
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--primary-color);
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
}

.round-matchs {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  flex: 1;
  gap: 2rem;
}

.bracket-match {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  border: 2px solid var(--surface-border);
}

.bracket-match:hover {
  transform: translateX(5px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.2);
}

.bracket-match.match-completed {
  border-color: var(--green-500);
  background: linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent);
}

.bracket-match.match-bye {
  border-color: var(--yellow-500);
  background: linear-gradient(to right, rgba(255, 193, 7, 0.05), transparent);
  opacity: 0.8;
}

.bye-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--yellow-600);
  font-size: 1rem;
}

.match-team {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  margin: 0.5rem 0;
  background: var(--surface-ground);
  border-radius: 8px;
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
}

.match-team.team-empty {
  opacity: 0.5;
  background: var(--surface-100);
}

.match-team.team-winner {
  border-color: var(--green-500);
  background: linear-gradient(to right, rgba(34, 197, 94, 0.15), transparent);
  font-weight: 700;
}

.match-team.team-loser {
  opacity: 0.6;
  text-decoration: line-through;
}

.team-name {
  flex: 1;
  font-weight: 600;
  font-size: 1.05rem;
}

.team-score {
  font-size: 1.3rem;
  font-weight: 800;
  color: var(--primary-color);
  min-width: 40px;
  text-align: center;
}

.score-input-small {
  width: 70px;
}

.match-vs {
  text-align: center;
  font-weight: 700;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  padding: 0.25rem 0;
}

.match-actions-bracket {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

@media (max-width: 1024px) {
  .bracket-container {
    gap: 2rem;
  }
  
  .bracket-round {
    flex: 0 0 250px;
  }
}

@media (max-width: 768px) {
  .bracket-view {
    padding: 1rem 0;
  }
  
  .champion-banner {
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;
  }
  
  .champion-banner i {
    font-size: 2rem;
  }
  
  .champion-banner h2 {
    font-size: 1.5rem;
  }
  
  .bracket-container {
    flex-direction: column;
    overflow-x: visible;
    padding: 1rem 0.5rem;
    gap: 2rem;
    min-height: auto;
  }
  
  .bracket-round {
    flex: 1 0 auto;
    width: 100%;
  }
  
  .round-title {
    font-size: 1.25rem;
    padding: 0.75rem;
    margin-bottom: 1.5rem;
  }
  
  .round-matchs {
    gap: 1rem;
  }
  
  .bracket-match {
    padding: 1rem;
  }
  
  .match-team {
    padding: 0.5rem 0.75rem;
    flex-wrap: wrap;
  }
  
  .team-name {
    font-size: 0.95rem;
    flex: 1;
    min-width: 150px;
  }
  
  .team-score {
    font-size: 1.1rem;
  }
  
  .score-input-small {
    width: 60px;
  }
  
  .match-actions-bracket {
    margin-top: 0.75rem;
  }
  
  .match-actions-bracket .p-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .bracket-view {
    padding: 0.5rem 0;
  }
  
  .champion-banner {
    padding: 1rem;
  }
  
  .champion-banner h2 {
    font-size: 1.25rem;
  }
  
  .champion-banner i {
    font-size: 1.5rem;
  }
  
  .bracket-container {
    padding: 0.5rem;
    gap: 1.5rem;
  }
  
  .round-title {
    font-size: 1.1rem;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }
  
  .bracket-match {
    padding: 0.75rem;
  }
  
  .match-team {
    padding: 0.5rem;
  }
  
  .team-name {
    font-size: 0.85rem;
    min-width: 120px;
  }
  
  .team-score {
    font-size: 1rem;
    min-width: 30px;
  }
  
  .score-input-small {
    width: 50px;
  }
  
  .match-vs {
    font-size: 0.8rem;
  }
  
  .bye-badge {
    font-size: 0.9rem;
  }
}
</style>
