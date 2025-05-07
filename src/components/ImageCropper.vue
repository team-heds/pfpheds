<template>
  <div class="cropper-modal">
    <div class="cropper-content">
      <div class="cropper-container">
        <canvas ref="canvas" :width="canvasWidth" :height="canvasHeight" @mousedown="startDrag" @mousemove="onDrag" @mouseup="endDrag" @mouseleave="endDrag"></canvas>
      </div>
      <div class="cropper-controls">
        <label>Zoom
          <input type="range" min="1" max="3" step="0.01" v-model.number="zoom" @input="draw" />
        </label>
        <button @click="$emit('cancel')">Annuler</button>
        <button @click="emitCropped">Valider</button>
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
  background: rgba(0,0,0,0.68);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}
.cropper-content {
  background: #222;
  border-radius: 16px;
  padding: 24px 28px 18px;
  min-width: 380px;
  box-shadow: 0 2px 32px rgba(0,0,0,0.38);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cropper-container {
  margin-bottom: 18px;
  background: #111;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 1px 8px rgba(0,0,0,0.12);
}
canvas {
  border-radius: 10px;
  background: #000;
  display: block;
}
.cropper-controls {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 10px;
}
</style>
