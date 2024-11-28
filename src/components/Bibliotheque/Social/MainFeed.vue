<template>
  <div class="main-feed">
    <!-- Carte pour la zone de texte et le bouton "Publier" -->
    <transition name="fade">
      <div v-show="showTextareaCard" class="post-textarea-card ">
        <div class="post-form">
          <Textarea
            v-model="newPost"
            placeholder="Exprimez-vous..."
            class="form-control"
            @input="detectTags"
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
      </div>
    </transition>

    <!-- Liste des posts -->
    <div class="posts-container " @scroll="handleScroll">
      <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
        <PostItem
          v-for="(post, index) in shuffledPosts"
          :key="post.id"
          :post="post"
          :currentUser="localCurrentUser"
        />
      </InfiniteScroll>
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
import { db, auth } from "../../../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
import PostItem from "@/components/Social/PostItem.vue";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";
import Button from "primevue/button";

export default {
  name: "MainFeed",
  components: {
    InfiniteScroll,
    PostItem,
    Textarea,
    Tag,
    Button,
  },
  props: {
    currentUser: Object, // Reçoit l'utilisateur actuel en tant que prop
  },
  data() {
    return {
      posts: [],
      filteredPosts: [],
      shuffledPosts: [],
      newPost: "",
      detectedTags: [],
      loading: false,
      postsPerPage: 10,
      lastPostKey: null,
      localCurrentUser: null, // Crée une copie locale de la prop
      showTextareaCard: true, // Contrôle l'affichage de la carte
      lastScrollTop: 0, // Position précédente du scroll
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
    async postMessage() {
      if (this.newPost.trim() === "") return;

      try {
        const authorName =
          this.localCurrentUser.displayName ||
          this.localCurrentUser.email.split("@")[0];
        const newPostRef = push(dbRef(db, "Posts"));
        const postData = {
          Author: authorName,
          IdUser: this.localCurrentUser.uid,
          Content: this.newPost,
          Timestamp: serverTimestamp(),
          Hashtags: this.detectedTags.filter((tag) => tag.startsWith("#")),
          MentionGroups: this.detectedTags.filter((tag) => tag.startsWith("@")),
          Answers: [],
        };

        await set(newPostRef, postData);
        this.newPost = ""; // Réinitialiser le champ après la publication
      } catch (error) {
        console.error("Erreur lors de la publication :", error);
      }
    },
    fetchPosts() {
      this.loading = true;

      const postsRef = query(
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
      this.filteredPosts = this.posts.filter((post) => true); // Exemple : appliquer des filtres
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
    handleScroll(event) {
      const scrollTop = event.target.scrollTop;
      if (scrollTop > this.lastScrollTop) {
        // Scroll vers le bas, cacher la carte
        this.showTextareaCard = false;
      } else {
        // Scroll vers le haut, afficher la carte
        this.showTextareaCard = true;
      }
      this.lastScrollTop = scrollTop;
    },
  },
  mounted() {
    if (this.currentUser) {
      this.localCurrentUser = { ...this.currentUser };
    } else {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.localCurrentUser = user;
          this.fetchPosts();
        }
      });
    }
  },
};
</script>

<style scoped>
.main-feed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* Espace entre la carte de textarea et la liste des posts */
}

.post-textarea-card {
  padding: 1rem;
  border-radius: 0.75rem;

}

.posts-container {
  overflow-y: scroll; /* Activer le défilement pour les posts */
  scrollbar-width: none; /* Cacher la barre de défilement dans Firefox */
}

.posts-container::-webkit-scrollbar {
  display: none; /* Cacher la barre de défilement pour Webkit */
}

.form-control {
  width: 100%;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 1.5rem;
  background-color: var(--surface-card);
  color: var(--text-color);
  font-size: 1rem;
}

.publish-button {
  margin-top: 1rem;
}

.tags-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 0.5rem;
}

</style>
