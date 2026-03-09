<template>
  <div class="loader-container">
    <div class="cube-scene">
      <div class="cube">
        <div class="cube-face front"><img :src="face1" alt="" /></div>
        <div class="cube-face back"><img :src="face2" alt="" /></div>
        <div class="cube-face right"><img :src="face3" alt="" /></div>
        <div class="cube-face left"><img :src="face4" alt="" /></div>
        <div class="cube-face top"><img :src="face5" alt="" /></div>
        <div class="cube-face bottom"><img :src="face6" alt="" /></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import face1 from '@/assets/textures/face1.png';
import face2 from '@/assets/textures/face2.png';
import face3 from '@/assets/textures/face3.png';
import face4 from '@/assets/textures/face4.png';
import face5 from '@/assets/textures/face5.png';
import face6 from '@/assets/textures/face6.png';
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

.cube-scene {
  width: 120px;
  height: 120px;
  perspective: 400px;
}

.cube {
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  animation: cube-spin 4s infinite linear;
}

.cube-face {
  position: absolute;
  width: 120px;
  height: 120px;
  border-radius: 12px;
  overflow: hidden;
  backface-visibility: visible;
}

.cube-face img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.front  { transform: translateZ(60px); }
.back   { transform: rotateY(180deg) translateZ(60px); }
.right  { transform: rotateY(90deg) translateZ(60px); }
.left   { transform: rotateY(-90deg) translateZ(60px); }
.top    { transform: rotateX(90deg) translateZ(60px); }
.bottom { transform: rotateX(-90deg) translateZ(60px); }

@keyframes cube-spin {
  0%   { transform: rotateX(0deg)   rotateY(0deg); }
  100% { transform: rotateX(360deg) rotateY(360deg); }
}
</style>
