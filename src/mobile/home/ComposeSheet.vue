<template>
  <BottomSheet title="Nouvelle publication" tall :locked="busy" @close="emit('close')">
    <div class="m-compose">
      <PostComposer
        ref="composerRef"
        :publish="publish"
        hide-submit
        editor-min-height="9rem"
        placeholder="Partage une expérience, une question"
        @state="onState"
        @published="onPublished"
      />
    </div>
    <template #footer>
      <button type="button" class="m-cta" :disabled="!canPublish || busy" :aria-busy="busy ? 'true' : 'false'" @click="composerRef?.submit()">
        <span v-if="busy" class="m-spinner" aria-hidden="true"></span>
        {{ busy ? 'Publication…' : 'Publier' }}
      </button>
    </template>
  </BottomSheet>
</template>

<script setup>
import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import PostComposer from '@/components/social/library/PostComposer.vue'
import { useAuthStore } from '@/stores/authStore'
import { useSocialFeedStore } from '@/stores/socialFeedStore'
import { publishPost } from '@/service/postPublishService'
import { filterScope, FOR_YOU_FILTER } from '@/mobile/home/feedFilters'

const emit = defineEmits(['close'])

const authStore = useAuthStore()
const feedStore = useSocialFeedStore()
const toast = useToast()
const composerRef = ref(null)
const canPublish = ref(false)
const busy = ref(false)
const rootScope = filterScope(FOR_YOU_FILTER)

function onState({ canSubmit, publishing }) {
  canPublish.value = canSubmit
  busy.value = publishing
}

// La gamification (action POST) est appelée par publishPost, comme sur ordinateur.
async function publish({ content, files }) {
  const user = authStore.user
  if (!user?.id || user.id === 'guest-user') throw new Error('Utilisateur non connecté')
  feedStore.setPublishing(rootScope, true)
  try {
    const published = await publishPost({ user, content, files })
    // La publication apparaît tout de suite en tête du fil, sans attendre le serveur.
    feedStore.upsertPost(rootScope, {
      id: published.id,
      Author: published.authorName,
      IdUser: user.id,
      avatar_url: feedStore.avatarCache[user.id] || null,
      Content: content,
      Timestamp: Date.parse(published.createdAt) || Date.now(),
      Hashtags: published.hashtags,
      MentionGroups: published.mentions,
      community_id: published.communityId,
      media: published.media.map((item) => item.url),
      likes_count: 0,
      liked_by_me: false,
      comments_count: 0,
    })
  } finally {
    feedStore.setPublishing(rootScope, false)
  }
}

function onPublished() {
  toast.add({ severity: 'success', summary: 'Publication partagée', life: 2500 })
  emit('close')
}
</script>

<style scoped>
.m-compose {
  padding-top: 4px;
}
/* Le composant de publication est partagé avec l'ordinateur : on l'ajuste ici
   pour le panneau, sans toucher à son affichage d'origine. */
.m-compose :deep(.ProseMirror),
.m-compose :deep(.ProseMirror *) {
  font-family: inherit;
}
.m-compose :deep(.composer-add-media) {
  min-height: 44px;
}
.m-compose :deep(.composer-media-remove) {
  min-width: 32px;
  min-height: 32px;
}
</style>
