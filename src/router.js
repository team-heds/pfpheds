import { createRouter, createWebHistory } from 'vue-router';
import { ref as dbRef, get as dbGet } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth } from '../firebase'; // Import your Firebase configuration

// Import your components
import Map from "@/components/Home/Map.vue";
import Institution from "@/components/Home/Institution.vue";
import Place from "@/components/Home/Place.vue";
import Profile from "@/components/Home/Profile.vue";
import Error404 from "@/components/Utils/Error404.vue";
import InstitutionList from "@/components/Dashboard/DashboardList/InstitutionList.vue";
import EtudiantList from "@/components/Dashboard/DashboardList/EtudiantList.vue";
import InstitutionForm from "@/components/Dashboard/DashboardForms/InstitutionForm.vue";
import EtudiantForm from "@/components/Dashboard/DashboardForms/EtudiantForm.vue";
import EtudiantFormModif from "@/components/Dashboard/DashboardForms/EtudiantFormModif.vue";
import InstitutionDetails from "@/components/Dashboard/DashboardDetails/InstitutionDetails.vue";
import InstitutionFormModif from "@/components/Dashboard/DashboardForms/InstitutionFormModif.vue";
import EtudiantDetails from "@/components/Dashboard/DashboardDetails/EtudiantDetails.vue";
import PlaceDetails from "@/components/Dashboard/DashboardDetails/PlaceDetails.vue";
import PFPDetails from "@/components/Dashboard/DashboardDetails/PFPDetails.vue";
import VotationView from "@/components/Dashboard/DashboardDetails/VotationView.vue";
import VotationPreview from "@/components/Dashboard/DashboardDetails/Votation_preview.vue";
import Validation from "@/components/Dashboard/DashboardDetails/Validation.vue";
import Reception from "@/components/Dashboard/DashboardDetails/Reception.vue";
import NewUserForm from "@/components/Dashboard/DashboardForms/NewUserForm.vue";
import NewUserFormModif from "@/components/Dashboard/DashboardForms/NewUserFormModif.vue";
import UserList from "@/components/Dashboard/DashboardList/UserList.vue";
import EnseignentForm from "@/components/Dashboard/DashboardForms/EnseignentForm.vue";
import EnseignentFormModif from "@/components/Dashboard/DashboardForms/EnseignentFormModif.vue";
import EnseignentList from "@/components/Dashboard/DashboardList/EnseignentList.vue";
import PraticienFormateurForm from "@/components/Dashboard/DashboardForms/PraticienFormateurForm.vue";
import PraticienFormateurFormModif from "@/components/Dashboard/DashboardForms/PraticienFormateurFormModif.vue";
import PraticienFormateurList from "@/components/Dashboard/DashboardList/PraticienFormateurList.vue";
import Faq from "@/components/Home/Faq.vue";
import SignUp from "@/components/Utils/SignUp.vue";
import TermsOfUse from "@/components/Utils/TermsOfUse.vue";
import InfoExterne from "@/components/Utils/InfoExterne.vue";
import HomePage from '@/views/pages/HomePage.vue';
import Login from '@/views/pages/auth/Login.vue';
import Register from '@/views/pages/auth/Register.vue';
import DashbordAdmin from '@/views/dashboards/DashbordAdmin.vue';
import ListUser from '@/views/user-management/ListUser.vue';
import InstitutionView from '@/components/Institutions/InstitutionView.vue';
import Management_votation from '@/components/Dashboard/DashboardDetails/Management_votation.vue';
import ManagementPlace from '@/components/Dashboard/DashboardDetails/Management_place.vue';
import VotationLese from '@/components/Dashboard/DashboardDetails/VotationLese.vue';
import LoginHome from '@/components/Utils/LoginHome.vue';
import NewsFeed from '@/components/Social/NewsFeed.vue';
import HashtagPage from '@/components/Social/HashtagPage.vue';
import CommunityManagement from '@/components/Social/CommunityManagement.vue';
import ManageOneCommunity from '@/components/Social/ManageOneCommunity.vue';
import MentionGroupPage from '@/components/Social/MentionGroupPage.vue';
import HistoriquePFP from '@/components/Home/HistoriquePFP.vue'
import DocumentsPFP from '@/components/Home/DocumentsPFP.vue'
import Index from '@/views/apps/tasklist/Index.vue'
import IndexChat from '@/views/apps/chat/IndexChat.vue'

// Define your routes
const routes = [
  { path: '/', component: LoginHome, name: 'LoginHome',   props: true   }, // Fil d'actualité
  { path: '/feed', component: NewsFeed, name: 'NewsFeed',   props: true, meta: { requiresAuth: true } }, // Fil d'actualité
  { path: '/mention/:group', component: MentionGroupPage, name: 'MentionGroupPage', props: true, meta: { requiresAuth: true, requiredRole: true }},
  { path: '/hashtag/:hashtag', component: HashtagPage, name: 'HashtagPage', props: true, meta: { requiresAuth: true } },
  { path: '/home', component: HomePage, name: 'HomePage' },
  { path: '/terms_of_use', component: TermsOfUse, name: 'TermsOfUse', meta: { requiresAuth: true } },
  { path: '/map', component: Map, name: 'Map', meta: { requiresAuth: true } },
  { path: '/institution', component: Institution, name: 'Institution', meta: { requiresAuth: true } },
  { path: '/place', component: Place, name: 'Place', meta: { requiresAuth: true } },
  {
    path: '/profile/:id',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }// Le composant qui gère l'affichage d'un profil utilisateur
  },
  { path: '/admin', component: DashbordAdmin, name: 'DashbordAdmin' , meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] }}, // à remodifier
  { path: '/institution_list', component: InstitutionList, name: 'InstitutionList', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant_list', component: EtudiantList, name: 'EtudiantList',  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution_form', component: InstitutionForm, name: 'InstitutionForm', props: true,  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution_form_modif/:id', component: InstitutionFormModif, name: 'InstitutionFormModif', props: true,  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant_form', component: EtudiantForm, name: 'EtudiantForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant/:etuId/modif', component: EtudiantFormModif, name: 'EtudiantFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution/:id', component: InstitutionView, name: 'InstitutionView', props: true, meta: { requiresAuth: true } },
  { path: '/place_details', component: PlaceDetails, name: 'place-details', meta: { requiresAuth: true } },
  { path: '/pfp_details', component: PFPDetails, name: 'pfp-details', meta: { requiresAuth: true } },
  { path: '/etudiant/:id/details', component: EtudiantDetails, name: 'EtudiantDetails', props: true, meta: { requiresAuth: true } },
  { path: '/new_user_form', component: NewUserForm, name: 'NewUserForm',  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/new_user_form_modif/:userId', component: NewUserFormModif, name: 'NewUserFormModif', props: true,  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/user_list', component: UserList, name: 'UserList',  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_form', component: EnseignentForm, name: 'EnseignentForm',  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_form_modif/:enseignantId', component: EnseignentFormModif, name: 'EnseignentFormModif', props: true,  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_list', component: EnseignentList, name: 'EnseignentList',  meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form', component: PraticienFormateurForm, name: 'PraticienFormateurForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form_modif/:praticienFormateurId', component: PraticienFormateurFormModif, name: 'PraticienFormateurFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_list', component: PraticienFormateurList, name: 'PraticienFormateurList', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/info_externe', component: InfoExterne, name: 'InfoExterne', meta: { requiresAuth: true } },
  { path: '/faq', component: Faq, name: 'Faq', meta: { requiresAuth: true } },
  { path: '/votation_preview', component: VotationPreview, name: 'VotationPreview', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/validation', component: Validation, name: 'Validation', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/reception', component: Reception, name: 'Reception', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/votation', component: VotationView, name: 'VotationView', meta: { requiresAuth: true } },
  { path: '/management_votation', component: Management_votation, name: 'Management_votation', meta: { requiresAuth: true, requiredRole: 'admin' } }, // Protect this route
  { path: '/management_places', component: ManagementPlace, name: 'Management_places',meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/institution_details/:id', component: InstitutionDetails, name: 'InstitutionDetails', props: true, meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', component: Error404, name: 'Error404' },
  { path: '/listUser', component: ListUser, name: 'ListUser', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/votation_lese', component: VotationLese, name: 'VotationLese', meta: { requiresAuth: true } },
  { path: '/historique_pfp', component: HistoriquePFP, name: 'HistoriquePFP', meta: { requiresAuth: true } },
  { path: '/documents_pfp', component: DocumentsPFP, name: 'DocumentsPFP', meta: { requiresAuth: true } },
  { path: '/tasklist', component: Index, name: 'Index', meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] } },
  { path: '/chat', component: IndexChat, name: 'IndexChat', meta: { requiresAuth: true } },
  { path: '/communities', component: CommunityManagement, name: 'CommunityManagement', props: true, meta: { requiresAuth: true } },
  {
    path: '/communities/:id',
    name: 'ManageOneCommunity',
    component: ManageOneCommunity,
    props: true
  },
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Ajouter un guard de navigation
let isAuthStateChecked = false;

router.beforeEach(async (to, from, next) => {
  // Vérifiez si l'état d'authentification est déjà récupéré
  if (!isAuthStateChecked) {
    await new Promise((resolve) => {
      onAuthStateChanged(auth, (user) => {
        isAuthStateChecked = true;
        resolve(user); // Continue une fois que l'état est chargé
      });
    });
  }

  const user = auth.currentUser;

  // Gestion spécifique pour la route "/"
  if (to.path === '/') {
    if (user) {
      // Si l'utilisateur est connecté, redirigez vers /feed
      return next('/feed');
    }
    // Sinon, continuez vers la page de login ("/")
    return next();
  }

  // Gestion des routes nécessitant une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      const userId = user.uid;
      const rolesRef = dbRef(db, `Users/${userId}/Roles`);
      const snapshot = await dbGet(rolesRef);
      const roles = snapshot.val();

      if (roles) {
        const userRoles = Object.keys(roles).filter(role => roles[role]); // Récupération des rôles actifs de l'utilisateur

        if (to.meta.requiredRole) {
          const requiredRoles = Array.isArray(to.meta.requiredRole)
            ? to.meta.requiredRole
            : [to.meta.requiredRole]; // Assurez-vous que `requiredRole` est un tableau

          // Vérifiez si l'utilisateur a au moins un des rôles requis
          if (requiredRoles.some(role => userRoles.includes(role))) {
            return next(); // Autoriser l'accès
          } else {
            alert('Accès refusé : Vous n\'avez pas les permissions requises.');
            return next('/'); // Redirigez vers une page par défaut
          }
        } else {
          return next(); // Aucune vérification de rôle requise, autorisez l'accès
        }
      } else {
        alert('Accès refusé : Aucun rôle trouvé.');
        return next('/'); // Redirigez vers une page par défaut
      }
    } else {
      alert('Vous devez être connecté pour accéder à cette page.');
      return next('/'); // Redirigez vers la page de connexion
    }
  } else {
    return next(); // Aucune authentification requise, autorisez l'accès
  }
});

export default router;
