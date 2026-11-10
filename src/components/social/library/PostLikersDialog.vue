<template>
  <Dialog
    v-model:visible="visible"
    modal
    dismissable-mask
    header="J’aime"
    :style="{ width: 'min(92vw, 420px)' }"
    class="post-likers-dialog"
  >
    <p v-if="loading" class="likers-state" role="status">Chargement…</p>
    <p v-else-if="error" class="likers-state" role="alert">Liste indisponible pour le moment.</p>
    <p v-else-if="!likers.length" class="likers-state">Personne n’a encore aimé cette publication.</p>
    <ul v-else class="likers-list">
      <li v-for="liker in likers" :key="liker.user_id" class="liker">
        <img v-if="liker.avatar_url" :src="liker.avatar_url" alt="" class="liker-avatar" />
        <span v-else class="liker-avatar liker-avatar--initial" aria-hidden="true">
          {{ (liker.display_name || '?').charAt(0).toUpperCase() }}
        </span>
        <router-link :to="{ name: 'Profile', params: { id: liker.user_id } }" class="liker-name" @click="visible = false">
          {{ liker.display_name }}
        </router-link>
      </li>
    </ul>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Dialog from 'primevue/dialog'
import { fetchPostLikers } from '@/service/postLikesService'

const props = defineProps({ postId: { type: String, required: true } })
const visible = defineModel('visible', { type: Boolean, default: false })

const likers = ref([])
const loading = ref(false)
const error = ref(false)

watch(visible, async (open) => {
  if (!open) return
  loading.value = true
  error.value = false
  try {
    likers.value = await fetchPostLikers(props.postId)
  } catch (err) {
    console.error('[Feed] Liste des j’aime indisponible:', err)
    error.value = true
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.likers-state {
  margin: 0;
  color: var(--text-color-secondary);
}
.likers-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 60vh;
  overflow-y: auto;
}
.liker {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.liker-avatar {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}
.liker-avatar--initial {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--surface-ground);
  color: var(--text-color);
  font-weight: 600;
}
.liker-name {
  color: var(--text-color);
  font-weight: 600;
  text-decoration: none;
}
.liker-name:hover,
.liker-name:focus-visible {
  text-decoration: underline;
}
</style>
