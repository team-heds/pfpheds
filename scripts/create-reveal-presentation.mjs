import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const args = process.argv.slice(2)

function readArg(name, fallback = '') {
  const index = args.indexOf(`--${name}`)
  if (index === -1) return fallback
  return args[index + 1] ?? fallback
}

function toSlug(value) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toIdentifier(slug) {
  return `${slug.replace(/-([a-z0-9])/g, (_, letter) => letter.toUpperCase())}Slides`
}

const rawSlug = readArg('slug')
const title = readArg('title', rawSlug)
const slug = toSlug(rawSlug)

if (!slug || !title) {
  console.error('Usage: npm run presentation:new -- --slug mon-cours --title "Mon cours"')
  process.exit(1)
}

const slidesDir = resolve(process.cwd(), 'presentation', 'src', 'slides', 'custom')
const targetFile = resolve(slidesDir, `${slug}.js`)

if (existsSync(targetFile)) {
  console.error(`Le fichier existe déjà: ${targetFile}`)
  process.exit(1)
}

mkdirSync(slidesDir, { recursive: true })

writeFileSync(
  targetFile,
  `export const ${toIdentifier(slug)} = [
  \`
    <section class="chapter-slide" data-chapter="custom">
      <p class="chapter-kicker"><span></span>Nouveau cours</p>
      <h1>${title}</h1>
      <p class="lead">Remplacer ce texte par l’objectif principal du support.</p>
      <div class="pill-row">
        <span>Objectif</span>
        <span>Public</span>
        <span>À retenir</span>
      </div>
    </section>
  \`,
  \`
    <section>
      <h2>Objectifs pédagogiques</h2>
      <div class="card-grid">
        <article class="course-card">
          <span class="tech-logo">1</span>
          <h3>Comprendre</h3>
          <p>Décrire ce que les participants doivent comprendre.</p>
        </article>
        <article class="course-card">
          <span class="tech-logo">2</span>
          <h3>Pratiquer</h3>
          <p>Décrire ce que les participants doivent savoir faire.</p>
        </article>
        <article class="course-card">
          <span class="tech-logo">3</span>
          <h3>Retenir</h3>
          <p>Décrire les messages clés du support.</p>
        </article>
      </div>
    </section>
  \`,
  \`
    <section>
      <h2>Plan du cours</h2>
      <div class="timeline">
        <div class="timeline-item"><strong>1</strong><span>Contexte</span></div>
        <div class="timeline-item"><strong>2</strong><span>Démonstration</span></div>
        <div class="timeline-item"><strong>3</strong><span>À retenir</span></div>
      </div>
    </section>
  \`,
  \`
    <section class="chapter-slide">
      <p class="chapter-kicker"><span></span>Conclusion</p>
      <h1>À retenir</h1>
      <p class="lead">Résumer les décisions, les points de vigilance et les prochaines étapes.</p>
    </section>
  \`,
]
`,
  'utf8',
)

const catalogExample = `{
  id: '${slug}',
  slug: '${slug}',
  order: 20,
  title: '${title}',
  eyebrow: 'Cours technique',
  description: 'Résumé court du support.',
  path: '/presentation/${slug}/',
  pdfPath: '/presentation/${slug}/${slug}.pdf',
  status: 'draft',
  statusLabel: 'Brouillon',
  category: 'technique',
  categoryLabel: 'Technique',
  duration: '30–45 min',
  level: 'Intermédiaire',
  audience: ['Admins'],
  tags: ['Reveal.js'],
  icon: 'pi pi-desktop',
  updatedAt: '2026-08-03',
}`

console.log(`Présentation créée: ${targetFile}`)
console.log('')
console.log('Entrée catalogue à adapter dans src/config/presentationCatalog.js:')
console.log(catalogExample)
console.log('')
console.log('Étapes suivantes:')
console.log('1. Importer ces slides dans presentation/src/presentation.js')
console.log('2. Ajouter/adapter l’entrée catalogue')
console.log('3. Tester avec npm run presentation:dev puis npm run presentation:test')
console.log('4. Publier avec npm run build:all puis le script de déploiement')
