
<template>
  <div class="main-feed">
    <!-- Section des filtres -->
    <div class="filters-container ">
      <Dropdown
        class="surface-card"
        v-model="selectedFilterType"
        :options="filterTypes"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner un type de filtre"
        @change="onFilterTypeChange"
      />

      <Dropdown
        class="surface-card"
        v-if="selectedFilterType"
        v-model="selectedFilterValue"
        :options="filterOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="Sélectionner une option"
      />

      <Button
        v-if="selectedFilterType"
        label="Appliquer le filtre"
        @click="applyFilter"
        class="ml-2"
      />
      <Button
        v-if="selectedFilterType"
        label="Réinitialiser"
        @click="resetFilter"
        class="ml-2 p-button-secondary"
      />
    </div>

    <!-- Carte pour la zone de texte et le bouton "Publier" -->
    <transition name="fade">
      <div v-show="showTextareaCard" class="post-textarea-card">
        <div class="post-form">
          <!-- Zone de texte -->
          <textarea
            v-model="newPost"
            @input="detectTags"
            class="simple-textarea"
            placeholder="Commencer un post"
          ></textarea>

          <!-- Affichage des tags détectés -->
          <div v-if="detectedTags.length > 0" class="tags-container p-1">
            <Tag
              v-for="(tag, index) in detectedTags"
              :key="index"
              :class="tag.startsWith('#') ? 'bg-primary' : 'bg-secondary'"
            >
              {{ tag }}
            </Tag>
          </div>

          <!-- Conteneur pour les boutons d'upload et de publication -->
          <div class="actions-container w-3 pb-2">
            <!-- Upload de fichiers avec un pictogramme d'image et le label "Médias" -->
            <FileUpload
              ref="fileupload"
              mode="basic"
              name="media[]"
              accept=".jpg,.png,.mp3,.mp4,.pdf"
              :maxFileSize="10000000"
              customUpload
              @select="handleFileSelection"
              class="file-upload"
            >
              <template #choose>
                <Button
                  label="Médias"
                  icon="pi pi-image"
                  class="upload-button"
                  @click="$refs.fileupload.choose()"
                />
              </template>
            </FileUpload>

            <!-- Bouton de publication -->
            <Button
              label="Publier"
              class="publish-button"
              @click="postMessage"
            />
          </div>

          <!-- Prévisualisation des médias sélectionnés -->
          <div class="media-preview" v-if="selectedMedia.length > 0">
            <div
              v-for="(media, index) in selectedMedia"
              :key="index"
              class="media-item-wrapper"
            >
              <img v-if="media.type.startsWith('image/')" :src="media.preview" alt="Preview" class="media-item" />
              <video
                v-if="media.type.startsWith('video/')"
                :src="media.preview"
                controls
                class="media-item"
              ></video>
              <button @click="removeMedia(index)" class="remove-media-btn">✖</button>
            </div>
          </div>
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
import { ref, onMounted, watch } from "vue";
import { db, auth } from "../../../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
import PostItem from "@/components/Social/PostItem.vue";
import Tag from "primevue/tag";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import Editor from "primevue/editor";
import Dropdown from "primevue/dropdown";
import {
  ref as dbRef,
  push,
  set,
  serverTimestamp,
  orderByChild,
  limitToLast,
  endAt,
  get,
  query,
  equalTo
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

export default {
  name: "MainFeed",
  components: {
    InfiniteScroll,
    PostItem,
    Tag,
    Button,
    FileUpload
  },
  props: {
    currentUser: Object,
  },
  setup(props) {
    // Références réactives
    const posts = ref([]);
    const filteredPosts = ref([]);
    const newPost = ref("");
    const detectedTags = ref([]);
    const loading = ref(false);
    const postsPerPage = ref(10);
    const localCurrentUser = ref(null);
    const showTextareaCard = ref(true);
    const lastScrollTop = ref(0);
    const selectedMedia = ref([]);
    const oldestTimestamp = ref(null);

    // Filtres
    const filterTypes = ref([
      { label: "Tous", value: null },
      { label: "Hashtag", value: "hashtag" },
      { label: "Communauté", value: "community" }
    ]);
    const selectedFilterType = ref(null);
    const filterOptions = ref([]);
    const selectedFilterValue = ref(null);
    const availableHashtags = ref([]);
    const availableCommunities = ref([]);
    const appliedFilter = ref({
      type: null,
      value: null
    });

    // Watcher pour détecter les tags dans le nouveau post
    watch(newPost, (value) => {
      detectedTags.value = extractTags(value);
    });

    // Fonction pour extraire les hashtags et mentions
    const extractTags = (text) => {
      const regex = /[#@][\w-]+/g;
      return text.match(regex) || [];
    };

    // Fonction pour publier un message
    const postMessage = async () => {
      if (newPost.value.trim() === "" && selectedMedia.value.length === 0) {
        console.error("Aucun contenu à publier.");
        return;
      }

      try {
        const authorName =
          localCurrentUser.value.displayName ||
          localCurrentUser.value.email.split("@")[0];

        // Transformation des hashtags en objet
        const hashtagsObject = detectedTags.value
          .filter((tag) => tag.startsWith("#"))
          .reduce((acc, tag) => {
            const cleanTag = tag.substring(1); // Supprime le '#' du tag
            acc[cleanTag] = true;
            return acc;
          }, {});

        const mentionsObject = detectedTags.value
          .filter((tag) => tag.startsWith("@"))
          .reduce((acc, tag) => {
            const cleanMention = tag.substring(1); // Supprime le '@' de la mention
            acc[cleanMention] = true;
            return acc;
          }, {});

        const postData = {
          Author: authorName,
          IdUser: localCurrentUser.value.uid,
          Content: newPost.value,
          Timestamp: serverTimestamp(),
          Hashtags: hashtagsObject,
          MentionGroups: mentionsObject,
          media: []
          // Assurez-vous d'ajouter un champ 'Community' si nécessaire
        };

        const mediaUrls = await uploadMedia();
        postData.media = mediaUrls;

        const newPostRef = push(dbRef(db, "Posts"));
        await set(newPostRef, postData);

        console.log("Publication réussie :", postData);

        // Réinitialiser les champs après publication
        newPost.value = "";
        selectedMedia.value = [];
        detectedTags.value = [];

        // Recharger les posts pour inclure le nouveau post
        reloadPosts();
      } catch (error) {
        console.error("Erreur lors de la publication :", error);
      }
    };

    // Fonction pour uploader les médias
    const uploadMedia = async () => {
      const storage = getStorage();
      const uploadedMediaUrls = [];

      for (const media of selectedMedia.value) {
        try {
          const mediaRef = storageRef(
            storage,
            `posts/${localCurrentUser.value.uid}/${Date.now()}_${media.file.name}`
          );

          const uploadResult = await uploadBytes(mediaRef, media.file);
          const downloadUrl = await getDownloadURL(uploadResult.ref);
          uploadedMediaUrls.push(downloadUrl);
        } catch (error) {
          console.error("Erreur lors de l'upload du média :", error);
        }
      }

      return uploadedMediaUrls;
    };

    // Fonction pour gérer la sélection de fichiers
    const handleFileSelection = (event) => {
      const files = event.files;

      for (const file of files) {
        const fileType = file.type;
        const previewUrl = URL.createObjectURL(file);

        selectedMedia.value.push({
          file,
          type: fileType,
          preview: previewUrl,
        });
      }
    };

    // Fonction pour supprimer un média sélectionné
    const removeMedia = (index) => {
      selectedMedia.value.splice(index, 1);
    };

    // Fonction pour recharger les posts
    const reloadPosts = async () => {
      posts.value = [];
      filteredPosts.value = [];
      oldestTimestamp.value = null;
      await fetchPosts();
    };

    // Fonction pour récupérer les filtres disponibles
    const fetchAvailableFilters = async () => {
      // Récupérer les hashtags
      const hashtagsSnapshot = await get(dbRef(db, "Hashtags"));
      if (hashtagsSnapshot.exists()) {
        const hashtagsData = hashtagsSnapshot.val();
        availableHashtags.value = Object.keys(hashtagsData).map(tag => ({ label: tag, value: tag }));
      }

      // Récupérer les communautés
      const communitiesSnapshot = await get(dbRef(db, "Communities"));
      if (communitiesSnapshot.exists()) {
        const communitiesData = communitiesSnapshot.val();
        availableCommunities.value = Object.keys(communitiesData).map(comm => ({ label: comm, value: comm }));
      }
    };

    // Fonction appelée lors du changement de type de filtre
    const onFilterTypeChange = () => {
      if (selectedFilterType.value === "hashtag") {
        filterOptions.value = availableHashtags.value;
      } else if (selectedFilterType.value === "community") {
        filterOptions.value = availableCommunities.value;
      } else {
        filterOptions.value = [];
        selectedFilterValue.value = null;
      }
    };

    // Fonction pour appliquer le filtre
    const applyFilter = () => {
      appliedFilter.value.type = selectedFilterType.value;
      appliedFilter.value.value = selectedFilterValue.value;
      reloadPosts();
    };

    // Fonction pour réinitialiser le filtre
    const resetFilter = () => {
      selectedFilterType.value = null;
      selectedFilterValue.value = null;
      appliedFilter.value = { type: null, value: null };
      filterOptions.value = [];
      reloadPosts();
    };

    // Fonction pour récupérer les posts
    const fetchPosts = async () => {
      loading.value = true;
      let q;

      // Référence de base pour les posts
      let postsRefQuery = dbRef(db, "Posts");

      // Appliquer le filtre si nécessaire
      if (appliedFilter.value.type === "hashtag" && appliedFilter.value.value) {
        // Filtrer par Hashtag
        q = query(
          postsRefQuery,
          orderByChild(`Hashtags/${appliedFilter.value.value}`),
          equalTo(true),
          limitToLast(postsPerPage.value)
        );
      } else if (appliedFilter.value.type === "community" && appliedFilter.value.value) {
        // Filtrer par Communauté
        q = query(
          postsRefQuery,
          orderByChild("Community"), // Assurez-vous que chaque post a un champ 'Community'
          equalTo(appliedFilter.value.value),
          limitToLast(postsPerPage.value)
        );
      } else {
        // Pas de filtre, récupérer les posts les plus récents
        q = query(
          postsRefQuery,
          orderByChild("Timestamp"),
          limitToLast(postsPerPage.value)
        );
      }

      // Appliquer le timestamp pour la pagination si nécessaire
      if (oldestTimestamp.value) {
        if (appliedFilter.value.type === "hashtag" || appliedFilter.value.type === "community") {
          q = query(
            postsRefQuery,
            orderByChild(appliedFilter.value.type === "hashtag" ? `Hashtags/${appliedFilter.value.value}` : "Community"),
            endAt(appliedFilter.value.type === "hashtag" ? true : appliedFilter.value.value, oldestTimestamp.value - 1),
            limitToLast(postsPerPage.value)
          );
        } else {
          q = query(
            postsRefQuery,
            orderByChild("Timestamp"),
            endAt(oldestTimestamp.value - 1),
            limitToLast(postsPerPage.value)
          );
        }
      }

      try {
        const snapshot = await get(q);
        if (snapshot.exists()) {
          const data = snapshot.val();
          let postsArray = Object.entries(data).map(([key, post]) => ({
            ...post,
            id: key,
          }));

          // Trier les posts du plus récent au plus ancien
          postsArray.sort((a, b) => {
            const timeA = a.Timestamp ? a.Timestamp : 0;
            const timeB = b.Timestamp ? b.Timestamp : 0;
            return timeB - timeA;
          });

          // Mise à jour des posts
          posts.value = [...posts.value, ...postsArray];

          // Mettre à jour oldestTimestamp
          if (posts.value.length > 0) {
            const oldestPost = posts.value[posts.value.length - 1];
            oldestTimestamp.value = oldestPost.Timestamp;
          }

          applyFilters();
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des posts :", error);
      }

      loading.value = false;
    };

    // Fonction pour appliquer les filtres aux posts
    const applyFilters = () => {
      if (appliedFilter.value.type === "hashtag" && appliedFilter.value.value) {
        filteredPosts.value = posts.value.filter(post => post.Hashtags && post.Hashtags[appliedFilter.value.value]);
      } else if (appliedFilter.value.type === "community" && appliedFilter.value.value) {
        filteredPosts.value = posts.value.filter(post => post.Community === appliedFilter.value.value);
      } else {
        filteredPosts.value = posts.value;
      }
    };

    // Fonction pour charger plus de posts (infinite scroll)
    const loadMorePosts = async () => {
      if (!loading.value) {
        await fetchPosts();
      }
    };

    // Fonction pour gérer le scroll (pour afficher/masquer la zone de texte)
    const handleScroll = (event) => {
      const scrollTop = event.target.scrollTop;
      showTextareaCard.value = scrollTop <= lastScrollTop.value;
      lastScrollTop.value = scrollTop;
    };

    // Hook de cycle de vie onMounted
    onMounted(() => {
      if (props.currentUser) {
        localCurrentUser.value = { ...props.currentUser };
        fetchAvailableFilters();
        fetchPosts();
      } else {
        onAuthStateChanged(auth, (user) => {
          if (user) {
            localCurrentUser.value = user;
            fetchAvailableFilters();
            fetchPosts();
          }
        });
      }
    });

    return {
      posts,
      filteredPosts,
      newPost,
      detectedTags,
      loading,
      postsPerPage,
      localCurrentUser,
      showTextareaCard,
      lastScrollTop,
      selectedMedia,
      oldestTimestamp,
      filterTypes,
      selectedFilterType,
      filterOptions,
      selectedFilterValue,
      availableHashtags,
      availableCommunities,
      appliedFilter,
      extractTags,
      postMessage,
      uploadMedia,
      handleFileSelection,
      removeMedia,
      reloadPosts,
      fetchAvailableFilters,
      onFilterTypeChange,
      applyFilter,
      resetFilter,
      fetchPosts,
      applyFilters,
      loadMorePosts,
      handleScroll
    };
  }
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
  border-radius: 0.75rem;
}

.post-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Conteneur pour les boutons d'upload et de publication */
.actions-container {
  display: flex;
  align-items: center;
  gap: 1rem; /* Espace entre les deux boutons */
  margin-top: 1rem;
}

/* Personnalisation du bouton d'upload */
.upload-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: var(--surface-border);
  border: none;
  border-radius: 0.5rem;
  padding: 0.5rem 1rem; /* Augmenter le padding pour inclure le label */
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

.upload-button:hover {
  background-color: var(--primary-color-light);
  color: var(--primary-color);
}

.upload-button .pi {
  font-size: 1.2rem; /* Ajuster la taille de l'icône si nécessaire */
  margin-right: 0.5rem; /* Espace entre l'icône et le label */
}

/* Bouton de publication */
.publish-button {
  flex-grow: 1; /* Prend le reste de l'espace disponible */
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Zone de texte */
.simple-textarea {
  width: 100%;
  min-height: 120px;
  max-height: 300px;
  resize: vertical;
  padding: 0.5rem 1rem;
  border: 1px solid var(--surface-border);
  background-color: var(--surface-card);
  border-radius: 0.5rem;
  font-size: 1rem;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
}

.simple-textarea:focus {
  border-color: var(--primary-color);
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.media-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1rem;
}

.media-item-wrapper {
  position: relative;
}

.media-item {
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
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Styles pour le bouton "Publier" */
.publish-button {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive mobile */
@media (max-width: 768px) {
  .simple-textarea {
    max-height: 200px;
  }

  .actions-container {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .publish-button {
    width: 100%;
  }
}
</style>