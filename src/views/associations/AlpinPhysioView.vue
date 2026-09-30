<template>
  <div class="alpin-page">
    <a class="skip-link" href="#main">Aller au contenu</a>

    <header class="header" :class="{ scrolled: isScrolled }">
      <a class="brand" href="#hero" aria-label="Alp'in Physio — accueil" @click.prevent="scrollTo('hero')">
        <img :src="logoMarkPath" alt="" /><span>Alp’in <strong>physio</strong></span>
      </a>
      <nav id="main-navigation" class="nav" :class="{ open: isMenuOpen }" aria-label="Navigation principale">
        <a v-for="item in navigation" :key="item.id" :href="`#${item.id}`" :class="{ active: activeSection === item.id }" @click.prevent="scrollTo(item.id)">{{ item.label }}</a>
      </nav>
      <a class="header-cta" href="mailto:alpinphysio@hevs.ch?subject=Proposition%20de%20collaboration">Nous contacter directement <i class="pi pi-arrow-up-right" /></a>
      <button class="menu-button" type="button" :aria-expanded="isMenuOpen" aria-controls="main-navigation" :aria-label="isMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'" @click="isMenuOpen = !isMenuOpen"><i :class="isMenuOpen ? 'pi pi-times' : 'pi pi-bars'" /></button>
    </header>

    <main id="main">
      <section id="hero" class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="hero-kicker">{{ siteContent.heroEyebrow }}</p>
          <h1 id="hero-title"><span>Alp’in</span><strong>Physio</strong></h1>
          <p class="hero-lead">{{ siteContent.heroLead }}</p>
          <div class="hero-actions">
            <a class="button button--primary" href="#about" @click.prevent="scrollTo('about')">Découvrir <i class="pi pi-arrow-down" /></a>
          </div>
        </div>
        <figure class="hero-photo">
          <img :src="getImagePath(siteContent.heroImage)" alt="Le comité Alp’in Physio réuni" fetchpriority="high" />
          <figcaption><strong>{{ siteContent.heroCaption }}</strong></figcaption>
        </figure>
        <div class="hero-facts" aria-label="Alp'in Physio en bref">
          <span><strong>{{ siteContent.yearsCount }}</strong>Années</span>
          <span><strong>{{ siteContent.eventsCount }}</strong>Événements</span>
        </div>
      </section>

      <section id="about" class="about section" aria-labelledby="about-title">
        <div class="about-copy">
          <p class="eyebrow">{{ siteContent.aboutEyebrow }}</p>
          <h2 id="about-title">{{ siteContent.aboutTitle }}</h2>
          <p class="lead">{{ siteContent.aboutLead }}</p>
          <p>{{ siteContent.aboutBody }}</p>
        </div>
        <figure class="about-photo"><img :src="getImagePath(siteContent.aboutImage)" alt="Photo du comité Alp’in Physio" loading="lazy" /></figure>
      </section>

      <section id="team" class="team section" aria-labelledby="team-title">
        <div class="section-heading">
          <div><p class="eyebrow">{{ siteContent.teamEyebrow }}</p><h2 id="team-title">{{ siteContent.teamTitle }}</h2></div>
          <p>{{ siteContent.teamLead }}</p>
        </div>
        <div class="team-grid">
          <article v-for="member in committee" :key="member.name" class="member-card">
            <figure><img :src="getImagePath(member.image)" :alt="`Portrait de ${member.name}`" loading="lazy" :style="{ objectPosition: member.position || 'center' }" /></figure>
            <div class="member-copy"><p>{{ member.role }}</p><h3>{{ member.name }}</h3><details><summary>En savoir plus <i class="pi pi-plus" /></summary><p>{{ member.bio }}</p></details></div>
          </article>
        </div>
      </section>

      <section id="services" class="services" aria-labelledby="services-title">
        <div class="services-intro section">
          <div><p class="eyebrow eyebrow--light">{{ siteContent.servicesEyebrow }}</p><h2 id="services-title">{{ siteContent.servicesTitle }}</h2></div>
          <p>{{ siteContent.servicesLead }}</p>
        </div>
        <div class="activity-grid">
          <article v-for="activity in activities" :key="activity.title" class="activity">
            <figure><img :src="getImagePath(activity.image)" :alt="activity.alt" loading="lazy" /></figure>
            <div><span>{{ activity.number }}</span><h3>{{ activity.title }}</h3><p>{{ activity.description }}</p></div>
          </article>
        </div>
        <div class="process section">
          <div class="process-title"><p class="eyebrow eyebrow--light">{{ siteContent.partnershipEyebrow }}</p><h2>{{ siteContent.partnershipTitle }}</h2></div>
          <ol><li v-for="(step, index) in partnershipSteps" :key="step.title"><span>{{ String(index + 1).padStart(2, '0') }}</span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div></li></ol>
          <div class="partnership-cta">
            <div><p class="eyebrow eyebrow--light">Intéressé par un Partenariat ?</p><h3>{{ siteContent.partnershipCtaTitle }}</h3></div>
            <div class="partnership-actions">
              <a class="button button--outline-light" :href="`mailto:${siteContent.email}?subject=Demande%20du%20contrat%20de%20partenariat`" title="Demander le document par e-mail"><i class="pi pi-file-pdf" /> {{ siteContent.contractLabel }}</a>
              <a class="button button--turquoise" href="mailto:alpinphysio@hevs.ch?subject=Proposition%20de%20collaboration">Nous contacter directement <i class="pi pi-arrow-up-right" /></a>
            </div>
          </div>
        </div>
      </section>

      <section id="calendar" class="calendar section" aria-labelledby="calendar-title">
        <div class="section-heading"><div><p class="eyebrow">{{ siteContent.calendarEyebrow }}</p><h2 id="calendar-title">{{ siteContent.calendarTitle }}</h2></div></div>
        <ol v-if="events.length" class="event-list"><li v-for="event in events" :key="event.id || event.title"><time :datetime="event.start_date"><strong>{{ event.day }}</strong><span>{{ event.month }}</span></time><div><h3>{{ event.title }}</h3><p><i class="pi pi-map-marker" />{{ event.location }}</p></div><i class="pi pi-arrow-up-right" /></li></ol>
        <div v-else class="public-empty-state"><i class="pi pi-calendar" /><p>Les prochaines dates seront publiées ici.</p></div>
      </section>

      <section id="gallery" class="gallery section" aria-labelledby="gallery-title">
        <div class="section-heading"><div><p class="eyebrow">{{ siteContent.galleryEyebrow }}</p><h2 id="gallery-title">{{ siteContent.galleryTitle }}</h2></div><div class="gallery-count">{{ currentSlide + 1 }} / {{ galleryPhotos.length }}</div></div>
        <figure class="gallery-main"><img :src="activePhoto.src" :alt="activePhoto.alt" /><figcaption><span>{{ activePhoto.date }} · {{ activePhoto.location }}</span><h3>{{ activePhoto.title }}</h3><p>{{ activePhoto.description }}</p></figcaption><div class="gallery-controls"><button type="button" aria-label="Photo précédente" @click="previousSlide"><i class="pi pi-arrow-left" /></button><button type="button" aria-label="Photo suivante" @click="nextSlide"><i class="pi pi-arrow-right" /></button></div></figure>
        <div class="gallery-strip" aria-label="Choisir une photo"><button v-for="(photo, index) in galleryPhotos" :key="photo.src" type="button" :class="{ active: index === currentSlide }" :aria-label="`Afficher ${photo.title}`" @click="currentSlide = index"><img :src="photo.src" alt="" loading="lazy" /><span>{{ photo.title }}</span></button></div>
      </section>

      <section class="partners section" aria-labelledby="partners-title"><div><p class="eyebrow">{{ siteContent.partnersEyebrow }}</p><h2 id="partners-title">{{ siteContent.partnersTitle }}</h2></div><div class="partner-grid"><a v-for="partner in partners" :key="partner.name" :href="partner.url" target="_blank" rel="noopener noreferrer"><img :src="getImagePath(partner.logo)" :alt="partner.name" loading="lazy" /></a></div></section>

      <section id="contact" class="contact" aria-labelledby="contact-title">
        <div class="contact-photo"><img :src="getImagePath(siteContent.contactImage)" alt="Formation pratique au massage sportif organisée par Alp’in Physio" loading="lazy" /></div>
        <div class="contact-copy">
          <p class="eyebrow eyebrow--light">{{ siteContent.contactEyebrow }}</p>
          <h2 id="contact-title">{{ siteContent.contactTitle }}</h2>
          <p>{{ siteContent.contactLead }}</p>
          <a class="contact-mail" :href="`mailto:${siteContent.email}`">{{ siteContent.email }} <i class="pi pi-arrow-up-right" /></a>
          <div class="contact-meta">
            <a class="contact-card contact-card--instagram" :href="siteContent.instagramUrl" target="_blank" rel="noopener noreferrer"><i class="pi pi-instagram" /><span><small>Suivez nos aventures sportives</small><strong>{{ siteContent.instagram }}</strong></span><i class="pi pi-arrow-up-right" /></a>
            <a class="contact-card" :href="siteContent.addressUrl" target="_blank" rel="noopener noreferrer"><i class="pi pi-map-marker" /><span><small>Notre Adresse</small><strong>{{ siteContent.address }}</strong></span><i class="pi pi-arrow-up-right" /></a>
          </div>
        </div>
      </section>
    </main>
    <footer class="footer"><img :src="logoPath" alt="" /><span>Association étudiante · HES-SO Valais-Wallis</span><span>© {{ new Date().getFullYear() }} Alp’in Physio</span></footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { getSiteContent, listAlpinEvents } from '@/service/alpinPhysioAdminService'
import { cloneAlpinPhysioSiteContent } from '@/data/alpinPhysioSiteContent'

const getImagePath = (path) => `/assets/images/heds/AlpinPhysioPhoto/${path}`
const logoPath = getImagePath('JPhotos/Divers/logoalpin/ALPINPHYSIO-logo-bleu-impression_transparent.jpg')
const logoMarkPath = getImagePath('JPhotos/Divers/logoalpin/alpinphysio-mark.jpg')
const navigation = [{ id: 'about', label: 'Notre Histoire' }, { id: 'team', label: 'Notre Comité' }, { id: 'services', label: 'Nos Prestations' }, { id: 'calendar', label: 'Notre Calendrier' }, { id: 'gallery', label: 'Nos Moments' }]
const builtInCommittee = [
  { name: 'Leanne', role: 'Présidente', image: 'JPhotos/Divers/photocomite/DSC09605-portrait.JPG', position: 'center 42%', bio: `Sportive et amoureuse de ma Gruyère natale, je me sens chez moi dès que je mets les pieds en montagne. L'appareil photo à la main, je chasse les couchers de soleil en altitude. Ah oui et… j'adore les hélicoptères… !` },
  { name: 'Romain', role: 'Vice-président', image: 'JPhotos/Divers/photocomite/romain_de_pury.jpeg', bio: `Passionné de sport (et de bonne bouffe), je dis rarement non à un petit verre pour fêter l'effort. Sur les courses, je suis là pour masser… et surtout pour obéir aux ordres de Leanne !` },
  { name: 'Salomé', role: 'Secrétaire', image: 'JPhotos/Divers/photocomite/salome_clemons.jpeg', bio: `Hello, moi c'est Salomé et vous me trouverez soit en train de gambader dans les montagnes soit à la découverte d'un autre pays. Toujours le smile, je suis une pub Colgate ambulante et fière de l'être !` },
  { name: 'Rosalie', role: 'Secrétaire', image: 'JPhotos/Divers/photocomite/rosalie_menoud.jpeg', position: 'center 35%', bio: `Je viens du Valais, une région que j'adore… mais dès que l'occasion se présente, je pars explorer le monde et faire de la plongée sous-marine. Après des années d'athlétisme, je me consacre désormais au volley, au ski et aux sorties en peau de phoque. Et pour me ressourcer, rien de tel que du temps passé avec ma famille, mes amis et mes chats ;)` },
  { name: 'Océane', role: 'Caissière (& Leanne)', image: 'JPhotos/Divers/photocomite/oceane_fornay.jpeg', bio: `Archère dans l'âme et accro aux sentiers de trail, j'aime repousser mes limites au grand air. L'appareil photo me suit dans mes aventures, comme un autre moyen de prolonger l'effort. Et pour le carburant… rien ne vaut une pause chocolatée !` },
  { name: 'Loïc', role: 'Responsable Web & Communication', image: 'JPhotos/Divers/photocomite/loic_orny.JPG', bio: `Entre des longueurs de nage, des kilomètres à vélo et un bon run, je garde toujours de l’énergie pour rigoler, écouter de la musique et dévorer tout ce qui passe à table!` },
  { name: 'Julie, Marine, Méline & Romain', role: 'Responsables Formations & Activités', image: 'JPhotos/Divers/Comité25-26/DSC05389.JPG', bio: `Julie : Amoureuse de nature, de sport, de ski et du Valais, je ne dis jamais non à une aventure en montagne… ou à un voyage peu importe la destination. Marine : Curieuse et sportive, j'aime créer des événements qui rassemblent et puiser mon énergie dans la nature et les nouvelles aventures. Méline : Neuchâteloise dans l'âme, je navigue entre lac et montagne. Je vis au rythme du sport et des souvenirs que j'aime figer… surtout quand la photo est réussie du premier coup ! ;)` },
  { name: 'Léa', role: 'Responsable Matériel', image: 'JPhotos/Divers/photocomite/lea_volpe.jpeg', bio: `Passionnée par le sport en tout genre, j'apprécie l'aventure et me lancer de nouveaux challenges. Rien de tel que la montagne pour me ressourcer et me reconnecter à l'essentiel. Quant à ma créativité, je lui laisse libre cours dans la pâtisserie et la réalisation de petits bijoux homemade.` },
  { name: 'Luca', role: 'Responsable des Responsables de course', image: 'JPhotos/Divers/photocomite/luca_fleury.jpeg', bio: `L'équilibre de ma vie : les études, le sport et faire la fête ! Je trouve mon bonheur dans la diversité de mes activités. Épicurien dans l'âme, j'aime autant cuisiner que bien manger. Toujours à la recherche des plus beaux paysages au fil de mes voyages.` }
]
const builtInActivities = [
  { number: '01', title: 'Massage Post-Effort', description: 'Les étudiants de Loèche-les-Bains se mettent à disposition lors de courses pour le massage post-effort des participants. Cela permet aux sportifs de bénéficier de massages de qualité.', image: 'JPhotos/Photocourses/Grand Raid/grand_raid_24_1.JPG', alt: 'Massage Post-Effort' },
  { number: '02', title: 'Partenariats Sportifs', description: `Alp'in physio crée des partenariats avec petites et grandes manifestations sportives (Sierre-Zinal, le Grand Raid...), essentiellement en Suisse romande de par la localisation de notre école.`, image: 'JPhotos/Photocourses/Tour des Stations/TDS_2024_1.jpeg', alt: 'Partenariats Sportifs' },
  { number: '03', title: 'Formations et Conférences', description: `Au-delà de la pratique sur le terrain, nous mettons sur pied diverses conférences et formations au sein de l'école pour développer le réseau professionnel et approfondir les connaissances.`, image: 'JPhotos/Photoconférences/Conférence Bastien Murith/DSC03767.JPG', alt: 'Formations et Conférences' }
]
const builtInPartnershipSteps = [
  { title: 'Premier Contact', description: `Pour toute demande de partenariat, veuillez contacter le comité de l'association à l'adresse suivante : alpinphysio@hevs.ch. Décrivez les besoins nécessaires pour votre évènement (date et lieu, horaire, estimation de nombre de masseurs...) et nous ferons un premier sondage auprès des étudiants pour trouver un responsable de course avec qui vous aurez contact pour la suite de l'organisation.` },
  { title: 'Recrutement des Étudiants', description: `Après cette première prise de contact entre les organisateurs et Alp'in Physio, l'association recrute le nombre d'étudiants souhaité qui feront ensuite le déplacement le jour de course.` },
  { title: 'Matériel et Logistique', description: `Si besoin, nous pouvons amener notre propre matériel de massage (tables, huile, tape…) afin d'assurer la bonne tenue de notre stand.` },
  { title: 'Conditions Contractuelles', description: `Vous trouverez ci-dessous un document décrivant les conditions contractuelles d'un partenariat avec Alp'in Physio.` }
]
const siteContent = reactive(cloneAlpinPhysioSiteContent())
const fallbackEvents = [{ id: 'fallback-1', day: '06', month: 'SEP', title: 'Grand Raid BCVS', location: 'Verbier' }, { id: 'fallback-2', day: '28', month: 'SEP', title: 'RunMate', location: 'Montreux' }]
const events = ref([])
const loadPublicContent = async () => {
  try {
    const [{ content }, rows] = await Promise.all([getSiteContent(), listAlpinEvents({ publicOnly: true })])
    Object.assign(siteContent, cloneAlpinPhysioSiteContent(content || {}))
    events.value = rows.map((event) => {
      const date = new Date(event.start_date)
      return {
        ...event,
        day: new Intl.DateTimeFormat('fr-CH', { day: '2-digit' }).format(date),
        month: new Intl.DateTimeFormat('fr-CH', { month: 'short' }).format(date).replace('.', '').toUpperCase(),
        location: event.lieu || 'Lieu à confirmer',
      }
    })
  } catch (error) {
    console.warn('[AlpinPhysio] Contenu dynamique indisponible, utilisation du contenu intégré.', error)
    events.value = fallbackEvents
  }
}
const builtInPartners = [{ name: 'Compex', logo: 'JPhotos/Divers/logosponsors/COMPEX-logo.jpg', url: 'https://www.compex.com/' }, { name: 'Perskindol', logo: 'JPhotos/Divers/logosponsors/perskindol_2.jpg', url: 'https://www.perskindol.ch/' }, { name: 'PhysioValais', logo: 'JPhotos/Divers/logosponsors/PhysioValais_logo_unique.gif', url: 'https://www.physioswiss.ch/' }, { name: 'HES-SO Valais-Wallis', logo: 'JPhotos/Divers/logosponsors/FR-DE_HEdS.png', url: 'https://www.hevs.ch/' }]
const builtInGalleryPhotos = [
  { src: getImagePath('JPhotos/Photocourses/Grand Raid/grand_raid_24_1.JPG'), alt: 'Grand Raid BCVS 2024', title: 'Grand Raid BCVS 2024', description: 'Nos étudiants en action lors du Grand Raid offrant des massages de récupération aux coureurs après plusieurs heures de course.', date: 'Août 2024', location: 'Verbier - Grimentz' },
  { src: getImagePath('JPhotos/Photoformations/DSC05658.JPG'), alt: 'Formation au Massage Sportif', title: 'Formation au Massage Sportif', description: 'Session de formation annuelle pour préparer nos nouveaux étudiants aux techniques de massage post-effort.', date: 'Octobre 2024', location: 'HES-SO Valais, Leukerbad' },
  { src: getImagePath('JPhotos/Photocourses/SKA-skieurs/ska_torrent_2024.png'), alt: 'Récupération pour les skieurs du SKA', title: 'Récupération pour les skieurs du SKA', description: `Aperçu des séances de récupération et d'étirements, proposées aux jeunes skieurs du SKA Torrent durant l'hiver 2024.`, date: 'Hiver 24-25', location: 'Torrent' },
  { src: getImagePath('JPhotos/Photocourses/Trail Verbier - St-Bernard by UTMB/trail_VSB_2024_3.JPG'), alt: 'Trail du Grand Saint-Bernard 2024', title: 'Trail du Grand Saint-Bernard 2024', description: `Deux belles journées de massage pour notre équipe d'étudiants sur le Trail Verbier Saint-Bernard by UTMB.`, date: 'Juillet 2024', location: 'Verbier - Saint-Bernard' },
  { src: getImagePath('JPhotos/Photocourses/Fête Fédérale de Gym 2025/FFG_25_3.JPG'), alt: 'Fête Fédérale de gymnastique 2025', title: 'Fête Fédérale de gymnastique 2025', description: `Alp'in Physio a eu l'honneur de masser durant le week-end de la FFG 2025 en partenariat avec le cabinet EnMouvement. Une chouette expérience sur une fête d'une telle ampleur !`, date: 'Juin 2025', location: 'Suisse' }
]
const committee = computed(() => siteContent.committee?.length ? siteContent.committee : builtInCommittee)
const activities = computed(() => siteContent.activities?.length ? siteContent.activities : builtInActivities)
const partnershipSteps = computed(() => siteContent.partnershipSteps?.length ? siteContent.partnershipSteps : builtInPartnershipSteps)
const partners = computed(() => siteContent.partners?.length ? siteContent.partners : builtInPartners)
const galleryPhotos = computed(() => (siteContent.galleryPhotos?.length ? siteContent.galleryPhotos : builtInGalleryPhotos).map((photo) => ({
  ...photo,
  src: photo.src || getImagePath(photo.image),
})))
const currentSlide = ref(0)
const activePhoto = computed(() => galleryPhotos.value[currentSlide.value] || galleryPhotos.value[0])
const activeSection = ref('about')
const isMenuOpen = ref(false)
const isScrolled = ref(false)
let scrollRoot
const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); isMenuOpen.value = false }
const nextSlide = () => { currentSlide.value = (currentSlide.value + 1) % galleryPhotos.value.length }
const previousSlide = () => { currentSlide.value = currentSlide.value ? currentSlide.value - 1 : galleryPhotos.value.length - 1 }
const updateNavigation = () => { isScrolled.value = (scrollRoot?.scrollTop ?? window.scrollY) > 20; const rootTop = scrollRoot === document.scrollingElement ? 0 : (scrollRoot?.getBoundingClientRect().top ?? 0); navigation.forEach(({ id }) => { const top = document.getElementById(id)?.getBoundingClientRect().top; if (typeof top === 'number' && top <= rootTop + 170) activeSection.value = id }) }
onMounted(() => { loadPublicContent(); scrollRoot = document.getElementById('main-content') || document.scrollingElement; scrollRoot?.addEventListener?.('scroll', updateNavigation, { passive: true }); updateNavigation() })
onUnmounted(() => scrollRoot?.removeEventListener?.('scroll', updateNavigation))
</script>

<style scoped>
.alpin-page{--ink:#172123;--muted:#5c6a6d;--line:#dce3e1;--paper:#fbfcfa;--mist:#eef3f1;--aqua:#75d9df;--aqua-dark:#168794;--white:#fff;color:var(--ink);background:var(--paper);font-family:var(--app-font-family,'Poppins',sans-serif);-webkit-font-smoothing:antialiased;overflow:clip}.alpin-page *{box-sizing:border-box}.alpin-page img{image-orientation:from-image}.alpin-page ::selection{background:var(--aqua);color:var(--ink)}a:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid var(--aqua-dark);outline-offset:4px}.skip-link{position:fixed;z-index:2000;top:.75rem;left:.75rem;padding:.75rem 1rem;color:#fff;background:var(--ink);transform:translateY(-150%)}.skip-link:focus{transform:none}.section{width:min(1240px,calc(100% - 5rem));margin-inline:auto}.header{position:fixed;z-index:1000;inset:0 0 auto;height:82px;display:grid;grid-template-columns:190px 1fr auto;align-items:center;gap:2rem;padding:0 clamp(1.5rem,4vw,4rem);background:rgba(255,255,255,.94);border-bottom:1px solid rgba(23,33,35,.08);backdrop-filter:blur(16px);transition:box-shadow .2s ease}.header.scrolled{box-shadow:0 12px 35px rgba(23,33,35,.08)}.brand{width:150px;height:62px;display:grid;place-items:center;overflow:hidden}.brand img{width:144px;display:block}.nav{display:flex;align-items:center;justify-content:center;gap:clamp(.8rem,2vw,2rem)}.nav a{position:relative;padding:.7rem 0;color:#556164;font-size:.8rem;font-weight:600;text-decoration:none}.nav a:after{content:'';position:absolute;right:0;bottom:.35rem;left:0;height:2px;background:var(--aqua-dark);transform:scaleX(0);transform-origin:left;transition:transform .18s ease}.nav a:hover,.nav a.active{color:var(--ink)}.nav a:hover:after,.nav a.active:after{transform:scaleX(1)}.header-cta{display:inline-flex;align-items:center;gap:.55rem;padding:.75rem 1rem;color:#fff;background:var(--ink);font-size:.78rem;font-weight:700;text-decoration:none;border-radius:4px}.menu-button{display:none}.eyebrow{margin:0 0 1rem;color:var(--aqua-dark);font-size:.74rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase}.eyebrow--light{color:var(--aqua)}.hero{padding:calc(82px + clamp(3.5rem,7vw,7rem)) clamp(2rem,5vw,5rem) clamp(3rem,5vw,5rem);background:linear-gradient(180deg,#f5f8f7 0%,#fff 100%)}.hero-copy{width:min(1240px,100%);margin:0 auto 3rem}.hero h1{max-width:1020px;margin:0;font-size:clamp(3.2rem,7vw,7.2rem);line-height:.96;letter-spacing:-.05em;text-wrap:balance}.hero h1 em{color:var(--aqua-dark);font-style:normal}.hero-lead{max-width:67ch;margin:1.8rem 0 0;color:var(--muted);font-size:clamp(1.05rem,1.5vw,1.25rem);line-height:1.7}.hero-actions{display:flex;flex-wrap:wrap;gap:.8rem;margin-top:2rem}.button{min-height:52px;display:inline-flex;align-items:center;justify-content:center;gap:.65rem;padding:.8rem 1.15rem;border:1px solid transparent;border-radius:4px;font-size:.85rem;font-weight:700;text-decoration:none;transition:transform .16s ease,background .16s ease}.button:active{transform:scale(.97)}.button--primary{color:#fff;background:var(--ink)}.button--primary:hover{background:#293638}.button--ghost{color:var(--ink);border-color:#aab6b4;background:#fff}.button--ghost:hover{border-color:var(--ink)}.button--turquoise{color:var(--ink);background:var(--aqua)}.hero-photo{position:relative;width:min(1450px,100%);margin:0 auto;overflow:hidden;background:#dce6e3;border-radius:6px}.hero-photo img{width:100%;height:auto;max-height:800px;display:block;object-fit:cover;object-position:center}.hero-photo figcaption{position:absolute;right:1rem;bottom:1rem;display:flex;flex-direction:column;gap:.15rem;padding:.85rem 1rem;color:#fff;background:rgba(23,33,35,.86);border-radius:3px}.hero-photo figcaption strong{font-size:.84rem}.hero-photo figcaption span{font-size:.68rem;opacity:.75}.hero-facts{width:min(1240px,100%);display:grid;grid-template-columns:repeat(3,1fr);margin:1.5rem auto 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}.hero-facts span{display:flex;align-items:baseline;gap:.7rem;padding:1.1rem 1.5rem;color:var(--muted);font-size:.76rem}.hero-facts span+span{border-left:1px solid var(--line)}.hero-facts strong{color:var(--ink);font-size:1.5rem}.about{display:grid;grid-template-columns:.28fr .87fr .85fr;gap:clamp(2rem,6vw,6rem);align-items:start;padding-block:clamp(7rem,11vw,11rem)}.section-label{display:flex;align-items:center;gap:.6rem;color:#7c898b;font-size:.72rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.section-label span{color:var(--aqua-dark)}.about h2,.section-heading h2,.services h2,.process h2,.contact h2{margin:0;font-size:clamp(2.6rem,5vw,5.1rem);line-height:1.02;letter-spacing:-.045em;text-wrap:balance}.about .lead{margin:2rem 0 1rem;font-size:1.12rem;font-weight:600;line-height:1.7}.about-copy>p:last-child{margin:0;color:var(--muted);line-height:1.75}.about-photo{margin:0}.about-photo img{width:100%;aspect-ratio:4/3;display:block;object-fit:cover;border-radius:5px}.about-photo figcaption{margin-top:.8rem;color:var(--muted);font-size:.75rem}.team{padding-bottom:clamp(7rem,11vw,11rem)}.section-heading{display:grid;grid-template-columns:1.15fr .65fr;gap:clamp(3rem,9vw,9rem);align-items:end;margin-bottom:3.5rem}.section-heading>p{max-width:52ch;margin:0;color:var(--muted);line-height:1.7}.team-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.1rem}.member-card{min-width:0;background:#fff;border:1px solid var(--line);border-radius:5px;overflow:hidden}.member-card:nth-child(1),.member-card:nth-child(7){grid-column:span 2}.member-card figure{margin:0;overflow:hidden;background:var(--mist)}.member-card figure img{width:100%;aspect-ratio:4/5;display:block;object-fit:cover;transition:transform .45s ease}.member-card:nth-child(1) figure img,.member-card:nth-child(7) figure img{aspect-ratio:8/5}.member-card:hover figure img{transform:scale(1.025)}.member-copy{padding:1.2rem}.member-copy>p{margin:0 0 .35rem;color:var(--aqua-dark);font-size:.7rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}.member-copy h3{margin:0;font-size:1.08rem}.member-copy details{margin-top:1rem;padding-top:.8rem;border-top:1px solid var(--line)}.member-copy summary{display:flex;align-items:center;justify-content:space-between;color:var(--muted);font-size:.73rem;font-weight:600;cursor:pointer;list-style:none}.member-copy summary::-webkit-details-marker{display:none}.member-copy details[open] summary i{transform:rotate(45deg)}.member-copy details>p{margin:.8rem 0 0;color:var(--muted);font-size:.8rem;line-height:1.6}.services{color:#fff;background:var(--ink)}.services-intro{display:grid;grid-template-columns:.28fr 1fr .7fr;gap:clamp(2rem,6vw,6rem);align-items:end;padding-block:clamp(7rem,10vw,10rem) 4rem}.section-label--light{color:rgba(255,255,255,.48)}.services-intro>p{margin:0;color:rgba(255,255,255,.65);line-height:1.75}.activity-grid{width:min(1450px,calc(100% - 5rem));display:grid;grid-template-columns:1.15fr .85fr .85fr;gap:1rem;margin-inline:auto}.activity{position:relative;min-height:580px;overflow:hidden;border-radius:5px}.activity figure{position:absolute;inset:0;margin:0}.activity img{width:100%;height:100%;display:block;object-fit:cover;transition:transform .55s ease}.activity:hover img{transform:scale(1.03)}.activity:after{content:'';position:absolute;inset:0;background:linear-gradient(0deg,rgba(10,18,20,.9),transparent 62%)}.activity>div{position:absolute;z-index:1;right:0;bottom:0;left:0;padding:1.5rem}.activity span{color:var(--aqua);font-size:.7rem;font-weight:700}.activity h3{margin:.6rem 0;font-size:clamp(1.5rem,2.5vw,2.5rem);line-height:1.05}.activity p{max-width:44ch;margin:0;color:rgba(255,255,255,.72);font-size:.85rem;line-height:1.65}.process{display:grid;grid-template-columns:.65fr 1fr;gap:clamp(3rem,8vw,8rem);padding-block:clamp(7rem,10vw,10rem)}.process-title h2{font-size:clamp(2.7rem,4.5vw,4.6rem)}.process ol{margin:0;padding:0;list-style:none;border-top:1px solid rgba(255,255,255,.18)}.process li{display:grid;grid-template-columns:48px 1fr;gap:1rem;padding:1.25rem 0;border-bottom:1px solid rgba(255,255,255,.18)}.process li>span{color:var(--aqua);font-size:.72rem;font-weight:700}.process h3{margin:0;font-size:1rem}.process p{margin:.35rem 0 0;color:rgba(255,255,255,.62);font-size:.82rem;line-height:1.6}.process>.button{grid-column:2;justify-self:start}.calendar{padding-block:clamp(7rem,11vw,11rem)}.event-list{margin:0;padding:0;list-style:none;border-top:1px solid var(--line)}.event-list li{display:grid;grid-template-columns:140px 1fr 24px;gap:2rem;align-items:center;padding:1.25rem 0;border-bottom:1px solid var(--line)}.event-list time{display:flex;align-items:baseline;gap:.6rem}.event-list time strong{font-size:3.1rem;line-height:1;letter-spacing:-.06em}.event-list time span{color:var(--aqua-dark);font-size:.7rem;font-weight:700}.event-list h3{margin:0;font-size:1.15rem}.event-list p{display:flex;align-items:center;gap:.4rem;margin:.35rem 0 0;color:var(--muted);font-size:.8rem}.event-list>li>i{color:var(--aqua-dark)}.gallery{padding-bottom:clamp(7rem,11vw,11rem)}.gallery-count{color:var(--muted);font-size:.85rem;font-variant-numeric:tabular-nums}.gallery-main{position:relative;display:grid;grid-template-columns:1.4fr .6fr;min-height:620px;margin:0;color:#fff;background:var(--ink);border-radius:5px;overflow:hidden}.gallery-main>img{width:100%;height:100%;min-height:620px;display:block;object-fit:cover}.gallery-main figcaption{display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(2rem,4vw,4rem)}.gallery-main figcaption span{color:var(--aqua);font-size:.68rem;font-weight:700;text-transform:uppercase}.gallery-main h3{margin:1rem 0;font-size:clamp(2rem,3.2vw,3.2rem);line-height:1.04}.gallery-main p{margin:0;color:rgba(255,255,255,.68);line-height:1.7}.gallery-controls{position:absolute;right:0;bottom:0;display:flex}.gallery-controls button{width:54px;height:54px;border:0;color:var(--ink);background:var(--aqua);cursor:pointer}.gallery-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:.7rem;margin-top:.7rem}.gallery-strip button{position:relative;height:120px;padding:0;overflow:hidden;border:0;border-radius:3px;background:var(--ink);cursor:pointer;opacity:.55}.gallery-strip button:hover,.gallery-strip button.active{opacity:1}.gallery-strip button.active{outline:3px solid var(--aqua-dark);outline-offset:2px}.gallery-strip img{width:100%;height:100%;display:block;object-fit:cover}.gallery-strip span{position:absolute;right:.6rem;bottom:.5rem;left:.6rem;overflow:hidden;color:#fff;font-size:.68rem;font-weight:700;text-align:left;text-overflow:ellipsis;white-space:nowrap}.partners{display:grid;grid-template-columns:.5fr 1.5fr;gap:4rem;align-items:center;padding-block:clamp(5rem,8vw,8rem);border-top:1px solid var(--line)}.partners h2{margin:0;font-size:2.7rem}.partner-grid{display:grid;grid-template-columns:repeat(4,1fr)}.partner-grid a{min-height:120px;display:grid;place-items:center;padding:1rem;border-left:1px solid var(--line)}.partner-grid img{width:min(145px,85%);height:66px;object-fit:contain;filter:grayscale(1);opacity:.7}.partner-grid a:hover img{filter:none;opacity:1}.contact{display:grid;grid-template-columns:1fr 1fr;min-height:720px;color:#fff;background:var(--ink)}.contact-photo{min-width:0}.contact-photo img{width:100%;height:100%;display:block;object-fit:cover}.contact-copy{display:flex;flex-direction:column;justify-content:center;padding:clamp(3rem,7vw,7rem)}.contact h2{font-size:clamp(2.7rem,4.7vw,5rem)}.contact-copy>p{max-width:55ch;margin:1.5rem 0;color:rgba(255,255,255,.68);line-height:1.7}.contact-mail{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1.2rem 0;color:var(--aqua);border-top:1px solid rgba(255,255,255,.2);border-bottom:1px solid rgba(255,255,255,.2);font-size:clamp(1.1rem,2vw,1.7rem);font-weight:700;text-decoration:none;overflow-wrap:anywhere}.contact-meta{display:flex;flex-wrap:wrap;gap:1.5rem;margin-top:1.5rem}.contact-meta a{color:#fff;font-size:.78rem;text-underline-offset:.3rem}.footer{min-height:100px;display:flex;align-items:center;justify-content:space-between;gap:2rem;padding:1.5rem clamp(2rem,5vw,5rem);background:#fff;border-top:1px solid var(--line);font-size:.7rem;color:var(--muted)}.footer img{width:130px}
@media(max-width:1050px){.header{grid-template-columns:165px 1fr auto;gap:1rem}.header-cta{display:none}.about{grid-template-columns:.25fr 1fr}.about-photo{grid-column:2}.team-grid{grid-template-columns:repeat(3,1fr)}.member-card:nth-child(1),.member-card:nth-child(7){grid-column:span 1}.member-card:nth-child(1) figure img,.member-card:nth-child(7) figure img{aspect-ratio:4/5}.services-intro{grid-template-columns:.25fr 1fr}.services-intro>p{grid-column:2}.activity-grid{grid-template-columns:repeat(3,1fr)}.process{grid-template-columns:.75fr 1fr}.gallery-main{grid-template-columns:1.1fr .9fr}}
@media(max-width:800px){.section{width:min(100% - 2.5rem,1240px)}.header{height:72px;grid-template-columns:150px 1fr 46px;padding-inline:1rem}.brand{width:140px;height:58px}.brand img{width:132px}.menu-button{width:44px;height:44px;display:grid;place-items:center;grid-column:3;border:1px solid var(--line);background:#fff}.nav{position:absolute;top:72px;right:0;left:0;display:none;flex-direction:column;align-items:stretch;padding:1rem 1.25rem 1.5rem;background:#fff;border-bottom:1px solid var(--line)}.nav.open{display:flex}.nav a{min-height:46px;display:flex;align-items:center;border-bottom:1px solid var(--line)}.hero{padding:calc(72px + 3.5rem) 1.25rem 3rem}.hero-photo img{min-height:430px;object-fit:cover}.hero-facts{grid-template-columns:1fr}.hero-facts span+span{border-top:1px solid var(--line);border-left:0}.about,.services-intro,.section-heading,.process,.partners,.contact{grid-template-columns:1fr}.section-label{margin-bottom:1rem}.about-photo,.services-intro>p,.process>.button{grid-column:1}.team-grid{grid-template-columns:repeat(2,1fr)}.activity-grid{width:calc(100% - 2.5rem);grid-template-columns:1fr}.activity{min-height:520px}.process-title{margin-bottom:1rem}.gallery-main{grid-template-columns:1fr}.gallery-main>img{min-height:460px}.gallery-main figcaption{min-height:250px;padding-bottom:5rem}.gallery-strip{grid-template-columns:repeat(4,180px);overflow-x:auto;padding:4px}.partner-grid{grid-template-columns:repeat(2,1fr)}.partner-grid a{border-bottom:1px solid var(--line)}.contact-photo{min-height:500px}.footer{align-items:flex-start;flex-direction:column}}
@media(max-width:520px){.hero h1{font-size:clamp(3rem,15vw,4.4rem)}.hero-actions{align-items:stretch;flex-direction:column}.hero-photo img{min-height:360px;object-position:center}.hero-photo figcaption{position:static;border-radius:0}.about h2,.section-heading h2,.services h2,.process h2,.contact h2{font-size:clamp(2.45rem,12vw,3.5rem)}.team-grid{grid-template-columns:1fr}.member-card figure img,.member-card:nth-child(1) figure img,.member-card:nth-child(7) figure img{aspect-ratio:4/4.4}.activity{min-height:450px}.event-list li{grid-template-columns:82px 1fr 20px;gap:1rem}.event-list time strong{font-size:2.5rem}.gallery-main>img{min-height:340px}.contact-photo{min-height:380px}.contact-copy{padding:4rem 1.25rem}.footer{padding-inline:1.25rem}}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{scroll-behavior:auto!important;transition-duration:.01ms!important;animation-duration:.01ms!important}}
.brand{width:auto;height:62px;display:flex;align-items:center;gap:.45rem;overflow:visible;color:var(--ink);text-decoration:none;white-space:nowrap}.brand img{width:72px;height:42px;display:block;object-fit:cover}.brand span{font-size:1.05rem;font-weight:600;letter-spacing:-.035em}.brand strong{color:var(--aqua-dark);font-weight:600}.hero h1{color:var(--ink);-webkit-text-fill-color:var(--ink)}.hero h1 em{color:var(--aqua-dark);-webkit-text-fill-color:var(--aqua-dark)}
@media(max-width:800px){.brand{width:auto;height:58px}.brand img{width:62px;height:36px}.brand span{font-size:.95rem}}
.about h2,.team h2,.calendar h2,.gallery h2,.partners h2{color:var(--ink);-webkit-text-fill-color:var(--ink)}.services h2,.contact h2{color:#fff;-webkit-text-fill-color:#fff}.member-copy h3,.event-list h3{color:var(--ink);-webkit-text-fill-color:var(--ink)}.activity h3,.gallery-main h3,.process h3{color:#fff;-webkit-text-fill-color:#fff}
.hero,.about,.team,.services,.calendar,.gallery,.contact{scroll-margin-top:100px}
.public-empty-state{display:flex;align-items:center;justify-content:center;gap:.75rem;min-height:150px;color:var(--muted);background:var(--mist);border-radius:5px}.public-empty-state i{color:var(--aqua-dark);font-size:1.4rem}.public-empty-state p{margin:0}
.menu-button{color:var(--ink)}
</style>

<style scoped>
/* Modern standalone visual layer */
.alpin-page {
  --ink: #102f33;
  --ink-soft: #1d454a;
  --muted: #52696c;
  --line: #d8e4e2;
  --paper: #ffffff;
  --mist: #eef7f6;
  --aqua: #64d0d8;
  --aqua-dark: #147e88;
  width: 100%;
  min-height: 100%;
  color: var(--ink);
  background: var(--paper);
  overflow: clip;
}

.section {
  width: min(1240px, calc(100% - 4rem));
}

.header {
  height: 86px;
  grid-template-columns: 210px 1fr auto;
  padding-inline: max(2rem, calc((100vw - 1440px) / 2));
  background: color-mix(in srgb, #ffffff 92%, transparent);
  border-bottom-color: color-mix(in srgb, var(--ink) 9%, transparent);
}

.header.scrolled {
  box-shadow: 0 12px 40px rgba(16, 47, 51, .08);
}

.brand {
  height: 64px;
  gap: .65rem;
}

.brand img {
  width: 80px;
  height: 42px;
}

.brand span {
  font-size: 1.08rem;
}

.nav {
  gap: clamp(1rem, 2.2vw, 2.4rem);
}

.nav a {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  padding: 0;
  font-size: .82rem;
}

.nav a::after {
  bottom: 4px;
  height: 3px;
  border-radius: 3px;
}

.header-cta {
  min-height: 48px;
  padding: .8rem 1.15rem;
  border-radius: 999px;
  transition: transform 140ms cubic-bezier(.16, 1, .3, 1), background-color 140ms ease;
}

.header-cta:hover {
  background: var(--ink-soft);
  transform: translateY(-1px);
}

.hero {
  position: relative;
  min-height: 100svh;
  display: grid;
  grid-template-columns: minmax(350px, .78fr) minmax(540px, 1.22fr);
  grid-template-rows: 1fr auto;
  gap: clamp(2.5rem, 4vw, 5rem);
  align-items: center;
  padding: 118px max(2rem, calc((100vw - 1440px) / 2)) 2rem;
  background:
    radial-gradient(circle at 18% 20%, rgba(100, 208, 216, .17), transparent 26rem),
    linear-gradient(90deg, #f1f8f7 0 42%, #ffffff 42%);
  isolation: isolate;
}

.hero::before,
.hero::after {
  position: absolute;
  z-index: -1;
  content: '';
  pointer-events: none;
  border-radius: 50%;
}

.hero::before {
  width: 430px;
  height: 430px;
  left: -245px;
  bottom: 80px;
  border: 1px solid rgba(20, 126, 136, .16);
  box-shadow:
    0 0 0 54px rgba(100, 208, 216, .055),
    0 0 0 108px rgba(100, 208, 216, .035);
}

.hero::after {
  width: 10px;
  height: 10px;
  top: 22%;
  left: calc(42% - 5px);
  background: var(--aqua);
  box-shadow: 0 32px 0 rgba(100, 208, 216, .48), 0 64px 0 rgba(100, 208, 216, .24);
}

.hero-copy {
  position: relative;
  width: auto;
  margin: 0;
  padding: 2rem 0 3rem;
  animation: hero-copy-in 560ms cubic-bezier(.16, 1, .3, 1) both;
}

.hero-kicker {
  width: fit-content;
  max-width: 34ch;
  display: inline-flex;
  gap: .55rem;
  align-items: center;
  margin: 0 0 1.5rem;
  padding: .55rem .8rem;
  color: var(--aqua-dark);
  border: 1px solid rgba(20, 126, 136, .2);
  background: rgba(255, 255, 255, .58);
  border-radius: 999px;
  font-size: .88rem;
  font-weight: 600;
  line-height: 1.5;
  backdrop-filter: blur(8px);
}

.hero-kicker::before {
  width: 7px;
  height: 7px;
  content: '';
  background: var(--aqua-dark);
  border-radius: 50%;
}

.hero h1 {
  width: max-content;
  max-width: 100%;
  display: grid;
  color: var(--ink);
  font-size: clamp(3.7rem, 6.2vw, 6.9rem);
  font-weight: 650;
  line-height: .88;
  letter-spacing: -.06em;
}

.hero h1 span,
.hero h1 strong {
  display: block;
}

.hero h1 strong {
  color: var(--aqua-dark);
  font: inherit;
  -webkit-text-fill-color: var(--aqua-dark);
}

.hero-lead {
  max-width: 54ch;
  margin-top: 1.8rem;
  color: var(--muted);
  font-size: clamp(1rem, 1.35vw, 1.18rem);
  line-height: 1.72;
}

.hero-actions {
  gap: .65rem;
  margin-top: 1.8rem;
}

.hero-actions .button--primary {
  min-height: 56px;
  padding-inline: 1.35rem .75rem;
  gap: 1rem;
  box-shadow: 0 12px 28px rgba(16, 47, 51, .15);
}

.hero-actions .button--primary i {
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  color: var(--ink);
  background: var(--aqua);
  border-radius: 50%;
}

.button {
  min-height: 52px;
  padding-inline: 1.25rem;
  border-radius: 999px;
  transition: transform 140ms cubic-bezier(.16, 1, .3, 1), border-color 140ms ease, background-color 140ms ease;
}

.button:hover {
  transform: translateY(-2px);
}

.hero-photo {
  width: 100%;
  height: min(720px, calc(100svh - 150px));
  min-height: 540px;
  margin: 0;
  border: 1px solid rgba(16, 47, 51, .08);
  border-radius: 28px;
  box-shadow: 0 28px 70px rgba(16, 47, 51, .12);
  animation: hero-photo-in 720ms 80ms cubic-bezier(.16, 1, .3, 1) both;
}

.hero-photo img {
  width: 100%;
  height: 100%;
  max-height: none;
  object-fit: cover;
  object-position: 52% center;
}

.hero-photo figcaption {
  right: 1.25rem;
  bottom: 1.25rem;
  padding: .9rem 1.1rem;
  border: 1px solid rgba(255,255,255,.18);
  border-radius: 14px;
  backdrop-filter: blur(12px);
}

.hero-facts {
  grid-column: 1 / -1;
  width: 100%;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  border: 0;
  background: var(--ink);
  border-radius: 18px;
  overflow: hidden;
}

.hero-facts span {
  min-height: 88px;
  justify-content: center;
  padding: 1rem 2rem;
  color: rgba(255,255,255,.72);
  font-size: .8rem;
}

.hero-facts span + span {
  border-left-color: rgba(255,255,255,.14);
}

.hero-facts strong {
  color: var(--aqua);
  font-size: 2rem;
}

.eyebrow {
  margin-bottom: 1.2rem;
  color: var(--aqua-dark);
  font-size: .88rem;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}

.about {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2rem;
  align-items: center;
  padding-block: clamp(7rem, 11vw, 11rem);
}

.about-copy {
  grid-column: 1 / 7;
}

.about-photo {
  grid-column: 8 / 13;
}

.about h2,
.section-heading h2,
.services h2,
.process h2,
.contact h2 {
  font-size: clamp(2.65rem, 4.9vw, 5rem);
  font-weight: 620;
  line-height: 1.02;
  letter-spacing: -.05em;
}

.about .lead {
  max-width: 58ch;
  margin-top: 2rem;
}

.about-photo img {
  aspect-ratio: 4 / 5;
  border-radius: 24px;
}

.about-photo figcaption {
  margin-top: 1rem;
  font-size: .8rem;
}

.team {
  width: 100%;
  padding: clamp(7rem, 10vw, 10rem) max(2rem, calc((100vw - 1240px) / 2));
  background: var(--mist);
}

.section-heading {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2rem;
  align-items: end;
  margin-bottom: 4rem;
}

.section-heading > div {
  grid-column: 1 / 8;
}

.section-heading > p,
.section-heading > .gallery-count {
  grid-column: 9 / 13;
}

.team-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 2.5rem 1.35rem;
}

.member-card,
.member-card:nth-child(1),
.member-card:nth-child(7) {
  grid-column: auto;
  background: transparent;
  border: 0;
  border-radius: 0;
  overflow: visible;
}

.member-card figure {
  border-radius: 20px;
  overflow: hidden;
}

.member-card figure img,
.member-card:nth-child(1) figure img,
.member-card:nth-child(7) figure img {
  width: 100%;
  aspect-ratio: 4 / 5;
  object-fit: cover;
}

.member-card:hover figure img {
  transform: scale(1.018);
}

.member-copy {
  padding: 1.1rem .2rem 0;
}

.member-copy > p {
  margin-bottom: .3rem;
  font-size: .76rem;
  letter-spacing: 0;
  text-transform: none;
}

.member-copy h3 {
  font-size: 1.25rem;
  font-weight: 650;
}

.member-copy details {
  margin-top: .9rem;
  padding-top: .8rem;
}

.member-copy summary {
  min-height: 32px;
  color: var(--muted);
}

.member-copy summary i {
  transition: transform 200ms cubic-bezier(.65, 0, .35, 1);
}

.services-intro {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2rem;
  align-items: end;
  padding-block: clamp(7rem, 10vw, 10rem) 4rem;
}

.services-intro > div {
  grid-column: 1 / 8;
}

.services-intro > p {
  grid-column: 9 / 13;
}

.activity-grid {
  width: min(1440px, calc(100% - 4rem));
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}

.activity {
  min-height: 600px;
  border-radius: 24px;
}

.activity > div {
  min-height: 260px;
  display: grid;
  grid-template-rows: auto minmax(2.25em, auto) minmax(8.2em, auto);
  align-content: end;
  padding: 1.8rem;
}

.activity h3 {
  align-self: end;
  font-size: clamp(1.6rem, 2.3vw, 2.4rem);
}

.activity p {
  align-self: start;
}

.process {
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 2rem;
}

.process-title {
  grid-column: 1 / 6;
}

.process ol,
.process > .button,
.partnership-cta {
  grid-column: 7 / 13;
}

.partnership-cta {
  display: grid;
  gap: 1.5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, .18);
}

.partnership-cta h3 {
  max-width: 34ch;
  margin: 0;
  font-size: clamp(1.25rem, 2vw, 1.8rem);
  line-height: 1.35;
}

.partnership-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
}

.button--outline-light {
  color: #fff;
  border-color: rgba(255, 255, 255, .45);
  background: transparent;
}

.button--outline-light:hover {
  border-color: var(--aqua);
  background: rgba(255, 255, 255, .07);
}

.calendar,
.gallery {
  padding-block: clamp(7rem, 10vw, 10rem);
}

.event-list li {
  grid-template-columns: 130px 1fr 32px;
  min-height: 108px;
  padding-inline: .35rem;
  transition: background-color 180ms ease;
}

.event-list li:hover {
  background: var(--mist);
}

.gallery {
  padding-top: 0;
}

.gallery-main {
  height: 640px;
  min-height: 0;
  border-radius: 24px;
}

.gallery-main > img {
  height: 640px;
  min-height: 0;
  object-fit: cover;
  object-position: center;
}

.gallery-controls {
  right: 1rem;
  bottom: 1rem;
  gap: .35rem;
}

.gallery-controls button {
  border-radius: 50%;
}

.gallery-strip button {
  height: 130px;
  border-radius: 14px;
}

.partners {
  grid-template-columns: repeat(12, minmax(0, 1fr));
}

.partners > div:first-child {
  grid-column: 1 / 4;
}

.partner-grid {
  grid-column: 5 / 13;
}

.contact {
  min-height: 760px;
}

.contact-photo img {
  object-position: center;
}

.contact-meta {
  display: grid;
  grid-template-columns: 1fr;
  gap: .75rem;
  margin-top: 1.5rem;
}

.contact-meta .contact-card {
  min-height: 86px;
  display: grid;
  grid-template-columns: 42px 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem 1.1rem;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .18);
  border-radius: 16px;
  text-decoration: none;
  transition: transform 150ms cubic-bezier(.16, 1, .3, 1), border-color 150ms ease, background-color 150ms ease;
}

.contact-meta .contact-card:hover {
  border-color: rgba(255, 255, 255, .4);
  background: rgba(255, 255, 255, .06);
  transform: translateY(-2px);
}

.contact-card > i:first-child {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  color: var(--ink);
  background: var(--aqua);
  border-radius: 50%;
  font-size: 1.05rem;
}

.contact-card span {
  min-width: 0;
  display: grid;
  gap: .2rem;
}

.contact-card small {
  color: rgba(255, 255, 255, .6);
  font-size: .72rem;
}

.contact-card strong {
  overflow-wrap: anywhere;
  font-size: .9rem;
}

.contact-card--instagram {
  background: linear-gradient(115deg, rgba(100, 208, 216, .14), rgba(255, 255, 255, .03));
  border-color: rgba(100, 208, 216, .45) !important;
}

.footer {
  min-height: 118px;
  padding-inline: max(2rem, calc((100vw - 1440px) / 2));
}

@keyframes hero-copy-in {
  from { opacity: 0; transform: translateY(18px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes hero-photo-in {
  from { opacity: 0; transform: translateX(24px) scale(.985); }
  to { opacity: 1; transform: translateX(0) scale(1); }
}

@media (max-width: 1050px) {
  .header {
    grid-template-columns: 190px 1fr auto;
  }

  .hero {
    grid-template-columns: minmax(320px, .8fr) minmax(430px, 1.2fr);
    gap: 2rem;
  }

  .hero h1 {
    font-size: clamp(3.5rem, 7vw, 5.5rem);
  }

  .team-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 800px) {
  .section {
    width: min(100% - 2.5rem, 1240px);
  }

  .header {
    height: 72px;
    grid-template-columns: 1fr 46px;
    padding-inline: 1rem;
  }

  .brand {
    height: 58px;
  }

  .menu-button {
    border-radius: 50%;
  }

  .hero {
    min-height: auto;
    grid-template-columns: 1fr;
    grid-template-rows: auto;
    gap: 2rem;
    padding: 120px 1.25rem 2rem;
    background: #f4faf9;
  }

  .hero-copy {
    padding: 0;
  }

  .hero h1 {
    max-width: 11ch;
    font-size: clamp(3.2rem, 13vw, 5rem);
  }

  .hero-photo {
    height: auto;
    min-height: 0;
    aspect-ratio: 4 / 3;
    border-radius: 20px;
  }

  .hero-photo img {
    min-height: 0;
  }

  .hero-facts {
    grid-column: 1;
  }

  .about,
  .section-heading,
  .services-intro,
  .process,
  .partners {
    grid-template-columns: 1fr;
  }

  .about-copy,
  .about-photo,
  .section-heading > div,
  .section-heading > p,
  .section-heading > .gallery-count,
  .services-intro > div,
  .services-intro > p,
  .process-title,
  .process ol,
  .process > .button,
  .partnership-cta,
  .partners > div:first-child,
  .partner-grid {
    grid-column: 1;
  }

  .about-photo img {
    aspect-ratio: 4 / 3;
  }

  .team {
    padding-inline: 1.25rem;
  }

  .team-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 2rem 1rem;
  }

  .activity-grid {
    width: calc(100% - 2.5rem);
    grid-template-columns: 1fr;
  }

  .activity {
    min-height: 520px;
  }

  .activity > div {
    min-height: 250px;
  }

  .gallery-main {
    height: auto;
    min-height: 0;
  }

  .gallery-main > img {
    height: clamp(360px, 72vw, 460px);
    min-height: 0;
  }
}

@media (max-width: 520px) {
  .hero-actions {
    flex-direction: column;
  }

  .hero-photo {
    aspect-ratio: 1 / 1;
  }

  .hero-facts {
    border-radius: 14px;
  }

  .team-grid {
    grid-template-columns: 1fr;
  }

  .member-card figure img,
  .member-card:nth-child(1) figure img,
  .member-card:nth-child(7) figure img {
    aspect-ratio: 4 / 4.6;
  }

  .event-list li {
    grid-template-columns: 80px 1fr 22px;
  }

  .activity > div {
    min-height: 280px;
    grid-template-rows: auto auto auto;
  }

  .gallery-main > img {
    height: 340px;
  }

  .contact-photo {
    min-height: 420px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-copy,
  .hero-photo {
    animation: none;
  }
}
</style>
