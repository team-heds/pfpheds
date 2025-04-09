<template>
  <div ref="loaderContainer" class="loader-container"></div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three-stdlib';
import face1 from '@/assets/textures/face1.png';
import face2 from '@/assets/textures/face2.png';
import face3 from '@/assets/textures/face3.png';
import face4 from '@/assets/textures/face4.png';
import face5 from '@/assets/textures/face5.png';
import face6 from '@/assets/textures/face6.png';

const loaderContainer = ref(null);
let scene, camera, renderer, cube, animationId;
let visible = true;
document.addEventListener('visibilitychange', () => visible = !document.hidden);

const loadTextures = () => {
  const loader = new THREE.TextureLoader();
  return Promise.all([
    loader.loadAsync(face1),
    loader.loadAsync(face2),
    loader.loadAsync(face3),
    loader.loadAsync(face4),
    loader.loadAsync(face5),
    loader.loadAsync(face6),
  ]);
};

const onWindowResize = () => {
  const { clientWidth: width, clientHeight: height } = loaderContainer.value;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const animate = () => {
  if (visible) requestAnimationFrame(animate);
  else setTimeout(animate, 100);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
};

onMounted(async () => {
  scene = new THREE.Scene();
  const { clientWidth: width, clientHeight: height } = loaderContainer.value;
  camera = new THREE.PerspectiveCamera(100, width / height, 0.1, 1000);
  camera.position.z = 5;

  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(width, height);
  loaderContainer.value.appendChild(renderer.domElement);

  const textures = await loadTextures();
  const materials = textures.map(tex => new THREE.MeshBasicMaterial({ map: tex }));
  const geometry = new RoundedBoxGeometry(2, 2, 2, 16, 0.3);
  cube = new THREE.Mesh(geometry, materials);
  scene.add(cube);

  window.addEventListener('resize', onWindowResize);
  animate();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(animationId);
  window.removeEventListener('resize', onWindowResize);
  document.removeEventListener('visibilitychange', () => {});
  renderer.dispose();
  scene.remove(cube);
  cube.geometry.dispose();
  cube.material.forEach(mat => mat.dispose());
  loaderContainer.value.removeChild(renderer.domElement);
});
</script>

<style scoped>
.loader-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--surface-ground);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}
</style>
