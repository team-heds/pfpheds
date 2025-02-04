<template>
    <div class="community-feed">
      <!-- Zone de publication (texte + médias) -->
      <transition name="fade">
        <div v-show="showTextareaCard" class="post-textarea-card">
          <div class="post-form">
            <!-- Zone de texte riche -->
            <TextAreaComponent
              v-model="newPost"
              @input="detectTags"
            />

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

            <!-- Boutons d'upload et de publication -->
            <div class="actions-container w-3 pb-2">
              <!-- Upload de fichiers (images, vidéos, etc.) -->
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

              <!-- Bouton pour publier -->
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
                <img
                  v-if="media.type.startsWith('image/')"
                  :src="media.preview"
                  alt="Preview"
                  class="media-item"
                />
                <video
                  v-if="media.type.startsWith('video/')"
                  :src="media.preview"
                  controls
                  class="media-item"
                ></video>
                <button @click="removeMedia(index)" class="remove-media-btn">
                  ✖
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <!-- Liste des posts (infinite scroll) -->
      <div class="posts-container" @scroll="handleScroll">
        <InfiniteScroll :loading="loading" @load-more="loadMorePosts">
          <PostItem
            v-for="post in posts"
            :key="post.id"
            :post="post"
            :currentUser="currentUser"
          />
        </InfiniteScroll>
      </div>
    </div>
  </template>

  <script>
  import { ref, onMounted, watch } from "vue";
  import { auth, db } from "@/firebase.js";
  import { onAuthStateChanged } from "firebase/auth";
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
    getDownloadURL
  } from "firebase/storage";

  // Composants internes
  import InfiniteScroll from "@/components/Social/InfiniteScroll.vue";
  import PostItem from "@/components/Social/PostItem.vue";
  import TextAreaComponent from "@/components/Bibliotheque/Social/TextAreaComponent.vue";
  import Tag from "primevue/tag";
  import Button from "primevue/button";
  import FileUpload from "primevue/fileupload";

  export default {
    name: "CommunityFeed",
    components: {
      InfiniteScroll,
      PostItem,
      TextAreaComponent,
      Tag,
      Button,
      FileUpload,
    },
    props: {
      communityId: {
        type: String,
        required: true,
      },
      currentUser: {
        type: Object,
        required: false,
        default: null,
      },
    },
    setup(props) {
      // Références réactives
      const posts = ref([]);
      const newPost = ref("");
      const detectedTags = ref([]);
      const loading = ref(false);
      const postsPerPage = ref(10);
      const showTextareaCard = ref(true);
      const lastScrollTop = ref(0);
      const selectedMedia = ref([]);
      const oldestTimestamp = ref(null);
      const localCurrentUser = ref(props.currentUser || null);

      // Surveille si le texte du post change pour détecter automatiquement les tags
      watch(newPost, (value) => {
        const textWithoutHtml = value.replace(/<[^>]+>/g, "");
        detectedTags.value = extractTags(textWithoutHtml);
      });

      // Fonction pour extraire les hashtags et mentions
      const extractTags = (text) => {
        const regex = /[#@][\w-]+/g;
        return text.match(regex) || [];
      };

      // Fonction pour poster un message
      const postMessage = async () => {
        const textWithoutHtml = newPost.value.replace(/<[^>]+>/g, "").trim();
        if (!props.communityId) {
          console.warn("Impossible de publier : 'communityId' manquant.");
          return;
        }
        if (!localCurrentUser.value) {
          console.warn("Aucun utilisateur connecté pour publier.");
          return;
        }
        if (textWithoutHtml === "" && selectedMedia.value.length === 0) {
          console.error("Aucun contenu à publier.");
          return;
        }

        try {
          const authorName =
            localCurrentUser.value.displayName ||
            localCurrentUser.value.email.split("@")[0];

          // Construire la liste des hashtags
          const hashtagsObject = detectedTags.value
            .filter((tag) => tag.startsWith("#"))
            .reduce((acc, tag) => {
              const cleanTag = tag.substring(1);
              acc[cleanTag] = true;
              return acc;
            }, {});

          // Construire la liste des mentions
          const mentionsObject = detectedTags.value
            .filter((tag) => tag.startsWith("@"))
            .reduce((acc, tag) => {
              const cleanMention = tag.substring(1);
              acc[cleanMention] = true;
              return acc;
            }, {});

          const postData = {
            Author: authorName,
            IdUser: localCurrentUser.value.uid,
            Content: newPost.value, // Contenu au format HTML
            Timestamp: serverTimestamp(),
            Hashtags: hashtagsObject,
            MentionGroups: mentionsObject,
            media: [],
            Community: props.communityId, // on associe le post à la communauté
          };

          // Upload des médias
          const mediaUrls = await uploadMedia();
          postData.media = mediaUrls;

          // Enregistrement dans la base de données
          const newPostRef = push(dbRef(db, "Posts"));
          await set(newPostRef, postData);

          // Réinitialisation
          newPost.value = "";
          selectedMedia.value = [];
          detectedTags.value = [];

          // Rechargement
          reloadPosts();
        } catch (error) {
          console.error("Erreur lors de la publication :", error);
        }
      };

      // Upload de chaque fichier sélectionné
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

      // Gestion de la sélection de fichiers
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

      // Suppression d'un média de la liste
      const removeMedia = (index) => {
        selectedMedia.value.splice(index, 1);
      };

      // Récupérer les posts de la communauté
      const fetchPosts = async () => {
        if (!props.communityId) return;

        loading.value = true;
        let postsRefQuery = dbRef(db, "Posts");

        // Filtrage sur la communauté
        let q = query(
          postsRefQuery,
          orderByChild("Community"),
          equalTo(props.communityId),
          limitToLast(postsPerPage.value)
        );

        // Pagination : si on a déjà un oldestTimestamp
        if (oldestTimestamp.value) {
          q = query(
            postsRefQuery,
            orderByChild("Community"),
            endAt(props.communityId, oldestTimestamp.value - 1),
            limitToLast(postsPerPage.value)
          );
        }

        try {
          const snapshot = await get(q);
          if (snapshot.exists()) {
            const data = snapshot.val();
            let postsArray = Object.entries(data).map(([key, post]) => ({
              ...post,
              id: key,
            }));

            // Tri du plus récent au plus ancien
            postsArray.sort((a, b) => {
              const timeA = a.Timestamp ? a.Timestamp : 0;
              const timeB = b.Timestamp ? b.Timestamp : 0;
              return timeB - timeA;
            });

            // Mise à jour de la liste globale
            posts.value = [...posts.value, ...postsArray];

            // Mettre à jour oldestTimestamp
            if (posts.value.length > 0) {
              const oldestPost = posts.value[posts.value.length - 1];
              oldestTimestamp.value = oldestPost.Timestamp;
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des posts :", error);
        }

        loading.value = false;
      };

      // Recharger complètement les posts
      const reloadPosts = async () => {
        posts.value = [];
        oldestTimestamp.value = null;
        await fetchPosts();
      };

      // Infinite scroll : charger plus de posts
      const loadMorePosts = async () => {
        if (!loading.value) {
          await fetchPosts();
        }
      };

      // Gérer le scroll pour afficher/masquer la zone de texte
      const handleScroll = (event) => {
        const scrollTop = event.target.scrollTop;
        showTextareaCard.value = scrollTop <= lastScrollTop.value;
        lastScrollTop.value = scrollTop;
      };

      // Au montage, s’assurer d’avoir l’utilisateur et récupérer les posts
      onMounted(() => {
        // Si on n'a pas encore d'utilisateur en prop, on surveille l'auth
        onAuthStateChanged(auth, (user) => {
          if (user) {
            localCurrentUser.value = user;
          }
        });
        fetchPosts();
      });

      return {
        posts,
        newPost,
        detectedTags,
        loading,
        showTextareaCard,
        selectedMedia,
        lastScrollTop,
        oldestTimestamp,
        localCurrentUser,
        extractTags,
        postMessage,
        handleFileSelection,
        removeMedia,
        uploadMedia,
        fetchPosts,
        reloadPosts,
        loadMorePosts,
        handleScroll,
      };
    },
  };
  </script>

  <style scoped>
  .community-feed {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    height: 100%;
    overflow-y: auto;
    -ms-overflow-style: none;  /* IE et Edge */
    scrollbar-width: none;     /* Firefox */
  }

  .post-textarea-card {
    border-radius: 0.75rem;
  }

  .post-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .actions-container {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  .upload-button {
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--surface-border);
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    cursor: pointer;
    transition: background-color 0.3s, color 0.3s;
  }

  .upload-button:hover {
    background-color: var(--primary-color-light);
    color: var(--primary-color);
  }

  .upload-button .pi {
    font-size: 1.2rem;
    margin-right: 0.5rem;
  }

  .publish-button {
    flex-grow: 1;
    display: flex;
    align-items: center;
    justify-content: center;
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

  /* Masquer la scrollbar du conteneur des posts */

  /* Pour Chrome, Safari et Opera */
  .posts-container::-webkit-scrollbar {
    display: none;
  }

  /* Pour IE, Edge et Firefox */
  .posts-container {
    -ms-overflow-style: none;
    scrollbar-width: none;
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
