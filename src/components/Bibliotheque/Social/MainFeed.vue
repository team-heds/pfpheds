<!-- src/components/Bibliotheque/Social/MainFeed.vue -->
<template>
  <div class="main-feed">

    
    <!-- Section des filtres -->
    <FilterComponent
      :filterTypes="filterTypes"
      :selectedFilterType="selectedFilterType"
      :filterOptions="filterOptions"
      :selectedFilterValue="selectedFilterValue"
      @update:selectedFilterType="updateSelectedFilterType"
      @update:selectedFilterValue="updateSelectedFilterValue"
      @filter-type-change="onFilterTypeChange"
      @apply-filter="applyFilter"
      @reset-filter="resetFilter"
    />

    <!-- Barre de création façon Facebook -->
    <div class="quick-post-bar" @click="handleCreateClick">
      <span class="quick-post-icon-circle">
        <i class="pi pi-file-edit quick-post-icon"></i>
      </span>
      <div class="quick-post-placeholder">Exprime-toi...</div>
    </div>
    <CreatePostDialog
      v-if="!isMobile"
      v-model="showCreatePost"
      :loading="loading"
      :value="newPost"
      :selectedMedia="selectedMedia"
      @update:value="val => newPost = val"
      @publish="postMessage"
      @media-selected="handleFileSelection"
      @remove-media="removeMedia"
    />

    <!-- Barre des stories -->
    <StoriesBar />

    <!-- Conteneur pour les posts avec Infinite Scroll -->
    <div class="posts-container">
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
/**
 * Exemple complet de MainFeed avec un composant "TextAreaComponent" en remplacement
 * de l'ancienne zone de texte. On conserve l'intégralité de la logique.
 */

import { ref, onMounted, watch, onUnmounted } from "vue";
import { db, auth } from "../../../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
import PostItem from "@/components/Social/PostItem.vue";
import Tag from "primevue/tag";
import Button from "primevue/button";
import FileUpload from "primevue/fileupload";
import FilterComponent from "@/components/Social/FilterComponent.vue";
import TextAreaComponent from "./TextAreaComponent.vue"; // <-- Import du nouveau composant
import CreatePostDialog from '@/components/Social/CreatePostDialog.vue';
import { useRouter } from 'vue-router';

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
  equalTo,
  child,
} from "firebase/database";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";
import StoriesBar from './StoriesBar.vue'

export default {
  name: "MainFeed",
  components: {
    StoriesBar,
    InfiniteScroll,
    PostItem,
    Tag,
    Button,
    FileUpload,
    FilterComponent,
    TextAreaComponent,
    CreatePostDialog,
  },
  props: {
    currentUser: Object,
  },
  setup(props) {
    const router = useRouter();
    // Références réactives
    const posts = ref([]);
    const filteredPosts = ref([]);
    const newPost = ref("");               // <-- On gardera le texte (HTML) renvoyé par l'Editor
    const detectedTags = ref([]);
    const loading = ref(false);
    const postsPerPage = ref(10);
    const localCurrentUser = ref(null);
    const lastScrollTop = ref(0);
    const selectedMedia = ref([]);
    const oldestTimestamp = ref(null);
    const showCreatePost = ref(false);
    const userAvatarUrl = ref('');
    const defaultAvatar = '/default-avatar.png';

    // Filtres
    const filterTypes = ref([
      { label: "Tous", value: null },
      { label: "Hashtag", value: "hashtag" },
      { label: "Communauté", value: "community" },
    ]);
    const selectedFilterType = ref(null);
    const filterOptions = ref([]);
    const selectedFilterValue = ref(null);
    const availableHashtags = ref([]);
    const availableCommunities = ref([]);
    const userCommunities = ref([]);
    const appliedFilter = ref({
      type: null,
      value: null,
    });

    // Ajout d'un détecteur mobile simple
    const isMobile = ref(window.innerWidth <= 768);
    const handleResize = () => {
      isMobile.value = window.innerWidth <= 768;
    };
    onMounted(() => window.addEventListener('resize', handleResize));
    onUnmounted(() => window.removeEventListener('resize', handleResize));

    // Watcher pour détecter les tags dans le nouveau post
    watch(newPost, (value) => {
      // On peut analyser 'value' (qui est un HTML) pour extraire les tags (# / @).
      // Ici on récupère le texte brut ou on fait une petite regex
      // Pour simplifier, on remplace les balises <...> par du vide avant la recherche.
      const textWithoutHtml = value.replace(/<[^>]+>/g, "");
      detectedTags.value = extractTags(textWithoutHtml);
    });

    // Fonction pour extraire les hashtags et mentions
    const extractTags = (text) => {
      const regex = /[#@][\w-]+/g;
      return text.match(regex) || [];
    };

    // Fonction pour publier un message
    const postMessage = async () => {
      // Vérifie si le champ d’édition est vide et s’il n’y a pas de média
      // Notez que "newPost.value" est du HTML, on peut retirer les balises pour vérifier le contenu
      const textWithoutHtml = newPost.value.replace(/<[^>]+>/g, "").trim();
      if (textWithoutHtml === "" && selectedMedia.value.length === 0) {
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
            const cleanMention = tag.substring(1); // Supprime le '@'
            acc[cleanMention] = true;
            return acc;
          }, {});

        const postData = {
          Author: authorName,
          IdUser: localCurrentUser.value.uid,
          // 'Content' est maintenant du HTML
          Content: newPost.value,
          Timestamp: serverTimestamp(),
          Hashtags: hashtagsObject,
          MentionGroups: mentionsObject,
          media: [],
          // Ajoutez un champ 'Community' si nécessaire
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
          const fileName = `${Date.now()}_${media.file.name}`;
          const mediaRf = storageRef(
            storage,
            `posts/${localCurrentUser.value.uid}/${fileName}`
          );
          const uploadResult = await uploadBytes(mediaRf, media.file);
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
      try {
        // Récupérer les hashtags
        const hashtagsSnapshot = await get(dbRef(db, "Hashtags"));
        if (hashtagsSnapshot.exists()) {
          const hashtagsData = hashtagsSnapshot.val();
          availableHashtags.value = Object.keys(hashtagsData).map((tag) => ({
            label: tag,
            value: tag,
          }));
        }

        // Récupérer les communautés de l'utilisateur
        if (localCurrentUser.value) {
          const userCommunitiesSnapshot = await get(
            child(dbRef(db), `Users/${localCurrentUser.value.uid}/communities`)
          );
          if (userCommunitiesSnapshot.exists()) {
            const userCommunitiesData = userCommunitiesSnapshot.val();
            userCommunities.value = Object.keys(userCommunitiesData).map(
              (comm) => ({
                label: comm,
                value: comm,
              })
            );
          } else {
            console.warn("Aucune communauté trouvée pour l'utilisateur.");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des filtres disponibles :", error);
      }
    };

    // Fonction appelée lors du changement de type de filtre
    const onFilterTypeChange = (value) => {
      if (value === "hashtag") {
        filterOptions.value = availableHashtags.value;
      } else if (value === "community") {
        filterOptions.value = userCommunities.value;
      } else {
        filterOptions.value = [];
        selectedFilterValue.value = null;
      }
    };

    // Méthodes pour mettre à jour les filtres depuis le FilterComponent
    const updateSelectedFilterType = (value) => {
      selectedFilterType.value = value;
    };

    const updateSelectedFilterValue = (value) => {
      selectedFilterValue.value = value;
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

      try {
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
        } else if (
          appliedFilter.value.type === "community" &&
          appliedFilter.value.value
        ) {
          // Filtrer par Communauté
          q = query(
            postsRefQuery,
            orderByChild("Community"),
            equalTo(appliedFilter.value.value),
            limitToLast(postsPerPage.value)
          );
        } else {
          // Pas de filtre
          q = query(
            postsRefQuery,
            orderByChild("Timestamp"),
            limitToLast(postsPerPage.value)
          );
        }

        // Appliquer la pagination si un oldestTimestamp existe
        if (oldestTimestamp.value) {
          if (
            appliedFilter.value.type === "hashtag" ||
            appliedFilter.value.type === "community"
          ) {
            q = query(
              postsRefQuery,
              orderByChild(
                appliedFilter.value.type === "hashtag"
                  ? `Hashtags/${appliedFilter.value.value}`
                  : "Community"
              ),
              endAt(
                appliedFilter.value.type === "hashtag"
                  ? true
                  : appliedFilter.value.value,
                oldestTimestamp.value - 1
              ),
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

        const snapshot = await get(q);
        if (snapshot.exists()) {
          let data = snapshot.val();
          let postsArray = Object.entries(data).map(([key, post]) => ({
            ...post,
            id: key,
          }));

          // ——————————————————————————————————————————————
          // Exclure les posts ayant un champ "Community"
          // ——————————————————————————————————————————————
          postsArray = postsArray.filter((post) => !post.Community);

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
        } else {
          // Si aucun post trouvé, mais il y en a déjà affichés, on repart du début
          if (posts.value.length > 0) {
            oldestTimestamp.value = null;
            await fetchPosts();
          } else {
            console.log("Aucun post trouvé pour les critères actuels.");
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des posts :", error);
      }

      loading.value = false;
    };

    // Fonction pour appliquer les filtres aux posts
    const applyFilters = () => {
      if (appliedFilter.value.type === "hashtag" && appliedFilter.value.value) {
        filteredPosts.value = posts.value.filter(
          (post) =>
            post.Hashtags && post.Hashtags[appliedFilter.value.value]
        );
      } else if (
        appliedFilter.value.type === "community" &&
        appliedFilter.value.value
      ) {
        filteredPosts.value = posts.value.filter(
          (post) => post.Community === appliedFilter.value.value
        );
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
      lastScrollTop.value = scrollTop;
    };

    // Fonction pour gérer le clic sur la barre de création
    const handleCreateClick = () => {
      if (isMobile.value) {
        router.push('/create');
      } else {
        showCreatePost.value = true;
      }
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
          } else {
            console.warn("Aucun utilisateur connecté.");
          }
        });
      }
    });

    // --- Ajout : recharger les posts après retour de publication ---
    onMounted(() => {
      router.afterEach((to, from) => {
        if (from.name === 'CreateContentMobile' && to.name === 'MainFeed') {
          reloadPosts();
        }
      });
      // Recharge si event global (publication depuis PostTextarea)
      if (typeof window !== 'undefined' && window && window.$vueRoot) {
        window.$vueRoot.$on('refresh-mobile-feed', reloadPosts);
      } else if (typeof getCurrentInstance === 'function') {
        const vm = getCurrentInstance()?.proxy?.$root;
        vm && vm.$on && vm.$on('refresh-mobile-feed', reloadPosts);
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
      lastScrollTop,
      selectedMedia,
      oldestTimestamp,
      filterTypes,
      selectedFilterType,
      filterOptions,
      selectedFilterValue,
      availableHashtags,
      availableCommunities,
      userCommunities,
      appliedFilter,
      showCreatePost,
      userAvatarUrl,
      defaultAvatar,
      isMobile,
      handleCreateClick,
      // Méthodes
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
      handleScroll,
      updateSelectedFilterType,
      updateSelectedFilterValue,
    };
  },
};
</script>

<style scoped>
.quick-post-bar {
  display: flex;
  align-items: center;
  background: var(--surface-card, #f8f8fa);
  border-radius: 1.2rem;
  padding: 0.5rem 1rem;
  margin-bottom: 1.1rem;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: background 0.18s;
  max-width: 880px;
  width: 100%;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .quick-post-bar {
    max-width: 98vw;
  }
}
.quick-post-icon-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--surface-hover);
  border-radius: 50%;
  margin-right: 0.7rem;
  flex-shrink: 0;
}
.quick-post-icon {
  font-size: 1rem;
  color: var(--primary-color);
}
.quick-post-placeholder {
  color: #888;
  font-size: 1.01rem;
  flex: 1;
  text-align: left;
}
@media (max-width: 768px) {
  .quick-post-bar {
    padding: 0.35rem 0.5rem;
    border-radius: 0.8rem;
    margin-bottom: 0.6rem;
  }
  .quick-post-icon-circle {
    width: 26px;
    height: 26px;
    margin-right: 0.5rem;
  }
  .quick-post-icon {
    font-size: 0.85rem;
  }
  .quick-post-placeholder {
    font-size: 0.96rem;
  }
}
.main-feed {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  min-height: 100vh;
  overflow-y: auto;
  max-width: 880px;
  margin-left: auto;
  margin-right: auto;
}
@media (max-width: 900px) {
  .main-feed {
    max-width: 98vw;
  }
}
.posts-container {
  height: 100vh;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE/Edge */
}
.posts-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
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
/* Responsive mobile */
@media (max-width: 768px) {
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