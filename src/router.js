import { createRouter, createWebHistory } from 'vue-router';
import { ref as dbRef, get as dbGet } from 'firebase/database';
import { db } from '@/firebase'; // Import your Firebase configuration
import { useAuthStore } from '@/stores/authStore';
import rolesService from '@/service/rolesService';
import { useRoleStore } from '@/stores/role';
import { addDynamicRoutesToRouter } from '@/composables/useDynamicRoutes';
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
import PushView from "@/views/home/Pushview.vue";
import PushView2 from "@/views/home/Pushview2.vue";
import InfoExterne from "@/views/home/InfoExterneView.vue";
import HistoriquePFP from '@/views/home/HistoryView.vue'
import DocumentsPFP from '@/views/home/DocumentsView.vue'
import RoleManagement from '@/views/home/RoleManagement.vue'
import RouterView from '@/views/home/RouterView.vue'
import PermissionsView from '@/views/home/PermissionsView.vue'
import DynamicRoutesEditorView from '@/views/home/DynamicRoutesEditorView.vue'

// PFP MANAGEMENT
import ManagementPFPEnCoursView from '@/views/admin/pfp/ManagementPFPEnCoursView.vue'
import ManagementVotationPrioritaireView from '@/views/admin/pfp/ManagementVotationPrioritaireView.vue'
import ManagementOffreView from '@/views/admin/pfp/ManagementOffreView.vue'
import VotationEtudiantsView from '@/views/admin/pfp/VotationEtudiantsView.vue'
import PlacesAssignedView from '@/views/admin/pfp/PlacesAssignedView.vue'
import ManagementPlacesView from '@/views/admin/pfp/ManagementPlacesView.vue'
import ManagementRepondantView from '@/views/admin/pfp/ManagementRepondantView.vue'
import PlacesAssignmentView from '@/views/admin/pfp/PlacesAssignmentView.vue'
import GanttPFPView from '@/views/admin/pfp/GanttPFPView.vue'
import ValidatePFP1AView from '@/views/admin/pfp/ValidatePFP1AView.vue'
import InfoRepondantView from '@/views/admin/pfp/InfoRepondantView.vue'
import ResultPreviewVotationView from '@/views/admin/pfp/ResultPreviewVotationView.vue'

// FORMATION PRATIQUE PHYSIO
import DashboardFormationPratiqueView from '@/views/admin/formation-pratique/DashboardFormationPratiqueViewPHYFP.vue'
import FPEtudiantsView from '@/views/admin/formation-pratique/EtudiantsViewPHYFP.vue'
import FPInstitutionsView from '@/views/admin/formation-pratique/InstitutionsViewPHYFP.vue'
import FPPraticiensFormateurView from '@/views/admin/formation-pratique/PraticiensFormateurViewPHYFP.vue'
import FPPlacesView from '@/views/admin/formation-pratique/PlacesViewPHYFP.vue'
import FPProfilEtudiantsView from '@/views/admin/formation-pratique/ProfilEtudiantsViewPHYFP.vue'
import FPProfilRepondantEnseignantView from '@/views/admin/formation-pratique/ProfilRepondantEnseignantViewPHYFP.vue'
import FPGanttPFPFormationView from '@/views/admin/formation-pratique/GanttPFPFormationViewPHYFP.vue'
import FPAdminSecretariatView from '@/views/admin/formation-pratique/AdminSecretariatViewPHYFP.vue'
import FPManagementRepondantCPTView from '@/views/admin/formation-pratique/ManagementRepondantCPTViewPHYFP.vue'
import FPManagementFeuilleDeChargeRepondantCPTView from '@/views/admin/formation-pratique/ManagementFeuilleDeChargeRepondantCPTViewPHYFP.vue'
import FPOffreDePlaceView from '@/views/admin/formation-pratique/OffreDePlaceViewPHYFP.vue'
import FPPreviewPFPView from '@/views/admin/formation-pratique/PreviewPFPViewPHYFP.vue'
import FPResultatVotationPrioritaireView from '@/views/admin/formation-pratique/ResultatVotationPrioritaireViewPHYFP.vue'
import FPResultatVotationPFPView from '@/views/admin/formation-pratique/ResultatVotationPFPViewPHYFP.vue'
import FPManagementRepondantVotationView from '@/views/admin/formation-pratique/ManagementRepondantVotationViewPHYFP.vue'
import FPValiderEchecPFPView from '@/views/admin/formation-pratique/ValiderEchecPFPViewPHYFP.vue'
import FPVotationPrioritaireView from '@/views/admin/formation-pratique/VotationPrioritaireViewPHYFP.vue'
import FPVotationPFPView from '@/views/admin/formation-pratique/VotationPFPViewPHYFP.vue'

// ADMIN LISTS
import ProgramListView from '@/views/admin/lists/ProgramListView.vue'
import ModuleListView from '@/views/admin/lists/ModuleListView.vue'
import UserRoleListView from '@/views/admin/lists/UserRoleListView.vue'

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
import AdminSettingsView from '@/views/admin/SettingsView.vue'
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
import DiagnosticGamificationView from '@/views/DiagnosticGamificationView.vue'

// ========================================
// DASHBOARD & ADMINISTRATION
// ========================================
import DashboardView from '@/views/admin/DashboardView.vue'
import AdminDashboardGeneral from '@/components/admin/AdminDashboardGeneral.vue'
import AdminDashboardPFP from '@/components/admin/AdminDashboardPFP.vue'
import AdminDashboardAcademique from '@/components/admin/AdminDashboardAcademique.vue'
import AdminDashboardGamification from '@/components/admin/AdminDashboardGamification.vue'
import DashboardRMView from '@/views/admin/DashboardRMView.vue'
import DashboardEnseignantView from '@/views/admin/DashboardEnseignantView.vue'
import PlanningView from '@/views/admin/planning/PlanningView.vue'
import PlanningAdminView from '@/views/admin/planning/PlanningAdminView.vue'
import AcademicYearManagement from '@/views/admin/AcademicYearManagement.vue'
import AcademicKanbanView from '@/views/admin/academic/AcademicKanbanView.vue'
// MediaContentView est obsolète - redirigé vers VideoLibraryView
import AdminDefisView from '@/views/admin/institutions/gamification/AdminDefisView.vue';
import SupabaseDiagnosticView from '@/views/admin/SupabaseDiagnosticView.vue';
import RBACAdminView from '@/views/admin/security/RBACAdminView.vue'

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
import TeachersSIView from '@/views/admin/users/TeachersSIView.vue'
import ManageUserRoles from '@/views/admin/users/ManageUserRoles.vue'

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
import TournoisView from '@/views/apps/tools/TournoisView.vue';
import TournoiDetailsView from '@/views/apps/tools/TournoiDetailsView.vue';
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
  { path: '/push', component: PushView, name: 'PushView', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/push2', component: PushView, name: 'PushView2', meta: { requiresAuth: true, need: 'page2.access' } },
  { path: '/role-management', component: RoleManagement, name: 'RoleManagement', meta: { requiresAuth: true } },
  { path: '/router-inspector', component: RouterView, name: 'RouterInspector', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/permissions', component: PermissionsView, name: 'PermissionsView', meta: { requiresAuth: true, need: 'admin' } },

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
  { path: '/admin/modules', component: ModuleAdminPage, name: 'ModuleAdminPage', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/modules/simple', component: ModuleAdminPageSimple, name: 'ModuleAdminPageSimple', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/vimeo-test', component: VimeoTestPage, name: 'VimeoTestPage', meta: { requiresAuth: true } },

  // ========================================
  // PROFILS & UTILISATEURS
  // ========================================
  { path: '/profile/:id', component: Profile, name: 'Profile', meta: { requiresAuth: true } },
  { path: '/profilAdmin/:id', component: ProfileAdmin, name: 'ProfileAdmin', meta: { requiresAuth: true, need: ['admin', 'house_coach'] } },
  { path: '/settings', component: SettingView, name: 'SettingView', meta: { requiresAuth: true } },
  { path: '/hes-house-quiz', component: HESHouseQuizView, name: 'HESHouseQuizView', meta: { requiresAuth: true } },
  { path: '/houses/:houseName/stats', component: HouseStatsPage, name: 'HouseStatsPage', props: true, meta: { requiresAuth: true } },
  { path: '/houses/ranking', component: HousesRankingPage, name: 'HousesRankingPage', meta: { requiresAuth: true } },
  { path: '/gamification-profile/:id', component: GamificationProfilePage, name: 'GamificationProfilePage', props: true, meta: { requiresAuth: true } },
  { path: '/achievements', component: AchievementsPage, name: 'AchievementsPage', meta: { requiresAuth: true } },
  { path: '/challenges', component: ChallengesPage, name: 'ChallengesPage', meta: { requiresAuth: true } },
  { path: '/quests', component: QuestsPage, name: 'QuestsPage', meta: { requiresAuth: true } },
  { path: '/diagnostic-gamification', component: DiagnosticGamificationView, name: 'DiagnosticGamificationView', meta: { requiresAuth: true } },

  // ========================================
  // DASHBOARD & ADMINISTRATION 
  // ========================================
  { path: '/admin', component: DashboardView, name: 'DashboardView', meta: { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },
  { path: '/admin/dashboard-general', component: AdminDashboardGeneral, name: 'AdminDashboardGeneral', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/dashboard-rm', component: DashboardRMView, name: 'DashboardRM', meta: { requiresAuth: true, need: ['admin', 'RMSoins.access'] } },
  { path: '/admin/dashboard-enseignant', component: DashboardEnseignantView, name: 'DashboardEnseignant', meta: { requiresAuth: true, need: ['admin', 'EnseignantSoins.access', 'EnseignantPhysio.access'] } },
  { path: '/admin/dashboard-pfp', component: AdminDashboardPFP, name: 'AdminDashboardPFP', meta: { requiresAuth: true } },
  { path: '/admin/dashboard-academique', component: AdminDashboardAcademique, name: 'AdminDashboardAcademique', meta: { requiresAuth: true } },
  { path: '/admin/dashboard-gamification', component: AdminDashboardGamification, name: 'AdminDashboardGamification', meta: { requiresAuth: true } },
  { path: '/admin/settings', component: AdminSettingsView, name: 'AdminSettingsView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/supabase-diagnostic', component: SupabaseDiagnosticView, name: 'SupabaseDiagnosticView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/defis', component: AdminDefisView, name: 'AdminDefisView', meta: { requiresAuth: true, need: ['admin', 'house_coach'] } },
  { path: '/admin/security/rbac', component: RBACAdminView, name: 'RBACAdmin', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/routes-editor', component: DynamicRoutesEditorView, name: 'DynamicRoutesEditor', meta: { requiresAuth: true, need: ['super.all','admin'] } },
  
  // PFP Management Routes
  { path: '/management_pfpencours', component: ManagementPFPEnCoursView, name: 'ManagementPFPEnCoursView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/management_votation_prioritaire', component: ManagementVotationPrioritaireView, name: 'ManagementVotationPrioritaire', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/management_offre', component: ManagementOffreView, name: 'ManagementOffre', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/management_votation_etudiants', component: VotationEtudiantsView, name: 'VotationEtudiants', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/places_asssigned', component: PlacesAssignedView, name: 'PlacesAssigned', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/management_place', component: ManagementPlacesView, name: 'ManagementPlaces', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/management_repondant', component: ManagementRepondantView, name: 'ManagementRepondant', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/places_assignment', component: PlacesAssignmentView, name: 'PlacesAssignment', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/gantt', component: GanttPFPView, name: 'GanttPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/validate-pfp1a', component: ValidatePFP1AView, name: 'ValidatePFP1A', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/info_repondant', component: InfoRepondantView, name: 'InfoRepondant', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/result_preview_votation', component: ResultPreviewVotationView, name: 'ResultPreviewVotation', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // ========================================
  // FORMATION PRATIQUE PHYSIO ROUTES
  // ========================================
  { path: '/admin/formation-pratique/dashboard', component: DashboardFormationPratiqueView, name: 'DashboardFormationPratique', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // Section Données
  { path: '/admin/formation-pratique/etudiants', component: FPEtudiantsView, name: 'FPEtudiants', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/institutions', component: FPInstitutionsView, name: 'FPInstitutions', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/praticiens-formateur', component: FPPraticiensFormateurView, name: 'FPPraticiensFormateur', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/places', component: FPPlacesView, name: 'FPPlaces', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // Section Admin
  { path: '/admin/formation-pratique/profil-etudiants', component: FPProfilEtudiantsView, name: 'FPProfilEtudiants', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/profil-repondant-enseignant', component: FPProfilRepondantEnseignantView, name: 'FPProfilRepondantEnseignant', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/gantt-pfp', component: FPGanttPFPFormationView, name: 'FPGanttPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/admin-secretariat', component: FPAdminSecretariatView, name: 'FPAdminSecretariat', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/management-repondant-cpt', component: FPManagementRepondantCPTView, name: 'FPManagementRepondantCPT', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/management-feuille-charge-cpt', component: FPManagementFeuilleDeChargeRepondantCPTView, name: 'FPManagementFeuilleChargeCPT', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // Section Période de Formation pratique
  { path: '/admin/formation-pratique/offre-place', component: FPOffreDePlaceView, name: 'FPOffrePlace', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/preview-pfp', component: FPPreviewPFPView, name: 'FPPreviewPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/resultat-votation-prioritaire', component: FPResultatVotationPrioritaireView, name: 'FPResultatVotationPrioritaire', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/resultat-votation-pfp', component: FPResultatVotationPFPView, name: 'FPResultatVotationPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/management-repondant-votation', component: FPManagementRepondantVotationView, name: 'FPManagementRepondantVotation', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/valider-echec-pfp', component: FPValiderEchecPFPView, name: 'FPValiderEchecPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // Section Votations
  { path: '/admin/formation-pratique/votation-prioritaire', component: FPVotationPrioritaireView, name: 'FPVotationPrioritaire', meta: { requiresAuth: true, need: 'page1.access' } },
  { path: '/admin/formation-pratique/votation-pfp', component: FPVotationPFPView, name: 'FPVotationPFP', meta: { requiresAuth: true, need: 'page1.access' } },
  
  // Admin Lists Routes
  { path: '/admin/programs', component: ProgramListView, name: 'ProgramList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/modules', component: ModuleListView, name: 'ModuleList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/user-roles', component: UserRoleListView, name: 'UserRoleList', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/teachers-si', component: TeachersSIView, name: 'TeachersSIView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/manage-user-roles', component: ManageUserRoles, name: 'ManageUserRoles', meta: { requiresAuth: true, need: 'admin' } },
  
  // Planning académique
  { path: '/admin/planning', component: PlanningView, name: 'PlanningView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/manage', component: PlanningAdminView, name: 'PlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/years', component: AcademicYearManagement, name: 'AcademicYearManagement', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/admin/planning/weekly', component: () => import('@/views/admin/planning/WeeklyPlanningAdminView.vue'), name: 'WeeklyPlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/semester', component: () => import('@/views/admin/planning/SemesterPlanningAdminView.vue'), name: 'SemesterPlanningAdminView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/planning/annual', component: () => import('@/views/admin/planning/AnnualPlanningView.vue'), name: 'AnnualPlanningView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  // Gestion académique (Kanban & Contenu)
  { path: '/admin/academic/tickets', component: () => import('@/views/admin/academic/TicketListView.vue'), name: 'TicketListView' },
  { path: '/admin/academic/kanban', component: AcademicKanbanView, name: 'AcademicKanbanView' },
  { path: '/admin/academic/calendar', component: () => import('@/views/admin/academic/AcademicCalendarView.vue'), name: 'AcademicCalendarView' },
  { path: '/admin/academic/video-library', component: () => import('@/views/admin/academic/VideoLibraryView.vue'), name: 'VideoLibraryView' },
  // Redirection de media-content vers video-library (composant obsolète)
  { path: '/admin/academic/media-content', redirect: '/admin/academic/video-library' },
  
  // ========================================
  // GESTION DES COURS
  // ========================================
  { path: '/admin/courses/list', component: () => import('@/views/admin/courses/CourseListView.vue'), name: 'CourseListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/create', component: () => import('@/views/admin/courses/CourseCreateView.vue'), name: 'CourseCreateView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/:id', component: () => import('@/views/admin/courses/CourseDetailView.vue'), name: 'CourseDetailView', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/admin/courses/:id/edit', component: () => import('@/views/admin/courses/CourseEditView.vue'), name: 'CourseEditView', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  
  // ========================================
  // OUTILS ADMIN
  // ========================================
  { path: '/admin/tools/feedbacka', component: () => import('@/views/admin/tools/FeedbackaView.vue'), name: 'FeedbackaView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  
  // ========================================
  // GAMIFICATION ADMIN ROUTES
  // ========================================

  

  { path: '/admin/gamification/challenges', component: ChallengeManagementView, name: 'AdminChallengeManagement', meta:  { requiresAuth: true,  need:  ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio'] }},
  { path: '/admin/gamification/quests', component: QuestManagementView, name: 'AdminQuestManagement', meta:      { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },
  { path: '/admin/gamification/badges', component: BadgeManagementView, name: 'BadgeManagementView', meta:         { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },
  { path: '/admin/gamification/users', component: UserManagementView, name: 'UserManagementView', meta: 
         { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },
  { path: '/admin/gamification/houses', component: HouseManagementView, name: 'HouseManagementView', meta:
         { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },

  { path: '/admin/gamification/analytics', component: AnalyticsDashboardView, name: 'AnalyticsDashboardView', meta: 
         { requiresAuth: true,  need: ['super.all', 'admin' , 'AdminPhysio',  'EnseignantPhysio' ] } },


  // ========================================
  // GAMIFICATION CREATION ROUTES (PUBLIC)
  // ========================================
  { path: '/create-challenge', component: ChallengeManagementView, name: 'CreateChallenge', meta: { requiresAuth: true } },
  { path: '/create-quest', component: QuestManagementView, name: 'CreateQuest', meta: { requiresAuth: true } },

  // ========================================
  // SOCIAL & COMMUNICATION
  // ========================================
  { path: '/feed', component: FeedView, name: 'FeedView', props: true, meta: { requiresAuth: true } },
  { path: '/mention/:group', component: MentionView, name: 'MentionView', props: true, meta: { requiresAuth: true } },
  { path: '/hashtag/:hashtag', component: HashtagView, name: 'HashtagView', props: true, meta: { requiresAuth: true } },
  { path: '/communities', component: CommunitiesView, name: 'CommunitiesView', props: true, meta: { requiresAuth: true } },
  { path: '/communities/:id', component: CommunityView, name: 'CommunityView', props: true },
  { path: '/communities/info/:id', component: CommunityInfoView, name: 'CommunityInfoView' },

  // ========================================
  // GESTION UTILISATEURS - LISTES
  // ========================================

  { path: '/user_list', component: UserListView, name: 'UserListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant_list', component: StudentListView, name: 'StudentListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_list', component: TeacherListView, name: 'TeacherListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_list', component: TrainerListView, name: 'TrainerListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_list', component: InstitutionListView, name: 'InstitutionListView', meta: { requiresAuth: true, need: ['admin', 'editor'] } },

  // ========================================
  // FORMULAIRES DE CRÉATION/MODIFICATION
  // ========================================
  { path: '/new_user_form', component: NewUserForm, name: 'NewUserForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/new_user_form_modif/:userId', component: NewUserFormModif, name: 'NewUserFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant_form', component: EtudiantForm, name: 'EtudiantForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/etudiant/:etuId/modif', component: EtudiantFormModif, name: 'EtudiantFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_form', component: EnseignentForm, name: 'EnseignentForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/enseignent_form_modif/:enseignantId', component: EnseignentFormModif, name: 'EnseignentFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form', component: PraticienFormateurForm, name: 'PraticienFormateurForm', meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/praticien_formateur_form_modif/:praticienFormateurId', component: PraticienFormateurFormModif, name: 'PraticienFormateurFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_form', component: InstitutionForm, name: 'InstitutionForm', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/institution_form_modif/:id', component: InstitutionFormModif, name: 'InstitutionFormModif', props: true, meta: { requiresAuth: true, need: ['admin', 'editor'] } },
  { path: '/affectation_stage_etudiant', component: AffectationStageEtudiant, name: 'AffectationStageEtudiant', meta: { requiresAuth: true, need: ['admin', 'editor'] } },

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
  { path: '/votation', component: VotationView, name: 'VotationView', meta: { requiresAuth: true, need: 'BA24' } },
  { path: '/votation_preview', component: VotationPreview, name: 'VotationPreview', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/votation_prioritaire', component: VotationPrioritaire, name: 'VotationPrioritaire', meta: { requiresAuth: true, need: 'prioritaire' } },
  { path: '/votation_management', component: VotationManagementView, name: 'VotationManagementView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/management_votation_prioritaire', component: Management_votation_prioritaire, name: 'Management_votation_prioritaire', meta: { requiresAuth: true, need: 'prioritaire' } },
  { path: '/management_votation_etudiants', component: Management_votation_etudiants, name: 'Management_votation_etudiants', meta: { requiresAuth: true, need: 'admin' } },

  // ========================================
  // GESTION DES PLACES & STAGES
  // ========================================
  { path: '/management_places_safe', component: ManagementPlacesSafe, name: 'ManagementPlacesSafe', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/management_offre', component: OffreDePlace, name: 'Management_offre', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/places_assignment', component: PlaceAssignmentView, name: 'PlaceAssignmentView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/places_assigned', component: PlacesAssigned, name: 'PlacesAssigned', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/stage_repartition', component: StageRepartitionBA2, name: 'StageRepartitionBA2', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/management_pfpencours2', component: ManagementPFPEnCours, name: 'ManagementPFPEnCours', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/historique_pfp', component: HistoriquePFP, name: 'HistoriquePFP', meta: { requiresAuth: true } },
  { path: '/documents_pfp', component: DocumentsPFP, name: 'DocumentsPFP', meta: { requiresAuth: true } },

  // ========================================
  // VALIDATION & RÉCEPTION
  // ========================================
  { path: '/validation', component: ValidationView, name: 'ValidationView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/reception', component: ReceptionView, name: 'ReceptionView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/info_repondant', component: InfoRepondant, name: 'InfoRepondant', meta: { requiresAuth: true, need: ['admin', 'enseignant'] } },
  { path: '/management_repondant', component: ManagementRepondant, name: 'Management_repondant', meta: { requiresAuth: true, need: 'admin' } },

  // ========================================
  // STATISTIQUES & RÉSULTATS
  // ================ ========================
  { path: '/result_preview_votation', component: VotationResultsView, name: 'VotationResultsView', meta: { requiresAuth: true, need: 'admin' } },
  { path: '/stats_place_pfp', component: PlaceStatsView, name: 'PlaceStatsView', meta: { requiresAuth: true, need: 'admin' } },

  // ========================================
  // APPLICATIONS & OUTILS
  // ========================================
  { path: '/tasklist', component: Index, name: 'Index', meta: { requiresAuth: true, need: ['editor', 'admin'] } },
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
  { path: '/tournois', component: TournoisView, name: 'TournoisView', meta: { requiresAuth: true } },
  { path: '/tournois/:id', component: TournoiDetailsView, name: 'TournoiDetailsView', meta: { requiresAuth: true } },
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

const DEFAULT_NEED = 'authenticated';
routes.forEach(r => {
  // Ensure meta exists
  if (!r.meta) r.meta = {};

  const hasNeed = !(r.meta.need === undefined || r.meta.need === null);
  const requires = !!r.meta.requiresAuth;

  if (!hasNeed) {
    r.meta.need = requires ? DEFAULT_NEED : 'public';
  }
});

// Create router instance
const router = createRouter({
  history: createWebHistory(),
  routes
});

// Ajouter un guard de navigation
let isAuthStateChecked = false;
let dynamicRoutesLoaded = false;

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  const roleStore = useRoleStore();
  console.log(`🧭 Navigation vers: ${to.path} depuis: ${from.path}`);
  
  // 🔥 Charger les routes dynamiques depuis Supabase au premier appel
  if (!dynamicRoutesLoaded) {
    console.log('🔄 Chargement des routes dynamiques depuis Supabase...');
    try {
      await addDynamicRoutesToRouter(router);
      dynamicRoutesLoaded = true;
      console.log('✅ Routes dynamiques chargées');
      
      // Si la route demandée existe maintenant, y naviguer
      if (router.hasRoute(to.name) && to.name !== from.name) {
        console.log(`🔄 Re-navigation vers ${to.path} après chargement des routes`);
        return next({ ...to, replace: true });
      }
    } catch (error) {
      console.error('❌ Erreur chargement routes dynamiques:', error);
      // Continuer même en cas d'erreur pour ne pas bloquer l'app
    }
  }
  
  // Vérifiez si l'état d'authentification est déjà récupéré
  if (!isAuthStateChecked) {
    console.log('🔄 Première vérification de l\'état d\'authentification...');
    await authStore.checkAuthState();
    isAuthStateChecked = true;
  }
  // Initialiser le roleStore si nécessaire
if (!roleStore.initialized) {
  await roleStore.init();
}
  
  const user = authStore.user;
  console.log('👤 Utilisateur actuel:', user ? `${user.email} (${authStore.authProvider})` : 'Aucun');
  console.log('🔍 Debug authStore:', {
    user: authStore.user,
    provider: authStore.authProvider,
    isLoggedIn: authStore.isLoggedIn,
    isSupabaseUser: authStore.isSupabaseUser,
    isFirebaseUser: authStore.isFirebaseUser
  });
  
  // Afficher les permissions depuis Supabase
  console.log('🔐 Permissions Supabase:', {
    initialized: roleStore.initialized,
    session: roleStore.session,
    perms: roleStore.perms,
    isSuper: roleStore.isSuper,
    canPage1: roleStore.can('page1.access'),
    canPage2: roleStore.can('page2.access'),
    allPermissions: roleStore.perms
  });

  // Gestion spécifique pour la route "/"
  if (to.path === '/') {
    if (user) {
      // Si l'utilisateur est connecté, redirigez vers /feed
      return next('/feed');
    }
    // Sinon, continuez vers la page de login ("/")
    return next('/home');
  }

  // Vérification des permissions basées sur le roleStore
const need = to.meta.need;
console.log("check", need);
  console.log("Vérification permission");
  console.log("Vérification permission need", need);
  console.log(" Vérification permission user", user);

// Autoriser immédiatement si 'public' ou 'anonymous'
const allowAnon = Array.isArray(need)
  ? (need.includes('public') || need.includes('anonymous'))
  : (need === 'public' || need === 'anonymous');
if (allowAnon) {
  return next();
}

// Si une permission est requise et qu'aucun utilisateur, rediriger vers login
if (need && !user) {
  console.warn('❌ Accès refusé: authentification requise pour cette page');
  return next('/');
}

if (need) {
  const canAccess = Array.isArray(need)
    ? (roleStore.isSuper || need.some(n => roleStore.can(n)))
    : (roleStore.isSuper || roleStore.can(need));

  console.log(`🔍 Vérification permission pour ${to.path}:`, {
    need,
    user: user ? user.email : null,
    perms: roleStore.perms,
    canAccess,
    isSuper: roleStore.isSuper
  });

  console.log("check" + (Array.isArray(need) ? need.join(',') : need));
  if (!canAccess) {
    console.warn(`❌ Accès refusé: permission requise "${Array.isArray(need) ? need.join(',') : need}" manquante`);
    return next({ path: '/access' });
  }
  console.log(`✅ Accès autorisé pour ${Array.isArray(need) ? need.join(',') : need}`);
}

  // Vérification des rôles (schéma historique) via meta.requiredRole
  const requiredRoles = to.meta.requiredRole;
  if (requiredRoles && user) {
    const rolesArray = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const hasRequired = roleStore.isSuper || rolesArray.some(r => roleStore.can(r));
    console.log('🔑 Vérification requiredRole:', { requiredRoles: rolesArray, hasRequired, user: user.email });
    if (!hasRequired) {
      console.warn(`❌ Accès refusé: rôle requis manquant parmi [${rolesArray.join(', ')}]`);
      return next({ path: '/access' });
    }
  }

  // Gestion des routes nécessitant une authentification
  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (user) {
      // Si pas de rôle requis, autoriser directement l'accès
      if (!to.meta.requiredRole) {
        console.log('✅ Accès autorisé: utilisateur connecté, aucun rôle spécifique requis');
        return next();
      }
      
      // Sinon, vérifier les rôles
      const userId = authStore.isFirebaseUser ? user.uid : user.id;
      const provider = authStore.authProvider;
      
      console.log(`🔑 Vérification des rôles pour ${provider} user ID:`, userId);
      
      // Récupération des rôles via le service unifié
      const roles = await rolesService.getUserRoles(userId, provider);
      console.log(`📋 Rôles récupérés (${provider}):`, roles);

      if (roles && Object.keys(roles).length > 0) {
        const userRoles = Object.keys(roles).filter(role => roles[role]); // Récupération des rôles actifs de l'utilisateur

        const requiredRoles = Array.isArray(to.meta.requiredRole)
          ? to.meta.requiredRole
          : [to.meta.requiredRole];

        // Vérifiez si l'utilisateur a au moins un des rôles requis
        if (requiredRoles.some(role => userRoles.includes(role))) {
          console.log(`✅ Accès autorisé: utilisateur a le(s) rôle(s) requis`);
          return next();
        } else {
          console.warn(`❌ Accès refusé: rôles requis ${requiredRoles.join(', ')}, rôles utilisateur: ${userRoles.join(', ')}`);
          alert('Accès refusé: Vous n\'avez pas les permissions requises.');
          return next('/');
        }
      } else {
        // Pas de rôles trouvés mais rôle requis
        console.warn('⚠️ Aucun rôle trouvé pour cet utilisateur');
        import('primevue/usetoast').then(({ useToast }) => {
          const toast = useToast();
          toast.add({ severity: 'error', summary: 'Accès refusé', detail: 'Aucun rôle trouvé.', life: 4000 });
        });
        return next('/home');
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