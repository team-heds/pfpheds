<template>
  <Navbar />

  <SocialThreeColumnLayout center-max-width="72rem">
    <!-- Sidebar Gauche -->
    <template #left>
      <LeftSidebar />
    </template>

    <!-- Zone centrale (Main-feed) : Infos de la communauté et flux -->
    <main class="main-feed" ref="mainFeedRef">
      <div class="community-shell">
        <div class="card community-header-card">
          <h1>{{ community.name }}</h1>
          <p><strong>Description:</strong> {{ community.description }}</p>
          <p><strong>Type:</strong> {{ displayType(community.type) }}</p>
          <h6><strong>Membres :</strong> {{ memberCount }}</h6>
          <Button class="p-button-text" icon="pi pi-arrow-left" label="Retour" @click="goBack" />
        </div>

        <MainFeedSupabase :key="communityId" :community-id="communityId" />
      </div>
    </main>

    <!-- Sidebar Droite -->
    <template #right>
      <RightSidebar />
    </template>
  </SocialThreeColumnLayout>

  <MobileBottomNav :scrollTarget="mainFeedRef" />
  <Toast />
</template>

<script>
import { computed, ref, onMounted } from "vue";
import { onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import Navbar from "@/components/common/utils/Navbar.vue";
import LeftSidebar from '@/components/social/library/LeftSidebar.vue';
import RightSidebar from '@/components/social/library/RightSidebar.vue';
import MobileBottomNav from '@/components/common/utils/MobileBottomNav.vue';
import MainFeedSupabase from '@/components/social/library/MainFeedSupabase.vue';
import { useAuthStore } from '@/stores/authStore';
import { supabase } from '@/supabase.js';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue';

export default {
  name: "CommunityInfo",
  components: {
    Navbar,
    LeftSidebar,
    RightSidebar,
    MobileBottomNav,
    MainFeedSupabase,
    Button,
    Toast,
    SocialThreeColumnLayout,
  },
  setup() {
    const authStore = useAuthStore();
    const toast = useToast();
    const route = useRoute();
    const router = useRouter();

    const communityId = ref(route.params.id);
    const mainFeedRef = ref(null);
    const community = ref({});
    const memberCount = ref(0);
    const loadingCommunity = ref(false);
    const myCommunityIds = ref(new Set());

    const currentUser = computed(() => authStore.user);

    const getCommunityDescription = (communityRow) =>
      communityRow?.description ?? communityRow?.desc ?? communityRow?.details ?? communityRow?.about ?? '';

    const getCommunityCreatedBy = (communityRow) =>
      communityRow?.created_by ?? communityRow?.createdBy ?? communityRow?.owner_id ?? communityRow?.ownerId ?? null;

    const getCommunityType = (communityRow) => normalizeType(communityRow?.type);

    const normalizeType = (value) => {
      if (value === 'ferme') return 'closed';
      if (value === 'cache') return 'hidden';
      return value || 'public';
    };

    const displayType = (type) => {
      const normalized = normalizeType(type);
      if (normalized === 'closed') return 'Fermé';
      if (normalized === 'hidden') return 'Caché';
      return 'Public';
    };

    const loadCurrentUserMemberships = async () => {
      if (!authStore.user) {
        await authStore.checkAuthState();
      }

      if (!authStore.user?.id) {
        myCommunityIds.value = new Set();
        return;
      }

      const { data, error } = await supabase
        .from('user_communities')
        .select('community_id')
        .eq('user_id', authStore.user.id);

      if (error) {
        console.error('Erreur chargement membership communauté:', error);
        myCommunityIds.value = new Set();
        return;
      }

      myCommunityIds.value = new Set((data || []).map((row) => row.community_id));
    };

    const fetchCommunityInfo = async () => {
      loadingCommunity.value = true;
      try {
        const [{ data: comm, error: commError }, { data: members, error: membersError }] = await Promise.all([
          supabase.from('communities').select('*').eq('id', communityId.value).single(),
          supabase.from('user_communities').select('user_id').eq('community_id', communityId.value),
        ]);

        if (commError) throw commError;
        if (membersError) throw membersError;

        if (!comm) {
          return router.push({ name: 'CommunitiesView' });
        }

        const isHidden = getCommunityType(comm) === 'hidden';
        const isOwner = currentUser.value?.id && currentUser.value.id === getCommunityCreatedBy(comm);
        const isMember = myCommunityIds.value.has(communityId.value);
        if (isHidden && !isOwner && !isMember) {
          toast.add({ severity: 'warn', summary: 'Accès restreint', detail: 'Cette communauté est cachée.', life: 3000 });
          return router.push({ name: 'CommunitiesView' });
        }

        community.value = {
          ...comm,
          description: getCommunityDescription(comm),
          type: getCommunityType(comm),
          created_by: getCommunityCreatedBy(comm),
        };
        memberCount.value = (members || []).length;
      } catch (error) {
        console.error("Erreur lors de la récupération des infos de la communauté :", error);
        router.push({ name: 'CommunitiesView' });
      } finally {
        loadingCommunity.value = false;
      }
    };

    const goBack = () => {
      router.back();
    };

    onMounted(async () => {
      await loadCurrentUserMemberships();
      await fetchCommunityInfo();
    });

    onBeforeRouteUpdate(async (to, from, next) => {
      communityId.value = to.params.id;
      await loadCurrentUserMemberships();
      await fetchCommunityInfo();
      next();
    });

    return {
      communityId,
      mainFeedRef,
      community,
      memberCount,
      currentUser,
      loadingCommunity,
      displayType,
      goBack,
    };
  },
};
</script>

<style scoped>
/* Layout global aligné sur FeedView */
.newsfeed-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr;
  gap: 1.5rem;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

.sidebar-left {
  height: 100%;
  overflow-y: hidden; /* Sidebar statique */
}

.main-feed {
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  box-sizing: border-box;
}

.community-shell {
  width: 100%;
  max-width: 880px;
  margin: 0 auto;
  padding-bottom: 1rem;
}

@media (max-width: 900px) {
  .community-shell {
    max-width: 98vw;
  }
}

.community-header-card {
  margin-bottom: 1rem;
}

/* Masquer la barre de défilement dans le main-feed */
.main-feed::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.main-feed {
  scrollbar-width: none;
}

.sidebar-right {
  height: 100%;
  overflow-y: hidden; /* Sidebar statique */
}

/* Responsiveness */
@media (max-width: 1366px) {
  .newsfeed-layout {
    grid-template-columns: 0.8fr 2.5fr 0.8fr;
    gap: 1rem;
  }
}

@media (max-width: 1200px) {
  .newsfeed-layout {
    grid-template-columns: 0.7fr 2.8fr 0.7fr;
    gap: 0.8rem;
  }
}

@media (max-width: 1024px) {
  .newsfeed-layout {
    grid-template-columns: 1fr 2fr;
  }
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .newsfeed-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
    padding: 0 0.5rem;
    width: 100%;
    max-width: 100vw;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
  }
  .sidebar-left {
    display: none;
  }
  .main-feed {
    overflow-y: auto;
    gap: 0.5rem;
    width: 100%;
    max-width: 100vw;
    margin: 0 auto;
    box-sizing: border-box;
    overflow-x: hidden;
  }
}

@media (max-width: 480px) {
  .newsfeed-layout {
    padding: 0 0.25rem;
    width: 100%;
    max-width: 100vw;
  }
  .main-feed {
    gap: 0.25rem;
    width: 100%;
    max-width: 100vw;
  }
}
</style>
