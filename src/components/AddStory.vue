<template>
  <div class="add-story-modal">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <h3>Ajouter une story</h3>
      <input v-if="step === 'select'" type="file" accept="image/*" @change="onFileChange" />
      <div v-if="step === 'select'" class="step-msg">Sélectionnez une image à publier en story.</div>

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
import { storage, db } from 'root/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import ImageCropper from './ImageCropper.vue';
import StoryEditor from './StoryEditor.vue';

export default {
  name: 'AddStory',
  components: { ImageCropper, StoryEditor },
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
    };
  },
  methods: {
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
    onEdited(blob) {
      this.editedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
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
        const storageReference = storageRef(storage, `stories/${user.uid}/${fileName}`);
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
          expiresAt: now + 24 * 60 * 60 * 1000,
          viewers: [],
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
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}
.modal-content {
  background: #18191a;
  border-radius: 16px;
  padding: 32px 28px 24px;
  min-width: 340px;
  box-shadow: 0 2px 32px rgba(0,0,0,0.32);
  position: relative;
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.story-preview img {
  max-width: 220px;
  max-height: 340px;
  border-radius: 18px;
  margin-bottom: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
}
.caption-input {
  width: 95%;
  min-height: 38px;
  margin: 8px 0 18px 0;
  border-radius: 8px;
  border: none;
  padding: 8px;
  font-size: 1rem;
  background: #242526;
  color: #fff;
}
.add-btn {
  margin-top: 14px;
  background: #0095f6;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.add-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.progress-bar-container {
  width: 100%;
  background: #333;
  border-radius: 8px;
  height: 14px;
  margin-bottom: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
}
.progress-bar {
  height: 100%;
  background: #0095f6;
  transition: width 0.3s;
}
.error {
  color: #ff4d4f;
  margin-top: 8px;
  font-size: 0.9rem;
}
.close-btn {
  position: absolute;
  top: 8px;
  right: 12px;
  font-size: 1.8rem;
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
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
