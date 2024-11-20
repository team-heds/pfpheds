<template>
  <Navbar />
  <div class="newsfeed-container">
    <!-- Sidebar Gauche -->
    <div class="sidebar card">
      <h3>Communautés</h3>
      <ul class="menu-options">
        <li><a href="#">Mes Groupes</a></li>
        <li><a href="#">Créer une Communauté</a></li>
      </ul>
      <h3>Messagerie</h3>
      <ul class="messaging-list">
        <li><a href="#">Antoine Quarroz</a></li>
        <li><a href="#">Luc Berthod</a></li>
      </ul>
    </div>

    <!-- Section principale : Fil d'actualité -->
    <div class="main-feed card">
      <div class="post-form">
        <Textarea
          v-model="newPost"
          placeholder="Exprimez-vous..."
          class="form-control"
        />
        <div v-if="detectedTags.length > 0" class="tags-container">
          <Tag
            v-for="(tag, index) in detectedTags"
            :key="index"
            :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'"
          >
            {{ tag }}
          </Tag>
        </div>
        <Button label="Publier" class="publish-button" @click="postMessage" />
      </div>

      <!-- Liste des posts -->
      <div class="posts-container">
        <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
          <PostItem
            v-for="(post, index) in shuffledPosts"
            :key="post.id"
            :post="post"
            :currentUser="currentUser"
          />
        </InfiniteScroll>
      </div>
    </div>

    <!-- Sidebar Droite -->
    <div class="profile-section card">
      <UserProfile :user="currentUser" />
      <div class="hashtags">
        <h3># Hashtags Populaires</h3>
        <ul>
          <li>#Innovation</li>
          <li>#Technologie</li>
          <li>#Formation</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import {
  ref as dbRef,
  push,
  set,
  onValue,
  serverTimestamp,
  limitToLast,
  query,
} from "firebase/database";
import { db, auth } from "../../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import UserProfile from "@/components/Social/UserProfile.vue";
import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
import PostItem from "@/components/Social/PostItem.vue";
import Navbar from "@/components/Utils/Navbar.vue";

export default {
  name: "NewsFeed",
  components: {
    UserProfile,
    InfiniteScroll,
    PostItem,
    Navbar,
  },
  data() {
    return {
      posts: [],
      filteredPosts: [],
      shuffledPosts: [],
      newPost: "",
      detectedTags: [],
      currentUser: null,
      userRoles: [],
      loading: false,
      postsPerPage: 10,
      lastPostKey: null,
    };
  },
  watch: {
    newPost(value) {
      this.detectedTags = this.extractTags(value);
    },
    filteredPosts(newFilteredPosts) {
      this.shuffledPosts = this.shufflePosts(newFilteredPosts);
    },
  },
  methods: {
    extractTags(text) {
      const regex = /[#@][\w-]+/g;
      return text.match(regex) || [];
    },
    postMessage() {
      if (this.newPost.trim() === "") return;

      const authorName =
        this.currentUser.displayName || this.currentUser.email.split("@")[0];
      const newPostRef = push(dbRef(db, "Posts"));
      const postData = {
        Author: authorName,
        IdUser: this.currentUser.uid,
        Content: this.newPost,
        Timestamp: serverTimestamp(),
        Hashtags: this.detectedTags.filter((tag) => tag.startsWith("#")),
        MentionGroups: this.detectedTags.filter((tag) => tag.startsWith("@")),
        Answers: [],
      };

      set(newPostRef, postData).then(() => {
        this.newPost = "";
      });
    },
    fetchPosts() {
      this.loading = true;

      let postsRef = query(
        dbRef(db, "Posts"),
        limitToLast(this.postsPerPage)
      );

      onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const postsArray = Object.entries(data).map(([key, post]) => ({
            ...post,
            id: key,
          }));

          this.posts = [...this.posts, ...postsArray];
          this.applyFilters();
        }
        this.loading = false;
      });
    },
    applyFilters() {
      this.filteredPosts = this.posts.filter((post) => true); // Example
    },
    shufflePosts(posts) {
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j], posts[i]];
      }
      return posts;
    },
    loadMorePosts() {
      if (!this.loading) this.fetchPosts();
    },
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.fetchPosts();
      } else {
        this.currentUser = null;
      }
    });
  },
};
</script>

<style scoped>
.newsfeed-container {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: var(--surface-ground);
}

.card {
  background-color: var(--surface-card);
  padding: 1rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sidebar,
.profile-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.menu-options,
.messaging-list {
  list-style: none;
  padding: 0;
}

.menu-options li,
.messaging-list li {
  margin: 0.5rem 0;
}

.menu-options a,
.messaging-list a {
  text-decoration: none;
  color: var(--text-color);
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--surface-border);
  border-radius: 0.5rem;
  background-color: var(--surface-card);
  color: var(--text-color);
}

.publish-button {
  align-self: flex-end;
}

.tags-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.posts-container {
  margin-top: 2rem;
}

.hashtags ul {
  list-style: none;
  padding: 0;
}

.hashtags li {
  margin: 0.5rem 0;
}
</style>
