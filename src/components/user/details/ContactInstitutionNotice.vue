<template>
  <Dialog
    v-model:visible="visible"
    modal
    :closable="false"
    :draggable="false"
    header="Attends le go de ton répondant HES"
    :style="{ width: 'min(32rem, calc(100vw - 2rem))' }"
  >
    <p class="m-0 line-height-3">
      Merci de <strong>ne pas contacter l'institution ni le milieu pratique</strong> avant que ton
      répondant HES ait confirmé que ta place est en ordre.
    </p>
    <p class="mt-3 mb-0 line-height-3">Tu pourras prendre contact dès que tu auras reçu son go.</p>
    <template #footer>
      <Button label="J'ai compris" autofocus @click="acknowledge" />
    </template>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { supabase } from '@/supabase'
import { useAuthStore } from '@/stores/authStore'
import { stagesAwaitingRepondantGo } from '@/domain/pfp/contactHold'

const props = defineProps({
  userId: { type: String, default: null },
})

const authStore = useAuthStore()
const visible = ref(false)
let pendingIds = []

const storageKey = (userId) => `pfpheds:contact-hold-ack:${userId}`

function readAcknowledged(userId) {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey(userId)) || '[]')
    return new Set(Array.isArray(stored) ? stored.map(String) : [])
  } catch {
    return new Set()
  }
}

function acknowledge() {
  visible.value = false
  try {
    const acknowledged = readAcknowledged(props.userId)
    pendingIds.forEach((id) => acknowledged.add(id))
    localStorage.setItem(storageKey(props.userId), JSON.stringify([...acknowledged]))
  } catch {
    // Sans stockage, le rappel réapparaîtra simplement à la prochaine visite.
  }
}

async function load(userId) {
  visible.value = false
  pendingIds = []
  const ownId = authStore.user?.id || authStore.user?.uid
  if (!userId || userId !== ownId) return

  const { data, error } = await supabase
    .from('student_result_vote')
    .select('id,status,year,is_validated,pfp_validee,pfp_echec,pfp_arret')
    .eq('user_id', userId)
    .eq('status', 'published')
  if (error || userId !== props.userId) return

  pendingIds = stagesAwaitingRepondantGo(data).map((row) => String(row.id))
  const acknowledged = readAcknowledged(userId)
  visible.value = pendingIds.some((id) => !acknowledged.has(id))
}

watch(() => [props.userId, authStore.user?.id], ([userId]) => { void load(userId) }, { immediate: true })
</script>
