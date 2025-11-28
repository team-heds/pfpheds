import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const docsRoot = path.resolve(root, 'documentation', 'docs');

const docs = [
  // Frontend
  'frontend/structure',
  'frontend/routing',
  'frontend/state',
  'frontend/ui',
  'frontend/pwa',
  // Backends - Firebase
  'backend/firebase/overview',
  'backend/firebase/database',
  'backend/firebase/storage',
  'backend/firebase/auth',
  // Backends - Supabase
  'backend/supabase/overview',
  'backend/supabase/services',
  'backend/supabase/rls',
  'backend/supabase/migrations',
  // Data & Migrations
  'data/migration-firebase-supabase',
  'data/schema-supabase',
  'data/multi-system-router',
  // Features
  'features/overview',
  'features/navigation',
  'features/notifications',
  // Administration
  'admin/dashboard',
  'admin/users',
  'admin/institutions-places',
  'admin/votations',
  'admin/validation-reception',
  'admin/scroll-policy',
  // Applications
  'apps/chat',
  'apps/mail',
  'apps/tasklist',
  'apps/calendar',
  'apps/files',
  'apps/notes',
  'apps/events',
  'apps/tools',
  // Gamification
  'gamification/profile',
  'gamification/quests',
  'gamification/challenges',
  'gamification/houses',
  'gamification/admin',
  // Social
  'social/overview',
  'social/communities',
  'social/messaging',
  // Institutions & Carte
  'map/overview',
  'map/institutions',
  'map/places',
  // Médias & Vimeo
  'media/modules',
  'media/vimeo-config',
  'media/media-service',
  // Sécurité & Permissions
  'security/roles',
  'security/route-guards',
  'security/supabase-rls',
  // Déploiement & DevOps
  'devops/firebase-hosting',
  'devops/vps-caddy-nginx',
  'devops/docker-dev',
  'devops/ci-cd',
  'devops/large-files',
  // Tests & Diagnostics
  'testing/supabase-test',
  'testing/firebase-test',
  'testing/diagnostic-tools',
  'testing/scripts',
  // Troubleshooting
  'troubleshooting/firebase-env',
  'troubleshooting/firebase-auth',
  'troubleshooting/env-encoding',
  'troubleshooting/docusaurus-prism',
  // Qualité & Contribution
  'contrib/eslint-prettier',
  'contrib/conventions',
  'contrib/workflow',
  // Root pages
  'roadmap',
  'changelog',
];

const titles = {
  'frontend/structure': 'Structure du frontend',
  'frontend/routing': 'Routing',
  'frontend/state': "Gestion d'état (Pinia)",
  'frontend/ui': 'UI & Design System',
  'frontend/pwa': 'PWA et Performance',

  'backend/firebase/overview': 'Firebase - Vue d\'ensemble',
  'backend/firebase/database': 'Firebase Realtime Database',
  'backend/firebase/storage': 'Firebase Storage',
  'backend/firebase/auth': 'Firebase Auth',

  'backend/supabase/overview': 'Supabase - Vue d\'ensemble',
  'backend/supabase/services': 'Supabase Services',
  'backend/supabase/rls': 'Supabase RLS & Sécurité',
  'backend/supabase/migrations': 'Migrations Supabase',

  'data/migration-firebase-supabase': 'Migration Firebase → Supabase',
  'data/schema-supabase': 'Schéma Supabase',
  'data/multi-system-router': 'Routeur Multi-Systèmes',

  'features/overview': 'Fonctionnalités - Vue d\'ensemble',
  'features/navigation': 'Navigation & Sidebar',
  'features/notifications': 'Notifications',

  'admin/dashboard': 'Dashboard Administration',
  'admin/users': 'Gestion Utilisateurs',
  'admin/institutions-places': 'Institutions & Places',
  'admin/votations': 'Votations',
  'admin/validation-reception': 'Validation & Réception',
  'admin/scroll-policy': 'Politique de scroll Admin',

  'apps/chat': 'App Chat',
  'apps/mail': 'App Mail',
  'apps/tasklist': 'App Tasklist',
  'apps/calendar': 'App Calendar',
  'apps/files': 'App Files',
  'apps/notes': 'App Notes',
  'apps/events': 'App Events',
  'apps/tools': 'Outils',

  'gamification/profile': 'Profil Gamification',
  'gamification/quests': 'Quêtes',
  'gamification/challenges': 'Défis',
  'gamification/houses': 'Maisons HES',
  'gamification/admin': 'Administration Gamification',

  'social/overview': 'Social - Vue d\'ensemble',
  'social/communities': 'Communautés',
  'social/messaging': 'Messagerie',

  'map/overview': 'Carte & Institutions - Vue d\'ensemble',
  'map/institutions': 'Institutions',
  'map/places': 'Places',

  'media/modules': 'Modules & Médias',
  'media/vimeo-config': 'Configuration Vimeo',
  'media/media-service': 'Service Médias',

  'security/roles': 'Rôles & Permissions',
  'security/route-guards': 'Route Guards',
  'security/supabase-rls': 'Supabase RLS',

  'devops/firebase-hosting': 'Firebase Hosting',
  'devops/vps-caddy-nginx': 'VPS: Caddy vs Nginx',
  'devops/docker-dev': 'Docker Dev',
  'devops/ci-cd': 'CI/CD',
  'devops/large-files': 'Gros Fichiers (Archives)',

  'testing/supabase-test': 'Test Supabase',
  'testing/firebase-test': 'Test Firebase',
  'testing/diagnostic-tools': 'Outils de Diagnostic',
  'testing/scripts': 'Scripts',

  'troubleshooting/firebase-env': 'Problèmes Variables Firebase',
  'troubleshooting/firebase-auth': 'Erreur Firebase Auth',
  'troubleshooting/env-encoding': 'Encodage .env',
  'troubleshooting/docusaurus-prism': 'Docusaurus/Prism',

  'contrib/eslint-prettier': 'ESLint & Prettier',
  'contrib/conventions': 'Conventions',
  'contrib/workflow': 'Workflow de Contribution',

  roadmap: 'Roadmap',
  changelog: 'Changelog',
};

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function createStub(docId) {
  const filePath = path.join(docsRoot, `${docId}.md`);
  if (fs.existsSync(filePath)) return false; // do not overwrite
  ensureDir(filePath);
  const title = titles[docId] || docId.split('/').slice(-1)[0];
  const safeTitle = String(title).replace(/"/g, '\\"');
  const content = `---\n` +
    `title: "${safeTitle}"\n` +
    `---\n\n` +
    `Brouillon de documentation pour \`${docId}\`.\n\n` +
    `À compléter.\n`;
  fs.writeFileSync(filePath, content, 'utf8');
  return true;
}

if (!fs.existsSync(docsRoot)) {
  console.error('[generate-doc-stubs] docs root not found:', docsRoot);
  process.exit(1);
}

let created = 0;
for (const doc of docs) {
  if (createStub(doc)) created++;
}
console.log(`[generate-doc-stubs] Created ${created} stub files under ${docsRoot}`);
