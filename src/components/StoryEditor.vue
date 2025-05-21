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
        <button @click="showQuiz = true">Ajouter quiz</button>
        <button @click="showPoll = true">Ajouter sondage</button>
        <button @click="showAudio = true">Ajouter audio</button>
        <button @click="showCarousel = true">Ajouter carrousel</button>
        <button @click="$emit('cancel')">Annuler</button>
        <button @click="emitEdited">Valider</button>
      </div>

      <StoryQuiz v-if="showQuiz" :question="quizQuestion" :options="quizOptions" :answerIdx="quizAnswerIdx" @answered="closeQuiz" />
      <div v-if="showQuiz" class="quiz-editor-modal">
        <input v-model="quizQuestion" placeholder="Question du quiz" />
        <input v-for="(opt, idx) in quizOptions" :key="idx" v-model="quizOptions[idx]" placeholder="Option" />
        <button @click="quizOptions.push('')">Ajouter option</button>
        <label>Bonne réponse:
          <select v-model.number="quizAnswerIdx">
            <option v-for="(opt, idx) in quizOptions" :key="idx" :value="idx">{{ opt }}</option>
          </select>
        </label>
        <button @click="addQuiz">Valider quiz</button>
        <button @click="showQuiz = false">Annuler</button>
      </div>

      <StoryStickerPoll v-if="showPoll" :question="pollQuestion" :options="pollOptions" @voted="closePoll" />
      <div v-if="showPoll" class="poll-editor-modal">
        <input v-model="pollQuestion" placeholder="Question du sondage" />
        <input v-for="(opt, idx) in pollOptions" :key="idx" v-model="pollOptions[idx]" placeholder="Option" />
        <button @click="pollOptions.push('')">Ajouter option</button>
        <button @click="addPoll">Valider sondage</button>
        <button @click="showPoll = false">Annuler</button>
      </div>

      <StoryAudio v-if="showAudio" :src="audioSrc" :caption="audioCaption" />
      <div v-if="showAudio" class="audio-editor-modal">
        <input type="file" @change="onAudioChange" accept="audio/*" />
        <input v-model="audioCaption" placeholder="Légende audio" />
        <button @click="addAudio">Valider audio</button>
        <button @click="showAudio = false">Annuler</button>
      </div>

      <StoryCarousel v-if="showCarousel" :media="carouselMedia" />
      <div v-if="showCarousel" class="carousel-editor-modal">
        <input type="file" multiple @change="onCarouselChange" accept="image/*,video/*" />
        <button @click="addCarousel">Valider carrousel</button>
        <button @click="showCarousel = false">Annuler</button>
      </div>

      <div v-if="elements.length" class="story-elements-list">
        <div v-for="(el, idx) in elements" :key="idx" class="story-element-preview">
          <span>{{ el.type }}</span>
          <button @click="removeElement(idx)">Supprimer</button>
        </div>
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
import StoryQuiz from './StoryQuiz.vue';
import StoryStickerPoll from './StoryStickerPoll.vue';
import StoryAudio from './StoryAudio.vue';
import StoryCarousel from './StoryCarousel.vue';

export default {
  name: 'StoryEditor',
  components: { StoryQuiz, StoryStickerPoll, StoryAudio, StoryCarousel },
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
      showQuiz: false,
      quizQuestion: '',
      quizOptions: ['', ''],
      quizAnswerIdx: 0,
      showPoll: false,
      pollQuestion: '',
      pollOptions: ['', ''],
      showAudio: false,
      audioSrc: '',
      audioCaption: '',
      showCarousel: false,
      carouselMedia: [],
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
    // Quiz
    addQuiz() {
      this.elements.push({ type: 'quiz', question: this.quizQuestion, options: [...this.quizOptions], answerIdx: this.quizAnswerIdx });
      this.showQuiz = false;
      this.quizQuestion = '';
      this.quizOptions = ['', ''];
      this.quizAnswerIdx = 0;
    },
    closeQuiz() {
      this.showQuiz = false;
    },
    // Poll
    addPoll() {
      this.elements.push({ type: 'poll', question: this.pollQuestion, options: [...this.pollOptions] });
      this.showPoll = false;
      this.pollQuestion = '';
      this.pollOptions = ['', ''];
    },
    closePoll() {
      this.showPoll = false;
    },
    // Audio
    onAudioChange(e) {
      const file = e.target.files[0];
      if (file) {
        this.audioSrc = URL.createObjectURL(file);
      }
    },
    addAudio() {
      this.elements.push({ type: 'audio', src: this.audioSrc, caption: this.audioCaption });
      this.showAudio = false;
      this.audioSrc = '';
      this.audioCaption = '';
    },
    // Carousel
    onCarouselChange(e) {
      const files = Array.from(e.target.files);
      this.carouselMedia = files.map(f => URL.createObjectURL(f));
    },
    addCarousel() {
      this.elements.push({ type: 'carousel', media: [...this.carouselMedia] });
      this.showCarousel = false;
      this.carouselMedia = [];
    },
    // Remove
    removeElement(idx) {
      this.elements.splice(idx, 1);
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
      // On génère un nouveau blob à partir du canvas
      this.$refs.canvas.toBlob(blob => {
        this.$emit('edited', blob, this.elements);
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
  background: var(--surface-card, #fff);
  border-radius: 12px;
  box-shadow: 0 2px 24px rgba(33,150,243,0.07);
  padding: 24px 16px 16px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: scale(0.5);
  transform-origin: center center;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
}

.cropper-container {
  background: var(--surface-50, #f8fafd);
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
  gap: 10px 14px;
  justify-content: center;
  margin-top: 10px;
  margin-bottom: 10px;
  align-items: center;
}

.text-input {
  width: 180px;
  border-radius: 8px;
  border: 1.5px solid var(--surface-border, #e0e0e0);
  padding: 7px 10px;
  font-size: 1rem;
  background: var(--surface-card, #f8fafd);
  color: var(--text-color, #222);
  font-family: inherit;
  transition: border 0.2s;
}
.text-input:focus {
  border: 1.5px solid var(--primary-color, #2196f3);
  outline: none;
}
.text-input::placeholder {
  color: var(--text-secondary-color, #aaa);
  opacity: 1;
}

.emoji-select {
  font-size: 1.5rem;
  background: var(--surface-card, #f8fafd);
  color: var(--text-color, #222);
  border-radius: 8px;
  border: 1.5px solid var(--surface-border, #e0e0e0);
  padding: 4px 10px;
  font-family: inherit;
  transition: border 0.2s;
}
.emoji-select:focus {
  border: 1.5px solid var(--primary-color, #2196f3);
  outline: none;
}
.emoji-select option {
  font-size: 1.3rem;
}

button {
  background: var(--primary-color, #2196f3);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 7px 16px;
  cursor: pointer;
  font-weight: bold;
  font-family: inherit;
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(33,150,243,0.10);
  transition: background 0.18s, box-shadow 0.18s;
  outline: none;
}
button:focus-visible {
  outline: 2px solid var(--primary-color, #2196f3);
  outline-offset: 2px;
}
button:hover:not(:disabled) {
  background: var(--primary-color-hover, #1565c0);
  box-shadow: 0 6px 18px rgba(33,150,243,0.13);
}
button:active {
  background: var(--primary-color, #1976d2);
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
.cropper-modal {
  position: fixed;
  top: 10%; left: 10%; right: 10%; bottom: 10%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  margin-top: 10px;
}


</style>
