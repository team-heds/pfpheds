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
import MentionGroupPage from '@/components/Social/MentionGroupPage.vue';
import HistoriquePFP from '@/components/Home/HistoriquePFP.vue'
import DocumentsPFP from '@/components/Home/DocumentsPFP.vue'
import Index from '@/views/apps/tasklist/Index.vue'
import IndexChat from '@/views/apps/chat/IndexChat.vue'

// Define your routes
const routes = [
  { path: '/', component: LoginHome, name: 'LoginHome',   props: true   }, // Fil d'actualité
  { path: '/feed', component: NewsFeed, name: 'NewsFeed',   props: true   }, // Fil d'actualité
  { path: '/mention/:group', component: MentionGroupPage, name: 'MentionGroupPage', props: true, meta: { requiresAuth: true, requiredRole: true }},
  { path: '/hashtag/:hashtag', component: HashtagPage, name: 'HashtagPage', props: true },
  { path: '/home', component: HomePage, name: 'HomePage' },
  { path: '/sign_up', component: SignUp, name: 'sign_up' },
  { path: '/register', component: Register, name: 'register' },
  { path: '/sign_in', component: Login, name: 'login' },
  { path: '/terms_of_use', component: TermsOfUse, name: 'TermsOfUse' },
  { path: '/map', component: Map, name: 'Map' },
  { path: '/institution', component: Institution, name: 'Institution' },
  { path: '/place', component: Place, name: 'Place' },
  { path: '/profile/:id', component: Profile, name: 'Profile' },
  { path: '/admin', component: DashbordAdmin, name: 'DashbordAdmin' , meta: { requiresAuth: false, requiredRole: 'admin' }}, // à remodifier
  { path: '/institution_list', component: InstitutionList, name: 'InstitutionList' },
  { path: '/etudiant_list', component: EtudiantList, name: 'EtudiantList' },
  { path: '/institution_form', component: InstitutionForm, name: 'InstitutionForm', props: true },
  { path: '/institution_form_modif/:id', component: InstitutionFormModif, name: 'InstitutionFormModif', props: true },
  { path: '/etudiant_form', component: EtudiantForm, name: 'EtudiantForm' },
  { path: '/etudiant/:etuId/modif', component: EtudiantFormModif, name: 'EtudiantFormModif', props: true },
  { path: '/institution/:id', component: InstitutionView, name: 'InstitutionView', props: true },
  { path: '/place_details', component: PlaceDetails, name: 'place-details' },
  { path: '/pfp_details', component: PFPDetails, name: 'pfp-details' },
  { path: '/etudiant/:id/details', component: EtudiantDetails, name: 'EtudiantDetails', props: true },
  { path: '/new_user_form', component: NewUserForm, name: 'NewUserForm' },
  { path: '/new_user_form_modif/:userId', component: NewUserFormModif, name: 'NewUserFormModif', props: true },
  { path: '/user_list', component: UserList, name: 'UserList' },
  { path: '/enseignent_form', component: EnseignentForm, name: 'EnseignentForm' },
  { path: '/enseignent_form_modif/:enseignantId', component: EnseignentFormModif, name: 'EnseignentFormModif', props: true },
  { path: '/enseignent_list', component: EnseignentList, name: 'EnseignentList' },
  { path: '/praticien_formateur_form', component: PraticienFormateurForm, name: 'PraticienFormateurForm' },
  { path: '/praticien_formateur_form_modif/:praticienFormateurId', component: PraticienFormateurFormModif, name: 'PraticienFormateurFormModif', props: true },
  { path: '/praticien_formateur_list', component: PraticienFormateurList, name: 'PraticienFormateurList' },
  { path: '/info_externe', component: InfoExterne, name: 'InfoExterne' },
  { path: '/faq', component: Faq, name: 'Faq' },
  { path: '/votation_preview', component: VotationPreview, name: 'VotationPreview' },
  { path: '/validation', component: Validation, name: 'Validation' },
  { path: '/reception', component: Reception, name: 'Reception' },
  { path: '/votation', component: VotationView, name: 'VotationView' },
  { path: '/management_votation', component: Management_votation, name: 'Management_votation', meta: { requiresAuth: true, requiredRole: 'admin' } }, // Protect this route
  { path: '/management_places', component: ManagementPlace, name: 'Management_places',meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/institution_details/:id', component: InstitutionDetails, name: 'InstitutionDetails', props: true },
  { path: '/:pathMatch(.*)*', component: Error404, name: 'Error404' },
  { path: '/listUser', component: ListUser, name: 'ListUser' },
  { path: '/votation_lese', component: VotationLese, name: 'VotationLese' },
  { path: '/historique_pfp', component: HistoriquePFP, name: 'HistoriquePFP' },
  { path: '/documents_pfp', component: DocumentsPFP, name: 'DocumentsPFP' },
  { path: '/tasklist', component: Index, name: 'Index' },
  { path: '/chat', component: IndexChat, name: 'IndexChat' },
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

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      const userId = user.uid;
      const rolesRef = dbRef(db, `Users/${userId}/Roles`);
      const snapshot = await dbGet(rolesRef);
      const roles = snapshot.val();

      if (roles) {
        const userRoles = Object.keys(roles).filter(role => roles[role]);

        if (to.meta.requiredRole) {
          const requiredRole = to.meta.requiredRole;

          // Vérifiez si l'utilisateur a le rôle requis
          if (userRoles.includes(requiredRole)) {
            next(); // Autoriser l'accès
          } else {
            alert('Accès refusé : Vous n\'avez pas les permissions requises.');
            next('/'); // Redirigez vers une page par défaut
          }
        } else {
          next(); // Aucune vérification de rôle requise, autorisez l'accès
        }
      } else {
        alert('Accès refusé : Aucun rôle trouvé.');
        next('/'); // Redirigez vers une page par défaut
      }
    } else {
      alert('Vous devez être connecté pour accéder à cette page.');
      next('/'); // Redirigez vers la page de connexion
    }
  } else {
    next(); // Aucune authentification requise, autorisez l'accès
  }
});



export default router;