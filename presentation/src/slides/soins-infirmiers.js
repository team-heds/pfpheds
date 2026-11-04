import { chapter, slide } from './helpers.js'

const nurseImage = '/presentation/assets/nurse-cover.jpg'

const stepFlow = (items, className = '') => `<div class="si-step-flow ${className}">${items
  .map(([number, title, detail]) => `<article><span>${number}</span><strong>${title}</strong><small>${detail}</small></article>`)
  .join('')}</div>`

const roleRows = (items) => `<div class="si-role-rows">${items
  .map(([role, action, scope]) => `<article><strong>${role}</strong><span>${action}</span><small>${scope}</small></article>`)
  .join('')}</div>`

const sourceMap = (items) => `<div class="si-source-map">${items
  .map(([title, detail, use]) => `<article><strong>${title}</strong><span>${detail}</span><small>${use}</small></article>`)
  .join('')}</div>`

const exampleBars = (items) => `<div class="si-bars">${items
  .map(([label, value, detail, tone = 'blue']) => `<article><span>${label}</span><div><i class="${tone}" style="--bar:${value}%"></i></div><strong>${detail}</strong></article>`)
  .join('')}</div>`

const decisionRows = (items) => `<div class="si-decision-rows">${items
  .map(([signal, response, owner]) => `<article><span>${signal}</span><strong>${response}</strong><small>${owner}</small></article>`)
  .join('')}</div>`

export const soinsInfirmiersSlides = [
  `<section id="accueil" data-name="accueil" class="title-slide si-cover">
    <div class="si-cover-copy">
      <p class="chapter-label">Présentation métier</p>
      <h1>Le système Soins infirmiers</h1>
      <p class="title-lead">Du cadre académique au planning, des postulations enseignantes à la feuille de charges.</p>
      <div class="si-cover-line" aria-label="Résumé du workflow">
        <span>Structurer</span><span>Planifier</span><span>Attribuer</span><span>Piloter</span>
      </div>
      <div class="hero-actions">
        <a href="#/sommaire" data-start-fullscreen>Présenter en plein écran</a>
        <a href="soins-infirmiers.pdf">Télécharger le PDF</a>
      </div>
    </div>
    <div
      class="si-cover-photo"
      role="img"
      aria-label="Professionnelle des soins infirmiers"
      style="background-image: url('${nurseImage}')"
    ></div>
    <aside class="notes">Présenter la plateforme comme un système de coordination académique. Le sujet principal concerne l'organisation des enseignements, pas la technique informatique.</aside>
  </section>`,

  slide(
    'Le fil rouge de la présentation',
    stepFlow([
      ['01', 'Préparer', 'Année, classes, modules, cours et personnes'],
      ['02', 'Planifier', 'Structure annuelle, semaines, jours et salles'],
      ['03', 'Attribuer', 'Enseignants nommés ou créneaux ouverts'],
      ['04', 'Arbitrer', 'Postulations, responsabilités et contrôle'],
      ['05', 'Mesurer', 'Charge, qualité des données et alertes'],
      ['06', 'Suivre', 'Tableaux de bord et vue enseignant'],
    ], 'six'),
    'Ce support peut servir de guide de démonstration. Chaque chapitre suit une décision métier concrète.',
    { className: 'si-compact' },
  ),

  `<section id="sommaire" data-name="sommaire" class="intro-summary si-summary">
    <p class="chapter-label">Parcours</p>
    <h2>Un même flux, plusieurs métiers</h2>
    <p class="title-lead">La donnée avance du cadrage académique vers l'exploitation quotidienne. Chaque rôle voit la partie utile à sa responsabilité.</p>
    <div class="toc-sections">
      <article><strong>01 · Vue d'ensemble</strong><a href="#/vue-ensemble">Finalité et acteurs</a></article>
      <article><strong>02 · Préparation</strong><a href="#/preparer-annee">Référentiels et structure annuelle</a></article>
      <article><strong>03 · Coordination</strong><a href="#/coordonner-enseignement">Planning et postulations</a></article>
      <article><strong>04 · Pilotage</strong><a href="#/piloter-activite">Charge, qualité et tableaux de bord</a></article>
      <article><strong>05 · Exploitation</strong><a href="#/exploiter-systeme">Rythme annuel et démonstration</a></article>
    </div>
  </section>`,

  chapter(
    'vue-ensemble',
    1,
    'La plateforme coordonne l’offre d’enseignement SI',
    `<p class="si-chapter-lead">Elle relie le cadre académique, les personnes, les créneaux et la charge. Le planning sert de point de convergence.</p>`,
    [
      slide(
        'Le workflow complet',
        `<div class="si-loop">
          <article><span>1</span><strong>Cadre</strong><small>Année et classes</small></article>
          <article><span>2</span><strong>Offre</strong><small>Modules et cours</small></article>
          <article><span>3</span><strong>Calendrier</strong><small>Semaines et créneaux</small></article>
          <article><span>4</span><strong>Ressources</strong><small>Enseignants et salles</small></article>
          <article><span>5</span><strong>Décision</strong><small>Attribution ou postulation</small></article>
          <article><span>6</span><strong>Suivi</strong><small>Charge et qualité</small></article>
          <div class="si-loop-center"><strong>Planning</strong><span>source opérationnelle</span></div>
        </div>`,
        'Insister sur la boucle. Une correction dans le planning se répercute sur les vues quotidiennes, la charge et les tableaux de bord.',
      ),
      slide(
        'Les acteurs et leur périmètre',
        roleRows([
          ['Secrétariat SI', 'Prépare et contrôle le cadre académique', 'Vue transversale, alertes et exports'],
          ['Responsable de module', 'Pilote les cours de ses modules', 'Planification, besoins et postulations de son périmètre'],
          ['Enseignant SI', 'Consulte ses activités et se positionne', 'Ses cours, ses créneaux et ses propres votes'],
          ['Planificateur', 'Organise les semaines, horaires et salles', 'Structure annuelle et planning détaillé'],
          ['Administrateur', 'Garantit les droits et les référentiels', 'Supervision globale et qualité du système'],
        ]),
        `Les intitulés correspondent aux permissions visibles dans l'application. Une personne peut cumuler plusieurs responsabilités.`,
      ),
      slide(
        'Les données qui font foi',
        sourceMap([
          ['Année académique', 'Période active et classes rattachées', 'Cadre de lecture des écrans'],
          ['Modules', 'Code, titre, année, couleur et responsables', 'Structure pédagogique'],
          ['Cours', 'Activités rattachées à un module', 'Unité d’enseignement détaillée'],
          ['Créneaux', 'Classe, semaine, jour, heure, salle et enseignants', 'Réalité opérationnelle'],
          ['Votes de postulation', 'Un choix par enseignant et par créneau', 'Aide à l’attribution'],
        ]),
        `Le système agrège plusieurs tables, mais le public métier peut les comprendre comme cinq registres reliés.`,
      ),
    ].join(''),
  ),

  chapter(
    'preparer-annee',
    2,
    'La préparation commence par des référentiels fiables',
    `<p class="si-chapter-lead">Une année active, des classes reconnues et des modules correctement décrits évitent les écarts dans toutes les vues suivantes.</p>`,
    [
      slide(
        'Le socle de l’année académique',
        stepFlow([
          ['1', 'Activer l’année', 'Définir la période de référence'],
          ['2', 'Rattacher les classes', 'Présentiel, temps partiel ou passerelle'],
          ['3', 'Décrire les modules', 'Code, titre, couleur et année'],
          ['4', 'Nommer les responsables', 'Responsable ou coordination du module'],
          ['5', 'Créer les cours', 'Activités qui composent chaque module'],
        ]),
        `La classe sert aussi à filtrer les créneaux de l'année active. Les codes doivent donc rester cohérents.`,
      ),
      slide(
        'La structure Mini Brique donne la vue annuelle',
        `<div class="si-calendar-map">
          <div class="si-calendar-head"><span>Automne</span><span>Printemps</span></div>
          <div class="si-calendar-weeks"><span>S38</span><span>S42</span><span>S48</span><span>S03</span><span>S10</span><span>S18</span><span>S28</span></div>
          <div class="si-calendar-row"><strong>Lundi</strong><i class="m1 wide"></i><i></i><i class="m2"></i><i></i><i class="m3 wide"></i></div>
          <div class="si-calendar-row"><strong>Mardi</strong><i></i><i class="m1"></i><i></i><i class="m4 wide"></i><i class="m3"></i></div>
          <div class="si-calendar-row"><strong>Mercredi</strong><i class="m2"></i><i class="m2"></i><i></i><i class="m4"></i><i></i></div>
          <div class="si-calendar-row"><strong>Jeudi</strong><i class="m1"></i><i></i><i class="m3 wide"></i><i></i><i class="m4"></i></div>
          <div class="si-calendar-row"><strong>Vendredi</strong><i></i><i class="m2 wide"></i><i></i><i class="m3"></i><i></i></div>
          <p>Chaque couleur représente un module. La structure peut être exportée vers Excel.</p>
        </div>`,
        `Le dessin est une représentation pédagogique. L'écran réel affiche l'ensemble des semaines de l'année.`,
      ),
      slide(
        'Une cellule annuelle produit des créneaux détaillés',
        `<div class="si-transform">
          <div><small>Structure annuelle</small><strong>Module 1.2</strong><span>Classe BAC26, semaine 42, mardi</span></div>
          <div class="si-transform-mark">devient</div>
          <div><small>Créneau exploitable</small><strong>08:30 à 11:45</strong><span>Salle, activité, cours et enseignants</span></div>
        </div>
        <p class="si-caption">La planification détaillée enrichit la structure générale. Elle alimente ensuite les vues hebdomadaires, journalières et la charge.</p>`,
        `Le service de planning génère les créneaux à partir de la cellule. Les informations détaillées peuvent ensuite être complétées.`,
      ),
    ].join(''),
  ),

  chapter(
    'coordonner-enseignement',
    3,
    'Le planning relie les besoins aux ressources disponibles',
    `<p class="si-chapter-lead">Les vues annuelle, hebdomadaire et journalière présentent le même système à des niveaux de détail différents.</p>`,
    [
      slide(
        'Trois vues pour trois décisions',
        roleRows([
          ['Vue annuelle', 'Répartir les modules dans l’année', 'Décision de structure'],
          ['Vue hebdomadaire', 'Détailler les activités et les personnes', 'Décision de coordination'],
          ['Vue journalière', 'Vérifier horaires, classes et salles', 'Décision logistique'],
        ]),
        'La vue journalière peut être filtrée par jour et par classe, puis exportée vers Excel.',
      ),
      slide(
        'Deux chemins pour affecter un enseignant',
        `<div class="si-split-flow">
          <article><p class="chapter-label">Affectation directe</p><strong>Le besoin et la personne sont connus</strong><span>Le planificateur ou le responsable renseigne l’enseignant sur le cours ou le créneau.</span><small>Résultat immédiat dans le planning et la charge.</small></article>
          <article><p class="chapter-label">Postulation</p><strong>Le créneau reste à pourvoir</strong><span>Le créneau porte un libellé de postulation. Les enseignants SI peuvent se positionner.</span><small>Le responsable conserve la décision d’attribution.</small></article>
        </div>`,
        `La postulation recueille un intérêt. Elle ne réalise pas automatiquement l'attribution finale.`,
      ),
      slide(
        'Le parcours de postulation',
        stepFlow([
          ['1', 'Détecter', 'Un créneau est marqué comme à pourvoir'],
          ['2', 'Publier', 'Il apparaît dans la liste des cours ouverts'],
          ['3', 'Se positionner', 'L’enseignant vote pour ce créneau'],
          ['4', 'Examiner', 'Le responsable voit les intérêts de son module'],
          ['5', 'Attribuer', 'Le planning reçoit l’enseignant retenu'],
          ['6', 'Recalculer', 'La vue enseignant et la charge se mettent à jour'],
        ], 'six'),
        `Le bouton Voir planning ramène au créneau concerné avec les filtres utiles.`,
        { className: 'si-compact' },
      ),
      slide(
        'La confidentialité des postulations',
        `<div class="si-privacy">
          <article><strong>Enseignant SI</strong><span>Crée ou retire son propre vote</span><small>Il voit seulement si son vote est enregistré.</small></article>
          <article><strong>Responsable de module</strong><span>Consulte les votes de ses modules</span><small>Son périmètre dépend de sa responsabilité ou coordination.</small></article>
          <article><strong>Administrateur</strong><span>Supervise l’ensemble</span><small>Il peut contrôler et nettoyer les votes.</small></article>
          <article class="blocked"><strong>Autre utilisateur</strong><span>Aucun accès aux votes SI</span><small>L’accès anonyme et les rôles hors périmètre sont refusés.</small></article>
        </div>`,
        `Cette matrice correspond au durcissement HEDS25-628. Les règles sont appliquées côté interface et côté base de données.`,
      ),
      slide(
        'Les contrôles avant publication',
        decisionRows([
          ['Cours sans enseignant', 'Ouvrir une postulation ou attribuer directement', 'Responsable de module'],
          ['Salle manquante', 'Compléter le créneau avant diffusion', 'Planificateur'],
          ['Horaire invalide', 'Corriger le début et la fin', 'Planificateur'],
          ['Code classe incohérent', 'Rattacher le créneau à la bonne année', 'Secrétariat'],
          ['Module sans responsable', 'Nommer le périmètre de décision', 'Administration'],
        ]),
        `Ces contrôles empêchent une erreur de structure de devenir une erreur de charge ou de communication.`,
      ),
    ].join(''),
  ),

  chapter(
    'piloter-activite',
    4,
    'Le pilotage transforme le planning en informations utiles',
    `<p class="si-chapter-lead">Le système compte les créneaux, repère les données incomplètes et calcule la charge à partir des activités réellement planifiées.</p>`,
    [
      slide(
        'Le calcul de la charge enseignante',
        `<div class="si-equation"><strong>Périodes de présence</strong><span>multipliées par</span><strong>coefficient d’activité</strong><span>donnent</span><strong>périodes pondérées</strong></div>
        ${exampleBars([
          ['Cours avec 1 enseignant', 100, '× 4,0', 'purple'],
          ['Cours avec 2 enseignants', 63, '× 2,5', 'blue'],
          ['Cours avec 3 enseignants ou plus', 55, '× 2,2', 'teal'],
          ['Atelier pratique', 40, '× 1,6', 'orange'],
        ])}
        <p class="si-caption">Exemple métier déjà intégré au système. Une période correspond à 45 minutes. Les ateliers utilisent un coefficient fixe.</p>`,
        `Les barres comparent les coefficients, pas des volumes réels. Les totaux dépendent des créneaux planifiés.`,
      ),
      slide(
        'La feuille de charges explique le total',
        `<div class="si-breakdown">
          <div class="si-donut" aria-label="Répartition illustrative"><span>Charge<br /><strong>totale</strong></span></div>
          <div class="si-breakdown-list">
            <article><i class="purple"></i><strong>Par coefficient</strong><span>Présence et pondération</span></article>
            <article><i class="blue"></i><strong>Par module</strong><span>Contribution de chaque enseignement</span></article>
            <article><i class="teal"></i><strong>Par classe</strong><span>Répartition des cohortes</span></article>
            <article><i class="orange"></i><strong>Par créneau</strong><span>Détail vérifiable jusqu’à l’horaire</span></article>
          </div>
        </div>`,
        `Le graphique est une lecture conceptuelle. L'écran présente les chiffres calculés et permet l'export Excel.`,
      ),
      slide(
        'Le dashboard du secrétariat',
        `<div class="si-dashboard-story">
          <div class="si-kpi-strip"><span><strong>Année</strong>cadre actif</span><span><strong>Modules</strong>offre structurée</span><span><strong>Enseignants</strong>ressources identifiées</span><span><strong>Créneaux</strong>activité planifiée</span></div>
          <div class="si-dashboard-lower"><article><strong>Alertes</strong><span>Année, modules, planning ou enseignants manquants</span></article><article><strong>Semaine courante</strong><span>Lecture rapide par jour, classe et module</span></article><article><strong>Qualité</strong><span>Cours, enseignants, activité et horaires à corriger</span></article></div>
        </div>`,
        `Le tableau de bord sert de point d'entrée. Il renvoie vers les écrans de correction plutôt que de dupliquer leur travail.`,
      ),
      slide(
        'La vue enseignant rassemble le quotidien',
        roleRows([
          ['Mes cours', 'Cours assignés depuis les relations ou le planning', 'Module, rôle et volume'],
          ['Mes prochaines séances', 'Créneaux à venir de l’année active', 'Date, classe et horaire'],
          ['Mes postulations', 'Choix enregistrés sur les créneaux ouverts', 'État personnel, sans exposer les autres'],
          ['Mon profil', 'Identité utilisée pour rapprocher les affectations', 'Identifiant, courriel et nom'],
        ]),
        `Le système tolère plusieurs formats historiques pour reconnaître l'enseignant, mais l'identité Supabase reste la référence pour les votes.`,
      ),
    ].join(''),
  ),

  chapter(
    'exploiter-systeme',
    5,
    'L’exploitation suit un rythme annuel et des contrôles réguliers',
    `<p class="si-chapter-lead">La valeur vient moins d’un écran isolé que de la continuité entre préparation, coordination, arbitrage et suivi.</p>`,
    [
      slide(
        'Le rythme d’une année académique',
        `<div class="si-year-cycle">
          <article><span>Avant l’année</span><strong>Référentiels</strong><small>Classes, modules, cours et personnes</small></article>
          <article><span>Construction</span><strong>Mini Brique</strong><small>Répartition des modules dans les semaines</small></article>
          <article><span>Affinage</span><strong>Planning détaillé</strong><small>Horaires, salles et enseignants</small></article>
          <article><span>Arbitrage</span><strong>Postulations</strong><small>Créneaux encore ouverts et décisions</small></article>
          <article><span>Exploitation</span><strong>Charge et suivi</strong><small>Exports, alertes et corrections</small></article>
        </div>`,
        `Le cycle peut se répéter à chaque semestre. Les corrections restent possibles tant que les responsabilités sont claires.`,
      ),
      slide(
        'Une démonstration en huit minutes',
        stepFlow([
          ['1', 'Dashboard', 'Montrer l’année et les alertes'],
          ['2', 'Mini Brique', 'Choisir une classe et un module'],
          ['3', 'Semaine', 'Ouvrir le détail généré'],
          ['4', 'Jour', 'Vérifier horaire et salle'],
          ['5', 'Postulation', 'Présenter le point de vue enseignant'],
          ['6', 'Charge', 'Retrouver l’effet de l’attribution'],
        ], 'six'),
        `Cette séquence montre une seule donnée qui traverse plusieurs écrans. Elle fonctionne bien avec un public peu technique.`,
        { className: 'si-compact' },
      ),
      slide(
        'Les points d’attention',
        decisionRows([
          ['Année active', 'Toujours confirmer la période affichée', 'Évite de mélanger deux cohortes'],
          ['Codes de classe', 'Garder une convention stable', 'Évite les créneaux invisibles'],
          ['Libellés historiques', 'Nettoyer progressivement les variantes', 'Améliore les rapprochements'],
          ['Attribution finale', 'La faire dans le planning', 'Un vote reste une intention'],
          ['Qualité des données', 'Corriger avant l’export', 'La charge dépend du détail des créneaux'],
        ]),
        `Le système contient des mécanismes de compatibilité pour les anciennes données. Ils facilitent la transition mais ne remplacent pas une donnée propre.`,
      ),
      `<section id="conclusion" data-id="conclusion" class="chapter-cover si-conclusion">
        <p class="chapter-label">Conclusion</p>
        <h2>Une chaîne cohérente, du besoin au suivi</h2>
        <div class="si-final-line"><span>Cadre académique</span><span>Planning</span><span>Attribution</span><span>Charge</span><span>Pilotage</span></div>
        <p class="title-lead">Quand les référentiels et les créneaux restent fiables, chaque métier obtient une vue adaptée sans ressaisir la même information.</p>
        <div class="si-final-points"><strong>Une source opérationnelle</strong><strong>Des droits par responsabilité</strong><strong>Des contrôles avant diffusion</strong></div>
        <p class="back-to-summary"><a href="#/sommaire">Revoir le parcours</a></p>
        <aside class="notes">Terminer avec la question suivante : quelle décision du quotidien doit devenir plus simple grâce à ce workflow ?</aside>
      </section>`,
    ].join(''),
  ),
]
