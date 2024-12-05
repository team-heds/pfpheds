<template>
  <div class="main-feed">
    <!-- Carte pour la zone de texte et le bouton "Publier" -->
    <transition name="fade">
      <div v-show="showTextareaCard" class="post-textarea-card">
        <div class="post-form">
          <Editor v-model="newPost" @input="detectTags" editorStyle="height: 120px">
            <template v-slot:toolbar>
              <span class="ql-formats">
                  <button v-tooltip.bottom="'Bold'" class="ql-bold"></button>
                  <button v-tooltip.bottom="'Italic'" class="ql-italic"></button>
                  <button v-tooltip.bottom="'Underline'" class="ql-underline"></button>
              </span>
            </template>
          </Editor>

          <div v-if="detectedTags.length > 0" class="tags-container p-3">
            <Tag
              v-for="(tag, index) in detectedTags"
              :key="index"
              :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'"
            >
              {{ tag }}
            </Tag>
          </div>

          <div class="pt-2">
            <FileUpload
              ref="fileupload"
              mode="basic"
              name="media[]"
              accept=".jpg,.png,.mp3,.mp4,.pdf"
              :maxFileSize="10000000"
              customUpload
              @select="handleFileSelection"
              chooseLabel="Ajouter des médias"
            />

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

          <Button label="Publier" class="publish-button" @click="postMessage" />
        </div>
      </div>
    </transition>

    <div class="posts-container" @scroll="handleScroll">
      <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
        <PostItem
          v-for="post in filteredPosts"
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
  serverTimestamp,
  orderByChild,
  limitToLast,
  endAt,
  get,
  query
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
import Editor from "primevue/editor"; // Assurez-vous d'importer l'Editor si ce n'est pas déjà fait

export default {
  name: "MainFeed",
  components: {
    InfiniteScroll,
    PostItem,
    Textarea,
    Tag,
    Button,
    FileUpload,
    Editor
  },
  props: {
    currentUser: Object,
  },
  data() {
    return {
      posts: [],
      filteredPosts: [],
      newPost: "",
      detectedTags: [],
      loading: false,
      postsPerPage: 10,
      localCurrentUser: null,
      showTextareaCard: true,
      lastScrollTop: 0,
      selectedMedia: [],
      oldestTimestamp: null // Le timestamp du post le plus ancien chargé
    };
  },
  watch: {
    newPost(value) {
      this.detectedTags = this.extractTags(value);
    }
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
          media: []
        };

        const mediaUrls = await this.uploadMedia();
        postData.media = mediaUrls;

        const newPostRef = push(dbRef(db, "Posts"));
        await set(newPostRef, postData);

        console.log("Publication réussie :", postData);

        this.newPost = "";
        this.selectedMedia = [];
        this.detectedTags = [];

        // Après la publication, on peut recharger les posts pour s'assurer que le nouveau est pris en compte
        this.reloadPosts();
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
    async reloadPosts() {
      // Recharge complètement les derniers posts
      this.posts = [];
      this.oldestTimestamp = null;
      await this.fetchPosts();
    },
    async fetchPosts() {
      this.loading = true;

      // Première requête : on récupère les posts les plus récents
      // On utilise limitToLast pour choper les posts les plus récents, puis on les inverse.
      let q = query(
        dbRef(db, "Posts"),
        orderByChild("Timestamp"),
        limitToLast(this.postsPerPage)
      );

      // Si on a déjà un oldestTimestamp, on récupère les posts plus anciens que celui-ci.
      if (this.oldestTimestamp) {
        // On récupère les posts antérieurs à oldestTimestamp
        q = query(
          dbRef(db, "Posts"),
          orderByChild("Timestamp"),
          endAt(this.oldestTimestamp - 1),
          limitToLast(this.postsPerPage)
        );
      }

      const snapshot = await get(q);
      if (snapshot.exists()) {
        const data = snapshot.val();
        let postsArray = Object.entries(data).map(([key, post]) => ({
          ...post,
          id: key,
        }));

        // postsArray est dans l'ordre ascendant par Timestamp, on l'inverse pour afficher du plus récent au plus ancien
        postsArray.sort((a, b) => b.Timestamp - a.Timestamp);

        // Mise à jour des posts
        this.posts = [...this.posts, ...postsArray];

        // Mettre à jour oldestTimestamp avec le plus ancien (dernier dans le tableau après tri)
        if (this.posts.length > 0) {
          const oldestPost = this.posts[this.posts.length - 1];
          this.oldestTimestamp = oldestPost.Timestamp;
        }

        this.applyFilters();
      }

      this.loading = false;
    },
    applyFilters() {
      this.filteredPosts = this.posts; // À ce stade, aucun filtre particulier
    },
    async loadMorePosts() {
      if (!this.loading) {
        await this.fetchPosts();
      }
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
      this.fetchPosts();
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
  height: 100vh; /* Assurez-vous que le container est scrollable */
  overflow-y: auto;
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
