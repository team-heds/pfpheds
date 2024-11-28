<template>
  <div class="post-item">
    <!-- En-tête du post -->
    <div class="post-header">
      <img :src="authorAvatarUrl || defaultAvatar" alt="Avatar" class="avatar" />
      <div class="post-author">
        <router-link
          v-if="post.IdUser"
          :to="{ name: 'UserProfile', params: { id: post.IdUser } }"
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

      <!-- Si une seule vidéo -->
      <video
        v-if="post.videos && post.videos.length === 1"
        :src="post.videos[0]"
        controls
        class="post-video"
      ></video>

      <!-- Si plusieurs vidéos -->
      <div v-if="post.videos && post.videos.length > 1" class="post-videos">
        <video
          v-for="(video, index) in post.videos"
          :key="index"
          :src="video"
          controls
          class="post-video-multiple"
        ></video>
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

      <!-- Texte + vidéo(s) -->
      <div v-if="post.Content && post.videos && post.videos.length > 0">
        <video
          v-for="(video, index) in post.videos"
          :key="index"
          :src="video"
          controls
          class="post-video-multiple"
        ></video>
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

    <!-- Réponses -->
    <div v-if="post.replies && Object.keys(post.replies).length > 0" class="replies">
      <div
        v-for="(reply, key) in post.replies"
        :key="key"
        class="reply"
      >
        <div class="reply-header">
          <img
            :src="replyAuthorAvatarUrls[reply.IdUser] || defaultAvatar"
            alt="Avatar"
            class="avatar"
          />
          <div class="reply-author">
            <router-link
              v-if="reply.IdUser"
              :to="{ name: 'UserProfile', params: { id: reply.IdUser } }"
            >
              <strong>{{ getReplyAuthorName(reply.IdUser) }}</strong>
            </router-link>
            <span v-else>{{ getReplyAuthorName(reply.IdUser) }}</span>
            <span class="reply-date">{{ formatTimestamp(reply.timestamp) }}</span>
          </div>
        </div>
        <div class="reply-content">{{ reply.content }}</div>
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
      replyAuthorNames: {},
      replyAuthorAvatarUrls: {},
    };
  },
  watch: {
    post: {
      handler() {
        this.fetchAuthorDetails();
        this.fetchReplyAuthorsDetails();
      },
      immediate: true,
    },
  },
  methods: {
    fetchAuthorDetails() {
      const userRef = dbRef(db, `Users/${this.post.IdUser}`);
      onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          this.authorName = userData.username || this.post.Author.split("@")[0];
          this.authorAvatarUrl = userData.profileImageUrl || this.defaultAvatar;
        } else {
          this.authorName = this.post.Author.split("@")[0];
          this.authorAvatarUrl = this.defaultAvatar;
        }
      });
    },
    fetchReplyAuthorsDetails() {
      if (!this.post.replies) return;

      Object.keys(this.post.replies).forEach((key) => {
        const reply = this.post.replies[key];
        const userRef = dbRef(db, `Users/${reply.IdUser}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            this.$set(this.replyAuthorNames, reply.IdUser, userData.username || reply.author.split("@")[0]);
            this.$set(this.replyAuthorAvatarUrls, reply.IdUser, userData.profileImageUrl || this.defaultAvatar);
          } else {
            this.$set(this.replyAuthorNames, reply.IdUser, reply.author.split("@")[0]);
            this.$set(this.replyAuthorAvatarUrls, reply.IdUser, this.defaultAvatar);
          }
        });
      });
    },
    getReplyAuthorName(authorId) {
      return this.replyAuthorNames[authorId] || "Utilisateur inconnu";
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
}

.post-author {
  font-weight: bold;
  color: var(--text-color);
}

.post-content {
  margin: 10px 0;
}

.post-image {
  max-width: 100%;
  margin-top: 10px;
  border-radius: 8px;
}

.post-images {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
}

.post-video {
  max-width: 100%;
  margin-top: 10px;
  border-radius: 8px;
}

.post-video-multiple {
  max-width: 100%;
  margin-top: 10px;
  border-radius: 8px;
}
</style>

