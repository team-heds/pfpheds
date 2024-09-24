import { createRouter, createWebHistory } from 'vue-router';
import { ref as dbRef, get as dbGet } from 'firebase/database';
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
import SignIn from "@/components/Utils/SignIn.vue";
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

import NewsFeed from '@/components/Social/NewsFeed.vue';
import UserProfile from '@/components/Social/UserProfile.vue';
import HashtagPage from '@/components/Social/HashtagPage.vue';
import MentionGroupPage from '@/components/Social/MentionGroupPage.vue';

// Define your routes
const routes = [
  { path: '/newsfeed', component: NewsFeed, name: 'NewsFeed' }, // Fil d'actualité
  { path: '/profile/:id', component: UserProfile, name: 'UserProfile', props: true }, // Profil de l'utilisateur
  { path: '/mention/:group', component: MentionGroupPage, name: 'MentionGroupPage', props: true, meta: { requiresAuth: true, requiredRole: true }},

  {
    path: '/hashtag/:hashtag',
    component: HashtagPage,
    name: 'HashtagPage',
    props: true
  },  { path: '/', component: HomePage, name: 'HomePage' },
  { path: '/sign_up', component: SignUp, name: 'sign_up' },
  { path: '/register', component: Register, name: 'register' },
  { path: '/sign_in', component: Login, name: 'login' },
  { path: '/login', component: SignIn, name: 'sign_in' },
  { path: '/terms_of_use', component: TermsOfUse, name: 'TermsOfUse' },
  { path: '/map', component: Map, name: 'Map' },
  { path: '/institution', component: Institution, name: 'Institution' },
  { path: '/place', component: Place, name: 'Place' },
  { path: '/profile', component: Profile, name: 'Profile' },
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
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Add navigation guard


// Add navigation guard
router.beforeEach(async (to, from, next) => {
  const user = auth.currentUser;

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      const userId = user.uid;
      const rolesRef = dbRef(db, `users/${userId}/roles`);
      const snapshot = await dbGet(rolesRef);
      const roles = snapshot.val();

      if (roles) {
        const userRoles = Object.keys(roles).filter(role => roles[role]);

        if (to.name === 'MentionGroupPage') {
          const requiredGroup = to.params.group;

          // Check if the user has a role that matches the required group
          if (userRoles.includes(requiredGroup)) {
            next();  // User has the required role, allow access
          } else {
            alert('Access denied: You do not have the required permissions to view this page.');
            next(false); // Prevent navigation
          }
        } else {
          next();  // If no specific role is required, allow access
        }
      } else {
        alert('Access denied: No roles found.');
        next(false); // Prevent navigation
      }
    } else {
      alert('You must be logged in to access this page.');
      next('/sign_in'); // Redirect to login page
    }
  } else {
    next();  // If no authentication is required, proceed
  }
});


export default router;