<template>
  <div>
    <UserProfile />
    <div class="container mt-4">
      <h2>Messages pour le groupe @{{ group }}</h2>
      <div v-if="posts.length > 0">
        <PostItem
          v-for="post in posts"
          :key="post.id"
          :post="post"
          :currentUser="currentUser"
        />
      </div>
      <div v-else>
        <p>Aucun message trouvé pour ce groupe.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { ref as dbRef, onValue } from "firebase/database";
import { db, auth } from '../../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import UserProfile from '@/components/admin/details/UserProfile.vue'
import PostItem from '@/components/social/library/PostItem.vue'

export default {
  name: 'MentionGroupPage',
  components: {
    UserProfile,
    PostItem
  },
  props: {
    group: String
  },
  data() {
    return {
      posts: [],
      currentUser: null
    };
  },
  created() {
    this.getCurrentUser();
    this.fetchGroupPosts();
  },
  methods: {
    getCurrentUser() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          this.currentUser = user;
        } else {
          this.currentUser = null;
        }
      });
    },
    fetchGroupPosts() {
      const postsRef = dbRef(db, 'mentionMessages');
      onValue(postsRef, (snapshot) => {
        const postsData = snapshot.val();
        if (postsData) {
          this.posts = Object.values(postsData).filter(post => post.group === this.group);
        } else {
          this.posts = [];
        }
      });
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 0 auto;
}
</style>
