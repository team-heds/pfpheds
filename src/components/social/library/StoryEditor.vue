<template>
  <div class="story-editor-modal">
    <div class="story-editor-content">
      <div class="editor-main-container">
        <div class="canvas-container">
          <div class="canvas-wrapper">
            <canvas 
              ref="canvas" 
              :width="outputWidth" 
              :height="outputHeight"
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
        <div class="editor-tools">
          <TabView class="editor-tabs">
            <TabPanel header="Texte">
              <div class="p-field p-mb-3">
                <span class="p-float-label">
                  <InputText id="text" v-model="text" class="p-w-100" />
                  <label for="text">Texte</label>
                </span>
              </div>
              <div class="p-field p-mb-3">
                <label for="text-color">Couleur du texte</label>
                <ColorPicker id="text-color" v-model="textColor" class="p-w-100" />
              </div>
              <div class="p-field p-mb-3">
                <label for="text-size">Taille du texte</label>
                <Dropdown
                  id="text-size"
                  v-model="textSize"
                  :options="textSizeOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner la taille du texte"
                  class="p-w-100"
                />
              </div>
              <Button label="Ajouter le texte" icon="pi pi-check" class="p-button-primary" @click="addText" :disabled="!text" />
            </TabPanel>
            <TabPanel header="Emoji">
              <div class="p-field p-mb-3">
                <label for="emoji">Sélectionner un emoji</label>
                <Dropdown
                  id="emoji"
                  v-model="selectedEmoji"
                  :options="emojis"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner un emoji"
                  class="p-w-100"
                />
              </div>
              <Button label="Ajouter l'emoji" icon="pi pi-check" class="p-button-primary" @click="addEmoji" :disabled="!selectedEmoji" />
            </TabPanel>
            <TabPanel header="Quiz">
              <div class="p-field p-mb-3">
                <span class="p-float-label">
                  <InputText id="quiz-question" v-model="quizQuestion" class="p-w-100" />
                  <label for="quiz-question">Question du quiz</label>
                </span>
              </div>
              <div v-for="(opt, idx) in quizOptions" :key="idx" class="p-field p-mb-2">
                <div class="p-inputgroup">
                  <InputText v-model="quizOptions[idx]" :placeholder="`Option ${idx + 1}`" />
                  <Button icon="pi pi-trash" class="p-button-danger" @click="quizOptions.splice(idx, 1)" v-if="quizOptions.length > 2" />
                </div>
              </div>
              <Button label="Ajouter option" icon="pi pi-plus" class="p-button-outlined p-mb-3" @click="quizOptions.push('')" />
              <div class="p-field p-mb-3">
                <label for="answer-idx">Bonne réponse</label>
                <Dropdown
                  id="answer-idx"
                  v-model="quizAnswerIdx"
                  :options="quizOptions.map((opt, idx) => ({label: opt || `Option ${idx + 1}`, value: idx}))"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Sélectionner la bonne réponse"
                  class="p-w-100"
                />
              </div>
              <Button label="Ajouter le quiz" icon="pi pi-check" class="p-button-primary" @click="addQuiz" :disabled="!quizQuestion || quizOptions.some(opt => !opt)" />
            </TabPanel>
            <TabPanel header="Sondage">
              <div class="p-field p-mb-3">
                <span class="p-float-label">
                  <InputText id="poll-question" v-model="pollQuestion" class="p-w-100" />
                  <label for="poll-question">Question du sondage</label>
                </span>
              </div>
              <div v-for="(opt, idx) in pollOptions" :key="idx" class="p-field p-mb-2">
                <div class="p-inputgroup">
                  <InputText v-model="pollOptions[idx]" :placeholder="`Option ${idx + 1}`" />
                  <Button icon="pi pi-trash" class="p-button-danger" @click="pollOptions.splice(idx, 1)" v-if="pollOptions.length > 2" />
                </div>
              </div>
              <Button label="Ajouter option" icon="pi pi-plus" class="p-button-outlined p-mb-3" @click="pollOptions.push('')" />
              <Button label="Ajouter le sondage" icon="pi pi-check" class="p-button-primary" @click="addPoll" :disabled="!pollQuestion || pollOptions.some(opt => !opt)" />
            </TabPanel>
            <TabPanel header="Audio">
              <div class="p-field p-mb-3">
                <FileUpload mode="basic" accept="audio/*" :maxFileSize="10000000" chooseLabel="Choisir un fichier audio" class="p-mb-3" @select="onAudioChange" />
              </div>
              <div class="p-field">
                <span class="p-float-label">
                  <InputText id="audio-caption" v-model="audioCaption" class="p-w-100" />
                  <label for="audio-caption">Légende audio</label>
                </span>
              </div>
              <Button label="Ajouter l'audio" icon="pi pi-check" class="p-button-primary" @click="addAudio" :disabled="!audioSrc" />
            </TabPanel>
            <TabPanel header="Carrousel">
              <div class="p-field">
                <FileUpload mode="basic" accept="image/*,video/*" multiple :maxFileSize="10000000" chooseLabel="Choisir des médias" class="p-mb-3" @select="onCarouselChange" />
              </div>
              <div v-if="carouselMedia.length" class="selected-media p-mb-3">
                <h3>Médias sélectionnés ({{ carouselMedia.length }})</h3>
                <div class="media-preview-grid">
                  <div v-for="(media, idx) in carouselMedia" :key="idx" class="media-preview-item">
                    <img v-if="media.type && media.type.includes('image')" :src="media.preview" alt="Preview" />
                    <video v-else-if="media.type && media.type.includes('video')" :src="media.preview" controls></video>
                  </div>
                </div>
              </div>
              <Button label="Ajouter le carrousel" icon="pi pi-check" class="p-button-primary" @click="addCarousel" :disabled="carouselMedia.length === 0" />
            </TabPanel>
          </TabView>
        </div>
      </div>
      <div class="editor-actions">
        <button class="publish-btn" @click="emitEdited" style="width:90vw;max-width:320px;margin:0 auto;display:block;font-size:1.1rem;">Continuer</button>
      </div>
      <div v-if="elements.length" class="elements-list p-mt-3">
        <h3>Éléments ajoutés</h3>
        <DataTable :value="elements" responsiveLayout="scroll" class="p-datatable-sm">
          <Column field="type" header="Type">
            <template #body="slotProps">
              <Badge :value="slotProps.data.type" :severity="getElementSeverity(slotProps.data.type)" />
            </template>
          </Column>
          <Column field="value" header="Contenu">
            <template #body="slotProps">
              <span v-if="slotProps.data.type === 'text' || slotProps.data.type === 'emoji'">
                {{ slotProps.data.value }}
              </span>
              <span v-else-if="slotProps.data.type === 'quiz'">
                {{ slotProps.data.question }}
              </span>
              <span v-else-if="slotProps.data.type === 'poll'">
                {{ slotProps.data.question }}
              </span>
              <span v-else>
                {{ slotProps.data.type }}
              </span>
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger p-button-text" @click="removeElement(slotProps.index)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
    <div class="storyeditor-fixed-btn-bar">
      <button class="publish-btn" @click="emitEdited">Continuer</button>
    </div>
  </div>
</template>

<script>
import StoryQuiz from './StoryQuiz.vue';
import StoryStickerPoll from './StoryStickerPoll.vue';
import StoryAudio from './StoryAudio.vue';
import StoryCarousel from './StoryCarousel.vue';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import InputText from 'primevue/inputtext';
import Dropdown from 'primevue/dropdown';
import ColorPicker from 'primevue/colorpicker';
import TabView from 'primevue/tabview';
import TabPanel from 'primevue/tabpanel';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Badge from 'primevue/badge';
import FileUpload from 'primevue/fileupload';

export default {
  name: 'StoryEditor',
  components: {
    StoryQuiz,
    StoryStickerPoll,
    StoryAudio,
    StoryCarousel,
    Button,
    Dialog,
    InputText,
    Dropdown,
    ColorPicker,
    TabView,
    TabPanel,
    DataTable,
    Column,
    Badge,
    FileUpload
  },
  props: {
    src: { type: String, required: true },
    outputWidth: { type: Number, default: 720 },
    outputHeight: { type: Number, default: 1280 },
  },
  emits: ['edited', 'cancel'],
  data() {
    return {
      img: null,
      text: '',
      textColor: '#FFFFFF',
      textSize: 'medium',
      textSizeOptions: [
        { label: 'Petit', value: 'small' },
        { label: 'Moyen', value: 'medium' },
        { label: 'Grand', value: 'large' },
        { label: 'Très grand', value: 'xlarge' }
      ],
      selectedEmoji: '',
      emojis: ['😂','😍','🔥','🥳','😎','👍','🎉','💯','🤩','😭','😇','😜','😱','😅','😏','🤗','🙏','😡','😬','🥰'],
      elements: [],
      draggingIdx: null,
      dragging: false,
      scale: 0.5, // Pour correspondre au transform: scale(0.5) CSS
      dragOffset: { x: 0, y: 0 },
      quizQuestion: '',
      quizOptions: ['', ''],
      quizAnswerIdx: 0,
      pollQuestion: '',
      pollOptions: ['', ''],
      audioSrc: '',
      audioCaption: '',
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
      const canvas = this.$refs.canvas;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.outputWidth, this.outputHeight);
      if (!this.img) return;
      ctx.drawImage(this.img, 0, 0, this.outputWidth, this.outputHeight);
      this.elements.forEach((el, idx) => {
        ctx.save();

        if (el.type === 'text') {
          // Déterminer la taille de police en fonction de textSize
          let fontSize;
          switch(el.textSize) {
            case 'small': fontSize = 36; break;
            case 'medium': fontSize = 54; break;
            case 'large': fontSize = 72; break;
            case 'xlarge': fontSize = 96; break;
            default: fontSize = 54;
          }

          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = el.color || '#fff';
          ctx.strokeStyle = '#000';
          ctx.lineWidth = 6;
          ctx.strokeText(el.value, el.x, el.y);
          ctx.fillText(el.value, el.x, el.y);
        } else if (el.type === 'emoji') {
          ctx.font = el.font;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
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

      // Déterminer la taille de police en fonction de textSize
      let fontSize;
      switch(this.textSize) {
        case 'small': fontSize = 36; break;
        case 'medium': fontSize = 54; break;
        case 'large': fontSize = 72; break;
        case 'xlarge': fontSize = 96; break;
        default: fontSize = 54;
      }

      this.elements.push({
        type: 'text',
        value: this.text,
        x: this.outputWidth / 2,
        y: this.outputHeight / 2,
        font: `bold ${fontSize}px Arial`,
        color: this.textColor,
        textSize: this.textSize
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
      if (!this.quizQuestion || this.quizOptions.some(opt => !opt)) return;

      this.elements.push({
        type: 'quiz',
        question: this.quizQuestion,
        options: [...this.quizOptions],
        answerIdx: this.quizAnswerIdx
      });
      this.quizQuestion = '';
      this.quizOptions = ['', ''];
      this.quizAnswerIdx = 0;
    },
    // Poll
    addPoll() {
      if (!this.pollQuestion || this.pollOptions.some(opt => !opt)) return;

      this.elements.push({
        type: 'poll',
        question: this.pollQuestion,
        options: [...this.pollOptions]
      });
      this.pollQuestion = '';
      this.pollOptions = ['', ''];
    },
    // Audio
    onAudioChange(event) {
      const file = event.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        this.audioSrc = e.target.result;
      };
      reader.readAsDataURL(file);
    },
    addAudio() {
      if (!this.audioSrc) return;

      this.elements.push({
        type: 'audio',
        src: this.audioSrc,
        caption: this.audioCaption
      });
      this.audioSrc = '';
      this.audioCaption = '';
    },
    // Carousel
    onCarouselChange(event) {
      this.carouselMedia = [];

      Array.from(event.files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          this.carouselMedia.push({
            type: file.type,
            preview: e.target.result,
            file: file
          });
        };
        reader.readAsDataURL(file);
      });
    },
    addCarousel() {
      if (this.carouselMedia.length === 0) return;

      this.elements.push({
        type: 'carousel',
        media: [...this.carouselMedia]
      });
      this.carouselMedia = [];
    },
    // Remove
    removeElement(idx) {
      this.elements.splice(idx, 1);
      this.draw();
    },
    // Drag
    startDrag(e) {
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.scale;
      const y = (e.clientY - rect.top) / this.scale;

      // Check if we're clicking on an element
      for (let i = this.elements.length - 1; i >= 0; i--) {
        const el = this.elements[i];
        if (el.type === 'text' || el.type === 'emoji') {
          const distance = Math.sqrt(Math.pow(x - el.x, 2) + Math.pow(y - el.y, 2));
          if (distance < 50) {
            this.draggingIdx = i;
            this.dragging = true;
            this.dragOffset = { x: el.x - x, y: el.y - y };
            break;
          }
        }
      }
    },
    startDragTouch(e) {
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / this.scale;
      const y = (touch.clientY - rect.top) / this.scale;

      // Check if we're touching an element
      for (let i = this.elements.length - 1; i >= 0; i--) {
        const el = this.elements[i];
        if (el.type === 'text' || el.type === 'emoji') {
          const distance = Math.sqrt(Math.pow(x - el.x, 2) + Math.pow(y - el.y, 2));
          if (distance < 50) {
            this.draggingIdx = i;
            this.dragging = true;
            this.dragOffset = { x: el.x - x, y: el.y - y };
            break;
          }
        }
      }
    },
    onDrag(e) {
      if (!this.dragging || this.draggingIdx === null) return;

      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / this.scale;
      const y = (e.clientY - rect.top) / this.scale;

      this.elements[this.draggingIdx].x = x + this.dragOffset.x;
      this.elements[this.draggingIdx].y = y + this.dragOffset.y;

      this.draw();
    },
    onDragTouch(e) {
      if (!this.dragging || this.draggingIdx === null || e.touches.length !== 1) return;

      const touch = e.touches[0];
      const rect = this.$refs.canvas.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / this.scale;
      const y = (touch.clientY - rect.top) / this.scale;

      this.elements[this.draggingIdx].x = x + this.dragOffset.x;
      this.elements[this.draggingIdx].y = y + this.dragOffset.y;

      this.draw();
    },
    endDrag() {
      this.dragging = false;
      this.draggingIdx = null;
    },
    emitEdited() {
      const canvas = this.$refs.canvas;
      canvas.toBlob((blob) => {
        this.$emit('edited', blob, this.elements);
      });
    },
    getElementSeverity(type) {
      switch(type) {
        case 'text': return 'info';
        case 'emoji': return 'success';
        case 'quiz': return 'warning';
        case 'poll': return 'help';
        case 'audio': return 'danger';
        case 'carousel': return 'secondary';
        default: return null;
      }
    }
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
.story-editor-modal {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  min-height: 100vh;
  background: #181e2a;
}
.story-editor-content {
  width: 100vw;
  max-width: 430px;
  background: #181e2a;
  border-radius: 0;
  box-shadow: none;
  padding: 0 0 0 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
.editor-main-container {
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}
.canvas-container {
  width: 100vw;
  max-width: 430px;
  margin: 0 auto;
  max-height: 65vh;
  overflow: visible;
}
.canvas-wrapper {
  width: 100vw;
  max-width: 430px;
  aspect-ratio: 9/16;
  margin: 0 auto;
  background: #222;
  display: flex;
  justify-content: center;
  align-items: center;
  max-height: 65vh;
}
canvas {
  width: 100%;
  height: 100%;
  display: block;
  background: #222;
}
.editor-tools {
  margin-top: 16px;
}
.editor-actions {
  flex-shrink: 0;
  background: #181e2a;
  padding: 16px 16px 16px 16px;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.08);
}
.publish-btn {
  background: #F3C300;
  color: #181e2a;
  border: none;
  border-radius: 12px;
  font-weight: bold;
  font-size: 1.05rem;
  padding: 10px 28px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  transition: background 0.2s;
}
.publish-btn:disabled {
  background: #bdbdbd;
  color: #fff;
}
.storyeditor-fixed-btn-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2000;
  background: #181e2a;
  padding: 12px 0 20px 0;
  display: flex;
  justify-content: center;
}
.storyeditor-fixed-btn-bar .publish-btn {
  width: 90vw;
  max-width: 320px;
  font-size: 1.1rem;
  border-radius: 12px;
}
</style>
