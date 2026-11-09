<template>
  <form class="site-content-editor" @submit.prevent="emit('save', cloneAlpinPhysioSiteContent(draft))">
    <div class="editor-heading">
      <div>
        <p class="kicker">Contenu public</p>
        <h2>Modifier toute la vitrine</h2>
        <p>Les contenus ci-dessous alimentent directement le site Alp’in Physio.</p>
      </div>
      <RouterLink to="/alpinphysio" target="_blank">Prévisualiser <i class="pi pi-arrow-up-right" /></RouterLink>
    </div>

    <details open>
      <summary><span><i class="pi pi-home" />Accueil et histoire</span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body form-grid">
        <FieldInput v-model="draft.heroEyebrow" label="Surtitre" />
        <FieldInput v-model="draft.heroLead" label="Sous-titre" />
        <FieldInput v-model="draft.heroImage" label="Image principale" wide />
        <FieldInput v-model="draft.heroCaption" label="Légende de l’image" wide />
        <FieldInput v-model="draft.yearsCount" label="Nombre d’années" />
        <FieldInput v-model="draft.eventsCount" label="Nombre d’événements" />
        <FieldInput v-model="draft.aboutEyebrow" label="Surtitre histoire" />
        <FieldInput v-model="draft.aboutTitle" label="Titre histoire" />
        <FieldInput v-model="draft.aboutLead" label="Introduction" type="textarea" wide />
        <FieldInput v-model="draft.aboutBody" label="Texte complémentaire" type="textarea" wide />
        <FieldInput v-model="draft.aboutImage" label="Image de l’histoire" wide />
      </div>
    </details>

    <details>
      <summary><span><i class="pi pi-users" />Comité <small>{{ draft.committee.length }}</small></span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body">
        <div class="form-grid section-intro">
          <FieldInput v-model="draft.teamEyebrow" label="Surtitre" />
          <FieldInput v-model="draft.teamTitle" label="Titre" />
          <FieldInput v-model="draft.teamLead" label="Présentation" type="textarea" wide />
        </div>
        <article v-for="(member, index) in draft.committee" :key="`member-${index}`" class="repeat-card">
          <div class="repeat-card__heading"><strong>{{ member.name || `Membre ${index + 1}` }}</strong><button type="button" aria-label="Retirer cette personne" @click="remove('committee', index)"><i class="pi pi-trash" /></button></div>
          <div class="form-grid">
            <FieldInput v-model="member.name" label="Nom" />
            <FieldInput v-model="member.role" label="Rôle" />
            <FieldInput v-model="member.image" label="Image" wide />
            <FieldInput v-model="member.position" label="Position de l’image" />
            <FieldInput v-model="member.bio" label="Présentation" type="textarea" wide />
          </div>
        </article>
        <button class="add-button" type="button" @click="add('committee', { name: '', role: '', image: '', position: 'center', bio: '' })"><i class="pi pi-plus" />Ajouter une personne</button>
      </div>
    </details>

    <details>
      <summary><span><i class="pi pi-heart" />Prestations et partenariat <small>{{ draft.activities.length }}</small></span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body">
        <div class="form-grid section-intro">
          <FieldInput v-model="draft.servicesEyebrow" label="Surtitre prestations" />
          <FieldInput v-model="draft.servicesTitle" label="Titre prestations" />
          <FieldInput v-model="draft.servicesLead" label="Introduction" type="textarea" wide />
          <FieldInput v-model="draft.partnershipEyebrow" label="Surtitre partenariat" />
          <FieldInput v-model="draft.partnershipTitle" label="Titre partenariat" />
          <FieldInput v-model="draft.partnershipCtaTitle" label="Appel à l’action" type="textarea" wide />
          <FieldInput v-model="draft.contractLabel" label="Libellé du contrat" wide />
        </div>
        <h3>Prestations</h3>
        <article v-for="(activity, index) in draft.activities" :key="`activity-${index}`" class="repeat-card">
          <div class="repeat-card__heading"><strong>{{ activity.title || `Prestation ${index + 1}` }}</strong><button type="button" aria-label="Retirer cette prestation" @click="remove('activities', index)"><i class="pi pi-trash" /></button></div>
          <div class="form-grid">
            <FieldInput v-model="activity.number" label="Numéro" />
            <FieldInput v-model="activity.title" label="Titre" />
            <FieldInput v-model="activity.image" label="Image" wide />
            <FieldInput v-model="activity.description" label="Description" type="textarea" wide />
          </div>
        </article>
        <button class="add-button" type="button" @click="add('activities', { number: String(draft.activities.length + 1).padStart(2, '0'), title: '', description: '', image: '', alt: '' })"><i class="pi pi-plus" />Ajouter une prestation</button>
        <h3>Étapes du partenariat</h3>
        <article v-for="(step, index) in draft.partnershipSteps" :key="`step-${index}`" class="repeat-card compact">
          <div class="repeat-card__heading"><strong>{{ index + 1 }}. {{ step.title || 'Nouvelle étape' }}</strong><button type="button" aria-label="Retirer cette étape" @click="remove('partnershipSteps', index)"><i class="pi pi-trash" /></button></div>
          <div class="form-grid"><FieldInput v-model="step.title" label="Titre" /><FieldInput v-model="step.description" label="Description" type="textarea" wide /></div>
        </article>
        <button class="add-button" type="button" @click="add('partnershipSteps', { title: '', description: '' })"><i class="pi pi-plus" />Ajouter une étape</button>
      </div>
    </details>

    <details>
      <summary><span><i class="pi pi-images" />Galerie <small>{{ draft.galleryPhotos.length }}</small></span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body">
        <div class="form-grid section-intro"><FieldInput v-model="draft.galleryEyebrow" label="Surtitre" /><FieldInput v-model="draft.galleryTitle" label="Titre" wide /></div>
        <article v-for="(photo, index) in draft.galleryPhotos" :key="`photo-${index}`" class="repeat-card">
          <div class="repeat-card__heading"><strong>{{ photo.title || `Photo ${index + 1}` }}</strong><button type="button" aria-label="Retirer cette photo" @click="remove('galleryPhotos', index)"><i class="pi pi-trash" /></button></div>
          <div class="form-grid">
            <FieldInput v-model="photo.title" label="Titre" />
            <FieldInput v-model="photo.image" label="Image" wide />
            <FieldInput v-model="photo.date" label="Date" />
            <FieldInput v-model="photo.location" label="Lieu" />
            <FieldInput v-model="photo.description" label="Description" type="textarea" wide />
          </div>
        </article>
        <button class="add-button" type="button" @click="add('galleryPhotos', { image: '', alt: '', title: '', description: '', date: '', location: '' })"><i class="pi pi-plus" />Ajouter une photo</button>
      </div>
    </details>

    <details>
      <summary><span><i class="pi pi-star" />Sponsors <small>{{ draft.partners.length }}</small></span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body">
        <div class="form-grid section-intro"><FieldInput v-model="draft.partnersEyebrow" label="Surtitre" /><FieldInput v-model="draft.partnersTitle" label="Titre" /></div>
        <article v-for="(partner, index) in draft.partners" :key="`partner-${index}`" class="repeat-card compact">
          <div class="repeat-card__heading"><strong>{{ partner.name || `Sponsor ${index + 1}` }}</strong><button type="button" aria-label="Retirer ce sponsor" @click="remove('partners', index)"><i class="pi pi-trash" /></button></div>
          <div class="form-grid"><FieldInput v-model="partner.name" label="Nom" /><FieldInput v-model="partner.logo" label="Logo" /><FieldInput v-model="partner.url" label="Site web" wide /></div>
        </article>
        <button class="add-button" type="button" @click="add('partners', { name: '', logo: '', url: '' })"><i class="pi pi-plus" />Ajouter un sponsor</button>
      </div>
    </details>

    <details>
      <summary><span><i class="pi pi-envelope" />Contact</span><i class="pi pi-chevron-down" /></summary>
      <div class="section-body form-grid">
        <FieldInput v-model="draft.contactEyebrow" label="Surtitre" />
        <FieldInput v-model="draft.contactTitle" label="Titre" wide />
        <FieldInput v-model="draft.contactLead" label="Introduction" wide />
        <FieldInput v-model="draft.contactImage" label="Image" wide />
        <FieldInput v-model="draft.email" label="Email" />
        <FieldInput v-model="draft.instagram" label="Nom Instagram" />
        <FieldInput v-model="draft.instagramUrl" label="Lien Instagram" wide />
        <FieldInput v-model="draft.address" label="Adresse" />
        <FieldInput v-model="draft.addressUrl" label="Lien cartographique" wide />
      </div>
    </details>

    <div class="sticky-actions"><span>Toutes les rubriques seront enregistrées ensemble.</span><button type="submit" :disabled="saving"><i :class="saving ? 'pi pi-spin pi-spinner' : 'pi pi-check'" />{{ saving ? 'Enregistrement…' : 'Publier les modifications' }}</button></div>
  </form>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { RouterLink } from 'vue-router'
import FieldInput from '@/components/alpinphysio/FieldInput.vue'
import { cloneAlpinPhysioSiteContent } from '@/data/alpinPhysioSiteContent'

const props = defineProps({ content: { type: Object, required: true }, saving: Boolean })
const emit = defineEmits(['save'])
const draft = reactive(cloneAlpinPhysioSiteContent(props.content))

watch(() => props.content, (content) => Object.assign(draft, cloneAlpinPhysioSiteContent(content)), { deep: true })
const add = (key, value) => draft[key].push(value)
const remove = (key, index) => draft[key].splice(index, 1)
</script>

<style scoped>
.site-content-editor{display:flex;flex-direction:column;gap:.9rem;color:#f7f9fc}.editor-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:1.35rem 1.5rem;color:#fff;background:#071426;border:1px solid #294866;border-radius:1rem}.editor-heading h2{margin:0;color:#fff;font-size:1.45rem}.editor-heading p:not(.kicker){margin:.45rem 0 0;color:#aab8c9;font-size:.84rem}.editor-heading>a{min-height:42px;display:inline-flex;align-items:center;gap:.5rem;padding:.65rem .8rem;color:#0b213f;background:#f3c300;border-radius:.6rem;font-size:.8rem;font-weight:800;text-decoration:none}.kicker{margin:0 0 .35rem;color:#f3c300;font-size:.7rem;font-weight:800;letter-spacing:.09em;text-transform:uppercase}details{overflow:hidden;color:#f7f9fc;background:#102c4e;border:1px solid #294866;border-radius:.85rem}summary{min-height:56px;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1rem;color:#f7f9fc;background:#0b213f;font-weight:750;cursor:pointer;list-style:none}summary::-webkit-details-marker{display:none}summary span{display:flex;align-items:center;gap:.65rem}summary span>i{color:#f3c300}summary small{min-width:24px;padding:.2rem .4rem;color:#0b213f;background:#f3c300;border-radius:999px;font-size:.65rem;text-align:center}details[open] summary>i{transform:rotate(180deg)}.section-body{padding:1rem}.section-intro{margin-bottom:1.25rem;padding-bottom:1.25rem;border-bottom:1px solid #294866}.section-body>h3{margin:1.5rem 0 .75rem;color:#fff;font-size:1rem}.form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.85rem}.repeat-card{margin-top:.75rem;padding:1rem;color:#f7f9fc;background:#0b213f;border:1px solid #294866;border-radius:.75rem}.repeat-card__heading{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:.85rem}.repeat-card__heading button{width:38px;height:38px;display:grid;place-items:center;border:1px solid #713a4b;border-radius:.5rem;color:#ff9d9d;background:#321b27;cursor:pointer}.add-button{min-height:42px;display:inline-flex;align-items:center;gap:.5rem;margin-top:.8rem;padding:.65rem .8rem;border:1px solid #f3c300;border-radius:.55rem;color:#f3c300;background:#071426;font:inherit;font-size:.78rem;font-weight:750;cursor:pointer}.sticky-actions{position:sticky;z-index:5;bottom:.75rem;display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 1rem;color:#fff;background:#071426;border:1px solid #294866;border-radius:.8rem;box-shadow:0 12px 35px rgba(2,10,22,.42)}.sticky-actions span{font-size:.75rem;opacity:.72}.sticky-actions button{min-height:44px;display:inline-flex;align-items:center;gap:.5rem;padding:.7rem 1rem;border:0;border-radius:.55rem;color:#0b213f;background:#f3c300;font:inherit;font-size:.82rem;font-weight:800;cursor:pointer}.sticky-actions button:disabled{cursor:wait;opacity:.65}@media(max-width:720px){.editor-heading,.sticky-actions{align-items:stretch;flex-direction:column}.editor-heading>a,.sticky-actions button{justify-content:center}.form-grid{grid-template-columns:1fr}}
</style>
