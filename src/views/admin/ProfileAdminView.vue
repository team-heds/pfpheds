<template>
  <AdminLayout>
  <div class="page-wrapper">
    <div class="profile-admin-page">
      <!-- Indicateur de chargement -->
      <div v-if="isLoading" class="col-12">
        <div class="card">
          <div class="text-center p-6">
            <i class="pi pi-spin pi-spinner text-4xl text-primary mb-3"></i>
            <p class="text-600 m-0">Chargement du profil...</p>
          </div>
        </div>
      </div>

      <!-- Contenu en fonction de l'onglet actif, affiché quand le chargement est terminé -->
      <div v-else class="col-12">
        <!-- On utilise "profileKey" comme clé afin de forcer la recréation des composants -->
        <ProfileInfoAdmin v-if="activeTab === 0" :user="user" :key="profileKey" />
        <!-- DocumentsUserProfile désactivé (utilise Storage) -->
        <!-- <DocumentsUserProfile v-if="activeTab === 1" :key="profileKey" /> -->
        <ResumStageUserProfile v-if="activeTab === 2" :user="user" :key="profileKey" />
        <ChatProfil v-if="activeTab === 3" :key="profileKey" />
      </div>
    </div>
  </div>
  </AdminLayout>
</template>

<script>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { supabase } from '@/supabase';
import { useRoute, useRouter } from 'vue-router';

import ProfileInfoAdmin from '@/components/user/details/ProfileInfoAdmin.vue'
import ResumStageUserProfile from '@/components/user/details/ResumStageUserProfile.vue'
// import DocumentsUserProfile from '@/components/user/details/DocumentsUserProfile.vue' // Désactivé (utilise Storage)
import ChatProfil from '@/components/user/details/ChatProfil.vue'

export default {
  name: 'ProfilAdmin',
  components: {
    AdminLayout,
    ProfileInfoAdmin,
    ResumStageUserProfile,
    // DocumentsUserProfile, // Désactivé
    ChatProfil
    },
  setup() {
    const route = useRoute();
    const router = useRouter();

    // Onglet actif dans la vue (0: infos, 1: documents, 2: résumé, 3: chat)
    const activeTab = ref(0);

    // Chemin vers l'avatar par défaut
    const defaultAvatar = '@/assets/images/avatar/01.jpg';

    // Objet réactif pour stocker les informations de l'utilisateur sélectionné
    const user = reactive({
      uid: '',
      nom: '',
      prenom: '',
      bio: '',
      email: '',
      photoURL: '',
      ville: '',
      canton: '',
    });

    // Clé utilisée pour forcer le rechargement des composants enfants
    const profileKey = ref(0);

    // Liste de tous les utilisateurs (pour la sélection par l'administrateur)
    const usersList = ref([]);
    // ID de l'utilisateur actuellement sélectionné dans le menu déroulant
    const selectedUserId = ref(null);

    // Terme de recherche saisi par l'administrateur
    const searchTerm = ref('');

    // Indicateur de chargement
    const isLoading = ref(false);

    // Liste filtrée en fonction du terme de recherche
    const filteredUsers = computed(() => {
      if (!searchTerm.value) return usersList.value;
      return usersList.value.filter(u => {
        const fullName = (u.prenom + ' ' + u.nom).toLowerCase();
        return fullName.includes(searchTerm.value.toLowerCase());
      });
    });

    /**
     * Récupère le profil d'un utilisateur depuis Supabase à partir de son ID.
     * Combine user_profiles (infos de base) et StudentsPhysio (infos étudiant) côté client
     */
    const fetchUserProfileById = async (userId) => {
      try {
        // 1) user_profiles
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) {
          console.warn('user_profiles introuvable:', profileError.message);
        }

        if (profile) {
          user.uid = userId;
          user.nom = profile.family_name || '';
          user.prenom = profile.forname || '';
          user.email = profile.email || '';
          user.ville = profile.city || '';
          user.bio = profile.bio || '';
          user.photoURL = profile.avatar_url || defaultAvatar;
        }

        // 2) StudentsPhysio
        const { data: student, error: studentError } = await supabase
          .from('StudentsPhysio')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (studentError) {
          console.warn('StudentsPhysio introuvable:', studentError.message);
        }

        if (student) {
          user.canton = student.canton || '';
          user.studentData = {
            class: student.class,
            pfp1a: student.pfp1a,
            pfp_valided: student.pfp_valided,
            pfpinfo: student.pfpinfo,
            aigu: student.aigu,
            ambu: student.ambu,
            msq: student.msq,
            neuroger: student.neuroger,
            rehab: student.rehab,
            sysint: student.sysint,
            sae: student.sae,
            fr: student.fr,
            de: student.de,
            it: student.it,
            eng: student.eng,
            all_lang: student.all_lang
          };
        } else {
          user.studentData = undefined;
        }

        // Incrémente la clé pour forcer le rechargement des composants
        profileKey.value++;
      } catch (error) {
        console.error("Erreur lors de la récupération du profil :", error);
      }
    };

    /**
     * Récupère la liste des utilisateurs depuis user_profiles
     * et complète avec la classe depuis StudentsPhysio si disponible
     */
    const fetchAllUsers = async () => {
      try {
        // 1) user_profiles (liste de base)
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, forname, family_name, email')
          .order('forname', { ascending: true });

        if (profilesError) throw profilesError;

        if (profiles && profiles.length > 0) {
          const allUsers = profiles.map((uData) => ({
            uid: uData.user_id,
            prenom: uData.forname || '',
            nom: uData.family_name || '',
            email: uData.email || '',
            class: ''
          }));

          // 2) Compléter avec StudentsPhysio (classe)
          const ids = profiles.map((p) => p.user_id);
          if (ids.length > 0) {
            const { data: spList, error: spError } = await supabase
              .from('StudentsPhysio')
              .select('user_id, class')
              .in('user_id', ids);

            if (!spError && spList) {
              const classMap = spList.reduce((acc, row) => {
                acc[row.user_id] = row.class || '';
                return acc;
              }, {});
              allUsers.forEach((u) => {
                u.class = classMap[u.uid] || '';
              });
            }
          }

          usersList.value = allUsers;

          // Vérifier si un ID est fourni dans l'URL
          const routeUserId = route.params.id;
          if (routeUserId && allUsers.find((u) => u.uid === routeUserId)) {
            selectedUserId.value = routeUserId;
          } else if (allUsers.length > 0) {
            selectedUserId.value = allUsers[0].uid;
          }
          // Charge le profil du premier utilisateur sélectionné
          isLoading.value = true;
          await fetchUserProfileById(selectedUserId.value);
          isLoading.value = false;
        } else {
          console.warn("Aucun utilisateur trouvé (user_profiles).");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs :", error);
      }
    };

    /**
     * Gère le changement de l'utilisateur sélectionné par l'administrateur.
     * Se contente de mettre à jour l'URL ; le watch se chargera de recharger le profil.
     */
    const handleUserChange = () => {
      if (selectedUserId.value) {
        router.push({ name: 'ProfileAdmin', params: { id: selectedUserId.value } });
      }
    };


    // Au montage, charger la liste des utilisateurs et sélectionner celui de l'URL (si présent)
    onMounted(async () => {
      await fetchAllUsers();
    });

    // Observer les changements de l'ID dans la route et mettre à jour le profil affiché
    watch(
      () => route.params.id,
      async (newId) => {
        if (newId) {
          isLoading.value = true;
          await fetchUserProfileById(newId);
          isLoading.value = false;
        }
      }
    );


    return {
      activeTab,
      user,
      usersList,
      selectedUserId,
      handleUserChange,
      searchTerm,
      filteredUsers,
      isLoading,
      profileKey,
    };
  },
};
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.profile-admin-page {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .profile-admin-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>
