<template>
  <div class="cropper-modal p-d-flex p-jc-center p-ai-center">
    <div class="cropper-content p-shadow-5">
      <div class="p-text-center p-mb-3">
        <h2>Recadrer votre image</h2>
      </div>
      
      <div class="cropper-container p-mb-3">
        <canvas 
          ref="canvas" 
          :width="canvasWidth" 
          :height="canvasHeight" 
          @mousedown="startDrag" 
          @mousemove="onDrag" 
          @mouseup="endDrag" 
          @mouseleave="endDrag"
          @touchstart="startTouchDrag"
          @touchmove="onTouchDrag"
          @touchend="endDrag"
        ></canvas>
      </div>
      
      <div class="cropper-controls p-mb-3">
        <div class="p-field p-d-flex p-flex-column p-mb-3">
          <label for="zoom-slider" class="p-mb-2">Zoom</label>
          <Slider 
            id="zoom-slider"
            v-model="zoom" 
            :min="1" 
            :max="3" 
            :step="0.01" 
            @change="draw"
            class="p-mb-2"
          />
          <small>{{ Math.round(zoom * 100) }}%</small>
        </div>
      </div>
      
      <div class="p-d-flex p-jc-between p-w-100">
        <Button 
          label="Annuler" 
          icon="pi pi-times" 
          class="p-button-outlined" 
          @click="$emit('cancel')"
        />
        <Button 
          label="Valider" 
          icon="pi pi-check" 
          class="p-button-primary" 
          @click="emitCropped"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImageCropper',
  props: {
    src: { type: String, required: true },
    aspect: { type: Number, default: 9/16 },
    outputWidth: { type: Number, default: 720 },
    outputHeight: { type: Number, default: 1280 },
  },
  data() {
    return {
      img: null,
      dragging: false,
      dragStart: { x: 0, y: 0 },
      offset: { x: 0, y: 0 },
      lastOffset: { x: 0, y: 0 },
      zoom: 1,
      canvasWidth: 360,
      canvasHeight: 640,
    };
  },
  mounted() {
    this.img = new window.Image();
    this.img.onload = this.draw;
    this.img.src = this.src;
    
    // Adapter la taille du canvas pour les appareils mobiles
    if (window.innerWidth < 768) {
      const ratio = this.canvasHeight / this.canvasWidth;
      this.canvasWidth = Math.min(320, window.innerWidth - 80);
      this.canvasHeight = this.canvasWidth * ratio;
    }
  },
  methods: {
    draw() {
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      if (!this.img) return;
      // Calculate scaled image size
      const scale = Math.max(
        this.canvasWidth / this.img.width,
        this.canvasHeight / this.img.height
      ) * this.zoom;
      const imgWidth = this.img.width * scale;
      const imgHeight = this.img.height * scale;
      const x = this.offset.x + (this.canvasWidth - imgWidth) / 2;
      const y = this.offset.y + (this.canvasHeight - imgHeight) / 2;
      ctx.drawImage(this.img, x, y, imgWidth, imgHeight);
      
      // Ajouter une grille de recadrage pour une meilleure visibilité
      this.drawGrid(ctx);
    },
    drawGrid(ctx) {
      // Dessiner une grille de règle des tiers pour aider au cadrage
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      
      // Lignes horizontales
      for (let i = 1; i < 3; i++) {
        const y = (this.canvasHeight / 3) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(this.canvasWidth, y);
        ctx.stroke();
      }
      
      // Lignes verticales
      for (let i = 1; i < 3; i++) {
        const x = (this.canvasWidth / 3) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, this.canvasHeight);
        ctx.stroke();
      }
      
      // Bordure pour indiquer la zone de recadrage
      ctx.strokeStyle = 'rgba(33, 150, 243, 0.8)';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, this.canvasWidth, this.canvasHeight);
    },
    startDrag(e) {
      this.dragging = true;
      this.dragStart = { x: e.offsetX, y: e.offsetY };
      this.lastOffset = { ...this.offset };
    },
    onDrag(e) {
      if (!this.dragging) return;
      const dx = e.offsetX - this.dragStart.x;
      const dy = e.offsetY - this.dragStart.y;
      this.offset.x = this.lastOffset.x + dx;
      this.offset.y = this.lastOffset.y + dy;
      this.draw();
    },
    // Support tactile pour les appareils mobiles
    startTouchDrag(e) {
      if (e.touches.length !== 1) return;
      this.dragging = true;
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      this.dragStart = { 
        x: touch.clientX - rect.left, 
        y: touch.clientY - rect.top 
      };
      this.lastOffset = { ...this.offset };
      e.preventDefault();
    },
    onTouchDrag(e) {
      if (!this.dragging || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const rect = e.target.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      const dx = x - this.dragStart.x;
      const dy = y - this.dragStart.y;
      this.offset.x = this.lastOffset.x + dx;
      this.offset.y = this.lastOffset.y + dy;
      this.draw();
      e.preventDefault();
    },
    endDrag() {
      this.dragging = false;
    },
    emitCropped() {
      // Export the crop as a 9:16 image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = this.outputWidth;
      tempCanvas.height = this.outputHeight;
      const ctx = tempCanvas.getContext('2d');
      // Calculate scale and offset for export
      const scale = Math.max(
        this.canvasWidth / this.img.width,
        this.canvasHeight / this.img.height
      ) * this.zoom;
      const imgWidth = this.img.width * scale;
      const imgHeight = this.img.height * scale;
      const x = this.offset.x + (this.canvasWidth - imgWidth) / 2;
      const y = this.offset.y + (this.canvasHeight - imgHeight) / 2;
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      ctx.drawImage(
        this.img,
        x * (this.outputWidth / this.canvasWidth),
        y * (this.outputHeight / this.canvasHeight),
        imgWidth * (this.outputWidth / this.canvasWidth),
        imgHeight * (this.outputHeight / this.canvasHeight)
      );
      tempCanvas.toBlob(blob => {
        this.$emit('cropped', blob);
      }, 'image/jpeg', 0.92);
    },
  },
  watch: {
    zoom() {
      this.draw();
    },
    src() {
      this.img = new window.Image();
      this.img.onload = this.draw;
      this.img.src = this.src;
    },
  },
};
</script>

<style scoped>
.cropper-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.cropper-content {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 24px 28px;
  width: 450px;
  max-width: 95vw;
  box-shadow: 0 2px 32px rgba(0,0,0,0.38);
  color: var(--text-color);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.cropper-content h2 {
  color: var(--primary-color);
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 1rem;
}

.cropper-container {
  margin-bottom: 1.5rem;
  background: #111;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.12);
  overflow: hidden;
}

canvas {
  border-radius: 10px;
  background: #000;
  display: block;
  cursor: move;
}

.cropper-controls {
  width: 100%;
  padding: 0 1rem;
}

@media (max-width: 768px) {
  .cropper-content {
    padding: 16px 20px;
    border-radius: 12px;
  }
  
  .cropper-container {
    border-radius: 8px;
    padding: 4px;
  }
  
  canvas {
    border-radius: 6px;
  }
}
</style>
