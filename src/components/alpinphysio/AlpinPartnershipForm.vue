<template>
  <section id="partnership-request" class="request" aria-labelledby="request-title">
    <div class="request__intro">
      <p class="request__eyebrow">Demande de partenariat</p>
      <h2 id="request-title">Parlez-nous de votre événement</h2>
      <p class="request__lead">Quelques informations suffisent : le comité sonde les étudiants disponibles et vous répond par e-mail.</p>
      <ul class="request__points">
        <li><i class="pi pi-users" aria-hidden="true" /><span>Des étudiants en physiothérapie formés au massage sportif</span></li>
        <li><i class="pi pi-box" aria-hidden="true" /><span>Tables, huile et tape apportés si besoin</span></li>
        <li><i class="pi pi-file" aria-hidden="true" /><span>Des conditions claires, décrites dans le contrat de partenariat</span></li>
      </ul>
      <p class="request__direct">Vous préférez écrire directement ? <a :href="`mailto:${email}?subject=Proposition%20de%20collaboration`">{{ email }}</a></p>
    </div>

    <div v-if="sent" class="request__card request__card--done" role="status" tabindex="-1" ref="doneRef">
      <span class="request__check"><i class="pi pi-check" aria-hidden="true" /></span>
      <h3>Demande envoyée, merci !</h3>
      <p>Le comité Alp’in Physio a bien reçu votre demande pour « {{ sentFor }} » et vous répondra à l’adresse indiquée.</p>
      <button type="button" class="request__ghost" @click="reset">Envoyer une autre demande</button>
    </div>

    <form v-else class="request__card" novalidate @submit.prevent="submit">
      <div class="request__grid">
        <div class="request__field request__field--wide">
          <label for="pr-organization">Événement ou organisation <span aria-hidden="true">*</span></label>
          <input id="pr-organization" v-model="form.organization" type="text" required autocomplete="organization" maxlength="160" :aria-invalid="Boolean(errors.organization)" :aria-describedby="errors.organization ? 'pr-organization-error' : undefined" placeholder="Trail des Dents-du-Midi" />
          <p v-if="errors.organization" id="pr-organization-error" class="request__error">{{ errors.organization }}</p>
        </div>
        <div class="request__field">
          <label for="pr-name">Votre nom <span aria-hidden="true">*</span></label>
          <input id="pr-name" v-model="form.contact_name" type="text" required autocomplete="name" maxlength="120" :aria-invalid="Boolean(errors.contact_name)" :aria-describedby="errors.contact_name ? 'pr-name-error' : undefined" />
          <p v-if="errors.contact_name" id="pr-name-error" class="request__error">{{ errors.contact_name }}</p>
        </div>
        <div class="request__field">
          <label for="pr-email">Adresse e-mail <span aria-hidden="true">*</span></label>
          <input id="pr-email" v-model="form.email" type="email" required autocomplete="email" inputmode="email" maxlength="200" :aria-invalid="Boolean(errors.email)" :aria-describedby="errors.email ? 'pr-email-error' : undefined" />
          <p v-if="errors.email" id="pr-email-error" class="request__error">{{ errors.email }}</p>
        </div>
        <div class="request__field">
          <label for="pr-phone">Téléphone <small>facultatif</small></label>
          <input id="pr-phone" v-model="form.phone" type="tel" autocomplete="tel" inputmode="tel" maxlength="40" :aria-invalid="Boolean(errors.phone)" :aria-describedby="errors.phone ? 'pr-phone-error' : undefined" />
          <p v-if="errors.phone" id="pr-phone-error" class="request__error">{{ errors.phone }}</p>
        </div>
        <div class="request__field">
          <label for="pr-date">Date de l’événement <small>facultatif</small></label>
          <input id="pr-date" v-model="form.event_date" type="date" :min="today" :aria-invalid="Boolean(errors.event_date)" :aria-describedby="errors.event_date ? 'pr-date-error' : undefined" />
          <p v-if="errors.event_date" id="pr-date-error" class="request__error">{{ errors.event_date }}</p>
        </div>
        <div class="request__field">
          <label for="pr-location">Lieu <small>facultatif</small></label>
          <input id="pr-location" v-model="form.location" type="text" maxlength="160" autocomplete="off" placeholder="Champéry" :aria-invalid="Boolean(errors.location)" :aria-describedby="errors.location ? 'pr-location-error' : undefined" />
          <p v-if="errors.location" id="pr-location-error" class="request__error">{{ errors.location }}</p>
        </div>
        <div class="request__field">
          <label for="pr-count">Masseurs souhaités <small>facultatif</small></label>
          <input id="pr-count" v-model="form.masseurs_count" type="number" min="1" max="200" inputmode="numeric" placeholder="6" :aria-invalid="Boolean(errors.masseurs_count)" :aria-describedby="errors.masseurs_count ? 'pr-count-error' : undefined" />
          <p v-if="errors.masseurs_count" id="pr-count-error" class="request__error">{{ errors.masseurs_count }}</p>
        </div>
        <div class="request__field request__field--wide">
          <label for="pr-message">Votre message <small>facultatif</small></label>
          <textarea id="pr-message" v-model="form.message" rows="4" maxlength="2000" placeholder="Horaires, nombre de participants, lieu du stand…" :aria-invalid="Boolean(errors.message)" :aria-describedby="errors.message ? 'pr-message-error' : undefined" />
          <p v-if="errors.message" id="pr-message-error" class="request__error">{{ errors.message }}</p>
        </div>
        <!-- Champ piège pour les robots : invisible et ignoré par les lecteurs d'écran. -->
        <div class="request__trap" aria-hidden="true">
          <label for="pr-website">Ne pas remplir</label>
          <input id="pr-website" v-model="form.website" type="text" tabindex="-1" autocomplete="off" />
        </div>
      </div>

      <p v-if="failure" class="request__failure" role="alert"><i class="pi pi-exclamation-circle" aria-hidden="true" />{{ failure }}</p>

      <div class="request__actions">
        <p>Vos coordonnées servent uniquement à répondre à votre demande.</p>
        <button type="submit" class="request__submit" :disabled="sending">
          <i :class="sending ? 'pi pi-spin pi-spinner' : 'pi pi-send'" aria-hidden="true" />{{ sending ? 'Envoi…' : 'Envoyer la demande' }}
        </button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { nextTick, reactive, ref } from 'vue'
import { submitPartnershipRequest } from '@/service/alpinPhysioPartnershipService'
import { emptyPartnershipRequest, validatePartnershipRequest } from '@/utils/alpinPhysioPartnership'

defineProps({ email: { type: String, default: 'alpinphysio@hevs.ch' } })

const form = reactive(emptyPartnershipRequest())
const errors = ref({})
const failure = ref('')
const sending = ref(false)
const sent = ref(false)
const sentFor = ref('')
const doneRef = ref(null)
const now = new Date()
const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

async function submit() {
  failure.value = ''
  errors.value = validatePartnershipRequest(form)
  const firstError = Object.keys(errors.value)[0]
  if (firstError) {
    await nextTick()
    document.querySelector('.request [aria-invalid="true"]')?.focus()
    return
  }
  sending.value = true
  try {
    await submitPartnershipRequest({ ...form, masseurs_count: String(form.masseurs_count ?? '') })
    sentFor.value = form.organization.trim()
    sent.value = true
    await nextTick()
    doneRef.value?.focus()
  } catch (error) {
    failure.value = error?.hint === 'rate_limited' || error?.code === '22023'
      ? error.message
      : 'L’envoi n’a pas abouti. Réessayez dans un instant ou écrivez-nous directement par e-mail.'
  } finally {
    sending.value = false
  }
}

function reset() {
  Object.assign(form, emptyPartnershipRequest())
  errors.value = {}
  sent.value = false
}
</script>

<style scoped>
.request {
  --r-ink: var(--ink, #102f33);
  --r-aqua: var(--aqua, #64d0d8);
  --r-aqua-dark: var(--aqua-dark, #147e88);
  display: grid;
  grid-template-columns: minmax(0, .85fr) minmax(0, 1.15fr);
  gap: clamp(2rem, 5vw, 5rem);
  align-items: start;
  width: min(1240px, calc(100% - 4rem));
  margin: 0 auto;
  padding: clamp(3rem, 7vw, 6rem) 0;
  border-top: 1px solid rgba(255, 255, 255, .18);
  color: #fff;
  scroll-margin-top: 100px;
}

.request__eyebrow {
  margin: 0 0 1rem;
  color: var(--r-aqua);
  font-size: .78rem;
  font-weight: 600;
}

.request h2 {
  max-width: 14ch;
  margin: 0;
  color: #fff;
  -webkit-text-fill-color: #fff;
  font-size: clamp(2.2rem, 4.4vw, 3.6rem);
  line-height: 1.02;
  letter-spacing: -.045em;
  text-wrap: balance;
}

.request__lead {
  max-width: 44ch;
  margin: 1.5rem 0 0;
  color: rgba(255, 255, 255, .78);
  line-height: 1.7;
}

.request__points {
  display: grid;
  gap: .9rem;
  margin: 2rem 0 0;
  padding: 0;
  list-style: none;
}

.request__points li {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: .85rem;
  align-items: center;
  color: rgba(255, 255, 255, .9);
  font-size: .92rem;
  line-height: 1.45;
}

.request__points i {
  width: 40px;
  height: 40px;
  display: grid;
  place-items: center;
  color: var(--r-ink);
  background: var(--r-aqua);
  border-radius: 50%;
  font-size: .95rem;
}

.request__direct {
  margin: 2rem 0 0;
  color: rgba(255, 255, 255, .7);
  font-size: .88rem;
}

.request__direct a {
  color: var(--r-aqua);
  font-weight: 600;
  text-underline-offset: 3px;
}

.request__card {
  padding: clamp(1.25rem, 3vw, 2.25rem);
  color: var(--r-ink);
  background: #fff;
  border-radius: 28px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, .28);
}

.request__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem 1rem;
}

.request__field {
  display: flex;
  flex-direction: column;
  gap: .4rem;
  min-width: 0;
}

.request__field--wide {
  grid-column: 1 / -1;
}

.request__field label {
  display: flex;
  align-items: baseline;
  gap: .4rem;
  font-size: .8rem;
  font-weight: 600;
}

.request__field label span {
  color: var(--r-aqua-dark);
}

.request__field label small {
  color: #52696c;
  font-size: .72rem;
  font-weight: 400;
}

.request__field input,
.request__field textarea {
  width: 100%;
  min-height: 50px;
  padding: .75rem .9rem;
  color: var(--r-ink);
  background: #f4f9f8;
  border: 1px solid #c9dbd8;
  border-radius: 12px;
  font: inherit;
  font-size: 16px;
  transition: border-color 140ms ease, box-shadow 140ms ease, background-color 140ms ease;
}

.request__field textarea {
  min-height: 120px;
  line-height: 1.55;
  resize: vertical;
}

.request__field input::placeholder,
.request__field textarea::placeholder {
  color: #7d9194;
}

.request__field input:hover,
.request__field textarea:hover {
  border-color: #9fbfbb;
}

.request__field input:focus-visible,
.request__field textarea:focus-visible {
  outline: none;
  background: #fff;
  border-color: var(--r-aqua-dark);
  box-shadow: 0 0 0 4px rgba(100, 208, 216, .35);
}

.request__field [aria-invalid="true"] {
  border-color: #b3261e;
  background: #fff8f7;
}

.request__error {
  margin: 0;
  color: #a1211a;
  font-size: .78rem;
  line-height: 1.4;
}

.request__trap {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.request__failure {
  display: flex;
  align-items: flex-start;
  gap: .6rem;
  margin: 1.25rem 0 0;
  padding: .85rem 1rem;
  color: #7c1d17;
  background: #fdeceb;
  border-radius: 12px;
  font-size: .86rem;
  line-height: 1.5;
}

.request__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem 1.5rem;
  margin-top: 1.5rem;
}

.request__actions p {
  max-width: 30ch;
  margin: 0;
  color: #52696c;
  font-size: .76rem;
  line-height: 1.5;
}

.request__submit,
.request__ghost {
  min-height: 52px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: .6rem;
  padding: .8rem 1.5rem;
  border-radius: 999px;
  font: inherit;
  font-size: .9rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 140ms cubic-bezier(.16, 1, .3, 1), background-color 140ms ease;
}

.request__submit {
  flex: 0 0 auto;
  color: #fff;
  background: var(--r-ink);
  border: 1px solid var(--r-ink);
}

.request__submit:hover:not(:disabled) {
  background: #1d454a;
  transform: translateY(-2px);
}

.request__submit:disabled {
  cursor: progress;
  opacity: .7;
}

.request__submit:focus-visible,
.request__ghost:focus-visible {
  outline: 3px solid var(--r-aqua-dark);
  outline-offset: 3px;
}

.request__card--done {
  display: grid;
  justify-items: start;
  gap: .9rem;
}

.request__card--done:focus-visible {
  outline: 3px solid var(--r-aqua);
  outline-offset: 4px;
}

.request__check {
  width: 56px;
  height: 56px;
  display: grid;
  place-items: center;
  color: var(--r-ink);
  background: var(--r-aqua);
  border-radius: 50%;
  font-size: 1.3rem;
}

.request__card--done h3 {
  margin: .5rem 0 0;
  color: var(--r-ink);
  -webkit-text-fill-color: var(--r-ink);
  font-size: clamp(1.5rem, 3vw, 2rem);
  letter-spacing: -.03em;
}

.request__card--done p {
  max-width: 46ch;
  margin: 0;
  color: #3d5a5e;
  line-height: 1.65;
}

.request__ghost {
  margin-top: .5rem;
  color: var(--r-ink);
  background: transparent;
  border: 1px solid #b9cfcc;
}

.request__ghost:hover {
  background: #f1f8f7;
}

@media (max-width: 960px) {
  .request {
    grid-template-columns: 1fr;
  }

  .request h2 {
    max-width: none;
  }
}

@media (max-width: 800px) {
  .request {
    width: min(100% - 2.5rem, 1240px);
  }
}

@media (max-width: 560px) {
  .request__grid {
    grid-template-columns: 1fr;
  }

  .request__card {
    border-radius: 20px;
  }

  .request__actions {
    align-items: stretch;
    flex-direction: column-reverse;
  }

  .request__actions p {
    max-width: none;
  }

  .request__submit {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .request__submit,
  .request__field input,
  .request__field textarea {
    transition: none;
  }

  .request__submit:hover:not(:disabled) {
    transform: none;
  }
}
</style>
