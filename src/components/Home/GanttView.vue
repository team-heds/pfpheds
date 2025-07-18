<template>
  <Navbar />

  <h1 style="text-align:center; margin:1rem 0;">Gantt PFP</h1>

  <!-- Menu de navigation -->
  <div class="menu">
    <button :class="{ active: selectedGantt === 'PFP1' }" @click="selectGantt('PFP1')">PFP 1</button>
    <button :class="{ active: selectedGantt === 'PFP2' }" @click="selectGantt('PFP2')">PFP 2</button>
    <button :class="{ active: selectedGantt === 'PFP3' }" @click="selectGantt('PFP3')">PFP 3</button>
    <button :class="{ active: selectedGantt === 'PFP4' }" @click="selectGantt('PFP4')">PFP 4</button>
    <button :class="{ active: selectedGantt === 'Management' }" @click="selectGantt('Management')">
      Management
    </button>
    <button :class="{ active: editorMode }" @click="toggleEditorMode">
      {{ editorMode ? 'Mode Affichage' : 'Mode Editeur' }}
    </button>
  </div>

  <!-- Conteneur pour le diagramme Mermaid -->
  <div class="mermaid-wrapper">
    <div v-if="selectedGantt === 'PFP1'" class="mermaid-container" ref="mermaidContainer1"></div>
    <div v-if="selectedGantt === 'PFP2'" class="mermaid-container" ref="mermaidContainer2"></div>
    <div v-if="selectedGantt === 'PFP3'" class="mermaid-container" ref="mermaidContainer3"></div>
    <div v-if="selectedGantt === 'PFP4'" class="mermaid-container" ref="mermaidContainer4"></div>
    <div v-if="selectedGantt === 'Management'" class="mermaid-container" ref="mermaidContainer5"></div>
  </div>

  <!-- Zone éditeur, visible en mode éditeur -->
  <div v-if="editorMode" class="editor-area">
    <h2>Éditeur de code Mermaid ({{ selectedGantt }})</h2>
    <textarea v-model="editorCode" rows="10"></textarea>
    <button @click="applyEditorCode" class="apply-button">Appliquer</button>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import mermaid from 'mermaid'
import { db } from '../../../firebase.js'
import { ref as dbRef, onValue, set } from 'firebase/database'
import Navbar from '@/components/Utils/Navbar.vue'

// --- Variables réactives et références ---
// Diagramme sélectionné et mode éditeur
const selectedGantt = ref('PFP1')
const editorMode = ref(false)
const editorCode = ref('')
const ganttCodes = ref({})

// Définitions par défaut des diagrammes Mermaid
const defaultGanttCodes = {
  PFP1: `
gantt
    dateFormat  YYYY-MM-DD
    title       PFP 1 - Sollicitation et Répartition
    section Sollicitation et Répartition
      Sollicitation "doc sur TEAMS" + Mise à jour dans modèle répartition : done, a1, 2024-04-01, 21d
      Répartition des référents HES : active, a2, 2024-04-22, 3d
  `,
  PFP2: `
gantt
    dateFormat  YYYY-MM-DD
    title       PFP 2 - Recensement
    section Recensement
      Tableau Recensement (TEAMS & Google Drive) : a3, 2024-04-25, 28d
      Création PDS par volée : a4, 2024-04-25, 28d
  `,
  PFP3: `
gantt
    dateFormat  YYYY-MM-DD
    title       PFP 3 - Contrôle et Négociation
    section Contrôle et Négociation
      Contrôle nb places : a5, 2024-05-23, 7d
      Négociation partage places (VD-GE-ARC) : a6, 2024-11-04, 21d
  `,
  PFP4: `
gantt
    dateFormat  YYYY-MM-DD
    title       PFP 4 - Organisation et Préparation
    section Organisation et Préparation
      Organisation pds SAE : a7, 2024-11-18, 10d
      Préparer places dans ISA : a8, 2024-11-18, 1d
      Contrôler places ISA : a9, 2024-11-18, 1d
      Envoi listes places étudiants : a10, 2024-11-25, 1d
  `,
  Management: `
gantt
    dateFormat  YYYY-MM-DD
    title       PFP Management - Numérotation et Échanges
    section Numérotation et Tirage
      numérotation des préferences des places de stage : a11, 2024-12-13, 21d
      Tirage au sort PDS : a12, 2024-12-23, 1d
    section Echanges et Validation
      Echanges entre lésés : a13, 2025-01-13, 1d
      Validation / modification + Transmission aux étudiant-e-s : a14, 2025-01-13, 5d
  `
}

// Références vers les conteneurs pour chaque diagramme
const mermaidContainer1 = ref(null)
const mermaidContainer2 = ref(null)
const mermaidContainer3 = ref(null)
const mermaidContainer4 = ref(null)
const mermaidContainer5 = ref(null)

// --- Fonctions utilitaires ---
// Sélection d'un diagramme et mise à jour de l'éditeur
const selectGantt = (ganttKey) => {
  selectedGantt.value = ganttKey
  editorCode.value = ganttCodes.value[ganttKey] || ''
  renderCurrentGantt()
}

// Rendu du diagramme Mermaid actuel
const renderCurrentGantt = async () => {
  await nextTick()
  let container, id
  // Utilisation d'un switch pour choisir le conteneur et l'ID
  switch (selectedGantt.value) {
    case 'PFP1':
      container = mermaidContainer1.value
      id = 'mermaidGanttIdPFP1'
      break
    case 'PFP2':
      container = mermaidContainer2.value
      id = 'mermaidGanttIdPFP2'
      break
    case 'PFP3':
      container = mermaidContainer3.value
      id = 'mermaidGanttIdPFP3'
      break
    case 'PFP4':
      container = mermaidContainer4.value
      id = 'mermaidGanttIdPFP4'
      break
    case 'Management':
      container = mermaidContainer5.value
      id = 'mermaidGanttIdManagement'
      break
    default:
      return
  }

  const code = ganttCodes.value[selectedGantt.value] || ''
  try {
    const { svg } = await mermaid.render(id, code)
    if (container) {
      container.innerHTML = svg

      // Exemple : ajout d'un gestionnaire pour l'élément avec l'ID "cl1"
      const cl1Element = container.querySelector('#cl1')
      if (cl1Element) {
        cl1Element.style.cursor = 'pointer'
        cl1Element.addEventListener('click', () => {
          window.location.href = "https://mermaidjdssss.github.io/"
        })
      }
    }
  } catch (error) {
    console.error('Erreur lors du rendu du diagramme Mermaid:', error)
  }
}

// Bascule du mode éditeur et mise à jour de l'affichage
const toggleEditorMode = () => {
  editorMode.value = !editorMode.value
  if (editorMode.value) {
    editorCode.value = ganttCodes.value[selectedGantt.value]
  } else {
    renderCurrentGantt()
  }
}

// Appliquer le code édité et sauvegarder dans Firebase
const applyEditorCode = async () => {
  // Met à jour le code du diagramme dans l'objet réactif
  ganttCodes.value[selectedGantt.value] = editorCode.value

  // Sauvegarde l'intégralité des diagrammes sous "Gantts"
  const ganttsRef = dbRef(db, 'Gantts')
  await set(ganttsRef, ganttCodes.value)
  console.log('Diagramme sauvegardé pour', selectedGantt.value)
  renderCurrentGantt()

  // Pour "Management", sauvegarder chaque ligne dans un sous-nœud
  if (selectedGantt.value === 'Management') {
    const managementRef = dbRef(db, 'Gantts/file/Management')
    const lines = editorCode.value.split('\n').filter(line => line.trim() !== '')
    const managementData = {}
    lines.forEach((line, index) => {
      managementData[`element${index + 1}`] = line
    })
    await set(managementRef, managementData)
  }
}

// --- Initialisation lors du montage du composant ---
onMounted(async () => {
  // Définir les fonctions globales pour Mermaid (elles doivent être accessibles depuis window)
  window.printArguments = function (arg1, arg2, arg3) {
    alert(`printArguments called with arguments: ${arg1}, ${arg2}, ${arg3}`)
  }
  window.printTask = function (taskId) {
    alert(`taskId: ${taskId}`)
  }

  // Initialiser Mermaid avec securityLevel "loose" pour autoriser les attributs HTML et l'exécution de fonctions
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'loose',
    theme: 'default',
    gantt: {
      axisFormat: '%d/%m/%Y'
    }
  })

  // Écouter les changements sur Firebase et mettre à jour les codes Mermaid
  const ganttsRef = dbRef(db, 'Gantts')
  onValue(ganttsRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      ganttCodes.value = data
    } else {
      ganttCodes.value = defaultGanttCodes
      set(ganttsRef, defaultGanttCodes)
    }
    // Si en mode éditeur, mettre à jour le contenu de l'éditeur
    if (editorMode.value) {
      editorCode.value = ganttCodes.value[selectedGantt.value]
    }
    renderCurrentGantt()
  })
})

// Re-rendre le diagramme lorsque la sélection change
watch(selectedGantt, (newVal) => {
  editorCode.value = ganttCodes.value[newVal] || ''
  renderCurrentGantt()
})
</script>

<style scoped>
.menu {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin: 1rem 0;
}

.menu button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  background-color: #007bff;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}

.menu button.active,
.menu button:focus {
  background-color: #0056b3;
}

.mermaid-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.mermaid-container {
  width: 100%;
  max-width: 1200px;
  height: 800px;
  background-color: #ffffff;
  border-radius: 10px;
  padding: 2rem;
  overflow-x: auto;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  margin-bottom: 2rem;
}

.editor-area {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto 2rem;
  padding: 1rem;
  background-color: #f0f0f0;
  border-radius: 8px;
}

.editor-area h2 {
  margin-bottom: 0.5rem;
}

.editor-area textarea {
  width: 100%;
  min-height: 200px;
  font-family: monospace;
  font-size: 1rem;
  padding: 0.5rem;
  margin-bottom: 1rem;
}

.editor-area .apply-button {
  padding: 0.5rem 1rem;
  font-size: 1rem;
  border: none;
  background-color: #28a745;
  color: #fff;
  border-radius: 4px;
  cursor: pointer;
}
</style>