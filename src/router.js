import { createRouter, createWebHistory } from 'vue-router';
import { ref as dbRef, get as dbGet } from 'firebase/database';
import { db } from '@/firebase'; // Import your Firebase configuration
import { useAuthStore } from '@/stores/authStore';

// ========================================
// AUTHENTIFICATION & ACCUEIL // View
// ========================================
import LoginHome from '@/views/auth/LoginHome.vue'; // avec firebase
import LoginHome2 from '@/views/auth/LoginHome2.vue' // avec supabase
import NewPasswordView from '@/views/auth/NewPasswordView.vue' // avec supabase
import LoginView from '@/views/auth/LoginView.vue';
import RegisterView from '@/views/auth/RegisterView.vue';

import VerificationView from '@/views/auth/VerificationView.vue';
import LockScreenView from '@/views/auth/LockScreenView.vue';
import AccessView from '@/views/auth/AccessView.vue';
import AuthErrorView from '@/views/auth/AuthErrorView.vue';

// ========================================
// PAGES PRINCIPALES & NAVIGATION
// ========================================
import Map from "@/views/home/MapView.vue";
import Institution from '@/views/institutions/Institution.vue'
import Place from "@/views/institutions/PlaceListView.vue";
import Faq from "@/views/home/FaqView.vue";
import TermsOfUse from "@/views/home/TermsView.vue";
import InfoExterne from "@/views/home/InfoExterneView.vue";
import HistoriquePFP from '@/views/home/HistoryView.vue'
import DocumentsPFP from '@/views/home/DocumentsView.vue'

// ASSOCIATIONS
import AlpinPhysioView from '@/views/associations/AlpinPhysioView.vue'

// MEDIA
import MediaHubPage from '@/views/media/MediaHubPage.vue'
import ModulesPage from '@/views/media/ModulesPage.vue'
import ModuleVideosPage from '@/views/media/ModuleVideosPage.vue'

// PLANNING / CALENDAR
import HomePlanning from '@/views/planning/HomePlanning.vue'
import CalendrierFormationPlein from '@/views/planning/CalendrierFormationPlein.vue'
import CalendrierFormationPleinEdit from '@/views/planning/CalendrierFormationPleinEdit.vue'
import CalendrierSemestriel from '@/views/planning/CalendrierSemestriel.vue'
import CalendrierModule from '@/views/planning/CalendrierModule.vue'
import CalendrierModuleEdit from '@/views/planning/CalendrierModuleEdit.vue'
import CalendrierEnseignant from '@/views/planning/CalendrierEnseignant.vue'
import CalendarMyCourses from '@/views/planning/CalendarMyCourses.vue'
import CalendarMyModules from '@/views/planning/CalendarMyModules.vue'
import CalendarModulesList from '@/views/planning/CalendarModulesList.vue'
import CalendarModuleView from '@/views/planning/CalendarModuleView.vue'
import CalendarCourseView from '@/views/planning/CalendarCourseView.vue'

import VideoValidationPage from '@/views/media/VideoValidationPage.vue'
import ModuleAdminPage from '@/views/media/ModuleAdminPage.vue'
import ModuleAdminPageSimple from '@/views/admin/ModuleAdminPageSimple.vue'
import VimeoTestPage from '@/views/media/VimeoTestPage.vue'

import QrCodeGenerator from '@/components/ui/QrCodeGenerator.vue'


// ========================================
// PROFILS & UTILISATEURS
// ========================================
import Profile from "@/views/users/ProfileView.vue";
import ProfileAdmin from '@/views/admin/ProfileAdminView.vue'
import SettingView from '@/views/users/SettingsView.vue'
import HESHouseQuizView from '@/views/users/HESHouseQuizView.vue'

// ========================================
// GAMIFICATION & MAISONS HES
// ========================================
import HouseStatsPage from '@/components/gamification/HouseStatsPage.vue'
import HousesRankingPage from '@/components/gamification/HousesRankingPage.vue'
import GamificationProfilePage from '@/components/gamification/GamificationProfilePage.vue'
import AchievementsPage from '@/components/gamification/AchievementsPage.vue'
import ChallengesPage from '@/components/gamification/ChallengesPage.vue'
import QuestsPage from '@/components/gamification/QuestsPage.vue'

// ========================================
// DASHBOARD & ADMINISTRATION
// ========================================
import DashboardView from '@/views/admin/DashboardView.vue';
import AdminDefisView from '@/views/admin/institutions/gamification/AdminDefisView.vue';

// ========================================
// GAMIFICATION ADMIN VIEWS
// ========================================
import ChallengeManagementView from '@/views/admin/gamification/ChallengeManagementView.vue';
import QuestManagementView from '@/views/admin/gamification/QuestManagementView.vue';
import BadgeManagementView from '@/views/admin/gamification/BadgeManagementView.vue';
import UserManagementView from '@/views/admin/gamification/UserManagementView.vue';
import HouseManagementView from '@/views/admin/gamification/HouseManagementView.vue';
import AnalyticsDashboardView from '@/views/admin/gamification/AnalyticsDashboardView.vue';

// ========================================
// SOCIAL & COMMUNICATION
// ========================================
import FeedView from '@/views/social/FeedView.vue';
import MentionView from '@/views/social/MentionView.vue';
import HashtagView from '@/views/social/HashtagView.vue';
import CommunitiesView from '@/views/social/CommunitiesView.vue';
import CommunityView from '@/views/social/CommunityView.vue';
import CommunityInfoView from '@/views/social/CommunityInfoView.vue';

// ========================================
// GESTION UTILISATEURS - LISTES
// ========================================

import UserListView from "@/views/admin/users/UserListView.vue";
import StudentListView from "@/views/admin/users/StudentListView.vue";
import TeacherListView from "@/views/admin/users/TeacherListView.vue";
import TrainerListView from "@/views/admin/users/TrainerListView.vue";
import InstitutionListView from "@/views/admin/institutions/InstitutionListView.vue";

// ========================================
// FORMULAIRES DE CRÉATION/MODIFICATION
// ========================================
import NewUserForm from "@/components/admin/forms/NewUserForm.vue";
import NewUserFormModif from "@/components/admin/forms/NewUserFormModif.vue";
import EtudiantForm from "@/components/admin/forms/EtudiantForm.vue";
import EtudiantFormModif from "@/components/admin/forms/EtudiantFormModif.vue";
import EnseignentForm from "@/components/admin/forms/EnseignentForm.vue";
import EnseignentFormModif from "@/components/admin/forms/EnseignentFormModif.vue";
import PraticienFormateurForm from "@/components/admin/forms/PraticienFormateurForm.vue";
import PraticienFormateurFormModif from "@/components/admin/forms/PraticienFormateurFormModif.vue";
import InstitutionForm from "@/components/admin/forms/InstitutionForm.vue";
import InstitutionFormModif from "@/components/admin/forms/InstitutionFormModif.vue";
import AffectationStageEtudiant from '@/components/admin/forms/AffectationStageEtudiant.vue'

// ========================================
// INSTITUTIONS & DÉTAILS
// ========================================
import InstitutionView from '@/views/institutions/InstitutionView.vue';
import InstitutionDetailsView from "@/views/admin/institutions/InstitutionDetailsView.vue";
import EtudiantDetails from "@/components/admin/details/EtudiantDetails.vue";
import PlaceDetails from "@/components/admin/details/PlaceDetails.vue";
import PFPDetails from "@/components/admin/details/PFPDetails.vue";

// ========================================
// VOTATIONS & GESTION
// ========================================
import VotationView from "@/views/admin/votations/VotationView.vue";
import VotationPreview from "@/components/admin/details/Votation_preview.vue";
import VotationPrioritaire from '@/components/admin/details/VotationPrioritaire.vue';
import VotationManagementView from '@/views/admin/votations/VotationManagementView.vue';
import Management_votation_prioritaire from '@/components/admin/details/Management_votation_prioritaire.vue';
import Management_votation_etudiants from '@/components/admin/details/Management_votation_etudiants.vue';

// ========================================
// GESTION DES PLACES & STAGES
// ========================================
import PlaceManagementView from '@/views/admin/places/PlaceManagementView.vue';
import ManagementPlacesSafe from '@/components/admin/details/ManagementPlacesSafe.vue';
import OffreDePlace from '@/components/admin/details/OffreDePlaceBA24PFP2.vue';
import PlaceAssignmentView from '@/views/admin/places/PlaceAssignmentView.vue';
import PlacesAssigned from '@/components/admin/details/PlacesAssigned.vue';
import StageRepartitionBA2 from '@/components/admin/details/StageRepartitionBA2.vue';
import ManagementPFPEnCours from '@/components/admin/details/ManagementPFPEnCours.vue';

// ========================================
// VALIDATION & RÉCEPTION
// ========================================
import ValidationView from "@/views/admin/validation/ValidationView.vue";
import ReceptionView from "@/views/admin/validation/ReceptionView.vue";
import InfoRepondant from "@/components/admin/details/Info_repondant.vue";
import ManagementRepondant from "@/components/admin/details/Management_repondant.vue";
// import StatsPlacePFP from '@/components/admin/details/StatsPlacePFP.vue';
// import ResultPreviewVotation from '@/components/admin/details/ResultPreviewVotation.vue';

// ========================================
// STATISTIQUES & RÉSULTATS
// ========================================
import VotationResultsView from '@/views/admin/votations/VotationResultsView.vue';
import PlaceStatsView from '@/views/admin/places/PlaceStatsView.vue';

// ========================================
// APPLICATIONS & OUTILS
// ========================================
import Index from '@/views/apps/tasklist/Index.vue'
import IndexChat from "@/views/apps/chat/IndexChat.vue";
import CalendarView from '@/views/apps/calendar/CalendarView.vue';
import FilesView from '@/views/apps/files/FilesView.vue';
import MailIndex from '@/views/apps/mail/Index.vue';
import NotesWorkspaceView from '@/views/apps/notes/NotesWorkspaceView.vue';
import EventManagementView from '@/views/apps/events/EventManagementView.vue';
import ToolsView from '@/views/apps/tools/ToolsView.vue';
import GameView from '@/views/apps/tools/GameView.vue';
import ChatBotView from '@/views/apps/tools/ChatBotView.vue';
import MobileToolsView from '@/views/apps/tools/MobileToolsView.vue';
import MobileLangAppsView from '@/views/apps/tools/MobileLangAppsView.vue';
//import MobiprioritairearchView from '@/views/apps/tools/MobiprioritairearchView.vue'
import CreateContentMobile from '@/components/social/library/CreateContentMobile.vue';
import ListComponent from '@/components/media/audio/ListComponent.vue'

import SearchResults from '@/components/common/utils/SearchResults.vue'
import Ventriglisse3D from '@/components/games/Ventriglisse3D.vue'
import CareConvers from '@/views/pages/CareConvers.vue'


// ========================================
// ERREURS & CATCH-ALL
// ========================================
import Error404 from "@/components/common/utils/Error404.vue";
import ResetPassword from '@/views/pages/ResetPassword.vue';

// Define your routes
const routes = [
  // ========================================
  // AUTHENTIFICATION & ACCUEIL
  // ========================================
  { path: '/', component: LoginHome, name: 'LoginHome', props: true },
  { path: '/home', component: LoginHome, name: 'LoginHome', props: true },
  { path: '/home2', component: LoginHome2, name: 'LoginHome2', props: true },
  { path: '/new-password', component: NewPasswordView, name: 'NewPassword' },
  { path: '/login', component: LoginView, name: 'LoginView' },
  { path: '/register', component: RegisterView, name: 'RegisterView' },
  { path: '/reset-password', component: ResetPassword, name: 'ResetPassword', meta: { requiresAuth: false } },

  { path: '/verification', component: VerificationView, name: 'VerificationView' },
  { path: '/lock-screen', component: LockScreenView, name: 'LockScreenView' },
  { path: '/access', component: AccessView, name: 'AccessView' },
  { path: '/auth-error', component: AuthErrorView, name: 'AuthErrorView' },

  // ========================================
  // PAGES PRINCIPALES & NAVIGATION
  // ========================================
  { path: '/map', component: Map, name: 'Map', meta: { requiresAuth: true } },
  { path: '/institution', component: Institution, name: 'Institution', meta: { requiresAuth: true } },
  { path: '/place', component: Place, name: 'Place', meta: { requiresAuth: true } },
  { path: '/faq', component: Faq, name: 'Faq', meta: { requiresAuth: true } },
  { path: '/terms_of_use', component: TermsOfUse, name: 'TermsOfUse', meta: { requiresAuth: true } },
  { path: '/info_externe', component: InfoExterne, name: 'InfoExterne', meta: { requiresAuth: true } },
  { path: '/history', component: HistoriquePFP, name: 'HistoriquePFP', meta: { requiresAuth: true } },
  { path: '/documents', component: DocumentsPFP, name: 'DocumentsPFP', meta: { requiresAuth: true } },

  // ASSOCIATIONS
  { path: '/alpinphysio', component: AlpinPhysioView, name: 'AlpinPhysio', meta: { requiresAuth: false } },

  // Planning / Calendar
  { path: '/home-calendar', component: HomePlanning, name: 'HomeCalendar', meta: { requiresAuth: false } },
  { path: '/calendar', component: HomePlanning, name: 'CalendarHome', meta: { requiresAuth: false } },
  { path: '/calendar/home', component: HomePlanning, name: 'CalendarHomeAlias', meta: { requiresAuth: false } },
  { path: '/calendar/full', component: CalendrierFormationPlein, name: 'CalendrierFormationPlein', meta: { requiresAuth: false } },
  { path: '/calendar/full/edit', component: CalendrierFormationPleinEdit, name: 'CalendrierFormationPleinEdit', meta: { requiresAuth: false } },
  { path: '/calendar/admin', component: CalendrierFormationPleinEdit, name: 'CalendarAdmin', meta: { requiresAuth: false } },
  { path: '/calendar/semester', component: CalendrierSemestriel, name: 'CalendrierSemestriel', meta: { requiresAuth: false } },
  { path: '/calendar/module', component: CalendrierModule, name: 'CalendrierModule', meta: { requiresAuth: false } },
  { path: '/calendar/module/:moduleId/edit', component: CalendrierModuleEdit, name: 'CalendrierModuleEdit', props: true, meta: { requiresAuth: false } },
  { path: '/calendar/teacher', component: CalendrierEnseignant, name: 'CalendrierEnseignant', meta: { requiresAuth: false } },
  { path: '/calendar/my-courses', component: CalendarMyCourses, name: 'CalendarMyCourses', meta: { requiresAuth: false } },
  { path: '/calendar/my-modules', component: CalendarMyModules, name: 'CalendarMyModules', meta: { requiresAuth: false } },
  { path: '/calendar/modules', component: CalendarModulesList, name: 'CalendarModulesList', meta: { requiresAuth: false } },
  { path: '/calendar/module/:moduleId', component: CalendarModuleView, name: 'CalendarModuleView', props: true, meta: { requiresAuth: false } },
  { path: '/calendar/course/:courseId', component: CalendarCourseView, name: 'CalendarCourseView', props: true, meta: { requiresAuth: false } },




  // MEDIA & MULTIMÉDIA
  { path: '/media', component: MediaHubPage, name: 'MediaHubPage', meta: { requiresAuth: true } },
  { path: '/modules', component: ModulesPage, name: 'ModulesPage', meta: { requiresAuth: true } },
  { path: '/modules/:moduleId/videos', component: ModuleVideosPage, name: 'ModuleVideosPage', props: true, meta: { requiresAuth: true } },
  { path: '/videos/:videoId/validation', component: VideoValidationPage, name: 'VideoValidationPage', props: true, meta: { requiresAuth: true } },
  { path: '/admin/modules', component: ModuleAdminPage, name: 'ModuleAdminPage', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/admin/modules/simple', component: ModuleAdminPageSimple, name: 'ModuleAdminPageSimple', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/vimeo-test', component: VimeoTestPage, name: 'VimeoTestPage', meta: { requiresAuth: true } },

  // ========================================
  // PROFILS & UTILISATEURS
  // ========================================
  { path: '/profile/:id', component: Profile, name: 'Profile', meta: { requiresAuth: true } },
  { path: '/profilAdmin/:id', component: ProfileAdmin, name: 'ProfileAdmin', meta: { requiresAuth: true, requiredRole: ['admin'] } },
  { path: '/settings', component: SettingView, name: 'SettingView', meta: { requiresAuth: true } },
  { path: '/hes-house-quiz', component: HESHouseQuizView, name: 'HESHouseQuizView', meta: { requiresAuth: true } },
  { path: '/houses/:houseName/stats', component: HouseStatsPage, name: 'HouseStatsPage', props: true, meta: { requiresAuth: true } },
  { path: '/houses/ranking', component: HousesRankingPage, name: 'HousesRankingPage', meta: { requiresAuth: true } },
  { path: '/gamification-profile', component: GamificationProfilePage, name: 'GamificationProfilePage', meta: { requiresAuth: false } },
  { path: '/achievements', component: AchievementsPage, name: 'AchievementsPage', meta: { requiresAuth: true } },
  { path: '/challenges', component: ChallengesPage, name: 'ChallengesPage', meta: { requiresAuth: true } },
  { path: '/quests', component: QuestsPage, name: 'QuestsPage', meta: { requiresAuth: true } },

  // ========================================
  // DASHBOARD & ADMINISTRATION
  // ========================================
  { path: '/admin', component: DashboardView, name: 'DashboardView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/admin/defis', component: AdminDefisView, name: 'AdminDefisView', meta: { requiresAuth: true, requiredRole: ['admin'] } },
  
  // ========================================
  // GAMIFICATION ADMIN ROUTES
  // ========================================
  { path: '/admin/gamification/challenges', component: ChallengeManagementView, name: 'AdminChallengeManagement', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master'] } },
  { path: '/admin/gamification/quests', component: QuestManagementView, name: 'AdminQuestManagement', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master'] } },
  { path: '/admin/gamification/badges', component: BadgeManagementView, name: 'BadgeManagementView', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master'] } },
  { path: '/admin/gamification/users', component: UserManagementView, name: 'UserManagementView', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master'] } },
  { path: '/admin/gamification/houses', component: HouseManagementView, name: 'HouseManagementView', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master', 'house_coach'] } },
  { path: '/admin/gamification/analytics', component: AnalyticsDashboardView, name: 'AnalyticsDashboardView', meta: { requiresAuth: true, requiredRole: ['admin', 'game_master', 'professor'] } },

  // ========================================
  // GAMIFICATION CREATION ROUTES (PUBLIC)
  // ========================================
  { path: '/create-challenge', component: ChallengeManagementView, name: 'CreateChallenge', meta: { requiresAuth: true } },
  { path: '/create-quest', component: QuestManagementView, name: 'CreateQuest', meta: { requiresAuth: true } },

  // ========================================
  // SOCIAL & COMMUNICATION
  // ========================================
  { path: '/feed', component: FeedView, name: 'FeedView', props: true, meta: { requiresAuth: true } },
  { path: '/mention/:group', component: MentionView, name: 'MentionView', props: true, meta: { requiresAuth: true, requiredRole: true } },
  { path: '/hashtag/:hashtag', component: HashtagView, name: 'HashtagView', props: true, meta: { requiresAuth: true } },
  { path: '/communities', component: CommunitiesView, name: 'CommunitiesView', props: true, meta: { requiresAuth: true } },
  { path: '/communities/:id', component: CommunityView, name: 'CommunityView', props: true },
  { path: '/communities/info/:id', component: CommunityInfoView, name: 'CommunityInfoView' },

  // ========================================
  // GESTION UTILISATEURS - LISTES
  // ========================================

  { path: '/user_list', component: UserListView, name: 'UserListView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant_list', component: StudentListView, name: 'StudentListView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_list', component: TeacherListView, name: 'TeacherListView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_list', component: TrainerListView, name: 'TrainerListView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution_list', component: InstitutionListView, name: 'InstitutionListView', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },

  // ========================================
  // FORMULAIRES DE CRÉATION/MODIFICATION
  // ========================================
  { path: '/new_user_form', component: NewUserForm, name: 'NewUserForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/new_user_form_modif/:userId', component: NewUserFormModif, name: 'NewUserFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant_form', component: EtudiantForm, name: 'EtudiantForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/etudiant/:etuId/modif', component: EtudiantFormModif, name: 'EtudiantFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_form', component: EnseignentForm, name: 'EnseignentForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/enseignent_form_modif/:enseignantId', component: EnseignentFormModif, name: 'EnseignentFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form', component: PraticienFormateurForm, name: 'PraticienFormateurForm', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form_modif/:praticienFormateurId', component: PraticienFormateurFormModif, name: 'PraticienFormateurFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution_form', component: InstitutionForm, name: 'InstitutionForm', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/institution_form_modif/:id', component: InstitutionFormModif, name: 'InstitutionFormModif', props: true, meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/affectation_stage_etudiant', component: AffectationStageEtudiant, name: 'AffectationStageEtudiant', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },

  // ========================================
  // INSTITUTIONS & DÉTAILS
  // ========================================
  { path: '/institution/:id', component: InstitutionView, name: 'InstitutionView', props: true, meta: { requiresAuth: true } },
  { path: '/institution_details/:id', component: InstitutionDetailsView, name: 'InstitutionDetails', props: true, meta: { requiresAuth: true } },
  { path: '/etudiant/:id/details', component: EtudiantDetails, name: 'EtudiantDetails', props: true, meta: { requiresAuth: true } },
  { path: '/place_details', component: PlaceDetails, name: 'place-details', meta: { requiresAuth: true } },
  { path: '/pfp_details', component: PFPDetails, name: 'pfp-details', meta: { requiresAuth: true } },

  // ========================================
  // VOTATIONS & GESTION
  // ========================================
  { path: '/votation', component: VotationView, name: 'VotationView', meta: { requiresAuth: true } },
  { path: '/votation_preview', component: VotationPreview, name: 'VotationPreview', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/votation_prioritaire', component: VotationPrioritaire, name: 'VotationPrioritaire', meta: { requiresAuth: true, requiredRole: 'prioritaire' } },
  { path: '/votation_management', component: VotationManagementView, name: 'VotationManagementView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/management_votation_prioritaire', component: Management_votation_prioritaire, name: 'Management_votation_prioritaire', meta: { requiresAuth: true, requiredRole: 'prioritaire' } },
  { path: '/management_votation_etudiants', component: Management_votation_etudiants, name: 'Management_votation_etudiants', meta: { requiresAuth: true, requiredRole: 'admin' } },

  // ========================================
  // GESTION DES PLACES & STAGES
  // ========================================
  { path: '/management_places', component: PlaceManagementView, name: 'PlaceManagementView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/management_places_safe', component: ManagementPlacesSafe, name: 'ManagementPlacesSafe', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/management_offre', component: OffreDePlace, name: 'Management_offre', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/places_assignment', component: PlaceAssignmentView, name: 'PlaceAssignmentView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/places_assigned', component: PlacesAssigned, name: 'PlacesAssigned', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/stage_repartition', component: StageRepartitionBA2, name: 'StageRepartitionBA2', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/management_pfpencours', component: ManagementPFPEnCours, name: 'ManagementPFPEnCours', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/historique_pfp', component: HistoriquePFP, name: 'HistoriquePFP', meta: { requiresAuth: true } },
  { path: '/documents_pfp', component: DocumentsPFP, name: 'DocumentsPFP', meta: { requiresAuth: true } },

  // ========================================
  // VALIDATION & RÉCEPTION
  // ========================================
  { path: '/validation', component: ValidationView, name: 'ValidationView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/reception', component: ReceptionView, name: 'ReceptionView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/info_repondant', component: InfoRepondant, name: 'InfoRepondant', meta: { requiresAuth: true, requiredRole: ['admin', 'enseignant'] } },
  { path: '/management_repondant', component: ManagementRepondant, name: 'Management_repondant', meta: { requiresAuth: true, requiredRole: 'admin' } },

  // ========================================
  // STATISTIQUES & RÉSULTATS
  // ========================================
  { path: '/result_preview_votation', component: VotationResultsView, name: 'VotationResultsView', meta: { requiresAuth: true, requiredRole: 'admin' } },
  { path: '/stats_place_pfp', component: PlaceStatsView, name: 'PlaceStatsView', meta: { requiresAuth: true, requiredRole: 'admin' } },

  // ========================================
  // APPLICATIONS & OUTILS
  // ========================================
  { path: '/tasklist', component: Index, name: 'Index', meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] } },
  { path: '/chat', component: IndexChat, name: 'IndexChat', meta: { requiresAuth: true } },
  { path: '/calendar', component: CalendarView, name: 'CalendarView', meta: { requiresAuth: true } },
  { path: '/files', component: FilesView, name: 'FilesView', meta: { requiresAuth: true } },
  { path: '/mail', component: MailIndex, name: 'MailIndex', meta: { requiresAuth: true } },
  { path: '/notes', component: NotesWorkspaceView, name: 'NotesWorkspaceView', meta: { requiresAuth: true } },
  { path: '/events', component: EventManagementView, name: 'EventManagementView', meta: { requiresAuth: true } },
  { path: '/event-management', component: EventManagementView, name: 'EventManagement', meta: { requiresAuth: true } },
  { path: '/tools', component: ToolsView, name: 'ToolsView', meta: { requiresAuth: true } },
  { path: '/game', component: GameView, name: 'GameView', meta: { requiresAuth: true } },
  { path: '/chatbot', component: ChatBotView, name: 'ChatBotView', meta: { requiresAuth: true } },
  { path: '/mobile-tools', component: MobileToolsView, name: 'MobileToolsView', meta: { requiresAuth: true } },
  { path: '/mobile-lang-apps', component: MobileLangAppsView, name: 'MobileLangApps', meta: { mobileOnly: true } },
//  { path: '/mobile-search', component: MobiprioritairearchView, name: 'MobiprioritairearchView', meta: { requiresAuth: true } },
//  { path: '/template-test', component: () => import('@/views/template/TemplateTest.vue'), name: 'TemplateTest' },
  { path: '/supabase-demo', component: () => import('@/views/pages/Supabase.vue'), name: 'SupabaseDemo', meta: { requiresAuth: true } },
  { path: '/care-convers', component: CareConvers, name: 'CareConvers', meta: { requiresAuth: true } },
  //{ path: '/template-test', component: () => import('@/views/template/TemplateTest.vue'), name: 'TemplateTest' },

  // ========================================
  // MOBILE SPÉCIFIQUE
  // ========================================
  { path: '/create', component: CreateContentMobile, name: 'CreateContentMobile', meta: { mobileOnly: true } },
  { path: '/mobile-outils', component: MobileToolsView, name: 'MobileToolsView', meta: { mobileOnly: true } },
  //{ path: '/mobile-search-old', component: MobiprioritairearchView, name: 'MobiprioritairearchOld', meta: { mobileOnly: true } },
  { path: '/list', component: ListComponent, name: 'ListComponent', meta: { requiresAuth: true, requiredRole: ['editor', 'admin'] } },

  // ========================================
  // ROUTES SPÉCIALES & LAZY LOADING
  // ========================================
  { path: '/validate-pfp1a', component: () => import('@/components/admin/details/ValidatePFP1A.vue'), name: 'ValidatePFP1A', meta: { requiresAuth: true, requiredRole: ['admin', 'editor'] } },
  { path: '/ventriglisse3d', component: Ventriglisse3D, name: 'Ventriglisse3D', meta: { requiresAuth: false } },
  { path: '/qr', component: () => import('@/components/ui/QrCodeGenerator.vue'), name: 'QRCodePage', meta: { requiresAuth: false } },
  { path: '/notes', component: NotesWorkspaceView, name: 'NotesWorkspaceView', meta: { requiresAuth: true } },
  { path: '/outils', component: ToolsView, name: 'ToolsView', meta: { requiresAuth: true } },
  { path: '/game', component: GameView, name: 'GameView', meta: { requiresAuth: true } },
  { path: '/chatbotsi', component: ChatBotView, name: 'ChatBotSI', meta: { requiresAuth: true, requiredRole: ['admin', 'chatbotSi'] } },

  // ========================================
  // ERREURS & CATCH-ALL
  // ========================================
  { path: '/:pathMatch(.*)*', component: Error404, name: 'Error404' }
];

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Ajouter un guard de navigation
let isAuthStateChecked = false;

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  console.log(`🧭 Navigation vers: ${to.path} depuis: ${from.path}`);
  
  // Vérifiez si l'état d'authentification est déjà récupéré
  if (!isAuthStateChecked) {
    console.log('🔄 Première vérification de l\'état d\'authentification...');
    await authStore.checkAuthState();
    isAuthStateChecked = true;
  }

  const user = authStore.user;
  console.log('👤 Utilisateur actuel:', user ? `${user.email} (${authStore.authProvider})` : 'Aucun');

  // Gestion spécifique pour la route "/"
  if (to.path === '/') {
    if (user) {
      // Si l'utilisateur est connecté, redirigez vers /feed
      return next('/feed');
    }
    // Sinon, continuez vers la page de login ("/")
    return next('/home');
  }

  // Gestion des routes nécessitant une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      // Pour Firebase, on vérifie les rôles dans la DB Firebase
      // Pour Supabase, on peut soit utiliser les métadonnées utilisateur soit une autre logique
      let roles = null;
      
      if (authStore.isFirebaseUser) {
        const userId = user.uid;
        console.log('Firebase user ID:', userId);
        const rolesRef = dbRef(db, `Users/${userId}/Roles`);
        const snapshot = await dbGet(rolesRef);
        roles = snapshot.val();
        console.log('Firebase roles:', roles);
      } else if (authStore.isSupabaseUser) {
        // Pour Supabase, on peut utiliser les métadonnées ou une table de rôles
        console.log('Supabase user:', user);
        // Pour l'instant, on autorise l'accès pour les utilisateurs Supabase
        // Vous pouvez implémenter une logique de rôles spécifique à Supabase ici
        roles = { user: true }; // Rôle par défaut pour Supabase
      }

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
            console.warn('Accès refusé: Vous n\'avez pas les permissions requises pour accéder à cette page.');
            alert('Accès refusé: Vous n\'avez pas les permissions requises.');
            return next('/'); // Redirigez vers une page par défaut
          }
        } else {
          return next(); // Aucune vérification de rôle requise, autorisez l'accès
        }
      } else {
        // Si pas de rôles trouvés mais utilisateur connecté via Supabase, on autorise l'accès de base
        if (authStore.isSupabaseUser) {
          return next();
        }
        import('primevue/usetoast').then(({ useToast }) => {
          const toast = useToast();
          toast.add({ severity: 'error', summary: 'Accès refusé', detail: 'Aucun rôle trouvé.', life: 4000 });
        });
        return next('/home'); // Redirigez vers une page par défaut
      }
    } else {
      import('primevue/usetoast').then(({ useToast }) => {
        const toast = useToast();
        toast.add({ severity: 'warn', summary: 'Connexion requise', detail: 'Vous devez être connecté pour accéder à cette page.', life: 4000 });
      });
      return next('/'); // Redirigez vers la page de connexion
    }
  } else {
    return next(); // Aucune authentification requise, autorisez l'accès
  }
});

export default router;
