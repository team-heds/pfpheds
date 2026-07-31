const chapterHighlights = {
  1: ['Objectif métier', 'Périmètre applicatif', 'Dette et reprise'],
  2: ['Physiothérapie', 'Soins infirmiers', 'Socle commun'],
  3: ['Tickets', 'Priorités', 'Décisions traçables'],
  4: ['Branches', 'Pull requests', 'Historique fiable'],
  8: ['Déploiement', 'Documentation', 'Contrôles'],
  9: ['Outils IA', 'Revue humaine', 'Responsabilité'],
  10: ['Audit', 'Migration', 'Transmission'],
  11: ['Workflow', 'Qualité', 'Reprise durable'],
}

export function chapter(id, number, title, body, children = '') {
  const highlights = chapterHighlights[number]
  const hasVisualSummary = /class="(stack-grid|architecture-map|tech-grid|metric-grid|timeline|risk-grid)/.test(body)
  const summary = highlights && !hasVisualSummary ? keyPoints(highlights) : ''

  return `<section data-chapter="${number}">
    <section id="${id}" data-id="${id}" class="chapter-cover">
      <p class="chapter-label">Chapitre ${number}</p>
      <h2>${title}</h2>
      ${body}
      ${summary}
      <p class="back-to-summary"><a href="#/sommaire">Retour au sommaire</a></p>
      <aside class="notes">Introduire le chapitre, vérifier le niveau de l'audience, puis descendre dans les slides verticales.</aside>
    </section>
    ${children}
  </section>`
}

export function slide(title, body, notes = '', options = {}) {
  const id = title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
  const classes = options.className ? ` class="${options.className}"` : ''

  return `<section id="${id}" data-id="${id}"${classes}>
    <h3>${title}</h3>
    ${body}
    ${notes ? `<aside class="notes">${notes}</aside>` : ''}
  </section>`
}

export function techGrid(items) {
  return `<div class="tech-grid">${items
    .map(([label, text]) => `<article><strong>${label}</strong><span>${text}</span></article>`)
    .join('')}</div>`
}

export function codeBlock(code, language = 'bash') {
  return `<pre><code class="language-${language}">${code}</code></pre>`
}

export function mediaCard(src, alt, title, text) {
  return `<figure class="media-card">
    <img src="${src}" alt="${alt}" />
    <figcaption>
      <strong>${title}</strong>
      <span>${text}</span>
    </figcaption>
  </figure>`
}

export function svgFigure(src, alt, options = {}) {
  const classes = ['course-svg', options.variant].filter(Boolean).join(' ')
  const caption = options.caption ? `<figcaption>${options.caption}</figcaption>` : ''

  return `<figure class="${classes}">
    <img src="${src}" alt="${alt}" />
    ${caption}
  </figure>`
}

export function spotVisual(src, alt, title = '', text = '') {
  return `<figure class="spot-visual">
    <img src="${src}" alt="${alt}" />
    ${
      title || text
        ? `<figcaption>
          ${title ? `<strong>${title}</strong>` : ''}
          ${text ? `<span>${text}</span>` : ''}
        </figcaption>`
        : ''
    }
  </figure>`
}

export function metricCards(items) {
  return `<div class="metric-grid">${items
    .map(([value, label, detail]) => `<article><strong>${value}</strong><span>${label}</span><small>${detail}</small></article>`)
    .join('')}</div>`
}

export function architectureMap(items) {
  return `<div class="architecture-map">${items
    .map(([icon, title, detail]) => `<article><img src="${icon}" alt="" aria-hidden="true" /><strong>${title}</strong><span>${detail}</span></article>`)
    .join('')}</div>`
}

export function stackCards(items) {
  return `<div class="stack-grid">${items
    .map(
      ([logo, title, detail, points = [], color = 'var(--tt-brand-color-600)', soft = 'var(--tt-brand-color-50)']) =>
        `<article class="stack-card" style="--stack-color: ${color}; --stack-soft: ${soft}">
          <div class="stack-logo" aria-hidden="true">${renderLogo(logo)}</div>
          <strong>${title}</strong>
          <span>${detail}</span>
          ${points.length ? `<ul>${points.map((point) => `<li>${point}</li>`).join('')}</ul>` : ''}
        </article>`,
    )
    .join('')}</div>`
}

function renderLogo(logo) {
  return /\.(svg|png|jpg|jpeg|webp)$/i.test(logo) ? `<img src="${logo}" alt="" />` : logo
}

export function timeline(items) {
  return `<div class="timeline">${items
    .map(([title, detail]) => `<article><strong>${title}</strong><span>${detail}</span></article>`)
    .join('')}</div>`
}

export function checklist(items) {
  return `<ul class="checklist">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}

export function riskGrid(items) {
  return `<div class="risk-grid">${items
    .map(([title, risk, action]) => `<article><strong>${title}</strong><span>${risk}</span><small>${action}</small></article>`)
    .join('')}</div>`
}

export function diagramFlow(items, options = {}) {
  const classes = ['diagram-flow', options.variant].filter(Boolean).join(' ')
  return `<div class="${classes}">${items
    .map(
      ([icon, title, detail, accent = 'var(--tt-brand-color-600)']) =>
        `<article style="--diagram-accent: ${accent}">
          <div class="diagram-icon" aria-hidden="true">${renderLogo(icon)}</div>
          <strong>${title}</strong>
          <span>${detail}</span>
        </article>`,
    )
    .join('')}</div>`
}

export function processDiagram(groups) {
  return `<div class="process-diagram">${groups
    .map(
      ([title, items, accent = 'var(--tt-brand-color-600)']) =>
        `<article style="--process-accent: ${accent}">
          <strong>${title}</strong>
          <ul>${items.map((item) => `<li>${item}</li>`).join('')}</ul>
        </article>`,
    )
    .join('')}</div>`
}

export function roleMatrix(items) {
  return `<div class="role-matrix">${items
    .map(
      ([role, responsibility, output]) =>
        `<article>
          <strong>${role}</strong>
          <span>${responsibility}</span>
          <small>${output}</small>
        </article>`,
    )
    .join('')}</div>`
}

function keyPoints(items) {
  return `<ul class="key-points">${items.map((item) => `<li>${item}</li>`).join('')}</ul>`
}
