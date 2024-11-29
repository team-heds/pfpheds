<template>
  <div class="main-feed">
    <!-- Carte pour la zone de texte et le bouton "Publier" -->
    <transition name="fade">
      <div v-show="showTextareaCard" class="post-textarea-card">
        <div class="post-form">
          <!-- Zone de texte -->
          <Textarea
            v-model="newPost"
            placeholder="Exprimez-vous..."
            class="form-control"
            @input="detectTags"
          />

          <!-- Tags -->
          <div v-if="detectedTags.length > 0" class="tags-container p-3">
            <Tag
              v-for="(tag, index) in detectedTags"
              :key="index"
              :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'"
            >
              {{ tag }}
            </Tag>
          </div>

          <!-- Upload des fichiers -->
          <div class="pt-2">
            <FileUpload
              ref="fileupload"
              mode="basic"
              name="media[]"
              accept="image/*,video/*"
              :maxFileSize="10000000"
              customUpload
              @select="handleFileSelection"
              chooseLabel="Ajouter des médias"
            />

            <!-- Aperçu des médias sélectionnés -->
            <div class="media-preview" v-if="selectedMedia.length > 0">
              <div
                v-for="(media, index) in selectedMedia"
                :key="index"
                class="media-item"
              >
                <img v-if="media.type.startsWith('image/')" :src="media.preview" alt="Preview" />
                <video
                  v-if="media.type.startsWith('video/')"
                  :src="media.preview"
                  controls
                ></video>
                <button @click="removeMedia(index)" class="remove-media-btn">✖</button>
              </div>
            </div>
          </div>

          <!-- Bouton publier -->
          <Button label="Publier" class="publish-button" @click="postMessage" />
        </div>
      </div>
    </transition>

    <!-- Liste des posts -->
    <div class="posts-container" @scroll="handleScroll">
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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import { db, auth } from "../../../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
import PostItem from "@/components/Social/PostItem.vue";
import Textarea from "primevue/textarea";
import Tag from "primevue/tag";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";

export default {
  name: "MainFeed",
  components: {
    InfiniteScroll,
    PostItem,
    Textarea,
    Tag,
    Button,
    FileUpload,
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
      selectedMedia: [], // Liste des médias sélectionnés
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
      if (this.newPost.trim() === "" && this.selectedMedia.length === 0) {
        console.error("Aucun contenu à publier.");
        return;
      }

      try {
        const authorName =
          this.localCurrentUser.displayName ||
          this.localCurrentUser.email.split("@")[0];
        const postData = {
          Author: authorName,
          IdUser: this.localCurrentUser.uid,
          Content: this.newPost,
          Timestamp: serverTimestamp(),
          Hashtags: this.detectedTags.filter((tag) => tag.startsWith("#")),
          MentionGroups: this.detectedTags.filter((tag) => tag.startsWith("@")),
          media: [], // Stocker les URLs des médias
        };

        // Upload des médias
        const mediaUrls = await this.uploadMedia();
        postData.media = mediaUrls;

        // Sauvegarder dans la base de données
        const newPostRef = push(dbRef(db, "Posts"));
        await set(newPostRef, postData);

        console.log("Publication réussie :", postData);

        // Réinitialiser les champs après publication
        this.newPost = "";
        this.selectedMedia = [];
        this.detectedTags = [];
      } catch (error) {
        console.error("Erreur lors de la publication :", error);
      }
    },
    async uploadMedia() {
      const storage = getStorage();
      const uploadedMediaUrls = [];

      for (const media of this.selectedMedia) {
        try {
          const mediaRef = storageRef(
            storage,
            `posts/${this.localCurrentUser.uid}/${Date.now()}_${media.file.name}`
          );

          const uploadResult = await uploadBytes(mediaRef, media.file);
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          uploadedMediaUrls.push(downloadUrl);
        } catch (error) {
          console.error("Erreur lors de l'upload du média :", error);
        }
      }

      return uploadedMediaUrls;
    },
    handleFileSelection(event) {
      const files = event.files;

      for (const file of files) {
        const fileType = file.type;
        const previewUrl = URL.createObjectURL(file);

        this.selectedMedia.push({
          file,
          type: fileType,
          preview: previewUrl,
        });
      }
    },
    removeMedia(index) {
      this.selectedMedia.splice(index, 1);
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
      this.filteredPosts = this.posts.filter((post) => true);
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
      this.showTextareaCard = scrollTop <= this.lastScrollTop;
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
  gap: 1.5rem;
}

.post-textarea-card {
  padding: 1rem;
  border-radius: 0.75rem;
}

.media-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.media-item {
  position: relative;
}

.media-item img,
.media-item video {
  max-width: 100px;
  max-height: 100px;
  border-radius: 8px;
}

.remove-media-btn {
  position: absolute;
  top: 0;
  right: 0;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  cursor: pointer;
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
</style>
