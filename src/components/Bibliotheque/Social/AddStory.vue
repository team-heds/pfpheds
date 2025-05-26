<template>
  <Dialog 
    modal 
    v-model:visible="dialogVisible" 
    :style="{width: '550px'}" 
    :breakpoints="{'960px': '75vw', '640px': '90vw'}" 
    class="add-story-dialog"
    :closable="false"
    :closeOnEscape="false"
  >
    <template #header>
      <div class="dialog-header">
        <h2>Ajouter une story</h2>
        <Button icon="pi pi-times" @click="$emit('close')" class="p-button-rounded p-button-text" />
      </div>
    </template>
    
    <div v-if="step === 'select'" class="p-fluid selection-step">
      <div class="file-upload-container p-mb-3">
        <FileUpload 
          mode="basic" 
          accept="image/*" 
          :maxFileSize="10000000"
          chooseLabel="Choisir une image" 
          class="p-mb-3 p-d-block"
          @select="onFileChange"
        />
      </div>
      
      <Button 
        icon="pi pi-camera" 
        label="Prendre une photo avec la webcam" 
        class="p-button-outlined p-mb-3"
        @click="step = 'webcam'"
      />
      
      <Message severity="info" class="step-msg">
        Prenez une photo ou choisissez une image à publier en story.
      </Message>
    </div>

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
    <Message v-if="step === 'crop'" severity="info" class="step-msg">
      Recadrez votre image pour la story.
    </Message>

    <StoryEditor
      v-if="step === 'edit' && previewUrl"
      :src="previewUrl"
      :outputWidth="720"
      :outputHeight="1280"
      @edited="onEdited"
      @cancel="step = 'crop'"
    />
    <Message v-if="step === 'edit'" severity="info" class="step-msg">
      Ajoutez du texte ou des emojis sur votre image.
    </Message>

    <div v-if="step === 'preview'" class="preview-step p-fluid">
      <div v-if="previewUrl" class="story-preview p-mb-3">
        <img :src="previewUrl" alt="Prévisualisation" />
      </div>
      
      <Message severity="info" class="step-msg p-mb-3">
        Prévisualisez votre story, ajoutez une légende puis publiez.
      </Message>

      <div class="p-field p-mb-3">
        <label for="duration">Durée de visibilité</label>
        <Dropdown 
          id="duration" 
          v-model="selectedDuration" 
          :options="durationOptions" 
          optionLabel="label" 
          optionValue="value"
          placeholder="Sélectionnez une durée"
        />
      </div>

      <div class="p-field p-mb-3">
        <label for="caption">Légende (optionnelle)</label>
        <Textarea 
          id="caption" 
          v-model="caption" 
          rows="3" 
          maxlength="100" 
          placeholder="Ajouter un texte (optionnel)" 
          autoResize 
        />
      </div>
    </div>

    <div v-if="step === 'upload' || uploading" class="upload-progress p-mb-3">
      <ProgressBar :value="uploadProgress" :showValue="true" />
    </div>
    
    <Message v-if="error" severity="error" class="p-mb-3">{{ error }}</Message>

    <template #footer>
      <div class="dialog-footer">
        <Button 
          label="Annuler" 
          icon="pi pi-times" 
          class="p-button-text" 
          @click="$emit('close')" 
        />
        <Button 
          v-if="step === 'preview'"
          label="Publier la story" 
          icon="pi pi-check" 
          class="p-button-primary" 
          :loading="uploading" 
          :disabled="!fileSelected" 
          @click="submitStory" 
        />
      </div>
    </template>
  </Dialog>
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
      dialogVisible: true,
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
      durationOptions: [
        { label: '1 minute', value: 1 * 60 * 1000 },
        { label: '1 heure', value: 60 * 60 * 1000 },
        { label: '24 heures', value: 24 * 60 * 60 * 1000 }
      ]
    };
  },
  methods: {
    onWebcamCaptured(blob) {
      this.fileSelected = true;
      this.croppedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
      this.step = 'edit';
    },
    onFileChange(event) {
      const file = event.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        this.error = "Le fichier est trop volumineux (max 10 Mo)";
        return;
      }
      
      this.fileSelected = true;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl = e.target.result;
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
    submitStory() {
      // Garder la logique existante
      if (!this.fileSelected || this.uploading) return;
      
      this.uploading = true;
      this.uploadProgress = 0;
      this.step = 'upload';
      
      const fileToUpload = this.editedBlob || this.croppedBlob;
      if (!fileToUpload) {
        this.error = "Aucun fichier à télécharger";
        this.uploading = false;
        return;
      }
      
      // Télécharger l'image
      this.uploadStory(fileToUpload)
        .then(imageUrl => {
          // Créer l'entrée dans la base de données
          return this.createStoryEntry(imageUrl);
        })
        .then(() => {
          this.$emit('uploaded');
          this.$emit('close');
        })
        .catch(error => {
          console.error("Erreur lors de la création de la story:", error);
          this.error = "Erreur lors de la création de la story: " + error.message;
          this.uploading = false;
        });
    },
    async uploadStory(fileToUpload) {
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
        return await getDownloadURL(storageReference);
      } catch (error) {
        console.error("Erreur lors du téléchargement:", error);
        throw error;
      }
    },
    async createStoryEntry(imageUrl) {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Vous devez être connecté pour créer une story.');
        
        const storyRef = push(dbRef(db, 'stories'));
        const storyId = storyRef.key;
        
        const storyData = {
          id: storyId,
          userId: user.uid,
          userName: user.displayName || 'Utilisateur',
          userAvatar: user.photoURL || null,
          imageUrl: imageUrl,
          caption: this.caption,
          timestamp: Date.now(),
          expiresAt: Date.now() + this.selectedDuration,
          viewers: {},
          reactions: {},
          elements: this.storyElements,
        };
        
        await set(storyRef, storyData);
        
        this.fileSelected = false;
        this.previewUrl = '';
        this.caption = '';
        this.uploading = false;
        this.uploadProgress = 0;
        this.error = null;
        this.croppedBlob = null;
        this.editedBlob = null;
        this.storyElements = [];
        this.step = 'select';
      } catch (error) {
        console.error("Erreur lors de la création de l'entrée story:", error);
        throw error;
      }
    }
  },
};
</script>

<style scoped>
.add-story-dialog {
  font-family: var(--font-family, 'Inter', 'Segoe UI', Arial, sans-serif);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.dialog-header h2 {
  margin: 0;
  color: var(--primary-color, #2196f3);
  font-weight: 600;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.selection-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-step {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.story-preview {
  display: flex;
  justify-content: center;
  margin: 1rem 0;
}

.story-preview img {
  max-width: 100%;
  max-height: 50vh;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.step-msg {
  margin: 1rem 0;
}

.upload-progress {
  width: 100%;
  margin: 1rem 0;
}

/* Styles responsifs */
@media (max-width: 768px) {
  .story-preview img {
    max-height: 40vh;
  }
}
</style>
