<template>
  <div class="add-story-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <h3>Ajouter une story</h3>
      <input v-if="step === 'select'" type="file" accept="image/*" capture @change="onFileChange" />
      <button v-if="step === 'select'" class="webcam-btn" @click="step = 'webcam'">Prendre une photo avec la webcam</button>
      <div v-if="step === 'select'" class="step-msg">Prenez une photo ou choisissez une image à publier en story.</div>

      <WebcamCapture v-if="step === 'webcam'" @captured="onWebcamCaptured" @cancel="step = 'select'" />


      <ImageCropper
        v-if="step === 'crop' && previewUrl"
        :src="previewUrl"
        :aspect="9/16"
        :outputWidth="720"
        :outputHeight="1280"
        @cropped="onCropped"
        @cancel="step = 'select'"
      />
      <div v-if="step === 'crop'" class="step-msg">Recadrez votre image pour la story.</div>

      <StoryEditor
        v-if="step === 'edit' && previewUrl"
        :src="previewUrl"
        :outputWidth="720"
        :outputHeight="1280"
        @edited="onEdited"
        @cancel="step = 'crop'"
      />
      <div v-if="step === 'edit'" class="step-msg">Ajoutez du texte ou des emojis sur votre image.</div>

      <div v-if="step === 'preview' && previewUrl" class="story-preview">
        <img :src="previewUrl" alt="Prévisualisation" />
      </div>
      <div v-if="step === 'preview'" class="step-msg">Prévisualisez votre story, ajoutez une légende puis publiez.</div>

      <div v-if="step === 'preview'" class="duration-select">
        <label for="duration">Durée de visibilité :</label>
        <select id="duration" v-model="selectedDuration">
          <option :value="1 * 60 * 1000">1 minute</option>
          <option :value="60 * 60 * 1000">1 heure</option>
          <option :value="24 * 60 * 60 * 1000">24 heures</option>
        </select>
      </div>

      <textarea v-if="step === 'preview'" v-model="caption" maxlength="100" placeholder="Ajouter un texte (optionnel)" class="caption-input"></textarea>

      <div v-if="step === 'upload' || uploading" class="progress-bar-container">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
        <span>{{ uploadProgress }}%</span>
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button
        class="add-btn"
        :disabled="step !== 'preview' || uploading || !fileSelected"
        @click="submitStory"
      >Publier la story</button>
    </div>
  </div>
</template>

<script>
import WebcamCapture from './WebcamCapture.vue';
import ImageCropper from './ImageCropper.vue';
import StoryEditor from './StoryEditor.vue';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../../../firebase.js';

export default {
  name: 'AddStory',
  components: { ImageCropper, StoryEditor, WebcamCapture },
  data() {
    return {
      step: 'select', // étapes: select, crop, edit, preview, upload
      uploading: false,
      error: null,
      previewUrl: '',
      fileSelected: null,
      caption: '',
      uploadProgress: 0,
      croppedBlob: null,
      editedBlob: null,
      selectedDuration: 60 * 60 * 1000, // Par défaut 1 heure
      storyElements: [], // <-- Ajouté pour stocker les modules interactifs
    };
  },
  methods: {
    onWebcamCaptured(blob) {
      this.fileSelected = true;
      this.croppedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
      this.step = 'edit';
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        this.error = 'Image trop lourde (max 10 Mo)';
        return;
      }
      this.error = null;
      this.fileSelected = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        this.previewUrl = ev.target.result;
        this.step = 'crop';
      };
      reader.readAsDataURL(file);
    },
    onCropped(blob) {
      this.croppedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
      this.step = 'edit';
    },
    onEdited(blob, elements) {
      this.editedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
      this.storyElements = elements || [];
      this.step = 'preview';
    },
    async submitStory() {
      if (!this.editedBlob && !this.croppedBlob) {
        this.error = 'Merci de recadrer et éditer l’image.';
        return;
      }
      const fileToUpload = this.editedBlob || this.croppedBlob;
      this.uploading = true;
      this.uploadProgress = 0;
      this.error = null;
      this.step = 'upload';
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Vous devez être connecté pour créer une story.');
        const file = fileToUpload;
        const fileName = `story_${user.uid}_${Date.now()}.jpg`;
        const storageReference = storageRef(getStorage(), `stories/${user.uid}/${fileName}`);
        await uploadBytes(storageReference, file).then(() => {
          this.uploadProgress = 100;
        });
        const imageUrl = await getDownloadURL(storageReference);
        const now = Date.now();
        const storyRef = push(dbRef(db, 'stories'));
        await set(storyRef, {
          userId: user.uid,
          userName: user.displayName || user.email || 'Utilisateur',
          userAvatar: user.photoURL || '',
          imageUrl,
          caption: this.caption,
          timestamp: now,
          expiresAt: now + (this.selectedDuration || 60 * 60 * 1000), // durée choisie
          viewers: [],
          elements: this.storyElements || [], // <-- Ajout modules interactifs
        });
        this.$emit('uploaded');
        this.$emit('close');
      } catch (err) {
        this.error = err.message;
      } finally {
        this.uploading = false;
        this.uploadProgress = 0;
        this.previewUrl = '';
        this.fileSelected = null;
        this.croppedBlob = null;
        this.editedBlob = null;
        this.caption = '';
        this.storyElements = [];
        this.step = 'select';
      }
    },
  },
};

</script>

<style scoped>
.add-story-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
}

.modal-content {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 18px 16px 18px 16px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  position: relative;
  color: var(--text-color, #222);
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
}

@media (max-width: 600px) {
  .modal-content {
    min-width: unset;
    padding: 10px 3vw 14px 3vw;
    border-radius: 6px;
    max-width: 98vw;
    max-height: 97vh;
  }
}

.modal-content h3 {
  color: var(--primary-color, #2196f3);
  font-weight: 700;
  margin-bottom: 20px;
  font-size: 1.3rem;
  letter-spacing: 0.01em;
}

.story-preview img {
  max-width: 220px;
  max-height: 340px;
  border-radius: 12px;
  margin-bottom: 14px;
  box-shadow: 0 2px 12px rgba(33,150,243,0.11);
}

@media (max-width: 600px) {
  .story-preview img {
    max-width: 95vw;
    max-height: 50vh;
    border-radius: 6px;
  }
}

.caption-input {
  width: 95%;
  min-height: 38px;
  margin: 8px 0 18px 0;
  border-radius: 8px;
  border: 1.5px solid var(--surface-border, #e0e0e0);
  padding: 8px;
  font-size: 1rem;
  background: var(--surface-card, #f8fafd);
  color: var(--text-color, #222);
  font-family: inherit;
  transition: border 0.2s;
}
.caption-input:focus {
  border: 1.5px solid var(--primary-color, #2196f3);
  outline: none;
}

.add-btn {
  margin-top: 14px;
  background: var(--primary-color, #2196f3);
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(33,150,243,0.10);
  transition: background 0.18s, box-shadow 0.18s;
}
.add-btn:hover:not(:disabled) {
  background: var(--primary-color-hover, #1565c0);
  box-shadow: 0 6px 18px rgba(33,150,243,0.13);
}
.add-btn:focus-visible {
  outline: 2px solid var(--primary-color, #2196f3);
  outline-offset: 2px;
}

.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.progress-bar-container {
  width: 100%;
  background: var(--surface-border, #e0e0e0);
  border-radius: 8px;
  height: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
}

.progress-bar {
  height: 100%;
  background: var(--primary-color, #2196f3);
  transition: width 0.3s;
}

.error {
  color: #d32f2f;
  margin-top: 10px;
  font-size: 0.98rem;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  font-size: 2rem;
  background: none;
  border: none;
  color: var(--primary-color, #2196f3);
  cursor: pointer;
  transition: color 0.18s;
  z-index: 2;
}
.close-btn:hover {
  color: var(--primary-color-hover, #1565c0);
}
.close-btn:focus-visible {
  outline: 2px solid var(--primary-color, #2196f3);
  outline-offset: 2px;
}


.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 1.5rem;
  border: none;
  background: none;
  cursor: pointer;
}
.error {
  color: #d32f2f;
  margin-top: 10px;
}
</style>
