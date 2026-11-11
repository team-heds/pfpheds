// Isolated frontend-only build. Never exports databases or production secrets.
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
const root = process.cwd()
const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'heds-admin-preview-'))
const archive = path.join(directory, 'source.tar')
execFileSync('/Library/Developer/CommandLineTools/usr/bin/git', ['archive', '--output=' + archive, 'HEAD'])
execFileSync('tar', ['-xf', archive, '-C', directory])
const files = [
  'src/domain/pfp/votationAdminPreview.js',
  'src/service/votationEligibilityService.js',
  'src/views/admin/votations/VotationGenericView.vue',
  'src/components/votation/VotationPlaceCards.vue'
]
if (process.argv.includes('--shared-followup')) files.push(
  'src/views/admin/formation-pratique/secretariat/SuiviCasParticuliers.vue',
  'src/components/admin/SharedStudentFollowUp.vue',
  'src/domain/pfp/caseFollowUpFilters.js'
)
if (process.argv.includes('--annual-directory')) files.push(
  'src/service/studentDirectoryService.js',
  'src/views/admin/formation-pratique/VotationPFPViewPHYFP.vue',
  'src/views/admin/formation-pratique/VotationPrioritaireViewPHYFP.vue'
)
if (process.argv.includes('--admin-password-recovery')) files.push(
  'src/service/adminPasswordRecoveryService.js',
  'src/service/passwordRecoveryService.js',
  'src/views/pages/ResetPassword.vue',
  'src/views/admin/users/UserListView.vue',
  'public/auth-email-templates/password-recovery.html'
)
if (process.argv.includes('--gamification')) files.push(
  'src/App.vue',
  'src/config/levelsConfig.js',
  'src/config/runtimeFeatures.js',
  'src/domain/profile/profilePreferences.js',
  'src/components/admin/AdminDashboardGamification.vue',
  'src/components/admin/UserManagement.vue',
  'src/components/admin/HouseManagement.vue',
  'src/components/user/library/CardNameProfile.vue',
  'src/components/gamification/GamificationProfilePage.vue',
  'src/components/gamification/QuestsPage.vue',
  'src/components/gamification/AchievementsPage.vue',
  'src/components/gamification/BadgeCard.vue',
  'src/components/gamification/ChallengesPage.vue',
  'src/components/gamification/ChallengeCard.vue',
  'src/components/gamification/notifications/GamificationNotification.vue',
  'src/components/social/library/CreateContentMobile.vue',
  'src/components/admin/QuestManagement.vue',
  'src/components/admin/ChallengeManagement.vue',
  'src/components/admin/BadgeManagement.vue',
  'src/service/adminQuestsService.js',
  'src/service/adminChallengesService.js',
  'src/service/adminBadgesService.js',
  'src/service/badgesService.js',
  'src/service/challengesService.js',
  'src/service/gamificationServiceSupabase.js',
  'src/service/gamificationIntegration.js',
  'src/service/gamificationHistoryService.js',
  'src/service/adminGamificationConsoleService.js',
  'src/views/auth/LoginHome.vue',
  'src/config/adminMenu.js'
)
if (process.argv.includes('--firebase-isolation')) files.push(
  'src/App.vue',
  'src/components/common/utils/Navbar.vue',
  'src/router.js',
  'src/router/routes/admin.js',
  'src/stores/authStore.js'
)
for (const file of files) {
  await fs.mkdir(path.dirname(path.join(directory, file)), { recursive: true })
  await fs.copyFile(path.join(root, file), path.join(directory, file))
}
if (process.argv.includes('--firebase-isolation')) {
  for (const file of [
    'src/service/gamificationService.js',
    'src/service/hesHousesService.js',
    'src/service/questsService.js',
    'src/service/defisService.js',
    'src/service/notificationService.js',
    'src/components/gamification/widgets/UserGamificationWidget.vue',
    'src/components/gamification/widgets/GamificationStatsWidget.vue',
    'src/components/gamification/widgets/GamificationActivityWidget.vue',
    'src/views/admin/institutions/gamification/AdminDefisView.vue'
  ]) await fs.rm(path.join(directory, file))
}
await fs.symlink(path.join(root, 'node_modules'), path.join(directory, 'node_modules'))
const values = Object.fromEntries((await fs.readFile('deploy/staging/.env', 'utf8')).trim().split('\n').map(line => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]
}))
const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('VITE_')))
if (process.argv.includes('--production')) {
  const readEnv = async (file) => {
    try {
      return Object.fromEntries((await fs.readFile(file, 'utf8')).split(/\r?\n/).flatMap(line => {
        const trimmed = line.trim()
        const i = trimmed.indexOf('=')
        return !trimmed || trimmed.startsWith('#') || i < 1 ? [] : [[trimmed.slice(0, i), trimmed.slice(i + 1)]]
      }))
    } catch (error) {
      if (error.code === 'ENOENT') return {}
      throw error
    }
  }
  const productionValues = { ...await readEnv('.env'), ...await readEnv('.env.local') }
  Object.assign(env, Object.fromEntries(Object.entries(productionValues).filter(([key]) => key.startsWith('VITE_'))), {
    VITE_SUPABASE_URL: 'https://api2.hedsvs.ch',
    VITE_SUPABASE_REST_URL: 'https://api2.hedsvs.ch/rest/v1',
    VITE_API_URL: 'https://api2.hedsvs.ch/api',
    VITE_API_BASE_URL: 'https://api2.hedsvs.ch/api',
    VITE_BACKEND_URL: 'https://api2.hedsvs.ch',
    VITE_APP_ENV: 'production'
  })
} else {
  Object.assign(env, { VITE_SUPABASE_URL: 'https://test.hedsvs.ch', VITE_SUPABASE_REST_URL: 'https://test.hedsvs.ch/rest/v1', VITE_SUPABASE_KEY: values.STAGING_ANON_KEY, VITE_API_URL: 'https://test.hedsvs.ch/api', VITE_API_BASE_URL: 'https://test.hedsvs.ch/api', VITE_BACKEND_URL: 'https://test.hedsvs.ch' })
  if (process.argv.includes('--gamification')) Object.assign(env, {
    VITE_GAMIFICATION_USER_UI: 'true',
    VITE_GAMIFICATION_HOUSE_QUIZ: 'true',
    VITE_GAMIFICATION_BADGES_CHALLENGES: 'true',
    VITE_GAMIFICATION_GAMES_HUB: 'false',
    VITE_GAMIFICATION_DAILY_WHEEL: 'false',
    VITE_GAMIFICATION_ROM_RUNNER: 'false',
    VITE_GAMIFICATION_TOURNAMENTS: 'false',
    VITE_GAMIFICATION_VENTRIGLISSE: 'false',
    VITE_GAMIFICATION_WORD_OF_DAY: 'false'
  })
}
execFileSync('npm', ['run', 'build'], { cwd: directory, env, stdio: 'inherit' })
console.log('FRONTEND_BUILD=' + directory)
