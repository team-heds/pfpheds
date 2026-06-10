<template>
  <div class="game-hub">
    <!-- Game Selection Menu -->
    <div v-if="!selectedGame" class="game-menu">
      <h1 class="game-title">Centre de Jeux</h1>
      <div class="games-grid">
        <div class="game-card" @click="selectGame('ventriglisse3d')">
          <div class="game-avatars">
            <img
              v-for="avatar in ventriglisseAvatars"
              :key="avatar"
              :src="avatar"
              alt="Personnage Ventriglisse"
              class="game-avatar"
            />
          </div>
          <h3>Ventriglisse 3D</h3>
          <p>Course de luge en 3D avec vos amis</p>
        </div>
        <!-- Placeholder for future games -->
        <div class="game-card coming-soon">
          <div class="game-icon">🎯</div>
          <h3>Bientôt disponible</h3>
          <p>D'autres jeux arrivent...</p>
        </div>
      </div>
    </div>

    <!-- Ventriglisse 3D Game -->
    <div v-if="selectedGame === 'ventriglisse3d'" class="game-container">
      <div class="game-header">
        <button @click="backToMenu" class="back-btn">← Retour aux jeux</button>
      </div>
      <Ventriglisse3D />
    </div>
  </div>
</template>

<script>
import { ref } from 'vue'
import Ventriglisse3D from './Ventriglisse3D.vue'
import avatar01 from '@/assets/images/avatar/01.jpg'
import avatar02 from '@/assets/images/avatar/02.jpg'
import avatar03 from '@/assets/images/avatar/03.jpg'
import avatar04 from '@/assets/images/avatar/04.jpg'

export default {
  name: 'GameHub',
  components: {
    Ventriglisse3D
  },
  setup() {
    const selectedGame = ref(null)
    const ventriglisseAvatars = [avatar01, avatar02, avatar03, avatar04]

    const selectGame = (game) => {
      selectedGame.value = game
    }

    const backToMenu = () => {
      selectedGame.value = null
    }

    return {
      selectedGame,
      ventriglisseAvatars,
      selectGame,
      backToMenu
    }
  }
}
</script>

<style scoped>
.game-hub {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* Game Menu Styles */
.game-menu {
  padding: 2rem;
  text-align: center;
}

.game-title {
  color: white;
  font-size: 3rem;
  margin-bottom: 2rem;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.game-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 1.5rem;
  padding: 2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.game-card:hover {
  transform: translateY(-10px);
  background: rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.game-card.coming-soon {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-card.coming-soon:hover {
  transform: none;
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.game-avatars {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.game-avatar {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  border-radius: 999px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.game-card h3 {
  color: white;
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.game-card p {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1rem;
}

/* Game Container */
.game-container {
  padding: 1rem;
}

.game-header {
  margin-bottom: 1rem;
}

.back-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.3s ease;
  font-size: 1rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .game-title {
    font-size: 2rem;
  }

  .games-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .game-menu {
    padding: 1rem;
  }
}
</style>
