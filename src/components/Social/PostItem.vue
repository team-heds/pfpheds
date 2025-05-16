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
          <strong><p class="text-primary strong">{{ authorName }}</p></strong>
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
      <div v-if="post.Content" class="post-text">
        <div v-html="post.Content"></div>
        <!-- YouTube Embed -->
        <div v-for="(yt, i) in extractYouTubeLinks(post.Content)" :key="'yt-'+i" class="embed-responsive embed-responsive-16by9 mt-2">
          <iframe :src="getYouTubeEmbedUrl(yt)" frameborder="0" allowfullscreen style="width:100%;height:220px;"></iframe>
        </div>
        <!-- Spotify Embed -->
        <div v-for="(sp, i) in extractSpotifyLinks(post.Content)" :key="'sp-'+i" class="embed-responsive embed-responsive-16by9 mt-2">
          <iframe :src="getSpotifyEmbedUrl(sp)" frameborder="0" allow="encrypted-media" style="width:100%;min-height:120px;"></iframe>
        </div>
      </div>

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
                style="max-height:220px; width:100%; object-fit:cover;"
              ></video>
            </template>
            <template v-else-if="isPDF(mediaUrl)">
              <embed :src="mediaUrl" type="application/pdf" class="media-item pdf-embed" style="max-height:220px; width:100%; object-fit:cover;" />
            </template>
            <template v-else>
              <a :href="mediaUrl" target="_blank" rel="noopener noreferrer" class="media-item media-link">
                {{ mediaUrl }}
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

    <!-- Zone de commentaire compacte en bas du post -->
    <div class="comment-quick-bar">
      <input
        v-model="quickComment"
        class="quick-comment-input"
        type="text"
        placeholder="Ajouter un commentaire..."
        @keyup.enter="submitQuickComment"
        maxlength="200"
      />
      <button class="quick-comment-btn" :disabled="!quickComment.trim()" @click="submitQuickComment">
        <i class="pi pi-send"></i>
      </button>
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
      showComments: false, // Par défaut les commentaires sont cachés, surtout utile sur mobile
      quickComment: '',
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
    },
    // --- YouTube/Spotify embed helpers ---
    extractYouTubeLinks(content) {
      if (!content) return [];
      // Regex to match YouTube URLs
      const ytRegex = /(https?:\/\/(?:www\.|m\.)?(?:youtube\.com\/watch\?v=|youtu.be\/)([\w-]{11}))/g;
      const matches = [...content.matchAll(ytRegex)];
      return matches.map(m => m[1]);
    },
    getYouTubeEmbedUrl(url) {
      // Extract video id
      let id = '';
      const match = url.match(/(?:v=|be\/)([\w-]{11})/);
      if (match) id = match[1];
      return `https://www.youtube.com/embed/${id}`;
    },
    extractSpotifyLinks(content) {
      if (!content) return [];
      const links = [];
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(content, 'text/html');
        doc.querySelectorAll('a').forEach(a => {
          if (a.href && a.href.includes('spotify.com/')) links.push(a.href);
        });
      } catch (e) {
        // fallback: regex sur le texte brut
        const spRegex = /(https?:\/\/(?:open\.)?spotify\.com\/(?:[a-zA-Z0-9-]+\/)?([a-zA-Z0-9]+)\/[a-zA-Z0-9]+[\w\?=\-&]*)/g;
        const matches = [...content.matchAll(spRegex)];
        matches.forEach(m => links.push(m[1]));
      }
      // Ajoute aussi les liens détectés par regex sur le texte brut (au cas où pas dans <a>)
      const spRegex = /(https?:\/\/(?:open\.)?spotify\.com\/(?:[a-zA-Z0-9-]+\/)?([a-zA-Z0-9]+)\/[a-zA-Z0-9]+[\w\?=\-&]*)/g;
      const matches = [...content.matchAll(spRegex)];
      matches.forEach(m => { if (!links.includes(m[1])) links.push(m[1]); });
      return links;
    },
    getSpotifyEmbedUrl(url) {
      // Supporte les URLs avec ou sans segment de langue (ex: /intl-fr/)
      // Ex: https://open.spotify.com/intl-fr/album/0nzKO3ydTYeXC4RTPSXEv1?si=xxx
      // Embed attendu: https://open.spotify.com/embed/album/0nzKO3ydTYeXC4RTPSXEv1
      const match = url.match(/open\.spotify\.com\/(?:[a-zA-Z0-9-]+\/)?([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)/);
      if (!match) return '';
      const type = match[1];
      const id = match[2];
      return `https://open.spotify.com/embed/${type}/${id}`;
    },
    submitQuickComment() {
      if (!this.quickComment.trim()) return;
      // Ici, tu peux appeler ta logique d'ajout de commentaire (API, emit, etc.)
      // Exemple placeholder :
      alert('Commentaire envoyé : ' + this.quickComment);
      this.quickComment = '';
    },
  },
};
</script>

<style scoped>
.post-item {
  background: var(--surface-card, #fff);
  border-radius: 1.1rem;
  box-shadow: 0 2px 8px rgba(40,40,60,0.07);
  margin-bottom: 1.2rem;
  padding: 1.1rem 1rem 0.6rem 1rem;
  max-width: 600px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
.post-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 0.6rem;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 1.5px solid #e3e3e3;
}
.post-author {
  flex: 1;
  min-width: 0;
}
.post-date {
  font-size: 0.8rem;
  color: #888;
}
.post-content {
  font-size: 1rem;
  word-break: break-word;
}
.media-container {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.media-item {
  max-width: 100%;
  border-radius: 0.7rem;
  margin-top: 0.3rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
}
.embed-responsive {
  width: 100%;
  border-radius: 0.7rem;
  overflow: hidden;
}
@media (max-width: 768px) {
  .post-item {
    padding: 0.7rem 0.3rem 0.5rem 0.3rem;
    border-radius: 0.6rem;
    box-shadow: 0 1px 4px rgba(40,40,60,0.08);
    margin-bottom: 0.7rem;
    max-width: 98vw;
  }
  .avatar {
    width: 32px;
    height: 32px;
  }
  .post-header {
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }
  .media-item, .embed-responsive iframe, .embed-responsive embed, .embed-responsive video {
    max-height: 220px !important;
    min-height: 120px;
    object-fit: cover;
  }
  .post-content {
    font-size: 0.97rem;
  }
}
.comment-quick-bar {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.7rem;
  padding: 0.5rem 0.6rem 0.2rem 0.6rem;
  background: var(--surface-card, #f8f8fa);
  border-radius: 0.7rem;
}
.quick-comment-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 0.97rem;
  padding: 0.4rem 0.2rem;
  outline: none;
}
.quick-comment-btn {
  background: var(--primary-color, #1976d2);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.18s;
}
.quick-comment-btn:disabled {
  background: #bfc9d1;
  cursor: not-allowed;
}
@media (max-width: 768px) {
  .comment-quick-bar {
    padding: 0.3rem 0.2rem 0.1rem 0.2rem;
    margin-top: 0.4rem;
    border-radius: 0.5rem;
  }
  .quick-comment-input {
    font-size: 0.93rem;
    padding: 0.3rem 0.1rem;
  }
  .quick-comment-btn {
    width: 28px;
    height: 28px;
    font-size: 1rem;
  }
}
</style>
