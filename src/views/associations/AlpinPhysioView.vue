<template>
  <div class="alpin-physio-modern">
    <!-- Navigation Ultra-Moderne -->
    <nav class="modern-nav" :class="{ 'nav-active': isScrolled }">
      <div class="nav-content">
        <div class="nav-brand">
          <span class="brand-text">Alp'in Physio</span>
        </div>
        <div class="nav-dots">
          <div 
            v-for="(section, index) in sections" 
            :key="section.id"
            class="nav-dot"
            :class="{ active: activeSection === section.id }"
            @click="scrollToSection(section.id)"
            :title="section.name"
          ></div>
        </div>
      </div>
    </nav>

    <!-- Hero Ultra-Moderne -->
    <section id="hero" class="hero-modern">
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">Association Étudiante</div>
          <h1 class="hero-title">
            <span class="title-main">Alp'in</span>
            <span class="title-accent">Physio</span>
          </h1>
          <p class="hero-description">
            L'excellence en physiothérapie sportive depuis 2012
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">12</div>
              <div class="stat-label">Années</div>
            </div>
            <div class="stat-item">
              <div class="stat-number">50+</div>
              <div class="stat-label">Événements</div>
            </div>

          </div>
          <Button 
            @click="scrollToSection('about')"
            class="hero-cta"
            label="Découvrir"
            icon="pi pi-arrow-down"
          />
        </div>
      </div>
      <div class="hero-bg"></div>
    </section>

    <!-- About Section -->
    <section id="about" class="section-modern">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Notre Histoire</h2>
          <p class="section-subtitle">Une passion partagée depuis 2012</p>
        </div>
        
        <!-- Histoire principale avec layout asymétrique -->
        <div class="story-layout">
          <div class="story-main">
            <div class="story-badge">
              <span class="badge-year">2012</span>
              <span class="badge-text">Création</span>
            </div>
            <h3 class="story-title">Nos Origines</h3>
            <div class="story-content-text">
              <p class="story-paragraph highlight">
                Nous sommes des <strong>étudiants et étudiantes en physiothérapie</strong>, 
                <strong>sportifs et sportives</strong>, autant de caractéristiques qui nous ont 
                poussés à mettre sur pied l'association Alp'in Physio en 2012.
              </p>
              <p class="story-paragraph">
                En effet, l'association nous permet de <strong>conjuguer nos compétences en 
                physiothérapie et la pratique sur le terrain sportif</strong>.
              </p>
            </div>
          </div>
          <div class="story-visual">
            <div class="visual-element">
              <div class="floating-icon">
                <i class="pi pi-heart-fill"></i>
              </div>
              <div class="visual-stats">
                <div class="mini-stat">
                  <span class="stat-num">12+</span>
                  <span class="stat-text">Années</span>
                </div>
                <div class="mini-stat">
                  <span class="stat-num">100+</span>
                  <span class="stat-text">Événements</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline des activités -->
        <div class="activities-timeline">
          <div class="timeline-header">
            <h4>Nos Activités</h4>
            <div class="timeline-line"></div>
          </div>
          
          <div class="timeline-items">
            <div class="timeline-item">
              <div class="timeline-marker">
                <i class="pi pi-flag"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-card border-primary">
                  <h5>Partenariats Sportifs</h5>
                  <p>
                    Alp'in physio crée des partenariats avec petites et grandes manifestations 
                    sportives (Sierre-Zinal, le Grand Raid...), essentiellement en Suisse romande 
                    de par la localisation de notre école.
                  </p>
                  <div class="timeline-tags">
                    <span class="tag">Sierre-Zinal</span>
                    <span class="tag">Grand Raid</span>
                    <span class="tag">Suisse Romande</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="timeline-item reverse">
              <div class="timeline-marker">
                <i class="pi pi-users"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-card border-primary">
                  <h5>Massage Post-Effort</h5>
                  <p>
                    Les étudiants de Loèche-les-Bains se mettent à disposition lors de courses 
                    pour le massage post-effort des participants. Cela permet aux sportifs de 
                    bénéficier de massages de qualité.
                  </p>
                  <div class="timeline-highlight">
                    <i class="pi pi-map-marker"></i>
                    <span>Loèche-les-Bains</span>
                  </div>
                </div>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-marker">
                <i class="pi pi-book"></i>
              </div>
              <div class="timeline-content">
                <div class="timeline-card border-primary">
                  <h5>Formations et Conférences</h5>
                  <p>
                    Au-delà de la pratique sur le terrain, nous mettons sur pied diverses 
                    conférences et formations au sein de l'école pour développer le réseau 
                    professionnel et approfondir les connaissances.
                  </p>
                  <div class="timeline-features">
                    <div class="feature">
                      <i class="pi pi-users"></i>
                      <span>Réseau Pro</span>
                    </div>
                    <div class="feature">
                      <i class="pi pi-graduation-cap"></i>
                      <span>Connaissances</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Comité -->
        <div class="committee-section">
          <div class="committee-header">
            <h4>Notre Comité</h4>
            <p>Des étudiants des trois années de Bachelor, chacun avec son rôle clé</p>
          </div>
          
          <div class="committee-intro">
            <div class="intro-card">
              <div class="intro-icon">
                <i class="pi pi-users"></i>
              </div>
              <p>
                Notre comité est composé d'étudiants des trois années de Bachelor ayant chacun 
                son rôle clé au sein de l'association.
              </p>
              <div class="photo-placeholder">
                <i class="pi pi-image"></i>
                <span>Photo du comité</span>
              </div>
            </div>
          </div>

          <div class="committee-grid">
            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-crown"></i>
              </div>
              <h5>Président</h5>
              <p>Direction générale et représentation de l'association</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-user-plus"></i>
              </div>
              <h5>Vice-président</h5>
              <p>Soutien au président et coordination des projets</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <h5>Secrétaire</h5>
              <p>Gestion administrative et procès-verbaux</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-wallet"></i>
              </div>
              <h5>Caissier</h5>
              <p>Gestion financière et comptabilité</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-megaphone"></i>
              </div>
              <h5>Responsable Communication</h5>
              <p>Communication digitale et gestion du site web</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <h5>Responsable Formations</h5>
              <p>Organisation des événements extra-sportifs</p>
            </div>

            <div class="committee-member">
              <div class="member-icon">
                <i class="pi pi-flag"></i>
              </div>
              <h5>Responsable Matériel</h5>
              <p>Gestion de l'équipement et logistique</p>
            </div>
          </div>


        </div>

        <!-- Section Sponsors -->
        <div class="sponsors-section">
          <div class="sponsors-header">
            <h4>Nos Sponsors</h4>
            <p>Des partenaires fidèles qui nous accompagnent depuis de nombreuses années</p>
          </div>
          
          <div class="sponsors-intro">
            <div class="intro-text">
              <p>
                Nos sponsors sont à nos côtés depuis de nombreuses années ! Nous pouvons compter sur eux 
                puisqu'ils nous apportent leur soutien précieux dans nos projets et contribuent à la réussite 
                de nos divers événements tout au long de l'année.
              </p>
            </div>
          </div>

          <div class="sponsors-grid">
            <div class="sponsor-card premium">
              <div class="sponsor-logo">
                <div class="logo-placeholder">
                  <i class="pi pi-image"></i>
                  <span>Logo Compex</span>
                </div>
              </div>
              <div class="sponsor-info">
                <h5>Compex</h5>
                <p>Électrostimulation et récupération sportive</p>
                <div class="sponsor-link">
                  <i class="pi pi-external-link"></i>
                  <span>Visiter le site</span>
                </div>
              </div>
            </div>

            <div class="sponsor-card premium">
              <div class="sponsor-logo">
                <div class="logo-placeholder">
                  <i class="pi pi-image"></i>
                  <span>Logo Perskindol</span>
                </div>
              </div>
              <div class="sponsor-info">
                <h5>Perskindol</h5>
                <p>Produits de soins et récupération</p>
                <div class="sponsor-link">
                  <i class="pi pi-external-link"></i>
                  <span>Visiter le site</span>
                </div>
              </div>
            </div>

            <div class="sponsor-card premium">
              <div class="sponsor-logo">
                <div class="logo-placeholder">
                  <i class="pi pi-image"></i>
                  <span>Logo PhysioSwiss</span>
                </div>
              </div>
              <div class="sponsor-info">
                <h5>PhysioSwiss</h5>
                <p>Association suisse de physiothérapie</p>
                <div class="sponsor-link">
                  <i class="pi pi-external-link"></i>
                  <span>Visiter le site</span>
                </div>
              </div>
            </div>

            <div class="sponsor-card institutional">
              <div class="sponsor-logo">
                <div class="logo-placeholder institutional-logo">
                  <i class="pi pi-building"></i>
                  <span>Logo HES-SO Valais</span>
                </div>
              </div>
              <div class="sponsor-info">
                <h5>HES-SO Valais // Wallis</h5>
                <p>Haute École Spécialisée de Suisse Occidentale</p>
                <div class="sponsor-link">
                  <i class="pi pi-external-link"></i>
                  <span>Visiter le site</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Events Section -->
    <section id="events" class="section-modern alt-bg">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Notre calendrier</h2>
          <p class="section-subtitle">Rejoignez-nous lors de nos prochains événements</p>
        </div>
        
        <div class="events-container ">
          <div v-for="event in events" :key="event.id" class="event-card border-primary">
            <div class="event-date">
              <span class="date-day">{{ event.day }}</span>
              <span class="date-month">{{ event.month }}</span>
            </div>
            <div class="event-content">
              <h4 class="event-title">{{ event.title }}</h4>
              <p class="event-location">{{ event.location }}</p>
            </div>
            <div class="event-action">
              <Button icon="pi pi-arrow-right" class="p-button-text" />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Services Section -->
    <section id="services" class="section-modern">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Nos Prestations</h2>
          <p class="section-subtitle">Espace organisateurs - Massages de récupération pour vos événements</p>
        </div>
        
        <!-- Introduction organisateurs -->
        <div class="services-intro">
          <div class="intro-highlight">
            <div class="highlight-icon">
              <i class="pi pi-users"></i>
            </div>
            <h3>Organisateurs d'événements sportifs</h3>
            <p>
              Si vous êtes organisateur d'un évènement sportif et que vous cherchez un groupe d'étudiants pour les
              massages de récupération, vous êtes au bon endroit !
            </p>
          </div>
        </div>

        <!-- Prestations principales -->
        <div class="services-main">
          <div class="service-description">
            <h4>Nos Prestations de Massage Post-Effort</h4>
            <p>
              Nous proposons des prestations de massage post-effort aux participants de tout évènement sportif,
              comme les courses de trail, de cyclisme, les triathlons, les tournois de badminton et bien plus encore.
            </p>
          </div>
        </div>

        <!-- Contexte et formation -->
        <div class="services-context">
          <div class="context-grid">
            <div class="context-card">
              <div class="context-icon">
                <i class="pi pi-graduation-cap"></i>
              </div>
              <h5>Un peu de contexte...</h5>
              <p>
                Au début de l'année scolaire, Alp'in Physio propose un cours de massage pour permettre aux étudiants
                d'acquérir les bases nécessaires au massage sportif. De plus, dans les premières semaines du Bachelor,
                quelques cours de massage sont dispensés par l'école. Chaque étudiant est dont prêt très tôt à venir
                masser sur les événements !
              </p>
            </div>
            
            <div class="context-card">
              <div class="context-icon">
                <i class="pi pi-heart"></i>
              </div>
              <h5>Notre Vision</h5>
              <p>
                À nos yeux, il est important de donner l'opportunité aux futurs physiothérapeutes de se faire la main
                et d'acquérir de l'expérience. Parallèlement, nous offrons aux sportifs une récupération de qualité
                après leurs efforts, généralement très appréciée. Ce moment, réunissant bien-être physique et mental,
                permet au corps de se détendre afin de mieux se régénérer.
              </p>
            </div>
          </div>
        </div>

        <!-- Bénéfices mutuels -->
        <div class="services-benefits">
        </div>

        <!-- Processus de partenariat -->
        <div class="partnership-process">
          <div class="process-header">
            <h4>Comment Fonctionne un Partenariat avec Alp'in Physio ?</h4>
          </div>
          
          <div class="process-steps">
            <div class="step-item">
              <div class="step-number">1</div>
              <div class="step-content">
                <h5>Premier Contact</h5>
                <p>
                  Pour toute demande de partenariat, veuillez contacter le comité de l'association à l'adresse suivante :
                  alpinphysio@hevs.ch. Décrivez les besoins nécessaires pour votre évènement (date et lieu, horaire,
                  estimation de nombre de masseurs...) et nous ferons un premier sondage auprès des étudiants pour
                  trouver un responsable de course avec qui vous aurez contact pour la suite de l'organisation.
                </p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">2</div>
              <div class="step-content">
                <h5>Recrutement des Étudiants</h5>
                <p>
                  Après cette première prise de contact entre les organisateurs et Alp'in Physio, l'association
                  recrute le nombre d'étudiants souhaité qui feront ensuite le déplacement le jour de course.
                </p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">3</div>
              <div class="step-content">
                <h5>Matériel et Logistique</h5>
                <p>
                  Si besoin, nous pouvons amener notre propre matériel de massage (tables, huile, tape…)
                  afin d'assurer la bonne tenue de notre stand.
                </p>
              </div>
            </div>

            <div class="step-item">
              <div class="step-number">4</div>
              <div class="step-content">
                <h5>Conditions Contractuelles</h5>
                <p>
                  Vous trouverez ci-dessous un document décrivant les conditions contractuelles d'un partenariat avec
                  Alp'in Physio.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- CTA Section -->
        <div class="services-cta">
          <div class="cta-content">
            <h4>Intéressé par un Partenariat ?</h4>
            <p>Contactez-nous dès maintenant pour organiser votre événement avec nos étudiants masseurs !</p>
            <div class="cta-buttons">
              <Button 
                label="Contrat de partenariat (V_juin_2025)"
                icon="pi pi-download"
                class="p-button-outlined cta-btn"
                @click="downloadContract"
              />
              <Button 
                label="Nous contacter directement"
                icon="pi pi-envelope"
                class="cta-btn primary"
                @click="openContact"
              />
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Gallery Section -->
    <section id="gallery" class="section-modern gallery-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Nos Moments</h2>
          <p class="section-subtitle">Découvrez Alp'in Physio en action lors des événements sportifs</p>
        </div>
        
        <!-- Diaporama -->
        <div class="gallery-slideshow">
          <div class="slideshow-container">
            <!-- Slides -->
            <div 
              v-for="(photo, index) in galleryPhotos" 
              :key="index"
              class="slide"
              :class="{ active: currentSlide === index }"
            >
              <div class="slide-image">
                <img :src="photo.src" :alt="photo.alt" />
              </div>
              <div class="slide-content">
                <h4>{{ photo.title }}</h4>
                <p>{{ photo.description }}</p>
                <div class="slide-meta">
                  <span class="slide-date">
                    <i class="pi pi-calendar"></i>
                    {{ photo.date }}
                  </span>
                  <span class="slide-location">
                    <i class="pi pi-map-marker"></i>
                    {{ photo.location }}
                  </span>
                </div>
              </div>
            </div>
            
            <!-- Navigation Arrows -->
            <button class="slide-nav prev" @click="previousSlide">
              <i class="pi pi-chevron-left"></i>
            </button>
            <button class="slide-nav next" @click="nextSlide">
              <i class="pi pi-chevron-right"></i>
            </button>
          </div>
          
          <!-- Dots Indicator -->
          <div class="slide-dots">
            <button 
              v-for="(photo, index) in galleryPhotos"
              :key="index"
              class="dot"
              :class="{ active: currentSlide === index }"
              @click="goToSlide(index)"
            ></button>
          </div>
        </div>
        

      </div>
    </section>

    <!-- Contact Section -->
    <section id="contact" class="section-modern contact-section">
      <div class="section-container">
        <div class="section-header">
          <h2 class="section-title">Contactez-nous</h2>
          <p class="section-subtitle">Nous sommes là pour répondre à vos questions</p>
        </div>
        
        <div class="contact-grid">
          <!-- Email Card -->
          <div class="contact-card email-card" @click="openEmail">
            <div class="card-background">
              <div class="card-glow"></div>
            </div>
            <div class="card-content">
              <div class="contact-icon">
                <i class="pi pi-envelope"></i>
              </div>
              <h4>Email Direct</h4>
              <p class="contact-value">alpinphysio@hevs.ch</p>
              <p class="contact-description">Cliquez pour nous envoyer un email</p>
              <div class="card-action">
                <i class="pi pi-arrow-right"></i>
              </div>
            </div>
          </div>
          
          <!-- Instagram Card -->
          <div class="contact-card instagram-card" @click="openInstagram">
            <div class="card-background">
              <div class="card-glow"></div>
            </div>
            <div class="card-content">
              <div class="contact-icon">
                <i class="pi pi-instagram"></i>
              </div>
              <h4>Instagram</h4>
              <p class="contact-value">@alpinphysio</p>
              <p class="contact-description">Suivez nos aventures sportives</p>
              <div class="card-action">
                <i class="pi pi-external-link"></i>
              </div>
            </div>
          </div>
          
          <!-- Location Card -->
          <div class="contact-card location-card" @click="openMaps">
            <div class="card-background">
              <div class="card-glow"></div>
            </div>
            <div class="card-content">
              <div class="contact-icon">
                <i class="pi pi-map-marker"></i>
              </div>
              <h4>Notre Adresse</h4>
              <p class="contact-value">HES-SO Valais</p>
              <p class="contact-address">
                Thermenstrasse 41<br>
                3954 Leukerbad
              </p>
              <p class="contact-description">Voir sur Google Maps</p>
              <div class="card-action">
                <i class="pi pi-map"></i>
              </div>
            </div>
          </div>
        </div>
        

      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'

// État réactif
const activeSection = ref('hero')
const isScrolled = ref(false)
const currentSlide = ref(0)
let scrollTimeout = null

// Configuration
const sections = [
  { id: 'hero', name: 'Accueil' },
  { id: 'about', name: 'À propos' },
  { id: 'committee', name: 'Comité' },
  { id: 'sponsors', name: 'Sponsors' },
  { id: 'events', name: 'Événements' },
  { id: 'services', name: 'Services' },
  { id: 'gallery', name: 'Galerie' },
  { id: 'contact', name: 'Contact' }
]

const mainRoles = ['Président', 'Secrétaire', 'Caissier', 'Communication']
const partners = ['Compex', 'Perskindol', 'PhysioSwiss', 'HES-SO Valais']

const events = [
  { id: 1, day: '06', month: 'SEP', title: 'Grand Raid BCVS', location: 'Verbier' },
  { id: 2, day: '17', month: 'SEP', title: 'Présentation BA25', location: 'HES-SO' },
  { id: 3, day: '28', month: 'SEP', title: 'RunMate', location: 'Montreux' },
  { id: 4, day: '12', month: 'NOV', title: 'Distribution habits', location: 'HES-SO' }
]

const galleryPhotos = [
  {
    src: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Massage post-effort trail',
    title: 'Grand Raid BCVS 2024',
    description: 'Nos étudiants en action lors du Grand Raid, offrant des massages de récupération aux coureurs épuisés.',
    date: 'Septembre 2024',
    location: 'Verbier - Grimentz'
  },
  {
    src: 'https://images.unsplash.com/photo-1594736797933-d0401ba2fe65?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Équipe Alp\'in Physio',
    title: 'Formation Massage Sportif',
    description: 'Session de formation intensive pour préparer nos étudiants aux techniques de massage post-effort.',
    date: 'Octobre 2024',
    location: 'HES-SO Valais, Leukerbad'
  },
  {
    src: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a8e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80',
    alt: 'Stand Alp\'in Physio',
    title: 'Marathon de Lausanne',
    description: 'Notre stand de massage au marathon de Lausanne, un succès avec plus de 100 massages réalisés.',
    date: 'Octobre 2024',
    location: 'Lausanne'
  }
]

// Méthodes
const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

const handleScroll = () => {
  // Throttling pour éviter les appels trop fréquents
  if (scrollTimeout) return
  
  scrollTimeout = setTimeout(() => {
    const scrollY = window.scrollY
    isScrolled.value = scrollY > 100

    // Détection section active - optimisée pour éviter les recalculs
    let currentSectionId = 'hero'
    
    for (const section of sections) {
      const element = document.getElementById(section.id)
      if (element) {
        const rect = element.getBoundingClientRect()
        const elementTop = rect.top + scrollY
        
        if (scrollY >= elementTop - 300) {
          currentSectionId = section.id
        }
      }
    }

    // Mise à jour seulement si la section a changé
    if (activeSection.value !== currentSectionId) {
      activeSection.value = currentSectionId
    }
    
    scrollTimeout = null
  }, 16) // ~60fps
}

const downloadContract = () => {
  console.log('Téléchargement du contrat')
}

const downloadSponsoring = () => {
  console.log('Téléchargement du dossier sponsoring')
}

const openContact = () => {
  window.location.href = 'mailto:alpinphysio@hevs.ch'
}

// Fonctions diaporama
const nextSlide = () => {
  currentSlide.value = (currentSlide.value + 1) % galleryPhotos.length
}

const previousSlide = () => {
  currentSlide.value = currentSlide.value === 0 ? galleryPhotos.length - 1 : currentSlide.value - 1
}

const goToSlide = (index) => {
  currentSlide.value = index
}

// Fonctions contact
const openEmail = () => {
  window.location.href = 'mailto:alpinphysio@hevs.ch'
}

const openInstagram = () => {
  window.open('https://instagram.com/alpinphysio', '_blank')
}

const openMaps = () => {
  window.open('https://maps.google.com/?q=HES-SO+Valais+Thermenstrasse+41+Leukerbad', '_blank')
}

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* Variables modernes */
:root {
  --primary: #0B213F;
  --secondary: #1976D2;
  --accent: #4CAF50;
  --gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --text-primary: #1a1a1a;
  --text-secondary: #6b7280;
  --bg-primary: #ffffff;
  --bg-secondary: #f8fafc;
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 20px rgba(0,0,0,0.1);
  --shadow-lg: 0 10px 40px rgba(0,0,0,0.15);
  --radius: 16px;
  --transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Base */
.alpin-physio-modern {
  scroll-behavior: smooth;
  overflow-x: hidden;
}

/* Navigation Ultra-Moderne */
.modern-nav {
  position: fixed;
  top: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  padding: 1rem 2rem;
  transition: var(--transition);
}

.modern-nav.nav-active {
  background: rgba(255, 255, 255, 0.95);
  box-shadow: var(--shadow-md);
}

.nav-content {
  display: flex;
  align-items: center;
  gap: 3rem;
}

.brand-text {
  font-weight: 700;
  font-size: 1.2rem;
  color: var(--primary);
}

.nav-dots {
  display: flex;
  gap: 1rem;
}

.nav-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: rgba(107, 114, 128, 0.3);
  cursor: pointer;
  transition: var(--transition);
}

.nav-dot:hover {
  background: rgba(107, 114, 128, 0.6);
  transform: scale(1.2);
}

.nav-dot.active {
  background: var(--secondary);
  transform: scale(1.3);
}

/* Hero Ultra-Moderne */
.hero-modern {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: var(--gradient);
  color: white;
  text-align: center;
}

.hero-container {
  max-width: 800px;
  padding: 0 2rem;
  position: relative;
  z-index: 2;
}

.hero-badge {
  display: inline-block;
  padding: 0.5rem 1.5rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50px;
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2rem;
  animation: fadeInUp 1s ease 0.2s both;
}

.hero-title {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 800;
  margin-bottom: 1.5rem;
  line-height: 1.1;
}

.title-main {
  display: block;
  animation: fadeInUp 1s ease 0.4s both;
}

.title-accent {
  display: block;
  background: linear-gradient(45deg, #fff, #e0e7ff);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: fadeInUp 1s ease 0.6s both;
}

.hero-description {
  font-size: 1.3rem;
  margin-bottom: 3rem;
  opacity: 0.9;
  animation: fadeInUp 1s ease 0.8s both;
}

.hero-stats {
  display: flex;
  justify-content: center;
  gap: 3rem;
  margin-bottom: 3rem;
  animation: fadeInUp 1s ease 1s both;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  opacity: 0.8;
  margin-top: 0.5rem;
}

.hero-cta {
  animation: fadeInUp 1s ease 1.2s both;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
  opacity: 0.3;
}

/* Sections Modernes */
.section-modern {
  padding: 8rem 0;
  position: relative;
}

.section-modern.alt-bg {
  background: var(--bg-secondary);
}

.section-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
}

.section-header {
  text-align: center;
  margin-bottom: 5rem;
}

.section-title {
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.2rem;
  color: var(--text-secondary);
  max-width: 600px;
  margin: 0 auto;
}

/* About Section - Layout Asymétrique */
.story-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 4rem;
  margin-bottom: 6rem;
  align-items: center;
}

.story-main {
  position: relative;
}

.story-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--gradient);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 50px;
  font-weight: 600;
  margin-bottom: 2rem;
  box-shadow: var(--shadow-md);
}

.badge-year {
  font-size: 1.2rem;
  font-weight: 800;
}

.badge-text {
  font-size: 0.9rem;
  opacity: 0.9;
}

.story-title {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 2rem;
  line-height: 1.2;
}

.story-content-text {
  space-y: 1.5rem;
}

.story-paragraph {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.story-paragraph.highlight {
  font-size: 1.2rem;
  color: var(--text-primary);
}

.story-visual {
  position: relative;
  height: 300px;
}

.visual-element {
  position: relative;
  height: 100%;
  background: var(--gradient);
  border-radius: var(--radius);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.floating-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  margin-bottom: 2rem;
  animation: float 3s ease-in-out infinite;
}

.visual-stats {
  display: flex;
  gap: 2rem;
}

.mini-stat {
  text-align: center;
  color: white;
}

.stat-num {
  display: block;
  font-size: 1.5rem;
  font-weight: 800;
  line-height: 1;
}

.stat-text {
  display: block;
  font-size: 0.8rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

/* Timeline des Activités */
.activities-timeline {
  margin-bottom: 6rem;
}

.timeline-header {
  text-align: center;
  margin-bottom: 4rem;
  position: relative;
}

.timeline-header h4 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.timeline-line {
  width: 100px;
  height: 4px;
  background: var(--gradient);
  margin: 0 auto;
  border-radius: 2px;
}

.timeline-items {
  position: relative;
  max-width: 1000px;
  margin: 0 auto;
}

.timeline-items::before {
  content: '';
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, var(--secondary), var(--accent));
  transform: translateX(-50%);
}

.timeline-item {
  display: flex;
  margin-bottom: 4rem;
  position: relative;
}

.timeline-item.reverse {
  flex-direction: row-reverse;
}

.timeline-item.reverse .timeline-content {
  text-align: right;
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 2rem;
  transform: translateX(-50%);
  width: 60px;
  height: 60px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
  box-shadow: var(--shadow-md);
  z-index: 2;
}

.timeline-content {
  flex: 1;
  max-width: 45%;
}

.timeline-item:not(.reverse) .timeline-content {
  margin-right: auto;
  padding-right: 3rem;
}

.timeline-item.reverse .timeline-content {
  margin-left: auto;
  padding-left: 3rem;
}

.timeline-card {
  background: var(--bg-primary);
  padding: 2.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
}

.timeline-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.timeline-card h5 {
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.timeline-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.timeline-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.tag {
  background: var(--gradient);
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 15px;
  font-size: 0.8rem;
  font-weight: 500;
}

.timeline-highlight {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--secondary);
  font-weight: 600;
}

.timeline-features {
  display: flex;
  gap: 1rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

/* Section Sponsors */
.sponsors-section {
  margin-bottom: 6rem;
}

.sponsors-header {
  text-align: center;
  margin-bottom: 3rem;
}

.sponsors-header h4 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.sponsors-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.sponsors-intro {
  margin-bottom: 4rem;
}

.intro-text {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  background: var(--bg-secondary);
  padding: 2.5rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--secondary);
}

.intro-text p {
  font-size: 1.1rem;
  line-height: 1.7;
  color: var(--text-primary);
  margin: 0;
}

.sponsors-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 4rem;
}

.sponsor-card {
  background: var(--bg-primary);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
  cursor: pointer;
}

.sponsor-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.sponsor-card.premium {
  border-top: 4px solid var(--gradient);
}

.sponsor-card.institutional {
  border-top: 4px solid var(--accent);
}

.sponsor-logo {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  position: relative;
}

.logo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  transition: var(--transition);
}

.sponsor-card:hover .logo-placeholder {
  transform: scale(1.05);
  color: var(--secondary);
}

.logo-placeholder i {
  font-size: 2.5rem;
}

.logo-placeholder span {
  font-size: 0.9rem;
  font-weight: 500;
}

.institutional-logo {
  color: var(--accent) !important;
}

.sponsor-info {
  padding: 2rem;
}

.sponsor-info h5 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.sponsor-info p {
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 1rem;
  font-size: 0.95rem;
}

.sponsor-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--secondary);
  font-size: 0.9rem;
  font-weight: 500;
  transition: var(--transition);
}

.sponsor-card:hover .sponsor-link {
  color: var(--primary);
}

.sponsors-cta {
  background: var(--gradient);
  color: white;
  padding: 3rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.cta-content h5 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.cta-content p {
  font-size: 1rem;
  opacity: 0.9;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.cta-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-actions .p-button {
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
}

.cta-actions .p-button-outlined {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.cta-actions .p-button-outlined:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Section Comité */
.committee-section {
  margin-bottom: 6rem;
}

.committee-header {
  text-align: center;
  margin-bottom: 3rem;
}

.committee-header h4 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.committee-header p {
  font-size: 1.1rem;
  color: var(--text-secondary);
}

.committee-intro {
  margin-bottom: 4rem;
}

.intro-card {
  max-width: 600px;
  margin: 0 auto;
  background: var(--gradient);
  color: white;
  padding: 3rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.intro-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  font-size: 2rem;
}

.intro-card p {
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  opacity: 0.95;
}

.photo-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  transition: var(--transition);
}

.photo-placeholder:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.photo-placeholder i {
  font-size: 2rem;
  opacity: 0.7;
}

.photo-placeholder span {
  font-size: 0.9rem;
  opacity: 0.8;
}

.committee-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
}

.committee-member {
  background: var(--bg-primary);
  padding: 2.5rem 2rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
}

.committee-member::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient);
  transform: scaleX(0);
  transition: var(--transition);
}

.committee-member:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lg);
}

.committee-member:hover::before {
  transform: scaleX(1);
}

.member-icon {
  width: 70px;
  height: 70px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  font-size: 1.8rem;
  transition: var(--transition);
}

.committee-member:hover .member-icon {
  transform: scale(1.1) rotate(5deg);
}

.committee-member h5 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.committee-member p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.95rem;
}

.committee-note {
  background: var(--bg-secondary);
  border-radius: var(--radius);
  padding: 2rem;
  border-left: 4px solid var(--secondary);
}

.note-content {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
}

.note-content i {
  color: var(--secondary);
  font-size: 1.2rem;
  margin-top: 0.2rem;
  flex-shrink: 0;
}

.note-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
}

.note-content em {
  font-style: italic;
  opacity: 0.9;
}

/* Animations */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

/* Events */
.events-container {
  display: grid;
  gap: 1.5rem;
  max-width: 800px;
  margin: 0 auto;
}

.event-card {
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  padding: 2rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-sm);
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
}

.event-card:hover {
  transform: translateX(10px);
  box-shadow: var(--shadow-md);
}

.event-date {
  text-align: center;
  margin-right: 2rem;
  min-width: 80px;
}

.date-day {
  display: block;
  font-size: 2rem;
  font-weight: 800;
  color: var(--secondary);
  line-height: 1;
}

.date-month {
  display: block;
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

.event-content {
  flex: 1;
}

.event-title {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.event-location {
  color: var(--text-secondary);
  margin: 0;
}

/* Services - Prestations */
.services-intro {
  margin-bottom: 4rem;
}

.intro-highlight {
  max-width: 700px;
  margin: 0 auto;
  background: var(--gradient);
  color: white;
  padding: 3rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.highlight-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 2rem;
  font-size: 2rem;
}

.intro-highlight h3 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1.5rem;
}

.intro-highlight p {
  font-size: 1.2rem;
  line-height: 1.6;
  opacity: 0.95;
}

.services-main {
  margin-bottom: 4rem;
}

.service-description {
  max-width: 800px;
  margin: 0 auto;
  text-align: center;
  background: var(--bg-secondary);
  padding: 3rem;
  border-radius: var(--radius);
  border-left: 4px solid var(--secondary);
}

.service-description h4 {
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.service-description p {
  font-size: 1.2rem;
  line-height: 1.7;
  color: var(--text-primary);
}

.services-context {
  margin-bottom: 4rem;
}

.context-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 900px;
  margin: 0 auto;
}

.context-card {
  background: var(--bg-primary);
  padding: 2.5rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-md);
  transition: var(--transition);
  border: 1px solid rgba(0,0,0,0.05);
}

.context-card:hover {
  transform: translateY(-5px);
  box-shadow: var(--shadow-lg);
}

.context-icon {
  width: 70px;
  height: 70px;
  background: var(--gradient);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  color: white;
  font-size: 1.8rem;
}

.context-card h5 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.context-card p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1.2rem;
}

.services-benefits {
  margin-bottom: 5rem;
}

.benefits-header {
  text-align: center;
  margin-bottom: 2rem;
}

.benefits-header h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.benefits-content {
  max-width: 900px;
  margin: 0 auto;
  background: var(--bg-primary);
  padding: 3rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  text-align: center;
}

.benefits-content p {
  font-size: 1.2rem;
  line-height: 1.7;
  color: var(--text-primary);
}

.partnership-process {
  margin-bottom: 4rem;
}

.process-header {
  text-align: center;
  margin-bottom: 3rem;
}

.process-header h4 {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text-primary);
}

.process-steps {
  max-width: 1000px;
  margin: 0 auto;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 2rem;
  margin-bottom: 3rem;
  background: var(--bg-primary);
  padding: 2.5rem;
  border-radius: var(--radius);
  box-shadow: var(--shadow-md);
  transition: var(--transition);
}

.step-item:hover {
  transform: translateX(10px);
  box-shadow: var(--shadow-lg);
}

.step-number {
  width: 50px;
  height: 50px;
  background: var(--gradient);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  flex-shrink: 0;
}

.step-content h5 {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.step-content p {
  color: var(--text-secondary);
  line-height: 1.6;
  font-size: 1.2rem;
}

.services-cta {
  background: var(--gradient);
  color: white;
  padding: 4rem 3rem;
  border-radius: var(--radius);
  text-align: center;
  box-shadow: var(--shadow-lg);
}

.services-cta .cta-content h4 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.services-cta .cta-content p {
  font-size: 1.2rem;
  opacity: 0.95;
  margin-bottom: 2.5rem;
  line-height: 1.6;
}

.cta-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.cta-btn {
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 600;
}

.services-cta .p-button-outlined {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.3);
  color: white;
}

.services-cta .p-button-outlined:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* Gallery Section */
.gallery-section {
  background: var(--bg-secondary);
  padding: 6rem 0;
}

.gallery-slideshow {
  max-width: 1200px;
  margin: 0 auto;
}

.slideshow-container {
  position: relative;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
  height: 600px;
}

.slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.5s ease-in-out;
  display: flex;
  align-items: center;
}

.slide.active {
  opacity: 1;
}

.slide-image {
  flex: 1;
  height: 100%;
}

.slide-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slide-content {
  flex: 1;
  padding: 3rem;
  background: var(--bg-primary);
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.slide-content h4 {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1rem;
}

.slide-content p {
  font-size: 1.1rem;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.slide-meta {
  display: flex;
  gap: 2rem;
  flex-wrap: wrap;
}

.slide-date,
.slide-location {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.slide-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: var(--transition);
  z-index: 10;
}

.slide-nav:hover {
  background: rgba(0, 0, 0, 0.7);
  transform: translateY(-50%) scale(1.1);
}

.slide-nav.prev {
  left: 20px;
}

.slide-nav.next {
  right: 20px;
}

.slide-dots {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.3);
  cursor: pointer;
  transition: var(--transition);
}

.dot.active,
.dot:hover {
  background: var(--primary);
  transform: scale(1.2);
}

/* Contact */
.contact-section {
  background: var(--gradient);
  color: white;
}

.contact-section .section-title,
.contact-section .section-subtitle {
  color: white;
}

.contact-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 4rem;
}

.contact-card {
  position: relative;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  padding: 0;
  overflow: hidden;
  cursor: pointer;
  transition: var(--transition);
}

.contact-card:hover {
  transform: translateY(-10px) scale(1.02);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.card-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: var(--transition);
}

.contact-card:hover .card-background {
  opacity: 1;
}

.card-glow {
  width: 100%;
  height: 100%;
  background: linear-gradient(45deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05));
}

.email-card:hover .card-glow {
  background: linear-gradient(45deg, rgba(59, 130, 246, 0.2), rgba(147, 51, 234, 0.2));
}

.instagram-card:hover .card-glow {
  background: linear-gradient(45deg, rgba(225, 29, 72, 0.2), rgba(251, 146, 60, 0.2));
}

.location-card:hover .card-glow {
  background: linear-gradient(45deg, rgba(34, 197, 94, 0.2), rgba(59, 130, 246, 0.2));
}

.card-content {
  position: relative;
  padding: 2.5rem;
  text-align: center;
  z-index: 2;
}

.contact-icon {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1.5rem;
  font-size: 2rem;
  color: white;
  transition: var(--transition);
}

.contact-card:hover .contact-icon {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.3);
}

.contact-card h4 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 0.5rem;
}

.contact-value {
  font-size: 1.2rem;
  font-weight: 600;
  color: white;
  margin-bottom: 0.5rem;
}

.contact-address {
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.5;
  margin-bottom: 1rem;
}

.contact-description {
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
  margin-bottom: 1.5rem;
}

.card-action {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  transition: var(--transition);
}

.contact-card:hover .card-action {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.contact-cta {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: var(--radius);
  padding: 3rem;
  text-align: center;
  max-width: 600px;
  margin: 0 auto;
}

.contact-cta h3 {
  font-size: 2rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.contact-cta p {
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.cta-button {
  background: white !important;
  color: var(--primary) !important;
  border: none !important;
  font-weight: 600 !important;
  padding: 1rem 2rem !important;
  border-radius: 50px !important;
}

.cta-button:hover {
  background: rgba(255, 255, 255, 0.9) !important;
  transform: translateY(-2px);
}

/* Animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(40px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .modern-nav {
    top: 1rem;
    padding: 0.75rem 1.5rem;
  }
  
  .nav-content {
    gap: 2rem;
  }
  
  .hero-stats {
    gap: 2rem;
  }
  
  .stat-number {
    font-size: 2rem;
  }
  
  /* Story Layout Mobile */
  .story-layout {
    grid-template-columns: 1fr;
    gap: 2rem;
    margin-bottom: 4rem;
  }
  
  .story-title {
    font-size: 2rem;
  }
  
  .story-visual {
    height: 200px;
  }
  
  .visual-stats {
    gap: 1rem;
  }
  
  /* Timeline Mobile */
  .timeline-items::before {
    left: 30px;
  }
  
  .timeline-item,
  .timeline-item.reverse {
    flex-direction: column;
    padding-left: 80px;
  }
  
  .timeline-marker {
    left: 30px;
    transform: translateX(-50%);
  }
  
  .timeline-content {
    max-width: 100%;
    text-align: left !important;
  }
  
  .timeline-item:not(.reverse) .timeline-content,
  .timeline-item.reverse .timeline-content {
    margin: 0;
    padding: 0;
  }
  
  .timeline-card {
    padding: 1.5rem;
  }
  
  /* Sponsors Mobile */
  .sponsors-grid {
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 1.5rem;
  }
  
  .intro-text {
    padding: 2rem 1.5rem;
  }
  
  .sponsors-cta {
    padding: 2rem 1.5rem;
  }
  
  .cta-actions {
    flex-direction: column;
    align-items: center;
  }
  
  /* Services Mobile */
  .intro-highlight {
    padding: 2rem 1.5rem;
  }
  
  .service-description {
    padding: 2rem 1.5rem;
  }
  
  .context-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
  
  .context-card {
    padding: 2rem 1.5rem;
  }
  
  .benefits-content {
    padding: 2rem 1.5rem;
  }
  
  .step-item {
    flex-direction: column;
    text-align: center;
    padding: 2rem 1.5rem;
  }
  
  .step-item:hover {
    transform: translateY(-5px);
  }
  
  .services-cta {
    padding: 2rem 1.5rem;
  }
  
  /* Committee Mobile */
  .committee-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .committee-member {
    padding: 2rem 1.5rem;
  }
  
  .intro-card {
    padding: 2rem 1.5rem;
  }
  
  .committee-note {
    padding: 1.5rem;
  }
  
  .event-card {
    flex-direction: column;
    text-align: center;
  }
  
  .event-date {
    margin-right: 0;
    margin-bottom: 1rem;
  }
  
  .cta-buttons {
    flex-direction: column;
    align-items: center;
  }
}
</style>
