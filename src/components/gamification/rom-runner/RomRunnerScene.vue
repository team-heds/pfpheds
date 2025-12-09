<template>
  <div ref="canvasContainer" class="runner-canvas"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
import * as THREE from 'three'
import { useRomRunnerStore } from '@/stores/romRunnerStore'

const store = useRomRunnerStore()
const canvasContainer = ref(null)

// Three.js variables
let scene, camera, renderer, animationId
let player
let obstacles = []
let ground
let speed = 0.5

// Configuration du jeu
const LANE_Z_START = -50
const PLAYER_Z = 0
const SPAWN_RATE = 2000 // ms
let lastSpawn = 0

// Types de mouvements (Couleurs pour le MVP)
const MOVES = {
  'FLEXION': { color: 0x00ff00, label: 'Flexion (Q)', code: 'KeyQ' },
  'EXTENSION': { color: 0xff0000, label: 'Extension (W)', code: 'KeyW' },
  'ABDUCTION': { color: 0x0000ff, label: 'Abduction (A)', code: 'KeyA' },
  'ADDUCTION': { color: 0xffff00, label: 'Adduction (S)', code: 'KeyS' },
  'ROT_EXT': { color: 0xff00ff, label: 'Rot. Ext (Z)', code: 'KeyZ' },
  'ROT_INT': { color: 0x00ffff, label: 'Rot. Int (X)', code: 'KeyX' },
}

const moveKeys = Object.keys(MOVES)

// --- SETUP THREE.JS ---
const initScene = () => {
  scene = new THREE.Scene()
  scene.background = new THREE.Color(0xa0a0a0)
  scene.fog = new THREE.Fog(0xa0a0a0, 10, 50)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
  camera.position.set(0, 3, 5)
  camera.lookAt(0, 0, -5)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  canvasContainer.value.appendChild(renderer.domElement)

  // Lumières
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444)
  hemiLight.position.set(0, 20, 0)
  scene.add(hemiLight)

  const dirLight = new THREE.DirectionalLight(0xffffff)
  dirLight.position.set(-3, 10, -10)
  dirLight.castShadow = true
  scene.add(dirLight)

  // Sol
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 1000),
    new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
  )
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = true
  scene.add(mesh)
  ground = mesh

  // Grille pour l'effet de vitesse
  const grid = new THREE.GridHelper(100, 50, 0x000000, 0x000000)
  grid.material.opacity = 0.2
  grid.material.transparent = true
  scene.add(grid)

  createPlayer()
}

const createPlayer = () => {
  const geometry = new THREE.BoxGeometry(1, 1.8, 1) // Avatar basique
  const material = new THREE.MeshPhongMaterial({ color: 0x2E8B57 }) // Couleur HES (Harmonis)
  player = new THREE.Mesh(geometry, material)
  player.position.set(0, 0.9, PLAYER_Z)
  player.castShadow = true
  scene.add(player)
}

const spawnObstacle = () => {
  // Choisir un mouvement aléatoire
  const moveType = moveKeys[Math.floor(Math.random() * moveKeys.length)]
  const moveData = MOVES[moveType]

  // Créer l'obstacle visuel (Cube avec la couleur du mouvement)
  const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5)
  const material = new THREE.MeshPhongMaterial({ color: moveData.color }) 
  const obstacle = new THREE.Mesh(geometry, material)
  
  obstacle.position.set(0, 0.75, LANE_Z_START)
  obstacle.castShadow = true
  
  // Métadonnées de jeu
  obstacle.userData = {
    type: moveType,
    active: true,
    spawnTime: Date.now()
  }

  scene.add(obstacle)
  obstacles.push(obstacle)
}

// --- GAME LOOP ---
const animate = (time) => {
  if (!store.isPlaying) return

  animationId = requestAnimationFrame(animate)

  // Spawn obstacles
  if (time - lastSpawn > SPAWN_RATE) {
    spawnObstacle()
    lastSpawn = time
  }

  // Déplacer les obstacles
  obstacles.forEach((obs, index) => {
    if (!obs.userData.active) return

    obs.position.z += speed

    // Collision (Raté)
    if (obs.position.z > PLAYER_Z + 1) {
      handleMiss(obs)
    }
  })

  // Nettoyer les obstacles passés
  cleanupObstacles()

  renderer.render(scene, camera)
}

// --- LOGIQUE JEU ---

const handleInput = (e) => {
  if (!store.isPlaying) return

  // Trouver le mouvement correspondant à la touche
  const moveType = Object.keys(MOVES).find(key => MOVES[key].code === e.code)
  
  if (moveType) {
    checkHit(moveType)
  }
}

const checkHit = (inputMove) => {
  // Trouver l'obstacle le plus proche devant le joueur
  // On cherche celui qui est dans la "fenêtre de tir" (ex: Z entre -5 et 1)
  const target = obstacles.find(obs => 
    obs.userData.active && 
    obs.position.z > -8 && 
    obs.position.z < 1
  )

  if (!target) {
    // Le joueur a appuyé pour rien -> Pénalité légère ou rien ? 
    // Pour l'instant rien
    return
  }

  if (target.userData.type === inputMove) {
    // CALCUL DU TIMING
    const distance = Math.abs(target.position.z - PLAYER_Z)
    
    if (distance < 1.5) {
      store.handleHit('PERFECT')
      removeObstacle(target, true)
    } else {
      store.handleHit('GOOD')
      removeObstacle(target, true)
    }
    
    // Feedback visuel sur le joueur
    player.material.color.setHex(MOVES[inputMove].color)
    setTimeout(() => {
        player.material.color.setHex(0x2E8B57) // Retour couleur base
    }, 200)

  } else {
    // Mauvaise touche
    store.handleMiss()
    // Feedback rouge
    player.material.color.setHex(0x000000)
    setTimeout(() => {
        player.material.color.setHex(0x2E8B57)
    }, 200)
  }
}

const handleMiss = (obstacle) => {
  obstacle.userData.active = false
  store.handleMiss()
}

const removeObstacle = (obstacle, success = false) => {
  obstacle.userData.active = false
  scene.remove(obstacle)
  
  // Animation de destruction si succès (scale down)
  if (success) {
    // On pourrait ajouter des particules ici
  }
}

const cleanupObstacles = () => {
  // Supprimer les meshes de la scène
  obstacles = obstacles.filter(obs => {
    if (!obs.userData.active && !scene.children.includes(obs)) return false
    if (obs.position.z > 5) {
      scene.remove(obs)
      return false
    }
    return true
  })
}

const handleResize = () => {
  if (!camera || !renderer) return
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// --- LIFECYCLE ---
onMounted(() => {
  initScene()
  window.addEventListener('resize', handleResize)
  window.addEventListener('keydown', handleInput)
  
  // Démarrer la boucle de render (même si le jeu n'est pas lancé, pour voir la scène)
  renderer.render(scene, camera)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('keydown', handleInput)
  cancelAnimationFrame(animationId)
  // Cleanup Three.js
  if (renderer) renderer.dispose()
})

// Watcher pour démarrer/arrêter l'animation selon le store
watch(() => store.status, (newStatus) => {
  if (newStatus === 'playing') {
    lastSpawn = performance.now()
    animate(performance.now())
  } else if (newStatus === 'gameover') {
    cancelAnimationFrame(animationId)
  }
})

</script>

<style scoped>
.runner-canvas {
  width: 100vw;
  height: 100vh;
  display: block;
  overflow: hidden;
  outline: none;
}
</style>
