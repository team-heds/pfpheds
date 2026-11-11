<template>
  <BottomSheet title="J’aime" @close="emit('close')">
    <p v-if="loading" class="m-likers__state" role="status">
      <span class="m-spinner" aria-hidden="true"></span>
      Chargement…
    </p>
    <div v-else-if="failed" class="m-likers__state" role="alert">
      <p>Liste indisponible pour le moment.</p>
      <button type="button" class="m-ghost-button" @click="load">Réessayer</button>
    </div>
    <p v-else-if="!likers.length" class="m-likers__state">Personne n’a encore aimé cette publication.</p>
    <ul v-else class="m-likers__list">
      <li v-for="liker in likers" :key="liker.user_id">
        <button type="button" class="m-likers__item" @click="openProfile(liker)">
          <img v-if="liker.avatar_url" :src="liker.avatar_url" alt="" class="m-likers__avatar" loading="lazy" />
          <span v-else class="m-likers__avatar m-likers__avatar--initials" aria-hidden="true">{{ initialsOf(liker.display_name) }}</span>
          <span class="m-likers__name">{{ liker.display_name || 'Utilisateur' }}</span>
          <MIcon name="next" />
        </button>
      </li>
    </ul>
  </BottomSheet>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import { fetchPostLikers } from '@/service/postLikesService'
import { initialsOf } from '@/mobile/home/postMedia'

const props = defineProps({ postId: { type: String, required: true } })
const emit = defineEmits(['close'])

const router = useRouter()
const likers = ref([])
const loading = ref(true)
const failed = ref(false)

async function load() {
  loading.value = true
  failed.value = false
  try {
    likers.value = await fetchPostLikers(props.postId)
  } catch (error) {
    console.error('[Feed] Liste des j’aime indisponible:', error)
    failed.value = true
  } finally {
    loading.value = false
  }
}
onMounted(load)

const openProfile = (liker) => router.push({ name: 'Profile', params: { id: liker.user_id } })
</script>

<style scoped>
.m-likers__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin: 0;
  padding: 28px 12px;
  color: var(--m-muted);
  font-size: 0.875rem;
  text-align: center;
}
.m-likers__state p {
  margin: 0;
}
.m-likers__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.m-likers__item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  min-height: 56px;
  padding: 6px 0;
  border: 0;
  background: none;
  color: var(--m-fg);
  font: inherit;
  font-size: 0.9375rem;
  text-align: left;
  cursor: pointer;
}
.m-likers__item :deep(.m-icon) {
  color: var(--m-muted);
}
.m-likers__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--m-raised);
}
.m-likers__avatar--initials {
  display: grid;
  place-items: center;
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-likers__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
