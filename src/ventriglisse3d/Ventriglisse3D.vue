<template>
  <div class="ventriglisse3d-container">
    <form class="participants-form" @submit.prevent="applyParticipants">
      <div v-for="(p, idx) in editableParticipants" :key="idx" class="participant-row">
        <input v-model="p.name" placeholder="Nom du participant" required />
        <input v-model="p.avatarUrl" placeholder="URL avatar ReadyPlayerMe (.glb)" required />
        <button type="button" @click="removeParticipant(idx)" v-if="editableParticipants.length > 2">🗑️</button>
      </div>
      <button type="button" @click="addParticipant">+ Ajouter un participant</button>
      <button type="submit">Valider la liste</button>
    </form>
    <transition name="countdown-fade">
      <div v-if="countdownValue !== null" class="countdown-overlay">
        <span class="countdown-number">{{ countdownValue }}</span>
      </div>
    </transition>
    <canvas ref="canvas3d" class="ventriglisse-canvas" width="1600" height="700"></canvas>
    <Dialog v-model:visible="showResults" modal :closable="false" class="results-dialog" :style="{width: '420px'}">
      <template #header>
        <h2 class="classement-title">Classement</h2>
      </template>
      <ol class="classement-list">
        <li v-for="(p, idx) in sortedParticipants" :key="p.name" :class="['rank', idx === 0 ? 'first' : idx === 1 ? 'second' : idx === 2 ? 'third' : '']">
          <span class="rank-num">{{ idx+1 }}</span>
          <span class="rank-name">{{ p.name }}</span>
          <span class="rank-dist">{{ p.distance.toFixed(1) }} m</span>
        </li>
      </ol>
      <div class="dialog-footer">
        <span class="winner-label">🏆 Gagnant : <b>{{ winner.name }}</b></span>
        <button @click="replay" class="replay-btn">Rejouer</button>
      </div>
    </Dialog>
    <div v-if="!showResults" class="launch-panel">
      <button @click="startRace">Lancer la glissade</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive, watch } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import floorTextureImg from './assets/floor.png';
import wallTextureImg from './assets/wall.png';
import Dialog from 'primevue/dialog';

// Liste modifiable par l'utilisateur
const defaultParticipants = [
  { name: 'Alice', avatarUrl: 'https://models.readyplayer.me/6842a0f9105ed34bf86c5850.glb' },
  { name: 'Bob', avatarUrl: 'https://models.readyplayer.me/6842a147c4abd0700dc2d13c.glb' },
  { name: 'Charly', avatarUrl: 'https://models.readyplayer.me/6842a15582bf1c08fbfaeeca.glb' },
  { name: 'Diane', avatarUrl: 'https://models.readyplayer.me/6842a1c3e02ade94ce20e85e.glb' }
];
const editableParticipants = ref(JSON.parse(JSON.stringify(defaultParticipants)));

const canvas3d = ref(null);
const showResults = ref(false);
const participants = reactive([]);
const sortedParticipants = ref([]);
const winner = ref({ name: '', distance: 0 });
let scene, camera, renderer, animationId;
const friction = 0.012;
const countdownValue = ref(null);
let countdownTimer = null;

function getTrackLength() {
  // Largeur de base : 26, +4 par participant au-delà de 4 (encore plus large)
  const minWidth = 26;
  const extra = Math.max(0, participants.length - 4) * 4;
  return minWidth + extra;
}

function addParticipant() {
  editableParticipants.value.push({ name: '', avatarUrl: '' });
}
function removeParticipant(idx) {
  if (editableParticipants.value.length > 2) {
    editableParticipants.value.splice(idx, 1);
  }
}
function applyParticipants() {
  // Vérifie que tous les noms et URLs sont remplis
  if (editableParticipants.value.some(p => !p.name.trim() || !p.avatarUrl.trim())) {
    alert('Merci de remplir tous les noms et URLs d\'avatar !');
    return;
  }
  showResults.value = false;
  // Copie profonde pour éviter les effets de bord
  participants.splice(0, participants.length, ...editableParticipants.value.map(p => ({ ...p, distance: 0, velocity: 0, mesh: null })));
  // Recharge la scène avec les nouveaux participants
  resetScene();
}

function resetScene() {
  if (renderer) renderer.dispose();
  if (scene) {
    // Supprime tous les objets de la scène
    while(scene.children.length > 0){ scene.remove(scene.children[0]); }
  }
  setupScene();
  if (renderer && scene && camera) renderer.render(scene, camera);
}

function setupScene() {
  scene = new THREE.Scene();
  // Utilise la couleur CSS var(--surface-card) comme fond Three.js
  const cssBg = getComputedStyle(document.documentElement).getPropertyValue('--surface-card').trim() || '#e0f7fa';
  scene.background = new THREE.Color(cssBg);
  camera = new THREE.PerspectiveCamera(60, canvas3d.value.width / canvas3d.value.height, 0.1, 1000);
  camera.position.set(0, 8, 20);
  camera.lookAt(0, 0, -120 / 2);

  // Lumière
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 20, 20);
  scene.add(dirLight);

  // Textures
  const textureLoader = new THREE.TextureLoader();
  const floorTexture = textureLoader.load(floorTextureImg);
  floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
  floorTexture.repeat.set(10, 40);
  const wallTexture = textureLoader.load(wallTextureImg);
  wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.repeat.set(10, 4);

  // Sol
  const floorGeometry = new THREE.PlaneGeometry(getTrackLength(), 120 + 40);
  const floorMaterial = new THREE.MeshPhongMaterial({ map: floorTexture });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -1.1, -120 / 2);
  scene.add(floor);

  // Murs (gauche, droite, fond, devant)
  const wallGeometry = new THREE.PlaneGeometry(120 + 40, 6);
  // Mur gauche
  const wallLeft = new THREE.Mesh(wallGeometry, new THREE.MeshPhongMaterial({ map: wallTexture }));
  wallLeft.position.set(-(getTrackLength()/2), 2, -120 / 2);
  wallLeft.rotation.y = Math.PI / 2;
  scene.add(wallLeft);
  // Mur droit
  const wallRight = new THREE.Mesh(wallGeometry, new THREE.MeshPhongMaterial({ map: wallTexture }));
  wallRight.position.set(getTrackLength()/2, 2, -120 / 2);
  wallRight.rotation.y = -Math.PI / 2;
  scene.add(wallRight);
  // Mur fond
  const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(getTrackLength(), 6), new THREE.MeshPhongMaterial({ map: wallTexture }));
  wallBack.position.set(0, 2, -120 - 20);
  scene.add(wallBack);
  // Mur devant (optionnel)
  const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(getTrackLength(), 6), new THREE.MeshPhongMaterial({ map: wallTexture, opacity: 0.3, transparent: true }));
  wallFront.position.set(0, 2, 20);
  wallFront.rotation.y = Math.PI;
  scene.add(wallFront);

  // Avatars ReadyPlayerMe
  const loader = new GLTFLoader();
  let loadedCount = 0;
  participants.forEach((p, idx) => {
    loader.load(
      p.avatarUrl,
      gltf => {
        const avatar = gltf.scene;
        const spacing = getTrackLength() / Math.max(1, participants.length);
        avatar.position.set((idx - (participants.length - 1) / 2) * spacing, 0, 0);
        avatar.scale.set(3.2, 3.2, 3.2);
        avatar.rotation.x = -Math.PI / 2;
        avatar.rotation.y = Math.PI;
        scene.add(avatar);
        p.mesh = avatar;
        p.distance = 0;
        p.velocity = 0;
        loadedCount++;
        if (loadedCount === participants.length) {
          renderer.render(scene, camera);
        }
      },
      undefined,
      error => {
        // Si erreur, fallback capsule
        const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
        const color = new THREE.Color().setHSL(idx / participants.length, 0.7, 0.5);
        const mat = new THREE.MeshPhongMaterial({ color });
        const mesh = new THREE.Mesh(capsuleGeometry, mat);
        const spacing = getTrackLength() / Math.max(1, participants.length);
        mesh.position.set((idx - (participants.length - 1) / 2) * spacing, 0, 0);
        scene.add(mesh);
        p.mesh = mesh;
        p.distance = 0;
        p.velocity = 0;
        loadedCount++;
        if (loadedCount === participants.length) {
          renderer.render(scene, camera);
        }
      }
    );
  });

  renderer = new THREE.WebGLRenderer({ canvas: canvas3d.value, antialias: true, alpha: true });
  renderer.setSize(canvas3d.value.clientWidth, canvas3d.value.clientHeight, false);
}

function animate() {
  let allStopped = true;
  let maxDistance = 0;
  const trackLength = 120;
  const wallBackZ = -(trackLength + 20); // position du mur du fond
  const avatarDepth = 3.2; // profondeur approximative de l'avatar Ready Player Me (scale)
  const maxDist = Math.abs(wallBackZ) - avatarDepth / 2; // limite stricte
  participants.forEach((p) => {
    if (p.velocity > 0.01) {
      let nextDist = p.distance + p.velocity;
      if (nextDist >= maxDist) {
        p.distance = maxDist;
        p.velocity = 0;
        if (p.mesh) p.mesh.position.z = -maxDist;
      } else {
        p.distance = nextDist;
        p.velocity -= friction;
        if (p.velocity < 0) p.velocity = 0;
        if (p.mesh) p.mesh.position.z = -p.distance;
        allStopped = false;
      }
    }
    if (p.distance > maxDistance) maxDistance = p.distance;
  });
  camera.position.z = 20 - maxDistance;
  camera.lookAt(0, 0, -120 / 2 - maxDistance / 2);
  renderer.render(scene, camera);
  if (!allStopped) {
    animationId = requestAnimationFrame(animate);
  } else {
    showRaceResults();
  }
}

function startRace() {
  showResults.value = false;
  // Place avatars au départ
  participants.forEach(p => {
    p.distance = 0;
    p.velocity = 0;
    if (p.mesh) p.mesh.position.z = 0;
  });
  launchCountdown();
}

function launchCountdown() {
  const sequence = [5, 4, 3, 2, 1, 'GO!'];
  let idx = 0;
  countdownValue.value = sequence[idx];
  countdownTimer = setInterval(() => {
    idx++;
    if (idx < sequence.length) {
      countdownValue.value = sequence[idx];
    } else {
      clearInterval(countdownTimer);
      countdownValue.value = null;
      // Lancer la glissade
      participants.forEach(p => {
        // Vitesse de départ modérée mais friction réduite pour aller plus loin
        p.velocity = Math.random() * 0.9 + 0.7;
      });
      animate();
    }
  }, 800);
}

function showRaceResults() {
  sortedParticipants.value = [...participants].sort((a, b) => b.distance - a.distance);
  winner.value = sortedParticipants.value[0];
  showResults.value = true;
}

function replay() {
  // Réinitialise les positions et distances, cache le classement, avatars sur la ligne de départ
  showResults.value = false;
  participants.forEach(p => {
    p.distance = 0;
    p.velocity = 0;
    if (p.mesh) p.mesh.position.z = 0;
  });
  // On ne lance pas la course, il faudra cliquer sur "Lancer la glissade"
  resetScene();
}

onMounted(() => {
  // Initialise la liste des participants (copie profonde)
  participants.splice(0, participants.length, ...editableParticipants.value.map(p => ({ ...p, distance: 0, velocity: 0, mesh: null })));
  setTimeout(() => {
    setupScene();
    renderer.render(scene, camera);
  }, 50);
});
onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer);
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.ventriglisse3d-container {
  width: 100%;
  max-width: 2000px;
  margin: 0 auto;
  position: relative;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 24px 0 12px 0;
}
.participants-form {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-bottom: 16px;
  justify-content: center;
}
.participant-row {
  display: flex;
  gap: 4px;
  align-items: center;
}
.participant-row input {
  padding: 6px 8px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 1em;
  min-width: 180px;
}
.participant-row button {
  background: #ff6666;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 4px 8px;
  cursor: pointer;
}
.participants-form > button[type="button"] {
  background: #f3c300;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  margin-left: 8px;
  cursor: pointer;
}
.participants-form > button[type="submit"] {
  background: #00bcd4;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  margin-left: 8px;
  cursor: pointer;
}
.ventriglisse-canvas {
  width: 100%;
  height: 700px;
  max-width: 2000px;
  display: block;
  border-radius: 10px;
  background: #aeefff;
}
.launch-panel {
  text-align: center;
  margin-top: 18px;
}
button {
  background: #f3c300;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: var(--surface-hover);
}
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.28);
  z-index: 10;
}
.countdown-number {
  font-size: 7rem;
  font-weight: bold;
  color: #f3c300;
  text-shadow: 2px 2px 16px #000, 0 0 48px #fff;
  letter-spacing: 0.1em;
  animation: countdown-pop 0.7s;
}
@keyframes countdown-pop {
  0% { transform: scale(0.3); opacity: 0; }
  60% { transform: scale(1.2); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.countdown-fade-enter-active, .countdown-fade-leave-active {
  transition: opacity 0.3s;
}
.countdown-fade-enter-from, .countdown-fade-leave-to {
  opacity: 0;
}
.results-dialog .classement-title {
  text-align: center;
  font-size: 2.1em;
  letter-spacing: 0.05em;
  margin-bottom: 0.6em;
  color: #f3c300;
  text-shadow: 2px 2px 12px #000, 0 0 32px #fff;
}
.classement-list {
  list-style: none;
  padding: 0;
  margin: 0 0 1.2em 0;
}
.classement-list .rank {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 1.3em;
  background: #fffbe6;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 10px 18px;
  box-shadow: 0 2px 8px #0002;
  font-weight: 500;
}
.classement-list .first {
  background: linear-gradient(90deg, #ffe066 60%, #fffbe6 100%);
  color: #c89100;
  font-size: 1.5em;
  font-weight: bold;
}
.classement-list .second {
  background: linear-gradient(90deg, #e0e0e0 60%, #fffbe6 100%);
  color: #888;
}
.classement-list .third {
  background: linear-gradient(90deg, #f7b267 60%, #fffbe6 100%);
  color: #a85c00;
}
.rank-num {
  font-size: 1.1em;
  margin-right: 8px;
  font-weight: bold;
}
.rank-name {
  flex: 1;
  text-align: left;
}
.rank-dist {
  margin-left: 12px;
  font-size: 0.95em;
}
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.2em;
}
.winner-label {
  font-size: 1.1em;
  color: #f3c300;
  font-weight: bold;
}
.replay-btn {
  background: #00bcd4;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 8px 18px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.2s;
}
.replay-btn:hover {
  background: #0097a7;
}
</style>
