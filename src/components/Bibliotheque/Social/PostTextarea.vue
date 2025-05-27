<template>
  <div class="post-textarea">
    <textarea
      v-model="localValue"
      :placeholder="placeholder"
      class="form-control"
      @input="onInput"
    />
    <div v-if="detectedTags.length > 0" class="tags-container">
      <span
        v-for="(tag, i) in detectedTags"
        :key="i"
        :class="tag.startsWith('#') ? 'tag-primary' : 'tag-secondary'"
        class="tag-item"
      >
        {{ tag }}
      </span>
    </div>
    <div class="actions-row">
      <label class="media-upload-btn">
        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.mp3,.mp4,.pdf"
          @change="handleFileUpload"
          style="display:none;"
        />
        <span><i class="pi pi-image"></i> Médias</span>
      </label>
    </div>
    <div class="media-preview" v-if="selectedMedia.length > 0">
      <div
        v-for="(media, idx) in selectedMedia"
        :key="idx"
        class="media-item-wrapper"
      >
        <img v-if="media.type.startsWith('image/')" :src="media.preview" class="media-item" />
        <video v-else-if="media.type.startsWith('video/')" :src="media.preview" controls class="media-item" />
        <span v-else class="media-item file-icon">📄</span>
        <button class="remove-media-btn" @click="removeMedia(idx)">✖</button>
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase';
import { getAuth } from 'firebase/auth';
import { ref as dbRef, push, set } from 'firebase/database';

export default {
  name: "PostTextarea",
  props: {
    modelValue: {
      type: String,
      required: true,
    },
    placeholder: {
      type: String,
      default: "Exprimez-vous...",
    },
  },
  emits: ["update:modelValue", "media-selected", "remove-media", "post-published", "publish"],
  data() {
    return {
      localValue: this.modelValue,
      detectedTags: [],
      selectedMedia: [],
      loading: false,
    };
  },
  watch: {
    modelValue(val) {
      this.localValue = val;
    },
    localValue(val) {
      this.$emit("update:modelValue", val);
      this.detectTags();
    },
  },
  methods: {
    onInput(e) {
      this.localValue = e.target.value;
    },
    detectTags() {
      const regex = /([#@][\w\-]+)/g;
      this.detectedTags = this.localValue.match(regex) || [];
    },
    handleFileUpload(e) {
      const files = Array.from(e.target.files);
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = ev => {
          this.selectedMedia.push({
            file,
            name: file.name,
            type: file.type,
            preview: ev.target.result
          });
          this.$emit('media-selected', this.selectedMedia);
        };
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
          reader.readAsDataURL(file);
        } else {
          this.selectedMedia.push({
            file,
            name: file.name,
            type: file.type,
            preview: ''
          });
          this.$emit('media-selected', this.selectedMedia);
        }
      });
      e.target.value = '';
    },
    removeMedia(idx) {
      this.selectedMedia.splice(idx, 1);
      this.$emit('media-selected', this.selectedMedia);
    },
    async handlePublish() {
      if (!this.localValue && this.selectedMedia.length === 0) return;
      this.loading = true;
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("Vous devez être connecté pour publier.");
        const postData = {
          userId: user.uid,
          content: this.localValue,
          createdAt: Date.now(),
          userName: user.displayName || '',
          userAvatar: user.photoURL || '',
          media: this.selectedMedia.map(m => ({
            file: m.file,
            name: m.name,
            type: m.type,
            preview: m.preview || ''
          })),
        };
        console.log('[DEBUG] postData envoyé au parent:', postData);
        this.$emit('publish', postData);
        this.localValue = '';
        this.selectedMedia = [];
      } catch (e) {
        alert('Erreur lors de la préparation du post: ' + e.message);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
.post-textarea {
  width: 100%;
  background: #0B213F;
  border-radius: 1.2rem;
  padding: 1rem 1rem 0.6rem 1rem;
  box-sizing: border-box;
  margin-bottom: 1rem;
}
.form-control {
  width: 100%;
  min-height: 90px;
  padding: 0.75rem;
  background-color: #0B213F;
  border-radius: 1.2rem;
  color: #fff;
  font-size: 1.1rem;
  border: none;
  outline: none;
  resize: vertical;
}
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin: 0.6rem 0 0.2rem 0;
}
.tag-item {
  padding: 0.18rem 0.65rem;
  border-radius: 1rem;
  font-size: 0.92rem;
  font-weight: 600;
  color: #fff;
}
.tag-primary {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
}
.tag-secondary {
  background: #22385C;
}
.actions-row {
  display: flex;
  align-items: center;
  margin: 0.7rem 0 0.2rem 0;
}
.media-upload-btn {
  background: #192c43;
  color: #fff;
  border-radius: 12px;
  padding: 0.35rem 1.1rem;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.15s;
}
.media-upload-btn:hover {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
}
.media-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  margin: 0.7rem 0 0 0;
}
.media-item-wrapper {
  position: relative;
  border-radius: 1rem;
  overflow: hidden;
  background: #162a4a;
  width: 75px;
  height: 75px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.media-item {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1rem;
}
.file-icon {
  font-size: 2.2rem;
  color: #F3C300;
}
.remove-media-btn {
  position: absolute;
  top: 2px;
  right: 2px;
  background: #22385C;
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 2;
}
.remove-media-btn:hover {
  background: #F3C300;
  color: #222;
}
.publish-btn {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #222;
  border: none;
  border-radius: 12px;
  padding: 0.38rem 1.2rem;
  font-size: 1rem;
  font-weight: 600;
  margin-left: 0.7rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  transition: background 0.15s;
}
.publish-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@media (max-width: 600px) {
  .post-textarea {
    padding: 0.8rem 0.3rem 0.5rem 0.3rem;
  }
  .media-item-wrapper {
    width: 56px;
    height: 56px;
  }
}
</style>
