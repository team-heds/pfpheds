<template>
  <div class="tournois-root">
    <Navbar />
    
    <div class="tournois-layout">
      <!-- Contenu principal -->
      <main class="main-content">
        <div class="page-header">
          <h1 class="title">Tournois</h1>
          <p class="subtitle">Gérez vos tournois en phase de poule</p>
        </div>
        
        <!-- Actions principales -->
        <div class="actions-bar">
          <Button 
            label="Nouveau tournoi" 
            icon="pi pi-plus" 
            class="p-button-primary"
            @click="showCreateDialog = true"
          />
          <Button 
            label="📋 Exemple HES-SO 2025" 
            icon="pi pi-file-import" 
            class="p-button-help"
            @click="chargerExempleHESSO"
          />
        </div>
        
        <!-- Liste des tournois -->
        <div v-if="tournois.length === 0" class="empty-state">
          <i class="pi pi-trophy" style="font-size: 3rem; color: #ccc;"></i>
          <h3>Aucun tournoi</h3>
          <p>Créez votre premier tournoi pour commencer</p>
        </div>
        
        <div v-else class="tournois-grid">
          <Card 
            v-for="tournoi in tournois" 
            :key="tournoi.id"
            class="tournoi-card"
            @click="openTournoi(tournoi)"
          >
            <template #header>
              <div class="card-header">
                <div class="tournoi-icon">
                  <i class="pi pi-trophy"></i>
                </div>
              </div>
            </template>
            <template #title>
              <div class="tournoi-title">{{ tournoi.nom }}</div>
            </template>
            <template #subtitle>
              <div class="tournoi-info">
                <span><i class="pi pi-users"></i> {{ tournoi.equipes.length }} équipes</span>
                <span v-if="tournoi.poules"><i class="pi pi-th-large"></i> {{ tournoi.poules.length }} poules</span>
                <span v-if="tournoi.bracket"><i class="pi pi-sitemap"></i> {{ tournoi.bracket.rounds.length }} tours</span>
                <span v-if="tournoi.miniBrackets"><i class="pi pi-bolt"></i> {{ tournoi.miniBrackets.length }} brackets</span>
              </div>
            </template>
            <template #content>
              <div class="tournoi-stats">
                <Tag :value="getTypeLabel(tournoi.type)" :severity="getTypeSeverity(tournoi.type)" />
                <Tag :value="tournoi.statut" :severity="getStatutSeverity(tournoi.statut)" class="ml-2" />
              </div>
            </template>
            <template #footer>
              <div class="card-actions">
                <Button 
                  icon="pi pi-eye" 
                  class="p-button-text p-button-sm"
                  @click.stop="openTournoi(tournoi)"
                  v-tooltip.top="'Voir'"
                />
                <Button 
                  icon="pi pi-trash" 
                  class="p-button-text p-button-danger p-button-sm"
                  @click.stop="confirmDeleteTournoi(tournoi)"
                  v-tooltip.top="'Supprimer'"
                />
              </div>
            </template>
          </Card>
        </div>
      </main>
    </div>
    
    <!-- Dialog création tournoi -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      modal 
      header="Nouveau Tournoi"
      :style="{ width: '600px', maxWidth: '95vw' }"
    >
      <div class="form-group">
        <label>Nom du tournoi</label>
        <InputText 
          v-model="newTournoi.nom" 
          placeholder="Ex: Tournoi de Noël 2025"
          class="w-full"
        />
      </div>
      
      <div class="form-group">
        <label>Type de tournoi</label>
        <Dropdown 
          v-model="newTournoi.type" 
          :options="typeOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Sélectionner le type"
          class="w-full"
        />
      </div>
      
      <div class="form-group">
        <label>Nombre d'équipes</label>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <InputNumber 
            v-model="newTournoi.nombreEquipes" 
            :min="4" 
            :max="64"
            class="w-full"
          />
          <Button 
            label="📋 Charger liste" 
            @click="showListesDialog = true"
            class="p-button-secondary p-button-sm"
            style="white-space: nowrap;"
          />
        </div>
        <small v-if="newTournoi.type === 'bracket'" class="text-muted">
          Le système gère automatiquement les "byes" pour tout nombre d'équipes
        </small>
        <small v-else-if="newTournoi.type === 'hybride'" class="text-muted">
          Ex: 36 équipes = 6 poules de 6, puis bracket avec les qualifiés
        </small>
        <small v-else-if="newTournoi.type === 'multibracket'" class="text-muted">
          Ex: 36 équipes = 6 mini-brackets de 6, top 2 de chaque → 12 pour la finale
        </small>
      </div>
      
      <div v-if="newTournoi.type === 'poule' || newTournoi.type === 'hybride' || newTournoi.type === 'multibracket'" class="form-group">
        <label>Nombre de poules</label>
        <InputNumber 
          v-model="newTournoi.nombrePoules" 
          :min="2" 
          :max="12"
          class="w-full"
        />
        <small class="text-muted">{{ Math.floor(newTournoi.nombreEquipes / newTournoi.nombrePoules) }} équipes par poule</small>
      </div>
      
      <div v-if="newTournoi.type === 'hybride'" class="form-group">
        <label>Qualifiés par poule pour le bracket final</label>
        <InputNumber 
          v-model="newTournoi.qualifiesParPoule" 
          :min="1" 
          :max="4"
          class="w-full"
        />
        <small class="text-muted">
          Total qualifiés: {{ newTournoi.nombrePoules * newTournoi.qualifiesParPoule }} équipes 
          ({{ getSuggestedBracketSize() }} places bracket)
        </small>
      </div>
      
      <template #footer>
        <Button label="Annuler" @click="showCreateDialog = false" class="p-button-text" />
        <Button label="Créer" @click="createTournoi" class="p-button-primary" />
      </template>
    </Dialog>
    
    <!-- Dialog gestion listes d'équipes -->
    <Dialog 
      v-model:visible="showListesDialog" 
      modal 
      header="📋 Gestion des listes d'équipes"
      :style="{ width: '700px', maxWidth: '95vw' }"
    >
      <div class="listes-container">
        <!-- Listes sauvegardées -->
        <div class="section">
          <h3>Listes sauvegardées</h3>
          <div v-if="listesEquipes.length === 0" class="empty-state">
            <i class="pi pi-inbox" style="font-size: 2rem; color: #999;"></i>
            <p>Aucune liste d'équipes sauvegardée</p>
          </div>
          <div v-else class="listes-grid">
            <Card v-for="liste in listesEquipes" :key="liste.id" class="liste-card">
              <template #title>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <span>{{ liste.nom }}</span>
                  <Button 
                    icon="pi pi-trash" 
                    class="p-button-danger p-button-text p-button-sm"
                    @click="supprimerListe(liste.id)"
                  />
                </div>
              </template>
              <template #content>
                <p><strong>{{ liste.equipes.length }}</strong> équipes</p>
                <div class="equipes-preview">
                  {{ liste.equipes.slice(0, 3).join(', ') }}
                  <span v-if="liste.equipes.length > 3">...</span>
                </div>
              </template>
              <template #footer>
                <Button 
                  label="Utiliser cette liste" 
                  icon="pi pi-check"
                  class="p-button-success w-full"
                  @click="chargerListe(liste)"
                />
              </template>
            </Card>
          </div>
        </div>
        
        <!-- Import/Export -->
        <div class="section">
          <h3>Import / Export</h3>
          <div class="actions-grid">
            <Button 
              label="📥 Importer depuis fichier" 
              icon="pi pi-upload"
              class="p-button-info"
              @click="triggerFileInput"
            />
            <input 
              ref="fileInput"
              type="file"
              accept=".json"
              style="display: none"
              @change="importerListe"
            />
            <Button 
              label="💾 Sauvegarder nouvelle liste" 
              icon="pi pi-save"
              class="p-button-secondary"
              @click="showSaveDialog = true"
            />
          </div>
        </div>
      </div>
    </Dialog>
    
    <!-- Dialog sauvegarde nouvelle liste -->
    <Dialog 
      v-model:visible="showSaveDialog" 
      modal 
      header="💾 Sauvegarder une liste d'équipes"
      :style="{ width: '600px', maxWidth: '95vw' }"
    >
      <div class="form-group">
        <label>Nom de la liste</label>
        <InputText 
          v-model="nouvelleListe.nom" 
          placeholder="Ex: Équipes HES-SO 2025"
          class="w-full"
        />
      </div>
      
      <div class="form-group">
        <label>Noms des équipes (une par ligne)</label>
        <textarea 
          v-model="nouvelleListe.equipesTexte"
          rows="12"
          class="equipes-textarea"
          placeholder="Montrer le muay thaï&#10;La Trigger Pinte&#10;FC Barsoulone&#10;Peña Baiona&#10;..."
        ></textarea>
        <small class="text-muted">{{ nouvelleListe.equipesTexte.split('\n').filter(e => e.trim()).length }} équipes</small>
      </div>
      
      <template #footer>
        <Button label="Annuler" @click="showSaveDialog = false" class="p-button-text" />
        <Button 
          label="💾 Sauvegarder" 
          @click="sauvegarderListe"
          class="p-button-primary"
          :disabled="!nouvelleListe.nom || !nouvelleListe.equipesTexte"
        />
        <Button 
          label="📥 Exporter JSON" 
          icon="pi pi-download"
          @click="exporterListe"
          class="p-button-secondary"
          :disabled="!nouvelleListe.nom || !nouvelleListe.equipesTexte"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useConfirm } from 'primevue/useconfirm'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'

const router = useRouter()
const confirm = useConfirm()

// État
const tournois = ref([])
const showCreateDialog = ref(false)
const showListesDialog = ref(false)
const showSaveDialog = ref(false)
const listesEquipes = ref([])
const fileInput = ref(null)
const equipesPredefines = ref([])

const nouvelleListe = ref({
  nom: '',
  equipesTexte: ''
})

const typeOptions = [
  { label: '🏆 Phase de poule', value: 'poule' },
  { label: '🍺 Bracket (Élimination directe)', value: 'bracket' },
  { label: '🔥 Hybride (Poule + Bracket)', value: 'hybride' },
  { label: '⚡ Multi-Bracket (6 brackets → Finale)', value: 'multibracket' }
]

const newTournoi = ref({
  nom: '',
  type: 'bracket',
  nombreEquipes: 8,
  nombrePoules: 2,
  qualifiesParPoule: 2
})

function getSuggestedBracketSize() {
  const totalQualifies = newTournoi.value.nombrePoules * newTournoi.value.qualifiesParPoule
  // Trouver la prochaine puissance de 2
  return Math.pow(2, Math.ceil(Math.log2(totalQualifies)))
}

// Méthodes
function createTournoi() {
  if (!newTournoi.value.nom) return
  
  const equipes = []
  
  // Utiliser les équipes prédéfinies si disponibles
  if (equipesPredefines.value.length > 0) {
    for (let i = 0; i < Math.min(equipesPredefines.value.length, newTournoi.value.nombreEquipes); i++) {
      equipes.push({
        id: `equipe-${Date.now()}-${i}`,
        nom: equipesPredefines.value[i],
        points: 0,
        matchsJoues: 0,
        victoires: 0,
        nuls: 0,
        defaites: 0,
        verresMis: 0,
        verresEncaisses: 0,
        goalAverage: 0
      })
    }
    // Compléter avec des équipes génériques si besoin
    for (let i = equipesPredefines.value.length; i < newTournoi.value.nombreEquipes; i++) {
      equipes.push({
        id: `equipe-${Date.now()}-${i}`,
        nom: `Équipe ${i + 1}`,
        points: 0,
        matchsJoues: 0,
        victoires: 0,
        nuls: 0,
        defaites: 0,
        verresMis: 0,
        verresEncaisses: 0,
        goalAverage: 0
      })
    }
  } else {
    // Créer des équipes génériques
    for (let i = 1; i <= newTournoi.value.nombreEquipes; i++) {
      equipes.push({
        id: `equipe-${Date.now()}-${i}`,
        nom: `Équipe ${i}`,
        points: 0,
        matchsJoues: 0,
        victoires: 0,
        nuls: 0,
        defaites: 0,
        verresMis: 0,
        verresEncaisses: 0,
        goalAverage: 0
      })
    }
  }
  
  let nouveauTournoi = {
    id: `tournoi-${Date.now()}`,
    nom: newTournoi.value.nom,
    type: newTournoi.value.type,
    equipes: equipes,
    statut: 'En cours',
    dateCreation: new Date().toISOString()
  }
  
  // Générer la structure selon le type
  if (newTournoi.value.type === 'poule') {
    nouveauTournoi.poules = genererPoules(equipes, newTournoi.value.nombrePoules)
  } else if (newTournoi.value.type === 'bracket') {
    nouveauTournoi.bracket = genererBracket(equipes)
  } else if (newTournoi.value.type === 'hybride') {
    nouveauTournoi.poules = genererPoules(equipes, newTournoi.value.nombrePoules)
    nouveauTournoi.phaseActuelle = 'poule' // 'poule' ou 'bracket'
    nouveauTournoi.qualifiesParPoule = newTournoi.value.qualifiesParPoule
  } else if (newTournoi.value.type === 'multibracket') {
    nouveauTournoi.miniBrackets = genererMiniBrackets(equipes, newTournoi.value.nombrePoules)
    nouveauTournoi.phaseActuelle = 'minibrackets' // 'minibrackets' ou 'finale'
  }
  
  tournois.value.push(nouveauTournoi)
  
  // Réinitialiser le formulaire
  newTournoi.value = {
    nom: '',
    type: 'bracket',
    nombreEquipes: 8,
    nombrePoules: 2,
    qualifiesParPoule: 2
  }
  
  showCreateDialog.value = false
  saveTournois()
}

function genererPoules(equipes, nombrePoules) {
  const poules = []
  const equipesParPoule = Math.ceil(equipes.length / nombrePoules)
  
  for (let i = 0; i < nombrePoules; i++) {
    const equipesPoule = equipes.slice(i * equipesParPoule, (i + 1) * equipesParPoule)
    
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
    
    poules.push({
      id: `poule-${Date.now()}-${i}`,
      nom: `Poule ${String.fromCharCode(65 + i)}`,
      equipes: equipesPoule,
      matchs: matchs
    })
  }
  
  return poules
}

function genererBracket(equipes) {
  const nbEquipes = equipes.length
  const rounds = []
  
  // Trouver la prochaine puissance de 2 pour le bracket
  const bracketSize = Math.pow(2, Math.ceil(Math.log2(nbEquipes)))
  const nbByes = bracketSize - nbEquipes
  const nbRounds = Math.ceil(Math.log2(bracketSize))
  
  // Premier tour avec gestion des byes
  const premierTour = []
  const nbMatchsPremierTour = Math.floor((bracketSize) / 2)
  
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
  
  // Tours suivants (initialement vides)
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

function genererMiniBrackets(equipes, nombreBrackets) {
  const miniBrackets = []
  const equipesParBracket = Math.ceil(equipes.length / nombreBrackets)
  
  for (let i = 0; i < nombreBrackets; i++) {
    const equipesMiniBracket = equipes.slice(i * equipesParBracket, (i + 1) * equipesParBracket)
    
    // Générer un bracket pour ce groupe
    const bracket = genererBracket(equipesMiniBracket)
    
    miniBrackets.push({
      id: `minibracket-${Date.now()}-${i}`,
      nom: `Bracket ${String.fromCharCode(65 + i)}`,
      bracket: bracket,
      champion: null,
      finaliste: null
    })
  }
  
  return miniBrackets
}

function getRoundName(roundNum, totalRounds) {
  if (roundNum === totalRounds) return 'Finale'
  if (roundNum === totalRounds - 1) return 'Demi-finales'
  if (roundNum === totalRounds - 2) return 'Quarts de finale'
  if (roundNum === 1) return '1er tour'
  return `${roundNum}e tour`
}

function openTournoi(tournoi) {
  // Naviguer vers la page du tournoi
  router.push(`/tournois/${tournoi.id}`)
}

function confirmDeleteTournoi(tournoi) {
  confirm.require({
    message: `Voulez-vous vraiment supprimer le tournoi "${tournoi.nom}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: () => {
      tournois.value = tournois.value.filter(t => t.id !== tournoi.id)
      saveTournois()
    }
  })
}

function getStatutSeverity(statut) {
  const severities = {
    'En cours': 'info',
    'Terminé': 'success',
    'Annulé': 'danger'
  }
  return severities[statut] || 'info'
}

function getTypeLabel(type) {
  const labels = {
    'poule': '🏆 Poule',
    'bracket': '🍺 Bracket',
    'hybride': '🔥 Hybride',
    'multibracket': '⚡ Multi-Bracket'
  }
  return labels[type] || type
}

function getTypeSeverity(type) {
  const severities = {
    'poule': 'info',
    'bracket': 'warning',
    'hybride': 'danger',
    'multibracket': 'success'
  }
  return severities[type] || 'info'
}

function chargerExempleHESSO() {
  const equipesHESSO = [
    { id: 1, nom: 'Montrer le muay thaï', verresMis: 0, verresEncaisses: 0 },
    { id: 2, nom: 'La Trigger Pinte', verresMis: 0, verresEncaisses: 0 },
    { id: 3, nom: 'Desper-à-trois', verresMis: 0, verresEncaisses: 0 },
    { id: 4, nom: 'Les sans-pressions', verresMis: 0, verresEncaisses: 0 },
    { id: 5, nom: 'Les 3 mousse\'quetaires', verresMis: 0, verresEncaisses: 0 },
    { id: 6, nom: 'FC Barsoulone', verresMis: 0, verresEncaisses: 0 },
    { id: 7, nom: 'Peña Baiona', verresMis: 0, verresEncaisses: 0 },
    { id: 8, nom: 'Fc Beercelona', verresMis: 0, verresEncaisses: 0 },
    { id: 9, nom: 'Nectar malté', verresMis: 0, verresEncaisses: 0 },
    { id: 10, nom: 'Les Taties au fond du gobelet', verresMis: 0, verresEncaisses: 0 },
    { id: 11, nom: 'Les thérapintes', verresMis: 0, verresEncaisses: 0 },
    { id: 12, nom: 'ekip de SA-LO-PARD', verresMis: 0, verresEncaisses: 0 },
    { id: 13, nom: 'Gossip Pint', verresMis: 0, verresEncaisses: 0 },
    { id: 14, nom: 'FAA', verresMis: 0, verresEncaisses: 0 },
    { id: 15, nom: 'Noir métal', verresMis: 0, verresEncaisses: 0 },
    { id: 16, nom: '3 bras', verresMis: 0, verresEncaisses: 0 },
    { id: 17, nom: 'Les diables rouges', verresMis: 0, verresEncaisses: 0 },
    { id: 18, nom: 'Totaly spice', verresMis: 0, verresEncaisses: 0 },
    { id: 19, nom: 'Pizza de nata', verresMis: 0, verresEncaisses: 0 },
    { id: 20, nom: 'Les réservistes', verresMis: 0, verresEncaisses: 0 },
    { id: 21, nom: 'La chance du débutant', verresMis: 0, verresEncaisses: 0 },
    { id: 22, nom: 'Miss the cup', verresMis: 0, verresEncaisses: 0 },
    { id: 23, nom: 'LLBELLES', verresMis: 0, verresEncaisses: 0 },
    { id: 24, nom: 'Alpenröstli', verresMis: 0, verresEncaisses: 0 },
    { id: 25, nom: 'Unagi', verresMis: 0, verresEncaisses: 0 },
    { id: 26, nom: 'Audrey', verresMis: 0, verresEncaisses: 0 },
    { id: 27, nom: 'R pong', verresMis: 0, verresEncaisses: 0 },
    { id: 28, nom: 'Les mousses populaires', verresMis: 0, verresEncaisses: 0 },
    { id: 29, nom: 'White wine', verresMis: 0, verresEncaisses: 0 },
    { id: 30, nom: 'Matze', verresMis: 0, verresEncaisses: 0 },
    { id: 31, nom: 'Mat mon Q', verresMis: 0, verresEncaisses: 0 },
    { id: 32, nom: 'Matze 02', verresMis: 0, verresEncaisses: 0 },
    { id: 33, nom: 'Luxe à Sion', verresMis: 0, verresEncaisses: 0 },
    { id: 34, nom: 'Les St-imiards', verresMis: 0, verresEncaisses: 0 },
    { id: 35, nom: 'Team raclette', verresMis: 0, verresEncaisses: 0 },
    { id: 36, nom: 'Les pintasses', verresMis: 0, verresEncaisses: 0 }
  ]
  
  // Mélanger aléatoirement les équipes (algorithme Fisher-Yates)
  for (let i = equipesHESSO.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [equipesHESSO[i], equipesHESSO[j]] = [equipesHESSO[j], equipesHESSO[i]]
  }
  
  const tournoiExemple = {
    id: `tournoi-${Date.now()}`,
    nom: 'Tournoi Beer Pong HES-SO 2025',
    type: 'multibracket',
    equipes: equipesHESSO,
    statut: 'En cours',
    dateCreation: new Date().toISOString(),
    miniBrackets: genererMiniBrackets(equipesHESSO, 6),
    phaseActuelle: 'minibrackets'
  }
  
  tournois.value.push(tournoiExemple)
  saveTournois()
  
  // Ouvrir directement le tournoi
  openTournoi(tournoiExemple)
}

function saveTournois() {
  localStorage.setItem('tournois', JSON.stringify(tournois.value))
}

// Gestion des listes d'équipes
function saveListesEquipes() {
  localStorage.setItem('listesEquipes', JSON.stringify(listesEquipes.value))
}

function loadListesEquipes() {
  const saved = localStorage.getItem('listesEquipes')
  if (saved) {
    listesEquipes.value = JSON.parse(saved)
  }
}

function chargerListe(liste) {
  equipesPredefines.value = [...liste.equipes]
  newTournoi.value.nombreEquipes = liste.equipes.length
  showListesDialog.value = false
  alert(`✅ Liste "${liste.nom}" chargée avec ${liste.equipes.length} équipes !`)
}

function sauvegarderListe() {
  if (!nouvelleListe.value.nom || !nouvelleListe.value.equipesTexte) return
  
  const equipes = nouvelleListe.value.equipesTexte
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0)
  
  const liste = {
    id: `liste-${Date.now()}`,
    nom: nouvelleListe.value.nom,
    equipes: equipes,
    dateCreation: new Date().toISOString()
  }
  
  listesEquipes.value.push(liste)
  saveListesEquipes()
  
  // Réinitialiser
  nouvelleListe.value = { nom: '', equipesTexte: '' }
  showSaveDialog.value = false
  
  alert(`✅ Liste "${liste.nom}" sauvegardée avec ${equipes.length} équipes !`)
}

function exporterListe() {
  if (!nouvelleListe.value.nom || !nouvelleListe.value.equipesTexte) return
  
  const equipes = nouvelleListe.value.equipesTexte
    .split('\n')
    .map(e => e.trim())
    .filter(e => e.length > 0)
  
  const liste = {
    nom: nouvelleListe.value.nom,
    equipes: equipes,
    dateExport: new Date().toISOString()
  }
  
  const dataStr = JSON.stringify(liste, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${liste.nom.replace(/[^a-z0-9]/gi, '_')}.json`
  link.click()
  URL.revokeObjectURL(url)
  
  alert(`✅ Fichier "${liste.nom}.json" téléchargé !`)
}

function triggerFileInput() {
  fileInput.value.click()
}

function importerListe(event) {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const liste = JSON.parse(e.target.result)
      
      if (!liste.nom || !liste.equipes || !Array.isArray(liste.equipes)) {
        alert('❌ Fichier invalide ! Le fichier doit contenir un nom et une liste d\'équipes.')
        return
      }
      
      // Ajouter aux listes sauvegardées
      const nouvelleListe = {
        id: `liste-${Date.now()}`,
        nom: liste.nom,
        equipes: liste.equipes,
        dateCreation: new Date().toISOString()
      }
      
      listesEquipes.value.push(nouvelleListe)
      saveListesEquipes()
      
      alert(`✅ Liste "${liste.nom}" importée avec ${liste.equipes.length} équipes !`)
    } catch (error) {
      alert('❌ Erreur lors de l\'import du fichier. Vérifiez que c\'est un fichier JSON valide.')
      console.error(error)
    }
  }
  reader.readAsText(file)
  
  // Réinitialiser l'input
  event.target.value = ''
}

function supprimerListe(id) {
  if (!confirm('Supprimer cette liste d\'équipes ?')) return
  
  listesEquipes.value = listesEquipes.value.filter(l => l.id !== id)
  saveListesEquipes()
}

function loadTournois() {
  const saved = localStorage.getItem('tournois')
  if (saved) {
    tournois.value = JSON.parse(saved)
  }
}

// Charger les tournois et listes au montage
loadTournois()
loadListesEquipes()
</script>

<style scoped>
.tournois-root {
  min-height: 100vh;
}

.tournois-layout {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.main-content {
  min-width: 0;
}

.page-header {
  margin-bottom: 2rem;
  text-align: center;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: var(--text-color-secondary);
  font-size: 1.1rem;
}

.actions-bar {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 3rem;
  flex-wrap: wrap;
  padding: 0 1rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-color-secondary);
}

.empty-state h3 {
  margin: 1rem 0 0.5rem;
  font-size: 1.5rem;
}

.tournois-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
  padding: 0 1rem;
}

.tournoi-card {
  cursor: pointer;
  transition: all 0.3s ease;
}

.tournoi-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.card-header {
  display: flex;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.tournoi-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  color: white;
}

.tournoi-title {
  font-size: 1.3rem;
  font-weight: 700;
  text-align: center;
}

.tournoi-info {
  display: flex;
  justify-content: space-around;
  gap: 1rem;
  margin-top: 0.5rem;
}

.tournoi-info span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.tournoi-stats {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
}

.card-actions {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.listes-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.listes-container .section h3 {
  font-size: 1.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  color: var(--text-color-secondary);
}

.listes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.liste-card {
  border: 2px solid var(--surface-border);
  transition: all 0.3s;
}

.liste-card:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.equipes-preview {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-style: italic;
  margin-top: 0.5rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.equipes-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  font-family: inherit;
  font-size: 0.95rem;
  resize: vertical;
  background: var(--surface-ground);
  color: var(--text-color);
}

.equipes-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

@media (max-width: 768px) {
  .tournois-layout {
    padding: 1rem;
  }
  
  .title {
    font-size: 2rem;
  }
  
  .subtitle {
    font-size: 1rem;
  }
  
  .actions-bar {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .actions-bar .p-button {
    width: 100%;
    justify-content: center;
  }
  
  .tournois-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0;
  }
  
  .tournoi-card {
    margin: 0 0.5rem;
  }
  
  .tournoi-icon {
    width: 60px;
    height: 60px;
    font-size: 2rem;
  }
  
  .tournoi-title {
    font-size: 1.1rem;
  }
  
  .tournoi-info {
    flex-direction: column;
    gap: 0.5rem;
  }
}

@media (max-width: 480px) {
  .tournois-layout {
    padding: 0.5rem;
  }
  
  .page-header {
    margin-bottom: 1rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
  
  .actions-bar {
    margin-bottom: 1.5rem;
  }
  
  .card-header {
    padding: 1.5rem;
  }
}
</style>
