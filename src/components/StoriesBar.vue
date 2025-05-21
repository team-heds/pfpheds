<template>
  
  <div class="stories-bar">
    <!-- Bouton d'ajout de story -->
    <div class="story-item add-story" @click="showAddStory = true">
      <span class="add-icon">+</span>
      <p>Votre story</p>
    </div>
    <!-- Liste des stories -->
    <div
      v-for="user in uniqueUsers"
      :key="user.userId"
      class="story-item"
      @click="openStory(user.stories)"
    >
      <img
        :src="user.userAvatar || defaultAvatar"
        alt="avatar"
        class="avatar"
        :class="{ 'unseen-story': user.hasUnseenStory }"
      />
      <p>{{ getUserDisplayName(user.userName) }}</p>
    </div>
    <AddStory v-if="showAddStory" @close="showAddStory = false" @uploaded="fetchStories" />
    <StoryModal v-if="selectedStory" :story="selectedStory" @close="selectedStory = null" @refreshStories="fetchStories" />
  </div>
</template>

<script>
import AddStory from './AddStory.vue';
import StoryModal from './StoryModal.vue';
import { db } from 'root/firebase';
import { ref as dbRef, onValue, update } from 'firebase/database';
import { getCurrentUser } from './Utils/authUser.js';

export default {
  name: 'StoriesBar',
  components: { AddStory, StoryModal },
  data() {
    return {
      stories: [], // toutes les stories non expirées
      uniqueUsers: [], // stories groupées par utilisateur
      showAddStory: false,
      selectedStory: null,
      defaultAvatar: 'https://ui-avatars.com/api/?name=User',
      currentUser: null,
    };
  },
  async mounted() {
    this.currentUser = await getCurrentUser();
    this.fetchStories();
  },
  methods: {
    getUserDisplayName(userName) {
      if (!userName) return '';
      if (userName.includes('@')) {
        return userName.split('@')[0];
      }
      return userName;
    },
    fetchStories() {
      // Récupère les stories non expirées depuis la RTDB
      const now = Date.now();
      const storiesRef = dbRef(db, 'stories');
      onValue(storiesRef, (snapshot) => {
        const data = snapshot.val();
        let stories = [];
        if (data) {
          const storyEntries = Object.entries(data)
            .map(([id, story]) => ({ id, ...story }))
            .filter(story => story.expiresAt > now)
            .sort((a, b) => b.expiresAt - a.expiresAt);
         // Pour chaque story, récupère la photo utilisateur depuis /Users/{userId}/PhotoURL
         const promises = storyEntries.map(async (story) => {
           if (story.userId) {
             try {
               const userRef = dbRef(db, `Users/${story.userId}/PhotoURL`);
               const snapshot = await new Promise(resolve => onValue(userRef, resolve, { onlyOnce: true }));
               const photoURL = snapshot.val();
               return { ...story, userAvatar: photoURL || story.userAvatar || this.defaultAvatar };
             } catch {
               return { ...story, userAvatar: story.userAvatar || this.defaultAvatar };
             }
           }
           return { ...story, userAvatar: story.userAvatar || this.defaultAvatar };
         });
         Promise.all(promises).then(storiesWithAvatars => {
            this.stories = storiesWithAvatars;
            // Grouper les stories par utilisateur
            const userMap = {};
            storiesWithAvatars.forEach(story => {
              if (!userMap[story.userId]) {
                userMap[story.userId] = [];
              }
              userMap[story.userId].push(story);
            });
            this.uniqueUsers = Object.values(userMap).map(stories => {
              // Trier les stories de l'utilisateur par date
              stories.sort((a, b) => b.timestamp - a.timestamp);
              // Vérifier si l'utilisateur courant a vu toutes les stories de cet utilisateur
              const hasUnseenStory = this.currentUser
                ? stories.some(story => !(story.viewers || []).includes(this.currentUser.uid))
                : false;
              // Utiliser la plus récente pour l'avatar/nom
              return {
                userId: stories[0].userId,
                userName: stories[0].userName,
                userAvatar: stories[0].userAvatar,
                stories: stories,
                hasUnseenStory
              };
            });
          });
         return;
        }
        this.stories = stories;
      });
    },
    async openStory(stories) {
      // stories = tableau de stories de l'utilisateur
      this.selectedStory = stories;
      // Marquer toutes les stories comme vues pour l'utilisateur courant
      if (this.currentUser) {
        for (const story of stories) {
          if (!(story.viewers || []).includes(this.currentUser.uid)) {
            const storyRef = dbRef(db, `stories/${story.id}/viewers`);
            // Ajoute l'uid dans viewers (évite les doublons)
            const newViewers = [...(story.viewers || []), this.currentUser.uid];
            await update(dbRef(db, `stories/${story.id}`), { viewers: newViewers });
          }
        }
        // Refresh stories to update seen status
        setTimeout(() => this.fetchStories(), 500);
      }
    }
  }
};
</script>

<style scoped>
.stories-bar {
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 2px solid #e0e0e0;
  padding: 12px 0;
  gap: 16px;
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 90px;
  overflow-x: auto;
}
.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 8px;
  cursor: pointer;
  background: rgba(255,255,255,0.85);
  border-radius: 14px;
  box-shadow: 0 2px 12px 0 rgba(33,150,243,0.09), 0 1.5px 6px 0 rgba(0,0,0,0.07);
  padding: 10px 7px 10px 7px;
  transition: box-shadow 0.22s, background 0.22s, transform 0.18s;
  border: 1.5px solid var(--surface-border, #e0e0e0);
  backdrop-filter: blur(7px) saturate(1.15);
  -webkit-backdrop-filter: blur(7px) saturate(1.15);
  position: relative;
  outline: none;
}

.story-item:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-color, #2196f3), 0 2px 12px 0 rgba(33,150,243,0.09);
}

.story-item:hover {
  box-shadow: 0 8px 28px 0 rgba(33,150,243,0.18), 0 1.5px 6px 0 rgba(0,0,0,0.10);
  background: rgba(255,255,255,0.97);
  transform: translateY(-2px) scale(1.03);
}

.story-item:active::after {
  content: '';
  position: absolute;
  left: 50%; top: 50%;
  transform: translate(-50%,-50%) scale(1.5);
  width: 80%; height: 80%;
  border-radius: 50%;
  background: rgba(33,150,243,0.11);
  animation: ripple-story 0.4s linear;
  pointer-events: none;
  z-index: 1;
}

@keyframes ripple-story {
  0% { opacity: 1; transform: translate(-50%,-50%) scale(0.8); }
  100% { opacity: 0; transform: translate(-50%,-50%) scale(1.6); }
}

.story-item .avatar {
  width: 54px;
  height: 54px;
  border-radius: 50%;
  margin-bottom: 5px;
  object-fit: cover;
  border: 3px solid var(--primary-color, #2196f3);
  box-shadow: 0 0 0 0 rgba(33,150,243,0);
  transition: box-shadow 0.22s, border 0.22s;
  background: linear-gradient(135deg, #e3f2fd 0%, #fff 100%);
  position: relative;
}

.story-item .avatar.active, .story-item .avatar.unseen {
  border: 3px solid;
  border-image: linear-gradient(120deg, #2196f3 60%, #ffb300 100%) 1;
  box-shadow: 0 0 0 3px #fff, 0 0 12px 2px #2196f3;
}

.story-item .avatar:hover {
  box-shadow: 0 0 0 4px var(--primary-color, #2196f3), 0 0 12px 3px #2196f3;
}

.story-item p {
  margin: 0;
  margin-top: 3px;
  font-size: 1.07rem;
  color: var(--primary-color, #1976d2);
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.01em;
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  text-shadow: 0 1px 2px rgba(33,150,243,0.07);
}

.add-story {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 54px;
  height: 54px;
  border-radius: 50%;
  background: var(--primary-color, #2196f3);
  box-shadow: 0 4px 16px 0 rgba(33,150,243,0.11);
  color: #fff;
  font-size: 2rem;
  border: none;
  outline: none;
  cursor: pointer;
  margin-bottom: 5px;
  position: relative;
  transition: box-shadow 0.2s, background 0.2s;
  aria-label: "Ajouter une histoire";
}

.add-story:hover {
  background: var(--primary-color, #42a5f5);
  box-shadow: 0 8px 28px 0 rgba(33,150,243,0.18);
}

.add-story:focus-visible {
  box-shadow: 0 0 0 3px var(--primary-color, #2196f3), 0 4px 16px 0 rgba(33,150,243,0.11);
}

.add-story .plus-icon {
  font-size: 2.1rem;
  font-weight: bold;
  text-shadow: 0 2px 8px rgba(33,150,243,0.13);
  color: #fff;
}

.add-icon {
  font-size: 2rem;
  color: #2196f3;
}

.story-item p {
  font-size: 0.8rem;
  margin: 4px 0 0 0;
  text-align: center;
  word-break: break-word;
}

@media (max-width: 768px) {
  .add-story {
    width: 40px;
    height: 40px;
    font-size: 1.5rem;
  }
}
</style>
