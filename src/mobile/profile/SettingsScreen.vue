<template>
  <MobileStackScreen title="Réglages" @back="emit('close')">
    <div class="m-settings">
      <section aria-labelledby="m-settings-photo">
        <h2 id="m-settings-photo" class="m-settings__heading">Photo de profil</h2>
        <div class="m-settings__photo">
          <span class="m-settings__avatar">
            <img v-if="avatarUrl" :src="avatarUrl" alt="" />
            <span v-else aria-hidden="true">{{ initialsOf(name) }}</span>
          </span>
          <div class="m-settings__photo-text">
            <p>{{ name }}</p>
            <small>JPG, PNG, GIF ou WEBP, 5 Mo au maximum</small>
          </div>
        </div>
        <input id="m-settings-file" class="m-sr-only" type="file" accept="image/jpeg,image/png,image/gif,image/webp" :disabled="uploading" @change="onAvatarChosen" />
        <label for="m-settings-file" class="m-ghost-button m-settings__upload" :class="{ 'is-busy': uploading }">
          <span v-if="uploading" class="m-spinner" aria-hidden="true"></span>
          <MIcon v-else name="camera" />
          {{ uploading ? 'Envoi de la photo…' : 'Changer ma photo' }}
        </label>
        <p v-if="avatarError" class="m-settings__error" role="alert">{{ avatarError }}</p>
      </section>

      <section aria-labelledby="m-settings-notifications">
        <h2 id="m-settings-notifications" class="m-settings__heading">Notifications sur ce téléphone</h2>
        <PushOptIn purpose="quand quelqu’un réagit à tes publications ou réserve un créneau" class="m-settings__push" />
      </section>

      <section aria-labelledby="m-settings-display">
        <h2 id="m-settings-display" class="m-settings__heading">Affichage</h2>
        <div class="m-settings__themes" role="radiogroup" aria-label="Thème">
          <button
            v-for="option in THEMES"
            :key="option.key"
            type="button"
            role="radio"
            :aria-checked="scheme === option.key ? 'true' : 'false'"
            @click="setScheme(option.key)"
          >
            <MIcon :name="option.icon" />
            {{ option.label }}
          </button>
        </div>
      </section>

      <section aria-labelledby="m-settings-more">
        <h2 id="m-settings-more" class="m-settings__heading">Autres</h2>
        <div class="m-settings__rows">
          <button type="button" class="m-row-link" @click="router.push('/settings')">
            <span class="m-row-link__icon" aria-hidden="true"><MIcon name="settings" /></span>
            <span class="m-row-link__text"><span>Tous les réglages</span><small>Interface, date et heure, données en cache</small></span>
            <MIcon name="next" />
          </button>
          <button type="button" class="m-row-link" @click="router.push('/terms_of_use')">
            <span class="m-row-link__icon" aria-hidden="true"><MIcon name="file" /></span>
            <span class="m-row-link__text"><span>Conditions d’utilisation</span></span>
            <MIcon name="next" />
          </button>
        </div>
      </section>

      <button type="button" class="m-settings__logout" :disabled="leaving" @click="logout">
        <span v-if="leaving" class="m-spinner" aria-hidden="true"></span>
        <MIcon v-else name="logout" />
        Se déconnecter
      </button>
      <p class="m-settings__version">Version {{ version }}</p>
    </div>
  </MobileStackScreen>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import MobileStackScreen from '@/mobile/ui/MobileStackScreen.vue'
import MIcon from '@/mobile/ui/MIcon.vue'
import PushOptIn from '@/components/push/PushOptIn.vue'
import { useAuthStore } from '@/stores/authStore'
import { useUserStore } from '@/stores/userStore'
import supabaseStorageService from '@/service/supabaseStorageService'
import { useMobileStoriesStore } from '@/mobile/home/mobileStoriesStore'
import { initialsOf } from '@/mobile/home/postMedia'
import { useMobileProfileStore } from '@/mobile/profile/mobileProfileStore'
import { displayNameOf } from '@/mobile/profile/profileHelpers'
import { applyScheme, currentScheme } from '@/mobile/profile/theme'
import packageInfo from '../../../package.json'

const THEMES = [
  { key: 'dim', label: 'Sombre', icon: 'moon' },
  { key: 'light', label: 'Clair', icon: 'sun' },
]

const emit = defineEmits(['close'])
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const userStore = useUserStore()
const profile = useMobileProfileStore()
const stories = useMobileStoriesStore()

const version = packageInfo.version
const name = computed(() => displayNameOf(profile.profile, authStore.user?.email))
const avatarUrl = computed(() => profile.profile?.avatar_url || stories.ownAvatarUrl || null)

// --- Photo de profil -----------------------------------------------------------
const uploading = ref(false)
const avatarError = ref('')
async function onAvatarChosen(event) {
  const file = event.target.files?.[0]
  const userId = authStore.user?.id
  if (!file || !userId || uploading.value) return
  uploading.value = true
  avatarError.value = ''
  try {
    const result = await supabaseStorageService.replaceUserAvatar(userId, file)
    profile.setAvatar(result.url)
    stories.ownAvatarUrl = result.url
    // Le reste de la plateforme relit le profil : la nouvelle photo y apparaît aussi.
    void Promise.resolve(userStore.fetchProfile?.()).catch(() => null)
    toast.add({ severity: 'success', summary: 'Photo mise à jour', life: 2500 })
  } catch (error) {
    console.error('[Réglages] Photo refusée:', error)
    avatarError.value = error?.message || 'La photo n’a pas pu être enregistrée. Réessaie avec une autre image.'
  } finally {
    uploading.value = false
    event.target.value = ''
  }
}

// --- Thème ---------------------------------------------------------------------
const scheme = ref(currentScheme())
function setScheme(next) {
  scheme.value = applyScheme(next)
}

// --- Déconnexion ---------------------------------------------------------------
const leaving = ref(false)
async function logout() {
  if (leaving.value) return
  leaving.value = true
  try {
    await authStore.signOut()
    await router.push('/home')
  } catch (error) {
    console.error('[Réglages] Déconnexion impossible:', error)
    toast.add({ severity: 'error', summary: 'Déconnexion impossible', detail: 'Réessaie dans un instant.', life: 4000 })
    leaving.value = false
  }
}
</script>

<style scoped>
.m-settings {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding-top: 4px;
}
.m-settings__heading {
  margin: 0 0 8px;
  color: var(--m-muted);
  font-size: 0.8125rem;
  font-weight: 600;
}
.m-settings__photo {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 10px;
}
.m-settings__avatar {
  flex-shrink: 0;
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  overflow: hidden;
  border-radius: 50%;
  background: var(--m-surface);
  font-size: 1.125rem;
  font-weight: 600;
}
.m-settings__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.m-settings__photo-text {
  min-width: 0;
}
.m-settings__photo-text p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.m-settings__photo-text small {
  color: var(--m-muted);
  font-size: 0.75rem;
}
.m-settings__upload {
  width: 100%;
}
.m-settings__upload.is-busy {
  opacity: 0.6;
  pointer-events: none;
}
input:focus-visible + .m-settings__upload {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
.m-settings__error {
  margin: 8px 0 0;
  color: var(--m-danger);
  font-size: 0.8125rem;
}
.m-settings__push {
  border-radius: 16px;
  font-size: 0.8125rem;
}
.m-settings__push :deep(.push-opt-in__action) {
  min-height: 44px;
}
.m-settings__themes {
  display: flex;
  padding: 4px;
  border-radius: 14px;
  background: var(--m-surface);
}
.m-settings__themes button {
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  border: 0;
  border-radius: 10px;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
}
.m-settings__themes button[aria-checked='true'] {
  background: var(--m-raised);
  color: var(--m-fg);
  font-weight: 600;
}
.m-settings__themes button:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-settings__themes :deep(.m-icon) {
  width: 18px;
  height: 18px;
}
.m-settings__rows {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.m-settings__logout {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 48px;
  border: 1px solid var(--m-danger);
  border-radius: 14px;
  background: none;
  color: var(--m-danger);
  font: inherit;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
}
.m-settings__logout:focus-visible {
  outline: 2px solid var(--m-danger);
  outline-offset: 2px;
}
.m-settings__version {
  margin: 0;
  color: var(--m-muted);
  font-size: 0.75rem;
  text-align: center;
}
</style>
