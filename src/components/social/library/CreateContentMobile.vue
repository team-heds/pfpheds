<template>
  <div class="create-content-mobile" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
    <div class="header">
      <Button icon="pi pi-arrow-left" class="back-btn" @click="goBack" />
      <span class="title">CRÉATION</span>
      <Button label="Publier" class="publish-btn" :disabled="!canPublish || loading" @click="onPublishClick" :loading="loading" />
    </div>




    <div class="content-area pt-6">
      <PostTextarea ref="textareaRef" v-if="currentTab === 'post'" v-model="contentValue" @publish="onMobilePostPublish" />
      <AddStoryCore v-else @publish-story="updateStoryData" />
    </div>


    <div class="tab-bar-slider">
      <div class="slider-bg" role="tablist" aria-label="Type de contenu">
        <button type="button" role="tab" :aria-selected="currentTab === 'post'" :class="['slider-btn', currentTab === 'post' ? 'slider-active' : '']" @click="currentTab = 'post'">Publication</button>
        <button type="button" role="tab" :aria-selected="currentTab === 'story'" :class="['slider-btn', currentTab === 'story' ? 'slider-active' : '']" @click="currentTab = 'story'">Story</button>
        <div class="slider-indicator" :style="{ left: currentTab === 'post' ? '0%' : '50%' }"></div>
      </div>
    </div>
  </div>
</template>

<script>
import PostTextarea from './PostTextarea.vue';
import AddStoryCore from './AddStoryCore.vue';
import Avatar from 'primevue/avatar';
import Button from 'primevue/button';
import { db } from '../../../../firebase';
import { getAuth } from 'firebase/auth';
import { ref as dbRef, push, set } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { supabase } from '@/supabase.js';
import { useAuthStore } from '@/stores/authStore';

export default {
  name: 'CreateContentMobile',
  components: { PostTextarea, AddStoryCore, Avatar, Button },
  props: {
    user: Object,
    userAvatar: {
      type: String,
      default: '/default-avatar.png',
    },
  },
  data() {
    return {
      currentTab: 'post',
      contentValue: '',
      storyData: null,
      loading: false,
      touchStartX: 0,
      touchEndX: 0,
      selectedMedia: [], // Ajout pour stocker les médias sélectionnés
      authStore: null,
    };
  },
  computed: {
    canPublish() {
      if (this.currentTab === 'post') return this.contentValue && this.contentValue.length > 0;
      return this.storyData && this.storyData.file;
    },
  },
  mounted() {
    // Masquer la navbar globale sur cette page
    const navbar = document.querySelector('.navbar, .nav-bar, nav, .main-navbar');
    if (navbar) navbar.style.display = 'none';
    this.authStore = useAuthStore();
    this.authStore && this.authStore.checkAuthState && this.authStore.checkAuthState();
  },
  beforeUnmount() {
    // Réafficher la navbar quand on quitte la page
    const navbar = document.querySelector('.navbar, .nav-bar, nav, .main-navbar');
    if (navbar) navbar.style.display = '';
  },
  methods: {
    goBack() {
      this.$router.back();
    },
    async handlePublish() {
      if (this.currentTab === 'post') {
        // Désactivé : publication gérée par PostTextarea
      } else if (this.currentTab === 'story') {
        if (this.storyData && this.storyData.file) {
          this.loading = true;
          try {
            const auth = getAuth();
            const user = auth.currentUser;
            if (!user) throw new Error("Vous devez être connecté pour publier.");
            // Upload image
            const file = this.storyData.file;
            const fileName = `story_${user.uid}_${Date.now()}.jpg`;
            const storageReference = storageRef(getStorage(), `stories/${user.uid}/${fileName}`);
            await uploadBytes(storageReference, file);
            const imageUrl = await getDownloadURL(storageReference);
            // Ajout story dans la base
            const storyRef = push(dbRef(db, 'stories'));
            const storyData = {
              id: storyRef.key,
              userId: user.uid,
              imageUrl,
              caption: this.storyData.caption,
              createdAt: Date.now(),
              userName: user.displayName || '',
              userAvatar: user.photoURL || '',
            };
            await set(storyRef, storyData);
            this.storyData = null;
            this.$toast && this.$toast.add({severity:'success', summary:'Story publiée', life: 2000});
            this.goBack();
          } catch (e) {
            alert('Erreur lors de la publication de la story: ' + e.message);
          } finally {
            this.loading = false;
          }
        }
      }
    },
    handleAddMedia() {},
    onMediaSelected(media) {
      this.selectedMedia = media;
    },
    updateStoryData(data) {
      this.storyData = data;
    },
    // Gestion du swipe pour le slider POST/STORY
    handleTouchStart(e) {
      this.touchStartX = e.changedTouches[0].screenX;
    },
    handleTouchEnd(e) {
      this.touchEndX = e.changedTouches[0].screenX;
      const diff = this.touchEndX - this.touchStartX;
      if (Math.abs(diff) > 40) {
        if (diff < 0 && this.currentTab === 'post') this.currentTab = 'story';
        if (diff > 0 && this.currentTab === 'story') this.currentTab = 'post';
      }
    },
    async onMobilePostPublish(postData) {
      // Fusionne les médias sélectionnés côté parent
      postData.media = this.selectedMedia;
      this.loading = true;
      try {
        if (this.authStore && this.authStore.isSupabaseUser) {
          const user = this.authStore.user;
          const authorName = (user && (user.user_metadata?.full_name || user.email?.split('@')[0])) || postData.userName || postData.Author || '';

          const tags = (postData.content || '').match(/([#@][\w\-]+)/g) || [];
          const hashtags = tags.filter(t => t.startsWith('#')).reduce((acc, t) => { acc[t.substring(1)] = true; return acc; }, {});
          const mentions = tags.filter(t => t.startsWith('@')).reduce((acc, t) => { acc[t.substring(1)] = true; return acc; }, {});

          const { data: inserted, error: insErr } = await supabase
            .from('posts')
            .insert([{ user_id: user.id, author_name: authorName, content: postData.content, hashtags, mentions }])
            .select('id')
            .single();
          if (insErr) throw insErr;

          let rows = [];
          if (postData.media && postData.media.length > 0) {
            for (const m of postData.media) {
              if (!(m.file instanceof File)) continue;
              const path = `posts/${user.id}/${Date.now()}_${m.name || 'media'}`;
              const { error: upErr } = await supabase.storage.from('post-media').upload(path, m.file, { upsert: true });
              if (upErr) throw upErr;
              const { data: pub } = supabase.storage.from('post-media').getPublicUrl(path);
              rows.push({ post_id: inserted.id, url: pub.publicUrl, type: m.type });
            }
            if (rows.length > 0) {
              const { error: mErr } = await supabase.from('post_media').insert(rows);
              if (mErr) throw mErr;
            }
          }
          this.$toast && this.$toast.add({severity:'success', summary:'Post publié', life: 2000});
          this.goBack();
        } else {
          let mediaUrls = [];
          const auth = getAuth();
          const user = auth.currentUser;
          const authorName = (user && (user.displayName || user.email.split('@')[0])) || postData.userName || postData.Author || '';
          if (postData.media && postData.media.length > 0) {
            const storage = getStorage();
            for (const fileMeta of postData.media) {
              if (fileMeta.file instanceof File) {
                const ext = fileMeta.name ? fileMeta.name.split('.').pop() : 'bin';
                const fileName = `post_${user.uid}_${Date.now()}_${Math.random().toString(36).substring(2,8)}.${ext}`;
                const storageReference = storageRef(storage, `posts/${user.uid}/${fileName}`);
                await uploadBytes(storageReference, fileMeta.file);
                const url = await getDownloadURL(storageReference);
                mediaUrls.push({ url, type: fileMeta.type, name: fileMeta.name });
              }
            }
          }
          const postRef = push(dbRef(db, 'Posts'));
          const firebaseData = { Author: authorName, Content: postData.content, IdUser: postData.userId, Timestamp: Date.now(), media: mediaUrls };
          await set(postRef, firebaseData);
          this.$toast && this.$toast.add({severity:'success', summary:'Post publié', life: 2000});
          this.goBack();
        }
      } catch (e) {
        alert('Erreur lors de la publication du post: ' + e.message);
      } finally {
        this.loading = false;
      }
    },
    onPostPublished(postData) {
      // Affiche un toast et retourne au feed (UX instantanée)
      this.$toast && this.$toast.add({severity:'success', summary:'Post publié', life: 2000});
      this.goBack();
    },
    onPublishClick() {
      if (this.currentTab === 'post') {
        // Appel explicite de la méthode handlePublish du PostTextarea via ref
        this.$refs.textareaRef && this.$refs.textareaRef.handlePublish();
      } else {
        this.handlePublish();
      }
    },
  },
};
</script>

<style scoped>
.create-content-mobile {
  min-height: 100vh;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  height: 100vh;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 0 16px;
}
.back-btn {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #fff;
  border-radius: 12px;
  margin-right: 8px;
}
.title {
  flex: 1;
  text-align: center;
  font-weight: 600;
  letter-spacing: 2px;
  font-size: 1.1rem;
}
.publish-btn {
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  color: #fff;
  border-radius: 12px;
  font-weight: 600;
  margin-left: 8px;
}
.user-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px 0 16px;
}
.placeholder {
  color: #a5b1c2;
  font-size: 1.08rem;
}
.add-media-row {
  padding: 12px 16px 0 16px;
}
.add-media-btn {
  background: #192c43;
  color: #fff;
  border-radius: 12px;
  width: 36px;
  height: 36px;
  font-size: 1.3rem;
}
.content-area {
  flex: 1;
  padding: 0 16px;
}
.tab-bar {
  display: none;
}
.tab-bar-slider {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100vw;
  position: fixed;
  bottom: 26px;
  left: 0;
  z-index: 10;
}
.slider-bg {
  background: #192c43;
  border-radius: 14px;
  display: flex;
  position: relative;
  width: 170px;
  height: 38px;
  box-shadow: 0 2px 8px 0 rgba(0,0,0,0.08);
}
.slider-btn {
  border: 0;
  background: transparent;
  font: inherit;
  flex: 1;
  text-align: center;
  line-height: 38px;
  font-weight: 600;
  font-size: 1.08rem;
  color: #fff;
  border-radius: 14px;
  cursor: pointer;
  z-index: 2;
  transition: color 0.18s;
  position: relative;
  user-select: none;
}
.slider-btn:focus-visible{outline:3px solid #fff;outline-offset:-3px}
.slider-active {
  color: #222;
}
.slider-indicator {
  position: absolute;
  top: 3px;
  left: 0;
  width: 50%;
  height: 32px;
  background: linear-gradient(90deg, #F3C300 0%, #D49F3F 100%);
  border-radius: 12px;
  z-index: 1;
  transition: left 0.22s cubic-bezier(.7,.3,.3,1);
}
@media (min-width: 768px) {
  .tab-bar-slider {
    display: none;
  }
}
</style>
