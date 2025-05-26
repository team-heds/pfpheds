<template>
  <div class="story-editor-modal p-d-flex p-jc-center p-ai-center">
    <div class="story-editor-content p-shadow-5">
      <div class="p-d-flex p-jc-between p-ai-center p-w-100 p-mb-3">
        <h2 class="editor-title">Éditer votre story</h2>
        <Button icon="pi pi-times" class="p-button-rounded p-button-text" @click="$emit('cancel')" />
      </div>
      
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
                  <InputText 
                    id="text-input" 
                    v-model="text" 
                    maxlength="60" 
                    class="p-w-100" 
                  />
                  <label for="text-input">Texte</label>
                </span>
              </div>
              
              <div class="p-field p-mb-3">
                <ColorPicker v-model="textColor" class="p-mb-2" />
                <small>Couleur du texte</small>
              </div>
              
              <div class="p-field p-mb-3">
                <Dropdown 
                  v-model="textSize" 
                  :options="textSizeOptions" 
                  optionLabel="label" 
                  optionValue="value" 
                  placeholder="Taille du texte"
                  class="p-w-100"
                />
              </div>
              
              <Button 
                label="Ajouter texte" 
                icon="pi pi-plus" 
                class="p-button-primary p-w-100" 
                @click="addText" 
                :disabled="!text"
              />
            </TabPanel>
            
            <TabPanel header="Emoji">
              <div class="emoji-grid p-mb-3">
                <Button 
                  v-for="emoji in emojis" 
                  :key="emoji" 
                  class="p-button-text emoji-button" 
                  @click="selectedEmoji = emoji; addEmoji()"
                >
                  {{ emoji }}
                </Button>
              </div>
            </TabPanel>
            
            <TabPanel header="Interactif">
              <div class="p-d-flex p-flex-column p-gap-3">
                <Button 
                  label="Ajouter quiz" 
                  icon="pi pi-question-circle" 
                  class="p-button-outlined p-mb-2" 
                  @click="showQuiz = true"
                />
                
                <Button 
                  label="Ajouter sondage" 
                  icon="pi pi-chart-bar" 
                  class="p-button-outlined p-mb-2" 
                  @click="showPoll = true"
                />
                
                <Button 
                  label="Ajouter audio" 
                  icon="pi pi-volume-up" 
                  class="p-button-outlined p-mb-2" 
                  @click="showAudio = true"
                />
                
                <Button 
                  label="Ajouter carrousel" 
                  icon="pi pi-images" 
                  class="p-button-outlined" 
                  @click="showCarousel = true"
                />
              </div>
            </TabPanel>
          </TabView>
        </div>
      </div>
      
      <!-- Liste des éléments ajoutés -->
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
              <Button 
                icon="pi pi-trash" 
                class="p-button-rounded p-button-danger p-button-text" 
                @click="removeElement(slotProps.index)" 
              />
            </template>
          </Column>
        </DataTable>
      </div>
      
      <!-- Boutons d'action -->
      <div class="action-buttons p-mt-3">
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
          @click="emitEdited" 
        />
      </div>
    </div>
  </div>
  
  <!-- Modals pour les éléments interactifs -->
  <Dialog 
    v-model:visible="showQuiz" 
    header="Ajouter un quiz" 
    :style="{width: '90%', maxWidth: '450px'}" 
    :modal="true"
    :closable="false"
    :dismissableMask="true"
  >
    <div class="p-fluid">
      <div class="p-field p-mb-3">
        <span class="p-float-label">
          <InputText id="quiz-question" v-model="quizQuestion" class="p-w-100" />
          <label for="quiz-question">Question du quiz</label>
        </span>
      </div>
      
      <div v-for="(opt, idx) in quizOptions" :key="idx" class="p-field p-mb-2">
        <div class="p-inputgroup">
          <InputText v-model="quizOptions[idx]" :placeholder="`Option ${idx + 1}`" />
          <Button 
            icon="pi pi-trash" 
            class="p-button-danger" 
            @click="quizOptions.splice(idx, 1)" 
            v-if="quizOptions.length > 2"
          />
        </div>
      </div>
      
      <Button 
        label="Ajouter option" 
        icon="pi pi-plus" 
        class="p-button-outlined p-mb-3" 
        @click="quizOptions.push('')" 
      />
      
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
    </div>
    
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showQuiz = false" />
      <Button 
        label="Ajouter" 
        icon="pi pi-check" 
        class="p-button-primary" 
        @click="addQuiz" 
        :disabled="!quizQuestion || quizOptions.some(opt => !opt)"
      />
    </template>
  </Dialog>
  
  <Dialog 
    v-model:visible="showPoll" 
    header="Ajouter un sondage" 
    :style="{width: '90%', maxWidth: '450px'}" 
    :modal="true"
    :closable="false"
    :dismissableMask="true"
  >
    <div class="p-fluid">
      <div class="p-field p-mb-3">
        <span class="p-float-label">
          <InputText id="poll-question" v-model="pollQuestion" class="p-w-100" />
          <label for="poll-question">Question du sondage</label>
        </span>
      </div>
      
      <div v-for="(opt, idx) in pollOptions" :key="idx" class="p-field p-mb-2">
        <div class="p-inputgroup">
          <InputText v-model="pollOptions[idx]" :placeholder="`Option ${idx + 1}`" />
          <Button 
            icon="pi pi-trash" 
            class="p-button-danger" 
            @click="pollOptions.splice(idx, 1)" 
            v-if="pollOptions.length > 2"
          />
        </div>
      </div>
      
      <Button 
        label="Ajouter option" 
        icon="pi pi-plus" 
        class="p-button-outlined p-mb-3" 
        @click="pollOptions.push('')" 
      />
    </div>
    
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showPoll = false" />
      <Button 
        label="Ajouter" 
        icon="pi pi-check" 
        class="p-button-primary" 
        @click="addPoll" 
        :disabled="!pollQuestion || pollOptions.some(opt => !opt)"
      />
    </template>
  </Dialog>
  
  <Dialog 
    v-model:visible="showAudio" 
    header="Ajouter un audio" 
    :style="{width: '90%', maxWidth: '450px'}" 
    :modal="true"
    :closable="false"
    :dismissableMask="true"
  >
    <div class="p-fluid">
      <div class="p-field p-mb-3">
        <FileUpload 
          mode="basic" 
          accept="audio/*" 
          :maxFileSize="10000000" 
          chooseLabel="Choisir un fichier audio"
          class="p-mb-3"
          @select="onAudioChange"
        />
      </div>
      
      <div class="p-field">
        <span class="p-float-label">
          <InputText id="audio-caption" v-model="audioCaption" class="p-w-100" />
          <label for="audio-caption">Légende audio</label>
        </span>
      </div>
    </div>
    
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showAudio = false" />
      <Button 
        label="Ajouter" 
        icon="pi pi-check" 
        class="p-button-primary" 
        @click="addAudio" 
        :disabled="!audioSrc"
      />
    </template>
  </Dialog>
  
  <Dialog 
    v-model:visible="showCarousel" 
    header="Ajouter un carrousel" 
    :style="{width: '90%', maxWidth: '450px'}" 
    :modal="true"
    :closable="false"
    :dismissableMask="true"
  >
    <div class="p-fluid">
      <div class="p-field">
        <FileUpload 
          mode="basic" 
          accept="image/*,video/*" 
          multiple 
          :maxFileSize="10000000" 
          chooseLabel="Choisir des médias"
          class="p-mb-3"
          @select="onCarouselChange"
        />
      </div>
      
      <div v-if="carouselMedia.length" class="selected-media p-mb-3">
        <h3>Médias sélectionnés ({{ carouselMedia.length }})</h3>
        <div class="media-preview-grid">
          <div v-for="(media, idx) in carouselMedia" :key="idx" class="media-preview-item">
            <img v-if="media.type.includes('image')" :src="media.preview" alt="Preview" />
            <video v-else-if="media.type.includes('video')" :src="media.preview" controls></video>
          </div>
        </div>
      </div>
    </div>
    
    <template #footer>
      <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showCarousel = false" />
      <Button 
        label="Ajouter" 
        icon="pi pi-check" 
        class="p-button-primary" 
        @click="addCarousel" 
        :disabled="carouselMedia.length === 0"
      />
    </template>
  </Dialog>
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
      if (!this.pollQuestion || this.pollOptions.some(opt => !opt)) return;
      
      this.elements.push({ 
        type: 'poll', 
        question: this.pollQuestion, 
        options: [...this.pollOptions] 
      });
      this.showPoll = false;
      this.pollQuestion = '';
      this.pollOptions = ['', ''];
    },
    closePoll() {
      this.showPoll = false;
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
      this.showAudio = false;
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
      this.showCarousel = false;
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
:deep(.p-tabview-nav) {
  justify-content: center;
}

:deep(.p-tabview-nav-link) {
  padding: 1rem 1.25rem;
}

:deep(.p-button.emoji-button) {
  width: 3rem;
  height: 3rem;
  font-size: 1.5rem;
  margin: 0.25rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emoji-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  max-height: 300px;
  overflow-y: auto;
}

.story-editor-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
}

.story-editor-content {
  background-color: var(--surface-card, #ffffff);
  border-radius: 12px;
  width: 90%;
  max-width: 1200px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.editor-title {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

.editor-main-container {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-top: 1rem;
  width: 100%;
}

.canvas-container {
  flex: 1 1 65%;
  min-width: 300px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.canvas-wrapper {
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  background-color: var(--surface-ground, #f8f9fa);
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 1rem;
  width: 100%;
  max-height: 70vh;
}

canvas {
  touch-action: none;
  user-select: none;
  max-width: 100%;
  max-height: 70vh;
  height: auto;
  cursor: move;
  background-color: #000;
  border: 2px solid var(--primary-color, #3B82F6);
  object-fit: contain;
}

.editor-tools {
  flex: 1 1 30%;
  min-width: 250px;
  max-width: 100%;
}

.elements-list {
  margin-top: 1.5rem;
  width: 100%;
}

.elements-list h3 {
  font-size: 1.2rem;
  margin-bottom: 0.75rem;
  color: var(--text-color, #333);
  font-weight: 600;
}

:deep(.p-datatable .p-datatable-thead > tr > th) {
  background-color: var(--surface-section, #f8f9fa);
  color: var(--text-color, #333);
  font-weight: 600;
  padding: 0.75rem 1rem;
}

:deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 1rem;
}

.media-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.media-preview-item {
  width: 100%;
  height: 100px;
  overflow: hidden;
  border-radius: 4px;
  border: 1px solid var(--surface-border, #dee2e6);
}

.media-preview-item img,
.media-preview-item video {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

:deep(.p-fileupload-buttonbar) {
  padding: 0;
  background-color: transparent;
  border: none;
}

:deep(.p-fileupload-content) {
  padding: 0.5rem 0;
}

.action-buttons {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 1rem;
}

@media screen and (max-width: 991px) {
  .story-editor-content {
    width: 95%;
    padding: 1.25rem;
  }
  
  .editor-main-container {
    flex-direction: column;
  }
  
  .canvas-container {
    order: 1;
    width: 100%;
  }
  
  .editor-tools {
    order: 2;
    width: 100%;
    margin-top: 1rem;
  }
}

@media screen and (max-width: 768px) {
  .story-editor-content {
    padding: 1rem;
    width: 95%;
    max-height: 95vh;
  }
  
  canvas {
    max-height: 50vh;
  }
  
  .canvas-wrapper {
    max-height: 50vh;
  }
  
  :deep(.p-tabview-nav-link) {
    padding: 0.75rem 1rem;
  }
  
  .editor-title {
    font-size: 1.25rem;
  }
  
  .action-buttons {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
  
  .action-buttons .p-button {
    width: 100%;
  }
}

@media screen and (max-width: 480px) {
  .story-editor-content {
    padding: 0.75rem;
    width: 100%;
    border-radius: 0;
    max-height: 100vh;
    height: 100vh;
  }
  
  .story-editor-modal {
    padding: 0;
  }
  
  .canvas-wrapper {
    border-radius: 4px;
  }
  
  :deep(.p-tabview-nav-link) {
    padding: 0.5rem 0.75rem;
  }
  
  .editor-title {
    font-size: 1.1rem;
  }
}
</style>
