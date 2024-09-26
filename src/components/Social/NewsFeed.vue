<template>
  <div>
    <UserProfile />
    <div class="container mt-4">
      <h1>Fil d'actualité</h1>

      <!-- Integrate Advanced Search Filter Component -->
      <AdvancedSearchFilter @filter-posts="applyFilters" />

      <!-- Post Creation Form -->
      <div class="post-form">
        <textarea v-model="newPost" placeholder="Écrivez quelque chose... (#BA23, #BA24, @BA23, @BA24, etc.)"
          class="form-control mb-2"></textarea>

        <!-- Display detected hashtags or mentions -->
        <div v-if="detectedTags.length > 0" class="tags-container">
          <span v-for="(tag, index) in detectedTags" :key="index" class="badge"
            :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'">
            {{ tag }}
          </span>
        </div>

        <!-- Submit Button -->
        <button class="btn btn-primary" @click="postMessage">Poster</button>
      </div>

      <!-- Displaying Posts with InfiniteScroll -->
      <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
        <PostItem v-for="(post, index) in shuffledPosts" :key="post.id" :post="post" :currentUser="currentUser" />
      </InfiniteScroll>
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
       // return;
      }

      const authorName = this.currentUser.displayName || this.currentUser.email.split('@')[0];
      console.log("okka");
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

   //   this.filteredPosts = filtered;
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
.container {
  max-width: 600px;
  margin: 0 auto;
}

.post-form {
  margin-bottom: 20px;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 10px;
}

.feed {
  margin-top: 20px;
}

.alert {
  position: relative;
  top: 10px;
}
</style>