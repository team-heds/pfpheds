<template>
  <div class="post-item">
    <div class="post-header">
      <img :src="authorAvatarUrl || defaultAvatar" alt="Avatar" class="avatar" />
      <div class="post-author">
        <!-- Link to the user's profile using authorId -->
        <router-link v-if="post.authorId" :to="{ name: 'UserProfile', params: { id: post.authorId } }">
          <strong>{{ authorName }}</strong>
        </router-link>
        <span v-else>{{ authorName }}</span>

        <span class="post-date">{{ formatTimestamp(post.timestamp) }}</span>
      </div>
    </div>
    <div class="post-content">
      {{ post.Content }}
    </div>
    <div class="post-actions">
      <button @click="toggleReplyForm" class="btn btn-link">Répondre</button>
    </div>

    <!-- Formulaire de réponse -->
    <div v-if="showReplyForm" class="reply-form">
      <textarea v-model="replyContent" placeholder="Écrire une réponse..." class="form-control mb-2"></textarea>
      <button @click="submitReply" class="btn btn-secondary">Envoyer</button>
    </div>

    <!-- Affichage des réponses -->
    <div v-if="post.replies && post.replies.length > 0" class="replies">
      <div v-for="(reply, index) in post.replies" :key="index" class="reply">
        <div class="reply-header">
          <img :src="replyAuthorAvatarUrls[reply.IdUser] || defaultAvatar" alt="Avatar" class="avatar" />
          <div class="reply-author">
            <!-- Link to the reply author's profile using authorId -->
            <router-link v-if="reply.IdUser" :to="{ name: 'UserProfile', params: { id: reply.IdUser } }">
              <strong>{{ getReplyAuthorName(reply.IdUser) }}</strong>
            </router-link>
            <span v-else>{{ getReplyAuthorName(reply.IdUser) }}</span>


            <span class="reply-date">{{ formatTimestamp(replyTtimestamp) }}</span>
          </div>
        </div>
        <div class="reply-content">{{ reply.Content }}</div>
      </div>
    </div>
  </div>
</template>

<script>
import { ref as dbRef, onValue, push, serverTimestamp } from "firebase/database";
import { db } from '../../../firebase.js';

export default {
  name: "PostItem",
  props: {
    post: Object,
    currentUser: Object,
    id: Object,
  },
  data() {
    return {
      showReplyForm: false,
      replyContent: '',
      defaultAvatar: new URL('@/assets/avatar/avatar99.png', import.meta.url).href,
      authorName: '', // To store the author's display name
      authorAvatarUrl: '', // To store the author's avatar URL
      replyAuthorNames: {}, // To store display names for reply authors
      replyAuthorAvatarUrls: {}, // To store avatar URLs for reply authors
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
        console.log("ok1");
        if (userData) {
          console.log("ok2");

          this.authorName = userData.username || this.post.Author.split('@')[0]; // Fallback to email prefix if username is not available
          this.authorAvatarUrl = userData.profileImageUrl || "this.defaultAvatar"; // Fallback to default avatar if profile image URL is not available
        } else {
          console.log("ok3");

          this.authorName = this.post.Author.split('@')[0]; // Fallback to email prefix
          this.authorAvatarUrl = "this.defaultAvatar"; // Fallback to default avatar
        }
      });
    },


    fetchReplyAuthorsDetails() {
      if (!this.post.replies || !Array.isArray(this.post.replies)) return; // Check if replies exist and are an array

      this.post.replies.forEach(reply => {
        const userRef = dbRef(db, `Users/${reply.IdUser}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData) {
            this.$set(this.replyAuthorNames, reply.authorId, userData.username || reply.author.split('@')[0]);
            this.$set(this.replyAuthorAvatarUrls, reply.authorId, userData.profileImageUrl || this.defaultAvatar);
          } else {
            this.$set(this.replyAuthorNames, reply.authorId, reply.author.split('@')[0]);
            this.$set(this.replyAuthorAvatarUrls, reply.authorId, this.defaultAvatar);
          }
        });
      });
    },
    getReplyAuthorName(authorId) {
      return this.replyAuthorNames[authorId] || 'Utilisateur inconnu';
    },
    toggleReplyForm() {
      this.showReplyForm = !this.showReplyForm;
      if (!this.showReplyForm) {
        this.replyContent = '';
      }
    },
    submitReply() {
      if (!this.replyContent.trim()) {
        alert("Veuillez écrire quelque chose avant de répondre.");
        return;
      }

      const newReply = {
        author: this.currentUser.email.split('@')[0], // Use the part of the email before '@' if displayName is not available
        authorId: this.currentUser.uid, // Include the user ID for profile linking
        content: this.replyContent,
        timestamp: serverTimestamp(),
        responseTo: {
          id: this.post.id,
          author: this.post.author,
          content: this.post.content
        }
      };


      const postRef = dbRef(db, `Posts/${this.post.id}/replies`);
      push(postRef, newReply);

      this.replyContent = '';
      this.showReplyForm = false;
    },
    formatTimestamp(timestamp) {
      if (!timestamp) return '';
      return new Date(timestamp).toLocaleString();
    }
  }
};
</script>

<style scoped>
.post-item {
  padding: 15px;
  margin-bottom: 10px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.post-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
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
  color: #333;
}

.post-content {
  margin-top: 10px;
  margin-bottom: 10px;
  font-size: 1.1em;
  color: #555;
}

.post-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.reply-form {
  margin-top: 10px;
  margin-bottom: 20px;
}

.replies {
  margin-top: 10px;
  padding-left: 20px;
  border-left: 2px solid #f0f0f0;
}

.reply {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 6px;
  margin-bottom: 5px;
  position: relative;
  transition: background-color 0.3s ease;
}

.reply:hover {
  background-color: #f0f0f0;
}

.reply-header {
  display: flex;
  align-items: center;
}

.reply-author {
  font-weight: bold;
  margin-right: 10px;
}
</style>
