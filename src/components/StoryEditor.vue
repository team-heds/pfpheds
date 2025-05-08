<template>
  <div class="cropper-modal">
    a
    <div class="cropper-content">
      <div class="editor-controls">
        <input v-model="text" maxlength="60" placeholder="Ajouter un texte..." class="text-input" />
        <select v-model="selectedEmoji" class="emoji-select">
          <option value="">😀</option>
          <option v-for="emoji in emojis" :key="emoji" :value="emoji">{{ emoji }}</option>
        </select>
        <button @click="addText">Ajouter texte</button>
        <button @click="addEmoji">Ajouter emoji</button>
        <button @click="$emit('cancel')">Annuler</button>
        <button @click="emitEdited">Valider</button>
      </div>
      <div class="cropper-container">
        <canvas ref="canvas" :width="outputWidth" :height="outputHeight"
                @mousedown="startDrag"
                @mousemove="onDrag"
                @mouseup="endDrag"
                @mouseleave="endDrag"
                @touchstart.prevent="startDragTouch"
                @touchmove.prevent="onDragTouch"
                @touchend.prevent="endDrag"
                style="touch-action: none; user-select: none;"
        ></canvas>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  name: 'StoryEditor',
  props: {
    src: { type: String, required: true },
    outputWidth: { type: Number, default: 720 },
    outputHeight: { type: Number, default: 1280 },
  },
  data() {
    return {
      img: null,
      text: '',
      selectedEmoji: '',
      emojis: ['😂','😍','🔥','🥳','😎','👍','🎉','💯','🤩','😭','😇','😜','😱','😅','😏','🤗','🙏','😡','😬','🥰'],
      elements: [],
      draggingIdx: null,
      dragging: false,
      scale: 0.5, // Pour correspondre au transform: scale(0.5) CSS
      dragOffset: { x: 0, y: 0 },
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
      ctx.clearRect(0, 0, this.outputWidth, this.outputHeight);
      if (!this.img) return;
      ctx.drawImage(this.img, 0, 0, this.outputWidth, this.outputHeight);
      this.elements.forEach((el, idx) => {
        ctx.save();
        ctx.font = el.font;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.globalAlpha = 1;
        ctx.fillStyle = el.color;
        if (el.type === 'text') {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 6;
          ctx.strokeText(el.value, el.x, el.y);
          ctx.fillText(el.value, el.x, el.y);
        } else if (el.type === 'emoji') {
          ctx.font = el.font;
          ctx.fillText(el.value, el.x, el.y);
        }
        // Surbrillance si sélectionné, adaptée au scale
        if (this.draggingIdx === idx && this.dragging) {
          const highlightRadius = 54 / this.scale;
          ctx.beginPath();
          ctx.arc(el.x, el.y, highlightRadius, 0, 2 * Math.PI);
          ctx.strokeStyle = 'yellow';
          ctx.lineWidth = 4 / this.scale;
          ctx.stroke();
        }
        ctx.restore();
      });
    },
    addText() {
      if (!this.text) return;
      this.elements.push({
        type: 'text',
        value: this.text,
        x: this.outputWidth / 2,
        y: this.outputHeight / 2,
        font: 'bold 54px Arial',
        color: '#fff',
      });
      this.text = '';
      this.draw();
    },
    addEmoji() {
      if (!this.selectedEmoji) return;
      this.elements.push({
        type: 'emoji',
        value: this.selectedEmoji,
        x: this.outputWidth / 2,
        y: this.outputHeight / 2 + 100,
        font: '64px Arial',
        color: '#fff',
      });
      this.selectedEmoji = '';
      this.draw();
    },
    startDrag(e) {
      const x = e.offsetX;
      const y = e.offsetY;
      this.draggingIdx = this.elements.findIndex(el => {
        const dx = x - el.x;
        const dy = y - el.y;
        return Math.sqrt(dx*dx + dy*dy) < 50;
      });
      if (this.draggingIdx !== -1) {
        this.dragOffset = { x: x - this.elements[this.draggingIdx].x, y: y - this.elements[this.draggingIdx].y };
      }
    },
    startDragTouch(e) {
      e.preventDefault();
      const rect = this.$refs.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      // Ajuste les coordonnées pour le scale CSS
      const x = (touch.clientX - rect.left) / this.scale;
      const y = (touch.clientY - rect.top) / this.scale;
      // Sélectionne l'élément sous le doigt
      this.draggingIdx = this.elements.findIndex(el => {
        const dx = x - el.x;
        const dy = y - el.y;
        return Math.sqrt(dx*dx + dy*dy) < 50;
      });
      if (this.draggingIdx !== -1) {
        this.dragging = true;
        // Correction : le déplacement commence depuis le centre de l'élément (aucun offset)
        this.dragOffset = { x: 0, y: 0 };
        this.draw(); // Affiche la surbrillance immédiatement
      } else {
        this.dragging = false;
        this.draggingIdx = null;
        this.draw(); // Enlève la surbrillance si aucun élément
      }
    },
    onDrag(e) {
      if (this.draggingIdx === null) return;
      const x = e.offsetX;
      const y = e.offsetY;
      const el = this.elements[this.draggingIdx];
      // Sécurité : vérifier que el et el.font existent
      if (!el || !el.font) return;
      // Estimation de la taille de l'élément
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.font = el.font;
      let width = 0, height = 0;
      if (el.type === 'text' || el.type === 'emoji') {
        width = ctx.measureText(el.value).width;
        height = parseInt(el.font, 10) || 32;
      }
      // Contraindre X
      const minX = width / 2;
      const maxX = this.outputWidth - width / 2;
      // Contraindre Y
      const minY = height / 2;
      const maxY = this.outputHeight - height / 2;
      let newX = x - this.dragOffset.x;
      let newY = y - this.dragOffset.y;
      el.x = Math.max(minX, Math.min(maxX, newX));
      el.y = Math.max(minY, Math.min(maxY, newY));
      this.draw();
    },
    onDragTouch(e) {
      if (!this.dragging || this.draggingIdx === null) return;
      e.preventDefault();
      const rect = this.$refs.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      // Correction : prend en compte le scale comme dans startDragTouch
      const x = (touch.clientX - rect.left) / this.scale;
      const y = (touch.clientY - rect.top) / this.scale;
      const el = this.elements[this.draggingIdx];
      const ctx = this.$refs.canvas.getContext('2d');
      ctx.font = el.font;
      let width = 0, height = 0;
      if (el.type === 'text' || el.type === 'emoji') {
        width = ctx.measureText(el.value).width;
        height = parseInt(el.font, 10) || 32;
      }
      const minX = width / 2;
      const maxX = this.outputWidth - width / 2;
      const minY = height / 2;
      const maxY = this.outputHeight - height / 2;
      // Correction : déplacement direct à la position du doigt
      let newX = x;
      let newY = y;
      el.x = Math.max(minX, Math.min(maxX, newX));
      el.y = Math.max(minY, Math.min(maxY, newY));
      this.draw();
    },
    endDrag() {
      this.dragging = false;
      this.draggingIdx = null;
      this.draw(); // Enlève la surbrillance
    },
    emitEdited() {
      const canvas = this.$refs.canvas;
      canvas.toBlob(blob => {
        this.$emit('edited', blob);
      }, 'image/jpeg', 0.92);
    },
  },
  watch: {
    src() {
      this.img = new window.Image();
      this.img.onload = this.draw;
      this.img.src = this.src;
    },
  },
};
</script>

<style scoped>
canvas {
  touch-action: none;
  user-select: none;
}
.cropper-modal {
  position: fixed;
  top: 10%; left: 10%; right: 10%; bottom: 10%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  
}
.cropper-content {
  background: #222;
  border-radius: 12px;
  box-shadow: 0 2px 24px #000a;
  padding: 24px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.5);
  transform-origin: center center;
}
.cropper-container {
  background: #111;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
}
.editor-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 8px;
}
.text-input {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #222;
  color: #fff;
}
.emoji-select {
  padding: 4px 8px;
  border-radius: 6px;
  border: 1px solid #444;
  background: #222;
  color: #fff;
}
button {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  font-weight: bold;
  transition: background 0.2s;
}
button:hover {
  background: #2563eb;
}
.editor-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2100;
}
.editor-content {
  background: #222;
  border-radius: 16px;
  padding: 20px 24px 14px;
  min-width: 380px;
  box-shadow: 0 2px 32px rgba(0,0,0,0.38);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.canvas-container {
  margin-bottom: 14px;
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
.editor-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}
.text-input {
  width: 180px;
  border-radius: 6px;
  border: none;
  padding: 6px;
  font-size: 1rem;
  background: #242526;
  color: #fff;
}
.emoji-select {
  font-size: 1.5rem;
  background: #242526;
  color: #fff;
  border-radius: 6px;
  border: none;
  padding: 4px 8px;
}
</style>
