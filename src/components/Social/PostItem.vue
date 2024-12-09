
// ---------------------------
<template>
  <div class="post-item">
    <!-- En-tête du post -->
    <div class="post-header">
      <img :src="authorAvatarUrl || defaultAvatar" alt="Avatar" class="avatar" />
      <div class="post-author">
        <router-link
          v-if="post.IdUser"
          :to="{ name: 'Profile', params: { id: post.IdUser } }"
        >
          <strong>{{ authorName }}</strong>
        </router-link>
        <h5 v-else>{{ authorName }}</h5>
        <div>
          <span class="post-date">{{ formatTimestamp(post.Timestamp) }}</span>
        </div>
      </div>
    </div>

    <!-- Contenu du post -->
    <div class="post-content p-3">
      <!-- Texte du post -->
      <div v-if="post.Content" class="post-text" v-html="post.Content"></div>

      <!-- Médias du post -->
      <div v-if="post.media && post.media.length > 0" class="post-media">
        <div class="media-container">
          <div
            v-for="(mediaUrl, index) in post.media"
            :key="index"
            class="media-item-wrapper"
          >
            <template v-if="isImage(mediaUrl)">
              <img :src="mediaUrl" alt="media" class="media-item" />
            </template>
            <template v-else-if="isVideo(mediaUrl)">
              <video
                ref="videos"
                :key="'video-' + index"
                :src="mediaUrl"
                class="media-item"
                controls
                muted
                playsinline
              ></video>
            </template>
            <template v-else-if="isPDF(mediaUrl)">
              <embed :src="mediaUrl" type="application/pdf" class="media-item pdf-embed" />
            </template>
            <template v-else>
              <a :href="mediaUrl" target="_blank" rel="noopener noreferrer" class="media-item media-link">
                Ouvrir le fichier
              </a>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- Boutons d'action -->
    <div class="post-actions p-3 flex align-items-center justify-content-between">
      <div class="action-button" @click="toggleLike">
        <i :class="isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'" class="action-icon"></i>
        <span>{{ likeCount }}</span>
      </div>
      <div class="action-button" @click="toggleReplyForm">
        <i class="pi pi-comment action-icon"></i>
        <span>{{ commentCount }}</span>
      </div>
      <div class="action-button" @click="sharePost">
        <i class="pi pi-share-alt action-icon"></i>
        <span>Partager</span>
      </div>
    </div>

    <!-- Liste des personnes ayant liké -->
    <div v-if="likedUsers.length > 0" class="liked-users p-3">
      <strong>Personnes qui ont aimé :</strong>
      <ul>
        <li v-for="(user, index) in likedUsers" :key="index">{{ user }}</li>
      </ul>
    </div>

    <!-- Formulaire de réponse -->
    <div v-if="showReplyForm" class="reply-form w-full p-3">
      <Textarea
        v-model="replyContent"
        placeholder="Écrire une réponse..."
        class="reply-textarea"
      />
      <div class="pt-3">
        <Button @click="submitReply" size="small">Envoyer</Button>
      </div>
    </div>

    <!-- Bouton pour afficher/masquer les commentaires sur mobile si des commentaires existent -->
    <div v-if="post.replies && Object.keys(post.replies).length > 0" class="comments-toggle p-3">
      <Button @click="toggleComments" size="small">
        {{ showComments ? 'Masquer les commentaires' : 'Afficher les commentaires' }}
      </Button>
    </div>

    <!-- Liste des commentaires (affichés seulement si showComments est true) -->
    <div v-if="showComments && post.replies" class="comments-section p-3">
      <h4>Commentaires :</h4>
      <div v-for="(reply, replyId) in post.replies" :key="replyId" class="comment-item">
        <div class="comment-author">
          <strong>{{ reply.Author }}</strong> - <span class="comment-date">{{ formatTimestamp(reply.Timestamp) }}</span>
        </div>
        <div class="comment-content">{{ reply.Content }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref as dbRef, onValue, push, serverTimestamp, update, get } from "firebase/database";
import { db } from "../../../firebase.js";
import Textarea from "primevue/textarea";
import Button from "primevue/button";

export default {
  name: "PostItem",
  // eslint-disable-next-line vue/no-reserved-component-names
  components: { Textarea, Button },
  props: {
    post: {
      type: Object,
      required: true,
    },
    currentUser: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showReplyForm: false,
      replyContent: "",
      defaultAvatar: new URL("@/assets/avatar/avatar1.jpg", import.meta.url).href,
      authorName: "",
      authorAvatarUrl: "",
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
      likedUsers: [],
      showComments: false // Par défaut les commentaires sont cachés, surtout utile sur mobile
    };
  },
  watch: {
    post: {
      handler() {
        this.fetchAuthorDetails();
        this.checkLikeStatus();
        this.loadCommentCount();
        this.loadLikedUsers();
      },
      immediate: true,
    },
  },
  mounted() {
    this.initVideoObserver();
  },
  methods: {
    fetchAuthorDetails() {
      if (!this.post.IdUser) return;
      const userRef = dbRef(db, `Users/${this.post.IdUser}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          this.authorName = userData.username || this.post.Author || "Utilisateur inconnu";
          this.authorAvatarUrl = userData.PhotoURL || this.defaultAvatar;
        } else {
          this.authorName = this.post.Author || "Utilisateur inconnu";
          this.authorAvatarUrl = this.defaultAvatar;
        }
      });
    },
    toggleReplyForm() {
      this.showReplyForm = !this.showReplyForm;
      if (!this.showReplyForm) {
        this.replyContent = "";
      }
    },
    submitReply() {
      if (!this.replyContent.trim()) {
        alert("Veuillez écrire quelque chose avant de répondre.");
        return;
      }

      const newReply = {
        IdUser: this.currentUser.uid,
        Author: this.currentUser.email.split("@")[0],
        Content: this.replyContent,
        Timestamp: serverTimestamp(),
      };

      const postRef = dbRef(db, `Posts/${this.post.id}/replies`);
      push(postRef, newReply);

      this.replyContent = "";
      this.showReplyForm = false;
    },
    formatTimestamp(timestamp) {
      if (!timestamp) return "";
      const date = new Date(timestamp);
      return `${date.toLocaleDateString()} à ${date.toLocaleTimeString()}`;
    },
    checkLikeStatus() {
      if (this.post.likes && this.currentUser) {
        this.isLiked = !!this.post.likes[this.currentUser.uid];
        this.likeCount = Object.keys(this.post.likes).length;
      } else {
        this.likeCount = 0;
      }
    },
    toggleLike() {
      if (!this.currentUser) return alert("Vous devez être connecté pour liker.");
      const postLikesRef = dbRef(db, `Posts/${this.post.id}/likes`);
      if (this.isLiked) {
        const updates = {};
        updates[this.currentUser.uid] = null;
        update(postLikesRef, updates);
      } else {
        const updates = {};
        updates[this.currentUser.uid] = true;
        update(postLikesRef, updates);
      }

      this.isLiked = !this.isLiked;
      this.likeCount += this.isLiked ? 1 : -1;
      this.loadLikedUsers();
    },
    loadCommentCount() {
      if (this.post.replies) {
        this.commentCount = Object.keys(this.post.replies).length;
      } else {
        this.commentCount = 0;
      }
    },
    sharePost() {
      const postUrl = `${window.location.origin}/posts/${this.post.id}`;
      navigator.clipboard.writeText(postUrl).then(() => {
        alert("Lien du post copié dans le presse-papiers !");
      });
    },
    async loadLikedUsers() {
      this.likedUsers = [];
      if (this.post.likes) {
        const likeUserIds = Object.keys(this.post.likes);
        for (const uid of likeUserIds) {
          const userRef = dbRef(db, `Users/${uid}`);
          const snapshot = await get(userRef);
          const userData = snapshot.val();
          if (userData) {
            this.likedUsers.push(userData.username || userData.email.split('@')[0] || "Utilisateur");
          } else {
            this.likedUsers.push("Utilisateur inconnu");
          }
        }
      }
    },
    isImage(url) {
      const extension = this.getExtension(url);
      return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
    },
    isVideo(url) {
      const extension = this.getExtension(url);
      return ['mp4', 'webm', 'ogg'].includes(extension);
    },
    isPDF(url) {
      const extension = this.getExtension(url);
      return extension === 'pdf';
    },
    getExtension(url) {
      return url.split('?')[0].split('.').pop().toLowerCase();
    },
    toggleComments() {
      this.showComments = !this.showComments;
    },
    initVideoObserver() {
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.5
      };

      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, options);

      this.$nextTick(() => {
        const videos = this.$refs.videos;
        if (videos) {
          if (Array.isArray(videos)) {
            videos.forEach(video => observer.observe(video));
          } else {
            observer.observe(videos);
          }
        }
      });
    }
  },
};
</script>

<style scoped>
.post-item {
  padding: 15px;
  margin-bottom: 10px;
  background-color: var(--surface-card);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.post-author {
  display: flex;
  flex-direction: column;
}

.post-content {
  display: flex;
  flex-direction: column;
  margin-top: 10px;
}

.post-media {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  margin-top: 20px;
}

.media-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.media-item {
  max-width: 80%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

.pdf-embed {
  width: 70vw;
  height: 80vh;
  border: none;
  margin: 0 auto;
}

.media-link {
  word-break: break-all;
  color: var(--primary-color);
  text-decoration: underline;
}

.post-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-top: 1px solid var(--surface-border);
}

.action-button {
  display: flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: var(--text-color);
  transition: color 0.3s;
}

.action-button:hover {
  color: var(--primary-color);
}

.action-icon {
  font-size: 20px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.liked-users {
  margin-top: 10px;
}

.liked-users ul {
  list-style-type: disc;
  margin: 5px 0 0 20px;
  padding: 0;
}

.comments-section {
  margin-top: 20px;
}

.comment-item {
  background: var(--surface-50);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 10px;
}

.comment-author {
  font-size: 0.9em;
  margin-bottom: 5px;
  color: var(--text-secondary-color);
}

.comment-content {
  font-size: 1em;
  color: var(--text-color);
}

/* Responsive mobile */
@media (max-width: 600px) {
  .post-item {
    padding: 10px;
  }

  .media-item {
    max-width: 100%;
  }

  .pdf-embed {
    width: 90vw;
    height: 60vh;
  }

  .avatar {
    width: 30px;
    height: 30px;
    margin-right: 8px;
  }

  /* Les boutons d'action en colonne sur mobile */
  .post-actions {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .action-button {
    font-size: 0.9em;
  }

  .comment-author {
    font-size: 0.8em;
  }

  .comment-content {
    font-size: 0.9em;
  }
}
</style>

