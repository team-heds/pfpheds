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
      <div v-if="post.Content" class="post-text">{{ post.Content }}</div>
      <!-- Si une seule image -->
      <img
        v-if="post.images && post.images.length === 1"
        :src="post.images[0]"
        alt="Post Image"
        class="post-image"
      />

      <!-- Si plusieurs images -->
      <div v-if="post.images && post.images.length > 1" class="post-images">
        <img
          v-for="(image, index) in post.images"
          :key="index"
          :src="image"
          alt="Post Image"
          class="post-image-multiple"
        />
      </div>

      <!-- Texte + image(s) -->
      <div v-if="post.Content && post.images && post.images.length > 0">
        <img
          v-for="(image, index) in post.images"
          :key="index"
          :src="image"
          alt="Post Image"
          class="post-image-multiple"
        />
      </div>
    </div>

    <!-- Actions du post -->
    <div class="post-actions">
      <Button @click="toggleReplyForm" size="small">Répondre</Button>
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
import { ref as dbRef, onValue, push, serverTimestamp } from "firebase/database";
import { db } from "../../../firebase.js";
import Textarea from "primevue/textarea";
import Button from "primevue/button";

export default {
  name: "PostItem",
  components: { Textarea, Button },
  props: {
    post: Object,
    currentUser: Object,
  },
  data() {
    return {
      showReplyForm: false,
      replyContent: "",
      defaultAvatar: new URL("@/assets/avatar/avatar99.png", import.meta.url).href,
      authorName: "",
      authorAvatarUrl: "",
    };
  },
  watch: {
    post: {
      handler() {
        this.fetchAuthorDetails();
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
          this.authorName = userData.username || this.post.Author.split("@")[0];
          this.authorAvatarUrl = userData.PhotoURL || this.defaultAvatar; // Utilisation de PhotoURL
        } else {
          this.authorName = this.post.Author.split("@")[0];
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
        author: this.currentUser.email.split("@")[0],
        content: this.replyContent,
        timestamp: serverTimestamp(),
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

.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  margin-right: 10px;
  object-fit: cover; /* Assure que l'image reste bien cadrée dans le cercle */
}
</style>
