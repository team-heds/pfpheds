<template>
  <div class="story-modal" @click.self="$emit('close')">
    <div class="story-content" :class="{ 'mobile-view': isMobileView }">
      <div class="story-header">
        <div class="progress-container" v-if="isMultiple">
          <div 
            v-for="(_, idx) in story" 
            :key="idx" 
            class="progress-item"
          >
            <div 
              class="progress-bar" 
              :class="{ 'active': idx === currentIndex, 'completed': idx < currentIndex }"
              :style="idx === currentIndex ? { width: `${progress}%` } : {}"
            ></div>
          </div>
        </div>
      </div>
      
      <div class="story-image-container">
        <img :src="currentStory.imageUrl || currentStory.media || currentStory.url || currentStory.src" alt="story" class="story-image" />
        
        <div class="story-user-info">
          <div class="user-avatar-name">
            <Avatar :image="currentStory.userAvatar || defaultAvatar" :size="isMobileView ? 'small' : 'normal'" shape="circle" />
            <div class="user-details">
              <span class="user-name">{{ currentStory.userName }}</span>
              <br>
              <span class="time-ago">{{ formattedTime }}</span>
            </div>
          </div>
          <Button 
            icon="pi pi-times" 
            :class="['p-button-rounded', 'p-button-text', isMobileView ? 'p-button-sm' : '', 'close-btn']" 
            @click="$emit('close')"
          />
        </div>
        
        <!-- Éléments interactifs (textes, emojis) -->
        <div v-if="currentStory.elements" class="story-elements">
          <div 
            v-for="(el, idx) in currentStory.elements" 
            :key="'el-'+idx"
            class="story-element"
            :style="{
              top: `${el.y}px`,
              left: `${el.x}px`,
              color: el.color || '#ffffff',
              fontSize: el.size ? `${el.size}px` : '24px'
            }"
          >
            {{ el.value }}
          </div>
        </div>
        
        <!-- Modules interactifs -->
        <div v-if="currentStory.elements && currentStory.elements.length" class="story-interactive-modules">
          <div class="story-interactive-btns">
            <Button
              v-for="(el, idx) in currentStory.elements.filter(e => ['quiz', 'poll', 'audio', 'carousel'].includes(e.type))"
              :key="'btn-'+idx"
              :label="getModuleLabel(el.type)"
              :icon="getModuleIcon(el.type)"
              class="p-button-rounded p-button-outlined module-btn"
              @click="openModule(idx)"
            />
          </div>
        </div>
      </div>
      
      <!-- Navigation -->
      <div v-if="isMultiple" class="story-navigation">
        <Button 
          icon="pi pi-chevron-left" 
          class="p-button-rounded p-button-text nav-btn prev-btn" 
          @click="prevStory" 
          :disabled="currentIndex === 0"
        />
        <Button 
          icon="pi pi-chevron-right" 
          class="p-button-rounded p-button-text nav-btn next-btn" 
          @click="nextStory" 
          :disabled="currentIndex === story.length - 1"
        />
      </div>
      
      <!-- Répondre -->
      <div v-if="!isCreator" class="story-reply">
        <InputText 
          v-model="replyMessage" 
          class="reply-input p-inputtext-sm" 
          type="text" 
          maxlength="300" 
          :placeholder="'Répondre à ' + currentStory.userName + '...'" 
          @keyup.enter="sendReply"
        />
        <Button 
          icon="pi pi-send" 
          class="p-button-rounded reply-btn" 
          :disabled="!replyMessage.trim()" 
          @click="sendReply"
        />
      </div>
      
      <div v-if="replySent" class="reply-confirm">
        <Message severity="success" text="Message envoyé !" />
      </div>
      

    </div>
    
    <!-- Overlay pour modules interactifs -->
    <Dialog 
      v-if="showModuleOverlay" 
      v-model:visible="showModuleOverlay" 
      :header="getModuleTitle(activeModule?.type)" 
      :style="{width: '90%', maxWidth: '500px'}" 
      :modal="true" 
      :closable="true"
      @hide="closeModule"
    >
      <StoryQuiz 
        v-if="activeModule && activeModule.type === 'quiz'" 
        :question="activeModule.question" 
        :options="activeModule.options" 
        :answerIdx="activeModule.answerIdx" 
      />
      <StoryStickerPoll 
        v-else-if="activeModule && activeModule.type === 'poll'" 
        :question="activeModule.question" 
        :options="activeModule.options" 
      />
      <StoryAudio 
        v-else-if="activeModule && activeModule.type === 'audio'" 
        :src="activeModule.src" 
        :caption="activeModule.caption" 
      />
      <StoryCarousel 
        v-else-if="activeModule && activeModule.type === 'carousel'" 
        :media="activeModule.media" 
      />
    </Dialog>
    
    <!-- Statistiques -->
    <Dialog 
      v-model:visible="showStats" 
      header="Statistiques de la story" 
      :style="{width: '90%', maxWidth: '600px'}" 
      :modal="true" 
      :closable="true"
      @hide="showStats = false"
    >
      <StoryStats
        :viewsCount="(currentStory.viewers || []).length"
        :reactionRate="reactionRate"
        :viewersInfo="viewersInfo"
        :reactionsInfo="reactionsInfo"
        :sortedViewers="sortedViewers"
        :sortedReactions="sortedReactions"
        :defaultAvatar="defaultAvatar"
      />
    </Dialog>
  </div>
</template>

<script>
import StoryStats from "./StoryStats.vue";
import StoryQuiz from './StoryQuiz.vue';
import StoryStickerPoll from './StoryStickerPoll.vue';
import StoryAudio from './StoryAudio.vue';
import StoryCarousel from './StoryCarousel.vue';
import { db } from '../../../../firebase';
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
      showModuleOverlay: false,
      activeModule: null,
      isMobileView: false,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight
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
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.round(diffMs / 60000);
      
      if (diffMins < 1) return 'à l\'instant';
      if (diffMins < 60) return `${diffMins}m ago`;
      
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString();
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
    getModuleLabel(type) {
      switch(type) {
        case 'quiz': return 'Quiz';
        case 'poll': return 'Sondage';
        case 'audio': return 'Audio';
        case 'carousel': return 'Photos';
        default: return type;
      }
    },
    getModuleIcon(type) {
      switch(type) {
        case 'quiz': return 'pi pi-question-circle';
        case 'poll': return 'pi pi-chart-bar';
        case 'audio': return 'pi pi-volume-up';
        case 'carousel': return 'pi pi-images';
        default: return 'pi pi-star';
      }
    },
    getModuleTitle(type) {
      switch(type) {
        case 'quiz': return 'Quiz';
        case 'poll': return 'Sondage';
        case 'audio': return 'Écouter l\'audio';
        case 'carousel': return 'Galerie de médias';
        default: return 'Contenu interactif';
      }
    },
    openModule(idx) {
      this.activeModule = this.currentStory.elements.filter(e => ['quiz', 'poll', 'audio', 'carousel'].includes(e.type))[idx];
      this.showModuleOverlay = true;
    },
    closeModule() {
      this.showModuleOverlay = false;
      this.activeModule = null;
    },
    async sendReply() {
      if (!this.replyMessage.trim()) return;
      try {
        const sender = this.currentUser;
        const recipientId = this.currentStory.userId;
        if (!sender || !recipientId || sender.uid === recipientId) return;
        // Génère l'ID unique de conversation (même logique que ChatBox)
        const generateConversationId = (uid1, uid2) => {
          return [uid1, uid2].sort().join('-');
        };
        const conversationId = generateConversationId(sender.uid, recipientId);
        
        // Référence à la conversation
        const conversationRef = dbRef(db, `conversations/${conversationId}`);
        const conversationSnap = await get(conversationRef);
        
        // Si la conversation n'existe pas, l'initialiser
        if (!conversationSnap.exists()) {
          await update(conversationRef, {
            participants: {
              [sender.uid]: true,
              [recipientId]: true
            },
            lastUpdated: Date.now()
          });
        }
        
        // Ajouter le message
        const messagesRef = dbRef(db, `conversations/${conversationId}/messages`);
        await push(messagesRef, {
          senderId: sender.uid,
          senderName: sender.displayName || 'Utilisateur',
          senderPhoto: sender.photoURL || this.defaultAvatar,
          text: this.replyMessage,
          timestamp: Date.now(),
          storyReply: {
            storyId: this.currentStory.id,
            storyImage: this.currentStory.imageUrl
          }
        });
        
        // Mettre à jour le timestamp de dernière mise à jour
        await update(conversationRef, {
          lastUpdated: Date.now()
        });
        
        this.replyMessage = '';
        this.replySent = true;
        setTimeout(() => {
          this.replySent = false;
        }, 3000);
      } catch (error) {
        console.error("Erreur lors de l'envoi du message:", error);
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
      clearTimeout(this.timer);
      this.progress = 0;
      
      // Si c'est une story multiple, démarrer le timer pour avancer automatiquement
      if (this.isMultiple) {
        this.timer = setInterval(this.incrementProgress, 50);
      }
    },
    incrementProgress() {
      this.progress += (100 / (this.autoAdvanceDelay / 50));
      
      if (this.progress >= 100) {
        clearInterval(this.timer);
        
        // Passer à la story suivante ou fermer si c'est la dernière
        if (this.currentIndex < this.story.length - 1) {
          this.nextStory();
        } else {
          this.$emit('close');
        }
      }
    },
    async reactToStory(emoji) {
      if (!this.currentUser) return;
      
      const storyId = this.currentStory.id;
      const userId = this.currentUser.uid;
      
      try {
        const storyRef = dbRef(db, `stories/${storyId}/reactions/${userId}`);
        await update(storyRef, this.userReaction === emoji ? null : emoji);
      } catch (error) {
        console.error("Erreur lors de la réaction:", error);
      }
    },
    async fetchStatsUsers() {
      if (!this.isCreator) return;
      
      try {
        // Récupérer les infos des viewers
        const viewersIds = this.currentStory.viewers || [];
        const viewersPromises = viewersIds.map(async (viewerId) => {
          const userRef = dbRef(db, `users/${viewerId}`);
          const userSnap = await get(userRef);
          return userSnap.exists() ? { id: viewerId, ...userSnap.val() } : { id: viewerId, displayName: 'Utilisateur inconnu' };
        });
        this.viewersInfo = await Promise.all(viewersPromises);
        
        // Récupérer les infos des réactions
        const reactions = this.currentStory.reactions || {};
        const reactionsPromises = Object.entries(reactions).map(async ([userId, emoji]) => {
          const userRef = dbRef(db, `users/${userId}`);
          const userSnap = await get(userRef);
          return {
            id: userId,
            emoji,
            ...(userSnap.exists() ? userSnap.val() : { displayName: 'Utilisateur inconnu' })
          };
        });
        this.reactionsInfo = await Promise.all(reactionsPromises);
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
      }
    },
    handleResize() {
      this.windowWidth = window.innerWidth;
      this.windowHeight = window.innerHeight;
      this.isMobileView = this.windowWidth <= 768;
    },
  },
  async mounted() {
    this.currentUser = await getCurrentUser();
    this.resetTimer();
    
    // Ajouter l'utilisateur à la liste des viewers s'il n'est pas le créateur
    if (this.currentUser && !this.isCreator) {
      const storyId = this.currentStory.id;
      const viewerRef = dbRef(db, `stories/${storyId}/viewers/${this.currentUser.uid}`);
      await update(viewerRef, true);
    }
    
    // Détecter si on est sur mobile
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    clearTimeout(this.timer);
    window.removeEventListener('resize', this.handleResize);
  }
};
</script>

<style scoped>
.story-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.story-content {
  position: relative;
  width: 100%;
  max-width: 420px;
  height: 90vh;
  max-height: 800px;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  overflow: hidden;
  background-color: #000;
  transition: all 0.3s ease;
}

.story-content.mobile-view {
  width: 100%;
  height: 100vh;
  max-height: none;
  border-radius: 0;
  margin: 0;
}

.story-header {
  padding: 8px;
  z-index: 10;
}

.progress-container {
  display: flex;
  gap: 4px;
  width: 100%;
  padding: 0 4px;
}

.progress-item {
  flex: 1;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.3);
  overflow: hidden;
  border-radius: 1.2rem !important;
}

.progress-bar {
  height: 4px;
  border-radius: 3px;
  transition: width 0.3s linear;
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
}

.progress-bar.active {
  transition: width 0.05s linear;
}

.progress-bar.completed {
  width: 100%;
  border-radius: 1.2rem !important;
}

.story-image-container {
  position: relative;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1.2rem !important;
}

.mobile-view .story-image-container {
  width: 100%;
}

.story-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 1.2rem !important;
}

.mobile-view .story-image {
  object-position: center;
  border-radius: 1.2rem !important;
}

.story-user-info {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 100%);
  z-index: 5;
}

.mobile-view .story-user-info {
  padding: 10px;
}

.user-avatar-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mobile-view .user-avatar-name {
  gap: 8px;
}

.user-name {
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.mobile-view .user-name {
  font-size: 13px;
}

.time-ago {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

.mobile-view .time-ago {
  font-size: 11px;
}

.story-interactive-modules {
  position: absolute;
  bottom: 80px;
  left: 0;
  width: 100%;
  padding: 0 16px;
  z-index: 5;
}

.mobile-view .story-interactive-modules {
  bottom: 70px;
  padding: 0 12px;
}

.story-interactive-btns {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.mobile-view .story-interactive-btns {
  gap: 6px;
}

.module-btn {
  background-color: rgba(255, 255, 255, 0.2) !important;
  border: 1px solid rgba(255, 255, 255, 0.4) !important;
  color: #fff !important;
}

.mobile-view .module-btn {
  padding: 0.4rem 0.6rem !important;
  font-size: 12px !important;
}

.mobile-view .module-btn .p-button-icon {
  font-size: 12px !important;
}

.story-navigation {
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  transform: translateY(-50%);
  display: flex;
  justify-content: space-between;
  padding: 0 8px;
  pointer-events: none;
  z-index: 5;
}

.mobile-view .story-navigation {
  padding: 0 4px;
}

.nav-btn {
  pointer-events: auto;
  color: #fff !important;
  background-color: rgba(0, 0, 0, 0.3) !important;
}

.mobile-view .nav-btn {
  width: 2.5rem !important;
  height: 2.5rem !important;
}

.story-reactions {
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  padding: 0 16px;
  z-index: 5;
}

.mobile-view .story-reactions {
  bottom: 12px;
  padding: 0 12px;
}

.emoji-list {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 4px 0;
}

.mobile-view .emoji-list {
  gap: 6px;
}

.emoji-btn {
  background-color: rgba(255, 255, 255, 0.2) !important;
  color: #fff !important;
  font-size: 16px;
  position: relative;
}

.mobile-view .emoji-btn {
  width: 2.2rem !important;
  height: 2.2rem !important;
  font-size: 14px;
}

.story-reply {
  position: absolute;
  bottom: 16px;
  left: 0;
  width: 100%;
  padding: 0 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  z-index: 5;
}

.mobile-view .story-reply {
  bottom: 12px;
  padding: 0 12px;
  gap: 6px;
}

.reply-input {
  flex: 1;
  background-color: var(--surface-card);
  color: #fff !important;
  border-radius: 1.2rem !important;
}

.mobile-view .reply-input {
  height: 36px !important;
  font-size: 12px !important;
}

.reply-btn {
  background-color: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%)!important;
  color: #fff !important;
  border-radius: 1.2rem !important;
}

.mobile-view .reply-btn {
  width: 36px !important;
  height: 36px !important;
}

.mobile-view .reply-btn .p-button-icon {
  font-size: 12px !important;
}

.reply-confirm {
  position: absolute;
  bottom: 70px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 6;
}

.mobile-view .reply-confirm {
  bottom: 60px;
}

.story-stats-button {
  position: absolute;
  bottom: 16px;
  right: 16px;
  z-index: 5;
}

.mobile-view .story-stats-button {
  bottom: 12px;
  right: 12px;
}

.mobile-view .story-stats-button .p-button {
  font-size: 12px !important;
  padding: 0.4rem 0.6rem !important;
}

/* Styles pour les appareils très petits */
@media (max-width: 360px) {
  .progress-item {
    height: 2px;
  }
  
  .story-user-info {
    padding: 8px;
  }
  
  .user-avatar-name {
    gap: 4px;
  }
  
  .user-name {
    font-size: 11px;
  }
  
  .time-ago {
    font-size: 9px;
  }
  
  .module-btn {
    padding: 0.3rem 0.5rem !important;
    font-size: 10px !important;
  }
  
  .module-btn .p-button-icon {
    font-size: 10px !important;
  }
  
  .emoji-btn {
    width: 2rem !important;
    height: 2rem !important;
    font-size: 12px;
  }
  
  .story-interactive-modules {
    bottom: 60px;
  }
  
  .story-reactions, .story-reply {
    bottom: 8px;
  }
  
  .reply-input {
    height: 32px !important;
    font-size: 11px !important;
  }
  
  .reply-btn {
    width: 32px !important;
    height: 32px !important;
  }
}

/* Styles pour orientation paysage sur mobile */
@media (max-height: 480px) and (orientation: landscape) {
  .story-content {
    height: 100vh;
    max-width: 70vh;
    flex-direction: row;
  }
  
  .story-image-container {
    width: 70%;
  }
  
  .story-header {
    position: absolute;
    top: 0;
    left: 0;
    width: 70%;
    z-index: 10;
  }
  
  .story-interactive-modules {
    position: absolute;
    right: 0;
    width: 30%;
    bottom: auto;
    top: 50%;
    transform: translateY(-50%);
    padding: 0 8px;
  }
  
  .story-interactive-btns {
    flex-direction: column;
  }
  
  .story-reactions {
    width: 30%;
    left: auto;
    right: 0;
    bottom: 50px;
  }
  
  .emoji-list {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .story-reply {
    width: 30%;
    left: auto;
    right: 0;
    bottom: 10px;
  }
  
  .story-navigation {
    width: 70%;
  }
  
  .reply-confirm {
    width: 30%;
    left: auto;
    right: 0;
    bottom: 90px;
  }
}

/* Styles pour les appareils à écran large */
@media (min-width: 1200px) {
  .story-content {
    max-width: 480px;
    max-height: 850px;
  }
}

/* Styles pour assurer la compatibilité avec les appareils iOS */
@supports (-webkit-touch-callout: none) {
  .story-content {
    height: -webkit-fill-available;
  }
  
  .story-image {
    height: -webkit-fill-available;
  }
}
</style>
