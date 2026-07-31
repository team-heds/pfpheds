import { architectureMap, chapter, slide, stackCards, techGrid, timeline } from './helpers.js'

export const projetsMetierSlides = [
  chapter(
    'projets-metier',
    2,
    'Les deux projets métier',
    `<p>Les deux domaines répondent à des problèmes concrets différents. Les expliquer séparément évite de confondre les règles de stage avec les règles de planning académique.</p>`,
    [
      slide(
        'Formation Pratique · Physiothérapie',
        `<p class="callout">Question centrale : comment placer chaque étudiant en physiothérapie dans un stage clinique adapté, dans une institution partenaire, de manière équitable et traçable ?</p>
        ${stackCards([
          ['PFP', 'Stages cliniques', 'Organisation des périodes PFP 1 à 4, rattrapages et périodes spécifiques.', ['étudiants', 'places', 'périodes'], 'var(--tt-color-green-dec-1)', 'var(--tt-color-highlight-green)'],
          ['Inst', 'Partenaires terrain', 'Gestion des institutions, praticiens formateurs, enseignants et offres.', ['institutions', 'PF', 'offres'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['Vote', 'Attribution équitable', 'Préférences, votations standard ou prioritaires, validation et conventions.', ['votation', 'équité', 'signature'], 'var(--tt-color-text-orange)', 'var(--tt-color-highlight-orange)'],
        ])}`,
      ),
      slide(
        'Flux PFP : de l’offre à l’attribution',
        `${timeline([
          ['Offres', 'Les institutions proposent les places et contraintes.'],
          ['Votation', 'Les étudiants expriment leurs préférences selon les règles.'],
          ['Attribution', 'La plateforme applique équité, priorités et cas particuliers.'],
          ['Convention', 'Les décisions validées deviennent traçables et signables.'],
        ])}
        ${techGrid([
          ['Standard', 'Processus régulier d’expression des préférences et d’attribution.'],
          ['Prioritaire', 'Traitement des étudiants lésés ou des situations sensibles.'],
          ['Historique', 'Trace datée des changements, absences, échecs et validations.'],
        ])}`,
        '',
        { className: 'workflow-slide' },
      ),
      slide(
        'Suivi administratif et alertes PFP',
        `<p>Le domaine inclut les évaluations, notes, conventions, signatures, centre d'alertes, changements de dates ou d'institutions, absences, échecs, étudiants SAE et cas particuliers. Ces éléments imposent une traçabilité stricte.</p>`,
      ),
      slide(
        'Projet Académique · Soins infirmiers',
        `<p class="callout">Question centrale : comment organiser les cours, les enseignants, les salles et la charge de travail académique sur plusieurs échelles de planning ?</p>
        ${stackCards([
          ['Plan', 'Planning académique', 'Organisation journalière, hebdomadaire, semestrielle et annuelle.', ['cours', 'classes', 'salles'], 'var(--tt-color-text-blue)', 'var(--tt-color-highlight-blue)'],
          ['Mod', 'Structure pédagogique', 'Années académiques, modules, mini-briques et activités.', ['modules', 'briques', 'activités'], 'var(--tt-brand-color-600)', 'var(--tt-brand-color-50)'],
          ['Load', 'Charge enseignante', 'Calcul et pilotage des charges par enseignant, module et classe.', ['45 min', 'coefficients', 'pilotage'], 'var(--tt-color-text-purple)', 'var(--tt-color-highlight-purple)'],
        ])}`,
      ),
      slide(
        'Charge et pilotage académique',
        `<p>La feuille de charges calcule et expose les charges par enseignant, module, classe et activité. Le référentiel Pilier 1.1 introduit des périodes de 45 minutes et des coefficients de pondération qui doivent rester explicitement contrôlables.</p>`,
      ),
      slide(
        'Extension attendue',
        `<p>La partie Formation Pratique doit être étendue aux Soins infirmiers. Cette extension ne doit pas être un simple copier-coller : elle doit reprendre les concepts communs tout en respectant les règles propres à la filière.</p>
        ${architectureMap([
          ['assets/images/element/lego.svg', 'Concepts communs', 'Étudiants, partenaires, règles, validations et historique.'],
          ['assets/images/element/medical.svg', 'Règles spécifiques', 'Contraintes cliniques et équité propres aux stages.'],
          ['assets/images/element/data-science.svg', 'Traçabilité', 'Décisions, changements et cas particuliers datés.'],
        ])}`,
      ),
    ].join(''),
  ),
]
