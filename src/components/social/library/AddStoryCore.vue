<template>
  <div class="add-story-core">
    <p v-if="status === 'checking'" class="story-state" role="status">Vérification…</p>

    <div v-else-if="status === 'unavailable'" class="story-unavailable" role="status">
      <i class="pi pi-info-circle" aria-hidden="true"></i>
      <div>
        <p class="story-unavailable-title">Stories momentanément indisponibles</p>
        <p>{{ unavailableMessage }}</p>
        <button type="button" class="story-btn story-btn--secondary" @click="$emit('use-post')">
          Créer une publication
        </button>
      </div>
    </div>

    <template v-else>
      <p class="step-header" aria-live="polite">
        <span class="step-count">Étape {{ stepNumber }} sur {{ totalSteps }}</span>
        <span class="step-title">{{ stepTitle }}</span>
      </p>

      <!-- 1. Choisir un média -->
      <div v-if="step === 1" class="step-container">
        <input
          :id="fileInputId"
          ref="fileInput"
          class="story-file-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4"
          @change="onFileChange"
        />
        <label
          :for="fileInputId"
          class="drop-zone"
          :class="{ 'is-dragging': dragActive, 'has-preview': previewUrl }"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop.prevent="onDrop"
        >
          <template v-if="previewUrl">
            <img v-if="isImage" :src="previewUrl" alt="Aperçu de la story" class="story-preview" />
            <video v-else :src="previewUrl" class="story-preview" muted playsinline controls aria-label="Aperçu de la story"></video>
            <span class="drop-zone-change">Changer de média</span>
          </template>
          <template v-else>
            <i class="pi pi-image" aria-hidden="true"></i>
            <span class="drop-zone-title">Ajouter une photo ou une vidéo</span>
            <span class="drop-zone-hint">Format vertical conseillé · 30 Mo au maximum</span>
          </template>
        </label>
        <button type="button" class="story-btn" :disabled="!previewUrl" @click="goToStep2">Suivant</button>
      </div>

      <!-- 2. Recadrer (photo) -->
      <ImageCropper
        v-if="step === 2 && isImage"
        :src="previewUrl"
        :outputWidth="1080"
        :outputHeight="1920"
        :aspectRatio="9 / 16"
        @cropped="onCropDone"
        @cancel="goToStep1"
      />

      <!-- 3. Personnaliser (photo) -->
      <div v-else-if="step === 3 && isImage" class="step-container step-container--editor">
        <StoryEditor
          :src="previewUrl"
          :outputWidth="1080"
          :outputHeight="1920"
          @edited="onStoryEdited"
          @cancel="goToStep2"
        />
        <button type="button" class="story-btn" @click="goToStep4">Suivant</button>
      </div>

      <!-- 4. Légende, durée et publication -->
      <form v-else-if="step === 4" class="step-container" @submit.prevent="publishStory">
        <img v-if="isImage" :src="previewUrl" alt="Aperçu de la story" class="story-preview" />
        <video v-else :src="previewUrl" class="story-preview" muted playsinline controls aria-label="Aperçu de la story"></video>

        <label class="story-field">
          <span>Légende <span class="optional">(facultatif)</span></span>
          <textarea v-model="caption" maxlength="100" rows="2" placeholder="Ajouter un texte" :disabled="uploading"></textarea>
          <span class="story-counter">{{ caption.length }}/100</span>
        </label>

        <label class="story-field">
          <span>Visible pendant</span>
          <select v-model="selectedDuration" :disabled="uploading">
            <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
        </label>

        <div class="step-actions">
          <button type="button" class="story-btn story-btn--secondary" :disabled="uploading" @click="goBackFromStep4">Retour</button>
          <button type="submit" class="story-btn" :disabled="uploading" :aria-busy="uploading ? 'true' : 'false'">
            <i v-if="uploading" class="pi pi-spin pi-spinner" aria-hidden="true"></i>
            {{ uploading ? 'Publication…' : 'Publier la story' }}
          </button>
        </div>
      </form>

      <p v-if="error" class="story-error" role="alert">
        <i class="pi pi-exclamation-circle" aria-hidden="true"></i> {{ error }}
      </p>
    </template>
  </div>
</template>

<script>
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../../../firebase.js';
import StoryEditor from './StoryEditor.vue';
import ImageCropper from './ImageCropper.vue';
import { getStoryPublishingStatus } from '@/service/storyAvailability';

const STEP_TITLES = {
  1: 'Choisir un média',
  2: 'Recadrer',
  3: 'Personnaliser',
  4: 'Prévisualiser et publier'
};

export default {
  name: 'AddStoryCore',
  components: { StoryEditor, ImageCropper },
  emits: ['uploaded', 'use-post'],
  data() {
    return {
      status: 'checking',
      unavailableMessage: '',
      fileInputId: `story-file-${Math.random().toString(36).slice(2, 10)}`,
      step: 1,
      previewUrl: '',
      file: null,
      caption: '',
      error: '',
      isImage: true,
      uploading: false,
      selectedDuration: 24 * 60 * 60 * 1000,
      durationOptions: [
        { label: '1 heure', value: 60 * 60 * 1000 },
        { label: '24 heures', value: 24 * 60 * 60 * 1000 }
      ],
      editedBlob: null,
      storyElements: [],
      dragActive: false
    };
  },
  computed: {
    // Une vidéo saute le recadrage et la personnalisation : 2 étapes au lieu de 4.
    totalSteps() {
      return this.isImage ? 4 : 2;
    },
    stepNumber() {
      return this.isImage ? this.step : this.step === 1 ? 1 : 2;
    },
    stepTitle() {
      return STEP_TITLES[this.step];
    }
  },
  async mounted() {
    const result = await getStoryPublishingStatus();
    this.status = result.available ? 'ready' : 'unavailable';
    this.unavailableMessage = result.message;
  },
  beforeUnmount() {
    this.revokePreview();
  },
  methods: {
    revokePreview() {
      if (this.previewUrl && this.previewUrl.startsWith('blob:')) URL.revokeObjectURL(this.previewUrl);
    },
    setPreview(url) {
      this.revokePreview();
      this.previewUrl = url;
    },
    onDrop(e) {
      this.dragActive = false;
      const files = e.dataTransfer.files;
      if (files && files[0]) this.handleFile(files[0]);
    },
    onFileChange(e) {
      const file = e.target.files[0];
      e.target.value = '';
      if (file) this.handleFile(file);
    },
    handleFile(file) {
      if (!/^(image\/(jpeg|png|webp)|video\/mp4)$/.test(file.type)) {
        this.error = 'Format non pris en charge : choisissez une photo (JPEG, PNG, WebP) ou une vidéo MP4.';
        return;
      }
      if (file.size > 30 * 1024 * 1024) {
        this.error = 'Le fichier dépasse 30 Mo.';
        return;
      }
      this.error = '';
      this.file = file;
      this.isImage = file.type.startsWith('image/');
      this.editedBlob = null;
      this.setPreview(URL.createObjectURL(file));
    },
    goToStep1() {
      this.step = 1;
      this.editedBlob = null;
      this.storyElements = [];
      if (this.file) this.setPreview(URL.createObjectURL(this.file));
    },
    goToStep2() {
      if (!this.previewUrl) return;
      this.step = this.isImage ? 2 : 4;
    },
    goBackFromStep4() {
      if (this.isImage) this.step = 3;
      else this.step = 1;
    },
    onCropDone(blob) {
      this.editedBlob = blob;
      this.setPreview(URL.createObjectURL(blob));
      this.step = 3;
    },
    onStoryEdited(blob, elements) {
      this.editedBlob = blob;
      this.storyElements = elements || [];
      this.setPreview(URL.createObjectURL(blob));
      this.step = 4;
    },
    goToStep4() {
      this.step = 4;
    },
    async publishStory() {
      if (!this.file && !this.editedBlob) {
        this.error = 'Choisissez une photo ou une vidéo.';
        return;
      }
      this.uploading = true;
      this.error = '';
      try {
        const user = getAuth().currentUser;
        if (!user) throw new Error('Session expirée : reconnectez-vous pour publier une story.');
        const ext = this.editedBlob ? 'jpg' : (this.file.name.split('.').pop() || (this.isImage ? 'jpg' : 'mp4'));
        const fileName = `story_${user.uid}_${Date.now()}.${ext}`;
        const storageReference = storageRef(getStorage(), `stories/${user.uid}/${fileName}`);
        await uploadBytes(storageReference, this.editedBlob || this.file);
        const imageUrl = await getDownloadURL(storageReference);
        const storyRef = push(dbRef(db, 'stories'));
        await set(storyRef, {
          id: storyRef.key,
          userId: user.uid,
          userName: user.displayName || 'Utilisateur',
          userAvatar: user.photoURL || null,
          imageUrl,
          caption: this.caption.trim(),
          timestamp: Date.now(),
          expiresAt: Date.now() + this.selectedDuration,
          viewers: {},
          reactions: {},
          elements: this.storyElements
        });
        this.$emit('uploaded');
        this.reset();
        this.$toast?.add({ severity: 'success', summary: 'Story publiée', life: 2500 });
      } catch (e) {
        console.error('[Stories] Publication refusée:', e);
        this.error = e?.message?.startsWith('Session')
          ? e.message
          : 'La story n’a pas pu être publiée. Vérifiez votre connexion puis réessayez.';
      } finally {
        this.uploading = false;
      }
    },
    reset() {
      this.revokePreview();
      Object.assign(this, {
        step: 1,
        previewUrl: '',
        file: null,
        caption: '',
        error: '',
        isImage: true,
        uploading: false,
        editedBlob: null,
        storyElements: [],
        dragActive: false
      });
    }
  }
};
</script>

<style scoped>
.add-story-core {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  color: var(--text-color);
}

.story-state {
  margin: 0;
  color: var(--text-color-secondary);
}

.story-unavailable {
  display: flex;
  gap: 0.75rem;
  max-width: 26rem;
  padding: 1rem;
  border-radius: 1rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
}

.story-unavailable > .pi {
  color: var(--primary-color);
  font-size: 1.25rem;
  margin-top: 0.15rem;
}

.story-unavailable p {
  margin: 0 0 0.75rem;
  line-height: 1.45;
  color: var(--text-color-secondary);
}

.story-unavailable .story-unavailable-title {
  margin-bottom: 0.35rem;
  font-weight: 700;
  color: var(--text-color);
}

.step-header {
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}

.step-count {
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--text-color-secondary);
}

.step-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.step-container {
  width: 100%;
  max-width: 22rem;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 0.9rem;
}

.step-container--editor {
  max-width: 100%;
}

.story-file-input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.drop-zone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 14rem;
  padding: 1.25rem;
  border-radius: 1rem;
  border: 2px dashed var(--surface-border);
  background: var(--surface-ground);
  color: var(--text-color);
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop-zone .pi {
  font-size: 2rem;
  color: var(--primary-color);
}

.drop-zone.is-dragging,
.drop-zone:hover {
  border-color: var(--primary-color);
}

.drop-zone.has-preview {
  border-style: solid;
  padding: 0.75rem;
}

.story-file-input:focus-visible + .drop-zone {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.drop-zone-title {
  font-weight: 700;
}

.drop-zone-hint,
.drop-zone-change {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.story-preview {
  display: block;
  width: min(100%, 15rem);
  aspect-ratio: 9 / 16;
  object-fit: cover;
  margin: 0 auto;
  border-radius: 0.9rem;
  background: #000;
}

.story-field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.story-field .optional {
  font-weight: 400;
  color: var(--text-color-secondary);
}

.story-field textarea,
.story-field select {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.75rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-card);
  color: var(--text-color);
  font: inherit;
  font-size: 1rem;
  font-weight: 400;
}

.story-field textarea:focus-visible,
.story-field select:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 1px;
}

.story-counter {
  align-self: flex-end;
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-color-secondary);
}

.step-actions {
  display: flex;
  gap: 0.75rem;
}

.step-actions .story-btn {
  flex: 1;
}

.story-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0 1.25rem;
  border-radius: 999px;
  border: 1px solid var(--primary-color);
  background: var(--primary-color);
  color: var(--primary-color-text);
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}

.story-btn--secondary {
  background: transparent;
  color: var(--text-color);
  border-color: var(--surface-border);
}

.story-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.story-btn:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 2px;
}

.story-error {
  margin: 0;
  max-width: 22rem;
  text-align: center;
  color: var(--red-500, #e24c4c);
  font-size: 0.95rem;
}
</style>
