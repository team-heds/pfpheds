<template>
  <Navbar />
  <ProfileInfo v-if="activeTab === 0" />
  <AsyncDocumentsUserProfile v-if="activeTab === 1" />
  <AsyncResumStageUserProfile v-if="activeTab === 2" />
  <AsyncChatProfil v-if="activeTab === 3" />
</template>

<script>
import { defineAsyncComponent, ref } from 'vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import ProfileInfo from '@/components/user/details/ProfileInfo.vue'

const AsyncResumStageUserProfile = defineAsyncComponent(
  () => import('@/components/user/details/ResumStageUserProfile.vue')
)
const AsyncDocumentsUserProfile = defineAsyncComponent(
  () => import('@/components/user/details/DocumentsUserProfile.vue')
)
const AsyncChatProfil = defineAsyncComponent(
  () => import('@/components/user/details/ChatProfil.vue')
)

export default {
  name: 'ProfileView',
  components: {
    Navbar,
    ProfileInfo,
    AsyncResumStageUserProfile,
    AsyncDocumentsUserProfile,
    AsyncChatProfil,
  },
  setup() {
    const activeTab = ref(0);

    return {
      activeTab,
    };
  }
};
</script>

<style scoped>
/* ProfileView est maintenant juste un wrapper simple */
/* Le layout avec sidebars est géré par ProfileInfo.vue */
</style>
