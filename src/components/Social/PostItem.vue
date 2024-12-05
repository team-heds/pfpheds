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
      <!-- Texte -->
      <div v-if="post.Content" class="post-text" v-html="post.Content"></div>

      <!-- Images -->
      <div v-if="post.media && post.media.length > 0" class="post-media">
        <!-- Une seule image -->
        <img
          v-if="post.media.length === 1"
          :src="post.media[0]"
          alt="Image du Post"
          class="post-image"
        />
        <!-- Plusieurs images -->
        <div v-else class="post-images-grid">
          <img
            v-for="(image, index) in post.media"
            :key="index"
            :src="image"
            alt="Image du Post"
            class="post-image-grid-item"
          />
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
  </div>
</template>

<script>
import { ref as dbRef, onValue, push, serverTimestamp, update } from "firebase/database";
import { db } from "../../../firebase.js";
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
      defaultAvatar: new URL("@/assets/avatar/avatar99.png", import.meta.url).href,
      authorName: "",
      authorAvatarUrl: "",
      isLiked: false,
      likeCount: 0,
      commentCount: 0,
    };
  },
  watch: {
    post: {
      handler() {
        this.fetchAuthorDetails();
        this.checkLikeStatus();
        this.loadCommentCount();
      },
      immediate: true,
    },
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

.post-media {
  text-align: center;
}

.post-image-wrapper {
  margin: 10px 0;
}

.post-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.post-image {
  display: inline-block;
  border-radius: 8px;
}

.horizontal-image {
  width: 90%;
}

.vertical-image {
  width: 50%;
  max-height: 500px;
}

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover;
}

.post-content {
  display: flex;
  flex-direction: column;
}

.post-media {
  margin-top: 10px;
}

.post-image {
  width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 10px;
}

.post-images-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.post-image-grid-item {
  width: 100%;
  height: auto;
  border-radius: 8px;
  object-fit: cover;
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
</style>
