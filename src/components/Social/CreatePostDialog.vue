<template>
  <Dialog
    :visible="modelValue"
    @update:visible="emit('update:modelValue', $event)"
    modal
    class="create-post-dialog"
    :breakpoints="{ '768px': '98vw', '1200px': '40vw' }"
    :style="dialogStyle"
  >
    <div class="create-post-wrapper">
      <TextAreaComponent
        v-model="postContent"
        @input="detectTags"
        placeholder="Exprime-toi..."
      />
      <div v-if="detectedTags.length > 0" class="tags-container p-1">
        <Tag
          v-for="(tag, index) in detectedTags"
          :key="index"
          :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'"
        >
          {{ tag }}
        </Tag>
      </div>
      <div class="actions-container w-3 pb-2">
        <FileUpload
          ref="fileupload"
          mode="basic"
          name="media[]"
          accept=".jpg,.png,.mp3,.mp4,.pdf"
          :maxFileSize="10000000"
          customUpload
          @select="handleFileSelection"
          class="file-upload"
        >
          <template #choose>
            <Button
              label="Médias"
              icon="pi pi-image"
              class="upload-button"
              @click="$refs.fileupload.choose()"
            />
          </template>
        </FileUpload>
        <Button
          label="Publier"
          icon="pi pi-send"
          class="p-button-primary publish-button"
          @click="emitPublish"
          :disabled="!postContent || loading"
        />
      </div>
      <div class="media-preview" v-if="selectedMedia.length > 0">
        <div
          v-for="(media, index) in selectedMedia"
          :key="index"
          class="media-item-wrapper"
        >
          <img
            v-if="media.type && media.type.startsWith('image/')"
            :src="media.preview"
            alt="Preview"
            class="media-item"
          />
          <video
            v-else-if="media.type && media.type.startsWith('video/')"
            :src="media.preview"
            controls
            class="media-item"
          ></video>
          <Button @click="removeMedia(index)" class="remove-media-btn">
            ✖
          </Button>
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FileUpload from 'primevue/fileupload';
import Tag from 'primevue/tag';
import TextAreaComponent from '@/components/Bibliotheque/Social/TextAreaComponent.vue';

const props = defineProps({
  modelValue: Boolean,
  loading: Boolean,
  value: String,
  selectedMedia: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['update:modelValue', 'publish', 'update:value', 'media-selected', 'remove-media']);

const postContent = ref(props.value || '');
const detectedTags = ref([]);

watch(() => props.value, (val) => {
  postContent.value = val;
});
watch(postContent, (val) => {
  emit('update:value', val);
  detectTags();
});

const dialogStyle = computed(() => ({
  width: '100vw',
  maxWidth: '500px',
  borderRadius: '1.2rem',
  padding: 0
}));

function detectTags() {
  // Simple tag detection (#hashtag or @mention)
  const regex = /([#@][\w\-]+)/g;
  detectedTags.value = (postContent.value.match(regex) || []);
}
function handleFileSelection(e) {
  emit('media-selected', e.files);
}
function removeMedia(index) {
  emit('remove-media', index);
}
function emitPublish() {
  emit('publish');
}
</script>

<style scoped>
.create-post-dialog >>> .p-dialog-content {
  padding: 1.2rem 1.1rem 1.1rem 1.1rem;
}
.create-post-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
@media (max-width: 768px) {
  .create-post-dialog >>> .p-dialog-content {
    padding: 0.7rem 0.2rem 0.7rem 0.2rem;
  }
  :deep(.p-dialog),
  :deep(.p-dialog-content),
  :deep(.p-dialog-header),
  :deep(.p-dialog-footer) {
    width: 100vw !important;
    max-width: 100vw !important;
    min-width: 100vw !important;
    left: 0 !important;
    margin: 0 !important;
    border-radius: 0 !important;
    box-sizing: border-box;
  }
  :deep(.p-dialog) {
    height: 100vh !important;
    max-height: 100vh !important;
    min-height: 100vh !important;
    top: 0 !important;
    display: flex;
    flex-direction: column;
  }
  :deep(.p-dialog-content) {
    flex: 1 1 auto;
    height: 100%;
    max-height: 100%;
    overflow-y: auto;
    padding-bottom: 1rem;
  }
}
</style>
