const colorGroups = [
  {
    title: 'Marque HEdS',
    description: 'Le jaune porte les actions principales. Le bleu nuit structure les grandes surfaces.',
    colors: [
      ['Jaune HEdS', 'var(--app-color-brand)', '#F3C300'],
      ['Jaune — survol', 'var(--app-color-brand-hover)', '#D9AD00'],
      ['Bleu nuit', 'var(--surface-ground)', '#0B213F'],
      ['Surface profonde', 'var(--surface-card)', '#071426'],
    ],
  },
  {
    title: 'Texte et structure',
    description: 'Les variables du thème PrimeVue restent la source de vérité des composants.',
    colors: [
      ['Texte principal', 'var(--text-color)', 'rgba(255,255,255,.87)'],
      ['Texte secondaire', 'var(--text-color-secondary)', 'rgba(255,255,255,.6)'],
      ['Bordure', 'var(--surface-border)', '#30445F'],
      ['Survol', 'var(--surface-hover)', '#132D4F'],
    ],
  },
  {
    title: 'États',
    description: 'Les couleurs sémantiques complètent la marque sans remplacer le jaune HEdS.',
    colors: [
      ['Information', 'var(--app-color-info)', '#2563EB'],
      ['Succès', 'var(--app-color-success)', '#15803D'],
      ['Avertissement', 'var(--app-color-warning)', '#C2410C'],
      ['Erreur', 'var(--app-color-danger)', '#DC2626'],
    ],
  },
]

const typeScale = [
  ['Titre de page', 'var(--app-font-size-page-title)', '700'],
  ['Titre de section', 'var(--app-font-size-2xl)', '600'],
  ['Titre de composant', 'var(--app-font-size-xl)', '600'],
  ['Texte courant', 'var(--app-font-size-md)', '400'],
  ['Libellé', 'var(--app-font-size-sm)', '600'],
  ['Métadonnée', 'var(--app-font-size-xs)', '500'],
]

export default {
  title: 'Fondations/Charte HEdS',
  tags: ['autodocs'],
}

export const Couleurs = {
  render: () => ({
    setup: () => ({ colorGroups }),
    template: `
      <div class="storybook-stack">
        <section v-for="group in colorGroups" :key="group.title" class="storybook-section">
          <div>
            <h2 style="margin:0 0 .35rem">{{ group.title }}</h2>
            <p style="margin:0;color:var(--text-color-secondary)">{{ group.description }}</p>
          </div>
          <div class="storybook-grid">
            <article v-for="color in group.colors" :key="color[0]" style="overflow:hidden;border-radius:var(--app-radius-xl);background:var(--surface-card);box-shadow:var(--app-shadow-sm)">
              <div :style="{height:'7rem',background:color[1]}" />
              <div style="padding:1rem">
                <strong style="display:block;margin-bottom:.2rem">{{ color[0] }}</strong>
                <code style="font-size:.75rem;color:var(--text-color-secondary)">{{ color[2] }}</code>
              </div>
            </article>
          </div>
        </section>
      </div>
    `,
  }),
}

export const Typographie = {
  render: () => ({
    setup: () => ({ typeScale }),
    template: `
      <div class="storybook-stack storybook-surface">
        <div>
          <h1 style="margin:0 0 .5rem;font-size:var(--app-font-size-page-title)">Poppins pour l’interface HEdS</h1>
          <p style="max-width:65ch;margin:0;color:var(--text-color-secondary)">Une hiérarchie compacte et lisible pour les interfaces métier, les formulaires et les tableaux de données.</p>
        </div>
        <div v-for="type in typeScale" :key="type[0]" style="display:grid;grid-template-columns:minmax(8rem,12rem) 1fr;gap:1rem;align-items:baseline;padding-block:1rem;border-top:1px solid var(--surface-border)">
          <span style="color:var(--text-color-secondary);font-size:.8rem">{{ type[0] }}</span>
          <span :style="{fontSize:type[1],fontWeight:type[2],lineHeight:'1.25'}">Haute École de Santé</span>
        </div>
      </div>
    `,
  }),
}

export const FormesEtEspacements = {
  render: () => ({
    template: `
      <div class="storybook-stack">
        <section class="storybook-section">
          <h2>Rayons</h2>
          <div class="storybook-component-row">
            <div v-for="item in [['Petit','var(--app-radius-sm)'],['Moyen','var(--app-radius-md)'],['Large','var(--app-radius-lg)'],['Très large','var(--app-radius-xl)']]" :key="item[0]" :style="{borderRadius:item[1],background:'var(--surface-card)',padding:'1.5rem',minWidth:'9rem',boxShadow:'var(--app-shadow-sm)'}">{{ item[0] }}</div>
          </div>
        </section>
        <section class="storybook-section">
          <h2>Échelle d’espacement</h2>
          <div style="display:grid;gap:.75rem">
            <div v-for="size in [1,2,3,4,5,6,8,10,12]" :key="size" style="display:flex;align-items:center;gap:1rem">
              <code style="width:3rem;color:var(--text-color-secondary)">{{ size }}</code>
              <span :style="{display:'block',height:'.75rem',width:'var(--app-space-' + size + ')',background:'var(--app-color-brand)',borderRadius:'2px'}" />
            </div>
          </div>
        </section>
      </div>
    `,
  }),
}
