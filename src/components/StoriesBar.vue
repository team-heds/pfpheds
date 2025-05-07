<template>
  
  <div class="stories-bar">
    <!-- Bouton d'ajout de story -->
    <div class="story-item add-story" @click="showAddStory = true">
      <span class="add-icon">+</span>
      <p>Votre story</p>
    </div>
    <!-- Liste des stories -->
    <div
      v-for="story in stories"
      :key="story.id"
      class="story-item"
      @click="openStory(story)"
    >
      <img :src="story.userAvatar || defaultAvatar" alt="avatar" class="avatar" />
      <p>{{ getUserDisplayName(story.userName) }}</p>
    </div>
    <AddStory v-if="showAddStory" @close="showAddStory = false" @uploaded="fetchStories" />
    <StoryModal v-if="selectedStory" :story="selectedStory" @close="selectedStory = null" />
  </div>
</template>

<script>
import AddStory from './AddStory.vue';
import StoryModal from './StoryModal.vue';
import { db } from 'root/firebase';
import { ref as dbRef, onValue } from 'firebase/database';

export default {
  name: 'StoriesBar',
  components: { AddStory, StoryModal },
  data() {
    return {
      stories: [],
      showAddStory: false,
      selectedStory: null,
      defaultAvatar: 'https://ui-avatars.com/api/?name=User',
    };
  },
  mounted() {
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
         });
         return;
        }
        this.stories = stories;
      });
    },
    openStory(story) {
      this.selectedStory = story;
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
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  cursor: pointer;
  min-width: 70px;
}

.story-item.add-story {
  border-radius: 50%;
  width: 64px;
  height: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: #007bff;
  border: 2px dashed #007bff;
}

.add-icon {
  font-size: 2rem;
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #007bff;
  margin-bottom: 4px;
}

.story-item p {
  font-size: 0.8rem;
  margin: 0;
  text-align: center;
}

.stories-bar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 0;
  overflow-x: auto;
    border-bottom: 1px solid #eee;
}

.story-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  width: 64px;
}
.story-item .avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #2196f3;
}
.add-story {
  border: 2px dashed #2196f3;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
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
</style>
