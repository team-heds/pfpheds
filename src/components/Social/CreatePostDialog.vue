<template>
  <Dialog
    :visible="modelValue"
    @update:visible="emit('update:modelValue', $event)"
    modal
    class="create-post-dialog"
    :breakpoints="{ '768px': '98vw', '1200px': '40vw' }"
    :style="{ width: '100vw', maxWidth: '880px', borderRadius: '1.2rem', padding: 0 }"
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
      <div class="actions-row">
        <div class="left-action">
          <FileUpload
            ref="fileupload"
            mode="basic"
            name="media[]"
            accept=".jpg,.png,.mp3,.mp4,.pdf"
            :maxFileSize="10000000"
            customUpload
            @uploader="handleFileUpload"
            class="file-upload"
          >
            <template #choose>
              <Button
                label="Médias"
                icon="pi pi-image"
                class="upload-button"
              />
            </template>
          </FileUpload>
        </div>
        <div class="right-action">
          <Button
            label="Publier"
            icon="pi pi-send"
            class="p-button-primary publish-button"
            @click="emitPublish"
            :disabled="!postContent || loading"
          />
        </div>
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
});
const emit = defineEmits(['update:modelValue', 'publish', 'update:value', 'media-selected', 'remove-media']);

const postContent = ref(props.value || '');
const detectedTags = ref([]);
const selectedMedia = ref([]);

watch(() => props.value, (val) => {
  postContent.value = val;
});
watch(postContent, (val) => {
  emit('update:value', val);
  detectTags();
});

const dialogStyle = computed(() => ({
  width: '100vw',
  maxWidth: '880px',
  borderRadius: '1.2rem',
  padding: 0
}));

function detectTags() {
  // Simple tag detection (#hashtag or @mention)
  const regex = /([#@][\w\-]+)/g;
  detectedTags.value = (postContent.value.match(regex) || []);
}
function handleFileUpload(event) {
  selectedMedia.value = event.files;
  emit('media-selected', event.files);
}
function removeMedia(index) {
  selectedMedia.value.splice(index, 1);
  emit('remove-media', index);
}
function emitPublish() {
  emit('publish');
  emit('update:modelValue', false);
}
</script>

<style scoped>
.create-post-dialog >>> .p-dialog-content {
  padding: 1.2rem 1.1rem 1.1rem 1.1rem;
  max-width: 880px;
}
.create-post-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.actions-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 18px 0 0 0;
  width: 100%;
  gap: 10px;
}
.left-action {
  flex: 1;
  display: flex;
  justify-content: flex-start;
}
.right-action {
  flex: 1;
  display: flex;
  justify-content: flex-end;
}
@media (max-width: 900px) {
  .create-post-dialog >>> .p-dialog-content {
    max-width: 100vw !important;
  }
  .actions-row {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .left-action, .right-action {
    justify-content: stretch;
  }
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
