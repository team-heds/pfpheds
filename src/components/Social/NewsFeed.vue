<template>

  <div class="newsfeed-grid">
    <!-- Première section : Menu de gauche -->
    <div class="sidebar card">
      <h3>Options</h3>
      <!-- Exemple d'éléments dans le menu -->
      <ul class="menu-options">
        <li><a href="#">Accueil</a></li>
        <li><a href="#">Groupes</a></li>
        <li><a href="#">Paramètres</a></li>
      </ul>

      <!-- Filtres de recherche avancés -->
      <AdvancedSearchFilter @filter-posts="applyFilters" />
    </div>

    <!-- Deuxième section : Fil d'actualité -->
    <div class="main-feed card">
      <h1>Fil d'actualité</h1>

      <!-- Formulaire de création de post -->
      <div class="post-form">
        <Textarea  v-model="newPost" placeholder="Exprimez-vous..." class="form-control"></Textarea>
        <!-- Affichage des hashtags ou mentions détectés -->
        <div v-if="detectedTags.length > 0" class="tags-container">
          <Tag v-for="(tag, index) in detectedTags" :key="index" class="badge"
                :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'">
            {{ tag }}
          </Tag>
        </div>
        <!-- Bouton pour poster -->
        <Button label="Primary" @click="postMessage">Publier</Button>
      </div>

      <!-- Liste des posts avec un scroll infini -->
      <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
        <PostItem v-for="(post, index) in shuffledPosts" :key="post.id" :post="post" :currentUser="currentUser" />
      </InfiniteScroll>
    </div>

    <!-- Troisième section : Profil utilisateur à droite -->
    <div class="profile-section card">
      <UserProfile :user="currentUser" />
    </div>
  </div>
</template>

<script>
import { ref as dbRef, push, set, onValue, serverTimestamp, limitToLast, query } from "firebase/database";
import { db, auth } from '../../../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import UserProfile from '@/components/Social/UserProfile.vue';
import InfiniteScroll from '@/components/Social/InfiniteScroll.vue';
import PostItem from '@/components/Social/PostItem.vue';
import AdvancedSearchFilter from '@/components/Social/AdvancedSearchFilter.vue';
import Navbar from '@/components/Utils/Navbar.vue'

export default {
  name: "NewsFeed",
  components: {
    UserProfile,
    InfiniteScroll,
    PostItem,
    AdvancedSearchFilter
  },
  data() {
    return {
      posts: [],
      filteredPosts: [],
      shuffledPosts: [],
      newPost: '',
      detectedTags: [],
      currentUser: null,
      userRoles: [],
      loading: false,
      searchQuery: '',
      filterType: 'all',
      filterValue: '',
      sortOrder: 'newest',
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
    }
  },
  methods: {
    extractTags(text) {
      const regex = /[#@][\w-]+/g;
      return text.match(regex) || [];
    },
    postMessage() {
      if (this.newPost.trim() === '') {
        this.showMessage("Veuillez écrire quelque chose avant de poster.");
        return;
      }

      if (this.detectedTags.length === 0) {
        this.showMessage("Veuillez inclure au moins un hashtag ou une mention dans votre message.");
      }

      const authorName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
      const newPostRef = push(dbRef(db, 'Posts'));
      const postData = {
        Author: authorName,
        IdUser: this.currentUser.uid,
        Content: this.newPost,
        Timestamp: serverTimestamp(),
        Hashtags: this.detectedTags.filter(tag => tag.startsWith('#')),
        MentionGroups: this.detectedTags.filter(tag => tag.startsWith('@')),
        Answers: []
      };

      set(newPostRef, postData)
        .then(() => {
          this.newPost = '';
        })
        .catch(error => {
          console.error("Erreur lors de la publication du message:", error);
        });
    },
    fetchPosts() {
      this.loading = true;

      let postsRef;
      if (this.lastPostKey) {
        postsRef = query(
          dbRef(db, 'Posts'),
          limitToLast(this.postsPerPage + 1)
        );
      } else {
        postsRef = query(
          dbRef(db, 'Posts'),
          limitToLast(this.postsPerPage)
        );
      }

      onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const postsArray = Object.entries(data).map(([key, post]) => ({
            ...post,
            id: key
          }));

          if (this.lastPostKey) {
            postsArray.shift();
          }

          this.posts = [...this.posts, ...postsArray];
          this.lastPostKey = postsArray.length > 0 ? postsArray[postsArray.length - 1].id : null;

          this.applyFilters();
        }
        this.loading = false;
      }, {
        onlyOnce: true
      });
    },
    applyFilters(filterOptions = null) {
      if (filterOptions) {
        this.searchQuery = filterOptions.query;
        this.filterType = filterOptions.type;
        this.filterValue = filterOptions.value;
        this.sortOrder = filterOptions.order;
      }

      let filtered = this.posts;

      if (this.searchQuery) {
        filtered = filtered.filter(post => post.content.toLowerCase().includes(this.searchQuery.toLowerCase()));
      }

      filtered = filtered.filter(post => this.isAccessible(post));

      if (this.filterType !== 'all') {
        if (this.filterType === 'hashtag') {
          filtered = filtered.filter(post => post.Hashtags && post.Hashtags.includes(`#${this.filterValue}`));
        } else if (this.filterType === 'mention') {
          filtered = filtered.filter(post => post.MentionGroups && post.MentionGroups.includes(`@${this.filterValue}`));
        }
      }

      if (this.sortOrder === 'newest') {
        filtered.sort((a, b) => b.timestamp - a.timestamp);
      } else {
        filtered.sort((a, b) => a.timestamp - b.timestamp);
      }

      this.filteredPosts = filtered;
    },
    shufflePosts(posts) {
      for (let i = posts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [posts[i], posts[j]] = [posts[j], posts[i]];
      }
      return posts;
    },
    isAccessible(post) {
      if (post.mentionGroups && post.mentionGroups.length > 0) {
        return post.mentionGroups.some(group => this.hasRole(group.replace('@', '')));
      }
      return true;
    },
    hasRole(role) {
      return this.userRoles.includes(role);
    },
    loadMorePosts() {
      if (!this.loading) {
        this.fetchPosts();
      }
    },
    showMessage(message) {
      const messageDiv = document.createElement('div');
      messageDiv.textContent = message;
      messageDiv.className = 'alert alert-warning mt-2';
      this.$el.querySelector('.post-form').appendChild(messageDiv);

      setTimeout(() => {
        messageDiv.remove();
      }, 3000);
    }
  },
  mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUser = user;
        this.fetchPosts();

        const userRef = dbRef(db, `Users/${user.uid}`);
        onValue(userRef, (snapshot) => {
          const userData = snapshot.val();
          if (userData && userData.roles) {
            this.userRoles = Object.keys(userData.roles);
          }
        });
      } else {
        this.currentUser = null;
        this.userRoles = [];
      }
    });
  }
};
</script>

<style scoped>
.newsfeed-grid {
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  padding: 1rem;
}

.card {
  background-color: white;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.sidebar {
  background-color: #f9f9f9;
}

.main-feed {
  background-color: #fff;
}

.profile-section {
  background-color: #f1f1f1;
}

.menu-options {
  list-style: none;
  padding: 0;
}

.menu-options li {
  margin: 1rem 0;
}

.menu-options a {
  text-decoration: none;
  color: #333;
  font-weight: 500;
}

.post-form {
  margin-bottom: 1.5rem;
}

.form-control {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.tags-container {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

.btn:hover {
  background-color: #0056b3;
}

.alert {
  margin-top: 1rem;
}
</style>
