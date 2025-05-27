<template>
  <div class="add-story-core">
    <div v-if="!previewUrl" class="file-upload-container">
      <input type="file" accept="image/*" @change="onFileChange" />
      <p class="info">Ajoutez une image pour votre story.</p>
    </div>
    <div v-else class="story-preview">
      <img :src="previewUrl" alt="preview" />
      <textarea v-model="caption" placeholder="Ajouter un texte (optionnel)" maxlength="100" />
      <button class="publish-btn" @click="publishStory">Publier la story</button>
      <button class="cancel-btn" @click="reset">Annuler</button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
export default {
  name: 'AddStoryCore',
  emits: ['update:modelValue', 'publish-story'],
  props: {
    modelValue: String,
    user: Object
  },
  data() {
    return {
      previewUrl: '',
      file: null,
      caption: '',
      error: ''
    };
  },
  methods: {
    onFileChange(e) {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        this.error = "Le fichier est trop volumineux (max 10 Mo)";
        return;
      }
      this.file = file;
      const reader = new FileReader();
      reader.onload = (evt) => {
        this.previewUrl = evt.target.result;
      };
      reader.readAsDataURL(file);
    },
    publishStory() {
      if (!this.file) {
        this.error = "Veuillez sélectionner une image.";
        return;
      }
      this.$emit('publish-story', {
        file: this.file,
        caption: this.caption
      });
      this.reset();
    },
    reset() {
      this.previewUrl = '';
      this.file = null;
      this.caption = '';
      this.error = '';
    }
  }
};
</script>

<style scoped>
.add-story-core {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px 0;
}
.file-upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.story-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.story-preview img {
  max-width: 80vw;
  max-height: 40vh;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
textarea {
  width: 90vw;
  max-width: 320px;
  min-height: 40px;
  border-radius: 8px;
  border: 1px solid #ccc;
  padding: 8px;
  font-size: 1rem;
}
.publish-btn {
  margin-top: 8px;
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
  border-radius: 8px;
  padding: 8px 24px;
  font-weight: 600;
}
.cancel-btn {
  margin-top: 4px;
  background: #eee;
  color: #222;
  border: none;
  border-radius: 8px;
  padding: 6px 18px;
  font-weight: 400;
}
.error {
  color: #c00;
  margin-top: 8px;
}
.info {
  color: #aaa;
  font-size: 0.98rem;
}
</style>
