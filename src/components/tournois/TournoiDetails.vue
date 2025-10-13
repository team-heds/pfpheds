<template>
  <div class="tournoi-details">
    <!-- Header avec actions -->
    <div class="tournoi-header-actions">
      <div class="tournoi-type-badge">
        <Tag :value="getTypeLabel()" :severity="getTypeSeverity()" />
      </div>
      <Button 
        label="📄 Feuille de matchs" 
        icon="pi pi-print"
        class="p-button-secondary"
        @click="genererFeuilleMatchs"
        title="Générer une feuille imprimable avec tous les matchs"
      />
    </div>
    
    <TabView>
      <!-- Onglet Bracket (pour bracket et hybride en phase bracket) -->
      <TabPanel 
        v-if="tournoi.type === 'bracket' || (tournoi.type === 'hybride' && tournoi.phaseActuelle === 'bracket')" 
        header="🍺 Bracket"
      >
        <div class="tirage-sort-section">
          <Button 
            label="🎲 Tirage au sort des équipes" 
            icon="pi pi-refresh"
            class="p-button-warning"
            @click="tirageAuSortBracket"
            :disabled="tournoi.bracket?.rounds[0]?.matchs.some(m => m.joue && !m.isBye)"
          />
          <small v-if="tournoi.bracket?.rounds[0]?.matchs.some(m => m.joue && !m.isBye)" class="text-muted">
            ⚠️ Des matchs ont déjà été joués
          </small>
        </div>
        
        <BracketView 
          v-if="tournoi.bracket" 
          :bracket="tournoi.bracket" 
          @update="saveChanges"
        />
      </TabPanel>
      
      <!-- Onglet Mini-Brackets (pour multibracket en phase minibrackets) -->
      <TabPanel 
        v-if="tournoi.type === 'multibracket' && tournoi.phaseActuelle === 'minibrackets'" 
        header="⚡ Mini-Brackets"
      >
        <div class="tirage-sort-section">
          <Button 
            label="🎲 Tirage au sort des équipes" 
            icon="pi pi-refresh"
            class="p-button-warning"
            @click="tirageAuSortMiniBrackets"
            :disabled="tournoi.miniBrackets?.some(mb => mb.bracket.rounds[0]?.matchs.some(m => m.joue && !m.isBye))"
          />
          <small v-if="tournoi.miniBrackets?.some(mb => mb.bracket.rounds[0]?.matchs.some(m => m.joue && !m.isBye))" class="text-muted">
            ⚠️ Des matchs ont déjà été joués
          </small>
        </div>
        
        <div class="minibrackets-container">
          <div v-for="miniBracket in tournoi.miniBrackets" :key="miniBracket.id" class="minibracket-section">
            <div class="minibracket-header">
              <h3 class="minibracket-title">{{ miniBracket.nom }}</h3>
              <div v-if="miniBracket.champion" class="minibracket-results">
                <Tag :value="'🏆 ' + miniBracket.champion.nom" severity="success" />
                <Tag v-if="miniBracket.finaliste" :value="'🥈 ' + miniBracket.finaliste.nom" severity="info" class="ml-2" />
              </div>
            </div>
            
            <BracketView 
              :bracket="miniBracket.bracket" 
              @update="updateMiniBracket(miniBracket)"
            />
          </div>
        </div>
        
        <!-- Résumé des qualifiés -->
        <div v-if="getQualifiesCount() > 0" class="qualifies-summary">
          <h3>📊 Qualifiés pour le bracket final</h3>
          <div class="qualifies-grid">
            <div v-for="miniBracket in tournoi.miniBrackets" :key="miniBracket.id" class="qualifie-card">
              <h4>{{ miniBracket.nom }}</h4>
              <div v-if="miniBracket.champion" class="qualifie-item champion">
                <i class="pi pi-trophy"></i> {{ miniBracket.champion.nom }}
              </div>
              <div v-if="miniBracket.finaliste" class="qualifie-item finaliste">
                <i class="pi pi-star"></i> {{ miniBracket.finaliste.nom }}
              </div>
              <div v-if="!miniBracket.champion" class="qualifie-item pending">
                <i class="pi pi-clock"></i> En attente...
              </div>
            </div>
          </div>
          <p class="total-qualifies"><strong>Total : {{ getQualifiesCount() }} / 12 équipes qualifiées</strong></p>
        </div>
        
        <!-- Bouton pour passer au bracket final -->
        <div v-if="tousMiniBracketsTermines()" class="phase-transition">
          <Button 
            label="🔥 Générer le bracket final avec les 12 qualifiés" 
            icon="pi pi-arrow-right"
            class="p-button-lg p-button-success"
            @click="genererBracketFinal"
          />
          <p class="text-muted mt-2">6 champions 🏆 + 6 finalistes 🥈 = 12 équipes pour le titre final !</p>
        </div>
      </TabPanel>
      
      <!-- Onglet Bracket Final (pour multibracket en phase finale) -->
      <TabPanel 
        v-if="tournoi.type === 'multibracket' && tournoi.phaseActuelle === 'finale'" 
        header="🏆 Bracket Final"
      >
        <BracketView 
          v-if="tournoi.bracketFinal" 
          :bracket="tournoi.bracketFinal" 
          @update="saveChanges"
        />
      </TabPanel>
      
      <!-- Onglet Phases de Poule (pour poule et hybride en phase poule) -->
      <TabPanel 
        v-if="tournoi.type === 'poule' || (tournoi.type === 'hybride' && tournoi.phaseActuelle === 'poule')" 
        header="Phases de Poule"
      >
        <div class="tirage-sort-section">
          <Button 
            label="🎲 Tirage au sort des équipes" 
            icon="pi pi-refresh"
            class="p-button-warning"
            @click="tirageAuSortPoules"
            :disabled="tournoi.poules?.some(p => p.matchs.some(m => m.joue))"
          />
          <small v-if="tournoi.poules?.some(p => p.matchs.some(m => m.joue))" class="text-muted">
            ⚠️ Des matchs ont déjà été joués
          </small>
        </div>
        
        <div class="poules-container">
          <div v-for="poule in tournoi.poules" :key="poule.id" class="poule-section">
            <h3 class="poule-title">{{ poule.nom }}</h3>
            
            <!-- Tableau des matchs -->
            <div class="matchs-section">
              <h4>Matchs</h4>
              <div class="matchs-grid">
                <div 
                  v-for="match in poule.matchs" 
                  :key="match.id"
                  class="match-card"
                  :class="{ 'match-joue': match.joue }"
                >
                  <div class="match-content">
                    <div class="equipe">
                      <span class="equipe-nom">{{ match.equipe1.nom }}</span>
                      <InputNumber 
                        v-model="match.score1"
                        :min="0"
                        :max="99"
                        class="score-input"
                        :disabled="match.joue"
                        @update:modelValue="updateScore(poule, match)"
                      />
                    </div>
                    
                    <div class="vs">VS</div>
                    
                    <div class="equipe">
                      <InputNumber 
                        v-model="match.score2"
                        :min="0"
                        :max="99"
                        class="score-input"
                        :disabled="match.joue"
                        @update:modelValue="updateScore(poule, match)"
                      />
                      <span class="equipe-nom">{{ match.equipe2.nom }}</span>
                    </div>
                  </div>
                  
                  <div class="match-actions">
                    <Button 
                      v-if="!match.joue"
                      :label="canValidateMatch(match) ? 'Valider' : 'En attente des scores'"
                      icon="pi pi-check"
                      class="p-button-success p-button-sm"
                      :disabled="!canValidateMatch(match)"
                      @click="validerMatch(poule, match)"
                    />
                    <Button 
                      v-else
                      label="Modifier"
                      icon="pi pi-pencil"
                      class="p-button-warning p-button-sm"
                      @click="modifierMatch(match)"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Classement de la poule -->
            <div class="classement-section">
              <h4>Classement</h4>
              <DataTable 
                :value="getClassementPoule(poule)" 
                :key="getPouleKey(poule)"
                class="classement-table"
                stripedRows
              >
                <Column field="position" header="#" style="width: 50px">
                  <template #body="{ index }">
                    {{ index + 1 }}
                  </template>
                </Column>
                <Column field="nom" header="Équipe">
                  <template #body="{ data }">
                    <div class="equipe-cell">
                      <i class="pi pi-shield" style="margin-right: 0.5rem;"></i>
                      {{ data.nom }}
                    </div>
                  </template>
                </Column>
                <Column field="points" header="Pts" style="width: 80px; text-align: center;">
                  <template #body="{ data }">
                    <Tag :value="data.points" severity="success" />
                  </template>
                </Column>
                <Column field="matchsJoues" header="MJ" style="width: 60px; text-align: center;" />
                <Column field="victoires" header="V" style="width: 60px; text-align: center;" />
                <Column field="nuls" header="N" style="width: 60px; text-align: center;" />
                <Column field="defaites" header="D" style="width: 60px; text-align: center;" />
                <Column field="verresMis" header="VM" style="width: 60px; text-align: center;" />
                <Column field="verresEncaisses" header="VE" style="width: 60px; text-align: center;" />
                <Column field="goalAverage" header="GA" style="width: 80px; text-align: center;">
                  <template #body="{ data }">
                    <span :class="{ 'positive': data.goalAverage > 0, 'negative': data.goalAverage < 0 }">
                      {{ data.goalAverage > 0 ? '+' : '' }}{{ data.goalAverage }}
                    </span>
                  </template>
                </Column>
              </DataTable>
            </div>
          </div>
        </div>
        
        <!-- Bouton pour passer au bracket (mode hybride seulement) -->
        <div v-if="tournoi.type === 'hybride' && tournoi.phaseActuelle === 'poule'" class="phase-transition">
          <Button 
            label="🔥 Générer le bracket final avec les meilleurs" 
            icon="pi pi-arrow-right"
            class="p-button-lg p-button-success"
            @click="genererBracketHybride"
          />
          <p class="text-muted mt-2">Sélectionne les meilleures équipes de chaque poule pour la phase finale</p>
        </div>
      </TabPanel>
      
      <!-- Onglet Équipes -->
      <TabPanel header="Équipes">
        <div class="equipes-container">
          <div class="equipes-grid">
            <Card v-for="equipe in tournoi.equipes" :key="equipe.id" class="equipe-card">
              <template #title>
                <div class="equipe-header">
                  <i class="pi pi-shield"></i>
                  <InputText 
                    v-model="equipe.nom" 
                    class="equipe-name-input"
                    @input="synchroniserNomEquipe(equipe)"
                  />
                </div>
              </template>
              <template #content>
                <div class="equipe-stats">
                  <div class="stat-item">
                    <span class="stat-label">Points</span>
                    <Tag :value="equipe.points" severity="success" />
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Matchs</span>
                    <span class="stat-value">{{ equipe.matchsJoues }}</span>
                  </div>
                  <div class="stat-item">
                    <span class="stat-label">Verres</span>
                    <span class="stat-value">{{ equipe.verresMis }} / {{ equipe.verresEncaisses }}</span>
                  </div>
                </div>
              </template>
            </Card>
          </div>
        </div>
      </TabPanel>
      
      <!-- Onglet Statistiques -->
      <TabPanel header="Statistiques">
        <div class="stats-container">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-users"></i>
              </div>
              <div class="stat-content">
                <h3>{{ tournoi.equipes.length }}</h3>
                <p>Équipes</p>
              </div>
            </div>
            
            <div v-if="tournoi.poules" class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-th-large"></i>
              </div>
              <div class="stat-content">
                <h3>{{ tournoi.poules.length }}</h3>
                <p>Poules</p>
              </div>
            </div>
            
            <div v-if="tournoi.bracket" class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-sitemap"></i>
              </div>
              <div class="stat-content">
                <h3>{{ tournoi.bracket.rounds.length }}</h3>
                <p>Tours</p>
              </div>
            </div>
            
            <div v-if="tournoi.miniBrackets" class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-bolt"></i>
              </div>
              <div class="stat-content">
                <h3>{{ tournoi.miniBrackets.length }}</h3>
                <p>Mini-Brackets</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-flag"></i>
              </div>
              <div class="stat-content">
                <h3>{{ getTotalMatchs() }}</h3>
                <p>Matchs totaux</p>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon">
                <i class="pi pi-check-circle"></i>
              </div>
              <div class="stat-content">
                <h3>{{ getMatchsJoues() }}</h3>
                <p>Matchs joués</p>
              </div>
            </div>
          </div>
          
          <!-- Meilleurs buteurs -->
          <div class="top-scorers">
            <h3>Top Équipes (Verres mis)</h3>
            <DataTable 
              :value="topScorers" 
              class="top-table"
            >
              <Column header="Position" style="width: 80px">
                <template #body="{ index }">
                  <span class="position-badge">{{ index + 1 }}</span>
                </template>
              </Column>
              <Column field="nom" header="Équipe">
                <template #body="{ data }">
                  <div class="equipe-cell">
                    <i class="pi pi-shield"></i>
                    {{ data.nom }}
                  </div>
                </template>
              </Column>
              <Column field="verresMis" header="Verres mis" style="width: 100px; text-align: center;">
                <template #body="{ data }">
                  <Tag :value="data.verresMis" severity="warning" />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </TabPanel>
      
      <!-- Onglet Classement Global -->
      <TabPanel header="📊 Classement Global">
        <div class="classement-global">
          <h2>Classement général de toutes les équipes</h2>
          <DataTable 
            :value="classementGlobal" 
            class="classement-table" 
            stripedRows
          >
            <Column header="#" style="width: 60px; text-align: center;">
              <template #body="{ index }">
                <span class="position-badge" :class="getPodiumClass(index)">{{ index + 1 }}</span>
              </template>
            </Column>
            <Column field="nom" header="Équipe" sortable>
              <template #body="{ data }">
                <div class="equipe-cell">
                  <i class="pi pi-shield"></i>
                  {{ data.nom }}
                </div>
              </template>
            </Column>
            <Column field="matchsJoues" header="MJ" style="width: 80px; text-align: center;" sortable />
            <Column field="victoires" header="V" style="width: 80px; text-align: center;" sortable />
            <Column field="defaites" header="D" style="width: 80px; text-align: center;" sortable />
            <Column field="verresMis" header="Verres Mis" style="width: 120px; text-align: center;" sortable>
              <template #body="{ data }">
                <Tag :value="data.verresMis || 0" severity="success" />
              </template>
            </Column>
            <Column field="verresEncaisses" header="Verres Encaissés" style="width: 150px; text-align: center;" sortable>
              <template #body="{ data }">
                <Tag :value="data.verresEncaisses || 0" severity="danger" />
              </template>
            </Column>
            <Column header="Différence" style="width: 120px; text-align: center;" sortable>
              <template #body="{ data }">
                <span :class="getDifferenceClass((data.verresMis || 0) - (data.verresEncaisses || 0))">
                  {{ getDifferenceDisplay((data.verresMis || 0) - (data.verresEncaisses || 0)) }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </TabPanel>
    </TabView>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputNumber from 'primevue/inputnumber'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Card from 'primevue/card'
import BracketView from './BracketView.vue'

const props = defineProps({
  tournoi: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update', 'close'])

// Computed properties pour forcer la réactivité
const classementGlobal = computed(() => {
  return [...props.tournoi.equipes].sort((a, b) => {
    // Trier par victoires décroissant
    if ((b.victoires || 0) !== (a.victoires || 0)) {
      return (b.victoires || 0) - (a.victoires || 0)
    }
    // En cas d'égalité, trier par différence de verres
    const diffA = (a.verresMis || 0) - (a.verresEncaisses || 0)
    const diffB = (b.verresMis || 0) - (b.verresEncaisses || 0)
    if (diffB !== diffA) return diffB - diffA
    // En cas d'égalité, trier par verres mis
    return (b.verresMis || 0) - (a.verresMis || 0)
  })
})

const topScorers = computed(() => {
  return [...props.tournoi.equipes]
    .sort((a, b) => (b.verresMis || 0) - (a.verresMis || 0))
    .slice(0, 5)
})

function canValidateMatch(match) {
  return match.score1 !== null && match.score2 !== null
}

function updateScore(poule, match) {
  // Forcer la réactivité
  emit('update', {...props.tournoi})
}

function validerMatch(poule, match) {
  if (!canValidateMatch(match)) return
  
  match.joue = true
  
  // Mettre à jour les statistiques des équipes
  const equipe1 = match.equipe1
  const equipe2 = match.equipe2
  
  equipe1.matchsJoues = (equipe1.matchsJoues || 0) + 1
  equipe2.matchsJoues = (equipe2.matchsJoues || 0) + 1
  
  equipe1.verresMis = (equipe1.verresMis || 0) + match.score1
  equipe1.verresEncaisses = (equipe1.verresEncaisses || 0) + match.score2
  equipe2.verresMis = (equipe2.verresMis || 0) + match.score2
  equipe2.verresEncaisses = (equipe2.verresEncaisses || 0) + match.score1
  
  equipe1.goalAverage = equipe1.verresMis - equipe1.verresEncaisses
  equipe2.goalAverage = equipe2.verresMis - equipe2.verresEncaisses
  
  if (match.score1 > match.score2) {
    // Équipe 1 gagne
    equipe1.victoires = (equipe1.victoires || 0) + 1
    equipe1.points = (equipe1.points || 0) + 3
    equipe2.defaites = (equipe2.defaites || 0) + 1
  } else if (match.score1 < match.score2) {
    // Équipe 2 gagne
    equipe2.victoires = (equipe2.victoires || 0) + 1
    equipe2.points = (equipe2.points || 0) + 3
    equipe1.defaites = (equipe1.defaites || 0) + 1
  } else {
    // Match nul
    equipe1.nuls = (equipe1.nuls || 0) + 1
    equipe2.nuls = (equipe2.nuls || 0) + 1
    equipe1.points = (equipe1.points || 0) + 1
    equipe2.points = (equipe2.points || 0) + 1
  }
  
  // Forcer la réactivité en créant une copie profonde
  emit('update', {...props.tournoi})
}

function modifierMatch(match) {
  // Réinitialiser les stats avant de modifier
  const equipe1 = match.equipe1
  const equipe2 = match.equipe2
  
  equipe1.matchsJoues = (equipe1.matchsJoues || 0) - 1
  equipe2.matchsJoues = (equipe2.matchsJoues || 0) - 1
  
  equipe1.verresMis = (equipe1.verresMis || 0) - match.score1
  equipe1.verresEncaisses = (equipe1.verresEncaisses || 0) - match.score2
  equipe2.verresMis = (equipe2.verresMis || 0) - match.score2
  equipe2.verresEncaisses = (equipe2.verresEncaisses || 0) - match.score1
  
  equipe1.goalAverage = equipe1.verresMis - equipe1.verresEncaisses
  equipe2.goalAverage = equipe2.verresMis - equipe2.verresEncaisses
  
  if (match.score1 > match.score2) {
    equipe1.victoires = (equipe1.victoires || 0) - 1
    equipe1.points = (equipe1.points || 0) - 3
    equipe2.defaites = (equipe2.defaites || 0) - 1
  } else if (match.score1 < match.score2) {
    equipe2.victoires = (equipe2.victoires || 0) - 1
    equipe2.points = (equipe2.points || 0) - 3
    equipe1.defaites = (equipe1.defaites || 0) - 1
  } else {
    equipe1.nuls = (equipe1.nuls || 0) - 1
    equipe2.nuls = (equipe2.nuls || 0) - 1
    equipe1.points = (equipe1.points || 0) - 1
    equipe2.points = (equipe2.points || 0) - 1
  }
  
  match.joue = false
  
  // Forcer la réactivité en créant une copie profonde
  emit('update', {...props.tournoi})
}

function getClassementPoule(poule) {
  // Créer une copie pour éviter de muter l'original lors du sort
  const equipesCopy = poule.equipes.map(e => ({...e}))
  
  return equipesCopy.sort((a, b) => {
    // Trier par points décroissant (s'assurer que c'est un nombre)
    const pointsA = a.points || 0
    const pointsB = b.points || 0
    if (pointsB !== pointsA) return pointsB - pointsA
    
    // En cas d'égalité, trier par goal average
    const gaA = a.goalAverage || 0
    const gaB = b.goalAverage || 0
    if (gaB !== gaA) return gaB - gaA
    
    // En cas d'égalité, trier par verres mis
    const vmA = a.verresMis || 0
    const vmB = b.verresMis || 0
    return vmB - vmA
  })
}

function getPouleKey(poule) {
  // Générer une clé unique basée sur les stats de toutes les équipes
  return poule.equipes.map(e => `${e.id}-${e.points || 0}-${e.matchsJoues || 0}-${e.verresMis || 0}`).join('|')
}

function getTotalMatchs() {
  let total = 0
  
  if (props.tournoi.poules) {
    total += props.tournoi.poules.reduce((sum, poule) => sum + poule.matchs.length, 0)
  }
  
  if (props.tournoi.bracket) {
    total += props.tournoi.bracket.rounds.reduce((sum, round) => sum + round.matchs.length, 0)
  }
  
  if (props.tournoi.miniBrackets) {
    props.tournoi.miniBrackets.forEach(mb => {
      total += mb.bracket.rounds.reduce((sum, round) => sum + round.matchs.length, 0)
    })
  }
  
  if (props.tournoi.bracketFinal) {
    total += props.tournoi.bracketFinal.rounds.reduce((sum, round) => sum + round.matchs.length, 0)
  }
  
  return total
}

function getMatchsJoues() {
  let joues = 0
  
  if (props.tournoi.poules) {
    joues += props.tournoi.poules.reduce((sum, poule) => {
      return sum + poule.matchs.filter(m => m.joue).length
    }, 0)
  }
  
  if (props.tournoi.bracket) {
    joues += props.tournoi.bracket.rounds.reduce((sum, round) => {
      return sum + round.matchs.filter(m => m.joue).length
    }, 0)
  }
  
  if (props.tournoi.miniBrackets) {
    props.tournoi.miniBrackets.forEach(mb => {
      joues += mb.bracket.rounds.reduce((sum, round) => {
        return sum + round.matchs.filter(m => m.joue).length
      }, 0)
    })
  }
  
  if (props.tournoi.bracketFinal) {
    joues += props.tournoi.bracketFinal.rounds.reduce((sum, round) => {
      return sum + round.matchs.filter(m => m.joue).length
    }, 0)
  }
  
  return joues
}


function getPodiumClass(index) {
  if (index === 0) return 'gold'
  if (index === 1) return 'silver'
  if (index === 2) return 'bronze'
  return ''
}

function getDifferenceClass(diff) {
  if (diff > 0) return 'positive'
  if (diff < 0) return 'negative'
  return 'neutral'
}

function getDifferenceDisplay(diff) {
  if (diff > 0) return `+${diff}`
  return diff.toString()
}

function saveChanges() {
  emit('update', props.tournoi)
}

function getTypeLabel() {
  const labels = {
    'poule': '🏆 Phase de poule',
    'bracket': '🍺 Bracket Beer Pong',
    'hybride': '🔥 Hybride (Poule + Bracket)',
    'multibracket': '⚡ Multi-Bracket'
  }
  return labels[props.tournoi.type] || props.tournoi.type
}

function getTypeSeverity() {
  const severities = {
    'poule': 'info',
    'bracket': 'warning',
    'hybride': 'danger',
    'multibracket': 'success'
  }
  return severities[props.tournoi.type] || 'info'
}

function updateMiniBracket(miniBracket) {
  // Vérifier si le mini-bracket est terminé (a un champion)
  if (miniBracket.bracket.champion) {
    miniBracket.champion = miniBracket.bracket.champion
    
    // Trouver le finaliste (perdant de la finale)
    const finale = miniBracket.bracket.rounds[miniBracket.bracket.rounds.length - 1].matchs[0]
    if (finale && finale.joue) {
      miniBracket.finaliste = finale.equipe1.id === miniBracket.champion.id ? finale.equipe2 : finale.equipe1
    }
  }
  
  emit('update', props.tournoi)
}

function getQualifiesCount() {
  if (!props.tournoi.miniBrackets) return 0
  let count = 0
  props.tournoi.miniBrackets.forEach(mb => {
    if (mb.champion) count++
    if (mb.finaliste) count++
  })
  return count
}

function tousMiniBracketsTermines() {
  if (!props.tournoi.miniBrackets) return false
  return props.tournoi.miniBrackets.every(mb => mb.champion && mb.finaliste)
}

function genererBracketFinal() {
  if (!confirm('Générer le bracket final ? Les mini-brackets ne seront plus modifiables.')) return
  
  // Récupérer tous les qualifiés (champions et finalistes)
  const qualifies = []
  props.tournoi.miniBrackets.forEach(mb => {
    if (mb.champion) qualifies.push(mb.champion)
    if (mb.finaliste) qualifies.push(mb.finaliste)
  })
  
  // Générer le bracket final
  props.tournoi.bracketFinal = genererBracketDepuisEquipes(qualifies)
  props.tournoi.phaseActuelle = 'finale'
  
  emit('update', props.tournoi)
}

// Fonction pour mélanger un tableau (Fisher-Yates)
function melangerArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

// Tirage au sort pour brackets
function tirageAuSortBracket() {
  if (!confirm('🎲 Effectuer un tirage au sort des équipes ?\nCela va redistribuer toutes les équipes aléatoirement dans le bracket.')) return
  
  // Récupérer toutes les équipes du bracket
  const equipes = []
  props.tournoi.bracket.rounds[0].matchs.forEach(match => {
    if (match.equipe1) equipes.push(match.equipe1)
    if (match.equipe2) equipes.push(match.equipe2)
  })
  
  // Mélanger les équipes
  const equipesMelangees = melangerArray(equipes)
  
  // Régénérer le bracket avec les équipes mélangées
  props.tournoi.bracket = genererBracketDepuisEquipes(equipesMelangees)
  
  emit('update', props.tournoi)
}

// Tirage au sort pour mini-brackets
function tirageAuSortMiniBrackets() {
  if (!confirm('🎲 Effectuer un tirage au sort des équipes ?\nCela va redistribuer toutes les équipes aléatoirement dans les mini-brackets.')) return
  
  // Récupérer toutes les équipes de tous les mini-brackets
  const equipes = []
  props.tournoi.miniBrackets.forEach(mb => {
    mb.bracket.rounds[0].matchs.forEach(match => {
      if (match.equipe1) equipes.push(match.equipe1)
      if (match.equipe2) equipes.push(match.equipe2)
    })
  })
  
  // Mélanger les équipes
  const equipesMelangees = melangerArray(equipes)
  
  // Régénérer les mini-brackets
  const nombreBrackets = props.tournoi.miniBrackets.length
  const equipesParBracket = Math.ceil(equipesMelangees.length / nombreBrackets)
  
  props.tournoi.miniBrackets = []
  for (let i = 0; i < nombreBrackets; i++) {
    const equipesMiniBracket = equipesMelangees.slice(i * equipesParBracket, (i + 1) * equipesParBracket)
    const bracket = genererBracketDepuisEquipes(equipesMiniBracket)
    
    props.tournoi.miniBrackets.push({
      id: `minibracket-${Date.now()}-${i}`,
      nom: `Bracket ${String.fromCharCode(65 + i)}`,
      bracket: bracket,
      champion: null,
      finaliste: null
    })
  }
  
  emit('update', props.tournoi)
}

// Tirage au sort pour poules
function tirageAuSortPoules() {
  if (!confirm('🎲 Effectuer un tirage au sort des équipes ?\nCela va redistribuer toutes les équipes aléatoirement dans les poules.')) return
  
  // Récupérer toutes les équipes de toutes les poules
  const equipes = []
  props.tournoi.poules.forEach(poule => {
    poule.equipes.forEach(equipe => {
      equipes.push(equipe)
    })
  })
  
  // Mélanger les équipes
  const equipesMelangees = melangerArray(equipes)
  
  // Régénérer les poules
  const nombrePoules = props.tournoi.poules.length
  const equipesParPoule = Math.ceil(equipesMelangees.length / nombrePoules)
  
  props.tournoi.poules = []
  for (let i = 0; i < nombrePoules; i++) {
    const equipesPoule = equipesMelangees.slice(i * equipesParPoule, (i + 1) * equipesParPoule)
    
    // Générer les matchs (tous contre tous)
    const matchs = []
    for (let j = 0; j < equipesPoule.length; j++) {
      for (let k = j + 1; k < equipesPoule.length; k++) {
        matchs.push({
          id: `match-${Date.now()}-${j}-${k}`,
          equipe1: equipesPoule[j],
          equipe2: equipesPoule[k],
          score1: null,
          score2: null,
          joue: false
        })
      }
    }
    
    props.tournoi.poules.push({
      id: `poule-${Date.now()}-${i}`,
      nom: `Poule ${String.fromCharCode(65 + i)}`,
      equipes: equipesPoule,
      matchs: matchs
    })
  }
  
  emit('update', props.tournoi)
}

// Générer une feuille de matchs imprimable
function genererFeuilleMatchs() {
  const matchs = []
  
  // Collecter les matchs des mini-brackets
  if (props.tournoi.miniBrackets) {
    props.tournoi.miniBrackets.forEach((mb, index) => {
      mb.bracket.rounds.forEach((round, roundIndex) => {
        round.matchs.forEach((match, matchIndex) => {
          // Ignorer seulement les byes
          if (!match.isBye) {
            matchs.push({
              section: `${mb.nom} - ${round.nom}`,
              numero: matchs.length + 1,
              equipe1: match.equipe1 ? match.equipe1.nom : 'En attente...',
              equipe2: match.equipe2 ? match.equipe2.nom : 'En attente...',
              joue: match.joue,
              enAttente: !match.equipe1 || !match.equipe2,
              score: match.joue ? `${match.score1} - ${match.score2}` : ''
            })
          }
        })
      })
    })
  }
  
  // Collecter les matchs du bracket principal
  if (props.tournoi.bracket) {
    props.tournoi.bracket.rounds.forEach((round) => {
      round.matchs.forEach((match) => {
        // Ignorer seulement les byes
        if (!match.isBye) {
          matchs.push({
            section: round.nom,
            numero: matchs.length + 1,
            equipe1: match.equipe1 ? match.equipe1.nom : 'En attente...',
            equipe2: match.equipe2 ? match.equipe2.nom : 'En attente...',
            joue: match.joue,
            enAttente: !match.equipe1 || !match.equipe2,
            score: match.joue ? `${match.score1} - ${match.score2}` : ''
          })
        }
      })
    })
  }
  
  // Collecter les matchs du bracket final (PHASE FINALE)
  if (props.tournoi.bracketFinal) {
    props.tournoi.bracketFinal.rounds.forEach((round) => {
      round.matchs.forEach((match) => {
        // Ignorer seulement les byes
        if (!match.isBye) {
          matchs.push({
            section: `🏆 BRACKET FINAL - ${round.nom}`,
            numero: matchs.length + 1,
            equipe1: match.equipe1 ? match.equipe1.nom : 'En attente...',
            equipe2: match.equipe2 ? match.equipe2.nom : 'En attente...',
            joue: match.joue,
            enAttente: !match.equipe1 || !match.equipe2,
            score: match.joue ? `${match.score1} - ${match.score2}` : ''
          })
        }
      })
    })
  } else if (props.tournoi.type === 'multibracket' && props.tournoi.phaseActuelle === 'minibrackets') {
    // Si le bracket final n'existe pas encore, générer des matchs vides pour la feuille de backup
    // Pour 12 qualifiés (6 champions + 6 finalistes) = bracket de 16 avec 4 byes
    const roundsNames = ['1er tour', 'Quarts de finale', 'Demi-finales', 'Finale']
    const matchsPerRound = [8, 4, 2, 1]
    
    roundsNames.forEach((roundName, roundIndex) => {
      for (let i = 0; i < matchsPerRound[roundIndex]; i++) {
        matchs.push({
          section: `🏆 BRACKET FINAL - ${roundName}`,
          numero: matchs.length + 1,
          equipe1: 'En attente...',
          equipe2: 'En attente...',
          joue: false,
          enAttente: true,
          score: ''
        })
      }
    })
  }
  
  // Collecter les matchs des poules
  if (props.tournoi.poules) {
    props.tournoi.poules.forEach((poule) => {
      poule.matchs.forEach((match) => {
        matchs.push({
          section: poule.nom,
          numero: matchs.length + 1,
          equipe1: match.equipe1.nom,
          equipe2: match.equipe2.nom,
          joue: match.joue,
          score: match.joue ? `${match.score1} - ${match.score2}` : ''
        })
      })
    })
  }
  
  // Générer le HTML de la feuille
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Feuille de matchs - ${props.tournoi.nom}</title>
      <style>
        @media print {
          @page { margin: 1cm; }
          body { margin: 0; }
          .no-print { display: none; }
        }
        body {
          font-family: Arial, sans-serif;
          padding: 20px;
          background: white;
          color: black;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #333;
          padding-bottom: 15px;
        }
        h1 { margin: 0; font-size: 2rem; }
        .meta { 
          color: #666; 
          margin-top: 10px;
          font-size: 0.9rem;
        }
        .section-title {
          background: #667eea;
          color: white;
          padding: 10px 15px;
          margin: 20px 0 10px 0;
          font-weight: bold;
          font-size: 1.1rem;
          border-radius: 5px;
          page-break-before: avoid;
          page-break-after: avoid;
        }
        .section-title:has(+ .match):first-of-type {
          margin-top: 0;
        }
        .section-final {
          background: linear-gradient(135deg, #FFD700, #FFA500) !important;
          color: #000 !important;
          font-size: 1.3rem !important;
          padding: 15px 20px !important;
          text-align: center;
          box-shadow: 0 4px 12px rgba(255, 215, 0, 0.4);
          border: 3px solid #FFD700;
        }
        .match {
          display: grid;
          grid-template-columns: 50px 1fr 80px 1fr 100px;
          gap: 10px;
          padding: 12px 15px;
          margin: 5px 0;
          border: 2px solid #ddd;
          border-radius: 5px;
          align-items: center;
          background: white;
          page-break-inside: avoid;
        }
        .match:hover {
          background: #f5f5f5;
        }
        .match.played {
          background: #e8f5e9;
          border-color: #4caf50;
        }
        .match.pending {
          background: #fff3e0;
          border-color: #ff9800;
          opacity: 0.8;
        }
        .match.pending .equipe {
          font-style: italic;
          color: #999;
        }
        .numero {
          font-weight: bold;
          font-size: 1.2rem;
          text-align: center;
          color: #667eea;
        }
        .equipe {
          font-weight: 600;
          font-size: 1rem;
        }
        .vs {
          text-align: center;
          font-weight: bold;
          color: #999;
        }
        .score-box {
          border: 2px solid #333;
          padding: 8px;
          text-align: center;
          min-height: 30px;
          border-radius: 3px;
          font-weight: bold;
          font-size: 1.1rem;
        }
        .buttons {
          margin: 20px 0;
          text-align: center;
        }
        button {
          background: #667eea;
          color: white;
          border: none;
          padding: 12px 30px;
          font-size: 1rem;
          border-radius: 5px;
          cursor: pointer;
          margin: 0 10px;
        }
        button:hover {
          background: #5568d3;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #ddd;
          text-align: center;
          color: #999;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📋 ${props.tournoi.nom}</h1>
        <div class="meta">
          ${getTypeLabel()} • ${props.tournoi.equipes.length} équipes • ${matchs.length} matchs
          <br>Généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
        </div>
      </div>
      
      <div class="buttons no-print">
        <button onclick="window.print()">🖨️ Imprimer</button>
        <button onclick="window.close()">✖️ Fermer</button>
      </div>
      
      <div class="legend" style="display: flex; justify-content: center; gap: 2rem; margin: 20px 0; padding: 15px; background: #f5f5f5; border-radius: 8px;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; background: #e8f5e9; border: 2px solid #4caf50; border-radius: 4px;"></div>
          <span>Match joué</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; background: #fff3e0; border: 2px solid #ff9800; border-radius: 4px;"></div>
          <span>En attente</span>
        </div>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 30px; height: 30px; background: linear-gradient(135deg, #FFD700, #FFA500); border: 2px solid #FFD700; border-radius: 4px;"></div>
          <span>Bracket Final</span>
        </div>
      </div>
      
      ${generateMatchsHTML(matchs)}
      
      <div class="footer">
        Tournoi Beer Pong HES-SO • Plateforme de gestion de tournois
      </div>
    </body>
    </html>
  `
  
  // Ouvrir dans une nouvelle fenêtre
  const newWindow = window.open('', '_blank', 'width=900,height=800')
  newWindow.document.write(html)
  newWindow.document.close()
}

function generateMatchsHTML(matchs) {
  let html = ''
  let currentSection = ''
  
  matchs.forEach(match => {
    if (match.section !== currentSection) {
      const isFinal = match.section.includes('BRACKET FINAL') || match.section.includes('Finale')
      const sectionClass = isFinal ? 'section-title section-final' : 'section-title'
      html += `<div class="${sectionClass}">${match.section}</div>`
      currentSection = match.section
    }
    
    const matchClass = match.joue ? 'played' : (match.enAttente ? 'pending' : '')
    
    html += `
      <div class="match ${matchClass}">
        <div class="numero">#${match.numero}</div>
        <div class="equipe">${match.equipe1}</div>
        <div class="vs">VS</div>
        <div class="equipe">${match.equipe2}</div>
        <div class="score-box">${match.score || '___ - ___'}</div>
      </div>
    `
  })
  
  return html
}

// Synchroniser le nom d'une équipe partout dans le tournoi
function synchroniserNomEquipe(equipe) {
  const nouveauNom = equipe.nom
  const equipeId = equipe.id
  
  // Fonction helper pour mettre à jour le nom si l'ID correspond
  const updateEquipeNom = (eq) => {
    if (eq && eq.id === equipeId) {
      eq.nom = nouveauNom
    }
  }
  
  // Synchroniser dans les brackets
  if (props.tournoi.bracket) {
    props.tournoi.bracket.rounds.forEach(round => {
      round.matchs.forEach(match => {
        updateEquipeNom(match.equipe1)
        updateEquipeNom(match.equipe2)
        updateEquipeNom(match.gagnant)
      })
    })
  }
  
  // Synchroniser dans les mini-brackets
  if (props.tournoi.miniBrackets) {
    props.tournoi.miniBrackets.forEach(mb => {
      updateEquipeNom(mb.champion)
      updateEquipeNom(mb.finaliste)
      mb.bracket.rounds.forEach(round => {
        round.matchs.forEach(match => {
          updateEquipeNom(match.equipe1)
          updateEquipeNom(match.equipe2)
          updateEquipeNom(match.gagnant)
        })
      })
    })
  }
  
  // Synchroniser dans le bracket final
  if (props.tournoi.bracketFinal) {
    props.tournoi.bracketFinal.rounds.forEach(round => {
      round.matchs.forEach(match => {
        updateEquipeNom(match.equipe1)
        updateEquipeNom(match.equipe2)
        updateEquipeNom(match.gagnant)
      })
    })
  }
  
  // Synchroniser dans les poules
  if (props.tournoi.poules) {
    props.tournoi.poules.forEach(poule => {
      poule.equipes.forEach(updateEquipeNom)
      poule.matchs.forEach(match => {
        updateEquipeNom(match.equipe1)
        updateEquipeNom(match.equipe2)
      })
    })
  }
  
  // Sauvegarder les changements
  emit('update', props.tournoi)
}

function genererBracketHybride() {
  if (!confirm('Passer à la phase bracket finale ? Les poules ne seront plus modifiables.')) return
  
  // Récupérer les meilleures équipes de chaque poule
  const meilleuresEquipes = []
  const nbQualifiesParPoule = props.tournoi.qualifiesParPoule || 2
  
  props.tournoi.poules.forEach(poule => {
    const classement = getClassementPoule(poule)
    // Prendre le nombre configuré de qualifiés par poule
    const nbQualifies = Math.min(nbQualifiesParPoule, classement.length)
    meilleuresEquipes.push(...classement.slice(0, nbQualifies))
  })
  
  // Générer le bracket avec ces équipes
  props.tournoi.bracket = genererBracketDepuisEquipes(meilleuresEquipes)
  props.tournoi.phaseActuelle = 'bracket'
  
  emit('update', props.tournoi)
}

function genererBracketDepuisEquipes(equipes) {
  const nbEquipes = equipes.length
  const rounds = []
  
  // Trouver la prochaine puissance de 2 pour le bracket
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(nbEquipes)))
  const nbByes = bracketSize - nbEquipes
  const nbRounds = Math.ceil(Math.log2(bracketSize))
  
  // Premier tour avec gestion des byes
  const premierTour = []
  const nbMatchsPremierTour = Math.floor(bracketSize / 2)
  
  let equipeIndex = 0
  
  for (let i = 0; i < nbMatchsPremierTour; i++) {
    const match = {
      id: `match-r1-${i}`,
      equipe1: null,
      equipe2: null,
      score1: null,
      score2: null,
      gagnant: null,
      joue: false,
      isBye: false
    }
    
    // Distribuer les byes de manière équilibrée
    if (i < nbByes) {
      // Ce match est un bye - une seule équipe passe directement
      if (equipeIndex < equipes.length) {
        match.equipe1 = equipes[equipeIndex++]
        match.isBye = true
        match.joue = true
        match.gagnant = match.equipe1
      }
    } else {
      // Match normal avec 2 équipes
      if (equipeIndex < equipes.length) match.equipe1 = equipes[equipeIndex++]
      if (equipeIndex < equipes.length) match.equipe2 = equipes[equipeIndex++]
    }
    
    premierTour.push(match)
  }
  
  rounds.push({
    nom: getRoundName(1, nbRounds),
    matchs: premierTour
  })
  
  // Tours suivants
  for (let r = 2; r <= nbRounds; r++) {
    const nbMatchs = Math.pow(2, nbRounds - r)
    const matchs = []
    for (let m = 0; m < nbMatchs; m++) {
      matchs.push({
        id: `match-r${r}-${m}`,
        equipe1: null,
        equipe2: null,
        score1: null,
        score2: null,
        gagnant: null,
        joue: false,
        isBye: false
      })
    }
    rounds.push({
      nom: getRoundName(r, nbRounds),
      matchs: matchs
    })
  }
  
  return {
    rounds: rounds,
    champion: null,
    nbByes: nbByes
  }
}

function getRoundName(roundNum, totalRounds) {
  if (roundNum === totalRounds) return 'Finale 🏆'
  if (roundNum === totalRounds - 1) return 'Demi-finales'
  if (roundNum === totalRounds - 2) return 'Quarts de finale'
  if (roundNum === 1) return '1er tour'
  return `${roundNum}e tour`
}
</script>

<style scoped>
.tournoi-details {
  padding: 1rem 0;
}

.tournoi-header-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tournoi-type-badge {
  display: flex;
  justify-content: center;
}

.tournoi-type-badge :deep(.p-tag) {
  font-size: 1.2rem;
  padding: 0.75rem 1.5rem;
  font-weight: 700;
}

.tirage-sort-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: rgba(255, 193, 7, 0.1);
  border-radius: 12px;
  border: 2px solid rgba(255, 193, 7, 0.3);
}

.tirage-sort-section .p-button {
  font-size: 1.1rem;
  padding: 0.75rem 2rem;
}

.tirage-sort-section small {
  color: var(--orange-600);
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.phase-transition {
  margin-top: 3rem;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(237, 137, 54, 0.1));
  border-radius: 12px;
  border: 2px dashed var(--primary-color);
}

.phase-transition .p-button {
  font-size: 1.2rem;
  padding: 1rem 2rem;
}

.phase-transition .text-muted {
  color: var(--text-color-secondary);
  font-size: 0.95rem;
  margin-top: 0.5rem;
}

.poules-container {
  display: flex;
  flex-direction: column;
  gap: 3rem;
}

.minibrackets-container {
  display: flex;
  flex-direction: column;
  gap: 4rem;
}

.minibracket-section {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--surface-border);
}

.minibracket-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid var(--surface-border);
}

.minibracket-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--primary-color);
}

.minibracket-results {
  display: flex;
  gap: 0.5rem;
}

.qualifies-summary {
  margin-top: 3rem;
  padding: 2rem;
  background: var(--surface-card);
  border-radius: 12px;
  border: 2px solid var(--surface-border);
}

.qualifies-summary h3 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 1.5rem;
  text-align: center;
}

.qualifies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.qualifie-card {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid var(--surface-border);
}

.qualifie-card h4 {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary-color);
  margin-bottom: 1rem;
  text-align: center;
}

.qualifie-item {
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.qualifie-item.champion {
  background: rgba(34, 197, 94, 0.1);
  border: 2px solid rgba(34, 197, 94, 0.3);
  color: #22c55e;
}

.qualifie-item.finaliste {
  background: rgba(59, 130, 246, 0.1);
  border: 2px solid rgba(59, 130, 246, 0.3);
  color: #3b82f6;
}

.qualifie-item.pending {
  background: rgba(156, 163, 175, 0.1);
  border: 2px dashed rgba(156, 163, 175, 0.3);
  color: var(--text-color-secondary);
  font-style: italic;
}

.total-qualifies {
  text-align: center;
  font-size: 1.2rem;
  color: var(--primary-color);
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 8px;
  margin-top: 1rem;
}

.poule-section {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.poule-title {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--primary-color);
  text-align: center;
}

.matchs-section {
  margin-bottom: 3rem;
}

.matchs-section h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.matchs-grid {
  display: grid;
  gap: 1rem;
}

.match-card {
  background: var(--surface-ground);
  padding: 1.5rem;
  border-radius: 8px;
  border: 2px solid var(--surface-border);
  transition: all 0.3s ease;
}

.match-card.match-joue {
  border-color: var(--green-500);
  background: linear-gradient(to right, rgba(34, 197, 94, 0.05), transparent);
}

.match-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.match-actions .p-button,
.match-actions-bracket .p-button {
  min-height: 44px;
  touch-action: manipulation;
}

/* Tables scrollables sur mobile */
.classement-container,
.top-scorers {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.classement-table :deep(.p-datatable-wrapper),
.top-table :deep(.p-datatable-wrapper) {
  overflow-x: auto;
}

.match-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.equipe {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 300px;
}

.equipe:first-child {
  justify-content: flex-end;
}

.equipe:last-child {
  justify-content: flex-start;
}

.equipe-nom {
  font-weight: 600;
  font-size: 1rem;
  display: flex;
  align-items: center;
  min-height: 44px;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-input {
  width: 80px;
  flex-shrink: 0;
}

.score-input :deep(.p-inputnumber-input) {
  height: 48px;
  text-align: center;
  font-size: 1.3rem;
  font-weight: 700;
  width: 100%;
}

.vs {
  font-weight: 700;
  color: var(--text-color-secondary);
  font-size: 1.2rem;
  min-width: 50px;
  text-align: center;
  flex-shrink: 0;
}

.match-actions {
  display: flex;
  justify-content: center;
}

.classement-section {
  margin-top: 2rem;
}

.classement-section h4 {
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.classement-table {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.equipe-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
}

.positive {
  color: var(--green-600);
  font-weight: 600;
}

.negative {
  color: var(--red-600);
  font-weight: 600;
}

/* Onglet Équipes */
.equipes-container {
  padding: 2rem 0;
}

.equipes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.equipe-card {
  transition: all 0.3s ease;
}

.equipe-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
}

.equipe-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.equipe-header i {
  font-size: 1.5rem;
  color: var(--primary-color);
}

.equipe-name-input {
  flex: 1;
  font-weight: 700;
  font-size: 1.2rem;
}

.equipe-stats {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-weight: 600;
  color: var(--text-color-secondary);
}

.stat-value {
  font-weight: 700;
  font-size: 1.1rem;
}

/* Onglet Statistiques */
.stats-container {
  padding: 2rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

.stat-icon {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.8rem;
}

.stat-content h3 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
}

.stat-content p {
  margin: 0.25rem 0 0;
  opacity: 0.9;
}

.top-scorers {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.top-scorers h3 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.position-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 700;
}

.position-badge.gold {
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #000;
  font-size: 1.1rem;
  box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
}

.position-badge.silver {
  background: linear-gradient(135deg, #C0C0C0, #808080);
  color: #000;
  font-size: 1.1rem;
  box-shadow: 0 0 10px rgba(192, 192, 192, 0.5);
}

.position-badge.bronze {
  background: linear-gradient(135deg, #CD7F32, #8B4513);
  color: #fff;
  font-size: 1.1rem;
  box-shadow: 0 0 10px rgba(205, 127, 50, 0.5);
}

/* Classement Global */
.classement-global {
  padding: 2rem 0;
}

.classement-global h2 {
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 2rem;
  color: var(--primary-color);
}

.classement-table :deep(.p-datatable-tbody > tr:nth-child(1)) {
  background: rgba(255, 215, 0, 0.1);
  font-weight: 700;
}

.classement-table :deep(.p-datatable-tbody > tr:nth-child(2)) {
  background: rgba(192, 192, 192, 0.1);
  font-weight: 700;
}

.classement-table :deep(.p-datatable-tbody > tr:nth-child(3)) {
  background: rgba(205, 127, 50, 0.1);
  font-weight: 700;
}

.neutral {
  color: var(--text-color-secondary);
  font-weight: 600;
}

@media (max-width: 1024px) {
  .minibrackets-container {
    gap: 2rem;
  }
  
  .minibracket-section {
    padding: 1.5rem;
  }
  
  .qualifies-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .tournoi-details {
    padding: 1rem;
  }
  
  .tournoi-header-actions {
    flex-direction: column;
    gap: 1rem;
  }
  
  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .header-info {
    align-items: center;
  }
  
  .header-title {
    font-size: 1.5rem;
  }
  
  .header-actions {
    width: 100%;
    justify-content: center;
  }
  
  .header-actions .p-button {
    flex: 1;
    min-width: 0;
  }
  
  /* Matches de poule */
  .match-content {
    flex-direction: column;
  }
  
  .equipe {
    width: 100%;
    justify-content: space-between;
  }
  
  .vs {
    padding: 0.5rem 0;
  }
  
  .match-actions {
    width: 100%;
  }
  
  .match-actions .p-button {
    width: 100%;
  }
  
  /* Grilles */
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .equipes-grid {
    grid-template-columns: 1fr;
  }
  
  /* Mini-brackets */
  .minibrackets-container {
    gap: 2rem;
  }
  
  .minibracket-section {
    padding: 1rem;
  }
  
  .minibracket-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .minibracket-title {
    font-size: 1.5rem;
  }
  
  .minibracket-results {
    justify-content: center;
    flex-wrap: wrap;
  }
  
  .qualifies-grid {
    grid-template-columns: 1fr;
  }
  
  .qualifie-card h4 {
    font-size: 1rem;
  }
  
  .qualifie-item {
    padding: 0.5rem;
    font-size: 0.9rem;
  }
  
  .total-qualifies {
    font-size: 1rem;
    padding: 0.75rem;
  }
  
  .phase-transition .p-button {
    width: 100%;
    font-size: 0.9rem;
  }
  
  /* Tableaux */
  .classement-table :deep(.p-datatable) {
    font-size: 0.85rem;
  }
  
  .classement-table :deep(.p-datatable-thead > tr > th) {
    padding: 0.5rem 0.25rem;
  }
  
  .classement-table :deep(.p-datatable-tbody > tr > td) {
    padding: 0.5rem 0.25rem;
  }
  
  /* Classement global */
  .classement-global h2 {
    font-size: 1.5rem;
  }
  
  .position-badge {
    width: 25px;
    height: 25px;
    font-size: 0.85rem;
  }
  
  .position-badge.gold,
  .position-badge.silver,
  .position-badge.bronze {
    font-size: 0.95rem;
  }
  
  /* Statistiques */
  .stat-card {
    flex-direction: column;
    text-align: center;
    padding: 1.5rem;
  }
  
  .stat-icon {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }
  
  .stat-content h3 {
    font-size: 1.5rem;
  }
  
  .top-scorers {
    padding: 1.5rem;
  }
  
  .top-scorers h3 {
    font-size: 1.25rem;
  }
}

@media (max-width: 480px) {
  .tournoi-details {
    padding: 0.5rem;
  }
  
  .tournoi-header-actions {
    padding: 0.75rem;
  }
  
  .tournoi-header-actions .p-button {
    font-size: 0.9rem;
    padding: 0.5rem 1rem;
  }
  
  .header {
    padding: 1rem;
  }
  
  .header-title {
    font-size: 1.25rem;
  }
  
  .header-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  /* Poules */
  .poule-section {
    padding: 1rem;
  }
  
  .poule-title {
    font-size: 1.25rem;
  }
  
  .equipe-name {
    font-size: 0.9rem;
  }
  
  .score-input {
    width: 50px;
  }
  
  /* Mini-brackets */
  .minibracket-section {
    padding: 0.75rem;
  }
  
  .minibracket-title {
    font-size: 1.25rem;
  }
  
  .qualifies-summary {
    padding: 1rem;
  }
  
  .qualifies-summary h3 {
    font-size: 1.25rem;
  }
  
  /* Statistiques */
  .stats-grid {
    gap: 0.75rem;
  }
  
  .stat-card {
    padding: 1rem;
  }
  
  .stat-icon {
    width: 40px;
    height: 40px;
    font-size: 1.25rem;
  }
  
  .stat-content h3 {
    font-size: 1.25rem;
  }
  
  .stat-content p {
    font-size: 0.85rem;
  }
  
  /* Tableaux */
  .classement-table :deep(.p-datatable) {
    font-size: 0.75rem;
  }
  
  .equipe-cell {
    font-size: 0.85rem;
  }
  
  .equipe-cell i {
    display: none;
  }
}
</style>
