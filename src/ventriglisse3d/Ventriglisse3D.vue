<template>
  <div class="ventriglisse3d-container">
    <canvas ref="canvas3d" class="ventriglisse-canvas"></canvas>
    <div v-if="showResults" class="results-panel">
      <h3>Résultats</h3>
      <ul>
        <li v-for="p in sortedParticipants" :key="p.name">
          {{ p.name }} : {{ p.distance.toFixed(1) }} m
        </li>
      </ul>
      <h2>Gagnant : {{ winner.name }}</h2>
      <button @click="replay">Rejouer</button>
    </div>
    <div v-else class="launch-panel">
      <button @click="startRace">Lancer la glissade</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, reactive } from 'vue';
import * as THREE from 'three';
import participantsData from './participants.json';

const canvas3d = ref(null);
const showResults = ref(false);
const participants = reactive(participantsData.map(p => ({ ...p, distance: 0, velocity: 0, mesh: null })));
const sortedParticipants = ref([]);
const winner = ref({ name: '', distance: 0 });
let scene, camera, renderer, animationId;
const trackLength = 40; // mètres
const friction = 0.04;

function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#aeefff');
  camera = new THREE.PerspectiveCamera(60, canvas3d.value.width / canvas3d.value.height, 0.1, 1000);
  camera.position.set(0, 8, 20); // Caméra plus proche, regarde vers la piste
  camera.lookAt(0, 0, -trackLength / 2);

  // Lumière
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(0, 20, 20);
  scene.add(dirLight);

  // Piste (dans la profondeur)
  const trackGeometry = new THREE.BoxGeometry(4, 0.2, trackLength);
  const trackMaterial = new THREE.MeshPhongMaterial({ color: '#5ec6fa' });
  const track = new THREE.Mesh(trackGeometry, trackMaterial);
  track.position.set(0, -1, -trackLength / 2);
  scene.add(track);

  // Avatars/capsules
  const capsuleGeometry = new THREE.CapsuleGeometry(0.5, 1.2, 8, 16);
  participants.forEach((p, idx) => {
    const color = new THREE.Color().setHSL(idx / participants.length, 0.7, 0.5);
    const mat = new THREE.MeshPhongMaterial({ color });
    const mesh = new THREE.Mesh(capsuleGeometry, mat);
    mesh.position.set((idx - (participants.length - 1) / 2) * 1.5, 0, 0);
    scene.add(mesh);
    p.mesh = mesh;
    p.distance = 0;
    p.velocity = 0;
  });

  renderer = new THREE.WebGLRenderer({ canvas: canvas3d.value, antialias: true });
  renderer.setSize(canvas3d.value.clientWidth, canvas3d.value.clientHeight, false);
}

function animate() {
  let allStopped = true;
  let maxDistance = 0;
  participants.forEach((p) => {
    if (p.velocity > 0.01) {
      p.distance += p.velocity;
      p.velocity -= friction;
      if (p.velocity < 0) p.velocity = 0;
      p.mesh.position.z = -p.distance;
      if (p.distance > maxDistance) maxDistance = p.distance;
      allStopped = false;
    }
  });
  // Caméra suit le plus loin
  camera.position.z = 20 - maxDistance;
  camera.lookAt(0, 0, -trackLength / 2 - maxDistance / 2);

  renderer.render(scene, camera);
  if (!allStopped) {
    animationId = requestAnimationFrame(animate);
  } else {
    showRaceResults();
  }
}

function startRace() {
  // Reset
  showResults.value = false;
  participants.forEach(p => {
    p.distance = 0;
    p.velocity = Math.random() * 1.3 + 0.7; // force aléatoire
    p.mesh.position.z = 0;
  });
  animate();
}

function showRaceResults() {
  sortedParticipants.value = [...participants].sort((a, b) => b.distance - a.distance);
  winner.value = sortedParticipants.value[0];
  showResults.value = true;
}

function replay() {
  startRace();
}

onMounted(() => {
  setTimeout(() => {
    setupScene();
    renderer.render(scene, camera);
  }, 50);
});
onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId);
  if (renderer) renderer.dispose();
});
</script>

<style scoped>
.ventriglisse3d-container {
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  background: #e0f7fa;
  border-radius: 12px;
  padding: 24px 0 12px 0;
}
.ventriglisse-canvas {
  width: 100%;
  height: 400px;
  display: block;
  border-radius: 10px;
  background: #aeefff;
}
.results-panel, .launch-panel {
  text-align: center;
  margin-top: 18px;
}
button {
  background: #00bcd4;
  color: #fff;
  border: none;
  padding: 10px 22px;
  border-radius: 20px;
  font-size: 1.1em;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: #008ba3;
}
</style>
