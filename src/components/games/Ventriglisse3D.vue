<template>
  <div class="ventriglisse-page" :class="{ 'reduced-motion': reducedMotion }">
    <Navbar />

    <main class="ventriglisse-shell">
      <header class="game-heading">
        <div class="heading-icon" aria-hidden="true"><i class="pi pi-send"></i></div>
        <div>
          <h1>Ventriglisse 3D</h1>
          <p>Préparez les couloirs, lancez la manche et suivez la course en direct.</p>
        </div>
        <div class="friendly-mode"><i class="pi pi-info-circle" aria-hidden="true"></i> Partie amicale · aucun XP</div>
      </header>

      <div class="game-layout">
        <form class="race-setup" @submit.prevent="applyParticipants">
          <div class="setup-heading">
            <div>
              <h2>Participants</h2>
              <p>De 2 à 6 personnes</p>
            </div>
            <span class="participant-count">{{ editableParticipants.length }}/6</span>
          </div>

          <div class="participant-list">
            <div v-for="(participant, index) in editableParticipants" :key="participant.id" class="participant-row">
              <span class="lane-dot" :style="{ backgroundColor: racerColors[index] }" aria-hidden="true"></span>
              <div class="participant-field">
                <label :for="`participant-${participant.id}`">Couloir {{ index + 1 }}</label>
                <input
                  :id="`participant-${participant.id}`"
                  v-model="participant.name"
                  maxlength="32"
                  autocomplete="off"
                  :disabled="raceLocked"
                  @keydown.enter.prevent="applyParticipants"
                />
              </div>
              <div class="participant-field avatar-field">
                <label :for="`avatar-${participant.id}`">Personnage</label>
                <select
                  :id="`avatar-${participant.id}`"
                  v-model="participant.avatarStyle"
                  :disabled="raceLocked"
                >
                  <option value="fille">Fille</option>
                  <option value="garcon">Garçon</option>
                </select>
              </div>
              <button
                v-if="editableParticipants.length > 2"
                class="icon-button danger-button"
                type="button"
                :disabled="raceLocked"
                :aria-label="`Retirer ${participant.name || `le participant ${index + 1}`}`"
                @click="removeParticipant(index)"
              >
                <i class="pi pi-trash" aria-hidden="true"></i>
              </button>
            </div>
          </div>

          <p v-if="formError" class="form-error" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true"></i>{{ formError }}</p>

          <div class="setup-actions">
            <button class="secondary-button" type="button" :disabled="editableParticipants.length >= 6 || raceLocked" @click="addParticipant">
              <i class="pi pi-user-plus" aria-hidden="true"></i> Ajouter
            </button>
            <button class="secondary-button" type="submit" :disabled="raceLocked">
              <i class="pi pi-check" aria-hidden="true"></i> Appliquer
            </button>
          </div>

          <div class="sound-control">
            <i :class="soundEnabled ? 'pi pi-volume-up' : 'pi pi-volume-off'" aria-hidden="true"></i>
            <span>Effets sonores</span>
            <button
              class="sound-toggle"
              type="button"
              role="switch"
              :aria-checked="soundEnabled"
              :aria-label="soundEnabled ? 'Désactiver les effets sonores' : 'Activer les effets sonores'"
              @click="soundEnabled = !soundEnabled"
            ><span></span></button>
          </div>

          <div class="sound-control motion-control">
            <i class="pi pi-eye" aria-hidden="true"></i>
            <span>Limiter les mouvements<small>Caméra fixe et effets allégés</small></span>
            <button
              class="sound-toggle"
              type="button"
              role="switch"
              :aria-checked="reducedMotion"
              aria-label="Limiter les mouvements"
              @click="reducedMotion = !reducedMotion"
            ><span></span></button>
          </div>

          <div class="scoreboard" aria-labelledby="scoreboard-title">
            <div class="scoreboard-heading">
              <h3 id="scoreboard-title">Scores</h3>
              <span>{{ raceRound }} manche{{ raceRound > 1 ? 's' : '' }}</span>
            </div>
            <ol>
              <li v-for="(participant, index) in scoreRanking" :key="participant.id">
                <span>{{ index + 1 }}</span>
                <strong>{{ participant.name }}</strong>
                <b>{{ participant.score }} pt{{ participant.score > 1 ? 's' : '' }}</b>
              </li>
            </ol>
          </div>
        </form>

        <section class="race-area" aria-labelledby="race-title">
          <div class="race-toolbar">
            <div>
              <h2 id="race-title">Manche {{ raceRound || 1 }}</h2>
              <p aria-live="polite">{{ raceStatusText }}</p>
            </div>
            <div class="race-controls">
              <button class="secondary-button" type="button" :disabled="!canTogglePause" @click="togglePause">
                <i :class="raceState === 'paused' ? 'pi pi-play' : 'pi pi-pause'" aria-hidden="true"></i>
                {{ raceState === 'paused' ? 'Reprendre' : 'Pause' }}
              </button>
              <button
                class="primary-button"
                type="button"
                :disabled="raceLocked"
                @click="startRace"
              >
                <i class="pi pi-play" aria-hidden="true"></i>
                {{ raceState === 'preparing' || avatarLoading ? 'Préparation de la piste…' : raceState === 'finished' ? 'Nouvelle manche' : 'Lancer la course' }}
              </button>
            </div>
          </div>

          <p id="race-shortcuts" class="race-shortcuts">Sur la piste, appuyez sur Espace ou P pour mettre en pause ou reprendre. Un changement d’onglet met la manche en pause.</p>

          <div
            ref="stage"
            class="race-stage"
            :class="{ 'is-racing': raceState === 'racing' }"
            tabindex="0"
            role="group"
            aria-label="Piste de Ventriglisse"
            aria-describedby="race-shortcuts"
            aria-keyshortcuts="Space P"
            @keydown="handleStageKeydown"
          >
            <canvas ref="canvas3d" class="ventriglisse-canvas" aria-label="Animation 3D de la course de Ventriglisse"></canvas>

            <div v-if="avatarLoading && !sceneError" class="avatar-loading" role="status">Chargement des personnages 3D…</div>

            <div v-if="sceneError" class="scene-error" role="alert">
              <div class="fallback-message">
                <i class="pi pi-desktop" aria-hidden="true"></i>
                <strong>Mode de course simplifié</strong>
                <span>La vue 3D n’est pas disponible, mais la manche reste entièrement jouable.</span>
              </div>
              <div class="fallback-race" aria-label="Animation simplifiée de la course">
                <div v-for="participant in participants" :key="participant.id" class="fallback-lane">
                  <span>{{ participant.name }}</span>
                  <div><i class="fallback-avatar" :class="`is-${participant.avatarStyle}`" :style="{ left: `${Math.min(94, participant.distance / trackLength * 94)}%`, '--avatar-color': participant.color }" aria-hidden="true"><span></span></i></div>
                </div>
              </div>
            </div>

            <div class="labels-3d" aria-hidden="true">
              <span
                v-for="(participant, index) in participants"
                :id="`racer-label-${participant.id}`"
                :key="participant.id"
                class="avatar-label"
                :style="{ '--racer-color': participant.color || racerColors[index] }"
              >{{ participant.name }}</span>
            </div>

            <Transition name="countdown-fade">
              <div v-if="countdownValue !== null" class="countdown-overlay" aria-live="assertive">
                <span class="countdown-number">{{ countdownValue }}</span>
              </div>
            </Transition>

            <div v-if="raceState === 'paused'" class="paused-overlay" aria-hidden="true">
              <i class="pi pi-pause" aria-hidden="true"></i>
              <strong>Manche en pause</strong>
              <span>Reprenez avec le bouton ou depuis la piste au clavier.</span>
            </div>
          </div>

          <p v-if="avatarWarning && !sceneError" class="model-warning" role="status">Un personnage 3D n’a pas pu être chargé. La course reste jouable avec son avatar de secours.</p>

          <div class="race-progress" aria-label="Progression des participants">
            <div v-for="(participant, index) in liveRanking" :key="participant.id" class="progress-row">
              <div class="progress-person">
                <span class="position">{{ index + 1 }}</span>
                <span class="progress-name">{{ participant.name }}</span>
                <span>{{ participant.distance.toFixed(1) }} m</span>
              </div>
              <div class="progress-track" role="progressbar" :aria-label="`Progression de ${participant.name}`" aria-valuemin="0" :aria-valuenow="Math.round(participant.distance)" :aria-valuemax="trackLength">
                <span :style="{ transform: `scaleX(${Math.min(1, participant.distance / trackLength)})`, backgroundColor: participant.color }"></span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <section v-if="showResults" class="results-panel" aria-labelledby="results-title" aria-live="polite">
        <div class="winner-summary">
          <span class="winner-icon" aria-hidden="true"><i class="pi pi-trophy"></i></span>
          <div><p>Victoire</p><h2 id="results-title">{{ winner.name }}</h2></div>
          <strong>{{ winner.distance.toFixed(1) }} m</strong>
        </div>
        <ol class="ranking-list">
          <li v-for="(participant, index) in sortedParticipants" :key="participant.id">
            <span class="rank-number">{{ index + 1 }}</span>
            <span class="rank-color" :style="{ backgroundColor: participant.color }" aria-hidden="true"></span>
            <strong>{{ participant.name }}</strong>
            <span class="round-points">+{{ pointsForRank(index) }} pts</span>
            <span>{{ participant.distance.toFixed(1) }} m</span>
          </li>
        </ol>
        <button class="primary-button" type="button" @click="startRace"><i class="pi pi-refresh" aria-hidden="true"></i> Rejouer</button>
      </section>
    </main>

    <audio ref="audioBip" :src="bipAudioUrl" preload="auto"></audio>
    <audio ref="audioGo" :src="goAudioUrl" preload="auto"></audio>
    <audio ref="audioSlide" :src="slideAudioUrl" preload="auto" loop></audio>
    <audio ref="audioFinish" :src="finishAudioUrl" preload="auto"></audio>
  </div>
</template>

<script setup>
import { computed, markRaw, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { clone as cloneSkinnedModel } from 'three/examples/jsm/utils/SkeletonUtils.js'
import Navbar from '@/components/common/utils/Navbar.vue'
import floorTextureImg from './assets/floor.png'
import wallTextureImg from './assets/wall.png'
import wallLeftImg from './assets/cafte1.png'
import wallRightImg from './assets/cafte2.png'
import cafeteriaImg from './assets/cafte3.png'
import bipAudioUrl from './assets/bip.wav?url'
import goAudioUrl from './assets/go.wav?url'
import slideAudioUrl from './assets/slide.wav?url'
import finishAudioUrl from './assets/finish.wav?url'
import femaleAvatarUrl from './assets/avatars/fille.glb?url'
import maleAvatarUrl from './assets/avatars/garcon.glb?url'
import {
  createVentriglisseRace,
  normalizeVentriglisseParticipants,
  rankVentriglisseRace,
  scoreVentriglisseRound,
} from '@/domain/games/ventriglisseRace'
import { getVentriglisseOverviewCamera } from '@/domain/games/ventriglissePlayback'

const trackLength = 120
const racerColors = ['#ffc400', '#3fc380', '#f25f5c', '#5b8def', '#35c2d5', '#a66cff']
const avatarStyles = ['garcon', 'fille']
const avatarUrls = { fille: femaleAvatarUrl, garcon: maleAvatarUrl }
const avatarLoader = new GLTFLoader()
const avatarTemplates = new Map()
let participantSequence = 0
const makeParticipant = (index) => ({
  id: `racer-${++participantSequence}`,
  name: `Joueur ${index + 1}`,
  avatarStyle: avatarStyles[index % avatarStyles.length],
  score: 0,
})

const canvas3d = ref(null)
const stage = ref(null)
const editableParticipants = ref(Array.from({ length: 4 }, (_, index) => makeParticipant(index)))
const participants = reactive([])
const sortedParticipants = ref([])
const winner = ref({ name: '', distance: 0 })
const raceState = ref('idle')
const raceRound = ref(0)
const countdownValue = ref(null)
const showResults = ref(false)
const soundEnabled = ref(true)
const reducedMotion = ref(false)
const pauseReason = ref('')
const formError = ref('')
const sceneError = ref(false)
const avatarLoading = ref(false)
const avatarWarning = ref(false)
const audioBip = ref(null)
const audioGo = ref(null)
const audioSlide = ref(null)
const audioFinish = ref(null)

let scene
let camera
let renderer
let clock
let animationId
let countdownTimer
let launchTimer
let resizeObserver
let sceneGeneration = 0
let operationGeneration = 0
let playbackGeneration = 0
let disposed = false
let pausedPhase = null
let countdownIndex = 0
let countdownDeadline = 0
let countdownRemaining = 700
let countdownPart = 'tick'
let motionQuery
let audioGeneration = 0
let audioSequence = 0
const audioRequests = new WeakMap()
const countdownSequence = [3, 2, 1, 'GO !']

const raceLocked = computed(() => avatarLoading.value || ['preparing', 'countdown', 'racing', 'paused'].includes(raceState.value))
const canTogglePause = computed(() => ['countdown', 'racing', 'paused'].includes(raceState.value))
const liveRanking = computed(() => rankVentriglisseRace(participants))
const scoreRanking = computed(() => [...participants].sort((left, right) => (
  right.score - left.score || left.lane - right.lane
)))
const raceStatusText = computed(() => ({
  idle: 'La piste est prête.',
  preparing: 'Préparation de la piste et des personnages…',
  countdown: 'Départ imminent…',
  racing: 'Course en cours…',
  paused: pauseReason.value === 'visibility' ? 'Manche en pause après un changement d’onglet. Reprenez quand vous êtes prêt.' : 'Manche en pause. Reprenez quand vous êtes prêt.',
  finished: `${winner.value.name} remporte la manche.`,
}[raceState.value]))

const safePlay = async (audio) => {
  if (disposed || !soundEnabled.value || !audio) return
  const generation = audioGeneration
  const request = ++audioSequence
  audioRequests.set(audio, request)
  try {
    audio.currentTime = 0
    await audio.play()
    if (audioRequests.get(audio) !== request) return
    if (disposed || generation !== audioGeneration || !soundEnabled.value) stopAudio(audio)
  } catch {
    if (!disposed && generation === audioGeneration && audioRequests.get(audio) === request) soundEnabled.value = false
  }
}

const stopAudio = (audio) => {
  if (!audio) return
  audio.pause()
  audio.currentTime = 0
}

const stopAllAudio = () => {
  audioGeneration += 1
  ;[audioBip.value, audioGo.value, audioSlide.value, audioFinish.value].forEach(stopAudio)
}

watch(soundEnabled, enabled => {
  if (!enabled) stopAllAudio()
  else if (!disposed && raceState.value === 'racing') safePlay(audioSlide.value)
}, { flush: 'sync' })

const addParticipant = () => {
  if (disposed || raceLocked.value || editableParticipants.value.length >= 6) return
  editableParticipants.value.push(makeParticipant(editableParticipants.value.length))
}

const removeParticipant = (index) => {
  if (disposed || raceLocked.value || editableParticipants.value.length <= 2) return
  editableParticipants.value.splice(index, 1)
}

const pointsForRank = (index) => sortedParticipants.value[index]?.roundPoints ?? Math.max(1, participants.length - index)

const disposeScene = () => {
  scene?.traverse((object) => {
    if (object.userData.sharedAvatarAsset) return
    object.geometry?.dispose?.()
    const disposeMaterial = (material) => {
      material.map?.dispose?.()
      material.dispose?.()
    }
    if (Array.isArray(object.material)) object.material.forEach(disposeMaterial)
    else if (object.material) disposeMaterial(object.material)
  })
  renderer?.dispose()
  scene = null
  camera = null
  renderer = null
  participants.forEach((participant) => { participant.mesh = null; participant.racerModel = null })
}

const loadAvatarTemplate = (style) => {
  const gender = style === 'fille' ? 'fille' : 'garcon'
  if (!avatarTemplates.has(gender)) {
    const pending = avatarLoader.loadAsync(avatarUrls[gender]).catch((error) => {
      avatarTemplates.delete(gender)
      throw error
    })
    avatarTemplates.set(gender, pending)
  }
  return avatarTemplates.get(gender)
}

const createRacer = (participant, index, template) => {
  const group = new THREE.Group()
  let model
  if (template) {
    model = cloneSkinnedModel(template.scene)
    model.traverse((object) => { object.userData.sharedAvatarAsset = true })
    model.scale.setScalar(2)
  } else {
    const fallbackMaterial = new THREE.MeshStandardMaterial({ color: participant.color, roughness: 0.5 })
    model = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.25, 6, 12), fallbackMaterial)
    body.position.y = 1.35
    model.add(body)
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), fallbackMaterial)
    head.position.y = 2.55
    model.add(head)
  }
  group.add(model)
  group.position.set((index - (participants.length - 1) / 2) * 3.6, -0.72, 2)
  scene.add(group)
  participant.mesh = markRaw(group)
  participant.racerModel = markRaw(model)
}

const positionCamera = () => {
  if (!camera) return
  if (reducedMotion.value) {
    const overview = getVentriglisseOverviewCamera(trackLength, Math.max(26, participants.length * 4.2), camera.aspect, camera.fov)
    camera.far = Math.max(500, overview.distance + overview.radius * 2)
    camera.updateProjectionMatrix()
    camera.position.set(overview.x, overview.y, overview.z)
    camera.lookAt(0, 0, overview.targetZ)
    return
  }
  if (camera.far !== 500) {
    camera.far = 500
    camera.updateProjectionMatrix()
  }
  if (['racing', 'finished'].includes(raceState.value) || (raceState.value === 'paused' && pausedPhase === 'racing')) {
    const leadDistance = Math.max(0, ...participants.map(participant => participant.distance))
    camera.position.set(0, 11, Math.max(-88, 24 - leadDistance * 0.78))
    camera.lookAt(0, 0, Math.max(-112, -38 - leadDistance * 0.72))
  } else {
    camera.position.set(0, 11, 24)
    camera.lookAt(0, 0, -45)
  }
}

const resizeRenderer = () => {
  if (!renderer || !camera || !stage.value) return
  const width = Math.max(1, stage.value.clientWidth)
  const height = Math.max(1, stage.value.clientHeight)
  renderer.setSize(width, height, false)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  positionCamera()
  renderer.render(scene, camera)
  updateLabels()
}

watch(reducedMotion, () => {
  if (disposed) return
  const racing = raceState.value === 'racing' || (raceState.value === 'paused' && pausedPhase === 'racing')
  participants.forEach(participant => {
    if (participant.racerModel) participant.racerModel.rotation.x = !reducedMotion.value && racing ? -Math.PI / 2 : 0
  })
  positionCamera()
  if (renderer && scene && camera) renderer.render(scene, camera)
  updateLabels()
})

const supportsWebGL = () => {
  try {
    const probe = document.createElement('canvas')
    const context = probe.getContext('webgl2') || probe.getContext('webgl') || probe.getContext('experimental-webgl')
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch {
    return false
  }
}

const buildScene = async () => {
  if (disposed || !canvas3d.value || !stage.value) return
  const generation = ++sceneGeneration
  disposeScene()
  sceneError.value = false
  avatarWarning.value = false
  avatarLoading.value = true
  clock = new THREE.Clock()
  if (!supportsWebGL()) {
    sceneError.value = true
    avatarLoading.value = false
    return
  }
  try {
    scene = new THREE.Scene()
    scene.background = new THREE.Color('#102c4d')
    camera = new THREE.PerspectiveCamera(54, 1, 0.1, 500)
    camera.position.set(0, 11, 24)
    camera.lookAt(0, 0, -45)

    scene.add(new THREE.HemisphereLight(0xeaf8ff, 0x09203b, 2.1))
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.4)
    keyLight.position.set(-8, 18, 15)
    scene.add(keyLight)

    const trackWidth = Math.max(26, participants.length * 4.2)
    const textureLoader = new THREE.TextureLoader()
    const [floorTexture, wallTexture, leftTexture, rightTexture, backTexture] = await Promise.all([
      textureLoader.loadAsync(floorTextureImg),
      textureLoader.loadAsync(wallTextureImg),
      textureLoader.loadAsync(wallLeftImg),
      textureLoader.loadAsync(wallRightImg),
      textureLoader.loadAsync(cafeteriaImg),
    ])
    if (disposed || generation !== sceneGeneration) {
      ;[floorTexture, wallTexture, leftTexture, rightTexture, backTexture].forEach(texture => texture.dispose())
      return
    }
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping
    floorTexture.repeat.set(8, 34)
    floorTexture.colorSpace = THREE.SRGBColorSpace
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping
    wallTexture.repeat.set(8, 3)
    wallTexture.colorSpace = THREE.SRGBColorSpace
    ;[leftTexture, rightTexture, backTexture].forEach((texture) => { texture.colorSpace = THREE.SRGBColorSpace })

    const track = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, trackLength + 20),
      new THREE.MeshStandardMaterial({ map: floorTexture, color: 0x8de3ff, roughness: 0.22, metalness: 0.08 })
    )
    track.rotation.x = -Math.PI / 2
    track.position.set(0, -0.8, -trackLength / 2 + 4)
    scene.add(track)

    const sideGeometry = new THREE.PlaneGeometry(trackLength + 20, 15)
    const leftWall = new THREE.Mesh(sideGeometry, new THREE.MeshStandardMaterial({ map: leftTexture }))
    leftWall.position.set(-trackWidth / 2, 6.7, -trackLength / 2 + 4)
    leftWall.rotation.y = Math.PI / 2
    scene.add(leftWall)
    const rightWall = new THREE.Mesh(sideGeometry, new THREE.MeshStandardMaterial({ map: rightTexture }))
    rightWall.position.set(trackWidth / 2, 6.7, -trackLength / 2 + 4)
    rightWall.rotation.y = -Math.PI / 2
    scene.add(rightWall)
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, 15),
      new THREE.MeshStandardMaterial({ map: backTexture })
    )
    backWall.position.set(0, 6.7, -trackLength + 3)
    scene.add(backWall)

    const frontWall = new THREE.Mesh(
      new THREE.PlaneGeometry(trackWidth, 9),
      new THREE.MeshStandardMaterial({ map: wallTexture, transparent: true, opacity: 0.42 })
    )
    frontWall.position.set(0, 3.7, 9)
    frontWall.rotation.y = Math.PI
    scene.add(frontWall)

    const lineMaterial = new THREE.MeshBasicMaterial({ color: 0xdff7ff, transparent: true, opacity: 0.55 })
    for (let index = 1; index < participants.length; index += 1) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.06, trackLength), lineMaterial)
      line.rotation.x = -Math.PI / 2
      line.position.set((index - participants.length / 2) * 3.6, -0.76, -trackLength / 2 + 4)
      scene.add(line)
    }

    const finish = new THREE.Mesh(
      new THREE.PlaneGeometry(Math.max(18, participants.length * 3.8), 1.2),
      new THREE.MeshBasicMaterial({ color: 0xffc400 })
    )
    finish.rotation.x = -Math.PI / 2
    finish.position.set(0, -0.74, -trackLength + 2)
    scene.add(finish)

    const bubbleMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xe5f9ff,
      transparent: true,
      opacity: 0.48,
      roughness: 0.08,
      transmission: 0.72,
      clearcoat: 1,
    })
    for (let index = 0; index < 26; index += 1) {
      const size = 0.18 + (index % 6) * 0.09
      const bubble = new THREE.Mesh(new THREE.SphereGeometry(size, 10, 8), bubbleMaterial)
      bubble.position.set(
        ((index * 7.3) % trackWidth) - trackWidth / 2,
        -0.48 + (index % 3) * 0.13,
        -((index * 13.7) % trackLength)
      )
      scene.add(bubble)
    }

    const waterMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x4bc3f1,
      transparent: true,
      opacity: 0.34,
      roughness: 0.04,
      metalness: 0.18,
      clearcoat: 1,
    })
    for (let index = 0; index < 7; index += 1) {
      const puddle = new THREE.Mesh(new THREE.CircleGeometry(trackWidth * (0.12 + (index % 3) * 0.035), 30), waterMaterial)
      puddle.rotation.x = -Math.PI / 2
      puddle.scale.y = 0.44 + (index % 2) * 0.18
      puddle.position.set((index % 2 ? 1 : -1) * trackWidth * 0.14, -0.73, -11 - index * 16)
      scene.add(puddle)
    }

    renderer = new THREE.WebGLRenderer({ canvas: canvas3d.value, antialias: true, powerPreference: 'high-performance' })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
    resizeRenderer()
    renderer.render(scene, camera)

    const loadedAvatars = await Promise.allSettled(
      participants.map((participant) => loadAvatarTemplate(participant.avatarStyle))
    )
    if (disposed || generation !== sceneGeneration) return
    loadedAvatars.forEach((result, index) => {
      if (result.status === 'rejected') avatarWarning.value = true
      createRacer(participants[index], index, result.status === 'fulfilled' ? result.value : null)
    })
    renderer.render(scene, camera)
    updateLabels()
  } catch (error) {
    if (disposed || generation !== sceneGeneration) return
    console.warn('Vue 3D du Ventriglisse indisponible, activation du suivi simplifié.', error)
    sceneError.value = true
  } finally {
    if (generation === sceneGeneration) avatarLoading.value = false
  }
}

const updateLabels = () => {
  if (!renderer || !camera) return
  participants.forEach((participant) => {
    if (!participant.mesh) return
    const projected = participant.mesh.position.clone()
    projected.y += 2.8
    projected.project(camera)
    const label = document.getElementById(`racer-label-${participant.id}`)
    if (!label) return
    label.style.left = `${(projected.x * 0.5 + 0.5) * renderer.domElement.clientWidth}px`
    label.style.top = `${(-projected.y * 0.5 + 0.5) * renderer.domElement.clientHeight}px`
    label.hidden = projected.z < -1 || projected.z > 1
  })
}

const resetRacePositions = () => {
  participants.forEach((participant, index) => {
    participant.distance = 0
    participant.velocity = 0
    participant.drag = 0
    participant.mesh?.position.set((index - (participants.length - 1) / 2) * 3.6, -0.72, 2)
    if (participant.racerModel) participant.racerModel.rotation.x = 0
  })
  positionCamera()
  renderer?.render(scene, camera)
  updateLabels()
}

const prepareParticipants = async (generation) => {
  const names = editableParticipants.value.map(({ name }) => String(name || '').trim())
  if (names.some((name) => !name)) {
    formError.value = 'Chaque couloir doit avoir un nom.'
    return false
  }
  formError.value = ''
  const existingScores = new Map(participants.map((participant) => [participant.id, participant.score || 0]))
  const normalized = normalizeVentriglisseParticipants(editableParticipants.value)
  editableParticipants.value = normalized.map((participant) => ({ ...participant }))
  participants.splice(0, participants.length, ...normalized.map((participant, index) => ({
    ...participant,
    lane: index + 1,
    color: racerColors[index],
    distance: 0,
    velocity: 0,
    drag: 0,
    score: existingScores.get(participant.id) ?? participant.score ?? 0,
    mesh: null,
  })))
  showResults.value = false
  await nextTick()
  if (disposed || generation !== operationGeneration) return false
  await buildScene()
  return !disposed && generation === operationGeneration
}

const applyParticipants = async () => {
  if (disposed || raceLocked.value) return false
  const generation = ++operationGeneration
  const previousState = raceState.value
  raceState.value = 'preparing'
  const valid = await prepareParticipants(generation)
  if (disposed || generation !== operationGeneration) return false
  raceState.value = valid ? 'idle' : previousState
  return valid
}

const cancelScheduledPlayback = () => {
  playbackGeneration += 1
  clearTimeout(countdownTimer)
  clearTimeout(launchTimer)
  cancelAnimationFrame(animationId)
  countdownTimer = null
  launchTimer = null
  animationId = null
}

const finishRace = () => {
  if (disposed || raceState.value !== 'racing') return
  cancelScheduledPlayback()
  stopAllAudio()
  sortedParticipants.value = scoreVentriglisseRound(participants)
  sortedParticipants.value.forEach((scoredParticipant) => {
    const participant = participants.find(({ id }) => id === scoredParticipant.id)
    if (participant) Object.assign(participant, scoredParticipant)
    const editable = editableParticipants.value.find(({ id }) => id === scoredParticipant.id)
    if (editable) editable.score = scoredParticipant.score
  })
  winner.value = sortedParticipants.value[0]
  raceState.value = 'finished'
  showResults.value = true
  safePlay(audioFinish.value)
}

const animateRace = (generation) => {
  if (disposed || generation !== playbackGeneration || raceState.value !== 'racing') return
  const delta = Math.min(clock.getDelta(), 0.25)
  let moving = false
  participants.forEach((participant) => {
    if (participant.velocity > 0.1 && participant.distance < trackLength) {
      participant.distance = Math.min(trackLength, participant.distance + participant.velocity * delta)
      participant.velocity = Math.max(0, participant.velocity - participant.drag * delta)
      moving = participant.velocity > 0.1 && participant.distance < trackLength || moving
    }
    participant.mesh?.position.setZ(2 - participant.distance)
  })
  if (camera && renderer && scene) {
    if (!reducedMotion.value) positionCamera()
    renderer.render(scene, camera)
  }
  updateLabels()
  if (moving) animationId = requestAnimationFrame(() => animateRace(generation))
  else finishRace()
}

const beginMotion = () => {
  if (disposed || raceState.value !== 'countdown') return
  if (document.hidden) {
    countdownRemaining = 0
    pauseRace('visibility')
    return
  }
  const race = createVentriglisseRace(participants, raceRound.value)
  race.forEach((result, index) => {
    Object.assign(participants[index], { velocity: result.velocity, drag: result.drag })
    if (participants[index].racerModel) participants[index].racerModel.rotation.x = reducedMotion.value ? 0 : -Math.PI / 2
  })
  raceState.value = 'racing'
  clock.start()
  safePlay(audioGo.value)
  safePlay(audioSlide.value)
  const generation = playbackGeneration
  animationId = requestAnimationFrame(() => animateRace(generation))
}

const queueCountdown = (delay, part) => {
  countdownPart = part
  countdownRemaining = delay
  countdownDeadline = Date.now() + delay
  const generation = playbackGeneration
  const callback = () => {
    if (disposed || generation !== playbackGeneration || raceState.value !== 'countdown') return
    countdownTimer = null
    launchTimer = null
    if (part === 'launch') {
      beginMotion()
      return
    }
    countdownIndex += 1
    if (countdownIndex < countdownSequence.length) {
      countdownValue.value = countdownSequence[countdownIndex]
      if (typeof countdownValue.value === 'number') safePlay(audioBip.value)
      queueCountdown(700, 'tick')
    } else {
      countdownValue.value = null
      queueCountdown(250, 'launch')
    }
  }
  if (part === 'launch') launchTimer = window.setTimeout(callback, delay)
  else countdownTimer = window.setTimeout(callback, delay)
}

const pauseRace = (reason = 'manual') => {
  if (disposed || !['countdown', 'racing'].includes(raceState.value)) return
  pausedPhase = raceState.value
  pauseReason.value = reason
  if (pausedPhase === 'countdown') countdownRemaining = Math.max(0, countdownDeadline - Date.now())
  cancelScheduledPlayback()
  clock?.stop()
  stopAllAudio()
  raceState.value = 'paused'
}

const resumeRace = () => {
  if (disposed || raceState.value !== 'paused' || document.hidden) return
  const phase = pausedPhase
  pauseReason.value = ''
  pausedPhase = null
  raceState.value = phase
  if (phase === 'countdown') queueCountdown(countdownRemaining, countdownPart)
  else if (phase === 'racing') {
    clock.start()
    safePlay(audioSlide.value)
    const generation = playbackGeneration
    animationId = requestAnimationFrame(() => animateRace(generation))
  }
}

const togglePause = () => {
  if (raceState.value === 'paused') resumeRace()
  else pauseRace()
}

const handleStageKeydown = (event) => {
  if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || !canTogglePause.value) return
  if (event.target?.closest?.('input, select, textarea, button, a, [contenteditable="true"]')) return
  if (event.code === 'Space' || event.key === ' ' || event.key?.toLowerCase() === 'p') {
    event.preventDefault()
    togglePause()
  }
}

const handleVisibilityChange = () => { if (document.hidden) pauseRace('visibility') }
const handleMotionPreference = event => { reducedMotion.value = event.matches }

const startRace = async () => {
  if (disposed || raceLocked.value) return
  const generation = ++operationGeneration
  const previousState = raceState.value
  raceState.value = 'preparing'
  const valid = await prepareParticipants(generation)
  if (disposed || generation !== operationGeneration) return
  if (!valid) {
    raceState.value = previousState
    return
  }
  cancelScheduledPlayback()
  stopAllAudio()
  raceRound.value += 1
  showResults.value = false
  resetRacePositions()
  raceState.value = 'countdown'
  countdownIndex = 0
  countdownValue.value = countdownSequence[countdownIndex]
  queueCountdown(700, 'tick')
  if (document.hidden) {
    pauseRace('visibility')
    return
  }
  safePlay(audioBip.value)
}

onMounted(async () => {
  motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)')
  if (motionQuery) {
    reducedMotion.value = motionQuery.matches
    motionQuery.addEventListener?.('change', handleMotionPreference)
  }
  document.addEventListener('visibilitychange', handleVisibilityChange)
  await applyParticipants()
  if (disposed) return
  resizeObserver = new ResizeObserver(resizeRenderer)
  if (stage.value) resizeObserver.observe(stage.value)
})

onBeforeUnmount(() => {
  disposed = true
  operationGeneration += 1
  sceneGeneration += 1
  cancelScheduledPlayback()
  clock?.stop()
  document.removeEventListener('visibilitychange', handleVisibilityChange)
  motionQuery?.removeEventListener?.('change', handleMotionPreference)
  resizeObserver?.disconnect()
  stopAllAudio()
  disposeScene()
})
</script>

<style scoped>
.ventriglisse-page { min-height: 100vh; overflow-y: auto; background: #0b213f; color: #f7f9fc; }
.ventriglisse-shell { width: min(1500px, calc(100% - 2rem)); margin: 0 auto; padding: 2rem 0 5rem; }
.ventriglisse-shell h1, .ventriglisse-shell h2, .ventriglisse-shell h3 { color: #f7f9fc; }
.game-heading { display: grid; grid-template-columns: auto 1fr auto; gap: 1rem; align-items: center; margin-bottom: 1.5rem; }
.heading-icon, .winner-icon { display: grid; width: 3.5rem; height: 3.5rem; place-items: center; border-radius: 14px; background: #ffc400; color: #071426; font-size: 1.45rem; }
.game-heading h1, .game-heading p, .setup-heading h2, .setup-heading p, .race-toolbar h2, .race-toolbar p, .winner-summary p, .winner-summary h2 { margin: 0; }
.game-heading h1 { font-size: clamp(1.8rem, 3vw, 2.6rem); }
.game-heading p, .setup-heading p, .race-toolbar p { color: #b8c7d9; }
.friendly-mode { display: flex; gap: .5rem; align-items: center; padding: .65rem .85rem; border: 1px solid #3b526f; border-radius: 12px; color: #d7e1ed; font-size: .85rem; }
.game-layout { display: grid; grid-template-columns: minmax(17rem, 21rem) minmax(0, 1fr); gap: 1.25rem; align-items: start; }
.race-setup, .race-area, .results-panel { border: 1px solid #294360; border-radius: 16px; background: #07182d; }
.race-setup { padding: 1.1rem; }
.setup-heading, .race-toolbar, .winner-summary { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.participant-count, .position, .rank-number { display: grid; min-width: 2rem; height: 2rem; place-items: center; border-radius: 10px; background: #132b47; color: #ffc400; font-weight: 700; }
.participant-list { display: grid; gap: .7rem; margin: 1rem 0; }
.participant-row { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(7.5rem, .75fr) auto; gap: .65rem; align-items: end; }
.lane-dot, .rank-color { width: .8rem; height: .8rem; border-radius: 50%; margin-bottom: 1rem; }
.participant-field { display: grid; gap: .3rem; }
.participant-field label { color: #b8c7d9; font-size: .75rem; }
.participant-field input, .participant-field select { width: 100%; min-height: 44px; padding: .65rem .75rem; box-sizing: border-box; border: 1px solid #3b526f; border-radius: 10px; background: #0d223b; color: #fff; }
.participant-field input:focus-visible, .participant-field select:focus-visible, button:focus-visible { outline: 3px solid #ffc400; outline-offset: 2px; }
button { min-height: 44px; border: 0; border-radius: 10px; font: inherit; font-weight: 700; cursor: pointer; }
button:disabled { cursor: not-allowed; opacity: .45; }
.icon-button { width: 44px; padding: 0; background: #172d47; color: #f7f9fc; }
.danger-button:hover:not(:disabled) { background: #6b2530; }
.setup-actions { display: grid; grid-template-columns: 1fr 1fr; gap: .65rem; }
.secondary-button { padding: .65rem .8rem; background: #172d47; color: #f7f9fc; }
.primary-button { padding: .72rem 1rem; background: #ffc400; color: #071426; }
.secondary-button:hover:not(:disabled), .icon-button:hover:not(:disabled) { background: #23415f; }
.primary-button:hover:not(:disabled) { background: #ffd84d; }
.form-error { display: flex; gap: .5rem; color: #ffb8be; font-size: .82rem; }
.sound-control { display: grid; grid-template-columns: auto 1fr auto; gap: .7rem; align-items: center; margin-top: 1rem; color: #c6d3e1; }
.motion-control small { display: block; margin-top: .2rem; color: #b8c7d9; font-size: .78rem; line-height: 1.4; }
.sound-toggle { position: relative; width: 54px; min-height: 44px; background: #314760; border-radius: 999px; }
.sound-toggle span { position: absolute; top: 11px; left: 5px; width: 22px; height: 22px; border-radius: 50%; background: #fff; transition: transform .2s ease; }
.sound-toggle[aria-checked="true"] { background: #ffc400; }
.sound-toggle[aria-checked="true"] span { transform: translateX(22px); background: #071426; }
.scoreboard { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #294360; }
.scoreboard-heading { display: flex; align-items: baseline; justify-content: space-between; gap: .75rem; margin-bottom: .55rem; }
.scoreboard-heading h3 { margin: 0; font-size: 1rem; }
.scoreboard-heading span { color: #8fa8c0; font-size: .75rem; }
.scoreboard ol { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
.scoreboard li { display: grid; grid-template-columns: 1.4rem minmax(0, 1fr) auto; gap: .5rem; align-items: center; min-height: 2rem; color: #d7e1ed; font-size: .78rem; }
.scoreboard li > span { display: grid; width: 1.35rem; height: 1.35rem; place-items: center; border-radius: 6px; background: #132b47; color: #ffc400; font-weight: 800; }
.scoreboard li strong { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.scoreboard li b { color: #ffc400; }
.race-area { overflow: hidden; }
.race-toolbar { padding: 1rem 1.15rem; }
.race-controls { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; }
.race-controls button { display: inline-flex; justify-content: center; align-items: center; gap: .45rem; }
.race-shortcuts { margin: 0; padding: 0 1.15rem .85rem; color: #b8c7d9; font-size: .82rem; line-height: 1.5; }
.race-stage { position: relative; height: clamp(28rem, 58vw, 42rem); min-height: 420px; background: #102c4d url('./assets/cafte3.png') center / cover no-repeat; overflow: hidden; }
.race-stage:focus-visible { outline: 3px solid #ffc400; outline-offset: 3px; }
.race-stage::after { position: absolute; inset: 0; content: ''; pointer-events: none; background: linear-gradient(180deg, transparent 58%, rgba(5, 20, 38, .36)); }
.ventriglisse-canvas { width: 100%; height: 100%; display: block; }
.labels-3d { position: absolute; z-index: 2; inset: 0; pointer-events: none; }
.avatar-label { --racer-color: #ffc400; position: absolute; transform: translate(-50%, -110%); padding: .28rem .5rem; border-radius: 8px; background: #071426; color: #fff; font-size: .75rem; font-weight: 700; box-shadow: 0 4px 12px rgba(0, 0, 0, .3); border: 1px solid var(--racer-color); }
.countdown-overlay, .scene-error { position: absolute; z-index: 3; inset: 0; display: grid; place-content: center; text-align: center; }
.countdown-overlay { background: rgba(7, 20, 38, .62); }
.paused-overlay { position: absolute; z-index: 5; inset: 0; display: grid; align-content: center; justify-items: center; gap: .8rem; padding: 1.25rem; background: rgba(7, 20, 38, .82); color: #f7f9fc; text-align: center; }
.paused-overlay > i { color: #ffc400; font-size: 2rem; }
.paused-overlay strong { font-size: 1.5rem; }
.paused-overlay > span { max-width: 30ch; color: #d7e1ed; line-height: 1.5; }
.countdown-number { color: #ffc400; font-size: clamp(4rem, 14vw, 8rem); font-weight: 800; animation: countdown-pop .55s ease-out; }
.scene-error { grid-template-rows: auto auto; gap: 1.5rem; width: 100%; padding: 1.25rem; box-sizing: border-box; background: linear-gradient(rgba(9, 34, 61, .78), rgba(9, 34, 61, .9)); color: #f7f9fc; }
.fallback-message { display: grid; gap: .35rem; justify-items: center; }
.fallback-message i { color: #ffc400; font-size: 2rem; }
.fallback-race { display: grid; width: min(46rem, 86vw); gap: .65rem; text-align: start; }
.fallback-lane { display: grid; grid-template-columns: minmax(5rem, 9rem) minmax(0, 1fr); gap: .75rem; align-items: center; font-size: .75rem; }
.fallback-lane > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.fallback-lane > div { position: relative; height: 2px; background: #3c6a8f; }
.fallback-avatar { position: absolute; top: 50%; width: 1.55rem; height: .82rem; border-radius: 999px 999px .4rem .4rem; background: var(--avatar-color); transform: translate(-50%, -50%); transition: left .08s linear; box-shadow: 0 4px 10px rgba(0, 0, 0, .28); }
.fallback-avatar::before { position: absolute; top: -.46rem; left: .46rem; width: .62rem; height: .62rem; border-radius: 50%; background: #e6ad86; content: ''; }
.fallback-avatar::after { position: absolute; top: -.55rem; left: .43rem; width: .68rem; height: .3rem; border-radius: .45rem .45rem .18rem .18rem; background: #18283b; content: ''; }
.fallback-avatar.is-fille::after { left: .35rem; top: -.62rem; width: .82rem; height: .43rem; border-radius: .5rem .5rem .25rem .25rem; }
.avatar-loading { position: absolute; z-index: 4; inset: 0; display: grid; place-items: center; background: rgba(7, 24, 45, .75); color: #f7f9fc; font-weight: 700; }
.model-warning { margin: 0; padding: .75rem 1.15rem; color: #ffdb78; font-size: .84rem; }
.race-progress { display: grid; gap: .65rem; padding: 1rem 1.15rem 1.2rem; }
.progress-person { display: grid; grid-template-columns: auto 1fr auto; gap: .6rem; align-items: center; font-size: .82rem; }
.progress-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 700; }
.progress-track { height: 6px; overflow: hidden; border-radius: 6px; background: #1d3856; }
.progress-track span { display: block; width: 100%; height: 100%; transform: scaleX(0); transform-origin: left; }
.results-panel { margin-top: 1.25rem; padding: 1.2rem; }
.winner-summary { padding-bottom: 1rem; border-bottom: 1px solid #294360; }
.winner-summary > strong { color: #ffc400; font-size: 1.2rem; }
.winner-summary p { color: #b8c7d9; font-size: .8rem; }
.ranking-list { display: grid; gap: .5rem; margin: 1rem 0; padding: 0; list-style: none; }
.ranking-list li { display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto auto; gap: .7rem; align-items: center; padding: .65rem; border-radius: 10px; background: #10253f; }
.ranking-list .rank-color { margin: 0; }
.ranking-list li:first-child { background: #203653; box-shadow: inset 0 0 0 1px rgba(255, 196, 0, .55); }
.round-points { color: #ffc400; font-weight: 800; }
.results-panel > .primary-button { width: 100%; }
.countdown-fade-enter-active, .countdown-fade-leave-active { transition: opacity .2s ease; }
.countdown-fade-enter-from, .countdown-fade-leave-to { opacity: 0; }
.reduced-motion .countdown-number { animation: none; }
.reduced-motion .countdown-fade-enter-active, .reduced-motion .countdown-fade-leave-active, .reduced-motion .sound-toggle span, .reduced-motion .fallback-avatar { transition: none; }
@keyframes countdown-pop { from { opacity: 0; transform: scale(.7); } to { opacity: 1; transform: scale(1); } }
@media (max-width: 900px) {
  .game-heading { grid-template-columns: auto 1fr; }
  .friendly-mode { grid-column: 1 / -1; justify-self: start; }
  .game-layout { grid-template-columns: 1fr; }
  .race-stage { height: 32rem; }
}
@media (max-width: 560px) {
  .ventriglisse-shell { width: min(100% - 1rem, 1500px); padding-top: 1rem; }
  .game-heading { align-items: start; }
  .heading-icon { width: 3rem; height: 3rem; }
  .game-heading p { font-size: .9rem; }
  .race-toolbar { align-items: stretch; flex-direction: column; }
  .race-toolbar .primary-button { width: 100%; }
  .race-controls { display: grid; grid-template-columns: auto minmax(0, 1fr); width: 100%; }
  .race-stage { height: 27rem; min-height: 360px; }
  .participant-row { grid-template-columns: auto minmax(0, 1fr) auto; }
  .participant-row .avatar-field { grid-column: 2 / 3; }
  .ranking-list li { grid-template-columns: auto auto minmax(0, 1fr) auto; }
  .ranking-list li > :last-child { grid-column: 3 / -1; justify-self: end; color: #b8c7d9; font-size: .75rem; }
}
@media (prefers-reduced-motion: reduce) {
  .countdown-number { animation: none; }
  .countdown-fade-enter-active, .countdown-fade-leave-active, .sound-toggle span, .fallback-avatar { transition: none; }
}
</style>
