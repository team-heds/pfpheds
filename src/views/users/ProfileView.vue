<template>
  <Navbar />
  <ProfileInfo v-if="activeTab === 0" />
  <DocumentsUserProfile v-if="activeTab === 1" />
  <ResumStageUserProfile v-if="activeTab === 2" />
  <ChatProfil v-if="activeTab === 3" />
</template>

<script>
import { ref } from 'vue';
import Navbar from '@/components/common/utils/Navbar.vue';
import ProfileInfo from '@/components/user/details/ProfileInfo.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
import DocumentsUserProfile from '@/components/user/details/DocumentsUserProfile.vue'
import ChatProfil from '@/components/user/details/ChatProfil.vue'

export default {
  name: 'ProfileView',
  components: {
    Navbar,
    ProfileInfo,
    ResumStageUserProfile,
    DocumentsUserProfile,
    ChatProfil,
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
