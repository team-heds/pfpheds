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

    <!-- Hero Ultra-Moderne avec Carousel Background -->
    <section id="hero" class="hero-modern">
      <!-- Photo Carousel en arrière-plan -->
      <div class="hero-carousel-bg">
        <div 
          v-for="(photo, index) in carouselPhotos" 
          :key="index"
          class="carousel-slide"
          :class="{ active: currentCarouselSlide === index }"
        >
          <img :src="getImagePath(photo)" :alt="`Alp'in Physio ${index + 1}`" />
        </div>
      </div>
      
      <!-- Overlay sombre -->
      <div class="hero-overlay"></div>
      
      <div class="hero-container">
        <div class="hero-content">
          <div class="hero-badge">Association Étudiante</div>
          <h1 class="hero-title">
            <span class="title-main">Alp'in</span>
            <span class="title-accent">Physio</span>
          </h1>
          <p class="hero-description">
            Association étudiante depuis 2012
          </p>
          <div class="hero-stats">
            <div class="stat-item">
              <div class="stat-number">13</div>
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
                  <span class="stat-num">13+</span>
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
          </div>
          
          <div class="timeline-items">
            <div class="timeline-item reverse">
              <div class="timeline-image-side">
                <img :src="getImagePath('JPhotos/Photocourses/Tour des Stations/TDS_2024_1.jpeg')" alt="Partenariats Sportifs" />
              </div>
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
                </div>
              </div>
            </div>

            <div class="timeline-item">
              <div class="timeline-image-side">
                <img :src="getImagePath('JPhotos/Photocourses/Grand Raid/grand_raid_24_1.JPG')" alt="Massage Post-Effort" />
              </div>
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
                </div>
              </div>
            </div>

            <div class="timeline-item reverse">
              <div class="timeline-image-side">
                <img :src="getImagePath('JPhotos/Photoconférences/Conférence Bastien Murith/DSC03767.JPG')" alt="Formations et Conférences" />
              </div>
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
          <div class="committee-intro">
            <div class="intro-card">
              <h4>Notre Comité</h4>
              <p>Des étudiants des trois années de Bachelor, chacun avec son rôle clé</p>
              <p>
                Notre comité est composé d'étudiants des trois années de Bachelor ayant chacun 
                son rôle clé au sein de l'association.
              </p>
              <div class="">
                <img :src="getImagePath('JPhotos/Divers/Comité25-26/DSC05361.JPG')" alt="Photo du comité 2025-2026" style="width: 100%; border-radius: 12px; margin-top: 1rem;" />
              </div>
            </div>
          </div>

          <div class="committee-grid">
            <!-- Présidente - Leanne -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/DSC09605.JPG')" alt="Leanne" />
              </div>
              <div class="member-icon">
                <i class="pi pi-crown"></i>
              </div>
              <h5>Présidente – Leanne</h5>
              <h6>Coordination des événements et représentation de l'association</h6>
              <p>
                Sportive et amoureuse de ma Gruyère natale, je me sens chez moi dès que je mets les pieds 
                en montagne. L'appareil photo à la main, je chasse les couchers de soleil en altitude. 
                Ah oui et… j'adore les hélicoptères… !
              </p>
            </div>

            <!-- Vice-président - Romain -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/romain_de_pury.jpeg')" alt="Romain" />
              </div>
              <div class="member-icon">
                <i class="pi pi-user-plus"></i>
              </div>
              <h5>Vice-président – Romain</h5>
              <h6>Soutient à la présidence et gestion des projets</h6>
              <p>
                Passionné de sport (et de bonne bouffe), je dis rarement non à un petit verre pour fêter l'effort. 
                Sur les courses, je suis là pour masser… et surtout pour obéir aux ordres de Leanne !
              </p>
            </div>

            <!-- Secrétaire - Salomé -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/salome_clemons.jpeg')" alt="Salomé" />
              </div>
              <div class="member-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <h5>Secrétaire – Salomé</h5>
              <h6>Gestion administrative</h6>
              <p>
                Hello, moi c'est Salomé et vous me trouverez soit en train de gambader dans les montagnes 
                soit à la découverte d'un autre pays. Toujours le smile, je suis une pub Colgate ambulante 
                et fière de l'être !
              </p>
            </div>

            <!-- Secrétaire - Rosalie -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/rosalie_menoud.jpeg')" alt="Rosalie" />
              </div>
              <div class="member-icon">
                <i class="pi pi-file-edit"></i>
              </div>
              <h5>Secrétaire – Rosalie</h5>
              <h6>Gestion administrative</h6>
              <p>
                Je viens du Valais, une région que j'adore… mais dès que l'occasion se présente, je pars 
                explorer le monde et faire de la plongée sous-marine. Après des années d'athlétisme, 
                je me consacre désormais au volley, au ski et aux sorties en peau de phoque. Et pour me 
                ressourcer, rien de tel que du temps passé avec ma famille, mes amis et mes chats ;)
              </p>
            </div>

            <!-- Caissière - Océane -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/oceane_fornay.jpeg')" alt="Océane" />
              </div>
              <div class="member-icon">
                <i class="pi pi-wallet"></i>
              </div>
              <h5>Caissière – Océane (& Leanne)</h5>
              <h6>Gestion financière et comptabilité</h6>
              <p>
                Archère dans l'âme et accro aux sentiers de trail, j'aime repousser mes limites au grand air. 
                L'appareil photo me suit dans mes aventures, comme un autre moyen de prolonger l'effort. 
                Et pour le carburant… rien ne vaut une pause chocolatée !
              </p>
            </div>

            <!-- Responsable Web & Communication - Loïc -->
            <div class="committee-member">
              <div class="member-photo">
                <div class="photo-placeholder">
                  <i class="pi pi-user"></i>
                </div>
              </div>
              <div class="member-icon">
                <i class="pi pi-megaphone"></i>
              </div>
              <h5>Responsable Web & Communication – Loïc</h5>
              <h6>Communication digitale et gestion du site web</h6>
              <p>Communication digitale et gestion du site web</p>
            </div>

            <!-- Responsables Formations - Groupe -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/Comité25-26/DSC05389.JPG')" alt="Julie, Marine, Méline & Romain" />
              </div>
              <div class="member-icon">
                <i class="pi pi-calendar"></i>
              </div>
              <h5>Responsables Formations & Activités – Julie, Marine, Méline & Romain</h5>
              <h6>Organisation des événements extra-sportifs</h6>
              <p>
                <strong>Julie :</strong> Amoureuse de nature, de sport, de ski et du Valais, je ne dis jamais 
                non à une aventure en montagne… ou à un voyage peu importe la destination.<br><br>
                <strong>Marine :</strong> Curieuse et sportive, j'aime créer des événements qui rassemblent 
                et puiser mon énergie dans la nature et les nouvelles aventures.<br><br>
                <strong>Méline :</strong> Neuchâteloise dans l'âme, je navigue entre lac et montagne. 
                Je vis au rythme du sport et des souvenirs que j'aime figer… surtout quand la photo est 
                réussie du premier coup ! ;)
              </p>
            </div>

            <!-- Responsable Matériel - Léa -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/lea_volpe.jpeg')" alt="Léa" />
              </div>
              <div class="member-icon">
                <i class="pi pi-flag"></i>
              </div>
              <h5>Responsable Matériel – Léa</h5>
              <h6>Logistique et gestion du matériel</h6>
              <p>
                Passionnée par le sport en tout genre, j'apprécie l'aventure et me lancer de nouveaux challenges. 
                Rien de tel que la montagne pour me ressourcer et me reconnecter à l'essentiel. Quant à ma créativité, 
                je lui laisse libre cours dans la pâtisserie et la réalisation de petits bijoux homemade.
              </p>
            </div>

            <!-- Responsable des Responsables - Luca -->
            <div class="committee-member">
              <div class="member-photo">
                <img :src="getImagePath('JPhotos/Divers/photocomite/luca_fleury.jpeg')" alt="Luca" />
              </div>
              <div class="member-icon">
                <i class="pi pi-users"></i>
              </div>
              <h5>Responsable des Responsables de course – Luca</h5>
              <h6>Soutien organisationnel pour les événements sportifs</h6>
              <p>
                L'équilibre de ma vie : les études, le sport et faire la fête ! Je trouve mon bonheur dans la 
                diversité de mes activités. Épicurien dans l'âme, j'aime autant cuisiner que bien manger. 
                Toujours à la recherche des plus beaux paysages au fil de mes voyages.
              </p>
            </div>
          </div>


        </div>

        <!-- Section Sponsors -->
        <div class="sponsors-section">
          
          <div class="sponsors-intro">
            <div class="intro-text">
              <h4>Nos Sponsors</h4>
              <p>Des partenaires fidèles qui nous accompagnent depuis de nombreuses années.</p>
              <p>
                Nos sponsors sont à nos côtés depuis de nombreuses années. Nous pouvons compter sur eux 
                puisqu'ils nous apportent leur soutien précieux dans nos projets et contribuent à la réussite 
                de nos divers événements tout au long de l'année.
              </p>
            </div>
          </div>

          <div class="sponsors-grid">
            <div class="sponsor-card premium">
              <div class="sponsor-logo">
                <img :src="getImagePath('JPhotos/Divers/logosponsors/COMPEX-logo.jpg')" alt="Compex" />
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
                <img :src="getImagePath('JPhotos/Divers/logosponsors/perskindol_2.jpg')" alt="Perskindol" />
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
                <img :src="getImagePath('JPhotos/Divers/logosponsors/PhysioValais_logo_unique.gif')" alt="PhysioSwiss" />
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
                <img :src="getImagePath('JPhotos/Divers/logosponsors/FR-DE_HEdS.png')" alt="HES-SO Valais" />
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
                quelques cours de massage sont dispensés par l'école. Chaque étudiant est donc prêt très tôt à venir
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

// Fonction helper pour les chemins d'images (évite l'analyse statique de Vite)
const getImagePath = (relativePath) => `/assets/images/heds/AlpinPhysioPhoto/${relativePath}`

// Photos du carousel hero
const carouselPhotos = [
  'JPhotos/Divers/Comité25-26/DSC05374.JPG',
  'JPhotos/Divers/Comité25-26/DSC05383.JPG',
  'JPhotos/Divers/Comité25-26/DSC05385.JPG'
]

const currentCarouselSlide = ref(0)

const galleryPhotos = [
  {
    src: getImagePath('JPhotos/Photocourses/Grand Raid/grand_raid_24_1.JPG'),
    alt: 'Grand Raid BCVS 2024',
    title: 'Grand Raid BCVS 2024',
    description: 'Nos étudiants en action lors du Grand Raid offrant des massages de récupération aux coureurs après plusieurs heures de course.',
    date: 'Août 2024',
    location: 'Verbier - Grimentz'
  },
  {
    src: getImagePath('JPhotos/Photoconférences/Conférence Bastien Murith/DSC03767.JPG'), // a changer
    alt: 'Formation au Massage Sportif',
    title: 'Formation au Massage Sportif',
    description: 'Session de formation annuelle pour préparer nos nouveaux étudiants aux techniques de massage post-effort.',
    date: 'Octobre 2024',
    location: 'HES-SO Valais, Leukerbad'
  },
  {
    src: getImagePath('JPhotos/Photocourses/SKA-skieurs/ska_torrent_2024.png'),
    alt: 'Récupération pour les skieurs du SKA',
    title: 'Récupération pour les skieurs du SKA',
    description: 'Aperçu des séances de récupération et d\'étirements, proposées aux jeunes skieurs du SKA Torrent durant l\'hiver 2024.',
    date: 'Hiver 24-25',
    location: 'Torrent'
  },
  {
    src: getImagePath('JPhotos/Photocourses/Trail Verbier - St-Bernard by UTMB/trail_VSB_2024_3.JPG'),
    alt: 'Trail du Grand Saint-Bernard 2024',
    title: 'Trail du Grand Saint-Bernard 2024',
    description: 'Deux belles journées de massage pour notre équipe d\'étudiants sur le Trail Verbier Saint-Bernard by UTMB.',
    date: 'Juillet 2024',
    location: 'Verbier - Saint-Bernard'
  },
  {
    src: getImagePath('JPhotos/Photocourses/Fête Fédérale de Gym 2025/FFG_25_3.JPG'),
    alt: 'Fête Fédérale de gymnastique 2025',
    title: 'Fête Fédérale de gymnastique 2025',
    description: 'Alp\'in Physio a eu l\'honneur de masser durant le week-end de la FFG 2025 en partenariat avec le cabinet EnMouvement. Une chouette expérience sur une fête d\'une telle ampleur !',
    date: 'Juin 2025',
    location: 'Suisse'
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

// Carousel auto-play
let carouselInterval = null

// Lifecycle
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  handleScroll()
  
  // Démarrer le carousel automatique
  carouselInterval = setInterval(() => {
    currentCarouselSlide.value = (currentCarouselSlide.value + 1) % carouselPhotos.length
  }, 5000) // Change toutes les 5 secondes
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (carouselInterval) {
    clearInterval(carouselInterval)
  }
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

/* Hero Carousel Background */
.hero-carousel-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  z-index: 0;
}

.carousel-slide {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 2s ease-in-out;
  z-index: 0;
}

.carousel-slide.active {
  opacity: 1;
  z-index: 1;
}

.carousel-slide img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: brightness(0.6);
  display: block;
  transform: scale(1);
  transition: transform 5s ease-out;
}

.carousel-slide.active img {
  transform: scale(1.05);
}

/* Overlay sombre pour améliorer la lisibilité */
.hero-overlay {
  position: absolute;
  inset: 0;
  z-index: 1;
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
  padding: 4rem 2rem;
  background: linear-gradient(to bottom, transparent 0%, rgba(102, 126, 234, 0.02) 50%, transparent 100%);
}

.timeline-header {
  text-align: center;
  margin-bottom: 5rem;
  position: relative;
}

.timeline-header h4 {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1.5rem;
  letter-spacing: -0.5px;
}

.timeline-line {
  width: 120px;
  height: 5px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  margin: 0 auto;
  border-radius: 3px;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
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
  width: 3px;
  background: linear-gradient(to bottom, #667eea 0%, #764ba2 50%, #667eea 100%);
  transform: translateX(-50%);
  border-radius: 2px;
  box-shadow: 0 0 20px rgba(102, 126, 234, 0.3);
}

.timeline-item {
  display: flex;
  align-items: center;
  margin-bottom: 4rem;
  position: relative;
  gap: 8rem;
}

.timeline-item.reverse {
  flex-direction: row-reverse;
}

.timeline-marker {
  position: absolute;
  left: 50%;
  top: 2rem;
  transform: translateX(-50%);
  width: 70px;
  height: 70px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.6rem;
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
  z-index: 2;
  border: 4px solid white;
  transition: all 0.3s ease;
}

.timeline-item:hover .timeline-marker {
  transform: translateX(-50%) scale(1.1) rotate(5deg);
  box-shadow: 0 15px 40px rgba(102, 126, 234, 0.6);
}

.timeline-content {
  flex: 1;
  max-width: 45%;
}

.timeline-item:not(.reverse) .timeline-content {
  margin-right: auto;
}

.timeline-item.reverse .timeline-content {
  margin-left: auto;
}

.timeline-item:not(.reverse) .timeline-image-side {
  margin-left: auto;
}

.timeline-item.reverse .timeline-image-side {
  margin-right: auto;
}

.timeline-card {
  background: var(--bg-primary);
  padding: 2.5rem;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(102, 126, 234, 0.1);
  position: relative;
  overflow: hidden;
}

.timeline-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--gradient);
  transform: scaleY(0);
  transition: transform 0.4s ease;
}

.timeline-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.2);
  border-color: rgba(102, 126, 234, 0.3);
}

.timeline-card:hover::before {
  transform: scaleY(1);
}

.timeline-image-side {
  width: 45%;
  height: 320px;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
}

.timeline-image-side::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: 1;
}

.timeline-image-side img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.timeline-item:hover .timeline-image-side {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 20px 60px rgba(102, 126, 234, 0.3);
}

.timeline-item:hover .timeline-image-side::before {
  opacity: 1;
}

.timeline-item:hover .timeline-image-side img {
  transform: scale(1.08);
}

.timeline-card h5 {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 1rem;
}

.timeline-card p {
  color: var(--text-secondary);
  line-height: 1.8;
  margin-bottom: 1.5rem;
  font-size: 1.05rem;
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
  margin-top: 1.5rem;
}

.feature {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50px;
  color: var(--text-primary);
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.3s ease;
}

.feature i {
  color: #667eea;
}

.feature:hover {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%);
  transform: translateY(-2px);
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
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  position: relative;
  padding: 1.5rem;
}

.sponsor-logo img {
  width: 180px;
  height: 100px;
  object-fit: contain;
  transition: transform 0.3s ease;
}

.sponsor-card:hover .sponsor-logo img {
  transform: scale(1.05);
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

.member-photo {
  width: 200px;
  height: 200px;
  margin: 0 auto 1.5rem;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid var(--secondary);
  box-shadow: var(--shadow-md);
}

.member-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
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
  margin-bottom: 0.5rem;
  text-align: center;
}

.committee-member h6 {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--secondary);
  margin-bottom: 1rem;
  text-align: center;
}

.committee-member p {
  color: var(--text-secondary);
  line-height: 1.5;
  font-size: 0.95rem;
  text-align: center;
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
  
  .carousel-slide img {
    object-position: center center;
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
  
  .timeline-image-side {
    width: 100%;
    height: 200px;
    margin-bottom: 1rem;
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
