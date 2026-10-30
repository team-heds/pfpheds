<template>
  <header class="gamification-navbar">
    <router-link class="brand" to="/feed" aria-label="Retour à l’accueil HEdS">
      <img src="/pictoHEdS.png" alt="" />
      <span>Gamification</span>
    </router-link>

    <nav aria-label="Navigation gamification">
      <router-link v-if="user?.id" :to="`/gamification-profile/${user.id}`">Profil</router-link>
      <router-link v-else to="/quests">Profil</router-link>
      <router-link to="/quests">Quêtes</router-link>
      <router-link to="/challenges">Défis</router-link>
      <router-link to="/achievements">Badges</router-link>
    </nav>

    <div class="account-actions">
      <router-link v-if="user?.id" :to="`/profile/${user.id}`">Mon compte</router-link>
      <button v-if="user" type="button" @click="signOut">Déconnexion</button>
    </div>
  </header>
</template>

<script setup>
import { useRouter } from 'vue-router'
import { supabase } from '@/supabase'
import { useGamificationAuth } from './useGamificationAuth'

const router = useRouter()
const { user } = useGamificationAuth()

const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('[GamificationNavbar] Erreur de déconnexion Supabase:', error)
    return
  }
  await router.push('/home')
}
</script>

<style scoped>
.gamification-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem clamp(1rem, 5vw, 4rem);
  background: var(--surface-card);
  border-bottom: 1px solid var(--surface-border);
}

.brand,
.gamification-navbar nav,
.account-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.brand {
  color: var(--text-color);
  font-weight: 700;
  text-decoration: none;
  white-space: nowrap;
}

.brand img {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
}

.gamification-navbar nav a,
.account-actions a,
.account-actions button {
  color: var(--text-color-secondary);
  font: inherit;
  text-decoration: none;
}

.gamification-navbar nav a.router-link-active,
.account-actions a:hover,
.gamification-navbar nav a:hover {
  color: var(--primary-color);
}

.account-actions button {
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
}

.account-actions button:focus-visible,
.gamification-navbar a:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 3px;
  border-radius: 0.25rem;
}

@media (max-width: 760px) {
  .gamification-navbar {
    flex-wrap: wrap;
  }

  .gamification-navbar nav {
    order: 3;
    width: 100%;
    justify-content: space-between;
    gap: 0.5rem;
    font-size: 0.875rem;
  }
}
</style>
