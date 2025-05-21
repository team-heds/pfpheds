<template>
  <div class="story-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">&times;</button>
      <div class="progress-bar" v-if="isMultiple">
        <div class="progress" :style="{ width: progress + '%' }"></div>
      </div>
      <img :src="currentStory.imageUrl" alt="story" class="story-image" />

      <!-- Modules interactifs Story - version boutons + overlay -->
      <div v-if="currentStory.elements && currentStory.elements.length" class="story-interactive-modules mt-3">
        <div class="story-interactive-btns">
          <button
            v-for="(el, idx) in currentStory.elements"
            :key="'btn-'+idx"
            class="module-btn"
            @click="openModule(idx)"
          >
            <span v-if="el.type==='quiz'">Quiz</span>
            <span v-else-if="el.type==='poll'">Sondage</span>
            <span v-else-if="el.type==='audio'">Audio</span>
            <span v-else-if="el.type==='carousel'">Carrousel</span>
          </button>
        </div>
        <!-- Overlay interactif -->
        <div v-if="showModuleOverlay" class="module-overlay" @click.self="closeModule">
          <div class="module-overlay-content">
            <button class="close-overlay" @click="closeModule">&times;</button>
            <StoryQuiz v-if="activeModule && activeModule.type === 'quiz'" :question="activeModule.question" :options="activeModule.options" :answerIdx="activeModule.answerIdx" />
            <StoryStickerPoll v-else-if="activeModule && activeModule.type === 'poll'" :question="activeModule.question" :options="activeModule.options" />
            <StoryAudio v-else-if="activeModule && activeModule.type === 'audio'" :src="activeModule.src" :caption="activeModule.caption" />
            <StoryCarousel v-else-if="activeModule && activeModule.type === 'carousel'" :media="activeModule.media" />
          </div>
        </div>
      </div>
      <div class="user-info">
        <img :src="currentStory.userAvatar || defaultAvatar" class="avatar"/>
        <span>{{ currentStory.userName }}</span>
      </div>
      <div class="timestamp">
        {{ formattedTime }}
      </div>
      <div v-if="isMultiple" class="story-nav">
        <button @click="prevStory" :disabled="currentIndex === 0">&lt;</button>
        <span>{{ currentIndex + 1 }}/{{ story.length }}</span>
        <button @click="nextStory" :disabled="currentIndex === story.length - 1">&gt;</button>
      </div>
      <div class="reactions">
        <div class="emoji-list">
          <span
            v-for="emoji in emojis"
            :key="emoji"
            class="emoji-btn"
            :class="{ selected: userReaction === emoji }"
            @click="reactToStory(emoji)"
          >
            {{ emoji }}
            <span v-if="reactionCounts[emoji]">{{ reactionCounts[emoji] }}</span>
          </span>
        </div>
      </div>
      <button v-if="isCreator" class="stat-btn" @click="showStats = true">Statistiques</button>
      <StoryStats
        v-if="showStats && isCreator"
        :viewsCount="(currentStory.viewers || []).length"
        :reactionRate="reactionRate"
        :viewersInfo="viewersInfo"
        :reactionsInfo="reactionsInfo"
        :sortedViewers="sortedViewers"
        :sortedReactions="sortedReactions"
        :defaultAvatar="defaultAvatar"
        @close="showStats = false"
      />
      <div v-if="!isCreator" class="story-reply-bar">
        <input
          v-model="replyMessage"
          class="reply-input"
          type="text"
          maxlength="300"
          :placeholder="'Répondre à ' + currentStory.userName + '…'"
          @keyup.enter="sendReply"
        />
        <button class="reply-btn" :disabled="!replyMessage.trim()" @click="sendReply">Envoyer</button>
      </div>
      <div v-if="replySent" class="reply-confirm">Message envoyé !</div>
    </div>
  </div>
</template>

<script>
import StoryStats from "./StoryStats.vue";
import StoryQuiz from './StoryQuiz.vue';
import StoryStickerPoll from './StoryStickerPoll.vue';
import StoryAudio from './StoryAudio.vue';
import StoryCarousel from './StoryCarousel.vue';
import { db } from 'root/firebase';
import { ref as dbRef, push, update, get } from 'firebase/database';
import { getCurrentUser } from './Utils/authUser.js';
export default {
  components: {
    StoryStats,
    StoryQuiz,
    StoryStickerPoll,
    StoryAudio,
    StoryCarousel
  },
  data() {
    return {
      showModuleOverlay: false,
      activeModule: null,
      ...this.$options.__proto__.data ? this.$options.__proto__.data() : {}, // conserve data existant si présent
    };
  },
  methods: {
    ...((typeof Object.getPrototypeOf({}).methods === 'object') ? Object.getPrototypeOf({}).methods : {}),
    openModule(idx) {
      this.activeModule = this.currentStory.elements[idx];
      this.showModuleOverlay = true;
    },
    closeModule() {
      this.showModuleOverlay = false;
      this.activeModule = null;
    },
  }, 
  name: 'StoryModal',
  props: {
    story: { type: [Object, Array], required: true }
  },
  data() {
    return {
      defaultAvatar: 'https://ui-avatars.com/api/?name=User',
      currentIndex: 0,
      timer: null,
      progress: 0,
      autoAdvanceDelay: 5000,
      emojis: ['👍', '😂', '😍', '🔥', '😮', '😢'],
      currentUser: null,
      viewersInfo: [],
      reactionsInfo: [],
      showStats: false,
    replyMessage: '',
    replySent: false,
    };
  },
  computed: {
    isCreator() {
      return this.currentUser && this.currentUser.uid === this.currentStory.userId;
    },
    reactionRate() {
      const nbVues = (this.currentStory.viewers || []).length;
      const nbReactions = Object.keys(this.currentStory.reactions || {}).length;
      if (!nbVues) return 0;
      return Math.round((nbReactions / nbVues) * 100);
    },
    sortedViewers() {
      return [...this.viewersInfo].sort((a, b) => (a.displayName || '').localeCompare(b.displayName || ''));
    },
    sortedReactions() {
      // Trie par emoji puis par nom
      return [...this.reactionsInfo].sort((a, b) => {
        if (a.emoji !== b.emoji) return a.emoji.localeCompare(b.emoji);
        return (a.displayName || '').localeCompare(b.displayName || '');
      });
    },
    isMultiple() {
      return Array.isArray(this.story);
    },
    currentStory() {
      return this.isMultiple ? this.story[this.currentIndex] : this.story;
    },
    formattedTime() {
      const date = new Date(this.currentStory.timestamp);
      return date.toLocaleString();
    },
    reactionCounts() {
      const reactions = (this.currentStory.reactions || {});
      const counts = {};
      Object.values(reactions).forEach(val => {
        if (!counts[val]) counts[val] = 0;
        counts[val]++;
      });
      return counts;
    },
    userReaction() {
      if (!this.currentUser) return null;
      const reactions = (this.currentStory.reactions || {});
      return reactions[this.currentUser.uid] || null;
    }
  },
  methods: {
    async sendReply() {
      if (!this.replyMessage.trim()) return;
      try {
        const sender = this.currentUser;
        const recipientId = this.currentStory.userId;
        if (!sender || !recipientId || sender.uid === recipientId) return;
        // Génère l’ID unique de conversation (même logique que ChatBox)
        const generateConversationId = (uid1, uid2) => {
          return [uid1, uid2].sort().join('-');
        };
        const conversationId = generateConversationId(sender.uid, recipientId);
        // Message enrichi pour le chat
        const message = {
          text: this.replyMessage,
          ownerId: sender.uid,
          createdAt: Date.now(),
          type: 'story_reply',
          storyId: this.currentStory.id || null,
          storyImage: this.currentStory.imageUrl || null,
          storyUser: this.currentStory.userName || null,
        };
        console.log("yaaa");
        // Envoi dans /conversations/{conversationId}/messages
        const messagesRef = dbRef(db, `/conversations/${conversationId}/messages`);
        await push(messagesRef, message);
        await update(dbRef(db, `/conversations/${conversationId}`), { lastReceivedMessageAt: message.createdAt });
        this.replySent = true;
        this.replyMessage = '';
        setTimeout(() => (this.replySent = false), 2000);
      } catch (e) {
        alert('Erreur lors de l’envoi du message');
      }
    },
    nextStory() {
      if (this.currentIndex < this.story.length - 1) {
        this.currentIndex++;
        this.resetTimer();
      }
    },
    prevStory() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
        this.resetTimer();
      }
    },
    resetTimer() {
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.progress = 0;
      this.timer = setTimeout(() => {
        this.nextStory();
      }, this.autoAdvanceDelay);
      this.incrementProgress();
    },
    incrementProgress() {
      const interval = this.autoAdvanceDelay / 100;
      const increment = 1;
      const intervalId = setInterval(() => {
        if (this.progress < 100) {
          this.progress += increment;
        } else {
          clearInterval(intervalId);
        }
      }, interval);
    },
    async reactToStory(emoji) {
      if (!this.currentUser) return;
      const storyId = this.currentStory.id;
      // Copie l'objet reactions courant, modifie la réaction de l'utilisateur
      const reactions = { ...(this.currentStory.reactions || {}) };
      reactions[this.currentUser.uid] = emoji;
      await update(dbRef(db, `stories/${storyId}`), { reactions });
      // Rafraîchit la story (parent doit écouter 'refreshStories' et relancer fetchStories)
      this.$emit('refreshStories');
    },
    async fetchStatsUsers() {
      const viewers = this.currentStory.viewers || [];
      const reactions = this.currentStory.reactions || {};
      // Utilise la table /Users et récupère Nom, Prenom, PhotoURL
      const allUids = Array.from(new Set([...viewers, ...Object.keys(reactions)]));
      const userSnaps = await Promise.all(allUids.map(uid => get(dbRef(db, `Users/${uid}`))));
      const users = {};
      userSnaps.forEach((snap, idx) => {
        const uid = allUids[idx];
        const val = snap.exists() ? snap.val() : {};
        users[uid] = {
          uid,
          displayName: (val.Prenom || '') + (val.Nom ? ' ' + val.Nom : '') || val.displayName || val.name || '',
          photoURL: val.PhotoURL || val.photoURL || '',
        };
      });
      // viewersInfo : tableau dans l'ordre des viewers
      this.viewersInfo = viewers.map(uid => users[uid] || { uid, displayName: '', photoURL: '' });
      // reactionsInfo : tableau {uid, displayName, photoURL, emoji}
      this.reactionsInfo = Object.entries(reactions).map(([uid, emoji]) => {
        const user = users[uid] || { uid, displayName: '', photoURL: '' };
        return { ...user, emoji };
      });
    },
  },
  async mounted() {
    this.currentUser = await getCurrentUser();
    this.fetchStatsUsers();
    if (this.isMultiple) {
      this.resetTimer();
    }
  },
  beforeUnmount() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
};
</script>

<style scoped>
.story-nav button {
  background: var(--primary-color, #2196f3);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: background 0.2s;
}
.story-nav button:disabled {
  background: var(--surface-border, #bdbdbd);
  cursor: not-allowed;
}
</style>

<style scoped>
.story-modal {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}
.modal-content {
  background: var(--surface-card, #fff);
  border-radius: 8px;
  padding: 18px 16px 18px 16px;
  max-width: 90vw;
  max-height: 90vh;
  box-shadow: 0 2px 8px rgba(0,0,0,0.10);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 14px;
  background: none;
  border: none;
  color: var(--primary-color, #1976d2);
  font-size: 2rem;
  cursor: pointer;
  transition: color 0.2s;
}
.close-btn:hover {
  color: var(--primary-color-hover, #0d47a1);
}
.story-image {
  max-width: 70vw;
  max-height: 60vh;
  border-radius: 10px;
  margin-bottom: 12px;
  object-fit: contain;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
  border: 1px solid var(--surface-border, #b3c6e0);
  transition: box-shadow 0.2s;
}
.avatar:hover {
  box-shadow: 0 0 0 2px var(--primary-color, #2196f3);
}
.timestamp {
  color: var(--text-secondary-color, #888);
  font-size: 0.95rem;
  margin-bottom: 10px;
}
.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--surface-border, #eee);
  border-radius: 4px;
  margin-bottom: 12px;
  overflow: hidden;
}
.progress {
  height: 100%;
  background: var(--primary-color, #2196f3);
  transition: width 0.2s;
}
</style>
