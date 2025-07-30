<template>
  <div class="add-story-core">
    <div v-if="step === 1" class="step-container">
      <div class="step-header">1/4 — Choisir un média</div>
      <div class="media-select-ui">
        <button class="media-btn" @click="openCamera">
          <i class="pi pi-camera"></i> Prendre une photo
        </button>
        <button class="media-btn" @click="triggerGallery">
          <i class="pi pi-image"></i> Choisir depuis la galerie
        </button>
        <input ref="fileInput" type="file" accept="image/*,video/*" @change="onFileChange" style="display:none" />
        <div v-if="dragActive" class="drag-zone drag-active"
          @dragover.prevent="dragActive = true"
          @dragleave.prevent="dragActive = false"
          @drop.prevent="onDrop">
          <span>Déposez votre média ici</span>
        </div>
        <div v-else class="drag-zone"
          @dragover.prevent="dragActive = true">
          <span>Ou glissez-déposez un fichier</span>
        </div>
      </div>
      <div v-if="previewUrl" class="media-preview">
        <img v-if="isImage" :src="previewUrl" :style="previewStyle" />
        <video v-else :src="previewUrl" controls :style="previewStyle" />
      </div>
      <button class="publish-btn" @click="goToStep2" :disabled="!previewUrl">Suivant</button>
    </div>
    <ImageCropper
      v-if="step === 2 && isImage"
      :src="previewUrl"
      :outputWidth="1080"
      :outputHeight="1920"
      :aspectRatio="9/16"
      @cropped="onCropDone"
      @cancel="goToStep1"
    />
    <div v-else-if="step === 3 && isImage" class="step-container" style="position:relative; min-height: 48vh;">
      <div class="step-header">3/4 — Personnaliser</div>
      <StoryEditor
        :src="previewUrl"
        :outputWidth="1080"
        :outputHeight="1920"
        @edited="onStoryEdited"
        @cancel="goToStep2"
      />
      <div style="width:100%;display:flex;justify-content:center;position:relative;z-index:1001;">
        <button
          class="publish-btn"
          @click="goToStep4"
          style="margin:24px auto 0 auto;min-width:160px;max-width:320px;"
        >Suivant</button>
      </div>
    </div>
    <div v-else-if="step === 4 && isImage" class="step-container">
      <div class="step-header">4/4 — Prévisualiser</div>
      <template v-if="isImage">
        <img :src="previewUrl" :style="previewStyle" />
      </template>
      <template v-else>
        <video :src="previewUrl" controls :style="previewStyle" />
      </template>
      <textarea v-model="caption" placeholder="Ajouter un texte (optionnel)" maxlength="100" />
      <select v-model="selectedDuration" style="margin:8px 0;max-width:320px;width:90vw;">
        <option v-for="opt in durationOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <div class="step-actions">
        <button class="cancel-btn" @click="step = isImage ? 3 : 1" :disabled="uploading">Retour</button>
        <button class="publish-btn" @click="publishStory" :disabled="uploading">
          <span v-if="!uploading">Publier la story</span>
          <span v-else>Publication...</span>
        </button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
    <div v-if="uploading" style="width:90vw;max-width:320px;margin-top:8px;">
      <div style="background:#eee;height:6px;border-radius:4px;overflow:hidden;">
        <div :style="{background:'#F3C300',width:uploadProgress+'%',height:'6px',transition:'width 0.3s'}"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref as dbRef, push, set } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../../../../firebase.js';
import StoryEditor from './StoryEditor.vue';
import ImageCropper from './ImageCropper.vue';

export default {
  name: 'AddStoryCore',
  components: { StoryEditor, ImageCropper },
  emits: ['update:modelValue', 'publish-story', 'uploaded'],
  props: {
    modelValue: String,
    user: Object
  },
  data() {
    return {
      step: 1,
      previewUrl: '',
      file: null,
      caption: '',
      error: '',
      isImage: true,
      uploading: false,
      uploadProgress: 0,
      selectedDuration: 24 * 60 * 60 * 1000, // 24h par défaut
      durationOptions: [
        { label: '1 minute', value: 1 * 60 * 1000 },
        { label: '1 heure', value: 60 * 60 * 1000 },
        { label: '24 heures', value: 24 * 60 * 60 * 1000 }
      ],
      editedBlob: null,
      storyElements: [],
      dragActive: false,
    };
  },
  computed: {
    previewStyle() {
      return {
        width: '270px',
        height: '480px',
        objectFit: 'cover',
        borderRadius: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.13)'
      };
    }
  },
  methods: {
    openCamera() {
      // Si Capacitor/Ionic, utiliser la caméra native
      this.$toast && this.$toast.add({severity:'info', summary:'Fonction caméra à intégrer (voir Capacitor Camera)', life: 1800});
    },
    triggerGallery() {
      this.$refs.fileInput.click();
    },
    onDrop(e) {
      this.dragActive = false;
      const files = e.dataTransfer.files;
      if (files && files[0]) this.handleFile(files[0]);
    },
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      this.handleFile(file);
    },
    handleFile(file) {
      if (file.size > 30 * 1024 * 1024) {
        this.error = "Le fichier est trop volumineux (max 30 Mo)";
        return;
      }
      this.file = file;
      this.isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.previewUrl = evt.target.result;
      };
      reader.readAsDataURL(file);
      this.error = '';
    },
    goToStep1() {
      this.step = 1;
      this.editedBlob = null;
      this.storyElements = [];
      this.previewUrl = '';
      this.file = null;
    },
    goToStep2() {
      if (!this.previewUrl) return;
      if (this.isImage) {
        this.step = 2;
      } else {
        this.step = 2; // Vidéo : pas de crop, mais même étape
      }
    },
    onCropDone(blob) {
      this.editedBlob = blob;
      this.previewUrl = URL.createObjectURL(blob);
      this.step = 3;
    },
    onStoryEdited(blob, elements) {
      this.editedBlob = blob;
      this.storyElements = elements || [];
      this.previewUrl = URL.createObjectURL(blob);
      this.step = 4;
    },
    async publishStory() {
      if (!this.file && !this.editedBlob) {
        this.error = "Veuillez sélectionner une image ou une vidéo.";
        return;
      }
      this.uploading = true;
      this.uploadProgress = 0;
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error('Vous devez être connecté pour créer une story.');
        const ext = this.file && this.file.name ? this.file.name.split('.').pop() : (this.isImage ? 'jpg' : 'mp4');
        const fileToUpload = this.editedBlob || this.file;
        const fileName = `story_${user.uid}_${Date.now()}.${ext}`;
        const storageReference = storageRef(getStorage(), `stories/${user.uid}/${fileName}`);
        await uploadBytes(storageReference, fileToUpload);
        const imageUrl = await getDownloadURL(storageReference);
        // Créer l'entrée dans la base de données
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
        this.$emit('uploaded');
        this.reset();
        this.$toast && this.$toast.add({severity:'success', summary:'Story publiée', life: 2000});
      } catch (e) {
        this.error = 'Erreur lors de la publication de la story: ' + e.message;
      } finally {
        this.uploading = false;
      }
    },
    reset() {
      this.step = 1;
      this.previewUrl = '';
      this.file = null;
      this.caption = '';
      this.error = '';
      this.isImage = true;
      this.uploading = false;
      this.uploadProgress = 0;
      this.editedBlob = null;
      this.storyElements = [];
      this.dragActive = false;
    },
    goToStep4() {
      this.step = 4;
    }
  }
};
</script>

<style scoped>
.add-story-core { display: flex; flex-direction: column; align-items: center; padding: 16px 0; }
.step-container { width: 100%; max-width: 350px; display: flex; flex-direction: column; align-items: center; }
.step-header { font-weight: 600; font-size: 1.1rem; margin-bottom: 12px; color: #F3C300; letter-spacing: 0.04em; }
.info { color: #555; font-size: 0.97rem; margin-bottom: 18px; }
.media-select-ui { display: flex; flex-direction: column; gap: 10px; align-items: center; width: 100%; }
.media-btn { background: #fff; color: #222; border: 1.5px solid #F3C300; border-radius: 10px; padding: 10px 18px; font-size: 1.05rem; font-weight: 600; display: flex; align-items: center; gap: 8px; box-shadow: 0 1px 6px rgba(0,0,0,0.05); transition: background .15s; }
.media-btn:active { background: #f8f8f8; }
.drag-zone { margin: 12px 0 0 0; width: 98%; min-height: 60px; border: 2px dashed #F3C300; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #bfa700; font-size: 1rem; background: #fffbe6; cursor: pointer; transition: border .2s; }
.drag-active { border: 2.5px solid #F3C300; background: #fff8d6; }
.media-preview { margin: 14px 0 0 0; display: flex; flex-direction: column; align-items: center; }
.media-preview img, .media-preview video { border-radius: 14px; box-shadow: 0 2px 12px rgba(0,0,0,0.13); }
textarea { width: 90vw; max-width: 320px; min-height: 40px; border-radius: 8px; border: 1px solid #ccc; padding: 8px; font-size: 1rem; margin: 12px 0; }
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
.step-next-btn {
  display: block;
  font-weight: bold;
  text-align: center;
  letter-spacing: 1px;
  width: 90vw;
  max-width: 430px;
  margin: 0 auto 8px auto;
  border-radius: 12px;
  font-size: 1.05rem;
  padding: 10px 0;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  background: #F3C300;
  color: #181e2a;
  border: none;
}
.cancel-btn { margin-top: 4px; background: #eee; color: #222; border: none; border-radius: 8px; padding: 6px 18px; font-weight: 400; font-size: 1.07rem; }
.error { color: #d32f2f; margin-top: 8px; font-size: 0.98rem; text-align: center; }
.step-actions { display: flex; gap: 12px; margin-top: 12px; }
.canvas-container, .canvas-wrapper {
  max-height: 48vh !important;
}
</style>
