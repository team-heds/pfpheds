<template>
  <div class="post-item">
    <!-- En-tête du post -->
    <div class="post-header">
      <img :src="authorAvatarUrl || defaultAvatar" alt="Avatar" class="avatar m-2" />
      <div class="post-author">
        <router-link
          v-if="post.IdUser"
          :to="{ name: 'Profile', params: { id: post.IdUser } }"
        >
          <strong> <p class="text-primary strong">{{ authorName }}</p></strong>
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
        <div v-for="(yt, i) in extractYouTubeLinks(post.Content)" :key="'yt-'+i" class="youtube-responsive">
          <iframe :src="getYouTubeEmbedUrl(yt)" frameborder="0" allowfullscreen></iframe>
        </div>
        <!-- Spotify Embed -->
        <div v-for="(sp, i) in extractSpotifyLinks(post.Content)" :key="'sp-'+i" class="embed-responsive embed-responsive-16by9 mt-2">
          <iframe :src="getSpotifyEmbedUrl(sp)" frameborder="0" allow="encrypted-media" style="width:100%;min-height:152px;"></iframe>
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
              ></video>
            </template>
            <template v-else-if="isPDF(mediaUrl)">
              <div v-if="!isMobile">
                <embed :src="mediaUrl" type="application/pdf" class="media-item pdf-embed" />
              </div>
              <div v-else style="text-align:center; margin:16px 0;">
                <a :href="mediaUrl" target="_blank" rel="noopener noreferrer" class="media-item media-link pdf-mobile-btn">
                  📄 Voir le PDF
                </a>
              </div>
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
    <div class="post-actions post-actions-mobile-row">
      <div class="action-button" @click="toggleLike">
        <i :class="isLiked ? 'pi pi-heart-fill' : 'pi pi-heart'" class="action-icon"></i>
        <span>{{ likeCount }}</span>
      </div>
      <div class="action-button" @click="toggleComments">
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

    <!-- Liste des commentaires (affichés seulement si showComments est true) -->
    <div v-if="showComments && post.replies" class="comments-section p-3">
      <div v-for="(reply, replyId) in topLevelReplies" :key="replyId" class="comment-card compact">
        <div class="comment-card-avatar" :class="{'with-photo': reply.photoURL}" >
          <img v-if="reply.photoURL" :src="reply.photoURL" alt="avatar" />
          <span v-else>{{ reply.Author ? reply.Author[0].toUpperCase() : '?' }}</span>
        </div>
        <div class="comment-card-body">
          <div class="comment-card-meta">
            <span class="comment-card-author">{{ reply.Author }}</span>
            <span class="comment-card-date">{{ formatTimestamp(reply.Timestamp) }}</span>
          </div>
          <div class="comment-card-content">{{ reply.Content }}</div>
          <div class="comment-card-actions">
            <button class="reply-link" @click="toggleReplyTo(replyId)">Répondre</button>
          </div>
          <!-- Champ de réponse -->
          <div v-if="replyToId === replyId" class="reply-to-bar">
            <Textarea
              v-model="replyToContent"
              placeholder="Répondre à ce commentaire..."
              class="comment-bar-textarea compact"
              autoResize
              @keydown.enter.exact.prevent="submitReplyTo(replyId)"
            />
            <button class="comment-bar-send compact" @click="submitReplyTo(replyId)">
              <i class="pi pi-send"></i>
            </button>
          </div>
          <!-- Réponses -->
          <div v-if="reply.replies" class="comment-replies compact">
            <div v-for="(subReply, subId) in reply.replies" :key="subId" class="comment-card reply-thread compact">
              <div class="comment-card-avatar small" :class="{'with-photo': subReply.photoURL}">
                <img v-if="subReply.photoURL" :src="subReply.photoURL" alt="avatar" />
                <span v-else>{{ subReply.Author ? subReply.Author[0].toUpperCase() : '?' }}</span>
              </div>
              <div class="comment-card-body">
                <div class="comment-card-meta">
                  <span class="comment-card-author">{{ subReply.Author }}</span>
                  <span class="comment-card-date">{{ formatTimestamp(subReply.Timestamp) }}</span>
                </div>
                <div class="comment-card-content">{{ subReply.Content }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Nouvelle zone de commentaire compacte et colorée -->
    <div class="comment-bar-modern compact">
      <Textarea
        v-model="replyContent"
        placeholder="Écrire un commentaire..."
        class="comment-bar-textarea compact"
        autoResize
        @keydown.enter.exact.prevent="submitReply"
      />
      <button class="comment-bar-send compact" @click="submitReply">
        <i class="pi pi-send"></i>
      </button>
    </div>
  </div>
</template>

<script>
import { ref as dbRef, onValue, push, serverTimestamp, update, get, child } from "firebase/database";
import { db } from "../../../firebase.js";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Textarea from "primevue/textarea";
import Button from "primevue/button";

export default {
  name: "PostItem",
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
      replyToId: null,
      replyToContent: "",
      defaultAvatar: new URL("@/assets/avatar/avatar1.jpg", import.meta.url).href,
      authorName: "",
      authorAvatarUrl: "",
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
      likedUsers: [],
      showComments: false,
      currentUserLocal: null,
      userPhotoCache: {},
      isMobile: window.matchMedia('(max-width: 600px)').matches,
    };
  },
  created() {
    // Récupération de l'utilisateur connecté
    const auth = getAuth();
    onAuthStateChanged(auth, (user) => {
      this.currentUserLocal = user;
    });
  },
  mounted() {
    window.addEventListener('resize', this.handleResize);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.handleResize);
  },
  watch: {
    post: {
      handler() {
        this.fetchAuthorDetails();
        this.checkLikeStatus();
        this.loadCommentCount();
        this.loadLikedUsers();
        this.loadCommentAvatars(); // Ajouté
      },
      immediate: true,
    },
  },
  computed: {
    topLevelReplies() {
      if (!this.post.replies) return {};
      const result = {};
      for (const [key, value] of Object.entries(this.post.replies)) {
        if (value && typeof value === 'object' && value.Author && value.Content) {
          result[key] = value;
        }
      }
      return result;
    }
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
        IdUser: this.currentUserLocal.uid,
        Author: this.currentUserLocal.email.split("@")[0],
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
      if (this.post.likes && this.currentUserLocal) {
        this.isLiked = !!this.post.likes[this.currentUserLocal.uid];
        this.likeCount = Object.keys(this.post.likes).length;
      } else {
        this.likeCount = 0;
      }
    },
    toggleLike() {
      if (!this.currentUserLocal) return alert("Vous devez être connecté pour liker.");
      const postLikesRef = dbRef(db, `Posts/${this.post.id}/likes`);
      if (this.isLiked) {
        const updates = {};
        updates[this.currentUserLocal.uid] = null;
        update(postLikesRef, updates);
      } else {
        const updates = {};
        updates[this.currentUserLocal.uid] = true;
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
    toggleReplyTo(replyId) {
      if (this.replyToId === replyId) {
        this.replyToId = null;
        this.replyToContent = "";
      } else {
        this.replyToId = replyId;
        this.replyToContent = "";
      }
    },
    async submitReplyTo(parentReplyId) {
      if (!this.replyToContent.trim()) return;
      // Ajout d'une réponse à un commentaire existant (thread niveau 1)
      const postRef = dbRef(db, `Posts/${this.post.id}/replies/${parentReplyId}/replies`);
      const newReply = {
        IdUser: this.currentUserLocal.uid,
        Author: this.currentUserLocal.email.split("@")[0],
        Content: this.replyToContent,
        Timestamp: serverTimestamp(),
      };
      await push(postRef, newReply);
      this.replyToContent = "";
      this.replyToId = null;
    },
    async loadCommentAvatars() {
      const userIds = new Set();
      // Collecte tous les IdUser des commentaires et réponses (thread 1 niveau)
      for (const reply of Object.values(this.post.replies || {})) {
        if (reply && reply.IdUser) userIds.add(reply.IdUser);
        if (reply && reply.replies) {
          for (const subReply of Object.values(reply.replies)) {
            if (subReply && subReply.IdUser) userIds.add(subReply.IdUser);
          }
        }
      }
      // Pour chaque userId, récupère photoURL si ce n'est pas le currentUser
      for (const userId of userIds) {
        if (userId === (this.currentUserLocal && this.currentUserLocal.uid)) {
          this.userPhotoCache[userId] = this.currentUserLocal.photoURL;
          continue;
        }
        if (!this.userPhotoCache[userId]) {
          // Va chercher dans la base Users/{userId}/PhotoURL
          const userSnap = await get(dbRef(db, `Users/${userId}`));
          if (userSnap.exists() && userSnap.val().PhotoURL) {
            this.userPhotoCache[userId] = userSnap.val().PhotoURL;
          } else {
            this.userPhotoCache[userId] = null;
          }
        }
      }
      // Ajoute photoURL à chaque commentaire et réponse pour le template
      for (const reply of Object.values(this.post.replies || {})) {
        if (reply && reply.IdUser) reply.photoURL = this.userPhotoCache[reply.IdUser] || null;
        if (reply && reply.replies) {
          for (const subReply of Object.values(reply.replies)) {
            if (subReply && subReply.IdUser) subReply.photoURL = this.userPhotoCache[subReply.IdUser] || null;
          }
        }
      }
      this.$forceUpdate();
    },
    handleResize() {
      this.isMobile = window.matchMedia('(max-width: 600px)').matches;
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
  },
};
</script>

<style scoped>
.post-item {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  margin-left: auto; /* Centrer le post */
  margin-right: auto; /* Centrer le post */
  padding: 15px 8px;
  background-color: var(--surface-card);
  border-radius: 1.2rem; /* Coins arrondis taille que je dois uttilser */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  -ms-overflow-style: none;  /* IE et Edge */
  scrollbar-width: none;     /* Firefox */
  margin-bottom: 15px; /* Espace entre les posts */
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
  height: 100%;
  margin-top: 20px;
}

.media-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: auto;
}

.media-item {
  max-width: 100%;
  width: 100%;
  box-sizing: border-box;
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

.comment-card.compact {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background: var(--surface-card, #f7f8fa);
  border-radius: 11px;
  box-shadow: none;
  padding: 7px 10px 7px 7px;
  margin-bottom: 8px;
  max-width: 99%;
  min-width: 0;
}
.comment-card-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e0e4ea;
  color: #5a5a5a;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.95em;
  flex-shrink: 0;
  user-select: none;
  border: 1px solid #ececec;
  overflow: hidden;
}
.comment-card-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
  display: block;
}
.comment-card-avatar.small {
  width: 22px;
  height: 22px;
  font-size: 0.85em;
}
.comment-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.comment-card-meta {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 0;
}
.comment-card-author {
  color: var(--primary-color, #1976d2);
  font-weight: 600;
  font-size: 0.98em;
  letter-spacing: 0.01em;
}
.comment-card-date {
  color: #b5b5b5;
  font-size: 0.80em;
  margin-top: 0;
}
.comment-card-content {
  font-size: 0.98em;
  color: var(--text-color, #222);
  margin-top: 1px;
  margin-bottom: 2px;
  word-break: break-word;
  line-height: 1.35;
}
.comment-card-actions {
  margin-top: 0;
  margin-bottom: 0;
}
.reply-link {
  background: none;
  border: none;
  color: var(--primary-color, #1976d2);
  cursor: pointer;
  font-size: 0.93em;
  padding: 0 0.25em;
  opacity: 0.8;
  transition: opacity 0.17s;
}
.reply-link:hover {
  text-decoration: underline;
  opacity: 1;
}
.reply-to-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 5px;
  margin-bottom: 5px;
}
.comment-replies.compact {
  margin-left: 18px;
  margin-top: 4px;
}
.comment-card.reply-thread.compact {
  background: var(--surface-card, #f7f8fa);
  border-radius: 9px;
  box-shadow: none;
  padding: 5px 7px 5px 5px;
  margin-bottom: 4px;
  margin-top: 0;
  max-width: 97%;
  min-width: 0;
}
@media (max-width: 600px) {
  .comment-card.compact {
    padding: 4px 3px 4px 3px;
    border-radius: 8px;
    font-size: 0.93em;
  }
  .comment-card-avatar {
    width: 22px;
    height: 22px;
    font-size: 0.85em;
  }
  .comment-card-content, .comment-card-actions {
    margin-left: 0;
  }
  .comment-replies.compact {
    margin-left: 7px;
  }
  .comment-card.reply-thread.compact {
    padding: 3px 4px 3px 3px;
    border-radius: 6px;
    font-size: 0.90em;
  }
}

/* Responsive mobile */
@media (max-width: 600px) {
  .post-item,
  .post-content,
  .post-media,
  .media-container {
    width: 96vw !important;
    max-width: 96vw !important;
    margin: 10px auto !important;
    padding: 14px 6px 16px 6px !important;
    border-radius: 14px !important;
    box-sizing: border-box !important;
    text-align: center;
  }
  .post-content,
  .post-media,
  .media-container {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 auto !important;
    padding: 0 !important;
    box-sizing: border-box !important;
    text-align: center;
  }
  .post-text {
    text-align: left;
    word-break: break-word;
    padding: 0 5vw;
  }
  .media-item,
  .pdf-embed {
    max-width: 98vw !important;
    width: 100% !important;
    height: auto;
    margin: 0 auto 10px auto !important;
    display: block;
    border-radius: 8px;
  }
  .pdf-mobile-btn {
    display: block;
    width: auto;
    min-width: 120px;
    max-width: 320px;
    margin: 18px auto 0 auto;
    padding: 8px 18px;
    font-size: 0.98em;
    background: var(--primary-color, #2196f3);
    color: #fff !important;
    border: none;
    border-radius: 8px;
    text-align: center;
    font-weight: 600;
    text-decoration: none;
    transition: background 0.16s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  }
  .pdf-mobile-btn:active,
  .pdf-mobile-btn:hover {
    background: var(--primary-color-hover, #1976d2);
    color: #fff;
    text-decoration: none;
  }
}

.youtube-responsive {
  position: relative;
  width: 100%;
  aspect-ratio: 16/9;
  margin: 12px 0;
}

.youtube-responsive iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: 8px;
  background: #000;
}

.reply-link {
  background: none;
  border: none;
  color: var(--primary-color, #2196f3);
  cursor: pointer;
  font-size: 0.95em;
  margin-top: 5px;
  margin-bottom: 5px;
  padding: 0 0.5em;
  opacity: 0.8;
  transition: opacity 0.17s;
}

.reply-link:hover {
  text-decoration: underline;
  opacity: 1;
}

.reply-to-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-top: 6px;
  margin-bottom: 10px;
}

.comment-replies {
  margin-left: 24px;
  margin-top: 4px;
}

.comment-thread {
  background: var(--surface-50, #f7f8fa);
  border-radius: 9px;
  margin-bottom: 4px;
  padding: 7px 11px;
}

.comment-bar-modern.compact {
  display: flex;
  align-items: center;
  background: var(--surface-card);
  border: 1px solid var(--surface-border, #ececec);
  border-radius: 13px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.02);
  padding: 5px 8px;
  margin: 12px 0 0 0;
  gap: 7px;
  min-height: 38px;
  max-width: 99%;
}

.comment-bar-textarea.compact {
  flex: 1;
  min-height: 22px;
  border: none;
  background: transparent;
  resize: none;
  font-size: 0.97em;
  padding: 4px 8px;
  outline: none;
  border-radius: 10px;
  box-shadow: none;
  color: var(--text-color, #222);
}

.comment-bar-textarea.compact::placeholder {
  color: #bcbcbc;
  opacity: 1;
}

.comment-bar-send.compact {
  background: var(--primary-color, #2196f3);
  color: #fff;
  border: none;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1em;
  box-shadow: 0 1px 2px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: background 0.18s;
}

.comment-bar-send.compact:hover {
  background: var(--primary-color-hover, #1976d2);
}

@media (max-width: 600px) {
  .comment-bar-modern.compact {
    width: 100% !important;
    margin: 12px 0 0 0;
    box-sizing: border-box;
    border-radius: 10px;
    padding: 5px 5vw!important;
    background: var(--surface-card, #182336);
  }
  .comment-bar-send.compact {
    width: 22px;
    height: 22px;
    font-size: 0.9em;
  }
  .comment-bar-textarea.compact {
    font-size: 0.93em;
    padding: 2px 4px;
  }
  .avatar {
    margin: 1rem !important;
  }
}

.post-actions.post-actions-mobile-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 2vw;
  padding: 10px 0 0 0;
  border-top: 1px solid var(--surface-border);
}

.post-actions.post-actions-mobile-row .action-button {
  flex: 1 1 0;
  justify-content: center;
  font-size: 1em;
  padding: 10px 0;
  background: none;
  border: none;
  border-radius: 7px;
  transition: background 0.15s;
}

.post-actions.post-actions-mobile-row .action-icon {
  font-size: 1.05em;
}

</style>
